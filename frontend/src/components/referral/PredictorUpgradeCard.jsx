import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PredictorUpgradeCard() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-6 text-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))',
        border: '1px solid rgba(139,92,246,0.15)',
      }}
    >
      {/* Blur background effect */}
      <div className="absolute inset-0 backdrop-blur-[2px]" style={{
        background: 'linear-gradient(135deg, rgba(10,15,30,0.6), rgba(10,15,30,0.4))',
      }} />

      <div className="relative z-10">
        <motion.div
          className="text-4xl mb-3"
          animate={{ y: [0, -4, 0], rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🎁
        </motion.div>

        <h3 className="text-base font-bold text-white mb-1">Unlock Complete Report</h3>
        <p className="text-xs text-slate-400 mb-4">
          See all colleges, detailed AI analysis, and personalized recommendations.
        </p>

        <div className="space-y-2 mb-5 max-w-[200px] mx-auto">
          {[
            'Full college list with rankings',
            'AI-powered chance analysis',
            'Placement & fee insights',
            'Personalized recommendations',
          ].map((f, i) => (
            <div key={f} className="flex items-center gap-2 text-[11px] text-slate-400">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-purple-400 shrink-0">
                <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/referral')}
          className="w-full max-w-[200px] mx-auto py-2.5 rounded-xl text-xs font-bold text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6C4DFF)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
          }}
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <span className="relative z-10">🎁 Invite 2 Friends → Unlock</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
