import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#7C3AED", "#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    parentName: "", email: "", password: "", confirm: "",
    childName: "", childAge: "10", color: "#7C3AED", terms: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 chars");
    if (!form.terms) return toast.error("Please accept the terms");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: form.parentName,
          child_name: form.childName,
          child_age: form.childAge,
          avatar_color: form.color,
        },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("pwned")) {
        return toast.error("Yeh password commonly used hai. Kuch unique try karein (e.g. MyChild#2024Safe)");
      }
      if (error.message.toLowerCase().includes("already")) {
        return toast.error("Yeh email pehle se registered hai. Login karein.");
      }
      return toast.error(error.message);
    }
    toast.success("Account created! 🎉");
    nav("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl blob" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-3xl blob" style={{ animationDelay: "4s" }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border rounded-3xl shadow-elevated p-8">
        <Link to="/" className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-soft">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">KindKlick</span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">Create your account</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">Start protecting your child today</p>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Parent name</Label>
            <Input required value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="rounded-2xl h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-2xl h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="rounded-2xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm</Label>
              <Input type="password" required value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} className="rounded-2xl h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Child name</Label>
              <Input required value={form.childName} onChange={e => setForm({...form, childName: e.target.value})} className="rounded-2xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Select value={form.childAge} onValueChange={v => setForm({...form, childAge: v})}>
                <SelectTrigger className="rounded-2xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 4).map(a =>
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Avatar color</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${form.color === c ? "scale-110 border-foreground ring-2 ring-foreground/20" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm pt-1">
            <Checkbox checked={form.terms} onCheckedChange={v => setForm({...form, terms: !!v})} className="mt-0.5" />
            <span className="text-muted-foreground">I agree to the <a href="#" className="text-primary">Terms</a> & <a href="#" className="text-primary">Privacy Policy</a></span>
          </label>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-brand text-white shadow-soft hover:opacity-90 font-semibold">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
