import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let anim;
    const ps = Array.from({ length: 20 }, () => ({ x: Math.random() * 300, y: Math.random() * 400, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, s: Math.random() * 2 + 1, a: Math.random() * 0.3 + 0.1 }));
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.fillStyle = `rgba(168,85,247,${p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      }
      anim = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function PremiumGiftCard({ compact = false }) {
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl p-4 max-w-[280px]"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))',
          border: '1px solid rgba(139,92,246,0.2)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.span className="text-2xl" animate={{ rotate: [0, -6, 6, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎁</motion.span>
          <div>
            <div className="text-sm font-bold text-white">Welcome Gift</div>
            <div className="text-[10px] text-purple-300">Invite 2 friends → Premium</div>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-700/50 mb-2 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #8B5CF6, #A855F7)' }}
            initial={{ width: 0 }} animate={{ width: '0%' }} transition={{ duration: 1 }} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
          <span>0 / 2 friends</span>
          <span>0%</span>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/register')}
          className="w-full text-[11px] font-semibold text-white py-2 rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6C4DFF)' }}
        >
          🎁 View Rewards
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-[320px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ParticleCanvas />
      <motion.div
        className="relative z-10 rounded-3xl p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))',
          border: '1px solid rgba(139,92,246,0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: hover ? '0 0 60px rgba(139,92,246,0.25)' : '0 0 30px rgba(139,92,246,0.1)',
        }}
        animate={{
          y: [0, -4, 0],
          rotate: [-1, 1, -1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent)', filter: 'blur(40px)' }} />

        <div className="relative z-10">
          {/* Gift Icon */}
          <motion.div
            className="text-center mb-4"
            animate={hover ? { rotate: [0, -10, 10, -10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="inline-block text-5xl"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🎁
            </motion.span>
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white text-center mb-1">
            Premium Gift Awaits
          </h3>
          <p className="text-center text-xs text-purple-300/70 mb-4">
            Invite 2 Friends · Unlock FREE
          </p>

          {/* Features */}
          <div className="space-y-2 mb-5">
            {[
              'AI NEXA Predictor (Premium)',
              'AI Assistant (100 Qs / Day)',
              'Complete College Prediction',
              'AI Reports & Insights',
              'Future Premium Features',
            ].map((f, i) => (
              <motion.div key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-2 text-[11px]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-purple-400 shrink-0">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-300">{f}</span>
              </motion.div>
            ))}
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(isPremium ? '/referral' : '/register')}
            className="w-full py-3 rounded-xl text-sm font-bold text-white relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6C4DFF)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative z-10">🎁 {isPremium ? 'Manage Premium' : 'Unlock Premium'}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
