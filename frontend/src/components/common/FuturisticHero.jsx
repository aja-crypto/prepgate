import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../design/tokens';
import Icon from '../ui/Icon';
import { BrandName } from '../ui/BrandText';

const AIBrainScene = lazy(() => import('./AIBrainScene'));

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'AI Mentor', href: '#ai-mentor' },
  { label: 'Predictor', href: '#predictor' },
  { label: 'Pricing', href: '#pricing' },
];

const STATS = [
  { value: '15K+', label: 'Active Students' },
  { value: '500+', label: 'Video Lectures' },
  { value: '2K+', label: 'PYQs' },
  { value: '98%', label: 'Satisfaction' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Mentor', desc: 'Personalized study plans, weak area analysis, and daily action recommendations powered by AI.', color: '#8B5CF6' },
  { icon: '📊', title: 'Advanced Analytics', desc: 'Track subject mastery, study hours, accuracy trends, and rank improvement over time.', color: '#22D3EE' },
  { icon: '🎯', title: 'AIR Predictor', desc: 'Predict your GATE rank with ML-based analysis of mock scores, accuracy, and syllabus coverage.', color: '#F59E0B' },
  { icon: '📚', title: 'Smart PYQs', desc: 'Year-wise browsing with mistake tagging, weak area analysis, and pattern recognition.', color: '#34D399' },
  { icon: '📝', title: 'Study Planner', desc: 'AI-generated daily and weekly plans that adapt to your pace, strengths, and upcoming exams.', color: '#F472B6' },
  { icon: '🏆', title: 'Gate Vault', desc: 'Curated practice sets from topper notes, subject-wise challenges, and monthly targets.', color: '#6366F1' },
];

const TESTIMONIALS = [
  { name: 'Rahul S.', role: 'AIR 12, CSE', text: 'The AI Mentor identified my weak areas in Algorithms that I had missed for months. Improved by 40 marks in mocks.', avatar: '🎯' },
  { name: 'Priya M.', role: 'AIR 27, CSE', text: 'AIR Predictor was scarily accurate. It predicted my rank within 15 of the actual. The analytics are incredible.', avatar: '⭐' },
  { name: 'Arun K.', role: 'AIR 58, DA', text: 'The daily study plans saved me from decision fatigue. I just followed what the AI suggested and my scores improved.', avatar: '🚀' },
  { name: 'Sneha R.', role: 'AIR 104, CSE', text: 'PYQ analysis with mistake tagging changed how I practice. I stopped repeating the same errors within weeks.', avatar: '💪' },
];

const PLANS = [
  { name: 'Free', price: '₹0', period: 'forever', features: ['Basic Analytics', '50 AI Chats/mo', 'PYQ Browser', 'Basic Planner', 'Community Access'], cta: 'Get Started', popular: false },
  { name: 'Premium', price: '₹499', period: '/month', features: ['Unlimited AI Chats', 'Advanced Analytics', 'AIR Predictor Pro', 'Custom Mock Tests', 'Gate Vault', 'Priority Support'], cta: 'Start Free Trial', popular: true },
  { name: 'Lifetime', price: '₹7,999', period: 'once', features: ['Everything in Premium', 'All Future Updates', 'Beta Features First', '1:1 Mentorship', 'Lifetime Badge', 'Direct Access'], cta: 'Get Lifetime', popular: false },
];

const TRUST_BADGES = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT KGP', 'IISC', 'NIT Trichy'];

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.15]" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)', filter: 'blur(100px)', animation: 'floatOrb 12s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.1]" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.3), transparent 70%)', filter: 'blur(100px)', animation: 'floatOrb 15s ease-in-out infinite reverse' }} />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)', filter: 'blur(80px)', animation: 'floatOrb 18s ease-in-out infinite 3s' }} />
    </div>
  );
}

function GlassNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-5xl">
      <div style={{
        background: scrolled ? 'rgba(8,12,28,0.85)' : 'rgba(8,12,28,0.5)',
        backdropFilter: 'blur(28px) saturate(2)',
        WebkitBackdropFilter: 'blur(28px) saturate(2)',
        borderRadius: '100px',
        border: '1px solid rgba(139,92,246,0.1)',
        boxShadow: scrolled
          ? '0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.06) inset'
          : '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(139,92,246,0.04) inset',
        transition: 'all 0.3s ease',
      }}>
        <div className="flex items-center justify-between h-14 px-5">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 flex items-center justify-center" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.3))' }}>
              <Icon name="logo" className="w-full h-full" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <BrandName size="15px" fontWeight={700} letterSpacing="2px" />
              <span className="text-[7px] font-semibold tracking-[1.5px]" style={{ color: '#A855F7' }}>GATE 2027</span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                className="relative px-3.5 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="text-[10px] font-bold text-white px-4 py-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 15px rgba(139,92,246,0.35)' }}>
                Dashboard
              </motion.button>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                  Sign in
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className="text-[10px] font-bold text-white px-4 py-1.5 rounded-full inline-block"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 15px rgba(139,92,246,0.35)' }}>
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden md:hidden">
              <div className="px-5 pb-4 pt-2 space-y-1 border-t" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                {NAV_LINKS.map(link => (
                  <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                    className="block text-[12px] font-medium px-3 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

function GradientText({ children, gradient }) {
  return <span style={{ backgroundImage: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}>{children}</span>;
}

function SectionHeading({ label, title, desc, align = 'center' }) {
  return (
    <div className={`mb-12 sm:mb-16 ${align === 'center' ? 'text-center' : ''}`}>
      <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5FD' }}>{label}</span>
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">{title}</h2>
      {desc && <p className="text-sm sm:text-base text-text3/70 mt-3 max-w-2xl mx-auto">{desc}</p>}
    </div>
  );
}

function GlassMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl opacity-20" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', filter: 'blur(40px)' }} />
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(139,92,246,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <div className="ml-3 flex-1 max-w-[180px] mx-auto">
            <div className="h-5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }} />
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded" style={{ background: 'rgba(139,92,246,0.2)' }} />
              <div className="h-5 w-40 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold font-mono" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <span style={{ background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>87%</span>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Algorithms', 'DBMS', 'OS'].map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[9px] font-medium text-text3/70">{s}</div>
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${[72, 85, 63][i]}%` }} transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${['#8B5CF6', '#22D3EE', '#F59E0B'][i]}, ${['#6D28D9', '#0891B2', '#D97706'][i]})` }} />
                </div>
                <div className="text-[9px] font-mono text-text3/50 mt-1">{['72%', '85%', '63%'][i]}</div>
              </motion.div>
            ))}
          </div>

          <motion.div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
            animate={{ boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 20px rgba(139,92,246,0.08)', '0 0 0px rgba(139,92,246,0)'] }}
            transition={{ repeat: Infinity, duration: 3 }}>
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-white">AI Mentor</div>
              <div className="text-[9px] text-text3/70">Focus on Dynamic Programming today — it's your weakest topic</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[#050816]" />
      <FloatingOrbs />
      <div className="absolute inset-0 z-0 opacity-25"><Suspense fallback={null}><AIBrainScene /></Suspense></div>

      <motion.div style={{ y: heroY, opacity }} className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          <div className="space-y-6 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5FD' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered GATE 2027 Preparation
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="text-white">Build Your </span>
                <GradientText gradient="linear-gradient(135deg, #F0E8FF, #C4B5FD, #8B5CF6, #22D3EE)">
                  Dream Rank
                </GradientText>
                <br />
                <span className="text-white">with an </span>
                <GradientText gradient="linear-gradient(135deg, #A78BFA, #8B5CF6, #6D28D9, #22D3EE)">
                  AI Co-Pilot
                </GradientText>
              </h1>
              <p className="text-sm sm:text-base max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Track syllabus, practice PYQs, analyze mocks, and get personalized AI recommendations — all in one platform designed to maximize your GATE rank.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/register" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3)' }}>
                      Start Free
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/login" className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#C4B5FD', backdropFilter: 'blur(12px)' }}>
                      Sign In
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3)' }}>
                    Continue Preparation
                  </button>
                </motion.div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-4">
              <div className="flex flex-wrap gap-6 sm:gap-8">
                {STATS.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }}>
                    <div className="text-lg sm:text-xl font-black" style={{ background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                    <div className="text-[9px] font-medium uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {TRUST_BADGES.slice(0, 4).map(badge => (
                  <span key={badge} className="text-[9px] font-medium px-2.5 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                    {badge}
                  </span>
                ))}
                <span className="text-[9px] font-medium px-2.5 py-1" style={{ color: 'rgba(139,92,246,0.4)' }}>+2 more</span>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block">
            <GlassMockup />
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center gap-1">
          <span className="text-[8px] uppercase tracking-[0.25em]" style={{ color: 'rgba(139,92,246,0.25)' }}>Scroll</span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" style={{ color: 'rgba(139,92,246,0.25)' }}>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-12 border-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-center mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>Trusted by students from India's top colleges</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TRUST_BADGES.map((b, i) => (
            <motion.span key={b} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {b}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <SectionHeading label="Features" title="Everything you need to crack GATE" desc="AI-powered tools designed by toppers and engineers to maximize your preparation efficiency." />
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300 } }}
              className="group rounded-2xl p-5 sm:p-6 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(600px circle at 50% 0%, ${f.color}08, transparent 70%)` }} />
              <span className="text-2xl sm:text-3xl relative">{f.icon}</span>
              <h3 className="text-sm font-bold text-white mt-3 relative">{f.title}</h3>
              <p className="text-xs text-text3/70 mt-1.5 leading-relaxed relative">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIMentorSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messages = [
    { role: 'user', text: 'What should I study today?' },
    { role: 'ai', text: 'Based on your progress, focus on Dynamic Programming. You scored 62% in mocks — revise DP patterns, then practice 5 PYQs. I recommend starting with the "Knapsack" family.' },
  ];

  return (
    <section id="ai-mentor" className="py-20 sm:py-28" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.04), transparent 70%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <SectionHeading label="AI Mentor" title="Your personal GATE coach" desc="Get daily study plans, weak-area analysis, and personalized recommendations powered by AI that understands the GATE syllabus." align="left" />
            <div className="space-y-3">
              {['Identifies weak topics from your mock performance', 'Generates daily study plans that adapt to your pace', 'Recommends PYQs based on your mistake patterns', 'Answers your doubts with context-aware responses'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0 text-purple-400"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{item}</span>
                </motion.div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-6">
              <button onClick={() => navigate(user ? '/GateNexa-ai' : '/register')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                Try AI Mentor
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(139,92,246,0.1)', backdropFilter: 'blur(20px)' }}>
              <div className="p-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-200' : 'bg-white/[0.04] text-text2/90'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex-1 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <motion.button whileTap={{ scale: 0.95 }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>Send</motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <SectionHeading label="Testimonials" title="Loved by rankers" desc="Hear from students who used GateNexa to achieve their dream ranks." />
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }} className="rounded-2xl p-5 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-2xl mb-3">{t.avatar}</span>
              <p className="text-xs text-text2/80 leading-relaxed flex-1">"{t.text}"</p>
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="text-xs font-semibold text-white">{t.name}</div>
                <div className="text-[9px] text-purple-400">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 sm:py-28" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.04), transparent 70%)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <SectionHeading label="Pricing" title="Start free, upgrade when you need" desc="No credit card required. Start with the free tier and upgrade when you're ready for more." />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-xs font-medium transition-colors ${!annual ? 'text-white' : 'text-text3'}`}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} className="relative w-12 h-6 rounded-full transition-colors" style={{ background: annual ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)' }}>
            <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white" animate={{ x: annual ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500 }} />
          </button>
          <span className={`text-xs font-medium transition-colors ${annual ? 'text-white' : 'text-text3'}`}>Annual <span className="text-purple-400">Save 40%</span></span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan, i) => {
            const displayPrice = plan.name === 'Premium' && annual ? '₹299' : plan.price;
            const displayPeriod = plan.name === 'Premium' && annual ? '/month' : plan.period;
            return (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300 } }}
                className={`relative rounded-2xl p-6 flex flex-col ${plan.popular ? 'ring-2' : ''}`}
                style={{
                  background: plan.popular ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))' : 'rgba(255,255,255,0.02)',
                  border: plan.popular ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: plan.popular ? '0 0 40px rgba(139,92,246,0.1)' : 'none',
                }}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>Most Popular</div>}
                <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-white">{displayPrice}</span>
                  <span className="text-[10px] text-text3">{displayPeriod}</span>
                </div>
                <div className="flex-1 space-y-2.5 my-5">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-xs text-text2">{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(user ? '/premium' : '/register')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{
                    background: plan.popular ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'rgba(139,92,246,0.1)',
                    border: plan.popular ? 'none' : '1px solid rgba(139,92,246,0.2)',
                    boxShadow: plan.popular ? '0 4px 20px rgba(139,92,246,0.3)' : 'none',
                  }}>
                  {plan.cta}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5FD' }}>Get Started</span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">Start building your AIR today</h2>
          <p className="text-sm sm:text-base mt-4 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>Join thousands of GATE aspirants who are already using GateNexa to track, practice, and predict their way to top ranks.</p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-8">
            <button onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3)' }}>
              {user ? 'Go to Dashboard' : 'Start Free'}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function FuturisticHero() {
  return (
    <>
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -50px) scale(1.1); }
          50% { transform: translate(-20px, -80px) scale(0.9); }
          75% { transform: translate(50px, -30px) scale(1.05); }
        }
      `}</style>
      <GlassNavbar />
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <AIMentorSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />

      <footer className="py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandName size="13px" fontWeight={700} letterSpacing="2px" />
          </div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2026 GateNexa. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
