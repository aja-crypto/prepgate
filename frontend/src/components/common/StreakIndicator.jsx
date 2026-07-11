import { motion } from 'framer-motion';
import { useFocus } from '../../context/FocusContext';
import { Flame } from 'lucide-react';

export default function StreakIndicator() {
  const { dailyStreak } = useFocus();

  if (dailyStreak === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Flame size={14} className="text-orange-400" />
      </motion.div>
      <span className="text-[11px] font-semibold text-orange-300">{dailyStreak}</span>
    </motion.div>
  );
}
