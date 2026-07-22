import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../design/tokens';
import PremiumGiftCard from '../referral/PremiumGiftCard';
import Icon from '../ui/Icon';
import { BrandName } from '../ui/BrandText';

const AIBrainScene = lazy(() => import('./AIBrainScene'));

const FLOAT_ORB_KEYFRAMES = `
@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, -80px) scale(0.9); }
  75% { transform: translate(40px, -20px) scale(1.05); }
}
`;

const NAV_LINKS = [
  { label: 'Platform', to: '/platform' },
  { label: 'Insights', to: '/insights' },
  { label: 'Success Hub', to: '/success-hub' },
  { label: 'Pricing', to: '/premium' },
];

const AIR_TIPS = [
  { rank: 'AIR 12', tip: 'Solve PYQs multiple times.', color: '#8B5CF6' },
  { rank: 'AIR 27', tip: 'Revision matters more than learning.', color: '#22D3EE' },
  { rank: 'AIR 58', tip: 'Accuracy improves rank.', color: '#F59E0B' },
  { rank: 'AIR 4', tip: 'Mistake notebook + weekly review = rank jump.', color: '#F472B6' },
  { rank: 'AIR 8', tip: 'Mock analysis defines your rank, not the score.', color: '#22D3EE' },
  { rank: 'AIR 5', tip: 'I revised every subject at least 4 times.', color: '#34D399' },
];

const STATS = [
  { value: '15K+', label: 'Active Students' },
  { value: '500+', label: 'Video Lectures' },
  { value: '2000+', label: 'PYQs Solved' },
  { value: '98%', label: 'Satisfaction Rate' },
];

