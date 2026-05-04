import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ShieldOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useChildLive } from "@/hooks/useChildLive";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

const FILTERS = ["All", "Safe", "Warning", "Blocked"] as const;

export default function History() {
  const { child } = useActiveChild();
  const { sessions, loading } = useChildLive(child?.id ?? null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [q, setQ] = useState("");

  const rows = sessions.filter(r => {
    const matchesFilter = filter === "All" || r.status === filter.toLowerCase();
    const matchesQ = r.domain.toLowerCase().includes(q.toLowerCase());
    return matchesFilter && matchesQ;
  });

  const exportCsv = () => {
    const head = "Domain,Title,Category,Status,Visited At,Duration (sec)\n";
    const body = rows.map(r => `${r.domain},"${(r.title ?? "").replace(/"/g, '""')}",${r.category ?? ""},${r.status},${r.visited_at},${r.duration_seconds}`).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "browsing-history.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const blockSite = async (domain: string) => {
    if (!child) return;
    const { error } = await supabase.from("blocked_sites").insert({
      child_id: child.id, domain, reason: "Blocked by parent", category: "manual",
    });
    if (error) toast.error(error.message);
    else toast.success(`${domain} added to block list`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by domain..." className="pl-10 rounded-2xl h-10" />
        </div>
        <div className="flex gap-1 bg-muted rounded-2xl p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filter === f ? "bg-card shadow-soft text-primary" : "text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <Button onClick={exportCsv} variant="outline" className="rounded-2xl"><Download className="w-4 h-4 mr-2" /> CSV</Button>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <table className="w-full">
          <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <motion.tr key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="border-t border-border hover:bg-primary/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-primary">{r.domain[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{r.domain}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]">{r.title ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-muted font-semibold">{r.category ?? "—"}</span></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    r.status === "safe" ? "bg-success/15 text-success" :
                    r.status === "warning" ? "bg-warning/15 text-warning" :
                    "bg-danger/15 text-danger"
                  }`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">{new Date(r.visited_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-4 py-3 text-sm">{Math.round(r.duration_seconds / 60)}m</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => blockSite(r.domain)}
                    className="text-xs text-danger hover:underline font-semibold inline-flex items-center gap-1">
                    <ShieldOff className="w-3 h-3" /> Block
                  </button>
                </td>
              </motion.tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No matching results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
