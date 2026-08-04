import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, LayoutDashboard, Brain, Calendar, Timer, TrendingUp, Flag } from 'lucide-react';
import Portal from '../ui/Portal';

const STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Your Dashboard',
    subtitle: 'Your daily command center',
    body: 'Every day you\'ll see your study plan, progress, AI recommendations, and motivation — all in one place.',
    highlight: 'dashboard',
    gradient: 'from-violet-500/30 via-purple-500/20 to-transparent',
    accent: 'text-violet-400',
    bgGlow: 'bg-violet-500/10',
  },
  {
    icon: Brain,
    title: 'GateNexa AI',
    subtitle: 'Your personal study mentor',
    body: 'GateNexa AI analyzes your preparation and recommends what to study next based on your actual progress and weak areas.',
    highlight: 'ai',
    gradient: 'from-blue-500/30 via-indigo-500/20 to-transparent',
    accent: 'text-blue-400',
    bgGlow: 'bg-blue-500/10',
  },
  {
    icon: Calendar,
    title: 'Smart Planner',
    subtitle: 'No more making timetables',
    body: 'Your daily study plan is created automatically. Simply follow today\'s tasks without worrying about planning.',
    highlight: 'planner',
    gradient: 'from-emerald-500/30 via-teal-500/20 to-transparent',
    accent: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    icon: Timer,
    title: 'Focus Mode',
    subtitle: 'Track every session',
    body: 'Use Focus Mode whenever you study. When your session ends, GateNexa automatically records study time, subject, and topic.',
    highlight: 'focus',
    gradient: 'from-orange-500/30 via-amber-500/20 to-transparent',
    accent: 'text-orange-400',
    bgGlow: 'bg-orange-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracker',
    subtitle: 'Watch yourself grow',
    body: 'Track study hours, completed topics, PYQs solved, revision sessions, and weekly progress — all in beautiful charts.',
    highlight: 'progress',
    gradient: 'from-rose-500/30 via-pink-500/20 to-transparent',
    accent: 'text-rose-400',
    bgGlow: 'bg-rose-500/10',
  },
  {
    icon: Flag,
    title: 'You\'re Ready!',
    subtitle: 'Your journey to GATE 2027 starts now',
    body: 'Stay consistent. Study daily. GateNexa will guide you every step of the way toward your dream rank.',
    highlight: 'ready',
    gradient: 'from-purple-500/30 via-fuchsia-500/20 to-transparent',
    accent: 'text-purple-400',
    bgGlow: 'bg-purple-500/10',
  },
];

export default function PremiumOnboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      setExiting(true);
      setTimeout(() => onComplete(), 500);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <Portal>
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4"
          >
            {/* Background glow */}
            <div className={`absolute -inset-20 rounded-[40px] opacity-30 blur-3xl ${current.bgGlow}`} />

            {/* Main card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-2xl shadow-2xl">
              {/* Gradient decoration */}
              <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${current.gradient}`} />

              {/* Content */}
              <div className="relative px-10 pt-16 pb-10">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Close button */}
                <button
                  onClick={() => { setExiting(true); setTimeout(() => onSkip(), 300); }}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text2 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>

                {/* Icon circle */}
                <div className="flex justify-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className={`w-24 h-24 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl`}
                  >
                    <Icon size={44} className={current.accent} />
                  </motion.div>
                </div>

                {/* Step indicator */}
                <div className="flex justify-center gap-1.5 mb-6">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === step ? 'w-8 bg-purple-500' :
                        i < step ? 'w-2 bg-purple-500/40' : 'w-2 bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                {/* Title */}
                <motion.h2
                  key={`title-${step}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white text-center mb-2"
                >
                  {current.title}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  key={`sub-${step}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`text-sm font-medium ${current.accent} text-center mb-4`}
                >
                  {current.subtitle}
                </motion.p>

                {/* Body */}
                <motion.p
                  key={`body-${step}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-text2/80 text-center leading-relaxed max-w-lg mx-auto mb-10"
                >
                  {current.body}
                </motion.p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setExiting(true); setTimeout(() => onSkip(), 300); }}
                    className="text-sm text-text2/60 hover:text-text2 transition-colors"
                  >
                    Skip tour
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-xl ${
                      isLast
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {isLast ? (
                      <>
                        <Sparkles size={16} />
                        Start Studying
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
