import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import { weeklyScreenTime, hourlyActivity, categoryData } from "@/lib/mockData";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function ScreenTime() {
  const [limit, setLimit] = useState(240);
  const used = 142;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Weekly overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weeklyScreenTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <ReferenceLine y={limit} stroke="hsl(var(--danger))" strokeDasharray="4 4" />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-1">Daily limit</h3>
          <p className="text-xs text-muted-foreground mb-4">Drag to set today's limit</p>
          <p className="text-3xl font-extrabold gradient-text mb-3">{Math.floor(limit / 60)}h {limit % 60}m</p>
          <Slider value={[limit]} min={60} max={480} step={30} onValueChange={v => setLimit(v[0])} className="mb-4" />
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used today</span><span>{Math.floor(used/60)}h {used%60}m</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div animate={{ width: `${pct}%` }} className={`h-full rounded-full ${pct < 60 ? "bg-success" : pct < 85 ? "bg-warning" : "bg-danger"}`} />
            </div>
          </div>
          <Button onClick={() => toast.success("Limit saved")} className="mt-4 rounded-2xl gradient-brand text-white">Save</Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-3">Hourly activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyActivity}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="min" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#hourGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-3">Category time today</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" innerRadius={50} outerRadius={85} animationDuration={800}>
                {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-3">Alerts & rules</h3>
          {[
            "Alert when 30 min remaining",
            "Alert when limit reached",
            "Auto-lock when limit reached",
            "Bedtime lock at 9 PM",
          ].map((label, i) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm">{label}</span>
              <Switch defaultChecked={i < 3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
