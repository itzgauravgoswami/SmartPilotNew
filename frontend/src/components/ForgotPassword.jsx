import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

// ── OTP digit input ───────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef());
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i].trim()) {
        const next = digits.map((d, idx) => idx === i ? ' ' : d).join('').trimEnd();
        onChange(next.replace(/ /g, ''));
      } else if (i > 0) {
        refs[i - 1].current?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { refs[i - 1].current?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { refs[i + 1].current?.focus(); return; }
  };

  const handleChange = (i, val) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const arr = digits.map(d => d.trim());
    arr[i] = char;
    onChange(arr.join('').replace(/ /g, ''));
    if (char && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onKeyDown={(e) => handleKey(i, e)}
          onChange={(e) => handleChange(i, e.target.value)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-base font-black rounded-xl border transition-all duration-200 outline-none bg-zinc-50 dark:bg-[#12131b]/60 text-zinc-800 dark:text-zinc-100
            ${d.trim()
              ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
            }`}
        />
      ))}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);   // 1=email, 2=otp, 3=new-password, 4=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('A 6-digit reset code has been sent to your inbox.');
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('A new reset code has been sent.');
      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Please enter the complete 6-digit code.');
    setError(''); setSuccessMsg('');
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return setError('Please fill in all fields.');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword, confirmPassword });
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
      if (err.message?.toLowerCase().includes('code') || err.message?.toLowerCase().includes('otp')) {
        setStep(2);
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-400'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const stepTitles = ['Reset your password', 'Check your inbox', 'Create new password', 'All done!'];
  const stepSubtitles = [
    "Enter your email and we'll send a 6-digit reset code.",
    `We sent a reset code to ${email}`,
    'Choose a strong, unique password for your account.',
    'Your password has been updated successfully.'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-44 bg-transparent relative z-10 w-full">
      {/* Outer Card */}
      <div className="w-full max-w-[1400px] bg-white dark:bg-[#0b0c13] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden auth-card-shadow grid grid-cols-1 md:grid-cols-12 md:min-h-[550px]">

        {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
        <div className="md:col-span-5 bg-gradient-to-b from-zinc-50 to-white dark:from-[#1c1410] dark:to-[#0a0b12] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/70 text-left relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <img src="/Assets/Logos/Logo (MAIN).png" alt="Smart Pilot" className="h-7 w-auto object-contain block dark:hidden" />
              <img src="/Assets/Logos/Logo (White).png" alt="Smart Pilot" className="h-7 w-auto object-contain hidden dark:block" />
              <span className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">Smart Pilot</span>
            </div>

            {/* Security Info Card */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xs border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-wider">Account Security</span>
              </div>

              <div className="space-y-2">
                {[
                  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'OTP sent to your registered email', done: step > 1 },
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Expires automatically in 10 mins', done: step > 2 },
                  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'All sessions cleared on reset', done: step === 4 },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs font-semibold px-1 transition-all duration-300 ${item.done ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-300 ${item.done ? 'text-orange-500' : 'text-zinc-300 dark:text-zinc-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.done ? 'M5 13l4 4L19 7' : item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <hr className="border-zinc-200 dark:border-zinc-800/80 my-3" />

              {/* Step progress */}
              <div className="flex items-center gap-1.5">
                {['Email', 'Verify', 'Reset', 'Done'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`flex flex-col items-center gap-0.5`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
                        step > i + 1 ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                        step === i + 1 ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-3 ring-orange-500/20' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        {step > i + 1 ? '✓' : i + 1}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wide ${step === i + 1 ? 'text-orange-500' : step > i + 1 ? 'text-zinc-400' : 'text-zinc-300 dark:text-zinc-700'}`}>{label}</span>
                    </div>
                    {i < 3 && <div className={`w-6 h-0.5 rounded-full mb-3 transition-all duration-500 ${step > i + 1 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Security tip */}
            <div className="mt-4 flex items-start gap-3 bg-orange-50 dark:bg-zinc-900/10 border border-orange-200/60 dark:border-zinc-900/30 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-800/40 flex items-center justify-center text-orange-500 dark:text-orange-400 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">Security Tip</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Never share your OTP with anyone. Smart Pilot will never ask for it.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-600 font-semibold mt-4 md:mt-0">
            © 2026 Smart Pilot.
          </div>
        </div>

        {/* ── RIGHT PANEL (Form) ─────────────────────────────────────────── */}
        <div className="md:col-span-7 py-5 px-8 md:px-10 flex flex-col justify-center text-left">
          {/* Back button */}
          <div className="mb-4">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 font-bold text-xs transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
            {stepTitles[step - 1]}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 font-medium mt-0.5 mb-4">
            {stepSubtitles[step - 1]}
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success banner */}
          {successMsg && !error && (
            <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1: Email ───────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              <div className="text-left">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer mt-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Sending...</> : 'Send Reset Code →'}
              </button>
              <div className="mt-4 text-center text-xs font-bold">
                <span className="text-zinc-500 dark:text-zinc-500">Remember your password? </span>
                <Link to="/login" className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors">
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP ─────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-3">
                  Enter 6-Digit Code
                </label>
                <OtpInput value={otp} onChange={setOtp} />
                <p className="text-[10px] text-zinc-400 font-semibold text-center mt-2">
                  Sent to <span className="text-orange-500 font-bold">{email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.replace(/\s/g, '').length < 6}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Verifying...</> : 'Verify Code →'}
              </button>
              <div className="flex items-center justify-between mt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                  className="text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-orange-500 hover:text-orange-600 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ─────────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-2.5">
              {/* New Password */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    {showNew
                      ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColors[strength] : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                      ))}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${strengthColors[strength].replace('bg-', 'text-')}`}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full bg-zinc-50 dark:bg-[#12131b]/60 border focus:outline-none rounded-xl py-2.5 pl-11 pr-10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200 focus:ring-1 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                        : confirmPassword && confirmPassword === newPassword
                        ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800/80 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    {showConfirm
                      ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer mt-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Resetting...</> : 'Reset Password →'}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ──────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50 flex items-center justify-center text-emerald-500 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">Password updated!</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">All active sessions have been signed out for your security. Please log in with your new password.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                Sign In with New Password →
              </button>
              <div className="text-center text-xs font-bold">
                <span className="text-zinc-500 dark:text-zinc-500">Don't have an account? </span>
                <Link to="/signup" className="text-orange-500 dark:text-orange-400 hover:text-orange-600 transition-colors">
                  Get Started free
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
