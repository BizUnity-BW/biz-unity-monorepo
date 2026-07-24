import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import ThemeToggle from '../components/ui/ThemeToggle';

// ─── Slider data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    image: '../../public/slides/catering.jpg',
    gradient: 'from-[#1a0a00] via-[#2d1500] to-[#0a0a0a]',
    eyebrow: 'Customer Management',
    title: 'Know every client,\nnever miss a deal.',
    subtitle: 'Store contacts, track history and build lasting relationships   all in one place.',
  },
  {
    image: '../../public/slides/cows.jpg',
    gradient: 'from-[#000d1a] via-[#001933] to-[#0a0a0a]',
    eyebrow: 'Quotations & Invoicing',
    title: 'Send professional\ndocuments in seconds.',
    subtitle: 'Create branded quotations, convert them to invoices and get paid faster.',
  },
  {
    image: '../../public/slides/disenke.jpg',
    gradient: 'from-[#0a1a00] via-[#0d2600] to-[#0a0a0a]',
    eyebrow: 'Payment Tracking',
    title: 'Every payment.\nAccounted for.',
    subtitle:
      'Log payments against invoices, monitor outstanding balances and close your books with confidence.',
  },
  {
    image: '../../public/slides/driedfood.jpg',
    gradient: 'from-[#1a0010] via-[#26001a] to-[#0a0a0a]',
    eyebrow: 'Multi-Role Teams',
    title: 'Your team,\nyour rules.',
    subtitle:
      'Assign owners, managers and sales roles   each with the access they need and nothing more.',
  },
];

const FEATURES = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    title: 'Customer Management',
    description:
      'Centralise all your customer contacts, communication history and deal status in a single, searchable record.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    title: 'Quotations & Invoices',
    description:
      'Draft professional quotations, get client sign-off and convert to invoices with a single click. Numbered, branded, done.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
    title: 'Payment Tracking',
    description:
      'Record payments against invoices, flag overdue accounts and know exactly where your cash flow stands   any time.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    title: 'Role-Based Access',
    description:
      'Owners, managers and sales reps each get the right level of access. Your data stays yours   always isolated per organisation.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      </svg>
    ),
    title: 'Live Dashboard',
    description:
      'One view of your business   outstanding invoices, recent payments, top customers and pipeline at a glance.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
        />
      </svg>
    ),
    title: 'Cloud-First, Always On',
    description:
      'Access your business data from any device, anywhere. Deployed on enterprise infrastructure   fast, secure and always available.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up in under two minutes. No credit card required.',
  },
  {
    number: '02',
    title: 'Set up your company',
    description:
      'Add your company details, logo and preferred currency once. They appear on every document you send.',
  },
  {
    number: '03',
    title: 'Start managing',
    description:
      'Add customers, send your first quotation and track payments   all before your next meeting.',
  },
];

