-- 1. device_tokens table
CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parent manages device tokens"
ON public.device_tokens FOR ALL
USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = device_tokens.child_id AND c.parent_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = device_tokens.child_id AND c.parent_id = auth.uid()));

CREATE INDEX idx_device_tokens_token ON public.device_tokens(token) WHERE is_active = true;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_child_visited ON public.sessions(child_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_child_created ON public.alerts(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_sites_child ON public.blocked_sites(child_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_child_date ON public.screen_time(child_id, date);

-- 3. Aggregator trigger: on session insert -> update screen_time + maybe alert
CREATE OR REPLACE FUNCTION public.handle_session_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_minutes INT;
  v_limit INT;
  v_total INT;
  v_today DATE := (NEW.visited_at AT TIME ZONE 'UTC')::DATE;
BEGIN
  v_minutes := GREATEST(1, ROUND(NEW.duration_seconds / 60.0));

  SELECT daily_limit_minutes INTO v_limit FROM public.children WHERE id = NEW.child_id;
  IF v_limit IS NULL THEN v_limit := 240; END IF;

  INSERT INTO public.screen_time (child_id, date, total_minutes, limit_minutes)
  VALUES (NEW.child_id, v_today, v_minutes, v_limit)
  ON CONFLICT (child_id, date) DO UPDATE
    SET total_minutes = public.screen_time.total_minutes + EXCLUDED.total_minutes,
        limit_minutes = v_limit
  RETURNING total_minutes INTO v_total;

  -- Alert if blocked attempt
  IF NEW.status = 'blocked' THEN
    INSERT INTO public.alerts (child_id, severity, type, site, message)
    VALUES (NEW.child_id, 'high', 'blocked_attempt', NEW.domain,
            'Blocked attempt to visit ' || NEW.domain);
  END IF;

  -- Limit alerts
  IF v_total >= v_limit THEN
    INSERT INTO public.alerts (child_id, severity, type, site, message)
    VALUES (NEW.child_id, 'high', 'limit_exceeded', NULL,
            'Daily screen-time limit reached (' || v_total || ' / ' || v_limit || ' min)');
  ELSIF v_total >= (v_limit - 30) AND v_total < v_limit THEN
    INSERT INTO public.alerts (child_id, severity, type, site, message)
    VALUES (NEW.child_id, 'medium', 'limit_warning', NULL,
            'Approaching daily limit (' || v_total || ' / ' || v_limit || ' min)');
  END IF;

  RETURN NEW;
END;
$$;

-- Need unique constraint for ON CONFLICT
ALTER TABLE public.screen_time ADD CONSTRAINT screen_time_child_date_unique UNIQUE (child_id, date);

CREATE TRIGGER trg_session_insert
AFTER INSERT ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_session_insert();

-- 4. Helper: resolve token -> child_id (used by edge functions)
CREATE OR REPLACE FUNCTION public.resolve_device_token(_token TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT child_id FROM public.device_tokens
  WHERE token = _token AND is_active = true
  LIMIT 1;
$$;

-- 5. Realtime
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER TABLE public.screen_time REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_sites REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_time;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_sites;