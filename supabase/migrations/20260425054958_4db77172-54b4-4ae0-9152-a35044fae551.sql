
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Children
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  grade TEXT,
  avatar_color TEXT DEFAULT '#7C3AED',
  device_name TEXT DEFAULT 'Chrome Browser',
  daily_limit_minutes INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages own children" ON public.children FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- Sessions (browsing)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  title TEXT,
  category TEXT,
  status TEXT NOT NULL CHECK (status IN ('safe','warning','blocked')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent reads child sessions" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = sessions.child_id AND c.parent_id = auth.uid())
);
CREATE POLICY "Parent writes child sessions" ON public.sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = sessions.child_id AND c.parent_id = auth.uid())
);

-- Blocked sites
CREATE TABLE public.blocked_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  reason TEXT,
  category TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  is_whitelist BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages blocked sites" ON public.blocked_sites FOR ALL USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = blocked_sites.child_id AND c.parent_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = blocked_sites.child_id AND c.parent_id = auth.uid())
);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT NOT NULL,
  site TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('high','medium','low')),
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages alerts" ON public.alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = alerts.child_id AND c.parent_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = alerts.child_id AND c.parent_id = auth.uid())
);

-- Screen time
CREATE TABLE public.screen_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  limit_minutes INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, date)
);
ALTER TABLE public.screen_time ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages screen time" ON public.screen_time FOR ALL USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = screen_time.child_id AND c.parent_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = screen_time.child_id AND c.parent_id = auth.uid())
);

-- Focus schedules
CREATE TABLE public.focus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT,
  days_of_week INTEGER[],
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.focus_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages focus schedules" ON public.focus_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = focus_schedules.child_id AND c.parent_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = focus_schedules.child_id AND c.parent_id = auth.uid())
);

-- Auto-create profile + a default child on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_child_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  INSERT INTO public.children (parent_id, name, age, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'child_name', 'My Child'),
    COALESCE((NEW.raw_user_meta_data->>'child_age')::int, 10),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#7C3AED')
  ) RETURNING id INTO new_child_id;

  -- Seed today's screen_time row
  INSERT INTO public.screen_time (child_id, date, total_minutes, limit_minutes)
  VALUES (new_child_id, CURRENT_DATE, 142, 240);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
