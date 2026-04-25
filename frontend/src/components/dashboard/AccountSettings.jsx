import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, setToken, setLoggedIn } from "../../utils/api";
import {
  User, Shield, Palette, AlertTriangle, Camera, Eye, EyeOff,
  Monitor, Smartphone, Globe, LogOut, Trash2, Check, X,
  Sun, Moon, RefreshCw, Save, Lock, Mail, AtSign, FileText,
  Wifi, Clock, CreditCard, Sparkles, Zap
} from "lucide-react";

const TABS = [
  { id: "profile",     label: "Profile",     icon: User },
  { id: "security",    label: "Security",    icon: Shield },
  { id: "billing",     label: "Subscription", icon: CreditCard },
  { id: "connections", label: "Connections",  icon: Globe },
  { id: "appearance",  label: "Appearance",  icon: Palette },
  { id: "danger",      label: "Danger Zone", icon: AlertTriangle },
];

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold border animate-in fade-in slide-in-from-bottom-4 ${
      type === "success"
        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
    }`}>
      {type === "success" ? <Check size={15} /> : <X size={15} />}
      {msg}
    </div>
  );
}

function SectionCard({ title, desc, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-5">
      {(title || desc) && (
        <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          {title && <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{title}</h3>}
          {desc && <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function Input({ icon: Icon, readOnly, ...props }) {
  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
      readOnly
        ? "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/50 text-zinc-400 cursor-not-allowed"
        : "bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 focus-within:border-orange-400 dark:focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10"
    }`}>
      {Icon && <Icon size={14} className="text-zinc-400 shrink-0" />}
      <input
        readOnly={readOnly}
        className="flex-1 bg-transparent outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-[13px] font-semibold min-w-0"
        {...props}
      />
    </div>
  );
}

/* Profile Tab */
function ProfileTab({ user, onUpdate, showToast }) {
  const [form, setForm] = useState({
    name:      user?.name      || "",
    bio:       user?.bio       || "",
    domain:    user?.domain    || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put("/user/profile", form);
      onUpdate({ ...user, ...updated });
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        headers,
        body: formData,
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Avatar upload failed");
      }
      setForm(p => ({ ...p, avatarUrl: resData.avatarUrl }));
      onUpdate({ ...user, avatarUrl: resData.avatarUrl });
      showToast("Profile picture uploaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload photo.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm(p => ({ ...p, avatarUrl: "" }));
    showToast("Avatar cleared. Save changes to finalize.", "success");
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" desc="Update your display name, bio, and upload a profile photo.">
        <div className="flex items-center gap-4 pb-2">
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()} 
            className="relative cursor-pointer group shrink-0"
            title="Click to upload new photo"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden relative">
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display="none"; }} />
                : <span className="text-2xl font-black text-white">{(form.name || "U")[0].toUpperCase()}</span>
              }
              {uploading && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <RefreshCw size={18} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Camera size={10} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div>
            <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{form.name || "Your Name"}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                user?.plan === "Premium" || user?.plan === "Pro"
                  ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              }`}>{user?.plan || "Free"} Plan</span>
              {form.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-650 hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input icon={User} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
          </Field>
          <Field label="Email Address">
            <Input icon={Mail} value={user?.email || ""} readOnly />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Domain / Website">
              <Input icon={Globe} value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="yourwebsite.com" />
            </Field>
          </div>
        </div>

        <Field label="Bio">
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
            <FileText size={14} className="text-zinc-400 shrink-0 mt-0.5" />
            <textarea rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell others about yourself..." className="flex-1 bg-transparent outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-[13px] font-semibold resize-none min-w-0" />
          </div>
        </Field>

        <div className="flex justify-end pt-1">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Account Information" desc="Read-only details about your account.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account ID"><Input icon={AtSign} value={String(user?.id || "")} readOnly /></Field>
          <Field label="Provider"><Input icon={Shield} value={user?.provider || "email"} readOnly /></Field>
          <Field label="Member Since"><Input icon={Clock} value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : ""} readOnly /></Field>
          <Field label="Email Verified">
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-bold ${user?.isEmailVerified ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-700/40 text-red-500"}`}>
              {user?.isEmailVerified ? <Check size={13} /> : <X size={13} />}
              {user?.isEmailVerified ? "Verified" : "Not Verified"}
            </div>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

