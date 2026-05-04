import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Send, X, Loader2, Trophy, Lock, Sparkles, HandHelping, BookOpen, Music, Palette, Globe, Calculator, Microscope } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ViewToggle } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { childPrompts, mockChild } from "@/lib/mockData";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAuth } from "@/context/AuthContext";

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const ACTIVITIES = [
  { emoji: "📚", label: "Learning", time: "1h 20m", color: "from-success to-secondary" },
  { emoji: "🎮", label: "Fun & Games", time: "45 min", color: "from-secondary to-primary" },
  { emoji: "🌍", label: "Exploring", time: "21 min", color: "from-primary to-accent" },
  { emoji: "🔍", label: "Searching", time: "6 min", color: "from-accent to-warning" },
];

const BADGES = [
  { emoji: "🌟", name: "Safe Surfer", earned: true },
  { emoji: "📚", name: "Learning Champ", earned: true },
  { emoji: "⏰", name: "Time Manager", earned: true },
  { emoji: "🎯", name: "Focus Star", earned: false },
  { emoji: "🔬", name: "Explorer", earned: true },
  { emoji: "🏅", name: "Weekly Hero", earned: false },
];

const MOODS = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😟", label: "Sad" },
  { emoji: "😴", label: "Tired" },
];

const MISSIONS = [
  { id: "m1", emoji: "📖", text: "Read for 15 minutes", points: 10 },
  { id: "m2", emoji: "🧮", text: "Finish 1 math practice", points: 15 },
  { id: "m3", emoji: "🚶", text: "Take a 5-min screen break", points: 5 },
  { id: "m4", emoji: "💧", text: "Drink a glass of water", points: 5 },
];

