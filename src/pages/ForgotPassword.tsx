import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl blob" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border rounded-3xl shadow-elevated p-8">
        <Link to="/" className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-soft">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">KindKlick</span>
        </Link>
        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
            <p className="text-muted-foreground text-sm">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login"><Button className="mt-6 rounded-2xl gradient-brand text-white">Back to login</Button></Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-1">Reset your password</h1>
            <p className="text-center text-muted-foreground text-sm mb-6">We'll email you a reset link</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-10 rounded-2xl h-12" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl gradient-brand text-white shadow-soft font-semibold">Send reset link</Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-5">
              Remembered? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
