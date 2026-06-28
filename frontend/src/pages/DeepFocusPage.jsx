import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocus } from '../context/FocusContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

const BG_OPTIONS = [
  { id: 'particles', label: 'Particles', icon: '✦' },
  { id: 'formulas', label: 'Formulas', icon: '∑' },
  { id: 'studyroom', label: 'Study Room', icon: '◈' },
];

const MOTIVATION_QUOTES = [
  { quote: 'Consistency beats intensity. Small daily progress becomes a big rank.', author: 'GateNexa' },
  { quote: 'Every question you solve today is one step closer to your IIT dream.', author: 'GateNexa' },
  { quote: 'The best time to start was yesterday. The next best time is now.', author: 'GateNexa' },
  { quote: 'Focus on the process, not the outcome. The rank will follow.', author: 'GateNexa' },
  { quote: 'Discipline is doing what needs to be done, even when you don\'t feel like it.', author: 'GateNexa' },
  { quote: 'Your only competition is the version of yourself who gave up yesterday.', author: 'GateNexa' },
  { quote: 'One hour of focused study beats four hours of distracted browsing.', author: 'GateNexa' },
  { quote: 'GATE is not about being the smartest. It\'s about being the most prepared.', author: 'GateNexa' },
  { quote: 'Study smart, revise often, practice relentlessly.', author: 'GateNexa' },
  { quote: 'The sweat of today waters the success of tomorrow.', author: 'GateNexa' },
  { quote: 'Quiet rooms and focused minds build ranks and futures.', author: 'GateNexa' },
  { quote: 'Every hour of deep work is a vote for your future self.', author: 'GateNexa' },
];

const GATE_FORMULAS = [
  'O(log n)', '∑ i=1ⁿ i = n(n+1)/2', 'E=mc²', 'P(A∪B) = P(A)+P(B)−P(A∩B)',
  '∫eË£dx = eË£+C', 'TCP/IP', 'F = ma', 'Î» = h/p', 'V−IR=0', 'n! ∼ √2Ï€n (n/e)ⁿ',
  'limâ‚“â†’₀ sin x/x = 1', 'XOR = AÌ…B + ABÌ…', 'S = ½at²', 'AM ≥ GM ≥ HM',
  'Cache: L1→L2→RAM', 'DB: ACID', 'OS: FCFS | SJF | RR',
];

const DURATIONS = [
  { label: '25 min', value: 25 * 60 },
  { label: '30 min', value: 30 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '90 min', value: 90 * 60 },
];

const DEEP_FOCUS_SESSIONS_KEY = 'gatenexa_deep_focus_sessions';

