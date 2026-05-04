import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { Loader2, Camera, Mail, User as UserIcon, Lock, Calendar, Shield, LogOut, KeyRound, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      const meta = user.user_metadata ?? {};
      setPhone(meta.phone ?? "");
      setBio(meta.bio ?? "");

      const { count } = await supabase.from("children").select("*", { count: "exact", head: true }).eq("parent_id", user.id);
      setChildCount(count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error: e1 } = await supabase.from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq("id", user.id);
    const { error: e2 } = await supabase.auth.updateUser({ data: { phone, bio, full_name: fullName } });
    setSaving(false);
    if (e1 || e2) toast.error((e1 || e2)?.message ?? "Save failed");
    else toast.success("Profile updated");
  };

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);
        await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", user.id);
        toast.success("Avatar updated");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      toast.error(e.message);
      setUploading(false);
    }
  };

  const changePassword = async () => {
    if (newPwd.length < 6) { toast.error("Min 6 characters"); return; }
    if (newPwd !== confirmPwd) { toast.error("Passwords don't match"); return; }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setChangingPwd(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPwd(""); setConfirmPwd(""); }
  };

  const sendResetEmail = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent to your email");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const initials = (fullName || user?.email || "U").slice(0, 2).toUpperCase();
  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header card */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-6 shadow-soft overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-24 gradient-brand opacity-90" />
        <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-end pt-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="gradient-brand text-white text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{fullName || "Parent"}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> Parent</span>
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold flex items-center gap-1"><UserIcon className="w-3 h-3" /> {childCount} child{childCount === 1 ? "" : "ren"}</span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {joined}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Personal info */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Personal information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="rounded-2xl mt-1" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="rounded-2xl mt-1 opacity-70" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="rounded-2xl mt-1" />
          </div>
          <div>
            <Label>Account ID</Label>
            <Input value={user?.id ?? ""} disabled className="rounded-2xl mt-1 font-mono text-xs opacity-70" />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="A little about yourself..."
              className="w-full rounded-2xl mt-1 border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={saveProfile} disabled={saving} className="rounded-2xl gradient-brand text-white">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save changes
          </Button>
        </div>
      </motion.section>

      {/* Security */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Security</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>New password</Label>
            <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 6 characters" className="rounded-2xl mt-1" />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat password" className="rounded-2xl mt-1" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={changePassword} disabled={changingPwd || !newPwd} className="rounded-2xl gradient-brand text-white">
            {changingPwd && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<KeyRound className="w-4 h-4 mr-2" />Update password
          </Button>
          <Button variant="outline" onClick={sendResetEmail} className="rounded-2xl">
            <Mail className="w-4 h-4 mr-2" />Send reset email
          </Button>
        </div>
      </motion.section>

      {/* Account actions */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-4">⚙️ Account actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={signOut} className="rounded-2xl">
            <LogOut className="w-4 h-4 mr-2" />Log out
          </Button>
          <Button variant="destructive" className="rounded-2xl" onClick={() => toast("Contact support to delete your account", { icon: "ℹ️" })}>
            <Trash2 className="w-4 h-4 mr-2" />Delete account
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
