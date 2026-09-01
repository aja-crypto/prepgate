import { useRef, useMemo, useState, Suspense, useCallback, memo, useEffect, lazy } from 'react';

const AIBrainThree = lazy(() => import('./AIBrainThree'));

function NeuralBrain2DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <style>{`
        @keyframes brain-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes brain-glow { 0%,100% { filter: drop-shadow(0 0 30px rgba(124,58,237,0.4)); } 50% { filter: drop-shadow(0 0 60px rgba(124,58,237,0.7)); } }
        @keyframes ring-pulse { 0%,100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.25; transform: scale(1.03); } }
      `}</style>
      <div className="relative" style={{ animation: 'brain-breathe 4s ease-in-out infinite, brain-glow 3s ease-in-out infinite' }}>
        <svg viewBox="0 0 200 180" className="w-64 h-64 sm:w-80 sm:h-80">
          <ellipse cx="100" cy="75" rx="70" ry="60" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="0.5" />
          <ellipse cx="100" cy="75" rx="65" ry="55" fill="rgba(124,58,237,0.05)" stroke="rgba(139,92,246,0.2)" strokeWidth="0.3" />
          {Array.from({ length: 40 }, (_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const r = 30 + Math.random() * 25;
            const cx = 100 + Math.cos(angle) * r * (0.8 + Math.random() * 0.4);
            const cy = 75 + Math.sin(angle) * r * (0.7 + Math.random() * 0.3);
            return <circle key={i} cx={cx} cy={cy} r="1.5" fill="#C4B5FD" opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" /></circle>;
          })}
          {Array.from({ length: 25 }, (_, i) => {
            const x1 = 60 + Math.random() * 80, y1 = 40 + Math.random() * 70;
            const x2 = x1 + (Math.random() - 0.5) * 40, y2 = y1 + (Math.random() - 0.5) * 30;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(139,92,246,0.2)" strokeWidth="0.3" />;
          })}
        </svg>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: `${40 + i * 15}%`, height: '4px',
          bottom: `${25 - i * 3}%`, left: '50%', transform: 'translateX(-50%)',
          background: `rgba(139,92,246,${0.2 - i * 0.05})`,
          borderRadius: '50%',
          animation: `ring-pulse 3s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  );
}

const MemoizedBrainCanvas = memo(function MemoizedBrainCanvas() {
  return (
    <Suspense fallback={<NeuralBrain2DFallback />}>
      <AIBrainThree />
    </Suspense>
  );
});

export default function AIBrainScene() {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const tooltipRef = useRef({ x: 0, y: 0 });
  const regionRef = useRef(null);
  const containerRef = useRef(null);
  const [show3D, setShow3D] = useState(false);
  useEffect(() => {
    let id;
    if ('requestIdleCallback' in window) {
      id = requestIdleCallback(() => setShow3D(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      id = setTimeout(() => setShow3D(true), 1200);
      return () => clearTimeout(id);
    }
  }, []);
  const useWebGL = useMemo(() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  }, []);
  const handleMouseMove = useCallback((e) => {
    tooltipRef.current = { x: e.clientX, y: e.clientY };
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    let region = null;
    if (y < -0.3) region = { label: 'Theory of Computation', progress: 81, weakTopics: 2 };
    else if (x > 0.3) region = y > 0 ? { label: 'Computer Networks', progress: 58, weakTopics: 6 } : { label: 'Operating Systems', progress: 78, weakTopics: 3 };
    else if (x < -0.3) region = y > 0 ? { label: 'Algorithms & DS', progress: 72, weakTopics: 4 } : { label: 'Engineering Math', progress: 54, weakTopics: 7 };
    else if (y > 0.3) region = { label: 'Compiler Design', progress: 45, weakTopics: 8 };
    if (region?.label !== regionRef.current?.label) {
      regionRef.current = region;
      setHoveredRegion(region);
    }
  }, []);
  const tooltip = hoveredRegion && (
    <div className="fixed z-50 pointer-events-none" style={{ left: tooltipRef.current.x + 16, top: tooltipRef.current.y - 10 }}>
      <div className="rounded-xl px-4 py-3 backdrop-blur-md" style={{ background: 'rgba(5,8,22,0.92)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
        <div className="text-sm font-bold text-white">{hoveredRegion.label}</div>
        <div className="flex items-center gap-4 mt-1.5">
          <div><span className="text-xs font-mono font-bold" style={{ color: '#A78BFA' }}>{hoveredRegion.progress}%</span><span className="text-[8px] ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Progress</span></div>
          <div><span className="text-xs font-mono font-bold text-white">{hoveredRegion.weakTopics}</span><span className="text-[8px] ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Weak Topics</span></div>
        </div>
      </div>
    </div>
  );
  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ position: 'absolute', inset: 0 }} onMouseMove={handleMouseMove} onMouseLeave={() => { regionRef.current = null; setHoveredRegion(null); }}>
      {show3D && useWebGL ? <MemoizedBrainCanvas /> : <NeuralBrain2DFallback />}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,8,22,0.5) 70%, rgba(5,8,22,0.95) 100%)' }} />
      {tooltip}
    </div>
  );
}
