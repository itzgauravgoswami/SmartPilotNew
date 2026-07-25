import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-transparent text-zinc-800 dark:text-zinc-300 relative flex flex-col justify-between w-full transition-colors duration-300 overflow-hidden">
      {/* Background patterns */}
      <div className="gridlines-container"></div>
      <div className="orange-glow"></div>

      {/* Real Navbar */}
      <Navbar />

      {/* Central Simple 404 Design */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 z-10">
        <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 select-none drop-shadow-xs">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-405 max-w-md mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-98 text-xs sm:text-sm"
        >
          Go Back Home
        </Link>
      </main>

      {/* Real Footer */}
      <footer className="bg-zinc-100/40 dark:bg-zinc-950/40 backdrop-blur-xs text-zinc-600 dark:text-zinc-400 pt-16 pb-12 mt-12 border-t border-zinc-200/30 dark:border-zinc-800/30 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-4 flex flex-col items-start text-left">
              <Link to="/" className="flex items-center gap-2 mb-4 group transition-transform duration-200 hover:scale-[1.01]">
                <img src="/Assets/Logos/Logo (MAIN).png" alt="SmartPilot Logo" className="h-8 w-auto object-contain block dark:hidden" />
                <img src="/Assets/Logos/Logo (White).png" alt="SmartPilot Logo" className="h-8 w-auto object-contain hidden dark:block" />
                <span className="font-extrabold text-lg text-zinc-950 dark:text-zinc-50 tracking-tight">Smart Pilot</span>
              </Link>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                Next-generation automated agent systems that connect workspace tools, streamline status updates, and optimize workflow efficiency on autopilot.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  { title: 'Twitter', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { title: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z' },
                ].map((social) => (
                  <a key={social.title} href="#" className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all duration-200 hover:-translate-y-0.5" title={social.title}>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={social.path} /></svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 text-left">
              <h4 className="text-zinc-950 dark:text-zinc-50 font-bold text-xs uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {['#features', '#pricing', '#how-it-works', '#faqs'].map((href, i) => (
                  <li key={href}><a href={href} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-150">{['Features', 'Pricing Plan', 'How It Works', 'FAQs'][i]}</a></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 text-left">
              <h4 className="text-zinc-950 dark:text-zinc-50 font-bold text-xs uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {['About Us', 'Careers', 'Our Blog', 'Contact Us'].map((name) => (
                  <li key={name}><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-150">{name}</a></li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-4 text-left flex flex-col justify-start">
              <h4 className="text-zinc-950 dark:text-zinc-50 font-bold text-xs uppercase tracking-wider mb-4">Newsletter</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">Stay updated with the latest AI autopilot techniques and workflow guides.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 max-w-sm w-full">
                <input type="email" placeholder="Enter email address" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 w-full placeholder-zinc-400 dark:placeholder-zinc-500 shadow-2xs transition-all duration-200" required />
                <button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold p-2 rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </form>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <p>&copy; {new Date().getFullYear()} Smart Pilot. All rights reserved.</p>
              <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold text-emerald-700 dark:text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                All Systems Operational
              </div>
            </div>
            <div className="flex gap-3">
              <a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
