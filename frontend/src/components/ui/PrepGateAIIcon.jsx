import React from 'react';

/**
 * Premium PrepGate AI Brand Icon - AI Robot Mind Animation
 * - Bat-wing inspired silhouette with gate concept
 * - Neural network connections, brain waves
 * - Dark navy, purple, cyan theme
 * - AI mind visual effects
 * - Professional SaaS appearance
 * - Full animation support
 * 
 * @param {Object} props
 * @param {number} [props.size=32] - Icon size in pixels
 * @param {boolean} [props.thinking=false] - Show AI thinking animation
 * @param {boolean} [props.listening=false] - Show listening sound waves
 * @param {boolean} [props.notification=false] - Show notification spark
 * @param {string} [props.className=''] - Additional CSS classes
 */
const PrepGateAIIcon = ({ size = 32, thinking = false, listening = false, notification = false, className = '' }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* AI Mind Background Glow Effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, rgba(168, 85, 247, 0.45) 40%, transparent 70%)',
          transform: thinking ? 'scale(1.35)' : 'scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: 'brainPulse 2.5s ease-in-out infinite',
        }}
      />

      {/* Neural Network Rings (Thinking Mode) */}
      {thinking && (
        <>
          {/* Outer Neural Ring */}
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: 'transparent',
              borderImage: 'linear-gradient(135deg, #22d3ee, #A855F7, #F59E0B, #22d3ee) 1',
              animation: 'neuralRotate1 1.5s linear infinite',
            }}
          />
          {/* Middle Neural Ring */}
          <div
            className="absolute inset-2 rounded-full border border-dashed border-cyan-400"
            style={{
              opacity: 0.7,
              animation: 'neuralRotate2 2s linear infinite reverse',
            }}
          />
          {/* Inner Neural Ring */}
          <div
            className="absolute inset-4 rounded-full border border-purple-300"
            style={{
              opacity: 0.5,
              animation: 'neuralRotate1 2.5s linear infinite',
            }}
          />
        </>
      )}

      {/* Brain Wave Listening Effect */}
      {listening && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border-2"
              style={{
                width: '100%',
                height: '100%',
                borderColor: i % 2 === 0 ? '#22d3ee' : '#A855F7',
                opacity: 0.8 - i * 0.18,
                animation: `brainWave 1s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Notification Spark */}
      {notification && (
        <>
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-ping"
            style={{ boxShadow: '0 0 14px #22d3ee, 0 0 28px #A855F7' }}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
            style={{ boxShadow: '0 0 10px #A855F7' }}
          />
        </>
      )}

      {/* AI Robot Mind Symbol */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.7)) drop-shadow(0 0 8px rgba(168,85,247,0.5))',
          animation: 'float 3.5s ease-in-out infinite',
        }}
      >
        {/* AI Mind Gradients */}
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

        {/* AI Mind Background Glow */}
        <circle cx="50" cy="48" r="45" fill="url(#mindBgGlow)" />

        {/* Neural Network Connections */}
        <g style={{ opacity: 0.7 }}>
          {/* Top connections */}
          <line x1="50" y1="25" x2="30" y2="35" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
          </line>
          <line x1="50" y1="25" x2="70" y2="35" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
          </line>
          
          {/* Middle connections */}
          <line x1="35" y1="48" x2="25" y2="50" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="0.1s" />
          </line>
          <line x1="65" y1="48" x2="75" y2="50" stroke="url(#neuralGradient)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
          </line>
          
          {/* Bottom connections */}
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

        {/* Bat wings with gate motif */}
        <path
          d="M 22 45 C 30 35, 70 35, 78 45 L 90 50 L 85 60 L 75 70 L 70 75 L 65 70 L 60 65 L 55 70 L 50 75 L 45 70 L 40 65 L 35 70 L 30 75 L 25 70 L 15 60 L 10 50 L 22 45 Z"
          fill="url(#wingGradient)"
          stroke="#06b6d4"
          strokeWidth="1.6"
          opacity="0.95"
        />

        {/* Central Gate Pillar */}
        <rect x="40" y="20" width="20" height="55" rx="4" fill="url(#wingGradient)" stroke="#a855f7" strokeWidth="2" />

        {/* Gate Arch */}
        <path d="M 35 30 Q 50 15 65 30" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Gate Base */}
        <rect x="30" y="65" width="40" height="10" rx="3" fill="#020617" stroke="#06b6d4" strokeWidth="1.6" />

        {/* Your Profile Picture in the Symbol */}
        <image
          href="/images/my dp.jpg"
          x="34"
          y="32"
          width="32"
          height="32"
          preserveAspectRatio="xMidYMid slice"
        />
        {/* Purple Border around Profile */}
        <circle
          cx="50"
          cy="48"
          r="16"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px #A855F7)' }}
        />
        {/* Dark Overlay to Blend */}
        <circle
          cx="50"
          cy="48"
          r="16"
          fill="rgba(2,6,23,0.3)"
        />

        {/* AI Robot Mind Core */}
        <circle cx="50" cy="48" r="32" fill="url(#coreGlow)" opacity="0.6">
          <animate attributeName="r" values="30;36;30" dur={thinking ? "1.2s" : "2.2s"} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.4;0.6" dur={thinking ? "1.2s" : "2.2s"} repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="48" r="8" fill="#22d3ee" style={{ filter: 'drop-shadow(0 0 12px #22d3ee) drop-shadow(0 0 24px #A855F7)' }}>
          <animate attributeName="r" values="7.5;9;7.5" dur={thinking ? "0.9s" : "1.8s"} repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="48" r="3.5" fill="white" opacity="1" />
      </svg>

      {/* AI Robot Mind Animations */}
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
        
        @keyframes neuralRotate1 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes neuralRotate2 {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes brainWave {
          0% { 
            transform: scale(0.35); 
            opacity: 0.9;
          }
          100% { 
            transform: scale(2.4); 
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
};

export default PrepGateAIIcon;