const STATS = [
  { value: 'P0', label: 'Core Priority' },
  { value: '< 5 min', label: 'Onboarding Time' },
  { value: '3-in-1', label: 'Quotes · Invoices · Payments' },
  { value: '100%', label: 'Data Isolation Per Org' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const logo = theme === 'dark' ? '/BizUnity_Logo_BB.png' : '/BizUnity_Logo_BB.png';
  const isLight = theme === 'light';

  // Scroll-aware nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-advance slider
  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, isPaused]);

  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text)] min-h-screen font-sans">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--color-nav-scrolled)] backdrop-blur-md border-b border-[var(--color-border)] py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <img src={logo} alt="BizUnity" className="h-30 w-auto" />

          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
            <a href="#features" className="hover:text-amber-500 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-amber-500 transition-colors">
              How it works
            </a>
            <a href="#about" className="hover:text-amber-500 transition-colors">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,196,66,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,196,66,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Gold radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Built for African SMEs
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-[var(--color-text)]">
            Your Business,{' '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Unified.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage customers, send professional quotations, issue invoices and track every payment
            in one platform built for the way African businesses actually work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base px-8 py-4 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
            >
              Start for free
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[var(--color-border-strong)] hover:border-amber-500/50 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium text-base px-8 py-4 rounded-xl transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-border)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[var(--color-bg)] px-6 py-5 text-center">
                <div className="text-2xl font-bold text-amber-500 mb-1">{s.value}</div>
                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--color-text-faintest)] text-xs animate-bounce">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── IMAGE SLIDER ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-6">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-amber-500/70 font-semibold mb-2">
            What BizUnity does for you
          </p>
          <h2 className="text-center text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-10">
            One platform. Every workflow.
          </h2>
        </div>

        {/* Slides   always dark-themed (image backgrounds) */}
        <div className="relative h-[460px] md:h-[520px] overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className={`min-w-full h-full relative bg-gradient-to-br ${s.gradient} flex-shrink-0`}
                style={
                  s.image
                    ? {
                        backgroundImage: `url(${s.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {s.image && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                )}

                <div className="relative z-10 h-full flex flex-col justify-end max-w-7xl mx-auto px-6 md:px-12 pb-14">
                  <span className="inline-block text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                    {s.eyebrow}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
                    {s.title}
                  </h3>
                  <p className="text-white/60 text-base md:text-lg max-w-xl">{s.subtitle}</p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
              </div>
            ))}
          </div>

          {/* Prev / Next */}
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center hover:border-amber-500/60 hover:text-amber-400 text-white transition-colors"
            aria-label="Previous slide"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center hover:border-amber-500/60 hover:text-amber-400 text-white transition-colors"
            aria-label="Next slide"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-amber-400 w-6' : 'bg-white/30 w-1.5 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500/70 text-sm uppercase tracking-[0.2em] font-semibold mb-3">
              Everything you need
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
              A complete toolkit for your business
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-[var(--color-surface)]  rounded-2xl p-7 hover:border-amber-500/30 hover:bg-[var(--color-surface-hover)] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10  text-amber-500 flex items-center justify-center mb-5 group-hover:bg-amber-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-[var(--color-text)] font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 px-6 border-t border-[var(--color-border-subtle)]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500/70 text-sm uppercase tracking-[0.2em] font-semibold mb-3">
              Up and running fast
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">
              From signup to first invoice in under 5 minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <span className="text-2xl font-black text-amber-500">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-[var(--color-text)] font-semibold text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / MISSION ──────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6 border-t border-[var(--color-border-subtle)]">
        <div className="max-w-4xl mx-auto">
          <div
            className={`rounded-3xl p-10 md:p-14 text-center border border-amber-500/20 ${
              isLight
                ? 'bg-gradient-to-br from-amber-50 to-white'
                : 'bg-gradient-to-br from-[#141008] to-[#0a0a0a]'
            }`}
          >
            <div className="w-16 h-16 mx-auto mb-6">
              <img src={logo} alt="BizUnity" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4">
              Built to uplift African enterprise
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-2xl mx-auto mb-8">
              BizUnity was built because African SMEs deserve the same professional tools that
              global enterprises use without the complexity, the price tag, or the systems built for
              other markets. We start with Southern Africa and we are here to stay.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] text-sm"
            >
              Join BizUnity today
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[var(--color-border-subtle)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
            Ready to run your business{' '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              smarter?
            </span>
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg mb-10">
            Create your free account and send your first quotation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base px-10 py-4 rounded-xl transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
            >
              Create your free account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center border border-[var(--color-border-strong)] hover:border-amber-500/50 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium text-base px-10 py-4 rounded-xl transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border-subtle)] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="BizUnity" className="h-7 w-auto opacity-60" />
          <p className="text-[var(--color-text-faint)] text-xs text-center">
            © {new Date().getFullYear()} BizUnity. Built for African enterprise.
          </p>
          <div className="flex gap-6 text-xs text-[var(--color-text-faint)]">
            <Link
              to="/login"
              className="hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
