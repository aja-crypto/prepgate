// First-time mobile feature-discovery tour card (UX layer only — no data/auth logic).
// Talks to the EXISTING sidebar via `tourHighlight` keys; never renders navigation itself.
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

/* Highlight keys: `item:<route>` for top/bottom links, `group:<key>` for accordion groups. */
export const TOUR_STEPS = [
  {
    key: 'intro',
    icon: '✨',
    title: 'Explore GateNexa',
    body: 'Your preparation tools are organized here — AI, Learning, Practice, Analysis, Predictor and more.',
    highlight: [],
  },
  {
    key: 'ai',
    icon: '🤖',
    title: 'Your AI-powered preparation tools',
    body: 'GateNexa AI, Learning Hub, Nexa Intel and NEXA Predictor live here.',
    highlight: ['item:/mentor', 'item:/learning-hub', 'item:/insights', 'item:/opportunity-predictor'],
  },
  {
    key: 'study',
    icon: '📚',
    title: 'Study & Practice',
    body: 'Subjects, Notes, Focus, PYQs, Mock Tests and your Planner — learn, practice and build your preparation.',
    highlight: ['group:study', 'group:practice'],
  },
  {
    key: 'analysis',
    icon: '📈',
    title: 'Analysis & Tools',
    body: 'Track your progress with Analytics, AIR Predictor and Mistakes — plus Calculator, GATE Papers and Gate Vault.',
    highlight: ['group:insights', 'group:tools'],
  },
  {
    key: 'utility',
    icon: '🚀',
    title: "You're ready",
    body: 'Customize your experience in Settings and send feedback anytime. Everything you need for GATE preparation is here.',
    highlight: ['item:/settings', 'item:/feedback'],
  },
];

function MobileFeatureTour({ stepIndex, onNext, onBack, onSkip }) {
  const reduce = useReducedMotion();
  const step = TOUR_STEPS[stepIndex] || TOUR_STEPS[0];
  const cardRef = useRef(null);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= TOUR_STEPS.length - 1;

  // Dialog focus management — announce each step for keyboard/screen-reader users
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [stepIndex]);

  // Keep highlighted nav items scrolled to the middle of the drawer so the card never covers them.
  // Deferred to rAF: the Layout body-attribute effect (which activates the tour's scroll spacer)
  // cleans up + re-runs in the same effects flush, and child effects run BEFORE parent effects —
  // measuring synchronously would see the spacer missing and clamp the scroll.
  // Scroll is instant so items never pass under the card mid-flight.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const nav = document.querySelector('.glass-sidebar nav');
      const el = nav && nav.querySelector('[data-tourhl="1"]');
      if (!nav || !el) return;
      const r = el.getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      const delta = (r.top + r.height / 2) - (nr.top + nr.height / 2);
      if (Math.abs(delta) > 12) {
        nav.scrollTo({ top: nav.scrollTop + delta, behavior: 'auto' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [stepIndex]);

  const btnBase =
    'inline-flex items-center justify-center rounded-xl text-[13px] font-semibold transition-all duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#110f1f]';
  const primaryCls = `${btnBase} px-5 text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_4px_16px_rgba(139,92,246,0.35)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95 ${reduce ? '' : 'active:scale-[0.98]'}`;
  const quietCls = `${btnBase} px-4 text-white/55 hover:text-white/90 hover:bg-white/[0.06]`;

  return (
    <motion.div
      ref={cardRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-label={step.title}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 6 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      className="fixed left-3 right-3 z-[9010] rounded-2xl border border-purple-400/25 bg-[#110f1f]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55),0_0_28px_rgba(139,92,246,0.18)] p-4 outline-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={{ opacity: 0, y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -4 }}
          transition={{ duration: reduce ? 0 : 0.18, ease: 'easeOut' }}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-[18px] leading-none mt-0.5" aria-hidden="true">{step.icon}</span>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-white leading-snug">{step.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">{step.body}</p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2">
            <div>
              {!isFirst && !isLast && (
                <button type="button" onClick={onBack} className={quietCls}>
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isFirst && (
                <button type="button" onClick={onSkip} className={quietCls}>
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={onNext}
                className={primaryCls}
                aria-label={isLast ? 'Finish tour' : 'Next step'}
              >
                {isLast ? 'Got it' : 'Next'}
                {!isLast && (
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4 ml-1">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default React.memo(MobileFeatureTour);
