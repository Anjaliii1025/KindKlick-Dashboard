import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useActiveChild } from "@/hooks/useActiveChild";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Copy, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";

interface Token { id: string; token: string; label: string | null; last_used_at: string | null; is_active: boolean; created_at: string; }

const COLORS = ["#7C3AED", "#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

function genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "kk_" + Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// ── Inline copy button with tick feedback ──────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Token copied!");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };
  return (
    <button onClick={copy} title="Copy"
      className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
      {done
        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
        : <Copy className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const { child } = useActiveChild();
  const [pin, setPin] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loadingTok, setLoadingTok] = useState(true);
  const [creating, setCreating] = useState(false);
  const [limit, setLimit] = useState<number>(240);

  useEffect(() => { if (child) setLimit(child.daily_limit_minutes); }, [child]);

  useEffect(() => {
    if (!child) return;
    (async () => {
      setLoadingTok(true);
      const { data } = await supabase.from("device_tokens").select("*").eq("child_id", child.id).order("created_at", { ascending: false });
      setTokens((data ?? []) as Token[]);
      setLoadingTok(false);
    })();
  }, [child]);

  const createToken = async () => {
    if (!child) return;
    setCreating(true);
    const token = genToken();
    const { data, error } = await supabase.from("device_tokens")
      .insert({ child_id: child.id, token, label: "Chrome Extension" })
      .select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setTokens(t => [data as Token, ...t]);
    toast.success("Token ready! Copy karo aur extension mein paste karo.");
  };

  const revokeToken = async (id: string) => {
    if (!confirm("Is token ko revoke karna chahte ho?")) return;
    const { error } = await supabase.from("device_tokens").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else { setTokens(ts => ts.map(t => t.id === id ? { ...t, is_active: false } : t)); toast.success("Token revoked"); }
  };

  const saveLimit = async () => {
    if (!child) return;
    const { error } = await supabase.from("children").update({ daily_limit_minutes: limit }).eq("id", child.id);
    if (error) toast.error(error.message); else toast.success("Daily limit saved");
  };

  const activeTokens = tokens.filter(t => t.is_active);
  const revokedTokens = tokens.filter(t => !t.is_active);

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Extension Setup Banner (shown if no active tokens) ── */}
      {!loadingTok && activeTokens.length === 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Extension abhi connect nahi hai</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
              Dashboard mein real data tab aayega jab extension {child?.name ?? "bachche"} ke Chrome se pair hoga.
            </p>
          </div>
          <Link to="/onboarding">
            <Button size="sm" className="rounded-xl gradient-brand text-white whitespace-nowrap">
              Setup Guide Dekho →
            </Button>
          </Link>
        </motion.div>
      )}

      {/* ── Device Tokens ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold">🔗 Device pairing tokens</h3>
          <Button onClick={createToken} disabled={creating} size="sm" className="rounded-xl gradient-brand text-white">
            {creating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Generate token
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Yeh token extension mein paste karo taaki {child?.name ?? "bachche"} ka browser dashboard se connect ho.{" "}
          <Link to="/onboarding" className="text-primary underline">Step-by-step guide →</Link>
        </p>

        {loadingTok ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : activeTokens.length === 0 && revokedTokens.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm space-y-3">
            <p>Koi token nahi hai abhi.</p>
            <Button onClick={createToken} disabled={creating} className="rounded-xl gradient-brand text-white">
              Pehla token banao
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active tokens */}
            {activeTokens.map(t => (
              <div key={t.id} className="p-3 rounded-xl border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                  <code className="text-xs font-mono truncate flex-1 text-green-700 dark:text-green-400">{t.token}</code>
                  <CopyBtn text={t.token} />
                  <button onClick={() => revokeToken(t.id)} className="text-xs text-destructive hover:underline font-medium shrink-0">
                    Revoke
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 pl-4">
                  Active · Last used: {t.last_used_at ? new Date(t.last_used_at).toLocaleString("en-IN") : "never"}
                </p>
              </div>
            ))}
            {/* Revoked tokens (collapsed) */}
            {revokedTokens.length > 0 && (
              <p className="text-xs text-muted-foreground pt-1">{revokedTokens.length} revoked token(s) hidden.</p>
            )}
          </div>
        )}

        {/* How to use section */}
        {activeTokens.length > 0 && (
          <div className="mt-4 bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Extension mein paste kaise karein:</p>
            <p>1. Chrome mein KindKlick icon pe right-click → <strong>Options</strong></p>
            <p>2. "Cloud sync" section mein token paste karo</p>
            <p>3. <strong>Pair</strong> dabao — "Connected" dikhega</p>
          </div>
        )}
      </motion.section>

      {/* ── Extension Download ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-1">🧩 KindKlick Chrome Extension</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {child?.name ?? "Bachche"} ke computer mein install karo real-time monitoring ke liye.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-xl gradient-brand text-white"
            onClick={() => {
              fetch("/kindklick-extension.zip")
                .then(r => { if (!r.ok) throw new Error(`Download failed: ${r.status}`); return r.blob(); })
                .then(blob => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "kindklick-extension.zip";
                  a.click();
                  URL.revokeObjectURL(a.href);
                  toast.success("Extension downloaded!");
                })
                .catch(e => toast.error(e.message));
            }}>
            ⬇ Download (.zip)
          </Button>
          <Link to="/onboarding">
            <Button size="sm" variant="outline" className="rounded-xl">
              Setup Guide
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* ── Screen time limit ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">⏱ Daily screen-time limit ({child?.name ?? "—"})</h3>
        <div className="flex items-center gap-3">
          <Input type="number" min={30} max={1440} step={15} value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="rounded-2xl max-w-[140px]" />
          <span className="text-sm text-muted-foreground">minutes / day</span>
          <Button onClick={saveLimit} className="rounded-2xl gradient-brand text-white ml-auto">Save</Button>
        </div>
      </motion.section>

      {/* ── Profile ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">👤 Parent profile</h3>
        <div><Label>Email</Label><Input value={user?.email ?? ""} disabled className="rounded-2xl mt-1" /></div>
      </motion.section>

      {/* ── Security ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">🔒 Security</h3>
        <div className="space-y-3">
          <div>
            <Label>Dashboard PIN (4 digits)</Label>
            <Input maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••"
              className="rounded-2xl mt-1 max-w-[120px] tracking-widest text-center font-bold" />
          </div>
          <Button onClick={() => toast.success("PIN saved")} className="rounded-2xl gradient-brand text-white">Save PIN</Button>
        </div>
      </motion.section>

      {/* ── Appearance ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">🎨 Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark mode</span><Switch checked={dark} onCheckedChange={toggle} />
          </div>
          <div>
            <Label className="block mb-2">Accent color</Label>
            <div className="flex gap-2">
              {COLORS.map(c => <button key={c} className="w-9 h-9 rounded-full border-2 border-transparent hover:scale-110 transition" style={{ background: c }} />)}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Logout ── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">📊 Data & privacy</h3>
        <Button variant="destructive" className="rounded-2xl"
          onClick={async () => { await signOut(); toast.success("Logged out"); }}>
          Log out
        </Button>
      </motion.section>
    </div>
  );
}
