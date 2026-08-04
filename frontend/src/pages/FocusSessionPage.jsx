import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocus, useFocusTimer, ACHIEVEMENT_DEFS } from '../context/FocusContext';
import { useProgress } from '../context/ProgressContext';
import MotivationalQuote from '../components/common/MotivationalQuote';
import SessionCompletionDialog from '../components/common/SessionCompletionDialog';
import DailyHistoryTimeline from '../components/common/DailyHistoryTimeline';
import SmartContinuation from '../components/common/SmartContinuation';
import AIDailyReview from '../components/common/AIDailyReview';
import StreakIndicator from '../components/common/StreakIndicator';
import { Eye, EyeOff, Pause, Play, SkipForward, Award, BarChart3, Flame, Zap, Calendar } from 'lucide-react';
import { GATE_SUBJECTS } from '../data/gateSubjectsData';

// ─── COSMIC BACKGROUND ─────────────────────────────────────
function CosmicBackground({ deepFocus }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3,
      o: Math.random() * 0.5 + 0.3, sp: Math.random() * 0.02 + 0.005, d: Math.random() > 0.5 ? 1 : -1,
    }));
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1, o: Math.random() * 0.3 + 0.1, h: Math.random() > 0.5 ? 270 : 190,
    }));
    let waveOff = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.8);
      bg.addColorStop(0, '#0a0f1a'); bg.addColorStop(0.5, '#050816'); bg.addColorStop(1, '#020408');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      const pg = ctx.createRadialGradient(w * 0.35, h * 0.4, 0, w * 0.35, h * 0.4, w * 0.5);
      pg.addColorStop(0, 'rgba(139,92,246,0.08)'); pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, w, h);
      const cg = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.35);
      cg.addColorStop(0, 'rgba(6,182,212,0.05)'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h);
      stars.forEach(s => {
        s.o += s.sp * s.d; if (s.o > 0.9 || s.o < 0.2) s.d *= -1;
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
      });
      particles.forEach(p => {
        p.x += p.vx / w; p.y += p.vy / h;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        const px = p.x * w, py = p.y * h;
        const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
        g.addColorStop(0, `hsla(${p.h},70%,60%,${p.o})`); g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(px, py, p.r * 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });
      waveOff += 0.005;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.strokeStyle = `rgba(139,92,246,${0.03 - i * 0.008})`; ctx.lineWidth = 1;
        const wy = h * 0.85 + i * 30;
        for (let x = 0; x < w; x += 5) {
          const y = wy + Math.sin((x * 0.01) + waveOff + i) * 8;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      animationFrame = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrame); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity: deepFocus ? 0.4 : 1, transition: 'opacity 1s ease' }} />;
}

// ─── TIMER RING ────────────────────────────────────────────
function formatTimeLocal(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TimerRing({ timeRemaining, sessionDuration, mode, isActive, isPaused, deepFocus }) {
  const progress = sessionDuration > 0 ? ((sessionDuration - timeRemaining) / sessionDuration) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - progress / 100);
  const glowIntensity = isActive && !isPaused ? Math.min(0.8, 0.3 + progress * 0.005) : 0.15;

  return (
    <div className="relative">
      {/* Outer glow */}
      {isActive && !isPaused && (
        <div className="absolute inset-0 rounded-full" style={{
          background: `radial-gradient(circle, rgba(139,92,246,${glowIntensity * 0.3}) 0%, transparent 70%)`,
          transform: 'scale(1.3)', transition: 'all 1s ease',
        }} />
      )}
      <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const r1 = 43, r2 = i % 5 === 0 ? 41 : 42;
          return <line key={i} x1={50 + r1 * Math.cos(angle)} y1={50 + r1 * Math.sin(angle)} x2={50 + r2 * Math.cos(angle)} y2={50 + r2 * Math.sin(angle)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
        })}
        {/* Progress ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="url(#timerGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 50 50)"
          style={{ filter: 'url(#glow)', transition: 'stroke-dashoffset 0.5s linear' }} />
        {/* Breathing pulse */}
        {isActive && !isPaused && (
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="6"
            style={{ animation: 'breathe 4s ease-in-out infinite' }} />
        )}
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold text-white font-mono tracking-tight" style={{ textShadow: isActive ? '0 0 30px rgba(139,92,246,0.3)' : 'none' }}>
          {formatTimeLocal(timeRemaining)}
        </span>
        <span className="text-sm mt-1 font-medium" style={{ color: mode === 'break' ? '#22D3EE' : '#94A3B8' }}>
          {mode === 'break' ? '☕ Break Time' : isActive ? '🎯 Focusing' : 'Ready to Focus'}
        </span>
      </div>
      <style>{`@keyframes breathe { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.02); } }`}</style>
    </div>
  );
}

