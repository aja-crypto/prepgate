import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FloatingGiftWidget() {
  const { user, isPremium, referralProgress } = useAuth();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  if (!user) return null;
  const hideOn = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/admin/login'];
  if (hideOn.includes(window.location.pathname)) return null;
  if (window.location.pathname.startsWith('/admin')) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: 'spring', damping: 15 }}
      className="fixed z-[9999]"
      style={{ bottom: 'max(100px, calc(5rem + env(safe-area-inset-bottom, 0px)))', right: 30 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.button
        whileHover={{ scale: 1.12, rotate: [0, -10, 10, -10, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/referral')}
        className="relative flex items-center justify-center rounded-full cursor-pointer"
        style={{
          width: 52, height: 52,
          background: isPremium
            ? 'linear-gradient(135deg, #F59E0B, #D97706)'
            : 'linear-gradient(135deg, #8B5CF6, #6C4DFF)',
          boxShadow: hover
            ? `0 0 30px ${isPremium ? 'rgba(245,158,11,0.5)' : 'rgba(139,92,246,0.5)'}`
            : `0 0 15px ${isPremium ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)'}`,
          transition: 'box-shadow 0.3s ease',
        }}
        aria-label="Referral Rewards"
      >
        <motion.span
          className="text-xl"
          animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isPremium ? '⭐' : '🎁'}
        </motion.span>

        {/* Notification dot */}
        {!isPremium && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.max(0, 2 - Math.round(referralProgress / 50))}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, x: 6, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl whitespace-nowrap pointer-events-none"
            style={{ background: 'rgba(5,8,22,0.95)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <div className="text-xs font-bold text-white">
              {isPremium ? '⭐ Premium Active' : '🎁 Free Premium'}
            </div>
            <div className="text-[10px] font-medium text-purple-400">
              {isPremium ? 'Unlocked via referrals!' : `Invite 2 friends → ${Math.round(referralProgress)}%`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
