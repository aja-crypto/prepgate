import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFocus } from '../../context/FocusContext';
import { Calendar, Clock, BookOpen, TrendingUp, ChevronRight } from 'lucide-react';

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getDateLabel(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const date = new Date(dateStr);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } },
};

export default function DailyHistoryTimeline() {
  const { getDailyHistory, getWeeklyMonthlyTotals } = useFocus();
  
  const dailyHistory = useMemo(() => getDailyHistory(), [getDailyHistory]);
  const totals = useMemo(() => getWeeklyMonthlyTotals(), [getWeeklyMonthlyTotals]);

  if (dailyHistory.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-4"
        style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-purple-400" /> Study History
        </div>
        <div className="text-center py-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
            <Calendar size={24} className="text-slate-600 mx-auto mb-2" />
          </motion.div>
          <p className="text-[11px] text-slate-500">No study history yet</p>
          <p className="text-[10px] text-slate-600">Complete a focus session to see your timeline</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="rounded-2xl p-4"
      style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
        <Calendar size={14} className="text-purple-400" /> Study History
      </div>

      {/* Timeline */}
      <div className="space-y-2 mb-4">
        {dailyHistory.slice(0, 7).map((day, idx) => (
          <motion.div
            key={day.date}
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
            style={{ 
              background: idx === 0 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
              border: idx === 0 ? '1px solid rgba(139,92,246,0.15)' : '1px solid rgba(255,255,255,0.04)'
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-white">{getDateLabel(day.date)}</span>
                {idx === 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Active</span>}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {formatDuration(day.totalMinutes)}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <BookOpen size={10} /> {day.sessions} session{day.sessions > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">{day.subjects.length} subject{day.subjects.length > 1 ? 's' : ''}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Totals */}
      <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="pt-3 border-t border-white/5">
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="rounded-xl p-3 text-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="text-lg font-bold text-white font-mono">{totals.weekly.hours}h {totals.weekly.minutes}m</div>
            <div className="text-[9px] text-slate-500">This Week</div>
          </motion.div>
          <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="rounded-xl p-3 text-center" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}>
            <div className="text-lg font-bold text-white font-mono">{totals.monthly.hours}h {totals.monthly.minutes}m</div>
            <div className="text-[9px] text-slate-500">This Month</div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
