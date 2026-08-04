import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, BookOpen, Target, Clock, Award, Sparkles, Star, Zap } from 'lucide-react';
import Portal from '../ui/Portal';

const MILESTONE_CONFIG = {
  first_focus: { icon: Clock, title: 'First Focus Session!', body: 'You completed your first focus session. Every great journey begins with a single step.', color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/30' },
  first_subject: { icon: BookOpen, title: 'First Subject Complete!', body: "You've completed your first subject. One down, more to go!", color: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/30' },
  first_topic: { icon: Star, title: 'First Topic Completed!', body: "You've completed your first topic. Every great rank starts with understanding the basics.", color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/30' },
  streak_7: { icon: Flame, title: '7-Day Streak!', body: 'A full week of consistent study. This is how GATE toppers are built.', color: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/30' },
  streak_30: { icon: Trophy, title: '30-Day Streak!', body: "A month of unwavering dedication. You're unstoppable!", color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/30' },
  pyq_50: { icon: Target, title: '50 PYQs Solved!', body: "You've solved 50 previous year questions. You're building serious momentum.", color: 'from-violet-500 to-indigo-500', glow: 'shadow-violet-500/30' },
  pyq_100: { icon: Target, title: '100 PYQs Solved!', body: "You've solved 100 previous year questions. Every question brings you closer to your dream rank.", color: 'from-violet-500 to-indigo-500', glow: 'shadow-violet-500/30' },
  hours_25: { icon: Clock, title: '25 Study Hours!', body: '25 hours of focused preparation. The foundation is set.', color: 'from-rose-500 to-pink-500', glow: 'shadow-rose-500/30' },
  hours_50: { icon: Clock, title: '50 Study Hours!', body: '50 hours of focused preparation. Your dedication is inspiring.', color: 'from-rose-500 to-pink-500', glow: 'shadow-rose-500/30' },
  hours_100: { icon: Zap, title: '100 Study Hours!', body: '100 hours of focused preparation. You are among the top 10% of serious aspirants.', color: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30' },
  first_mock: { icon: Award, title: 'First Mock Test!', body: 'You took your first mock test. Analysis is the key to improvement.', color: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30' },
  level_up: { icon: Sparkles, title: 'Level Up!', body: "You've improved your predicted score. GateNexa AI recognizes your progress.", color: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/30' },
};

export default function MilestoneCelebration({ milestone, onDismiss }) {
  const config = MILESTONE_CONFIG[milestone];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Portal>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-2xl shadow-2xl">
            {/* Confetti-like gradient */}
            <div className={`h-24 bg-gradient-to-br ${config.color} opacity-80`} />

            <div className="relative px-8 pb-8 -mt-12 text-center">
              {/* Icon with glow */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                className={`w-20 h-20 mx-auto rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl mb-4 ${config.glow}`}
              >
                <Icon size={36} className="text-purple-400" />
              </motion.div>

              {/* Sparkles */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center mb-3"
              >
                <Sparkles size={20} className="text-yellow-400" />
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-2">{config.title}</h2>
              <p className="text-sm text-text2/80 leading-relaxed mb-8">{config.body}</p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDismiss}
                className={`px-8 py-3 rounded-2xl bg-gradient-to-r ${config.color} text-white font-semibold text-sm shadow-xl transition-all hover:opacity-90`}
              >
                Continue Studying
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}
