import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Session {
  id: string;
  domain: string;
  title: string | null;
  category: string | null;
  status: string;
  duration_seconds: number;
  visited_at: string;
}

interface Alert {
  id: string;
  child_id: string;
  severity: string;
  type: string | null;
  site: string | null;
  message: string;
  is_dismissed: boolean;
  created_at: string;
}

interface ScreenTime {
  total_minutes: number;
  limit_minutes: number;
  date: string;
}

interface BlockedSite {
  id: string;
  domain: string;
  category: string | null;
  reason: string | null;
  attempt_count: number;
  is_whitelist: boolean;
  created_at: string;
}

/** Realtime feed of sessions/alerts/screen_time/blocked_sites for one child. */
export function useChildLive(childId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [today, setToday] = useState<ScreenTime | null>(null);
  const [weekly, setWeekly] = useState<ScreenTime[]>([]);
  const [blocked, setBlocked] = useState<BlockedSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    let cancelled = false;

    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10);

    (async () => {
      setLoading(true);
      const [s, a, st, w, b] = await Promise.all([
        supabase.from("sessions").select("*").eq("child_id", childId).order("visited_at", { ascending: false }).limit(200),
        supabase.from("alerts").select("*").eq("child_id", childId).order("created_at", { ascending: false }).limit(100),
        supabase.from("screen_time").select("date,total_minutes,limit_minutes").eq("child_id", childId).eq("date", todayStr).maybeSingle(),
        supabase.from("screen_time").select("date,total_minutes,limit_minutes").eq("child_id", childId).gte("date", weekAgo).order("date"),
        supabase.from("blocked_sites").select("*").eq("child_id", childId).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setSessions((s.data ?? []) as Session[]);
      setAlerts((a.data ?? []) as Alert[]);
      setToday(st.data as ScreenTime | null);
      setWeekly((w.data ?? []) as ScreenTime[]);
      setBlocked((b.data ?? []) as BlockedSite[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`child-${childId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `child_id=eq.${childId}` }, (payload) => {
        if (payload.eventType === "INSERT") setSessions(prev => [payload.new as Session, ...prev].slice(0, 200));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts", filter: `child_id=eq.${childId}` }, (payload) => {
        if (payload.eventType === "INSERT") setAlerts(prev => [payload.new as Alert, ...prev].slice(0, 100));
        if (payload.eventType === "UPDATE") setAlerts(prev => prev.map(x => x.id === (payload.new as Alert).id ? payload.new as Alert : x));
        if (payload.eventType === "DELETE") setAlerts(prev => prev.filter(x => x.id !== (payload.old as Alert).id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "screen_time", filter: `child_id=eq.${childId}` }, (payload) => {
        const row = payload.new as ScreenTime | undefined;
        if (!row) return;
        if (row.date === todayStr) setToday(row);
        setWeekly(prev => {
          const idx = prev.findIndex(p => p.date === row.date);
          if (idx >= 0) { const cp = [...prev]; cp[idx] = row; return cp; }
          return [...prev, row].sort((a, b) => a.date.localeCompare(b.date));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "blocked_sites", filter: `child_id=eq.${childId}` }, (payload) => {
        if (payload.eventType === "INSERT") setBlocked(prev => [payload.new as BlockedSite, ...prev]);
        if (payload.eventType === "DELETE") setBlocked(prev => prev.filter(x => x.id !== (payload.old as BlockedSite).id));
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [childId]);

  return { sessions, alerts, today, weekly, blocked, loading };
}
