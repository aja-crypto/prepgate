import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandName } from '../ui/BrandText';

const QUOTES = [
  'Every second counts. Every step matters.',
  'Small progress every day creates big results.',
  'Stay focused. Your AIR starts here.',
  'Great engineers are built one session at a time.',
  'One topic today. One rank tomorrow.',
  'Learn deeply. Practice consistently.',
  'Consistency beats intensity.',
  'Your preparation defines your rank.',
  'Progress is earned, not given.',
  'Success begins with today\'s discipline.',
];

const LOADING_TEXTS = [
  'Preparing your dashboard...',
  'Loading today\'s schedule...',
  'Organizing your study plan...',
  'Loading AI Mentor...',
  'Preparing your revision...',
  'Loading PYQs...',
  'Analyzing your progress...',
  'Connecting your learning journey...',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function PremiumLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [quote] = useState(() => pickRandom(QUOTES));
  const [loadingText, setLoadingText] = useState(() => pickRandom(LOADING_TEXTS));
  const [phase, setPhase] = useState('loading'); // loading | complete
  const startTimeRef = useState(() => Date.now())[0];

  // Smooth progress simulation with minimum display time
  useEffect(() => {
    let raf;
    let start = null;
    let timers = [];
    let unmounted = false;
    const animDuration = 2800;
    const minDisplayTime = 3000;

    const tick = (ts) => {
      if (unmounted) return;
      if (!start) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / animDuration, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(Math.round(eased * 100));
      if (raw < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const elapsed_total = Date.now() - startTimeRef;
        const remaining = Math.max(0, minDisplayTime - elapsed_total);
        const t1 = setTimeout(() => {
          if (unmounted) return;
          setPhase('complete');
          const t2 = setTimeout(() => {
            if (!unmounted) onComplete?.();
          }, 400);
          timers.push(t2);
        }, remaining);
        timers.push(t1);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      unmounted = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [onComplete, startTimeRef]);

  // Rotate loading text
  useEffect(() => {
    const id = setInterval(() => {
      setLoadingText(pickRandom(LOADING_TEXTS));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden"
      style={{ background: '#08080c' }}
    >
      {/* Radial glow behind logo */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Subtle floating particles */}
      {!prefersReduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                background: `rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: Math.random() * 4 + 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'complete' ? 0 : 1 }}
        transition={{ duration: prefersReduced ? 0 : 0.4 }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReduced ? 0 : 1.2, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ scale: [0.98, 1, 0.98] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Logo glow */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.3))',
                filter: 'blur(20px)',
                transform: 'scale(1.3)',
              }}
            />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))',
                border: '1px solid rgba(139,92,246,0.25)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <svg viewBox="0 0 32 32" fill="none" className="w-11 h-11">
                <path
                  d="M10 22V10l6 6 6-6v12"
                  stroke="url(#logoGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="logoGrad" x1="10" y1="10" x2="22" y2="22">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.6, delay: 0.3 }}
          className="mt-6"
        >
          <h1
            className="text-2xl font-bold tracking-[5px] uppercase"
            style={{ textShadow: '0 0 40px rgba(139,92,246,0.15)' }}
          >
            <BrandName />
          </h1>
        </motion.div>

        {/* Motivational quote */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.6 }}
          className="mt-5 text-sm leading-relaxed max-w-xs"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {quote}
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.9 }}
          className="mt-8 w-full max-w-xs"
        >
          {/* Bar track */}
          <div
            className="relative w-full h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {/* Bar fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #818cf8)',
              }}
              transition={{ duration: 0.1, ease: 'linear' }}
            >
              {/* Moving glow on fill */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  width: '40%',
                }}
                animate={{ x: ['-100%', '350%'] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>

          {/* Percentage */}
          <div className="flex justify-between items-center mt-2.5">
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {loadingText}
            </span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: 'rgba(167,139,250,0.7)' }}
            >
              {progress}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
