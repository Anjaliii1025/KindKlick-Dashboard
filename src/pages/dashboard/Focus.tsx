import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Smartphone, Gamepad2, Tv } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const CATS = [
  { icon: Smartphone, name: "Social Media", sites: ["facebook", "instagram", "tiktok", "twitter", "snapchat"] },
  { icon: Gamepad2, name: "Gaming", sites: ["roblox", "miniclip", "coolmathgames", "friv", "poki"] },
  { icon: Tv, name: "Video", sites: ["youtube", "netflix", "twitch", "disney+", "prime video"] },
];

const SCHEDULES = [
  { name: "School Hours", time: "Mon-Fri 8 AM - 3 PM", on: true },
  { name: "Homework Time", time: "Mon-Fri 4 PM - 6 PM", on: true },
  { name: "Bedtime Restriction", time: "Daily 9 PM - 8 AM", on: true },
  { name: "Weekend Study", time: "Sat-Sun 10 AM - 12 PM", on: false },
];

export default function Focus() {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-5">
      <motion.div animate={active ? { boxShadow: ["0 0 0 hsl(var(--secondary)/0)", "0 0 30px hsl(var(--secondary)/0.4)", "0 0 0 hsl(var(--secondary)/0)"] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`bg-card border-2 ${active ? "border-secondary" : "border-border"} rounded-3xl p-6 shadow-soft`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div animate={active ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 6, repeat: active ? Infinity : 0, ease: "linear" }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${active ? "gradient-brand text-white" : "bg-muted text-muted-foreground"}`}>
              <BookOpen className="w-8 h-8" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold">Study / Focus Mode</h2>
              <p className="text-xs text-muted-foreground">{active ? "🟢 Active — distracting sites are blocked" : "⚫ Disabled"}</p>
            </div>
          </div>
          <Switch checked={active} onCheckedChange={setActive} className="scale-150" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATS.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <c.icon className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-bold mb-2">{c.name}</h3>
            <ul className="space-y-1.5 text-xs">
              {c.sites.map(s => (
                <li key={s} className="flex items-center gap-2">
                  <span className={active ? "text-danger" : "text-muted-foreground"}>{active ? "🚫" : "○"}</span> {s}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Scheduled focus times</h3>
        {SCHEDULES.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.time}</p>
            </div>
            <Switch defaultChecked={s.on} />
          </div>
        ))}
      </div>

      <Button onClick={() => toast.success("Override active for 15 min")} variant="destructive" className="rounded-2xl">
        🔓 Emergency override (15 min)
      </Button>
    </div>
  );
}