// ─── CONFETTI ──────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 2, duration: 2 + Math.random() * 3,
    color: ['#8B5CF6', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'][i % 6],
    size: 4 + Math.random() * 6, rotation: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <motion.div key={p.id} initial={{ y: -20, x: `${p.left}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute" style={{ width: p.size, height: p.size, background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }} />
      ))}
    </div>
  );
}

// ─── XP POPUP ──────────────────────────────────────────────
function XpPopup({ amount }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-lg"
      style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(234,179,8,0.3)', color: '#FBBF24', boxShadow: '0 8px 32px rgba(234,179,8,0.2)' }}>
      +{amount} XP ⚡
    </motion.div>
  );
}

// ─── DISTRACTION TRACKER ───────────────────────────────────
function DistractionPanel({ distractions, sessionDuration, timeRemaining }) {
  const elapsed = sessionDuration - timeRemaining;
  const focusPct = elapsed > 0 ? Math.max(0, Math.min(100, Math.round(100 - distractions.tabSwitches * 3 - distractions.pauses * 5))) : 100;
  const rating = focusPct >= 90 ? 'Excellent' : focusPct >= 70 ? 'Good' : 'Needs Improvement';
  const ratingColor = focusPct >= 90 ? '#22C55E' : focusPct >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5"><Eye size={14} className="text-cyan-400" /> Focus Tracker</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-sm font-bold text-white font-mono">{distractions.pauses}</div>
          <div className="text-[9px] text-slate-500">Paused</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-sm font-bold text-white font-mono">{distractions.tabSwitches}</div>
          <div className="text-[9px] text-slate-500">Tab Switches</div>
        </div>
      </div>
      <div className="rounded-lg p-2 text-center mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="text-lg font-bold font-mono" style={{ color: ratingColor }}>{focusPct}%</div>
        <div className="text-[9px] text-slate-500">Deep Focus</div>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" animate={{ width: `${focusPct}%` }} transition={{ duration: 0.5 }}
          style={{ background: ratingColor }} />
      </div>
      <div className="text-[9px] text-center mt-1.5" style={{ color: ratingColor }}>{rating}</div>
    </div>
  );
}

// ─── ACHIEVEMENT POPUP ─────────────────────────────────────
function AchievementPopup({ achievement }) {
  if (!achievement) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 50, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl flex items-center gap-3"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 12px 40px rgba(139,92,246,0.2)' }}>
      <span className="text-3xl">{achievement.icon}</span>
      <div>
        <div className="text-xs font-bold text-white">Achievement Unlocked!</div>
        <div className="text-[11px] text-purple-300">{achievement.name}</div>
        <div className="text-[9px] text-slate-400">{achievement.desc}</div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────
export default function FocusSessionPage() {
  const {
    isActive, isPaused, mode, sessionDuration,
    sessionsCompleted, dailyStreak, currentSubject, setCurrentSubject,
    startSession, pauseSession, resumeSession, stopSession, skipBreak,
    formatTime, history, xp, xpLevel, totalXp, earnedAchievements,
    newAchievement, distractions, MOTIVATION_QUOTES,
  } = useFocus();
  const { timeRemaining } = useFocusTimer();
  const { data: progressData, studyStats } = useProgress();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [showPicker, setShowPicker] = useState(false);
  const [deepFocus, setDeepFocus] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(Math.floor(Math.random() * MOTIVATION_QUOTES.length));

  const DURATIONS = [
    { value: 15, label: '15 min' }, { value: 25, label: '25 min' },
    { value: 45, label: '45 min' }, { value: 60, label: '60 min' }, { value: 90, label: '90 min' },
  ];

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % MOTIVATION_QUOTES.length), 60000);
    return () => clearInterval(id);
  }, [isActive, MOTIVATION_QUOTES.length]);

  // Watch for session completion
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (wasActiveRef.current && !isActive && mode === 'work') {
      const lastEntry = history[history.length - 1];
      if (lastEntry?.xpEarned) {
        setXpEarned(lastEntry.xpEarned);
        setShowXpPopup(true);
        setTimeout(() => setShowXpPopup(false), 3000);
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    wasActiveRef.current = isActive;
  }, [isActive, mode, history]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayTotal = (history || []).filter(h => {
    const hDate = new Date(h.date);
    return hDate.toISOString().split('T')[0] === todayKey;
  }).reduce((sum, h) => sum + (h.duration || 0), 0);
  const todayHours = Math.floor(todayTotal / 3600);
  const todayMinutes = Math.floor((todayTotal % 3600) / 60);
  const weeklyData = (history || []).slice(-7);
  const weeklyAvg = weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, h) => s + (h.duration || 0), 0) / weeklyData.length / 60) : 0;

  const handleStart = (duration) => { setSelectedDuration(duration); setShowPicker(false); startSession(duration, currentSubject); };
  const formatSubject = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') : 'No subject selected';
  const getTimeOfDay = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#050816' }}>
      <CosmicBackground deepFocus={deepFocus} />

      {/* Deep Focus dimming overlay */}
      {deepFocus && isActive && (
        <div className="fixed inset-0 z-[5] pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
      )}

      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      <AnimatePresence>{showXpPopup && <XpPopup amount={xpEarned} />}</AnimatePresence>
      <AnimatePresence><AchievementPopup achievement={newAchievement} /></AnimatePresence>
      <SessionCompletionDialog />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl flex gap-4">
          {/* Main timer card */}
          <div className="flex-1 max-w-lg mx-auto" style={{
            background: deepFocus && isActive ? 'rgba(10,14,26,0.8)' : 'rgba(18,24,38,0.4)',
            backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px', boxShadow: '0 25px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'all 0.8s ease',
          }}>
            <div className="p-10 text-center">
              {/* Deep Focus toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-400">{getTimeOfDay()}</p>
                <div className="flex items-center gap-2">
                  <StreakIndicator />
                  <button onClick={() => setDeepFocus(!deepFocus)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all"
                    style={deepFocus ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748B' }}>
                    {deepFocus ? <EyeOff size={12} /> : <Eye size={12} />}
                    {deepFocus ? 'Deep Focus ON' : 'Deep Focus'}
                  </button>
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2 text-white">Focus Session</h1>

              {!isActive ? (
                <div className="space-y-6">
                  {/* Duration selector */}
                  <div className="relative">
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowPicker(!showPicker)}
                      className="text-7xl font-bold text-white mb-2 tracking-tight transition-colors" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {selectedDuration}:00
                    </motion.button>
                    <p className="text-sm text-slate-500">tap to change</p>
                    <AnimatePresence>
                      {showPicker && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute left-1/2 -translate-x-1/2 mt-4 p-3 rounded-2xl flex gap-2"
                          style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                          {DURATIONS.map(d => (
                            <motion.button key={d.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleStart(d.value)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedDuration === d.value ? 'text-white' : 'text-slate-400'}`}
                              style={selectedDuration === d.value ? { background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' } : { background: 'rgba(255,255,255,0.05)' }}>
                              {d.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Start button */}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleStart(selectedDuration)}
                    className="w-full py-4 rounded-2xl text-white font-semibold text-lg"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
                    Start Focus
                  </motion.button>

                  {/* Subject selector */}
                  <div className="relative">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 block">Focus Subject</label>
                    <select value={currentSubject || ''} onChange={e => setCurrentSubject(e.target.value || null)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <option value="">General (No Subject)</option>
                      {GATE_SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
                    </select>
                  </div>

                  {/* XP display */}
                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
                    <span>⚡ Lv.{xpLevel}</span>
                    <span>·</span>
                    <span>{totalXp} XP</span>
                    <span>·</span>
                    <span>🏆 {earnedAchievements.length} badges</span>
                  </div>

                  <MotivationalQuote context={{ focus: true }} className="text-center" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timer */}
                  <TimerRing timeRemaining={timeRemaining} sessionDuration={sessionDuration} mode={mode} isActive={isActive} isPaused={isPaused} deepFocus={deepFocus} />

                  {/* Motivational quote */}
                  {!deepFocus && (
                    <motion.p key={quoteIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic text-slate-500 px-4">
                      "{MOTIVATION_QUOTES[quoteIdx]}"
                    </motion.p>
                  )}

                  {/* Subject & Streak */}
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-white">{formatSubject(currentSubject)}</p>
                    {dailyStreak > 0 && <p className="text-sm text-amber-400">🔥 {dailyStreak} day streak</p>}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {mode === 'break' ? (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={skipBreak}
                          className="px-8 py-3 rounded-xl text-white font-semibold"
                          style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
                          <SkipForward size={18} className="inline mr-2" /> Skip Break
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stopSession}
                          className="px-8 py-3 rounded-xl font-semibold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          End Session
                        </motion.button>
                      </>
                    ) : isPaused ? (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resumeSession}
                          className="px-8 py-3 rounded-xl text-white font-semibold"
                          style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
                          <Play size={18} className="inline mr-2" /> Resume
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stopSession}
                          className="px-8 py-3 rounded-xl font-semibold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Stop
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={pauseSession}
                          className="px-8 py-3 rounded-xl text-white font-semibold"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <Pause size={18} className="inline mr-2" /> Pause
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stopSession}
                          className="px-8 py-3 rounded-xl font-semibold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Stop
                        </motion.button>
                      </>
                    )}
                  </div>

                  {/* Stats footer */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">{sessionsCompleted}</p>
                        <p className="text-[10px] text-slate-500">Sessions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{todayHours}h {todayMinutes}m</p>
                        <p className="text-[10px] text-slate-500">Today</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{weeklyAvg}h</p>
                        <p className="text-[10px] text-slate-500">Avg/Day</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: '#FBBF24' }}>⚡{totalXp}</p>
                        <p className="text-[10px] text-slate-500">Total XP</p>
                      </div>
                    </div>
                    {dailyStreak > 0 && (
                      <p className="text-xs mt-3 text-center text-amber-400">🔥 {dailyStreak} day streak — keep going!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - XP & Achievements (hidden in deep focus when active) */}
          {(!deepFocus || !isActive) && (
            <div className="hidden lg:flex flex-col w-64 gap-3">
              {/* Smart Continuation */}
              <SmartContinuation />

              {/* XP & Level */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5"><Zap size={14} className="text-yellow-400" /> XP & Level</div>
                <div className="text-center mb-2">
                  <span className="text-3xl font-bold font-mono" style={{ background: 'linear-gradient(135deg, #EAB308, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lv.{xpLevel}</span>
                </div>
                <div className="text-[9px] text-slate-500 text-center mb-2">{totalXp} total XP</div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" animate={{ width: `${(xp / (100 + (xpLevel - 1) * 50)) * 100}%` }}
                    style={{ background: 'linear-gradient(90deg, #EAB308, #F59E0B)', transition: 'width 0.5s ease' }} />
                </div>
                <div className="text-[8px] text-slate-600 text-center mt-1">{xp}/{100 + (xpLevel - 1) * 50} to next level</div>
              </div>

              {/* Daily History Timeline */}
              <DailyHistoryTimeline />

              {/* AI Daily Review */}
              <AIDailyReview />

              {/* Achievements */}
              <div className="rounded-2xl p-4 flex-1 overflow-y-auto" style={{ background: 'rgba(18,24,40,0.58)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5"><Award size={14} className="text-purple-400" /> Achievements</div>
                <div className="space-y-2">
                  {ACHIEVEMENT_DEFS.map(def => {
                    const earned = earnedAchievements.includes(def.id);
                    return (
                      <div key={def.id} className="flex items-center gap-2 p-2 rounded-xl transition-all" style={earned ? { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', opacity: 0.5 }}>
                        <span className="text-lg">{def.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium text-white truncate">{def.name}</div>
                          <div className="text-[8px] text-slate-500 truncate">{def.desc}</div>
                          {earned && <div className="text-[8px] text-green-400">✓ Earned</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
