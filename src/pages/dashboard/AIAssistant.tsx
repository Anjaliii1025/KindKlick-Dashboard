import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Send, Bot, User as UserIcon, Copy, Loader2,
  Sparkles, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Radio, X, Square,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useActiveChild } from "@/hooks/useActiveChild";

interface Msg { role: "user" | "assistant"; content: string; ts: string; }

const STORAGE_KEY = "kk_ai_chat_v3";

const welcomeFor = (name: string) => `Namaste! 👋 Main **KindKlick AI** hoon.

Main ${name} ke baare me help kar sakta hoon:
- 📊 **Screen time** & activity
- 🚫 Blocked sites
- 🛡️ Safety reports
- 🎯 Focus mode tips

Aaj kya jaanna chahenge?`;

const promptsFor = (name: string) => [
  `${name} ne aaj kitna time online spend kiya?`,
  `Aaj kaunsi sites block hui aur kyun?`,
  `Is hafte ki safety report dikhao`,
  `${name} ke liye safe homework websites suggest karo`,
  `Focus mode kaise set karun?`,
  `Generate a weekly activity summary`,
];

export default function AIAssistant() {
  const { child } = useActiveChild();
  const childName = child?.name ?? "your child";

  const [messages, setMessages] = useState<Msg[]>(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [liveOpen, setLiveOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);
  const inputRef = useRef("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current = input; }, [input]);

  useEffect(() => {
    setMessages(prev => prev.length === 0
      ? [{ role: "assistant", content: welcomeFor(childName), ts: new Date().toISOString() }]
      : prev);
  }, [childName]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const el = taRef.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  // ===== TEXT CHAT =====
  const callAI = async (history: Msg[]) => {
    const { data, error } = await supabase.functions.invoke("kindklick-chat", {
      body: {
        mode: "parent",
        childName,
        messages: history.map(m => ({ role: m.role, content: m.content })),
      },
    });
    if (error) throw error;
    return (data as any)?.reply ?? "Sorry, I couldn't reply.";
  };

  const sendMessage = async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed || sending) return;
    const userMsg: Msg = { role: "user", content: trimmed, ts: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const reply = await callAI(next);
      setMessages(m => [...m, { role: "assistant", content: reply, ts: new Date().toISOString() }]);
    } catch {
      setMessages(m => [...m, {
        role: "assistant",
        content: "Sorry, connection failed. Please try again.",
        ts: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const regenerate = async () => {
    if (sending) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const cutIdx = messages.length - 1 - lastUserIdx;
    const trimmed = messages.slice(0, cutIdx + 1);
    setMessages(trimmed);
    setSending(true);
    try {
      const reply = await callAI(trimmed);
      setMessages(m => [...m, { role: "assistant", content: reply, ts: new Date().toISOString() }]);
    } catch {
      toast.error("Failed");
    } finally { setSending(false); }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: welcomeFor(childName), ts: new Date().toISOString() }]);
    toast.success("Chat cleared");
  };

  // ===== VOICE INPUT (no AI voice output) =====
  const startVoiceInput = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported. Please use Chrome."); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";
    setListening(true);

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => {
      setListening(false);
      setTimeout(() => {
        const t = inputRef.current.trim();
        if (t.length > 0) { sendMessage(t); setInput(""); }
      }, 300);
    };
    recognition.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") toast.error("Microphone permission denied.");
    };
    recognition.start();
    recogRef.current = recognition;
  };
  const stopVoiceInput = () => { recogRef.current?.stop?.(); setListening(false); };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  const prompts = promptsFor(child?.name ?? "Your child");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 h-[calc(100vh-7rem)] min-h-[520px]">
      {/* Chat panel */}
      <div className="bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-soft min-h-0">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-soft shrink-0">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold leading-tight truncate">KindKlick AI</h2>
              <p className="text-xs text-muted-foreground truncate">
                Online • <span className="text-primary font-medium">{childName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setLiveOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gradient-brand text-white shadow-soft hover:opacity-90 transition"
            >
              <Radio className="w-3.5 h-3.5" /> Live Voice
            </button>
            <button
              onClick={() => setLiveOpen(true)}
              className="sm:hidden w-9 h-9 rounded-xl gradient-brand text-white flex items-center justify-center shadow-soft"
              title="Live Voice Chat"
            >
              <Radio className="w-4 h-4" />
            </button>
            <button onClick={clearChat} title="Clear chat"
              className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-danger transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-soft ${
                  m.role === "user" ? "gradient-fun text-white" : "gradient-brand text-white"
                }`}>
                  {m.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] sm:max-w-[78%] space-y-1 ${m.role === "user" ? "items-end" : ""}`}>
                  <div className={`px-3.5 py-2.5 sm:p-3.5 rounded-2xl text-sm leading-relaxed shadow-soft ${
                    m.role === "user"
                      ? "gradient-brand text-white rounded-tr-sm"
                      : "bg-muted/60 text-foreground rounded-tl-sm"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-primary prose-a:text-primary">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                          }}
                        >{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>
                  <div className={`flex gap-2 text-[10px] text-muted-foreground px-1 ${m.role === "user" ? "justify-end" : ""}`}>
                    <span>{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {m.role === "assistant" && (
                      <>
                        <button onClick={() => copy(m.content)} className="hover:text-primary transition"><Copy className="w-3 h-3" /></button>
                        {i === messages.length - 1 && (
                          <button onClick={regenerate} className="hover:text-primary transition" title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {sending && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl gradient-brand flex items-center justify-center shadow-soft">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/60 rounded-2xl px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile suggested prompts */}
        <div className="lg:hidden border-t border-border bg-muted/20">
          <button onClick={() => setShowPrompts(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested</span>
            {showPrompts ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <AnimatePresence initial={false}>
            {showPrompts && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-3 pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
                  {prompts.map(p => (
                    <button key={p} onClick={() => sendMessage(p)} disabled={sending}
                      className="shrink-0 text-xs px-3 py-2 rounded-full bg-card border border-border hover:border-primary/40 hover:text-primary transition disabled:opacity-50">
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          <div className="flex items-end gap-2">
            <button
              onClick={listening ? stopVoiceInput : startVoiceInput}
              title={listening ? "Stop" : "Voice input"}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-soft relative shrink-0 ${
                listening ? "bg-danger text-white" : "bg-muted hover:bg-muted/70 text-foreground"
              }`}
            >
              {listening && <span className="absolute inset-0 rounded-2xl bg-danger animate-pulse-ring" />}
              <Mic className="w-5 h-5 relative" />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={listening ? "Listening..." : `Ask about ${childName}...`}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32 min-h-[44px]"
              />
            </div>
            <Button onClick={() => sendMessage(input)} disabled={sending || !input.trim()}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl gradient-brand text-white p-0 shrink-0 shadow-soft disabled:opacity-50">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            AI may make mistakes. Verify important info.
          </p>
        </div>
      </div>

      {/* Desktop suggested prompts sidebar */}
      <div className="hidden lg:block bg-card border border-border rounded-3xl p-5 shadow-soft overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold">Suggested questions</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Tap any to send instantly</p>
        <div className="space-y-2">
          {prompts.map((p) => (
            <motion.button key={p} whileHover={{ x: 4 }} onClick={() => sendMessage(p)} disabled={sending}
              className="w-full text-left text-sm px-4 py-3 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/30 disabled:opacity-50">
              {p}
            </motion.button>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-border">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">💡 Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• Hindi me bhi sawaal pooch sakte ho</li>
            <li>• Mic se bolo — text auto-send hoga</li>
            <li>• Live Voice Chat alag button me hai</li>
          </ul>
        </div>
      </div>

      {/* ===== LIVE VOICE CHAT MODAL ===== */}
      <LiveVoiceModal
        open={liveOpen}
        onClose={() => setLiveOpen(false)}
        childName={childName}
      />
    </div>
  );
}

/* =====================================================================
   LIVE VOICE CHAT MODAL — separate hands-free conversation
   ===================================================================== */
function LiveVoiceModal({
  open, onClose, childName,
}: { open: boolean; onClose: () => void; childName: string }) {
  type State = "idle" | "listening" | "thinking" | "speaking";
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const recogRef = useRef<any>(null);
  const stoppedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, state]);

  const stopAll = () => {
    stoppedRef.current = true;
    try { recogRef.current?.stop?.(); } catch {}
    try { window.speechSynthesis.cancel(); } catch {}
    setState("idle");
  };

  const close = () => { stopAll(); onClose(); };

  const speak = (text: string, onDone: () => void) => {
    try {
      const clean = text.replace(/[*_`#>~\-]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1");
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "hi-IN"; u.rate = 1.0; u.pitch = 1.0;
      u.onend = () => onDone();
      u.onerror = () => onDone();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { onDone(); }
  };

  const askAI = async (history: { role: string; content: string }[]) => {
    const { data, error } = await supabase.functions.invoke("kindklick-chat", {
      body: { mode: "parent", childName, messages: history },
    });
    if (error) throw error;
    return (data as any)?.reply ?? "Sorry, I couldn't reply.";
  };

  const listenOnce = () => {
    if (stoppedRef.current) return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported. Use Chrome."); stopAll(); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "hi-IN";
    setState("listening");
    let final = "";
    r.onresult = (e: any) => {
      final = Array.from(e.results).map((res: any) => res[0].transcript).join("");
    };
    r.onerror = () => { setState("idle"); };
    r.onend = async () => {
      if (stoppedRef.current) return;
      const text = final.trim();
      if (!text) { listenOnce(); return; }
      setTranscript(prev => [...prev, { role: "user", text }]);
      setState("thinking");
      try {
        const history = [...transcript, { role: "user", text }].map(t => ({ role: t.role, content: t.text }));
        const reply = await askAI(history);
        if (stoppedRef.current) return;
        setTranscript(prev => [...prev, { role: "assistant", text: reply }]);
        setState("speaking");
        speak(reply, () => { if (!stoppedRef.current) listenOnce(); });
      } catch {
        setTranscript(prev => [...prev, { role: "assistant", text: "Sorry, connection failed." }]);
        if (!stoppedRef.current) listenOnce();
      }
    };
    r.start();
    recogRef.current = r;
  };

  const start = () => {
    stoppedRef.current = false;
    setTranscript([]);
    listenOnce();
  };

  useEffect(() => {
    if (open) { stoppedRef.current = false; setTranscript([]); setTimeout(start, 300); }
    else stopAll();
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const ringColor =
    state === "listening" ? "bg-success" :
    state === "thinking" ? "bg-warning" :
    state === "speaking" ? "bg-primary" : "bg-muted";

  const statusText =
    state === "listening" ? "🎤 Listening... bolo" :
    state === "thinking" ? "💭 Thinking..." :
    state === "speaking" ? "🔊 Speaking..." :
    "Tap stop to end";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={close}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-[500px] bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Live Voice Conversation</h3>
            </div>
            <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Animated circle */}
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {(state === "listening" || state === "speaking") && (
                <>
                  <span className={`absolute inset-0 rounded-full ${ringColor} opacity-20 animate-ping`} />
                  <span className={`absolute inset-3 rounded-full ${ringColor} opacity-30 animate-pulse`} />
                </>
              )}
              <div className={`relative w-28 h-28 rounded-full ${ringColor} flex items-center justify-center shadow-2xl`}>
                {state === "thinking"
                  ? <Loader2 className="w-12 h-12 text-white animate-spin" />
                  : <Mic className="w-12 h-12 text-white" />}
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground">{statusText}</p>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-3 space-y-2 scrollbar-thin min-h-[120px] max-h-[260px]">
            {transcript.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                Conversation transcript yahan dikhega...
              </p>
            ) : transcript.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  t.role === "user" ? "gradient-brand text-white" : "bg-muted text-foreground"
                }`}>{t.text}</div>
              </div>
            ))}
          </div>

          {/* Stop button */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={close}
              className="w-full h-12 rounded-2xl bg-danger hover:bg-danger/90 text-white font-semibold gap-2"
            >
              <Square className="w-4 h-4 fill-current" /> End Voice Chat
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
