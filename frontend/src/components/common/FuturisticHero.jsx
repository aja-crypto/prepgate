import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../design/tokens';
import AIBrainScene from './AIBrainScene';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Show content immediately, skip animation if reduced motion preferred
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setVisible(true);
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: heroOpacity, background: 'transparent' }}
    >
      {/* ═══ FULL-SCREEN NEURAL BRAIN BACKGROUND (dimmed) ═══ */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${visible ? 'opacity-25' : 'opacity-0'}`}>
        <AIBrainScene />
      </div>

      {/* ═══ PURPLE GLOW BEHIND TEXT ═══ */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        background: 'radial-gradient(circle at center, rgba(168,85,247,0.06) 0%, rgba(124,58,237,0.03) 30%, transparent 70%)',
      }} />

      {/* ═══ CONTENT OVERLAY (above brain) ═══ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-16 px-4">

        {/* Top badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-6 transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#C4B5FD', backdropFilter: 'blur(16px)', boxShadow: '0 0 30px rgba(139,92,246,0.06)' }}>
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          AI-Powered GATE 2027 Preparation Platform
        </div>

        {/* Headline — centered, big */}
        <div className={`text-center mb-8 transition-all duration-250 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight" style={{ textShadow: '0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.06), 0 0 120px rgba(34,211,238,0.03)' }}>
            <span className="text-[#F8FAFC]">Build Your </span>
            <GradientText gradient="linear-gradient(135deg, #F0E8FF, #C4B5FD, #8B5CF6, #22D3EE)">
              AIR
            </GradientText>
          </h1>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight mt-1" style={{ color: '#F8FAFC', textShadow: '0 0 40px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.06), 0 0 120px rgba(34,211,238,0.03)' }}>
            with an Adaptive
          </h1>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight mt-1">
            <GradientText gradient="linear-gradient(135deg, #A78BFA, #8B5CF6, #6D28D9, #22D3EE)">
              AI Mentor
            </GradientText>
          </h1>
          <p className="text-sm sm:text-base mt-4 max-w-md mx-auto font-medium" style={{ color: 'rgba(248,250,252,0.7)', textShadow: '0 2px 16px rgba(0,0,0,0.95), 0 0 30px rgba(139,92,246,0.08)' }}>
            Track. Practice. Revise. Predict. Conquer GATE 2027.
          </p>
        </div>

        {/* CTA */}
        <div className={`flex flex-wrap items-center justify-center gap-3 mb-8 transition-all duration-250 ease-out delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {!user ? (
            <>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 30px rgba(139,92,246,0.3), 0 8px 60px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.06)' }}
              >
                Start Preparing
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
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
    </section>
  );
}
