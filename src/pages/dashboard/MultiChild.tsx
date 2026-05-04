import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useActiveChild, Child } from "@/hooks/useActiveChild";
import { useView } from "@/context/ViewContext";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#7C3AED", "#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

interface ChildCardData extends Child {
  todayMin?: number;
  safetyScore?: number;
}

export default function MultiChild() {
  const { user } = useAuth();
  const { children, child: activeChild, loading, selectChild, refresh } = useActiveChild();
  const { setView } = useView();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [limit, setLimit] = useState<number>(240);
  const [color, setColor] = useState(COLORS[0]);

  const reset = () => { setName(""); setAge(""); setLimit(240); setColor(COLORS[0]); };

  const handleAdd = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { data, error } = await supabase
      .from("children")
      .insert({
        parent_id: user.id,
        name: name.trim(),
        age: age === "" ? null : Number(age),
        daily_limit_minutes: Number(limit) || 240,
        avatar_color: color,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${data.name} added!`);
    setOpen(false); reset(); await refresh();
  };

  const openChildDashboard = (c: Child) => {
    selectChild(c.id);
    toast.success(`Viewing ${c.name}'s dashboard`);
    nav("/dashboard");
  };

  const openChildView = (c: Child) => {
    selectChild(c.id);
    setView("child");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {children.length} child{children.length === 1 ? "" : "ren"} · Click a card to view their dashboard
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl gradient-brand text-white">
              <Plus className="w-4 h-4 mr-1" /> Add child
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add a new child</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aarav" className="rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cage">Age</Label>
                  <Input id="cage" type="number" min={3} max={18} value={age}
                    onChange={e => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="10" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label htmlFor="climit">Daily limit (min)</Label>
                  <Input id="climit" type="number" min={30} max={720} value={limit}
                    onChange={e => setLimit(Number(e.target.value))}
                    className="rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <Label>Avatar color</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: c, borderColor: c === color ? "hsl(var(--foreground))" : "transparent" }}>
                      {c === color && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving} className="rounded-xl gradient-brand text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add child
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <p className="text-4xl mb-2">👨‍👩‍👧</p>
          <p className="font-semibold">No children yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add child" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((c, i) => {
            const isActive = c.id === activeChild?.id;
            const accent = c.avatar_color || COLORS[i % COLORS.length];
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className={`bg-card border rounded-2xl p-5 shadow-soft transition-colors ${
                  isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-soft"
                    style={{ background: `linear-gradient(135deg, ${accent}, hsl(var(--accent)))` }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.age ? `Age ${c.age}` : "Age —"}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-muted/40 p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground">Daily limit</p>
                    <p className="font-bold">{Math.floor(c.daily_limit_minutes / 60)}h {c.daily_limit_minutes % 60}m</p>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className="font-bold text-success flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success" /> Online
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button onClick={() => openChildDashboard(c)} className="w-full rounded-xl gradient-brand text-white">
                    View parent dashboard <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button onClick={() => openChildView(c)} variant="outline" className="w-full rounded-xl">
                    Open child view 👧
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
