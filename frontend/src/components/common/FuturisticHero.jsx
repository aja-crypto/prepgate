import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthData } from '../../context/AuthContext';
import { BRAND } from '../../design/tokens';
import PremiumGiftCard from '../referral/PremiumGiftCard';

const AIBrainScene = lazy(() => import('./AIBrainScene'));

// AIR tips
const AIR_TIPS = [
  { rank: 'AIR 12', tip: 'Solve PYQs multiple times.', color: '#8B5CF6' },
  { rank: 'AIR 27', tip: 'Revision matters more than learning.', color: '#22D3EE' },
  { rank: 'AIR 58', tip: 'Accuracy improves rank.', color: '#F59E0B' },
  { rank: 'AIR 4', tip: 'I made a mistake notebook and reviewed it every Sunday.', color: '#F472B6' },
  { rank: 'AIR 8', tip: 'Your mock analysis defines your rank, not your mock score.', color: '#22D3EE' },
  { rank: 'AIR 5', tip: 'I revised every subject at least 4 times.', color: '#34D399' },
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
    <div className={`transition-all duration-200 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center gap-3 justify-center">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${tip.color}15`, border: `1px solid ${tip.color}30`, color: tip.color }}>
          {tip.rank}
        </span>
        <span className="text-xs" style={{ color: 'rgba(196,181,253,0.55)' }}>"{tip.tip}"</span>
      </div>
    </div>
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

// Gradient text
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

