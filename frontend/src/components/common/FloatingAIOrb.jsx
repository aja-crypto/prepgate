import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingAIOrb() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {hovered && (
        <div className="absolute bottom-16 right-0 mb-2 px-3 py-2 rounded-xl text-xs font-medium text-white whitespace-nowrap animate-fade-in"
          style={{ background: 'rgba(12,15,35,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167,139,250,0.2)' }}>
          Ask GateApex AI
          <div className="absolute -bottom-1 right-4 w-2 h-2 rotate-45" style={{ background: 'rgba(12,15,35,0.9)', border: '1px solid rgba(167,139,250,0.2)', borderTop: 'none', borderLeft: 'none' }} />
        </div>
      )}

      <button
        onClick={() => navigate('/GateApex-ai')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
        style={{ background: 'rgba(12,15,35,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        {/* Breathing glow rings */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.4), transparent 70%)',
          animation: 'ai-orb-glow 2.5s ease-in-out infinite',
        }} />
        <span className="absolute inset-[-4px] rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.3), transparent 70%)',
          animation: 'ai-orb-glow 2.5s ease-in-out infinite 0.8s',
        }} />

        {/* Core icon */}
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' }}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <style>{`
        @keyframes ai-orb-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

