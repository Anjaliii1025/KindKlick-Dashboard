import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, ShieldOff, AlertTriangle, Skull, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useChildLive } from "@/hooks/useChildLive";
import { supabase } from "@/integrations/supabase/client";

export default function Blocked() {
  const { child } = useActiveChild();
  const { blocked, loading } = useChildLive(child?.id ?? null);
  const [domain, setDomain] = useState("");

  const blockedOnly = blocked.filter(b => !b.is_whitelist);

  const summary = useMemo(() => {
    const txt = (b: typeof blockedOnly[number]) => `${b.category ?? ""} ${b.reason ?? ""}`;
    const adult = blockedOnly.filter(b => /adult|porn/i.test(txt(b))).length;
    const scam = blockedOnly.filter(b => /scam|phish/i.test(txt(b))).length;
    const violence = blockedOnly.filter(b => /violen|gore/i.test(txt(b))).length;
    return [
      { icon: Skull, label: "Adult content", value: adult, color: "danger" },
      { icon: AlertTriangle, label: "Scam sites", value: scam, color: "warning" },
      { icon: ShieldOff, label: "Violence", value: violence, color: "primary" },
    ];
  }, [blockedOnly]);

  const addBlock = async () => {
    if (!child || !domain.trim()) return;
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const { error } = await supabase.from("blocked_sites").insert({
      child_id: child.id, domain: clean, reason: "Blocked by parent", category: "manual",
    });
    if (error) toast.error(error.message);
    else { toast.success(`${clean} blocked`); setDomain(""); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("blocked_sites").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Removed");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl border-2 border-${s.color}/30 bg-${s.color}/5 shadow-soft`}>
            <s.icon className={`w-7 h-7 text-${s.color} mb-2`} />
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label} blocked</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border font-bold">Blocked site list ({blockedOnly.length})</div>
        <table className="w-full">
          <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {blockedOnly.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold text-sm">{b.domain}</td>
                <td className="px-4 py-3 text-sm">{b.reason ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{b.attempt_count}</td>
                <td className="px-4 py-3 text-sm">{new Date(b.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(b.id)} className="text-xs text-danger hover:underline font-semibold inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </td>
              </tr>
            ))}
            {blockedOnly.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No blocked sites yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Add custom block</h3>
        <div className="flex flex-wrap gap-2">
          <Input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && addBlock()}
            placeholder="example.com" className="rounded-2xl flex-1 min-w-[200px] h-11" />
          <Button onClick={addBlock} disabled={!domain.trim()}
            className="rounded-2xl gradient-brand text-white h-11"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>
    </div>
  );
}
