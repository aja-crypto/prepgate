import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDailyQuote, getQuoteForContext } from '../../data/motivationalQuotes';

const ROTATE_INTERVAL = 20000;

export default function DailyInspiration({ context = {} }) {
  const [quote, setQuote] = useState(() => getQuoteForContext(context));
  const [phase, setPhase] = useState('visible');
  const timerRef = useRef(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const rotate = useCallback(() => {
    setPhase('hidden');
    setTimeout(() => {
      setQuote(getQuoteForContext(context));
      setPhase('visible');
    }, 300);
  }, [context]);

  useEffect(() => {
    timerRef.current = setInterval(rotate, ROTATE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [rotate]);

  const isReduced = prefersReducedMotion.current;

  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(124,58,237,0.15)' }}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.03))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: 'linear-gradient(180deg, #A78BFA, #22D3EE)' }}
      />

      {!isReduced && (
        <>
          <div
            className="absolute top-[-20px] right-[20%] w-24 h-24 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #A78BFA, transparent)', animation: 'floatSlow 8s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[-20px] left-[10%] w-32 h-32 rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #22D3EE, transparent)', animation: 'floatSlow 12s ease-in-out infinite 2s' }}
          />
        </>
      )}

      <div className="relative z-10 px-5 py-4 sm:px-6 sm:py-5 pl-7 sm:pl-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-400/60 mb-2">
          Today&rsquo;s Motivation
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={quote.text}
            initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={
              phase === 'hidden'
                ? { opacity: 0 }
                : isReduced
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
            }
            exit={isReduced ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: 0.35 } }}
          >
            <p
              className="text-lg sm:text-xl font-bold leading-snug mb-2"
              style={{
                background: 'linear-gradient(135deg, #A78BFA, #22D3EE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.01em',
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-white/40 max-w-2xl">
              {quote.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
