import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, setToken, setLoggedIn } from '../utils/api';
import DeviceLimitDialog from './DeviceLimitDialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceLimitInfo, setDeviceLimitInfo] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exchangeStarted = useRef(false);

  const exchangeGitHubCode = async (code) => {
    try {
      setError('');
      setLoading(true);
      const data = await api.post('/auth/github-token', { code });
      if (data.requiresPassword) {
        navigate(`/signup?oauth_setup=true&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}&avatarUrl=${encodeURIComponent(data.avatarUrl || '')}&provider=github&providerId=${encodeURIComponent(data.providerId)}`);
        return;
      }
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'GitHub sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const exchangeMicrosoftCode = async (code) => {
    try {
      setError('');
      setLoading(true);
      const data = await api.post('/auth/microsoft-token', { code });
      if (data.requiresPassword) {
        navigate(`/signup?oauth_setup=true&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}&avatarUrl=${encodeURIComponent(data.avatarUrl || '')}&provider=microsoft&providerId=${encodeURIComponent(data.providerId)}`);
        return;
      }
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Microsoft sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuthCode = async (provider, code) => {
    try {
      setLoading(true);
      await api.post('/auth/connect-oauth', { provider, code });
      navigate('/dashboard/settings', { 
        state: { activeTab: 'connections', toastMsg: `${provider} connected successfully!`, toastType: 'success' },
        replace: true
      });
    } catch (err) {
      navigate('/dashboard/settings', { 
        state: { activeTab: 'connections', toastMsg: err.message || `Failed to connect ${provider}.`, toastType: 'error' },
        replace: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setLoggedIn(true);
      navigate('/dashboard', { replace: true });
      return;
    }

    const code = searchParams.get('code');
    if (code && !exchangeStarted.current) {
      exchangeStarted.current = true;
      const state = searchParams.get('state');
      const provider = state || sessionStorage.getItem('oauth_provider');
      const isConnecting = state?.endsWith('-connect') || localStorage.getItem('token');

      if (isConnecting) {
        const connectProvider = state?.split('-')[0] || provider;
        handleConnectOAuthCode(connectProvider, code);
      } else {
        if (provider === 'github') {
          exchangeGitHubCode(code);
        } else if (provider === 'microsoft') {
          exchangeMicrosoftCode(code);
        }
        sessionStorage.removeItem('oauth_provider');
        // Clean query params
        navigate('/login', { replace: true });
      }
    }
  }, [searchParams]);

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
              navigate(`/signup?oauth_setup=true&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}&avatarUrl=${encodeURIComponent(data.avatarUrl || '')}&provider=google&providerId=${encodeURIComponent(data.providerId)}`);
              return;
            }
            if (data.deviceLimitReached) {
              setDeviceLimitInfo({
                plan: data.plan,
                maxDevices: data.maxDevices,
                activeSessions: data.activeSessions,
                loginType: 'google',
                payload: { accessToken: tokenResponse.access_token }
              });
              return;
            }
            setToken(data.token);
            setLoggedIn(true);
            navigate('/dashboard');
          } catch (err) {
            setError(err.message || 'Google sign-in failed.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.deviceLimitReached) {
        setDeviceLimitInfo({
          plan: data.plan,
          maxDevices: data.maxDevices,
          activeSessions: data.activeSessions,
          loginType: 'local',
          payload: { email, password }
        });
        return;
      }
      setToken(data.token);
      setLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLimit = async (selectedSessionId) => {
    if (!deviceLimitInfo) return;
    setError('');
    setLoading(true);
    const { loginType, payload } = deviceLimitInfo;
    setDeviceLimitInfo(null);
    try {
      let data;
      if (loginType === 'local') {
        data = await api.post('/auth/login', { ...payload, force: true, evictSessionId: selectedSessionId });
      } else if (loginType === 'google') {
        data = await api.post('/auth/google-token', { ...payload, force: true, evictSessionId: selectedSessionId });
      }
      if (data && data.token) {
        setToken(data.token);
        setLoggedIn(true);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Verification of session force-override failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-44 bg-transparent relative z-10 w-full">
      {/* Outer Card Container */}
      <div className="w-full max-w-[1400px] bg-white dark:bg-[#0b0c13] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden auth-card-shadow grid grid-cols-1 md:grid-cols-12 md:min-h-[550px]">

        {/* Left Sidebar – Orange Accent Panel */}
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

            {/* Prep Roadmap Card */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xs border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Dot indicator */}
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-wider">Prep Roadmap</span>
                </div>
                <span className="bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800/50 text-[10px] text-orange-600 dark:text-orange-400 font-extrabold px-2 py-0.5 rounded-full">
                  75% Done
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Task 1 – completed */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold px-1">
                  <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="line-through">LeetCode Top 150 Problems</span>
                </div>

                {/* Task 2 – completed */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold px-1">
                  <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="line-through">System Design Fundamentals</span>
                </div>

                {/* Task 3 – active/highlighted */}
                <div className="flex flex-col gap-1.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/10 text-orange-700 dark:text-orange-300 font-bold px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs">
                    <svg className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 animate-pulse flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>HR Behavioral Prep (AI simulated)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-orange-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>

              <hr className="border-zinc-200 dark:border-zinc-800/80 my-3" />

              <div className="flex items-center justify-between text-xs font-bold px-1">
                <span className="text-zinc-500">Placement Index:</span>
                <span className="text-orange-500 dark:text-orange-400">Cohort Top 12%</span>
              </div>
            </div>

            {/* AI Study Tracks Badge */}
            <div className="mt-4 flex items-start gap-3 bg-orange-50 dark:bg-zinc-900/10 border border-orange-200/60 dark:border-zinc-900/30 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-800/40 flex items-center justify-center text-orange-500 dark:text-orange-400 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">AI Study Tracks</h4>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Personalized checklists for placement prep.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-600 font-semibold mt-4 md:mt-0">
            © 2026 Smart Pilot.
          </div>
        </div>

        {/* Right Content Area (Form Panel) */}
        <div className="md:col-span-7 py-5 px-8 md:px-10 flex flex-col justify-center text-left">
          {/* Back to Home Button */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 font-bold text-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 font-medium mt-0.5 mb-4">
            Enter your credentials to access your dashboard.
          </p>

          {/* Social Logins */}
          <div className="grid grid-cols-3 gap-3 mb-3.5">
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

          {/* Separator */}
          <div className="relative flex items-center justify-center mb-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800/80"></div>
            </div>
            <span className="relative bg-white dark:bg-[#0b0c13] px-3 text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
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
                  className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="text-left">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-bold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
                  className="w-full bg-zinc-50 dark:bg-[#12131b]/60 border border-zinc-200 dark:border-zinc-800/80 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 cursor-pointer mt-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="mt-4 text-center text-xs font-bold">
            <span className="text-zinc-500 dark:text-zinc-500">Don't have an account? </span>
            <Link
              to="/signup"
              className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
            >
              Get Started free
            </Link>
          </div>
        </div>
      </div>

      {deviceLimitInfo && (
        <DeviceLimitDialog
          isOpen={!!deviceLimitInfo}
          plan={deviceLimitInfo.plan}
          maxDevices={deviceLimitInfo.maxDevices}
          activeSessions={deviceLimitInfo.activeSessions}
          onContinue={handleContinueLimit}
          onCancel={() => setDeviceLimitInfo(null)}
        />
      )}
    </div>
  );
}
