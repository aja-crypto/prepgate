import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AiUpgradeModal({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(18,24,40,0.98), rgba(10,15,30,0.98))',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 0 60px rgba(139,92,246,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)', filter: 'blur(50px)' }} />

            <div className="relative z-10 text-center">
              {/* Gift */}
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -5, 0], rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎁
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-2">Unlock Premium</h2>
              <p className="text-sm text-slate-400 mb-2">
                You've used today's free AI questions.
              </p>
              <p className="text-xs text-purple-300/70 mb-6">
                Invite 2 friends to unlock unlimited access.
              </p>

              {/* Benefits */}
              <div className="space-y-2.5 mb-6 text-left">
                {[
                  'AI Assistant — 100 questions/day',
                  'AI NEXA Predictor — Full access',
                  'AI Reports & Personalized Insights',
                  'Future Premium Features',
                ].map((b, i) => (
                  <motion.div key={b}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-2.5 text-xs"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-purple-400">
                        <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                      </svg>
                    </div>
                    <span className="text-slate-300">{b}</span>
                  </motion.div>
                ))}
              </div>

              {/* Buttons */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); navigate('/referral'); }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white mb-2 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #6C4DFF)',
                  boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative z-10">🎁 Invite Friends</span>
              </motion.button>

              <button onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
