import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Clock, ShieldOff, Globe, Shield, Loader2, Sparkles, TrendingUp, TrendingDown,
  Zap, Award, Bell, ArrowRight, Activity, Smile, Coffee, Moon, Sun, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, LineChart, Line,
} from "recharts";
import { Link } from "react-router-dom";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useChildLive } from "@/hooks/useChildLive";
import { useEffect, useMemo, useState } from "react";

const CAT_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#7C3AED", "#EF4444", "#EC4899"];

function fmtMin(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}
function barColor(min: number, limit: number) {
  if (min < limit * 0.6) return "hsl(var(--success))";
  if (min < limit * 0.85) return "hsl(var(--warning))";
  return "hsl(var(--danger))";
}

// Animated counter
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => { mv.set(value); }, [value, mv]);
  return <motion.span>{display}</motion.span>;
}

function greetingFor(hour: number) {
  if (hour < 5) return { text: "Good night", icon: Moon };
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Coffee };
  if (hour < 21) return { text: "Good evening", icon: Smile };
  return { text: "Good night", icon: Moon };
}

export default function Overview() {
  const { child, loading: cLoading } = useActiveChild();
  const { sessions, today, weekly, blocked, loading } = useChildLive(child?.id ?? null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const limit = today?.limit_minutes ?? child?.daily_limit_minutes ?? 240;
  const todayMin = today?.total_minutes ?? 0;
  const usagePct = Math.min(100, Math.round((todayMin / Math.max(1, limit)) * 100));
  const remaining = Math.max(0, limit - todayMin);

  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600_000;
    return sessions.filter(s => new Date(s.visited_at).getTime() >= cutoff);
  }, [sessions]);

  const blockedToday = useMemo(() =>
    last24h.filter(s => s.status === "blocked").length, [last24h]);

  const safetyScore = useMemo(() => {
    if (last24h.length === 0) return 100;
    const safe = last24h.filter(s => s.status === "safe").length;
    return Math.round((safe / last24h.length) * 100);
  }, [last24h]);

  // yesterday compare
  const yesterdayMin = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const yStart = start.getTime() - 86400_000;
    const yEnd = start.getTime();
    const ySess = sessions.filter(s => {
      const t = new Date(s.visited_at).getTime();
      return t >= yStart && t < yEnd;
    });
    // approximate: 2 mins per visit if no per-session duration
    return ySess.length * 2;
  }, [sessions]);
  const trendDelta = todayMin - yesterdayMin;

  const greet = greetingFor(now.getHours());

  const stats = [
    {
      icon: Clock, label: "Screen Time", value: fmtMin(todayMin), sub: `of ${fmtMin(limit)} limit`,
      color: "primary", pct: usagePct,
    },
    {
      icon: ShieldOff, label: "Blocked", value: blockedToday.toString(), sub: `${blocked.length} on block list`,
      color: "danger", pct: Math.min(100, blockedToday * 10),
    },
    {
      icon: Globe, label: "Sites Visited", value: last24h.length.toString(),
      sub: `${new Set(last24h.map(s => s.category).filter(Boolean)).size} categories`,
      color: "secondary", pct: Math.min(100, last24h.length * 2),
    },
    {
      icon: Shield, label: "Safety Score", value: `${safetyScore}%`,
      sub: safetyScore >= 90 ? "Excellent" : safetyScore >= 70 ? "Good" : "Needs attention",
      color: "success", pct: safetyScore,
    },
  ];

  const colorMap: Record<string, string> = {
    primary: "border-primary/30 text-primary bg-primary/5",
    danger: "border-danger/30 text-danger bg-danger/5",
    secondary: "border-secondary/30 text-secondary bg-secondary/5",
    success: "border-success/30 text-success bg-success/5",
  };

  // Build weekly chart (last 7 days, fill missing)
  const weeklyChart = useMemo(() => {
    const map = new Map(weekly.map(w => [w.date, w.total_minutes]));
    const out: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: d.toLocaleDateString("en", { weekday: "short" }), minutes: map.get(key) ?? 0 });
    }
    return out;
  }, [weekly]);

  // Categories from last 7 days
  const categoryData = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      if (new Date(s.visited_at).getTime() < cutoff) return;
      const k = s.category ?? "Other";
      counts[k] = (counts[k] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, v], i) => ({
      name, value: Math.round((v / total) * 100), color: CAT_COLORS[i % CAT_COLORS.length],
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [sessions]);

  // Top visited domains (last 7 days)
  const topSites = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    const counts: Record<string, { count: number; status: string; category?: string | null }> = {};
    sessions.forEach(s => {
      if (new Date(s.visited_at).getTime() < cutoff) return;
      if (!counts[s.domain]) counts[s.domain] = { count: 0, status: s.status, category: s.category };
      counts[s.domain].count++;
    });
    return Object.entries(counts)
      .map(([domain, v]) => ({ domain, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sessions]);

  // Hourly activity heat (last 24h)
  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    last24h.forEach(s => {
      const h = new Date(s.visited_at).getHours();
      buckets[h].count++;
    });
    return buckets;
  }, [last24h]);

  // Safety trend (last 14 days)
  const safetyTrend = useMemo(() => {
    const buckets = new Map<string, { safe: number; total: number }>();
    sessions.forEach(s => {
      const day = s.visited_at.slice(0, 10);
      const b = buckets.get(day) ?? { safe: 0, total: 0 };
      b.total++; if (s.status === "safe") b.safe++;
      buckets.set(day, b);
    });
    const out: { day: string; score: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      const b = buckets.get(d);
      out.push({ day: d.slice(5), score: b && b.total > 0 ? Math.round((b.safe / b.total) * 100) : 100 });
    }
    return out;
  }, [sessions]);

  // Insight tip
  const tip = useMemo(() => {
    if (usagePct >= 90) return { icon: AlertTriangle, color: "danger", text: "Daily limit almost reached. Consider a screen break." };
    if (blockedToday >= 5) return { icon: ShieldOff, color: "warning", text: `${blockedToday} blocks today — filters are working hard.` };
    if (safetyScore >= 95) return { icon: Award, color: "success", text: "Great safe-browsing day! Keep it up." };
    if (last24h.length === 0) return { icon: Sparkles, color: "primary", text: "No activity yet. Pair a device to start monitoring." };
    return { icon: Activity, color: "primary", text: `Average activity. ${fmtMin(remaining)} of screen time left.` };
  }, [usagePct, blockedToday, safetyScore, last24h.length, remaining]);

  if (cLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero greeting + ring */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-success/10 p-6 shadow-soft"
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <greet.icon className="w-4 h-4" />
              {greet.text}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-1">
              {child ? <>Hi, watching over <span className="text-primary">{child.name}</span> ✨</> : "Welcome back ✨"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Link to="/dashboard/screen-time" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
                <Clock className="w-3.5 h-3.5" /> Screen time
              </Link>
              <Link to="/dashboard/focus" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 transition">
                <Zap className="w-3.5 h-3.5" /> Focus mode
              </Link>
              <Link to="/dashboard/alerts" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 transition">
                <Bell className="w-3.5 h-3.5" /> Alerts
              </Link>
              <Link to="/dashboard/multi-child" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 transition">
                <Sparkles className="w-3.5 h-3.5" /> Children
              </Link>
            </div>
          </div>

          {/* Daily progress ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
            className="relative w-40 h-40 mx-auto md:mx-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: "u", value: usagePct, fill: barColor(todayMin, limit) }]} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: "hsl(var(--muted))" } as any} dataKey="value" cornerRadius={20} animationDuration={900} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-extrabold"><Counter value={usagePct} suffix="%" /></p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">of daily limit</p>
              <p className="text-[11px] mt-1 font-semibold text-foreground">{fmtMin(remaining)} left</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Insight bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`flex items-center gap-3 p-3 rounded-2xl border bg-${tip.color}/5 border-${tip.color}/30`}
      >
        <div className={`w-9 h-9 rounded-xl bg-${tip.color}/15 flex items-center justify-center shrink-0`}>
          <tip.icon className={`w-4.5 h-4.5 text-${tip.color}`} />
        </div>
        <p className="text-sm font-medium">{tip.text}</p>
        {trendDelta !== 0 && (
          <span className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendDelta > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
            {trendDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendDelta > 0 ? "+" : ""}{trendDelta}m vs yesterday
          </span>
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`group relative overflow-hidden bg-card border-2 ${colorMap[s.color]} rounded-2xl p-5 shadow-soft hover:shadow-elevated transition-all`}>
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-current opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className={`w-10 h-10 rounded-xl bg-${s.color}/10 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}`} />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label} · {s.sub}</p>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full bg-${s.color}`}
                initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold">Weekly screen time</h3>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Last 7 days</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Daily limit: {fmtMin(limit)}</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                formatter={(v: number) => [fmtMin(v), "Time"]} />
              <ReferenceLine y={limit} stroke="hsl(var(--danger))" strokeDasharray="4 4" />
              <Bar dataKey="minutes" radius={[10, 10, 0, 0]} animationDuration={800}>
                {weeklyChart.map((d, i) => <Cell key={i} fill={barColor(d.minutes, limit)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-1">Site categories</h3>
          <p className="text-xs text-muted-foreground mb-3">Last 7 days</p>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No activity yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3} animationDuration={800}>
                    {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Hourly activity + Top sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold">Activity by hour</h3>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Last 24 hours</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">When your child is most active online</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hourly}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}h`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Top sites</h3>
            <Link to="/dashboard/history" className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topSites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topSites.map((s, i) => {
                const max = topSites[0].count;
                return (
                  <motion.div key={s.domain}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold truncate">{s.domain}</span>
                      <span className="text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(s.count / max) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.5 + i * 0.05 }}
                        className={`h-full ${s.status === "blocked" ? "bg-danger" : s.status === "warning" ? "bg-warning" : "bg-primary"}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-1">Safety score · last 14 days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={safetyTrend}>
            <defs>
              <linearGradient id="safetyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#safetyGrad)" animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Recent activity {child && <span className="text-xs font-normal text-muted-foreground">· {child.name}</span>}</h3>
          <Link to="/dashboard/history" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
        </div>
        <div className="space-y-1.5">
          {sessions.slice(0, 8).map((a, i) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.03 }}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {a.domain[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{a.domain}</p>
                <p className="text-xs text-muted-foreground truncate">{a.title ?? "—"}</p>
              </div>
              {a.category && <span className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full bg-muted font-semibold">{a.category}</span>}
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                a.status === "safe" ? "bg-success/15 text-success" :
                a.status === "warning" ? "bg-warning/15 text-warning" :
                "bg-danger/15 text-danger"
              }`}>{a.status === "safe" ? "✓ Safe" : a.status === "warning" ? "⚠ Warn" : "✗ Block"}</span>
              <span className="text-xs text-muted-foreground w-14 text-right">
                {new Date(a.visited_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </motion.div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No activity yet. Pair a device in Settings to start monitoring.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
