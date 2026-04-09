import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  // Synchronize scrolling states
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync theme selection on client load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const location = useLocation()
  const isHome = location.pathname === '/'

  const navLinks = [
    { name: 'Home', href: isHome ? '#home' : '/#home' },
    { name: 'About Us', href: isHome ? '#about' : '/#about' },
    { name: 'Features', href: isHome ? '#features' : '/#features' },
    { name: 'How It Works', href: isHome ? '#how-it-works' : '/#how-it-works' },
    { name: 'Pricing', href: isHome ? '#pricing' : '/#pricing' },
    { name: 'FAQs', href: isHome ? '#faqs' : '/#faqs' },
  ]

  return (
    <nav className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-4">
      {/* Outer border container with orange gradient and 1px padding */}
      <div
        className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-[1px] shadow-md transition-all duration-300"
      >
        {/* Inner layout container with white/dark backdrop */}
        <div
          className={`w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[15px] px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            scrolled ? 'py-0.5' : 'py-1.5'
          }`}
        >
          <div className="flex items-center justify-between h-12">
            {/* Logo & Name */}
            <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
                <img
                  src={isDark ? '/Assets/Logos/Logo (White).png' : '/Assets/Logos/Logo (MAIN).png'}
                  alt="SmartPilot Logo"
                  className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="font-extrabold text-lg text-zinc-950 dark:text-zinc-50 tracking-tight transition-colors duration-200">
                  Smart Pilot
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 font-semibold text-xs transition-all duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-orange-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Desktop Theme Switcher & CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                type="button"
                className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                ) : (
                  <svg className="h-4.5 w-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <Link
                to="/login"
                className="text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 font-semibold text-xs px-2 py-1.5 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-orange-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Actions Container (Hamburger & Theme toggle) */}
            <div className="md:hidden flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                type="button"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
              >
                {isDark ? (
                  <svg className="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                ) : (
                  <svg className="h-4.5 w-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center p-1.5 rounded-md text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-colors duration-200"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg
                    className="h-5 w-5 transition-transform duration-300 rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen ? 'max-h-screen opacity-100 mt-1 pb-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95' : 'max-h-0 opacity-0'
            }`}
            id="mobile-menu"
          >
            <div className="pt-2 space-y-1 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium text-sm py-2 border-b border-zinc-100 dark:border-zinc-800 transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 font-semibold py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2 rounded-xl shadow-md hover:shadow-orange-500/25 transition-all duration-200 text-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
