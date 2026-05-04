import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldOff, AlertTriangle, Zap, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useChildLive } from "@/hooks/useChildLive";
import { supabase } from "@/integrations/supabase/client";

const FILTERS = ["All", "High", "Medium", "Low"] as const;

const iconFor = (type: string | null) => {
  if (type === "blocked_attempt") return ShieldOff;
  if (type?.includes("limit")) return AlertTriangle;
  if (type === "info") return Info;
  return Zap;
};

export default function Alerts() {
  const { child } = useActiveChild();
  const { alerts, loading } = useChildLive(child?.id ?? null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");

  const visible = alerts.filter(a => !a.is_dismissed);
  const filtered = visible.filter(a => filter === "All" || a.severity === filter.toLowerCase());

  const counts = {
    high: visible.filter(a => a.severity === "high").length,
    medium: visible.filter(a => a.severity === "medium").length,
    low: visible.filter(a => a.severity === "low").length,
  };

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("alerts").update({ is_dismissed: true }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const clearAll = async () => {
    if (!child) return;
    const { error } = await supabase.from("alerts").update({ is_dismissed: true }).eq("child_id", child.id).eq("is_dismissed", false);
    if (error) toast.error(error.message); else toast.success("Cleared");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High", value: counts.high, color: "danger" },
          { label: "Medium", value: counts.medium, color: "warning" },
          { label: "Low", value: counts.low, color: "secondary" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`p-5 rounded-2xl border-2 border-${s.color}/30 bg-${s.color}/5 shadow-soft`}>
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label} severity</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-muted rounded-2xl p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filter === f ? "bg-card shadow-soft text-primary" : "text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
        <Button variant="outline" className="rounded-2xl" onClick={clearAll}>Clear all</Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map(a => {
            const Icon = iconFor(a.type);
            const borderColor = a.severity === "high" ? "border-l-danger" : a.severity === "medium" ? "border-l-warning" : "border-l-secondary";
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                className={`bg-card border border-border border-l-4 ${borderColor} rounded-2xl p-4 shadow-soft flex items-start gap-3`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  a.severity === "high" ? "bg-danger/15 text-danger" : a.severity === "medium" ? "bg-warning/15 text-warning" : "bg-secondary/15 text-secondary"
                }`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.site ?? "System"} · {new Date(a.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <button onClick={() => dismiss(a.id)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground">Dismiss</button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No alerts ✨</p>}
      </div>
    </div>
  );
}
