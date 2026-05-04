import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, BarChart3, Bot, Sparkles, Lock, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-9 h-9 rounded-2xl gradient-brand flex items-center justify-center shadow-soft">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="gradient-text">KindKlick</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" className="rounded-2xl">Parent Login</Button></Link>
            <Link to="/signup"><Button className="rounded-2xl gradient-brand text-white shadow-soft hover:opacity-90">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/30 blur-3xl blob" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-secondary/30 blur-3xl blob" style={{ animationDelay: "3s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent/20 blur-3xl blob" style={{ animationDelay: "6s" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 1 }}
            className="inline-flex w-24 h-24 mb-6 float">
            <div className="w-full h-full rounded-3xl gradient-hero flex items-center justify-center shadow-elevated">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Safe Browsing for <span className="gradient-text">Happy Kids</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            KindKlick helps parents monitor, guide, and protect their children online — with real-time insights and a friendly AI assistant.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="rounded-2xl gradient-brand text-white shadow-elevated hover:scale-105 transition-transform px-8 h-14 text-base">
                Get Started Free <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base border-2">
                Parent Login
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-4">Everything you need to keep them safe</motion.h2>
        <p className="text-center text-muted-foreground mb-12">Powerful tools wrapped in a delightful, child-friendly experience.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Safe Browsing", desc: "Block harmful content automatically with smart category filters.", grad: "gradient-brand" },
            { icon: BarChart3, title: "Real-time Monitoring", desc: "See exactly what they explore, when, and for how long.", grad: "gradient-fun" },
            { icon: Bot, title: "AI Parenting Assistant", desc: "Ask questions in English or Hindi — get personalised insights instantly.", grad: "gradient-hero" },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-card border border-border rounded-3xl p-7 shadow-soft hover:shadow-elevated transition-shadow">
              <div className={`w-14 h-14 rounded-2xl ${f.grad} flex items-center justify-center mb-5 shadow-soft`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="py-24 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How KindKlick works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Lock, step: "1", title: "Create your account", desc: "Sign up in 60 seconds and add your child's profile." },
              { icon: Clock, step: "2", title: "Set safe limits", desc: "Configure screen time, focus mode, and blocked categories." },
              { icon: Sparkles, step: "3", title: "Relax & get insights", desc: "Receive smart alerts and weekly reports — automatically." },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center text-white shadow-elevated mx-auto">
                    <s.icon className="w-9 h-9" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center text-sm shadow-soft">
                    {s.step}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Loved by parents everywhere</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Priya S.", role: "Parent of two", quote: "Finally I know what my kids are doing online without hovering. The AI assistant is brilliant." },
            { name: "Marco R.", role: "Dad", quote: "Setup was instant and the dashboard is gorgeous. My daughter loves her own view too!" },
            { name: "Aisha K.", role: "Mom", quote: "Hindi support and gentle nudges — it feels designed for real Indian families." },
          ].map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-3xl p-6 shadow-soft">
              <p className="text-foreground/90 mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full gradient-fun flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="w-4 h-4 text-primary" /> KindKlick · Safe Browsing for Happy Kids
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
