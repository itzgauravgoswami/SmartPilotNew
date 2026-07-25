import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

// Scroll-Reveal Wrapper
function Reveal({ children }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  )
}

const SectionDivider = () => (
  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent dark:via-orange-500/30" />
)

export default function HomePage() {
  const navigate = useNavigate()
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle OAuth code redirect forwarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const stateParam = params.get('state');
    if (codeParam) {
      let target = `/login?code=${codeParam}`;
      if (stateParam) target += `&state=${stateParam}`;
      navigate(target);
    }
  }, [navigate]);

  // Handle hash scrolling when navigating back from other pages
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const faqs = [
    {
      question: 'Is my company data safe with Smart Pilot?',
      answer: 'Yes, security is our core priority. Smart Pilot utilizes end-to-end industry-standard AES-256 encryption. We are fully SOC2 compliant and never train models on your private workspace data.',
    },
    {
      question: 'Which tools and platforms can I connect?',
      answer: 'We support over 100+ native integrations including GitHub, Slack, Jira, Figma, Notion, Google Workspace, Salesforce, and Discord. You can also connect custom systems using our Webhooks and REST API.',
    },
    {
      question: 'Is there a contract or can I cancel anytime?',
      answer: 'Smart Pilot is a month-to-month subscription. You can cancel your ₹21/month premium plan at any time with no penalties or hidden fees.',
    },
    {
      question: 'How do the Invoice Maker and Invoice History work?',
      answer: 'Our Invoice Maker allows you to design professional PDF invoices with customized company branding, customer inputs, and items. All generated documents are instantly archived in your Invoice History log, where you can search, view, or delete them anytime.',
    },
    {
      question: 'What modules are included in the Premium Plan?',
      answer: 'The ₹21/month Premium plan grants unrestricted access to all modules in the co-pilot suite: Invoice Maker & Archive, Sales Analytics Graphs, AI Chat Co-pilot, Workspace Task Planner, AI Campaign Emailer, and real-time Team Connect collaboration rooms.',
    },
    {
      question: 'Do you offer custom Enterprise setups?',
      answer: 'Yes! While our general Premium plan is ₹21/month, we can arrange dedicated VPC deployments and custom SLAs for enterprise operations. Please contact our support.',
    },
  ]

  return (
    <div className="min-h-screen bg-transparent text-zinc-800 dark:text-zinc-300 transition-colors duration-300 relative overflow-x-hidden">
      <div className="gridlines-container"></div>
      <div className="orange-glow"></div>

      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        className={`pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center transition-all duration-1000 ease-out transform ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-500/30 rounded-full px-4 py-1.5 mb-6 text-xs text-orange-600 dark:text-orange-400 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Smart Pilot 1.0 is officially live
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight max-w-4xl">
          Navigate Your Workflows with{' '}
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
            AI-powered Precision
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Smart Pilot automates your tasks, provides predictive analytics, and orchestrates all your tools on autopilot. Drive team productivity 10x faster.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto text-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Get Smart Pilot Premium
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto text-center border border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white text-zinc-800 dark:text-zinc-300 font-semibold px-8 py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300"
          >
            Explore Features
          </a>
        </div>
      </section>

      <SectionDivider />

      {/* About Us Section */}
      <Reveal>
        <section id="about" className="py-24 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col justify-center text-left">
                <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-2">Our Mission</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight">
                  Empowering founders and teams to manage business operations on autopilot
                </h2>
                <p className="mt-6 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm sm:text-base">
                  Smart Pilot was engineered by Gaurav Goswami to streamline the daily operations of freelancers, developers, and small business teams. Tired of hopping between scattered billing software, task checklists, email campaign writers, and chat apps, we consolidated everything into a single business co-pilot dashboard.
                </p>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm sm:text-base">
                  We believe that premium operations software shouldn't carry a heavy enterprise price tag. Smart Pilot democratizes team tools by providing professional invoicing, sales graphs, AI assistants, and team connect chat spaces in one unified premium layout at just ₹21/month.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {['Invoice Generator', 'AI Co-pilot Chat', 'Revenue Analytics', 'Team Connect Rooms'].map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-transform duration-300 hover:scale-105"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {[
                  { value: '1-Click', label: 'Invoice Generation' },
                  { value: '100%', label: 'Secure Archive Log' },
                  { value: '6+', label: 'Integrated Modules' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-xs transition-all duration-300 hover:shadow-md hover:shadow-orange-500/5 hover:-translate-y-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{stat.value}</span>
                    <span className="mt-2 text-[10px] font-bold text-zinc-700 dark:text-zinc-400">{stat.label}</span>
                  </div>
                ))}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs border border-orange-200/80 dark:border-orange-500/20 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm bg-orange-50/20 dark:bg-orange-950/10 transition-all duration-300 hover:shadow-md hover:shadow-orange-500/10 hover:-translate-y-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-orange-600 dark:text-orange-500">₹21</span>
                  <span className="mt-2 text-[10px] font-bold text-orange-700 dark:text-orange-400">Premium Pricing</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* Features Section */}
      <Reveal>
        <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-2 block">Premium Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Work Smarter. Automate the Rest.</h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Smart Pilot is equipped with a suite of modules designed to streamline invoicing, team communication, and productivity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
                tag: 'Billing & Invoices', title: 'Smart Invoice Architect',
                desc: 'Generate customized professional invoices instantly and manage them under a centralized, searchable history database.',
              },
              {
                icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                tag: 'AI Assistant', title: 'Integrated Co-pilot Chat',
                desc: 'Chat with an advanced conversational agent to draft templates, analyze metrics, answer queries, and coordinate daily tasks.',
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2',
                tag: 'Business Analytics', title: 'Sales & Revenue Charts',
                desc: 'Audit your metrics using real-time graphical analytics, customized timelines, and exportable financial overview charts.',
              },
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
                tag: 'Productivity', title: 'Task & Milestone Planner',
                desc: 'Define checklists, prioritize operations, assign key deadlines, and follow roadmap boards to keep work aligned.',
              },
              {
                icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2',
                tag: 'Marketing', title: 'AI-Powered Campaign Emailer',
                desc: 'Compose high-converting sales pitches, product updates, newsletters, and email responses with contextual AI assistance.',
              },
              {
                icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0zm2 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
                tag: 'Collaboration', title: 'Team Connect Hub',
                desc: 'Invite workspace team members, chat in shared channels, split workloads, and coordinate milestones simultaneously.',
              },
            ].map((card) => (
              <div key={card.title} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group hover:-translate-y-1 text-left">
                <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-6 border border-orange-100 dark:border-orange-900/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                  </svg>
                </div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">{card.tag}</span>
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mt-1">{card.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* How It Works */}
      <Reveal>
        <section id="how-it-works" className="py-24 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-2 block">Our Workflow</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Get Started In Three Simple Steps</h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                Setup your workspace and deploy advanced business automations in under five minutes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Register Company & Settings', desc: 'Initialize your workspace, set currency preferences, select local tax parameters, and setup your company profile.' },
                { num: '02', title: 'Utilize AI Business Tools', desc: 'Design professional invoices, draft marketing campaign emails, coordinate tasks, and converse with the co-pilot chat.' },
                { num: '03', title: 'Analyze Growth & Collaborate', desc: 'Invite teammates, track real-time analytics graphs, check complete billing histories, and scale operations smoothly.' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center p-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <span className="text-5xl font-extrabold text-orange-200 dark:text-orange-950/50 mb-4">{step.num}</span>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{step.title}</h3>
                  <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* Pricing */}
      <Reveal>
        <section id="pricing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-1 block">Simple Pricing</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Transparent Pricing</h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Start free or upgrade to unlock unlimited automated multi-agent execution pipelines.
            </p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Starter */}
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-full">Starter Plan</span>
                <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-2">Free Autopilot</h3>
                <p className="mt-1 text-2xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Perfect for individuals exploring basic automations.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">₹0</span>
                  <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">/month</span>
                </div>
                <hr className="w-full border-zinc-200/60 my-5" />
                <ul className="w-full space-y-2.5 text-2xs sm:text-xs font-semibold text-zinc-650 dark:text-zinc-300 mb-6">
                  {['1 device concurrent limit', '10 AI Campaign Emails / 24 hrs', '10 Workspace Tasks maximum', 'No Team Connect chat access', 'Standard community support access'].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/signup" className="w-full text-center border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-800 dark:text-zinc-300 font-bold py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 text-xs">
                Get Started Free
              </Link>
            </div>
            {/* Premium */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-[1px] shadow-xl shadow-orange-500/5 flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-[1.01] hover:-translate-y-1">
              <div className="bg-white dark:bg-zinc-900 rounded-[15px] p-6 sm:p-7 h-full flex flex-col justify-between">
                <div>
                  <span className="bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 font-extrabold text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-full">Smart Pilot Premium</span>
                  <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-2">Pro Autopilot</h3>
                  <p className="mt-1 text-2xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Unrestricted access to all tools, templates, and agents.</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">₹21</span>
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">/month</span>
                  </div>
                  <hr className="w-full border-zinc-200/80 my-5" />
                  <ul className="w-full space-y-2.5 text-2xs sm:text-xs font-semibold text-zinc-650 dark:text-zinc-300 mb-6">
                    {['2 devices concurrent limit', 'Unlimited AI Campaign Emails', 'Unlimited Workspace Tasks', 'Full Team Connect chat enabled', 'Priority Slack & email expert agent support', 'Custom webhooks & visual autopilot builders'].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <svg className="h-4.5 w-4.5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/signup" className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-0.5 text-xs">
                  Get Premium Access
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* FAQs */}
      <Reveal>
        <section id="faqs" className="py-24 bg-white/40 dark:bg-transparent backdrop-blur-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-2 block">Help Center</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">Can't find what you are looking for? Contact our friendly support team.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 bg-white/60 dark:bg-zinc-900/60 shadow-2xs hover:shadow-xs">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-zinc-950 dark:text-zinc-50 focus:outline-none transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 text-sm sm:text-base"
                  >
                    <span>{faq.question}</span>
                    <svg className={`h-5 w-5 text-zinc-500 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180 text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-40 border-t border-zinc-200 dark:border-zinc-800' : 'max-h-0'}`}>
                    <p className="p-5 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/80">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* Meet the Founder */}
      <Reveal>
        <section id="founder" className="py-24 bg-transparent max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-800/60 p-8 sm:p-12 rounded-3xl shadow-xs transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Image Container with Glow/Tilt */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative group">
                  {/* Outer gradient border with glow effect */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  
                  {/* Styled Image Wrapper */}
                  <div className="relative bg-white dark:bg-zinc-950 p-2 rounded-2xl">
                    <img
                      src="/founder/photo.png"
                      alt="Gaurav Goswami"
                      className="w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-xl transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              </div>

              {/* Founder Information */}
              <div className="lg:col-span-7 flex flex-col justify-center text-left">
                <span className="text-orange-600 dark:text-orange-500 font-extrabold tracking-wider text-xs uppercase mb-2">Founder Profile</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight mb-2">
                  Gaurav Goswami
                </h2>
                <h3 className="text-lg font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent mb-4">
                  MERN and GenAI Developer
                </h3>
                
                <p className="text-zinc-650 dark:text-zinc-400 leading-relaxed text-sm sm:text-base mb-6">
                  Gaurav is the visionary behind Smart Pilot. Specializing in building scalable full-stack systems using the MERN stack and crafting intelligent integrations with Generative AI models, he engineered Smart Pilot to simplify daily workspace workflows and put repetitive tasks on autopilot.
                </p>

                {/* Social links grid */}
                <div className="flex flex-wrap gap-3">
                  {/* Portfolio */}
                  <a
                    href="https://gauravgoswami.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    Portfolio
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com/in/itzgauravgoswami"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </a>

                  {/* GitHub */}
                  <a
                    href="https://github.com/itzgauravgoswami"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://instagram.com/itzgauravgoswami"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </Reveal>

      <SectionDivider />

      {/* Footer */}
      <footer className="bg-zinc-100/40 dark:bg-zinc-950/40 backdrop-blur-xs text-zinc-600 dark:text-zinc-400 pt-16 pb-12 mt-12">
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
