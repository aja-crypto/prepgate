import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CinematicBackground from '../components/login/CinematicBackground';
import GlassLoginCard from '../components/login/GlassLoginCard';

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
          <img src="/images/logo.png" alt="GateNexa" className="w-5 h-5" />
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

      {/* Centered login card */}
      <div className="relative z-10 w-full px-6">
        <GlassLoginCard onStatusChange={setLoginStatus} mouse={mouse} onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
