import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const CONFETTI_COLORS = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'];

export default function CelebrationAnimation() {
  const { showCelebration, setShowCelebration } = useAuth();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!showCelebration) return;
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setParticles(items);
    const timer = setTimeout(() => {
      setShowCelebration(false);
      setParticles([]);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showCelebration, setShowCelebration]);

  const dismiss = () => {
    setShowCelebration(false);
    setParticles([]);
  };

  if (!showCelebration) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {particles.map(p => (
        <div key={p.id} className="absolute animate-celebration-particle" style={{
          left: `${p.left}%`,
          top: '-10%',
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.rotation % 120 < 60 ? '50%' : '2px',
          transform: `rotate(${p.rotation}deg)`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        }} />
      ))}
      <div className="pointer-events-auto text-center animate-celebration-text" style={{ animation: 'celebrationText 0.6s ease-out' }}>
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-purple-400"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Premium Unlocked!</h2>
        <p className="text-white/60 text-sm mb-6">Unlimited AI questions & full predictor access</p>
        <button onClick={dismiss} className="px-6 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white/80 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          Dismiss
        </button>
      </div>
      <style>{`
        @keyframes celebrationText {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-celebration-particle {
          animation: particleFall linear forwards;
        }
        @keyframes particleFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
