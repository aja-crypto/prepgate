import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_TEXTS = [
  'Loading your dashboard...',
  'Preparing AI Assistant...',
  'Analyzing GATE database...',
  'Loading College Predictor...',
  'Preparing PYQs...',
  'Syncing study progress...',
  'Almost Ready...',
];

const STATUS_ITEMS = [
  { label: 'AI Models', icon: '✓' },
  { label: 'College Database', icon: '✓' },
  { label: 'PYQs', icon: '✓' },
  { label: 'User Progress', icon: '✓' },
  { label: 'Analytics', icon: '✓' },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return reduced;
}

export default function PremiumLoadingScreen({ onComplete }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [textIdx, setTextIdx] = useState(0);
  const [visibleStatuses, setVisibleStatuses] = useState(0);
  const startRef = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  const reducedRef = useRef(reduced);
  const rafRef = useRef(null);
  const timersRef = useRef([]);
  const phaseTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Keep refs in sync without triggering effect re-runs
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { reducedRef.current = reduced; });

  // Smooth progress — runs once on mount, immune to parent re-renders
  useEffect(() => {
    mountedRef.current = true;
    const duration = 3000;
    let start;

    const tick = (ts) => {
      if (!mountedRef.current) return;
      if (!start) start = ts;
      const elapsed = (ts - start) / duration;
      const eased = elapsed < 1 ? 1 - Math.pow(1 - elapsed, 3) : 1;
      setProgress(Math.round(Math.min(eased, 1) * 100));
      if (elapsed < 1) { rafRef.current = requestAnimationFrame(tick); }
      else {
        const remaining = Math.max(0, 3000 - (Date.now() - startRef.current));
        timersRef.current.push(setTimeout(() => {
          if (!mountedRef.current) return;
          setPhase('complete');
          phaseTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            onCompleteRef.current?.();
          }, reducedRef.current ? 200 : 400);
        }, remaining));
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  // Rotate loading text
  useEffect(() => {
    const id = setInterval(() => setTextIdx(i => (i + 1) % LOADING_TEXTS.length), 2000);
    return () => clearInterval(id);
  }, []);

  // Reveal status items
  useEffect(() => {
    if (progress < 15) { setVisibleStatuses(0); return; }
    const thresholds = [15, 30, 50, 70, 85];
    for (let i = 0; i < thresholds.length; i++) {
      if (progress >= thresholds[i]) { setVisibleStatuses(i + 1); }
    }
  }, [progress]);

  const getGradient = (pct) => {
    if (pct < 33) return 'linear-gradient(90deg, #8B5CF6, #6366F1)';
    if (pct < 66) return 'linear-gradient(90deg, #8B5CF6, #6366F1, #22D3EE)';
    return 'linear-gradient(90deg, #8B5CF6, #6366F1, #22D3EE)';
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden" style={{ background: '#090B17' }}>
      {/* Soft radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.06]" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(60px)' }} />

      {/* Subtle particles */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1, height: Math.random() * 2 + 1,
                background: `rgba(139,92,246,${Math.random() * 0.2 + 0.05})`,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: Math.random() * 4 + 4, repeat: Infinity, delay: Math.random() * 3, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'complete' ? 0 : 1 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={reduced ? {} : { scale: [0.98, 1, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
                <path d="M10 22V10l6 6 6-6v12" stroke="url(#pgGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="pgGrad" x1="10" y1="10" x2="22" y2="22">
                    <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* GateNexa text */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.5, delay: 0.2 }}
          className="text-xl font-bold tracking-[4px] uppercase mt-5"
          style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 0 30px rgba(139,92,246,0.1)' }}
        >
          GateNexa
        </motion.h1>

        {/* Loading text */}
        <div className="h-5 mt-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
              className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {LOADING_TEXTS[textIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full">
          <div className="relative w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progress}%`, background: getGradient(progress) }}
              transition={{ duration: 0.1, ease: 'linear' }}
            >
              {!reduced && (
                <motion.div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)', width: '30%' }}
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Loading</span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: progress > 50 ? '#22D3EE' : '#A78BFA' }}>{progress}%</span>
          </div>
        </div>

        {/* Status items */}
        <div className="mt-5 space-y-1.5">
          {STATUS_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: visibleStatuses > i ? 1 : 0, x: visibleStatuses > i ? 0 : -4 }}
              className="flex items-center gap-2 text-[11px]" style={{ color: visibleStatuses > i ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.08)' }}
            >
              <span style={{ color: visibleStatuses > i ? '#22D3EE' : 'rgba(255,255,255,0.08)' }}>{item.icon}</span>
              {item.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
