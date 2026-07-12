import { motion } from 'framer-motion';

export default function CuriosityGate({ isUnlocked, referralCode, children }) {
  if (isUnlocked) return children;

  return (
    <div className="relative" style={{ isolation: 'isolate' }}>
      {children}
    </div>
  );
}

CuriosityGate.Visible = function Visible({ children }) {
  return <>{children}</>;
};

CuriosityGate.Blurred = function Blurred({ isUnlocked, referralCode, userProgress, children }) {
  if (isUnlocked) return children;

  const remaining = userProgress ? userProgress.target - userProgress.invited : 2;
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
  const link = referralCode ? `${BASE_URL}/ref/${referralCode}` : '';

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch { /* noop */ }
  };

  return (
    <div className="relative">
      <div
        className="transition-all duration-500"
        style={{ filter: 'blur(10px)', opacity: 0.85 }}
      >
        {children}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute inset-0 flex items-center justify-center z-20 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-auto text-center relative overflow-hidden"
          style={{
            background: 'rgba(18,24,40,0.97)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(139,92,246,0.05)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)' }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#8B5CF6' : '#3B82F6',
                  left: `${10 + (i * 10)}%`,
                  top: `${20 + (i * 7)}%`,
                  opacity: 0.3,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <motion.div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-purple-400">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </motion.div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Unlock Full Prediction
            </h3>
            <p className="text-white/50 text-xs sm:text-sm mb-4 leading-relaxed">
              Refer <strong className="text-purple-400">{remaining} friend{remaining !== 1 ? 's' : ''}</strong> to instantly unlock IIT-wise recommendations, college comparison, choice filling, and detailed AI insights
            </p>

            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              {[
                'IIT Predictions', 'NIT & IIIT List',
                'College Comparison', 'Choice Filling',
                'Placement Data', 'AI Insights',
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/50">
                  <span className="text-purple-400 shrink-0">✦</span> {item}
                </div>
              ))}
            </div>

            {userProgress && (
              <div className="mb-5">
                <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
                  <span>Progress</span>
                  <span className="text-purple-400 font-medium">{userProgress.invited} / {userProgress.target}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(userProgress.invited / userProgress.target) * 100}%` }}
                    className="h-full rounded-full transition-all"
                    style={{ background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)' }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={copyLink}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              Refer & Unlock
            </button>

            <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                No payment required
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Unlock instantly
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