function AIRTipsRotator() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIndex(i => (i + 1) % AIR_TIPS.length); setFade(true); }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const tip = AIR_TIPS[index];
  return (
    <motion.div animate={{ opacity: fade ? 1 : 0, y: fade ? 0 : 4 }} transition={{ duration: 0.2 }}>
      <div className="flex items-center gap-3 justify-center">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${tip.color}15`, border: `1px solid ${tip.color}30`, color: tip.color }}>
          {tip.rank}
        </span>
        <span className="text-xs" style={{ color: 'rgba(196,181,253,0.55)' }}>"{tip.tip}"</span>
      </div>
    </motion.div>
  );
}

function AnimatedCountdown({ targetDate = '2027-02-07' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="flex gap-2 sm:gap-3">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds },
      ].map(t => (
        <div key={t.label} className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold font-mono" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#C4B5FD', boxShadow: '0 0 20px rgba(139,92,246,0.08), 0 0 40px rgba(139,92,246,0.03)', backdropFilter: 'blur(8px)' }}>
            {String(t.value).padStart(2, '0')}
          </div>
          <div className="text-[7px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(196,181,253,0.4)' }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function GradientText({ children, gradient }) {
  return (
    <span style={{
      backgroundImage: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
    }}>
      {children}
    </span>
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)', filter: 'blur(80px)', animation: 'floatOrb 8s ease-in-out infinite' }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.3), transparent 70%)', filter: 'blur(80px)', animation: 'floatOrb 10s ease-in-out infinite reverse' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)', filter: 'blur(60px)', animation: 'floatOrb 12s ease-in-out infinite 2s' }} />
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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-5xl"
    >
      <div className="relative" style={{
        background: scrolled ? 'rgba(10,15,30,0.85)' : 'rgba(10,15,30,0.6)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        borderRadius: '100px',
        border: '1px solid rgba(139,92,246,0.12)',
        boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.08) inset' : '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(139,92,246,0.06) inset',
        transition: 'all 0.3s ease',
      }}>
        <div className="flex items-center justify-between h-14 px-5">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
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
              <Link key={link.to} to={link.to}
                className="relative px-3.5 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="text-[10px] font-bold text-white px-4 py-1.5 rounded-full transition-all"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 15px rgba(139,92,246,0.35)' }}>
                Dashboard
              </motion.button>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-medium px-3 py-1.5 rounded-full transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                  Sign in
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className="text-[10px] font-bold text-white px-4 py-1.5 rounded-full transition-all inline-block"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 15px rgba(139,92,246,0.35)' }}>
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden">
              <div className="px-5 pb-4 pt-2 space-y-1 border-t" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                {NAV_LINKS.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                    className="block text-[12px] font-medium px-3 py-2 rounded-xl transition-all"
                    style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

function FloatingStatBadges() {
  return (
    <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 flex-col gap-3">
      {STATS.slice(0, 2).map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
          className="rounded-2xl px-4 py-3 text-center"
          style={{ background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139,92,246,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
        >
          <div className="text-lg font-black" style={{ background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
          <div className="text-[8px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function FuturisticHero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => { setVisible(true); }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  });

  const stagger = {
    animate: { transition: { staggerChildren: 0.08 } },
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050816]">
      <style>{FLOAT_ORB_KEYFRAMES}</style>
      <GlassNavbar />
      <FloatingOrbs />

      <div className="absolute inset-0 z-0 opacity-30">
        <Suspense fallback={null}>
          <AIBrainScene />
        </Suspense>
      </div>

      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        background: 'radial-gradient(circle at center, rgba(139,92,246,0.08) 0%, rgba(124,58,237,0.04) 30%, transparent 70%)',
      }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-24 px-4 sm:px-6">

        <motion.div {...fadeUp(0.2)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-8"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#C4B5FD', backdropFilter: 'blur(16px)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          AI-Powered GATE 2027 Preparation Platform
        </motion.div>

        <motion.div {...fadeUp(0.35)} className="mb-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6" style={{ perspective: '800px' }}>
            {[
              { rank: 'AIR 27', sub: 'Your Target', color: '#22D3EE', glow: 'rgba(34,211,238,0.2)' },
              { rank: 'AIR 108', sub: 'Achievable', color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)' },
              { rank: 'AIR 412', sub: 'First Goal', color: '#F59E0B', glow: 'rgba(245,158,11,0.2)' },
            ].map((item, i) => (
              <motion.div key={item.rank} className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.08, transition: { type: 'spring', stiffness: 300 } }}>
                <div className="text-lg sm:text-2xl md:text-3xl font-black font-mono tracking-tight"
                  style={{
                    color: item.color,
                    textShadow: `0 0 30px ${item.glow}, 0 0 60px ${item.glow}`,
                  }}>
                  {item.rank}
                </div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mt-1" style={{ color: 'rgba(248,250,252,0.35)' }}>
                  {item.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.5)} className="text-center mb-8 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.05]" style={{ textShadow: '0 0 40px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.05)' }}>
            <span className="text-[#F8FAFC]">Build Your </span>
            <GradientText gradient="linear-gradient(135deg, #F0E8FF, #C4B5FD, #8B5CF6, #22D3EE)">
              AIR
            </GradientText>
          </h1>
          <h2 className="text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mt-2" style={{ color: '#F8FAFC', textShadow: '0 0 40px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.05)' }}>
            with an Adaptive
          </h2>
          <h2 className="text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mt-2">
            <GradientText gradient="linear-gradient(135deg, #A78BFA, #8B5CF6, #6D28D9, #22D3EE)">
              AI Mentor
            </GradientText>
          </h2>
          <p className="text-sm sm:text-base mt-5 max-w-lg mx-auto font-medium leading-relaxed" style={{ color: 'rgba(248,250,252,0.6)' }}>
            Track syllabus, practice PYQs, analyze mocks, and get personalized AI recommendations — all in one platform.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.65)} className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {!user ? (
            <>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3), 0 8px 60px rgba(139,92,246,0.12)' }}>
                  Start Preparing Free
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#C4B5FD', backdropFilter: 'blur(12px)' }}>
                  Sign In
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <button onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3), 0 8px 60px rgba(139,92,246,0.12)' }}>
                Continue Preparation
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div {...fadeUp(0.8)} className="text-center mb-6">
          <div className="text-[8px] uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(139,92,246,0.4)' }}>From the Community</div>
          <AIRTipsRotator />
        </motion.div>

        <motion.div {...fadeUp(0.95)} className="flex items-center justify-center mb-4">
          <AnimatedCountdown />
        </motion.div>

        <motion.div {...fadeUp(1.1)} className="mt-8 flex items-center gap-6 sm:gap-10">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}>
              <div className="text-sm sm:text-base font-black" style={{ background: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </div>
              <div className="text-[8px] font-medium uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center gap-1">
          <span className="text-[8px] uppercase tracking-[0.25em]" style={{ color: 'rgba(139,92,246,0.3)' }}>Scroll</span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: 'rgba(139,92,246,0.3)' }}>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </motion.div>

      <FloatingStatBadges />

      <div className="hidden lg:block absolute left-8 bottom-24 z-20">
        <PremiumGiftCard />
      </div>
    </section>
  );
}