function loadDeepSessions() {
  try { return JSON.parse(localStorage.getItem(DEEP_FOCUS_SESSIONS_KEY)) || []; }
  catch { return []; }
}
function saveDeepSessions(s) {
  try { localStorage.setItem(DEEP_FOCUS_SESSIONS_KEY, JSON.stringify(s)); } catch {}
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// â”€â”€─ NEON TIMER RING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
function TimerRing({ timeRemaining, sessionDuration, mode, isActive, isPaused }) {
  const radius = 140;
  const stroke = 7;
  const norm = radius - stroke;
  const circ = norm * 2 * Math.PI;
  const progress = sessionDuration > 0
    ? Math.max(0, Math.min(100, ((sessionDuration - timeRemaining) / sessionDuration) * 100))
    : 0;
  const dashOffset = circ - (progress / 100) * circ;
  const hue = mode === 'break' ? 142 : 262;
  const color = mode === 'break' ? '#22c55e' : '#8B5CF6';
  const glowColor = mode === 'break' ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.5)';

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow ring */}
      <div
        className="absolute rounded-full animate-pulse-slow"
        style={{
          width: radius * 2 + 40,
          height: radius * 2 + 40,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          animationDuration: '3s',
          opacity: isActive && !isPaused ? 0.4 : 0.15,
          transition: 'opacity 1s ease',
        }}
      />
      {/* Second glow layer */}
      <div
        className="absolute rounded-full"
        style={{
          width: radius * 2 + 20,
          height: radius * 2 + 20,
          background: `radial-gradient(circle, ${glowColor.replace('0.5', '0.2')} 0%, transparent 65%)`,
          opacity: isActive && !isPaused ? 0.6 : 0.2,
          transition: 'opacity 1s ease',
        }}
      />
      <svg
        width={radius * 2}
        height={radius * 2}
        className="drop-shadow-[0_0_25px_rgba(139,92,246,0.35)]"
        style={{ filter: isActive ? `drop-shadow(0 0 20px ${glowColor})` : 'none', transition: 'filter 0.5s ease' }}
      >
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mode === 'break' ? '#4ade80' : '#a78bfa'} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="textGlow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          stroke="rgba(255,255,255,0.05)"
          fill="none"
          cx={radius}
          cy={radius}
          r={norm}
          strokeWidth={stroke}
        />

        {/* Progress ring */}
        <circle
          stroke="url(#ringGrad)"
          fill="none"
          cx={radius}
          cy={radius}
          r={norm}
          strokeWidth={stroke + 1}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            filter: 'url(#neonGlow)',
          }}
        />

        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const len = isHour ? 8 : 4;
          const x1 = radius + (norm - len) * Math.cos(angle);
          const y1 = radius + (norm - len) * Math.sin(angle);
          const x2 = radius + norm * Math.cos(angle);
          const y2 = radius + norm * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isHour ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}
              strokeWidth={isHour ? 1.5 : 0.8}
              strokeLinecap="round"
            />
          );
        })}

        {/* Time display */}
        <text
          x={radius}
          y={radius - 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="48"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          className="select-none"
          style={{ filter: 'url(#textGlow)' }}
        >
          {formatTime(timeRemaining)}
        </text>

        {/* Mode label */}
        <text
          x={radius}
          y={radius + 30}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="11"
          fontFamily="sans-serif"
          fontWeight="600"
          letterSpacing="2"
          className="select-none uppercase"
          opacity="0.9"
        >
          {mode === 'break' ? '⏸ break' : '◆ focus'}
        </text>

        {/* Status dot when paused */}
        {isPaused && (
          <circle cx={radius} cy={radius + 56} r="4" fill={color} opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}

// â”€â”€─ PARTICLE BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
function ParticleBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.4 + 0.15,
    }));

    function draw() {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.07 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />;
}

