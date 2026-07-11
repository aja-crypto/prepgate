import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFocus } from '../../context/FocusContext';
import { BarChart3, Clock, BookOpen, Target, Brain, ArrowRight } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } },
  item: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } },
};

const statColors = [
  { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.1)' },
  { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.1)' },
  { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.1)' },
  { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.1)' },
];

export default function AIDailyReview() {
  const { getDailyReview } = useFocus();
  const review = useMemo(() => getDailyReview(), [getDailyReview]);

  if (review.sessions === 0) return null;

  const statValues = [
    { value: `${review.hours}h ${review.minutes}m`, label: 'Study Hours' },
    { value: review.sessions, label: 'Sessions' },
    { value: `${review.focusScore}%`, label: 'Focus Score' },
    { value: review.subjects.length, label: 'Subjects' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-4"
      style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-white">AI Daily Review</span>
      </div>

      {/* Today's Summary - stat cards */}
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-2 gap-2 mb-4">
        {statValues.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={stagger.item}
            transition={{ duration: 0.25 }}
            className="rounded-xl p-3 text-center"
            style={{ background: statColors[idx].bg, border: `1px solid ${statColors[idx].border}` }}
          >
            <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
            <div className="text-[9px] text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tasks Completed */}
      {review.tasks.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Tasks Completed</div>
          <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-1">
            {review.tasks.slice(0, 4).map((task, idx) => (
              <motion.div key={idx} variants={stagger.item} transition={{ duration: 0.2 }} className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="text-green-400">✓</span>
                <span>{task}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Subjects Studied */}
      {review.subjects.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Subjects Studied</div>
          <motion.div variants={stagger.container} initial="initial" animate="animate" className="flex flex-wrap gap-2">
            {review.subjects.map((subject, idx) => (
              <motion.span
                key={idx}
                variants={stagger.item}
                transition={{ duration: 0.2 }}
                className="px-2 py-1 rounded-lg text-[10px] font-medium"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}
              >
                {subject}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}

      {/* Great work message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="rounded-xl p-3 mb-4 text-center"
        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}
      >
        <p className="text-sm font-semibold text-green-400">Great work today!</p>
      </motion.div>

      {/* Tomorrow's Recommendation */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain size={12} className="text-purple-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tomorrow's Recommendation</span>
        </div>
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-1.5">
          {review.recommendations.map((rec, idx) => (
            <motion.div key={idx} variants={stagger.item} transition={{ duration: 0.2 }} className="flex items-center gap-2 text-[11px]">
              <ArrowRight size={10} className="text-purple-400 shrink-0" />
              <span className="text-slate-300">{rec}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
