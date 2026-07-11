import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CinematicBackground from '../components/login/CinematicBackground';
import GlassLoginCard from '../components/login/GlassLoginCard';
import MotivationalQuote from '../components/common/MotivationalQuote';
import LoginGiftCard from '../components/referral/LoginGiftCard';

const EXAM_DATE = new Date('2027-02-07T09:00:00');

function CountdownBadge() {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const calc = () => {
      const diff = EXAM_DATE - new Date();
      setDays(Math.max(0, Math.ceil(diff / 86400000)));
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      <span className="text-[11px] text-white/40 font-light">
        <span className="text-white/60 font-normal">GATE 2027</span> &middot; {days} days left
      </span>
    </motion.div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginStatus, setLoginStatus] = useState('idle');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleLoginSuccess = useCallback(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setMouse({ x, y });
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bg"
      onMouseMove={handleMouseMove}
    >
      <CinematicBackground />

      {/* Top-left: Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed top-5 left-5 z-20 flex items-center gap-2.5"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <picture>
            <source srcSet="/images/logo.webp" type="image/webp" />
            <img src="/images/logo.png" alt="GateNexa" className="w-5 h-5" />
          </picture>
        </div>
        <span
          className="text-sm font-medium text-white/70 hidden sm:block"
          style={{ fontFamily: "'Inter', -apple-system, sans-serif", letterSpacing: '0.02em' }}
        >
          GateNexa
        </span>
      </motion.div>

      {/* Top-right: Countdown */}
      <div className="fixed top-5 right-5 z-20">
        <CountdownBadge />
      </div>

      {/* Centered content: quote + login card */}
      <div className="relative z-10 w-full px-4 md:px-6 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">
        {/* Quote — hidden on mobile, left on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:block max-w-sm text-center lg:text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(124,58,237,0.1)',
            borderRadius: '20px',
            padding: '24px 28px',
          }}
        >
          <MotivationalQuote />
        </motion.div>

        <GlassLoginCard onStatusChange={setLoginStatus} mouse={mouse} onLoginSuccess={handleLoginSuccess} />
        {/* Gift Card — right side on desktop, below on mobile */}
        <div className="w-full max-w-[420px] lg:mt-4">
          <LoginGiftCard />
        </div>
      </div>
    </div>
  );
}
