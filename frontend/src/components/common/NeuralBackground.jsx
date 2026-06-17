import { useState, useEffect, useRef } from 'react';

function NeuralBackground({ transparent } = {}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [energyWaves, setEnergyWaves] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const createWave = () => {
      setEnergyWaves(prev => {
        const newWave = {
          id: Date.now(),
          x: mousePosition.x,
          y: mousePosition.y,
          radius: 0,
          opacity: 0.3,
          color: '#8B5CF6',
        };
        const updated = [...prev, newWave];
        return updated.slice(-10);
      });
    };

    const interval = setInterval(createWave, 2000);
    return () => clearInterval(interval);
  }, [mousePosition]);

  useEffect(() => {
    const animateWaves = () => {
      setEnergyWaves(prev =>
        prev.map(wave => {
          const newRadius = wave.radius + 1.5;
          const newOpacity = wave.opacity - 0.005;
          if (newRadius > 150 || newOpacity <= 0) {
            return null;
          }
          return { ...wave, radius: newRadius, opacity: newOpacity };
        }).filter(wave => wave !== null)
      );
    };

    const animationId = setInterval(animateWaves, 50);
    return () => clearInterval(animationId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={transparent ? undefined : {
        background: 'radial-gradient(circle at center, #0F172A 0%, #020617 100%)',
      }}
    >
      {/* Deep navy gradient layers */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.15), transparent 40%),',
          backgroundSize: '100% 100%',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1), transparent 50%),',
          backgroundSize: '100% 100%',
        }}
      />

      {/* Neural mesh lines */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Neural connections */}
          <g stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" strokeDasharray="5,5">
            <line x1="100" y1="200" x2="400" y2="350" />
            <line x1="600" y1="150" x2="300" y2="500" />
            <line x1="200" y1="400" x2="700" y2="250" />
            <line x1="800" y1="300" x2="150" y2="600" />
            <line x1="350" y1="100" x2="650" y2="400" />
            <line x1="450" y1="600" x2="250" y2="200" />
          </g>
        </svg>
      </div>

      {/* Energy waves */}
      {energyWaves.map(wave => (
        <div
          key={wave.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: `${wave.radius * 2}px`,
            height: `${wave.radius * 2}px`,
            marginLeft: `${-wave.radius}px`,
            marginTop: `${-wave.radius}px`,
            background: `radial-gradient(circle, ${wave.color}${Math.round(wave.opacity * 255).toString(16).padStart(2, '0')}, transparent 70%)`,
            transform: `translate3d(${mousePosition.x * 2 - 50}px, ${mousePosition.y * 2 - 50}px, 0)`,
            transition: 'opacity 0.5s ease',
            filter: 'blur(20px)',
          }}
        />
      ))}

      {/* Subtle particle constellation */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[25%] left-[75%] w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[20%] w-1 h-1 rounded-full bg-[#06B6D4] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[35%] left-[85%] w-1 h-1 rounded-full bg-[#F59E0B] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[75%] left-[45%] w-1.5 h-1.5 rounded-full bg-[#F472B6] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[85%] left-[65%] w-1 h-1 rounded-full bg-[#22D3EE] animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[45%] left-[30%] w-1 h-1 rounded-full bg-[#6366F1] animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>
    </div>
  );
}

export default NeuralBackground;