import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFocus } from '../../context/FocusContext';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } },
  item: { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 } },
};

export default function SmartContinuation() {
  const { getYesterdaySummary } = useFocus();
  const yesterday = useMemo(() => getYesterdaySummary(), [getYesterdaySummary]);

  if (yesterday.sessions === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl p-4 mb-4"
      style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-cyan-400" />
        <span className="text-xs font-semibold text-white">Yesterday You Completed</span>
      </div>

      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-2 mb-3">
        {yesterday.subjects.slice(0, 3).map((subject, idx) => (
          <motion.div key={idx} variants={stagger.item} transition={{ duration: 0.25 }} className="flex items-center gap-2">
            <CheckCircle size={12} className="text-green-400 shrink-0" />
            <span className="text-[11px] text-slate-300">{subject}</span>
          </motion.div>
        ))}
        {yesterday.tasks.slice(0, 3).map((task, idx) => (
          <motion.div key={`task-${idx}`} variants={stagger.item} transition={{ duration: 0.25 }} className="flex items-center gap-2">
            <CheckCircle size={12} className="text-green-400 shrink-0" />
            <span className="text-[11px] text-slate-300">{task}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span>{yesterday.hours}h {yesterday.minutes}m studied</span>
        <span>·</span>
        <span>{yesterday.sessions} session{yesterday.sessions > 1 ? 's' : ''}</span>
      </div>
    </motion.div>
  );
}