// â”€â”€─ FORMULA BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
function FormulaBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const els = containerRef.current?.querySelectorAll('.f-formula') || [];
    els.forEach((el, i) => {
      el.style.setProperty('--tx', `${Math.random() * 80 - 40}px`);
      el.style.setProperty('--ty', `${-window.innerHeight - 100}px`);
      el.style.animationDuration = `${20 + Math.random() * 25}s`;
      el.style.animationDelay = `${-Math.random() * 40}s`;
    });
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {GATE_FORMULAS.map((f, i) => (
        <span
          key={i}
          className="f-formula absolute text-[11px] font-mono text-purple-400/10 hover:text-purple-300/20 transition-colors"
          style={{
            left: `${5 + (i * 7) % 90}%`,
            top: `${(i * 11) % 90}%`,
            fontSize: `${9 + (i % 5) * 2}px`,
            animation: 'floatUp 30s linear infinite',
            animationDelay: `${-i * 1.3}s`,
          }}
        >
          {f}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          5% { opacity: 0.15; }
          95% { opacity: 0.15; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// â”€â”€─ ANIMATED STUDY ROOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
function StudyRoomBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // Floating dust particles in sunlight
    const dust = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.1 - 0.03,
      r: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.3 + 0.05,
      brightness: Math.random() * 30 + 220,
    }));

    // Steam from coffee
    const steam = Array.from({ length: 8 }, (_, i) => ({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -0.15 - Math.random() * 0.1,
      r: 3 + Math.random() * 4,
      alpha: 0.15,
      offset: i * 0.3,
    }));
    const steamOrigin = { x: w * 0.22, y: h * 0.72 };

    // Lamp warm glow pulse
    let lampPulse = 0;

    function drawRoom(t) {
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const floorY = h * 0.78;

      // â”€─ Ambient wall glow (top) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      wallGrad.addColorStop(0, 'rgba(15,8,35,0.98)');
      wallGrad.addColorStop(1, 'rgba(10,5,20,1)');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h);

      // â”€─ Window with moonlight (left side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const winX = w * 0.08, winY = h * 0.12, winW = w * 0.18, winH = h * 0.35;
      const winGrad = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
      winGrad.addColorStop(0, 'rgba(60,80,160,0.25)');
      winGrad.addColorStop(1, 'rgba(30,40,100,0.1)');
      ctx.fillStyle = winGrad;
      ctx.fillRect(winX, winY, winW, winH);
      // Window frame
      ctx.strokeStyle = 'rgba(100,120,200,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.beginPath();
      ctx.moveTo(winX + winW / 2, winY); ctx.lineTo(winX + winW / 2, winY + winH);
      ctx.moveTo(winX, winY + winH / 2); ctx.lineTo(winX + winW, winY + winH / 2);
      ctx.stroke();
      // Moon glow
      const moonX = winX + winW * 0.7, moonY = winY + winH * 0.3;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, winW * 0.25);
      moonGlow.addColorStop(0, 'rgba(200,220,255,0.3)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(winX, winY, winW, winH);

      // â”€─ Desk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const deskX = w * 0.1, deskW = w * 0.8, deskY = floorY, deskH = h * 0.08;
      // Desk surface
      const deskGrad = ctx.createLinearGradient(deskX, deskY - deskH, deskX, deskY);
      deskGrad.addColorStop(0, 'rgba(50,35,25,0.9)');
      deskGrad.addColorStop(1, 'rgba(35,22,15,0.95)');
      ctx.fillStyle = deskGrad;
      ctx.beginPath();
      ctx.roundRect(deskX, deskY - deskH, deskW, deskH, [3]);
      ctx.fill();
      // Desk edge highlight
      ctx.strokeStyle = 'rgba(100,80,60,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(deskX + 2, deskY - deskH);
      ctx.lineTo(deskX + deskW - 2, deskY - deskH);
      ctx.stroke();

      // â”€─ Desk lamp (left) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      lampPulse = Math.sin(t * 0.001) * 0.02;
      const lampX = w * 0.18, lampY = deskY - deskH - 5;
      const lampGlowR = 80 + lampPulse * 20;
      const lampGlow = ctx.createRadialGradient(lampX, lampY, 5, lampX, lampY, lampGlowR);
      lampGlow.addColorStop(0, 'rgba(255,200,120,0.35)');
      lampGlow.addColorStop(0.5, 'rgba(255,180,80,0.1)');
      lampGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = lampGlow;
      ctx.fillRect(lampX - lampGlowR, lampY - lampGlowR, lampGlowR * 2, lampGlowR * 2);
      // Lamp shade
      ctx.fillStyle = 'rgba(60,45,30,0.8)';
      ctx.beginPath();
      ctx.ellipse(lampX, lampY, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Lamp pole
      ctx.strokeStyle = 'rgba(80,60,40,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lampX, lampY + 6);
      ctx.lineTo(lampX, lampY + 35);
      ctx.stroke();

      // â”€─ Coffee mug + steam (left on desk) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const mugX = w * 0.22, mugY = deskY - deskH - 2;
      ctx.fillStyle = 'rgba(40,30,25,0.8)';
      ctx.beginPath();
      ctx.roundRect(mugX - 10, mugY - 18, 20, 20, [0, 0, 3, 3]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,60,45,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Handle
      ctx.beginPath();
      ctx.arc(mugX + 12, mugY - 9, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      // Steam
      steam.forEach((s) => {
        const st = (t * 0.001 + s.offset) % 3;
        const sx = mugX + s.vx * st * 30;
        const sy = mugY - 20 - st * 20;
        const sr = s.r + st * 1.5;
        const salpha = Math.max(0, s.alpha - st * 0.05);
        if (salpha > 0) {
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,190,180,${salpha})`;
          ctx.fill();
        }
      });

      // â”€─ Books (stack on right) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const bookX = w * 0.7, bookY = deskY - deskH - 2;
      const bookColors = ['rgba(120,50,30,0.7)', 'rgba(30,60,100,0.7)', 'rgba(60,40,80,0.7)', 'rgba(40,80,50,0.7)'];
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = bookColors[b];
        ctx.fillRect(bookX - 18, bookY - (b + 1) * 10, 36, 9);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bookX - 18, bookY - (b + 1) * 10, 36, 9);
      }

      // â”€─ Floating notes/pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const pages = [
        { x: w * 0.38, y: h * 0.38, rot: -15, w: 28, h: 36, alpha: 0.07, page: 0 },
        { x: w * 0.52, y: h * 0.28, rot: 10, w: 24, h: 32, alpha: 0.05, page: 1 },
        { x: w * 0.65, y: h * 0.42, rot: -5, w: 30, h: 22, alpha: 0.06, page: 2 },
      ];
      pages.forEach((pg) => {
        const offsetY = Math.sin(t * 0.0008 + pg.page) * 8;
        const offsetX = Math.cos(t * 0.0006 + pg.page * 1.3) * 4;
        ctx.save();
        ctx.translate(pg.x + offsetX, pg.y + offsetY);
        ctx.rotate((pg.rot + Math.sin(t * 0.0005 + pg.page) * 3) * Math.PI / 180);
        ctx.fillStyle = `rgba(240,235,200,${pg.alpha})`;
        ctx.fillRect(-pg.w / 2, -pg.h / 2, pg.w, pg.h);
        // Lines
        for (let l = 0; l < 4; l++) {
          ctx.fillStyle = `rgba(100,100,80,${pg.alpha * 0.5})`;
          ctx.fillRect(-pg.w / 2 + 3, -pg.h / 2 + 5 + l * 5, pg.w - 6, 1);
        }
        ctx.restore();
      });

      // â”€─ Floor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, 'rgba(20,12,8,0.95)');
      floorGrad.addColorStop(1, 'rgba(10,6,4,1)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      // â”€─ Floating dust in moonlight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      dust.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        if (d.x < -10) d.x = w + 10;
        if (d.x > w + 10) d.x = -10;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.brightness},${d.brightness},255,${d.alpha})`;
        ctx.fill();
      });

      // â”€─ Floating GATE formulas (subtle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
      const fmls = ['O(log n)', 'Î£', '∫', 'Î»', '∇', 'Î´', '⊕', '⊗'];
      ctx.font = '10px monospace';
      fmls.forEach((fm, fi) => {
        const tx = cx + Math.sin(t * 0.0003 + fi * 0.9) * w * 0.3;
        const ty = h * 0.35 + Math.cos(t * 0.0004 + fi * 1.1) * h * 0.2;
        ctx.fillStyle = 'rgba(139,92,246,0.06)';
        ctx.fillText(fm, tx, ty);
      });

      animId = requestAnimationFrame(drawRoom);
    }

    animId = requestAnimationFrame(drawRoom);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,8,22,0.7) 100%)',
        }}
      />
    </div>
  );
}