/* Security Tab */
function SecurityTab({ user, showToast }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [saving, setSaving] = useState(false);
  const [evicting, setEvicting] = useState(null);
  const [sessions, setSessions] = useState(user?.activeSessions || []);

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) { showToast("New passwords do not match.", "error"); return; }
    if (form.newPassword.length < 8) { showToast("Password must be at least 8 characters.", "error"); return; }
    setSaving(true);
    try {
      const res = await api.post("/user/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast(res.message || "Password changed! Other sessions terminated.", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.message || "Failed to change password.", "error");
    } finally { setSaving(false); }
  };

  const handleEvict = async (sessionId) => {
    setEvicting(sessionId);
    try {
      await api.post("/user/sessions/evict", { sessionId });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      showToast("Session terminated.", "success");
    } catch (err) {
      showToast(err.message || "Failed to terminate session.", "error");
    } finally { setEvicting(null); }
  };

  const pwStrength = form.newPassword.length;

  return (
    <div className="space-y-5">
      <SectionCard title="Change Password" desc="Use a strong password you do not use elsewhere.">
        <div className="space-y-4">
          {[
            { field: "currentPassword", label: "Current Password" },
            { field: "newPassword", label: "New Password" },
            { field: "confirmPassword", label: "Confirm New Password" },
          ].map(({ field, label }) => (
            <Field key={field} label={label}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                <Lock size={14} className="text-zinc-400 shrink-0" />
                <input type={show[field] ? "text" : "password"} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder="••••••••" className="flex-1 bg-transparent outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-[13px] font-semibold min-w-0" />
                <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  {show[field] ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </Field>
          ))}

          {form.newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    pwStrength >= i * 3
                      ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-orange-400" : "bg-emerald-400"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-zinc-400">{pwStrength < 4 ? "Too short" : pwStrength < 7 ? "Weak" : pwStrength < 10 ? "Fair" : "Strong"}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-1">
          <button onClick={handleChangePassword} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions" desc="Devices currently signed into your account.">
        <div className="space-y-3">
          {sessions.length === 0 && <p className="text-xs text-zinc-400 text-center py-6">No active sessions found.</p>}
          {sessions.map(session => (
            <div key={session.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${session.isCurrent ? "border-orange-200 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${session.isCurrent ? "bg-orange-100 dark:bg-orange-950/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                {session.deviceType === "mobile" ? <Smartphone size={16} className="text-zinc-400" /> : <Monitor size={16} className="text-zinc-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 truncate">{session.deviceName || session.browser || "Unknown Device"}</p>
                  {session.isCurrent && <span className="text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Current</span>}
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{[session.os, session.browser].filter(Boolean).join(" · ")} · {session.ipAddress}</p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5"><Wifi size={9} />Last active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : "Unknown"}</p>
              </div>
              {!session.isCurrent && (
                <button onClick={() => handleEvict(session.id)} disabled={evicting === session.id} className="shrink-0 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-700/30 cursor-pointer transition-all" title="Terminate session">
                  {evicting === session.id ? <RefreshCw size={12} className="animate-spin" /> : <LogOut size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* Appearance Tab */
function AppearanceTab({ isDark, toggleTheme }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Theme" desc="Choose your preferred color scheme. Your selection is saved automatically.">
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "light", label: "Light", icon: Sun, iconColor: "text-amber-500", desc: "Clean and bright", active: !isDark,
              preview: <div className="w-full h-20 rounded-xl bg-white border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                <div className="h-4 bg-zinc-100 border-b border-zinc-200 flex items-center px-2 gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /><div className="w-1.5 h-1.5 rounded-full bg-green-400" /></div>
                <div className="flex flex-1 gap-1 p-1.5"><div className="w-8 bg-zinc-100 rounded" /><div className="flex-1 space-y-1"><div className="h-2 bg-zinc-200 rounded w-3/4" /><div className="h-1.5 bg-zinc-100 rounded w-1/2" /></div></div>
              </div>
            },
            { id: "dark", label: "Dark", icon: Moon, iconColor: "text-indigo-400", desc: "Easy on the eyes", active: isDark,
              preview: <div className="w-full h-20 rounded-xl bg-zinc-900 border border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                <div className="h-4 bg-zinc-800 border-b border-zinc-700 flex items-center px-2 gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><div className="w-1.5 h-1.5 rounded-full bg-green-500" /></div>
                <div className="flex flex-1 gap-1 p-1.5"><div className="w-8 bg-zinc-800 rounded" /><div className="flex-1 space-y-1"><div className="h-2 bg-zinc-700 rounded w-3/4" /><div className="h-1.5 bg-zinc-800 rounded w-1/2" /></div></div>
              </div>
            },
          ].map(theme => (
            <button key={theme.id} onClick={() => { if (theme.id === "light" && isDark) toggleTheme(); if (theme.id === "dark" && !isDark) toggleTheme(); }}
              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${theme.active ? "border-orange-400 bg-orange-50/30 dark:bg-orange-950/10" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}>
              <div className="mb-3">{theme.preview}</div>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5`}><theme.icon size={13} className={theme.iconColor} />{theme.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{theme.desc}</p>
                </div>
                {theme.active && <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30"><Check size={10} className="text-white" /></div>}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* Danger Zone Tab */
function DangerTab() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const requiredText = "DELETE MY ACCOUNT";
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== requiredText) return;
    setLoading(true);
    try {
      await api.delete('/auth/delete-account');
      setToken(null);
      setLoggedIn(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-red-600 dark:text-red-400">Delete Account</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">Permanently delete your account and all data. <strong className="text-zinc-700 dark:text-zinc-300">This cannot be undone.</strong></p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-700/30 rounded-xl p-4 space-y-2 mt-1">
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400">What will be permanently deleted:</p>
          <ul className="text-[11px] text-red-500 dark:text-red-400 space-y-1">
            {["All invoices and billing history", "Customer and product data", "Task lists and notes", "Company profile and settings", "All active sessions"].map(item => (
              <li key={item} className="flex items-center gap-1.5"><X size={10} />{item}</li>
            ))}
          </ul>
        </div>
        <Field label={`Type "${requiredText}" to confirm`}>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={requiredText} className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-700/40 bg-white dark:bg-zinc-800/40 text-zinc-800 dark:text-zinc-100 text-[13px] font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 placeholder-zinc-300 dark:placeholder-zinc-600 transition-all" />
        </Field>
        <button disabled={confirmText !== requiredText || loading} onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/20">
          <Trash2 size={12} />{loading ? 'Deleting Account...' : 'Permanently Delete Account'}
        </button>
      </SectionCard>
    </div>
  );
}

/* Billing / Subscription Tab */
function BillingTab({ user, onUpdate, showToast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    const fetchLogoAsBase64 = async () => {
      try {
        const response = await fetch(encodeURI("/Assets/Logos/Logo (MAIN).png"));
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load logo as base64", err);
      }
    };
    fetchLogoAsBase64();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get('/payment/plans');
        setPlans(res.plans || []);
      } catch (err) {
        console.error("Failed to load plans", err);
        showToast("Failed to fetch available subscription plans.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId) => {
    setUpgradingPlan(planId);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast("Failed to load Razorpay payment SDK. Please check connection.", "error");
        return;
      }

      const orderRes = await api.post('/payment/create-order', { plan: planId });

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Smart Pilot",
        image: logoBase64 || encodeURI(window.location.origin + "/Assets/Logos/Logo (MAIN).png"),
        description: `Upgrade to ${planId} Subscription`,
        order_id: orderRes.orderId,
        prefill: {
          name: orderRes.user?.name || "",
          email: orderRes.user?.email || ""
        },
        theme: {
          color: "#f97316"
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            });
            if (verifyRes.success) {
              showToast(`Successfully upgraded to ${planId}!`, "success");
              onUpdate({ plan: planId, maxDevices: verifyRes.maxDevices });
            } else {
              showToast("Payment verification failed.", "error");
            }
          } catch (verifyErr) {
            showToast(verifyErr.message || "Payment verification failed.", "error");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.message || "Checkout failed. Please try again.", "error");
    } finally {
      setUpgradingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[250px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={28} />
          <p className="text-[11px] font-black tracking-wider uppercase text-zinc-500">Loading Billing Node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Manage Subscription" desc="Unlock limits on tasks, device syncing, campaign dispatch lists, and real-time team chats.">
        <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/35 rounded-2xl flex items-center justify-between text-left animate-fade-in">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Active Workspace Plan</p>
            <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{user?.plan || "Starter"} Plan</h4>
          </div>
          <span className="text-[9px] font-black uppercase bg-orange-500 text-white px-3 py-1.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
            <Zap size={10} /> Active Subscription
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {plans.map(p => {
            const isCurrent = user?.plan === p.id;
            const isFree = p.price === 0;

            return (
              <div 
                key={p.id} 
                className={`border rounded-2xl p-5 flex flex-col justify-between text-left transition-all ${
                  isCurrent 
                    ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 ring-1 ring-orange-500/30' 
                    : 'border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isCurrent 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>{p.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-500 flex items-center gap-0.5">
                        <Check size={11} /> Current Plan
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-baseline">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">₹{p.price}</span>
                    <span className="ml-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">/month</span>
                  </div>

                  <hr className="w-full border-zinc-100 dark:border-zinc-850/65 my-4" />

                  <ul className="space-y-2 text-2xs sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-6">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-tight">
                        <Check size={13} className="text-orange-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!isCurrent && !isFree && (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    disabled={upgradingPlan !== null}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-55 text-white font-black text-[11px] tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {upgradingPlan === p.id ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        <span>Upgrade Workspace</span>
                      </>
                    )}
                  </button>
                )}
                
                {isFree && !isCurrent && (
                  <div className="w-full text-center py-2 text-2xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                    Starter Free Package
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

/* Connections Tab */
function ConnectionsTab({ user, onUpdate, showToast }) {
  const [connecting, setConnecting] = useState(null);
  
  const handleDisconnect = async (provider) => {
    try {
      setConnecting(provider);
      await api.post("/auth/disconnect-oauth", { provider });
      const updatedUser = await api.get("/user/me");
      onUpdate(updatedUser);
      showToast(`${provider} account disconnected!`, "success");
    } catch (err) {
      showToast(err.message || "Failed to disconnect account.", "error");
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectGoogle = () => {
    if (!window.google) {
      showToast("Google SDK not loaded. Please try again.", "error");
      return;
    }
    setConnecting("google");
    const client = google.accounts.oauth2.initTokenClient({
      client_id: "742734379333-lkpfj9l8l9mtgmc626bcducisc2rs343.apps.googleusercontent.com",
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          try {
            await api.post('/auth/connect-oauth', { provider: 'google', accessToken: tokenResponse.access_token });
            const updatedUser = await api.get('/user/me');
            onUpdate(updatedUser);
            showToast("Google account connected successfully!", "success");
          } catch (err) {
            showToast(err.message || "Failed to connect Google account.", "error");
          } finally {
            setConnecting(null);
          }
        } else {
          setConnecting(null);
        }
      }
    });
    client.requestAccessToken();
  };

  const handleConnectGitHub = () => {
    setConnecting("github");
    sessionStorage.setItem('oauth_provider', 'github');
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(import.meta.env.VITE_APP_URL || window.location.origin);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${redirectUri}&state=github-connect`;
  };

  const handleConnectMicrosoft = () => {
    setConnecting("microsoft");
    sessionStorage.setItem('oauth_provider', 'microsoft');
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_APP_URL || window.location.origin}/login`);
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid%20profile%20email%20User.Read&state=microsoft-connect`;
  };

  const providers = [
    {
      id: "google",
      name: "Google",
      desc: "Sign in using your Google account",
      connected: !!user?.googleId,
      action: handleConnectGoogle,
      logo: (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.3-4.74 3.3-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )
    },
    {
      id: "github",
      name: "GitHub",
      desc: "Sign in using your GitHub account",
      connected: !!user?.githubId,
      action: handleConnectGitHub,
      logo: (
        <svg className="w-4.5 h-4.5 shrink-0 fill-current text-zinc-900 dark:text-zinc-50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      )
    },
    {
      id: "microsoft",
      name: "Microsoft",
      desc: "Sign in using your Microsoft account",
      connected: !!user?.microsoftId,
      action: handleConnectMicrosoft,
      logo: (
        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0h11v11H0z" fill="#F25022"/>
          <path d="M12 0h11v11H12z" fill="#7FBA00"/>
          <path d="M0 12h11v11H0z" fill="#00A4EF"/>
          <path d="M12 12h11v11H12z" fill="#FFB900"/>
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <SectionCard>
        {/* Custom Header with Shield Icon */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/25 text-orange-500 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">Connected Accounts</h3>
            <p className="text-xs font-bold text-zinc-500 mt-0.5">Link social profiles to sign in with them</p>
          </div>
        </div>

        {/* Social Accounts List */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {providers.map((p) => (
            <div key={p.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-3xs">
                  {p.logo}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[13px] font-black text-zinc-800 dark:text-zinc-50">{p.name}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">{p.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 shrink-0 pl-14 sm:pl-0">
                {p.connected ? (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Connected
                    </span>
                    {user?.provider !== p.id && (
                      <button
                        onClick={() => handleDisconnect(p.id)}
                        disabled={connecting !== null}
                        className="text-[11px] font-black text-red-500 hover:text-red-600 transition-all cursor-pointer disabled:opacity-55 hover:underline"
                      >
                        {connecting === p.id ? "Disconnecting..." : "Disconnect"}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={p.action}
                    disabled={connecting !== null}
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[11px] uppercase tracking-wider rounded-full transition-all shadow-md shadow-orange-500/15 cursor-pointer disabled:opacity-50"
                  >
                    {connecting === p.id ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* Main Component */
export default function AccountSettings({ user, onUpdate, isDark, toggleTheme }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return "profile";
  });
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    if (location.state && location.state.toastMsg) {
      showToast(location.state.toastMsg, location.state.toastType || "success");
      // Clean history state so toast doesn't show again on manual reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Account Settings</h2>
        <p className="text-xs text-zinc-500 mt-1">Manage your profile, security, and preferences.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === "danger";
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? isDanger ? "bg-red-500 text-white shadow-md" : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200/80 dark:border-zinc-700"
                  : isDanger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}>
              <tab.icon size={12} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "profile"     && <ProfileTab     user={user} onUpdate={onUpdate} showToast={showToast} />}
      {activeTab === "security"    && <SecurityTab    user={user} showToast={showToast} />}
      {activeTab === "billing"     && <BillingTab     user={user} onUpdate={onUpdate} showToast={showToast} />}
      {activeTab === "connections" && <ConnectionsTab user={user} onUpdate={onUpdate} showToast={showToast} />}
      {activeTab === "appearance"  && <AppearanceTab  isDark={isDark} toggleTheme={toggleTheme} />}
      {activeTab === "danger"      && <DangerTab />}

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
