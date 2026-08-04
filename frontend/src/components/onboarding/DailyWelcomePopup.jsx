import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Flame, Trophy, TrendingUp, X, CheckCircle2, LayoutDashboard, Brain, Calendar, Timer } from 'lucide-react';
import Portal from '../ui/Portal';

const DAY_MESSAGES = {
  first: {
    title: 'Welcome to GateNexa!',
    subtitle: 'Today is Day 1 of your GATE 2027 journey.',
    body: "Every AIR starts with Day 1.\n\nLet's build your future together.",
    gradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
    icon: Sparkles,
    missions: [
      { icon: LayoutDashboard, label: 'Explore Dashboard', link: '/dashboard' },
      { icon: Brain, label: 'Watch one Motivation Video', link: '/learning-hub' },
      { icon: Calendar, label: 'Create your first Study Plan', link: '/planner' },
      { icon: Timer, label: 'Complete your first Focus Session', link: '/productivity' },
    ],
    actionLabel: 'Begin Journey',
  },
  second: {
    title: 'Welcome Back!',
    subtitle: 'Day 2 — Building momentum.',
    body: (data) => {
      const parts = ['Yesterday you studied and made progress.\n'];
      if (data.streak > 0) parts.push(`🔥 ${data.streak}-day streak!\n`);
      parts.push("Today's goal is ready.");
      return parts.join('\n');
    },
    gradient: 'from-blue-600 via-indigo-500 to-violet-500',
    icon: Flame,
    missions: [
      { icon: LayoutDashboard, label: 'Check your Dashboard', link: '/dashboard' },
      { icon: Brain, label: 'Review AI Recommendations', link: '/ai-coach' },
      { icon: Timer, label: 'Start a Focus Session', link: '/productivity' },
      { icon: Calendar, label: 'Follow today\'s Planner', link: '/planner' },
    ],
    actionLabel: 'Open Planner',
  },
  third: {
    title: 'Day 3!',
    subtitle: 'Consistency beats motivation.',
    body: (data) => {
      const parts = ["Your consistency is building.\n"];
      if (data.streak > 0) parts.push(`🔥 ${data.streak}-day streak!\n`);
      parts.push("Today's recommendation: Focus on your weak areas.\n\nEstimated Gain: +3 Marks");
      return parts.join('\n');
    },
    gradient: 'from-emerald-600 via-teal-500 to-cyan-500',
    icon: TrendingUp,
    missions: [
      { icon: Brain, label: 'Study your weakest subject', link: '/subjects' },
      { icon: Timer, label: 'Complete 2-hour focus session', link: '/productivity' },
      { icon: LayoutDashboard, label: 'Solve 10 PYQs', link: '/pyq' },
      { icon: Calendar, label: 'Update your study plan', link: '/planner' },
    ],
    actionLabel: 'Start Studying',
  },
  fourth: {
    title: 'You\'re Improving!',
    subtitle: 'Building study habits.',
    body: 'Every session adds up. Keep the momentum going!\n\nGateNexa AI has prepared your personalized plan for today.',
    gradient: 'from-orange-600 via-amber-500 to-yellow-500',
    icon: Flame,
    missions: [
      { icon: Brain, label: 'Check AI Coach', link: '/ai-coach' },
      { icon: Timer, label: 'Focus Session', link: '/productivity' },
      { icon: LayoutDashboard, label: 'Review Progress', link: '/analytics' },
      { icon: Calendar, label: 'Follow Planner', link: '/planner' },
    ],
    actionLabel: 'Continue',
  },
  week: {
    title: 'One Week Complete!',
    subtitle: 'Amazing consistency.',
    body: 'A full week of dedicated preparation.\n\nGateNexa AI has analyzed your progress and prepared your plan for the next week.\n\nKeep going — you\'re building something great!',
    gradient: 'from-rose-600 via-pink-500 to-purple-500',
    icon: Trophy,
    missions: [
      { icon: LayoutDashboard, label: 'View Weekly Report', link: '/analytics' },
      { icon: Brain, label: 'Check AI Roadmap', link: '/personalized-roadmap' },
      { icon: Timer, label: 'Take a Mock Test', link: '/mocks' },
      { icon: Calendar, label: 'Plan next week', link: '/planner' },
    ],
    actionLabel: 'View Report',
  },
  returning: {
    title: 'Welcome Back!',
    subtitle: 'Your journey continues.',
    body: (data) => `You're on a ${data.streak > 0 ? `${data.streak}-day streak` : 'growing journey'}.\n\nToday's personalized plan is waiting for you.`,
    gradient: 'from-violet-600 via-purple-500 to-indigo-500',
    icon: Sparkles,
    missions: [
      { icon: LayoutDashboard, label: 'Open Dashboard', link: '/dashboard' },
      { icon: Brain, label: 'Check AI Recommendations', link: '/ai-coach' },
      { icon: Timer, label: 'Start Focus Session', link: '/productivity' },
      { icon: Calendar, label: 'Follow Planner', link: '/planner' },
    ],
    actionLabel: 'Start Today',
  },
};

export default function DailyWelcomePopup({ data, onDismiss, onStartPlan }) {
  const msg = DAY_MESSAGES[data.dayLabel] || DAY_MESSAGES.returning;
  const Icon = msg.icon;

  const bodyText = typeof msg.body === 'function' ? msg.body(data) : msg.body;

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
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          className="relative w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">
            {/* Gradient header */}
            <div className={`h-32 bg-gradient-to-br ${msg.gradient} opacity-90`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            </div>

            <div className="relative px-8 pb-8 -mt-12">
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl mb-6">
                <Icon size={36} className="text-purple-400" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-1">{msg.title}</h2>
              <p className="text-sm text-purple-300/80 font-medium mb-4">{msg.subtitle}</p>

              {/* Body */}
              <p className="text-sm text-text2/80 leading-relaxed whitespace-pre-line mb-6">{bodyText}</p>

              {/* Mission checklist */}
              {msg.missions && (
                <div className="mb-8">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Today's Mission</p>
                  <div className="space-y-2">
                    {msg.missions.map((mission, i) => {
                      const MissionIcon = mission.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <MissionIcon size={14} className="text-purple-400" />
                          </div>
                          <span className="text-sm text-text2/80 flex-1">{mission.label}</span>
                          <CheckCircle2 size={16} className="text-white/10" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartPlan}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm shadow-xl hover:from-purple-500 hover:to-pink-500 transition-all"
                >
                  <Sparkles size={16} />
                  {msg.actionLabel || "Start Today's Plan"}
                  <ArrowRight size={16} />
                </motion.button>
                <button
                  onClick={onDismiss}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-text2 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}
