import { motion } from 'framer-motion';

const STATS = [
  { icon: '👥', value: '50K+', label: 'Aspirants' },
  { icon: '📄', value: '10K+', label: 'PYQs' },
  { icon: '🏆', value: 'Top Rank', label: 'Strategies' },
  { icon: '📈', value: 'High', label: 'Success Rate' },
  { icon: '🤖', value: 'AI Study', label: 'Coach 24x7' },
  { icon: '📅', value: 'Smart', label: 'Planner' },
  { icon: '📝', value: 'PYQ', label: 'Practice' },
  { icon: '🧪', value: 'Mock', label: 'Tests' },
];

export default function LoginStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="w-full overflow-x-auto scrollbar-none"
    >
      <div className="flex gap-3 min-w-max px-2 py-3">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 + i * 0.05 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(139, 92, 246, 0.06)',
              border: '1px solid rgba(139, 92, 246, 0.1)',
            }}
          >
            <span className="text-sm">{s.icon}</span>
            <div className="text-[10px] leading-tight">
              <span className="font-bold text-white block">{s.value}</span>
              <span className="text-slate-400">{s.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