const SAFE_SHORTCUTS = [
  { name: "Khan Academy", url: "https://www.khanacademy.org", icon: BookOpen, color: "bg-success/10 text-success" },
  { name: "Nat Geo Kids", url: "https://kids.nationalgeographic.com", icon: Globe, color: "bg-primary/10 text-primary" },
  { name: "Cool Math", url: "https://www.coolmathgames.com", icon: Calculator, color: "bg-secondary/10 text-secondary" },
  { name: "BBC Bitesize", url: "https://www.bbc.co.uk/bitesize", icon: Microscope, color: "bg-warning/10 text-warning" },
  { name: "YouTube Kids", url: "https://www.youtubekids.com", icon: Music, color: "bg-accent/10 text-accent" },
  { name: "Art for Kids", url: "https://www.artforkidshub.com", icon: Palette, color: "bg-danger/10 text-danger" },
];

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChildDashboard() {
  const { user } = useAuth();
  const { child: active } = useActiveChild();
  const childName = active?.name || mockChild.name;
  const limit = active?.daily_limit_minutes || 240;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi ${childName}! 👋 I'm your KindKlick Buddy! Ask me anything fun! 🌟` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  // New: Mood + missions + ask-parent
  const [mood, setMood] = useState<string | null>(() => localStorage.getItem("kk_child_mood_today"));
  const [completedMissions, setCompletedMissions] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("kk_child_missions_today") || "[]"); }
    catch { return []; }
  });
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [askSending, setAskSending] = useState(false);

  const used = 142;
  const pct = Math.min(100, (used / limit) * 100);
  const points = completedMissions.length * 10;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const pickMood = (m: string) => {
    setMood(m);
    localStorage.setItem("kk_child_mood_today", m);
    toast.success(`Mood saved: ${m}`);
  };

  const toggleMission = (id: string) => {
    const next = completedMissions.includes(id)
      ? completedMissions.filter(x => x !== id)
      : [...completedMissions, id];
    setCompletedMissions(next);
    localStorage.setItem("kk_child_missions_today", JSON.stringify(next));
    if (!completedMissions.includes(id)) toast.success("Mission complete! 🎉");
  };

  const sendAskParent = async () => {
    if (!askText.trim() || !active) return;
    setAskSending(true);
    const { error } = await supabase.from("alerts").insert({
      child_id: active.id,
      type: "child_request",
      severity: "low",
      message: `${childName} asks: ${askText.trim()}`,
    });
    setAskSending(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent to parent! 💌");
    setAskText(""); setAskOpen(false);
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || sending) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next); setInput(""); setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("kindklick-chat", {
        body: { mode: "child", childName, messages: next },
      });
      if (error) throw error;
      const reply = (data as any)?.reply ?? "Hmm, try again? 😊";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
      try {
        const u = new SpeechSynthesisUtterance(reply);
        u.rate = 0.95; u.pitch = 1.1; window.speechSynthesis.speak(u);
      } catch {}
    } catch (e: any) { toast.error(e.message ?? "Oops!"); }
    finally { setSending(false); }
  };

  const startMic = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice not supported");
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "en-US";
    let final = "";
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((x: any) => x[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) final = t;
    };
    r.onend = () => { setListening(false); if (final.trim()) send(final); };
    r.onerror = () => setListening(false);
    r.start(); recogRef.current = r; setListening(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <ViewToggle />

      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-hero text-white p-6 md:p-10 rounded-b-[3rem] shadow-elevated">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <motion.span animate={{ rotate: [0, 14, -8, 14, 0] }} transition={{ repeat: Infinity, repeatDelay: 2, duration: 1 }}
                className="inline-block text-4xl">👋</motion.span>
              <h1 className="text-3xl md:text-5xl font-extrabold mt-2">Hi {childName}! {greet()}!</h1>
              <p className="text-white/80 mt-1 text-sm">{format(new Date(), "EEEE, MMMM d")}</p>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-soft">
              {childName[0]?.toUpperCase()}
            </div>
          </div>

          <div className="mt-6 bg-white/15 backdrop-blur rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2 font-semibold">
              <span>Today's screen time</span><span>{Math.floor(used/60)}h {used%60}m / {Math.floor(limit/60)}h</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                className={`h-full rounded-full ${pct < 60 ? "bg-success" : pct < 85 ? "bg-warning" : "bg-danger"}`} />
            </div>
            <p className="mt-3 text-sm font-semibold">🌟 Amazing job staying safe today!</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* NEW: Mood check-in */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> How are you feeling today?
          </h2>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button key={m.label} onClick={() => pickMood(m.emoji)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                  mood === m.emoji ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/40"
                }`}>
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-[11px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity grid */}
        <div>
          <h2 className="text-xl font-bold mb-3">My activity today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACTIVITIES.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, rotate: -2 }}
                className={`bg-gradient-to-br ${a.color} p-5 rounded-3xl text-white shadow-card`}>
                <p className="text-3xl mb-1">{a.emoji}</p>
                <p className="font-bold">{a.label}</p>
                <p className="text-sm text-white/90 mt-1">{a.time}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-primary/20 rounded-3xl p-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">⏰ Time left today</p>
          <p className="text-4xl md:text-5xl font-extrabold gradient-text mt-1">
            {Math.max(0, Math.floor((limit-used)/60))}h {Math.max(0, (limit-used)%60)}m
          </p>
        </motion.div>

        {/* NEW: Today's missions */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">🎯 Today's missions</h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-warning/15 text-warning">
              {points} pts
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MISSIONS.map(m => {
              const done = completedMissions.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleMission(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    done ? "border-success/40 bg-success/5" : "border-border hover:border-primary/30"
                  }`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`flex-1 text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                    {m.text}
                  </span>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                    done ? "bg-success border-success text-white" : "border-muted-foreground/40"
                  }`}>{done ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NEW: Safe site shortcuts */}
        <div>
          <h2 className="text-xl font-bold mb-3">🚀 Safe places to explore</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SAFE_SHORTCUTS.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-soft transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> My achievements</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {BADGES.map((b, i) => (
              <motion.button key={b.name} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                whileTap={b.earned ? { scale: 1.2, rotate: [0, 10, -10, 0] } : {}}
                onClick={() => b.earned && toast.success(`${b.emoji} ${b.name} earned!`)}
                className={`p-4 rounded-2xl text-center ${b.earned ? "bg-card shadow-soft" : "bg-muted/50 grayscale opacity-50"} border border-border`}>
                <div className="text-3xl mb-1 relative">
                  {b.emoji}
                  {!b.earned && <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-muted-foreground" />}
                </div>
                <p className="text-[10px] font-semibold">{b.name}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* NEW: Ask parent */}
        <div className="bg-gradient-to-br from-accent/10 to-primary/10 border border-primary/20 rounded-3xl p-5 text-center">
          <HandHelping className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="font-bold mb-1">Need to ask your parent something?</p>
          <p className="text-xs text-muted-foreground mb-3">Send them a quick message — they'll see it on their dashboard.</p>
          <Button onClick={() => setAskOpen(true)} className="rounded-2xl gradient-brand text-white">
            ✉️ Ask Parent
          </Button>
        </div>
      </div>

      {/* Ask Parent modal */}
      <AnimatePresence>
        {askOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setAskOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-md shadow-elevated">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">✉️ Ask Parent</h3>
                <button onClick={() => setAskOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <textarea value={askText} onChange={e => setAskText(e.target.value)}
                rows={4} placeholder="Type your message..."
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAskOpen(false)}>Cancel</Button>
                <Button onClick={sendAskParent} disabled={askSending || !askText.trim()}
                  className="flex-1 rounded-xl gradient-brand text-white">
                  {askSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send 💌"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating buddy button */}
      <motion.button onClick={() => setChatOpen(true)}
        animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full gradient-fun shadow-elevated flex items-center justify-center text-white text-3xl z-40">
        🤖
      </motion.button>

      {/* Chat popup */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[500px] bg-card border border-border rounded-3xl shadow-elevated z-50 flex flex-col overflow-hidden">
            <div className="p-4 gradient-fun text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" /> <span className="font-bold">KindKlick Buddy</span>
              </div>
              <button onClick={() => setChatOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.role === "user" ? "gradient-fun text-white" : "bg-muted text-foreground"
                  }`}>{m.content}</div>
                </div>
              ))}
              {sending && <div className="text-xs text-muted-foreground">Thinking...</div>}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {childPrompts.slice(0, 3).map(p => (
                  <button key={p} onClick={() => send(p)} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20">{p}</button>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <button onClick={listening ? () => recogRef.current?.stop?.() : startMic}
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${listening ? "bg-danger text-white animate-pulse" : "bg-muted"}`}>
                <Mic className="w-4 h-4" />
              </button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") send(input); }}
                placeholder="Ask me anything!" className="flex-1 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Button onClick={() => send(input)} disabled={sending} className="w-10 h-10 p-0 rounded-xl gradient-fun text-white">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
