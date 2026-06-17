import React from 'react';

const AIRobotMindIcon = ({ size = 46, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* AI Mind Background Glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, rgba(168, 85, 247, 0.45) 40%, transparent 70%)',
          transform: 'scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: 'brainPulse 2.5s ease-in-out infinite',
        }}
      />

      {/* Orbiting Particle Wrapper */}
      <div className="absolute inset-0" style={{ animation: 'rotateOrbit 12s linear infinite' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: '6px',
              height: '6px',
              background: i % 2 === 0 ? '#22d3ee' : '#a855f7',
              boxShadow: `0 0 8px ${i % 2 === 0 ? '#22d3ee' : '#a855f7'}`,
              left: '50%',
              top: '50%',
              transformOrigin: 'center center',
              transform: `rotate(${i * 45}deg) translateY(-24px) translateX(-50%)`,
            }}
          />
        ))}
      </div>

      {/* Pulsing Energy Wave */}
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: '#a855f7',
          opacity: 0.4,
          animation: 'pulseWave 2.5s ease-out infinite',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 14px rgba(34, 211, 238, 0.7)) drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))',
          animation: 'float 3.5s ease-in-out infinite',
        }}
      >
        {/* AI Robot Mind Gradients */}
        <defs>
          <radialGradient id="mindBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0a0f2c" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>

          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0a0f2c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* AI Mind Background */}
        <circle cx="50" cy="48" r="45" fill="url(#mindBgGlow)" />

        {/* Neural Network Connections */}
        <g style={{ opacity: 0.7 }}>
          {/* Top Neural Lines */}
          <line x1="50" y1="25" x2="30" y2="35" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
          </line>
          <line x1="50" y1="25" x2="70" y2="35" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
          </line>

          {/* Middle Neural Lines */}
          <line x1="35" y1="48" x2="25" y2="50" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="0.1s" />
          </line>
          <line x1="65" y1="48" x2="75" y2="50" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
          </line>

          {/* Bottom Neural Lines */}
          <line x1="40" y1="62" x2="30" y2="70" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0.15s" />
          </line>
          <line x1="60" y1="62" x2="70" y2="70" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0.35s" />
          </line>

          {/* Neural Nodes */}
          <circle cx="30" cy="35" r="1.5" fill="#22d3ee">
            <animate attributeName="r" values="1.2;2;1.2" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="35" r="1.5" fill="#a855f7">
            <animate attributeName="r" values="1.2;2;1.2" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
          </circle>
          <circle cx="25" cy="50" r="1.5" fill="#a855f7">
            <animate attributeName="r" values="1.2;2;1.2" dur="1.8s" repeatCount="indefinite" begin="0.1s" />
          </circle>
          <circle cx="75" cy="50" r="1.5" fill="#22d3ee">
            <animate attributeName="r" values="1.2;2;1.2" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle cx="30" cy="70" r="1.5" fill="#22d3ee">
            <animate attributeName="r" values="1.2;2;1.2" dur="2s" repeatCount="indefinite" begin="0.15s" />
          </circle>
          <circle cx="70" cy="70" r="1.5" fill="#a855f7">
            <animate attributeName="r" values="1.2;2;1.2" dur="2s" repeatCount="indefinite" begin="0.35s" />
          </circle>
        </g>

        {/* Main Bat-Wing Gate Symbol */}
        <path
          d="M 22 45 C 30 35, 70 35, 78 45 L 90 50 L 85 60 L 75 70 L 70 75 L 65 70 L 60 65 L 55 70 L 50 75 L 45 70 L 40 65 L 35 70 L 30 75 L 25 70 L 15 60 L 10 50 L 22 45 Z"
          fill="url(#wingGradient)"
          stroke="#06b6d4"
          strokeWidth="1.6"
          opacity="0.95"
        />

        {/* Central Gate Pillar */}
        <rect
          x="40"
          y="20"
          width="20"
          height="55"
          rx="4"
          fill="url(#wingGradient)"
          stroke="#a855f7"
          strokeWidth="2"
        />

        {/* Gate Arch */}
        <path
          d="M 35 30 Q 50 15 65 30"
          stroke="#a855f7"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Gate Base */}
        <rect
          x="30"
          y="65"
          width="40"
          height="10"
          rx="3"
          fill="#020617"
          stroke="#06b6d4"
          strokeWidth="1.6"
        />

        {/* Your Profile Image */}
        <image
          href="/images/my dp.jpg"
          x="34"
          y="32"
          width="32"
          height="32"
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Purple Border Around Profile */}
        <circle
          cx="50"
          cy="48"
          r="16"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px #a855f7)' }}
        />

        {/* Dark Overlay for Blend */}
        <circle cx="50" cy="48" r="16" fill="rgba(2,6,23,0.3)" />

        {/* AI Robot Mind Core */}
        <circle cx="50" cy="48" r="32" fill="url(#coreGlow)" opacity="0.6">
          <animate attributeName="r" values="30;36;30" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.4;0.6" dur="2.2s" repeatCount="indefinite" />
        </circle>

        <circle
          cx="50"
          cy="48"
          r="8"
          fill="#22d3ee"
          style={{ filter: 'drop-shadow(0 0 12px #22d3ee) drop-shadow(0 0 24px #a855f7)' }}
        >
          <animate attributeName="r" values="7.5;9;7.5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="50" cy="48" r="3.5" fill="white" opacity="1" />
      </svg>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes brainPulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        @keyframes rotateOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulseWave {
          0% { 
            transform: scale(0.5); 
            opacity: 0.7;
          }
          100% { 
            transform: scale(1.8); 
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
};

export default AIRobotMindIcon;