// â”€â”€─ CONFETTI SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
function Confetti() {
  const canvasRef = useRef(null);
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      r: 4 + Math.random() * 4,
      color: ['#8B5CF6', '#22D3EE', '#F472B6', '#34D399', '#FBBF24'][Math.floor(Math.random() * 5)],
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.globalAlpha = 0.85;
          ctx.fillRect(-p.r / 2, -p.r * 1.5, p.r, p.r * 3);
        } else {
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, [pieces]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200]" />;
}

// â”€â”€─ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€─
export default function DeepFocusPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, updateProductivity, updateStudyStats, syncToCloud } = useProgress();
  const focus = useFocus();

  const [bgMode, setBgMode] = useState('studyroom');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(25 * 60);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [focusSessions] = useState(() => loadDeepSessions());
  const [questionsSolved, setQuestionsSolved] = useState(0);
  const [notesRevised, setNotesRevised] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const subjects = useMemo(() => data.studyStats?.subjects || [], [data]);
  const topics = useMemo(() => selectedSubject ? data.topics.filter((t) => t.subject === selectedSubject) : [], [data.topics, selectedSubject]);
  const totalMinutes = focusSessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  const sessionCount = focusSessions.length;
  const todaySessions = focusSessions.filter(
    (s) => new Date(s.date).toDateString() === new Date().toDateString()
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!sessionActive) handleStart();
        else if (focus.isPaused) focus.resumeSession();
        else focus.pauseSession();
      }
      if (e.code === 'Escape') {
        if (showCompletion) handleCloseResult();
        else if (sessionActive) handleStop();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sessionActive, focus.isPaused, showCompletion]);

  // Auto-rotate quotes every 10 min
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length);
        setQuoteVisible(true);
      }, 500);
    }, 600000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    setSessionActive(true);
    setShowCompletion(false);
    focus.startSession(selectedDuration, selectedSubject || null);
  };

  const handleStop = () => {
    focus.stopSession();
    setSessionActive(false);
    setShowCompletion(false);
  };

  const onSessionComplete = useCallback((elapsedSeconds) => {
    const focusMins = elapsedSeconds / 60;
    const score = Math.min(100, Math.round((elapsedSeconds / selectedDuration) * 100));
    const session = {
      id: Date.now(), date: new Date().toISOString(),
      subject: selectedSubject || 'General', topic: selectedTopic || 'Mixed',
      duration: Math.round(focusMins), focusScore: score,
      questionsSolved, notesRevised,
    };
    const updated = [...focusSessions, session];
    saveDeepSessions(updated);
    setCompletionData(session);
    setShowCompletion(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setSessionActive(false);
    updateProductivity((p) => ({
      ...p, pomodoroSessions: (p.pomodoroSessions || 0) + 1,
      deepFocusSessions: (p.deepFocusSessions || 0) + 1,
      totalDeepFocusMinutes: (p.totalDeepFocusMinutes || 0) + focusMins,
    }));
    updateStudyStats((s) => ({
      ...s, todayHours: (s.todayHours || 0) + focusMins / 60,
      weekHours: (s.weekHours || 0) + focusMins / 60,
      deepFocusHours: (s.deepFocusHours || 0) + focusMins / 60,
    }));
    syncToCloud();
  }, [selectedSubject, selectedTopic, selectedDuration, questionsSolved, notesRevised, focusSessions, updateProductivity, updateStudyStats, syncToCloud]);

  // Watch for session completion
  useEffect(() => {
    if (!sessionActive || focus.isActive) return;
    const elapsed = selectedDuration - focus.timeRemaining;
    if (elapsed > 30 && focus.timeRemaining > 0) return;
    if (elapsed > 10) onSessionComplete(elapsed);
  }, [focus.isActive, focus.timeRemaining]);

  const handleCloseResult = () => {
    setShowCompletion(false);
    setCompletionData(null);
    setQuestionsSolved(0);
    setNotesRevised(0);
  };

  const quote = MOTIVATION_QUOTES[quoteIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#050816] flex flex-col overflow-hidden">
      {/* Background layers */}
      {bgMode === 'particles' && <ParticleBackground />}
      {bgMode === 'formulas' && <FormulaBackground />}
      {bgMode === 'studyroom' && <StudyRoomBackground />}

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 backdrop-blur-sm bg-black/20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-all px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Exit
        </button>

        <div className="flex items-center gap-3">
          {sessionCount > 0 && (
            <span className="text-[11px] text-white/30 hidden sm:block">
              {sessionCount} sessions · {Math.round(totalMinutes)} min
            </span>
          )}
          <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
            {BG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBgMode(opt.id)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-300 ${
                  bgMode === opt.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Setup panel (before session) */}
        <div
          className={`mb-6 transition-all duration-500 ${
            sessionActive ? 'opacity-0 translate-y-[-20px] pointer-events-none h-0 mb-0' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Duration selector */}
            <div className="flex gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                    selectedDuration === d.value
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Subject / Topic selectors */}
            {subjects.length > 0 && (
              <div className="flex gap-2 items-center flex-wrap justify-center">
                <select
                  value={selectedSubject}
                  onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-purple-500/40 transition-colors min-w-[140px]"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                {selectedSubject && (
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-purple-500/40 transition-colors min-w-[140px]"
                  >
                    <option value="">All Topics</option>
                    {topics.map((t) => <option key={t.id} value={t.name}>{t.name} {t.done ? '✓' : ''}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timer ring */}
        <div className="transition-all duration-700" style={{ transform: sessionActive ? 'scale(1)' : 'scale(0.95)', opacity: sessionActive ? 1 : 0.8 }}>
          <TimerRing
            timeRemaining={focus.timeRemaining}
            sessionDuration={sessionActive ? selectedDuration : selectedDuration}
            mode={focus.mode}
            isActive={sessionActive}
            isPaused={focus.isPaused}
          />
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-3">
          {!sessionActive ? (
            <button
              onClick={handleStart}
              className="group relative flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-3.5 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_45px_rgba(139,92,246,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              Start Session
            </button>
          ) : (
            <>
              {focus.isPaused ? (
                <button
                  onClick={focus.resumeSession}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  Resume
                </button>
              ) : (
                <button
                  onClick={focus.pauseSession}
                  className="flex items-center gap-2 bg-white/10 border border-white/15 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/15 transition-all"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Pause
                </button>
              )}
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 font-medium px-6 py-3 rounded-xl hover:bg-white/10 hover:text-white/80 hover:border-white/20 transition-all"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                End
              </button>
            </>
          )}
        </div>

        {/* Session info */}
        {sessionActive && selectedSubject && (
          <div className="mt-6 text-center transition-all duration-500">
            <div className="text-sm text-white/60 font-medium tracking-wide">{selectedSubject}</div>
            {selectedTopic && <div className="text-xs text-white/30 mt-0.5">{selectedTopic}</div>}
          </div>
        )}

        {/* Live counters */}
        {sessionActive && (
          <div className="mt-6 flex items-center gap-5 transition-all duration-500 opacity-80">
            {[{ label: 'Questions', val: questionsSolved, set: setQuestionsSolved },
              { label: 'Notes', val: notesRevised, set: setNotesRevised }].map(({ label, val, set }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                  <button onClick={() => set((q) => Math.max(0, q - 1))}
                    className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 text-xs flex items-center justify-center transition-colors">−</button>
                  <span className="text-sm font-mono text-white w-5 text-center">{val}</span>
                  <button onClick={() => set((q) => q + 1)}
                    className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 text-xs flex items-center justify-center transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        {!sessionActive && (
          <div className="mt-4 text-[10px] text-white/20">
            Press <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-white/40">Space</kbd> to start
          </div>
        )}
        {sessionActive && (
          <div className="mt-2 text-[10px] text-white/15">
            <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-white/30">Space</kbd> pause/resume · <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-white/30">Esc</kbd> end
          </div>
        )}
      </div>

      {/* Floating motivation button (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-20">
        <button
          onClick={() => setShowQuote(!showQuote)}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] group"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/40 group-hover:text-purple-400 transition-colors">
            <path d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Quote panel */}
        <div
          className={`absolute bottom-14 left-0 w-72 backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl p-5 shadow-2xl transition-all duration-500 ${
            showQuote ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-1 h-1 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
            <div>
              <div className="text-sm text-white/90 leading-relaxed italic">"{quote.quote}"</div>
              <div className="text-[10px] text-white/30 mt-2 font-medium uppercase tracking-widest">— {quote.author}</div>
            </div>
          </div>
          <button
            onClick={() => {
              setQuoteVisible(false);
              setTimeout(() => {
                setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length);
                setQuoteVisible(true);
              }, 300);
            }}
            className="mt-3 text-[10px] text-purple-400/60 hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            Next quote
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
        </div>
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Session completion modal */}
      {showCompletion && completionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div
            className="relative bg-gradient-to-b from-[#0f0a1e] to-[#08050f] border border-purple-500/20 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-[0_0_60px_rgba(139,92,246,0.25)]"
            style={{ animation: 'modalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Glow badge */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1.5 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-purple-400"><circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.2" /><circle cx="6" cy="6" r="2" fill="currentColor" /></svg>
                <span className="text-xs text-purple-300 font-semibold tracking-wide">Session Complete</span>
              </div>
            </div>

            <div className="text-center mt-4">
              {/* Score ring */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke="url(#compGrad)"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionData.focusScore / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) 0.3s' }}
                  />
                  <defs>
                    <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white font-mono">{completionData.focusScore}%</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white mb-1">Great Focus Session!</h2>
              <p className="text-xs text-white/40 mb-5">Here's your session summary</p>

              <div className="space-y-2.5 mb-6">
                {[
                  ['Subject', completionData.subject || 'General'],
                  ['Topic', completionData.topic || 'Mixed'],
                  ['Duration', `${completionData.duration} min`],
                  ['Questions Solved', completionData.questionsSolved],
                  ['Notes Revised', completionData.notesRevised],
                  ['Today\'s Sessions', String(todaySessions.length + 1)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-sm text-white/90 font-medium">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseResult}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                  New Session
                </button>
                <button
                  onClick={() => { handleCloseResult(); navigate(-1); }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 hover:text-white/70 transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
