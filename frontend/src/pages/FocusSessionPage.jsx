import { useState, useEffect, useRef } from 'react';
import { useFocus } from '../context/FocusContext';
import { useProgress } from '../context/ProgressContext';

const QUOTES = [
  "Consistency beats intensity.",
  "The future depends on what you do today.",
  "One focused session closer to AIR 100.",
  "Revision today saves marks tomorrow.",
  "Small progress every day.",
  "Focus is the new IQ.",
  "Master the fundamentals.",
  "Every problem solved is progress.",
  "Trust the process.",
  "Stay dedicated to your goals.",
  "The night is where champions are made.",
  "GATE 2027 starts with today's focus.",
];

function CosmicBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    const stars = [];
    const particles = [];
    const numStars = 80;
    const numParticles = 25;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() > 0.5 ? 270 : 190,
      });
    }
    
    let waveOffset = 0;
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const bgGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      bgGrad.addColorStop(0, '#0a0f1a');
      bgGrad.addColorStop(0.5, '#050816');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const purpleGlow = ctx.createRadialGradient(
        canvas.width * 0.35, canvas.height * 0.4, 0,
        canvas.width * 0.35, canvas.height * 0.4, canvas.width * 0.5
      );
      purpleGlow.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
      purpleGlow.addColorStop(0.5, 'rgba(109, 40, 217, 0.04)');
      purpleGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cyanGlow = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.6, 0,
        canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.35
      );
      cyanGlow.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      cyanGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.02)');
      cyanGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDir;
        if (star.opacity > 0.9 || star.opacity < 0.2) {
          star.twinkleDir *= -1;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        const particleGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        particleGrad.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${p.opacity})`);
        particleGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = particleGrad;
        ctx.fill();
      });
      
      waveOffset += 0.005;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.03 - i * 0.008})`;
        ctx.lineWidth = 1;
        const waveY = canvas.height * 0.85 + i * 30;
        for (let x = 0; x < canvas.width; x += 5) {
          const y = waveY + Math.sin((x * 0.01) + waveOffset + i) * 8;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      
      animationFrame = requestAnimationFrame(draw);
    }
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
}

function QuoteRotation() {
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setFade(true);
      }, 800);
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 flex items-center justify-center">
      <p 
        className="text-sm text-slate-400 italic text-center transition-opacity duration-700"
        style={{ opacity: fade ? 1 : 0 }}
      >
        "{QUOTES[quoteIndex]}"
      </p>
    </div>
  );
}

export default function FocusSessionPage() {
  const {
    isActive, isPaused, mode, sessionDuration, timeRemaining,
    sessionsCompleted, dailyStreak, currentSubject,
    startSession, pauseSession, resumeSession, stopSession,
    formatTime, history,
  } = useFocus();
  
  const { data: progressData, studyStats } = useProgress();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [showPicker, setShowPicker] = useState(false);
  
  const DURATIONS = [
    { value: 15, label: '15 min' },
    { value: 25, label: '25 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
  ];
  
  const progress = sessionDuration > 0 ? ((sessionDuration * 60 - timeRemaining) / (sessionDuration * 60)) * 100 : 0;
  
  // Calculate today's total focus time and weekly average
  const todayKey = new Date().toISOString().split('T')[0];
  const todayTotal = (history || [])
    .filter(h => h.date === todayKey)
    .reduce((sum, h) => sum + (h.duration || 0), 0);
  const todayHours = Math.floor(todayTotal / 3600);
  const todayMinutes = Math.floor((todayTotal % 3600) / 60);
  
  const weeklyData = (history || []).slice(-7);
  const weeklyAvg = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, h) => sum + (h.duration || 0), 0) / weeklyData.length / 60)
    : 0;
  
  const handleStart = (duration) => {
    setSelectedDuration(duration);
    setShowPicker(false);
    startSession(duration, currentSubject);
  };
  
  const formatSubject = (subject) => {
    if (!subject) return 'No subject selected';
    return subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' ');
  };
  
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <CosmicBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg"
          style={{
            background: 'rgba(18, 24, 38, 0.4)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="p-10 text-center">
            <p className="text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              {getTimeOfDay()}
            </p>
            <h1 className="text-2xl font-bold mb-8 text-white">Focus Session</h1>
            
            {!isActive ? (
              <div className="space-y-6">
                <div className="relative">
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-6xl font-bold text-white mb-2 tracking-tight hover:text-purple-300 transition-colors"
                  >
                    {selectedDuration}:00
                  </button>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>tap to change</p>
                  
                  {showPicker && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl flex gap-2"
                      style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {DURATIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => handleStart(d.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedDuration === d.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleStart(selectedDuration)}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  Start Focus
                </button>
                
                <QuoteRotation />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Motivational Quote */}
                <div className="text-center">
                  <p className="text-sm italic" style={{ color: '#94A3B8' }}>
                    "{QUOTES[Math.floor(Math.random() * QUOTES.length)]}"
                  </p>
                </div>
                
                <div className="relative">
                  <svg className="w-52 h-52 mx-auto" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="url(#timerGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                      transform="rotate(-90 50 50)"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}
                    />
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{formatTime(timeRemaining)}</span>
                    <span className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                      {mode === 'break' ? 'Break Time' : 'Focusing'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-white">
                    {formatSubject(currentSubject)}
                  </p>
                  {dailyStreak > 0 && (
                    <p className="text-sm" style={{ color: '#F59E0B' }}>
                      🔥 {dailyStreak} day streak
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  {isPaused ? (
                    <button
                      onClick={resumeSession}
                      className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseSession}
                      className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02]"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={stopSession}
                    className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    Stop
                  </button>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{sessionsCompleted}</p>
                      <p className="text-[10px]" style={{ color: '#64748B' }}>Sessions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{todayHours}h {todayMinutes}m</p>
                      <p className="text-[10px]" style={{ color: '#64748B' }}>Today</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{weeklyAvg}h</p>
                      <p className="text-[10px]" style={{ color: '#64748B' }}>Avg/Day</p>
                    </div>
                  </div>
                  {dailyStreak > 0 && (
                    <p className="text-xs mt-3 text-center" style={{ color: '#F59E0B' }}>
                      🔥 {dailyStreak} day streak — keep going!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}