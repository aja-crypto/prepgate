import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDailyQuote, getQuoteForContext } from '../../data/motivationalQuotes';

const ROTATE_INTERVAL = 20000;

export default function MotivationalQuote({ className = '', context = {} }) {
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

  useEffect(() => {
    setQuote(getQuoteForContext(context));
  }, [context]);

  const isReduced = prefersReducedMotion.current;

  return (
    <div className={className} style={{ animation: isReduced ? 'none' : 'floatSlow 6s ease-in-out infinite' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={quote.text}
          initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={
            phase === 'hidden'
              ? { opacity: 0 }
              : isReduced
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
                  }
          }
          exit={isReduced ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.4 } }}
        >
          <p
            className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
            style={{
              background: 'linear-gradient(135deg, #A78BFA, #22D3EE, #A78BFA, #22D3EE)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              animation: isReduced ? 'none' : 'shimmer 6s ease-in-out infinite',
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-sm text-white/50 leading-relaxed max-w-md">
            {quote.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
