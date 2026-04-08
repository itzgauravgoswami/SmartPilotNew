import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, setToken, setLoggedIn } from '../utils/api';

export default function Signup() {
  const [step, setStep] = useState(1); // 1 = Enter Details, 2 = Verify Email OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Social registration data state
  const [oauthData, setOauthData] = useState(null); // { email, name, avatarUrl, provider, providerId }

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setLoggedIn(true);
      navigate('/dashboard', { replace: true });
      return;
    }

    const oauthSetup = searchParams.get('oauth_setup');
    if (oauthSetup === 'true') {
      const emailParam = searchParams.get('email');
      const nameParam = searchParams.get('name');
      const avatarUrlParam = searchParams.get('avatarUrl');
      const providerParam = searchParams.get('provider');
      const providerIdParam = searchParams.get('providerId');

      setOauthData({
        email: emailParam || '',
        name: nameParam || '',
        avatarUrl: avatarUrlParam || '',
        provider: providerParam || '',
        providerId: providerIdParam || ''
      });
    }
  }, []);

  const handleGoogleLogin = () => {
    if (!window.google) {
      setError('Google SDK not loaded yet. Please refresh the page and try again.');
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          try {
            setError('');
            setLoading(true);
            const data = await api.post('/auth/google-token', { accessToken: tokenResponse.access_token });
            if (data.requiresPassword) {
              setOauthData({
                email: data.email,
                name: data.name,
                avatarUrl: data.avatarUrl,
                provider: 'google',
                providerId: data.providerId
              });
              return;
            }
            setToken(data.token);
            setLoggedIn(true);
            navigate('/dashboard');
          } catch (err) {
            setError(err.message || 'Google sign-up failed.');
          } finally {
            setLoading(false);
          }
        }
      }
    });
    client.requestAccessToken();
  };

  const handleGitHubLogin = () => {
    sessionStorage.setItem('oauth_provider', 'github');
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(import.meta.env.VITE_APP_URL || window.location.origin);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${redirectUri}&state=github`;
  };

  const handleMicrosoftLogin = () => {
    sessionStorage.setItem('oauth_provider', 'microsoft');
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_APP_URL || window.location.origin}/login`);
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid%20profile%20email%20User.Read&state=microsoft`;
  };

  // Step 1: Submit Details to Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError('Please enter all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/send-register-otp', { name, email, password });
      setSuccessMsg(data.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Verification OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setError('Please enter the verification code.');

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/verify-register-otp', { email, otp });
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification code is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Social Signup by Choosing Password
  const handleSocialRegister = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return setError('All fields are required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/social-register', {
        name: oauthData.name,
        email: oauthData.email,
        password,
        confirmPassword,
        avatarUrl: oauthData.avatarUrl,
        provider: oauthData.provider,
        providerId: oauthData.providerId
      });
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-44 bg-transparent relative z-10 w-full">
      {/* Outer Card Container */}
      <div className="w-full max-w-[1400px] bg-white dark:bg-[#0b0c13] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden auth-card-shadow grid grid-cols-1 md:grid-cols-12 md:min-h-[550px]">
        
        {/* Left Sidebar (Progress Accent Panel) */}
        <div className="md:col-span-5 bg-gradient-to-b from-zinc-50 to-white dark:from-[#1c1410] dark:to-[#0a0b12] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/70 text-left relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div>
            {/* Header: Smart Pilot Logo and Brand Name */}
            <div className="flex items-center gap-2 mb-6">
              <img
                src="/Assets/Logos/Logo (MAIN).png"
                alt="Smart Pilot Logo"
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <img
                src="/Assets/Logos/Logo (White).png"
                alt="Smart Pilot Logo"
                className="h-7 w-auto object-contain hidden dark:block"
              />
              <span className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">
                Smart Pilot
              </span>
            </div>

            {/* Integration Setup Card */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xs border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.485V6.877a2 2 0 011.236-1.848l5.5-2.25a2 2 0 011.528 0l5.5 2.25A2 2 0 0118 6.877v8.608a2 2 0 01-1.236 1.848L11.316 20.155a2 2 0 01-1.316 0z" />
                  </svg>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-wider">Integration Setup</span>
                </div>
                <span className="text-[10px] text-orange-500 dark:text-orange-400 font-extrabold">
                  75% Connected
                </span>
              </div>

              {/* Progress Checklist items */}
              <div className="space-y-2 mb-3.5">
                {/* Item 1 (checked) */}
                <div className="flex items-start gap-2.5 text-xs text-zinc-500 font-semibold">
                  <span className="text-orange-500 dark:text-orange-400 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="line-through decoration-zinc-400/60 dark:decoration-zinc-700/80">Slack Integration Configured</span>
                </div>

                {/* Item 2 (checked) */}
                <div className="flex items-start gap-2.5 text-xs text-zinc-500 font-semibold">
                  <span className="text-orange-500 dark:text-orange-400 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="line-through decoration-zinc-400/60 dark:decoration-zinc-700/80">GitHub Webhook Synced</span>
                </div>

                {/* Item 3 (active selected dot) */}
                <div className="flex items-start gap-2.5 text-xs text-orange-700 dark:text-orange-300 font-bold bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/10 rounded-xl px-2.5 py-1">
                  <span className="text-orange-500 dark:text-orange-400 mt-0.5 animate-pulse">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                    </svg>
                  </span>
                  <span>AI Agent Orchestrator Active</span>
                </div>
              </div>

              {/* Glowing Orange Progress Bar */}
              <div className="w-full h-1.5 bg-orange-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/50" />
              </div>
            </div>

            {/* AI Orchestration Badge */}
            <div className="mt-4 flex items-start gap-3 bg-orange-50 dark:bg-zinc-900/10 border border-orange-200/60 dark:border-zinc-900/30 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-800/40 flex items-center justify-center text-orange-500 dark:text-orange-400 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">AI Orchestration</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Automate custom tasks and webhooks.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-600 font-semibold mt-4 md:mt-0">
            © 2026 Smart Pilot.
          </div>
        </div>

        {/* Right Side: Signup / OTP Verification / Choose Password */}
        <div className="md:col-span-7 py-4 px-8 md:px-10 flex flex-col justify-center text-left">
          {/* Back button */}
          <div className="mb-3">
            {step === 2 || oauthData ? (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOauthData(null);
                  setError('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold text-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to home
              </Link>
            )}
          </div>

          <div className="w-full">
            {oauthData ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
                  Choose a Password
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium mt-0.5 mb-4">
                  Complete your {oauthData.provider.charAt(0).toUpperCase() + oauthData.provider.slice(1)} registration by creating a secure password.
                </p>
              </>
            ) : step === 1 ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
                  Create your account
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium mt-0.5 mb-3">
                  Sign up today to start automating your workflow pipelines instantly.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
                  Verify Email
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium mt-0.5 mb-4">
                  Please enter the 6-digit verification code sent to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>.
                </p>
              </>
            )}

            {/* Social Logins (Only shown on Step 1 when not configuring password) */}
            {step === 1 && !oauthData && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-[#12131b] hover:bg-white dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-bold py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                {/* GitHub */}
                <button
                  onClick={handleGitHubLogin}
                  disabled={loading}
                  className="flex items-center justify-center border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-[#12131b] hover:bg-white dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-bold py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub
                </button>
                {/* Microsoft */}
                <button
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                  className="flex items-center justify-center border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-[#12131b] hover:bg-white dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-bold py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M0 0h11v11H0z"/>
                    <path fill="#81bc06" d="M12 0h11v11H12z"/>
                    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                    <path fill="#ffba08" d="M12 12h11v11H12z"/>
                  </svg>
                  Microsoft
                </button>
              </div>
            )}

            {/* Separator */}
            {step === 1 && !oauthData && (
              <div className="relative flex items-center justify-center mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800/80"></div>
                </div>
                <span className="relative bg-white dark:bg-[#0b0c13] px-3 text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
                  Or sign up with email
                </span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {successMsg && !error && (
              <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Render Forms */}
            {oauthData ? (
              <form onSubmit={handleSocialRegister} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={oauthData.name}
                    onChange={(e) => setOauthData({ ...oauthData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={oauthData.email}
                    onChange={(e) => setOauthData({ ...oauthData, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 px-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-650 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer mt-4 text-xs disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Complete Signup'}
                </button>
              </form>
            ) : step === 1 ? (
              /* Regular Signup Details Form */
              <form onSubmit={handleSendOtp} className="space-y-2">
                {/* Full Name */}
                <div className="text-left">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
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
                      className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="text-left">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 dark:text-zinc-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-650 hover:to-orange-700 text-white font-extrabold py-2 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer mt-3 text-xs disabled:opacity-50"
                >
                  {loading ? 'Sending Verification Code...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              /* OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-2-4h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#12131b]/60 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs font-semibold tracking-widest text-center font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs font-bold text-zinc-500 dark:text-zinc-500 pt-1">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-650 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer text-xs"
                >
                  {loading ? 'Verifying Code...' : 'Verify OTP & Finish'}
                </button>
              </form>
            )}

            {/* Footer Navigation Link */}
            {step === 1 && !oauthData && (
              <div className="mt-3 text-center text-xs font-bold">
                <span className="text-zinc-500 dark:text-zinc-500">Already have an account? </span>
                <Link
                  to="/login"
                  className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
