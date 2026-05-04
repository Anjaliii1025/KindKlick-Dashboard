import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Child {
  id: string;
  name: string;
  age: number | null;
  daily_limit_minutes: number;
  avatar_color: string | null;
}

const ACTIVE_KEY = "kk_active_child_id";

/** Returns the parent's currently selected child (defaults to first). */
export function useActiveChild() {
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setChild(null); setChildren([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("children")
      .select("id,name,age,daily_limit_minutes,avatar_color")
      .eq("parent_id", user.id)
      .order("created_at");
    const list = (data ?? []) as Child[];
    setChildren(list);
    const stored = localStorage.getItem(ACTIVE_KEY);
    const active = list.find(c => c.id === stored) ?? list[0] ?? null;
    setChild(active);
    if (active) localStorage.setItem(ACTIVE_KEY, active.id);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const selectChild = useCallback((id: string) => {
    const next = children.find(c => c.id === id);
    if (next) {
      localStorage.setItem(ACTIVE_KEY, id);
      setChild(next);
      // Notify other tabs/components
      window.dispatchEvent(new Event("kk-active-child-changed"));
    }
  }, [children]);

  // Listen for cross-component updates
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(ACTIVE_KEY);
      const next = children.find(c => c.id === stored);
      if (next) setChild(next);
    };
    window.addEventListener("kk-active-child-changed", handler);
    return () => window.removeEventListener("kk-active-child-changed", handler);
  }, [children]);

  return { child, children, loading, selectChild, refresh: fetchAll };
}
