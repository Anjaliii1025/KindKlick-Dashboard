// src/pages/Onboarding.tsx
// ──────────────────────────────────────────────────────────────────────────────
// KindKlick Onboarding — 4-step guided setup:
//   Step 1: Download extension zip
//   Step 2: Load it in Chrome
//   Step 3: Generate device token on website, paste in extension
//   Step 4: Done — go to dashboard
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Download, Puzzle, Link2, CheckCircle2, Copy, RefreshCw, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Token { id: string; token: string; label: string | null; is_active: boolean; created_at: string; }

function genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "kk_" + Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// ── Step indicator ──────────────────────────────────────────────────────────
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
            ${i < current ? "bg-primary text-primary-foreground" :
              i === current ? "bg-primary/20 text-primary border-2 border-primary" :
              "bg-muted text-muted-foreground"}`}>
            {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 rounded transition-all duration-500 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Download ────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center mx-auto shadow-soft">
          <Download className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Extension download karo</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Pehle KindKlick Chrome Extension ka zip file download karo — yahi extension tumhare bachche ke browser mein kaam karega.
        </p>
      </div>

      <div className="bg-muted/50 rounded-2xl p-5 space-y-3 text-sm">
        <p className="font-medium">Zip file mein yeh sab hoga:</p>
        <ul className="space-y-1 text-muted-foreground">
          {["Content filter (Adult, Violence, Drugs, etc.)", "Screen time enforcement", "Bedtime schedules", "Parent PIN protection", "Auto cloud sync"].map(f => (
            <li key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <a href="/kindklick-extension.zip" download>
        <Button size="lg" className="w-full rounded-2xl gradient-brand text-white h-12 text-base">
          <Download className="w-5 h-5 mr-2" /> KindKlick Extension Download Karo
        </Button>
      </a>
      <Button variant="ghost" onClick={onNext} className="w-full rounded-2xl text-sm">
        Already downloaded hai → Next step
      </Button>
    </div>
  );
}

// ── Step 2: Load in Chrome ──────────────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const steps = [
    { num: "1", text: "Download kiya hua zip file unzip karo (Right click → Extract All)" },
    { num: "2", text: "Chrome mein jao: chrome://extensions/" },
    { num: "3", text: "Top-right pe 'Developer mode' ON karo" },
    { num: "4", text: "'Load unpacked' button pe click karo" },
    { num: "5", text: "Extract kiya hua folder select karo" },
    { num: "6", text: "KindKlick extension list mein aa jayega ✓" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 flex items-center justify-center mx-auto">
          <Puzzle className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold">Chrome mein install karo</h2>
        <p className="text-muted-foreground text-sm">Yeh ek baar ka setup hai. 2 minute lagenge.</p>
      </div>

      <div className="space-y-3">
        {steps.map(s => (
          <div key={s.num} className="flex gap-4 p-3 rounded-xl bg-muted/40">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
              {s.num}
            </div>
            <p className="text-sm pt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
        <strong>Tip:</strong> chrome://extensions/ copy karo aur Chrome address bar mein paste karo — direct open hoga.
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="rounded-2xl flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={onNext} className="rounded-2xl flex-1 gradient-brand text-white">Install ho gaya <ChevronRight className="w-4 h-4 ml-1" /></Button>
      </div>
    </div>
  );
}

// ── Step 3: Generate token & paste ─────────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { child } = useActiveChild();
  const [token, setToken] = useState<Token | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const createToken = async () => {
    if (!child) { toast.error("Pehle login karo"); return; }
    setCreating(true);
    const t = genToken();
    const { data, error } = await supabase.from("device_tokens")
      .insert({ child_id: child.id, token: t, label: "Chrome Extension" })
      .select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setToken(data as Token);
  };

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token.token);
    setCopied(true);
    toast.success("Token copy ho gaya!");
    setTimeout(() => setCopied(false), 3000);
  };

  const pasteSteps = [
    "Chrome toolbar mein KindKlick icon pe right-click karo",
    "'Options' pe click karo",
    "\"Cloud sync\" section mein token paste karo",
    "\"Pair\" button dabao — Connected dikhega",
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/20 flex items-center justify-center mx-auto">
          <Link2 className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold">Extension ko pair karo</h2>
        <p className="text-muted-foreground text-sm">
          Ek secret token banao, extension mein paste karo — bas yahi connection hai.
        </p>
      </div>

      {/* Token generation */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="font-medium text-sm">{child?.name ?? "Tumhare bachche"} ke liye token:</p>

        {!token ? (
          <Button onClick={createToken} disabled={creating} className="w-full rounded-xl gradient-brand text-white">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Token Generate Karo
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <code className="text-xs font-mono flex-1 truncate text-green-600 dark:text-green-400">{token.token}</code>
              <button onClick={copy} className="p-1.5 rounded-lg hover:bg-background transition-colors">
                <Copy className={`w-4 h-4 ${copied ? "text-green-500" : "text-muted-foreground"}`} />
              </button>
            </div>
            <Button onClick={copy} variant={copied ? "outline" : "default"} className={`w-full rounded-xl text-sm ${!copied ? "gradient-brand text-white" : ""}`}>
              {copied ? "✓ Copied!" : "Token Copy Karo"}
            </Button>
          </div>
        )}
      </div>

      {/* Paste steps */}
      {token && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="font-medium text-sm">Ab extension mein paste karo:</p>
          {pasteSteps.map((s, i) => (
            <div key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="font-bold text-primary">{i + 1}.</span> {s}
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="rounded-2xl flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={onNext} disabled={!token} className="rounded-2xl flex-1 gradient-brand text-white">
          Pair ho gaya <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Done ────────────────────────────────────────────────────────────
function Step4() {
  const navigate = useNavigate();
  const { child } = useActiveChild();

  return (
    <div className="text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}
        className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Sab set ho gaya! 🎉</h2>
        <p className="text-muted-foreground">
          {child?.name ?? "Tumhara bachcha"} ka browser ab KindKlick se connected hai.
          Dashboard pe real-time activity dekhna shuru ho jayega.
        </p>
      </div>

      <div className="bg-muted/40 rounded-2xl p-5 text-sm space-y-2 text-left">
        <p className="font-medium">Ab kya hoga automatically:</p>
        {[
          "Har website visit dashboard mein record hogi",
          "Blocked attempts pe turant alert aayega",
          "Screen time daily track hoga",
          "Dashboard pe live data dikhega",
        ].map(t => (
          <div key={t} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {t}
          </div>
        ))}
      </div>

      <Button size="lg" onClick={() => navigate("/dashboard")} className="w-full rounded-2xl gradient-brand text-white h-12 text-base">
        Dashboard Dekho <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}

// ── Main Onboarding Component ───────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate("/login"); }, [user]);

  const totalSteps = 4;
  const stepComponents = [
    <Step1 onNext={() => setStep(1)} />,
    <Step2 onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <Step3 onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <Step4 />,
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">KindKlick</span>
          <span className="text-muted-foreground text-sm ml-auto">
            <Link to="/dashboard" className="hover:underline">Skip setup →</Link>
          </span>
        </div>

        <Steps current={step} total={totalSteps} />

        <div className="bg-card border border-border rounded-3xl p-7 shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>
              {stepComponents[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
