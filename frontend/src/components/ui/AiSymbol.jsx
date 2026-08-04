export default function AiSymbol({ size = 32, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.7)) drop-shadow(0 0 8px rgba(168,85,247,0.5))' } : {}}>
      <defs>
        <radialGradient id="ai-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15"/>
          <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#0a0f2c" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="ai-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#020617"/>
          <stop offset="50%" stopColor="#1e1b4b"/>
          <stop offset="100%" stopColor="#020617"/>
        </linearGradient>
        <linearGradient id="ai-neural" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="50%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#22d3ee"/>
        </linearGradient>
        <radialGradient id="ai-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
          <stop offset="20%" stopColor="#22d3ee" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#0a0f2c" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="48" r="45" fill="url(#ai-bg)"/>
      <g opacity="0.7">
        <line x1="50" y1="25" x2="30" y2="35" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="50" y1="25" x2="70" y2="35" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="35" y1="48" x2="25" y2="50" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="65" y1="48" x2="75" y2="50" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="40" y1="62" x2="30" y2="70" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="60" y1="62" x2="70" y2="70" stroke="url(#ai-neural)" strokeWidth="0.8" strokeLinecap="round"/>
        <circle cx="30" cy="35" r="1.5" fill="#22d3ee"/>
        <circle cx="70" cy="35" r="1.5" fill="#a855f7"/>
        <circle cx="25" cy="50" r="1.5" fill="#a855f7"/>
        <circle cx="75" cy="50" r="1.5" fill="#22d3ee"/>
        <circle cx="30" cy="70" r="1.5" fill="#22d3ee"/>
        <circle cx="70" cy="70" r="1.5" fill="#a855f7"/>
      </g>
      <path d="M22 45 C30 35,70 35,78 45 L90 50 L85 60 L75 70 L70 75 L65 70 L60 65 L55 70 L50 75 L45 70 L40 65 L35 70 L30 75 L25 70 L15 60 L10 50 L22 45 Z" fill="url(#ai-wing)" stroke="#06b6d4" strokeWidth="1.6" opacity="0.95"/>
      <rect x="40" y="20" width="20" height="55" rx="4" fill="url(#ai-wing)" stroke="#a855f7" strokeWidth="2"/>
      <path d="M35 30 Q50 15,65 30" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <rect x="30" y="65" width="40" height="10" rx="3" fill="#020617" stroke="#06b6d4" strokeWidth="1.6"/>
      <circle cx="50" cy="48" r="16" fill="none" stroke="#a855f7" strokeWidth="2" style={glow ? { filter: 'drop-shadow(rgb(168,85,247) 0 0 6px)' } : {}}/>
      <circle cx="50" cy="48" r="16" fill="rgba(2,6,23,0.3)"/>
      <circle cx="50" cy="48" r="32" fill="url(#ai-core)" opacity="0.6"/>
      <circle cx="50" cy="48" r="8" fill="#22d3ee" style={glow ? { filter: 'drop-shadow(rgb(34,211,238) 0 0 12px) drop-shadow(rgb(168,85,247) 0 0 24px)' } : {}}/>
      <circle cx="50" cy="48" r="3.5" fill="white" opacity="1"/>
    </svg>
  );
}