export default function FuturisticHero() {
  const { user } = useAuthData();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [loadBrain, setLoadBrain] = useState(false);
  const sectionRef = useRef(null);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const brainLoadedRef = useRef(false);

  // Load brain scene when user scrolls near the hero section or interacts
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !brainLoadedRef.current) {
          brainLoadedRef.current = true;
          setLoadBrain(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load brain scene ONLY on actual user interaction (click, scroll, keydown, touch)
// NOT on page load or intersection observer (hero is visible on load)
  useEffect(() => {
    let loaded = false;
    const loadOnInteraction = () => {
      if (loaded) return;
      loaded = true;
      setLoadBrain(true);
      // Remove all listeners after first interaction
      document.removeEventListener('click', loadOnInteraction);
      document.removeEventListener('keydown', loadOnInteraction);
      document.removeEventListener('touchstart', loadOnInteraction);
      document.removeEventListener('wheel', loadOnInteraction);
    };
    // Only load on explicit user interaction
    document.addEventListener('click', loadOnInteraction, { once: true, passive: true });
    document.addEventListener('keydown', loadOnInteraction, { once: true, passive: true });
    document.addEventListener('touchstart', loadOnInteraction, { once: true, passive: true });
    document.addEventListener('wheel', loadOnInteraction, { once: true, passive: true });
    return () => {
      document.removeEventListener('click', loadOnInteraction);
      document.removeEventListener('keydown', loadOnInteraction);
      document.removeEventListener('touchstart', loadOnInteraction);
      document.removeEventListener('wheel', loadOnInteraction);
    };
  }, []);

  // Show content immediately, skip animation if reduced motion preferred
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setVisible(true);
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth < 640) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroOpacity(Math.max(0, Math.min(1, entry.intersectionRatio * 1.5))),
      { threshold: Array.from({ length: 20 }, (_, i) => i * 0.05) }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-0 sm:min-h-screen flex flex-col items-center overflow-hidden"
      style={{ opacity: heroOpacity, background: 'transparent' }}
    >
      <style>{`
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.0); }
          50% { opacity: 0.9; transform: scale(1.1); box-shadow: 0 0 0 3px rgba(16,185,129,0); }
        }
        @keyframes badgeGlowPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(139,92,246,0.08), 0 0 48px rgba(139,92,246,0.04); }
          50% { box-shadow: 0 0 32px rgba(139,92,246,0.16), 0 0 64px rgba(139,92,246,0.08); }
        }
        .badge-float { animation: badgeFloat 7s ease-in-out infinite; }
        .badge-glow { animation: badgeGlowPulse 4s ease-in-out infinite; }
        .status-dot { animation: statusPulse 3.5s ease-in-out infinite; }
        @media (max-width: 767px) {
          section.min-h-0 h1 { font-size: 2rem !important; line-height: 1.15 !important; }
          .text-[32px] { font-size: 32px !important; }
          .text-lg { font-size: 1.1rem !important; line-height: 1.4 !important; }
        }
      `}</style>
      {/* ΓòÉΓòÉΓòÉ FULL-SCREEN NEURAL BRAIN BACKGROUND (dimmed) ΓòÉΓòÉΓòÉ */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${visible ? 'opacity-25' : 'opacity-0'}`}>
        {loadBrain && (
          <Suspense fallback={null}>
            <AIBrainScene />
          </Suspense>
        )}
      </div>

      {/* ΓòÉΓòÉΓòÉ PURPLE GLOW BEHIND TEXT ΓòÉΓòÉΓòÉ */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        background: 'radial-gradient(circle at center, rgba(168,85,247,0.06) 0%, rgba(124,58,237,0.03) 30%, transparent 70%)',
      }} />

      {/* ΓòÉΓòÉΓòÉ CONTENT OVERLAY (above brain) — starts below navbar via global --navbar-offset ΓòÉΓòÉΓòÉ */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 pb-6 sm:pb-16"
        style={{ paddingTop: 'var(--navbar-offset, 130px)' }}>

        {/* AI-Powered GATE 2027 Preparation Platform */}
        <div className="flex justify-center mb-6 transition-all duration-500" style={{ animationDelay: '200ms' }}>
          <div
            className="inline-flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(17,17,24,0.55), rgba(34,211,238,0.05))',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(139,92,246,0.22)',
              boxShadow: '0 0 20px rgba(139,92,246,0.10), 0 0 40px rgba(139,92,246,0.04), inset 0 1px 0 rgba(139,92,246,0.10)',
            }}
          >
            <span
              className="status-dot block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: '#10B981', boxShadow: '0 0 5px rgba(16,185,129,0.55)' }}
            />
            <span
              className="text-[11px] sm:text-xs font-semibold tracking-[0.05em]"
              style={{
                background: 'linear-gradient(135deg, #E9D5FF, #C4B5FD, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              AI-Powered GATE 2027 Preparation Platform
            </span>
          </div>
        </div>

        {/* Animated AIR numbers carousel — emotional hook */}
        <div className="mb-6 transition-all duration-250 ease-out" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-center gap-4 sm:gap-6" style={{ perspective: '800px' }}>
            {[
              { rank: 'AIR 27', sub: 'Your target', color: '#22D3EE', glow: 'rgba(34,211,238,0.15)' },
              { rank: 'AIR 108', sub: 'Achievable', color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
              { rank: 'AIR 1000', sub: 'Your first goal', color: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
            ].map((item, i) => (
<div
                  key={item.rank}
                  className="text-center"
                  style={{ animationDelay: `${i * 0.3}s`, animationDuration: '4s' }}
                >
                <div className="text-lg sm:text-2xl md:text-3xl font-black font-mono tracking-tight transition-all duration-300 hover:scale-110"
                  style={{
                    color: item.color,
                    textShadow: `0 0 30px ${item.glow}, 0 0 60px ${item.glow}`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${i * 150}ms`,
                  }}>
                  {item.rank}
                </div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mt-1" style={{ color: 'rgba(248,250,252,0.35)' }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className={`text-center mb-6 transition-all duration-250 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.15]" style={{ textShadow: '0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.06), 0 0 120px rgba(34,211,238,0.03)' }}>
            <span className="text-[#F8FAFC]">Build Your </span>
            <GradientText gradient="linear-gradient(135deg, #F0E8FF, #C4B5FD, #8B5CF6, #22D3EE)">
              AIR
            </GradientText>
          </h1>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.15] mt-1" style={{ color: '#F8FAFC', textShadow: '0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.06), 0 0 120px rgba(34,211,238,0.03)' }}>
            with an Adaptive
          </h1>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.15] mt-1">
            <GradientText gradient="linear-gradient(135deg, #A78BFA, #8B5CF6, #6D28D9, #22D3EE)">
              AI Mentor
            </GradientText>
          </h1>
          <p className="text-[17px] sm:text-base mt-3 max-w-md mx-auto font-medium" style={{ color: 'rgba(248,250,252,0.7)', textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 0 30px rgba(139,92,246,0.08)' }}>
            Track. Practice. Revise. Predict. Conquer GATE 2027.
          </p>
        </div>

        {/* CTA */}
        <div className={`flex flex-wrap items-center justify-center gap-3 mb-8 transition-all duration-250 ease-out delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {!user ? (
            <>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3), 0 8px 60px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.06)' }}
              >
                Start Preparing
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', color: '#C4B5FD', boxShadow: '0 0 25px rgba(139,92,246,0.12), 0 0 50px rgba(139,92,246,0.04)', backdropFilter: 'blur(12px)' }}
              >
                Sign In
              </Link>
            </>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3), 0 8px 60px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.06)' }}
            >
              Continue Preparation
            </button>
          )}
        </div>

        {/* AIR Tips */}
        <div className={`text-center mb-4 transition-all duration-250 ease-out delay-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-[8px] uppercase tracking-[0.3em] mb-1.5" style={{ color: 'rgba(139,92,246,0.4)' }}>
            Topper Wisdom
          </div>
          <AIRTipsRotator />
        </div>

        {/* Countdown */}
        <div className={`flex items-center justify-center mb-4 transition-all duration-250 ease-out delay-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <AnimatedCountdown />
        </div>

        {/* Hover hint */}
        <div className={`text-center transition-all duration-250 ease-out delay-250 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[9px]" style={{ color: 'rgba(139,92,246,0.35)' }}>
            Hover over the brain to explore subject regions
          </span>
        </div>
      </div>

      {/* Premium Gift Card — positioned right side on desktop, below on mobile */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 z-20">
        <PremiumGiftCard />
      </div>
      <div className="lg:hidden relative z-20 px-4 pb-8">
        <div className="max-w-[280px] mx-auto">
          <PremiumGiftCard compact />
        </div>
      </div>
    </section>
  );
}
