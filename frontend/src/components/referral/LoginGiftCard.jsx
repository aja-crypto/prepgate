import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LoginGiftCard() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))',
        border: '1px solid rgba(139,92,246,0.15)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="text-2xl shrink-0 mt-0.5"
          animate={{ rotate: [0, -6, 6, -6, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          🎁
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Welcome Gift</div>
          <p className="text-[10px] text-purple-300/70 mt-0.5">Invite 2 friends → Unlock Premium</p>
          <div className="mt-2 w-full h-1 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #8B5CF6, #A855F7)' }}
              initial={{ width: 0 }}
              animate={{ width: '0%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-slate-500">0 / 2 friends</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="text-[10px] font-semibold text-purple-300 px-3 py-1 rounded-lg transition-all"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              View Rewards →
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
