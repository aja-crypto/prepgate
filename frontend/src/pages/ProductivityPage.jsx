import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { useFocus } from '../context/FocusContext';
import { computeSubjectCompletion } from '../utils/gateUtils';

const GATE_SUBJECTS = [
  { name: 'Engineering Mathematics', icon: '📐', abbr: 'EM', color: '#8B5CF6' },
  { name: 'Digital Logic', icon: '🔢', abbr: 'DL', color: '#6366F1' },
  { name: 'Computer Organization', icon: '🖥️', abbr: 'CO', color: '#3B82F6' },
  { name: 'Programming & DS', icon: '💻', abbr: 'DS', color: '#06B6D4' },
  { name: 'Algorithms', icon: '🧮', abbr: 'AL', color: '#8B5CF6' },
  { name: 'Operating Systems', icon: '⚙️', abbr: 'OS', color: '#A855F7' },
  { name: 'DBMS', icon: '🗄️', abbr: 'DB', color: '#7C3AED' },
  { name: 'Computer Networks', icon: '🌐', abbr: 'CN', color: '#6366F1' },
  { name: 'Theory of Computation', icon: '🧩', abbr: 'TOC', color: '#EC4899' },
  { name: 'Compiler Design', icon: '📝', abbr: 'CD', color: '#F59E0B' },
  { name: 'Aptitude', icon: '🎯', abbr: 'APT', color: '#22C55E' },
];

const QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Study hard what interests you the most in the most undisciplined way possible.", author: "Richard Feynman" },
  { text: "GATE is not just an exam, it is a commitment to yourself.", author: "GateNexa" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
];

const FORMULAS = [
  'T(n) = O(n log n)', 'P = NP?', '∑i = n(n+1)/2', 'E = mc²',
  'Fib(n) = Fib(n-1) + Fib(n-2)', 'Dijkstra O(V²)', 'NP ⊂ EXP',
  'log₂(n)', 'O(2ⁿ)', 'KMP: O(n+m)', 'BFS: O(V+E)', 'DP[i][j]',
  'Î” = b²-4ac', 'P(A|B) = P(B|A)·P(A)/P(B)', 'V-E+F=2',
];

const GOALS = ['Finish Notes', 'Revise Weak Topics', 'Solve PYQs', 'Mock Test Practice', 'Formula Revision', 'Topic Completion'];

const WEEKLY_BAR_DATA = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function GalaxyBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let stars = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.01,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
      });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.3, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7);
      grad.addColorStop(0, 'rgba(139,92,246,0.06)');
      grad.addColorStop(0.5, 'rgba(59,130,246,0.03)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0.1) s.da *= -1;
        s.x += s.dx;
        s.y += s.dy;
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,255,${s.a * 0.7})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

function FloatingFormulas() {
  const [items] = useState(() =>
    FORMULAS.slice(0, 8).map((f, i) => ({
      text: f,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 6,
      duration: 18 + Math.random() * 25,
      delay: Math.random() * 12,
      opacity: 0.025 + Math.random() * 0.04,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
          {items.map((f, i) => (
            <div key={i} className="absolute text-primary whitespace-nowrap" style={{
            left: `${f.x}%`, top: `${f.y}%`, fontSize: `${f.size}px`,
            opacity: f.opacity, animation: `float ${f.duration}s ease-in-out ${f.delay}s infinite`,
          }}>
          {f.text}
        </div>
      ))}
    </div>
  );
}

function NeonRing({ progress, size = 380, strokeWidth = 10, isActive = false, isPaused = false }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="absolute inset-0" style={{
      filter: isActive && !isPaused ? 'drop-shadow(0 0 30px rgba(139,92,246,0.6))' : 'drop-shadow(0 0 15px rgba(139,92,246,0.25))',
      transition: 'filter 0.5s ease',
    }}>
      <defs>
        <linearGradient id="focus-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="focus-ring-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.04)" />
        </linearGradient>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#focus-ring-bg)" strokeWidth={strokeWidth + 8} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#focus-ring-bg)" strokeWidth={strokeWidth + 4} opacity="0.4"
        strokeDasharray={`${circumference * 0.04} ${circumference * 0.06}`} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#focus-ring-grad)" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: 'url(#ring-glow)' }} />
      {progress > 0 && (
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#8B5CF6" strokeWidth="2" opacity="0.35"
          strokeDasharray={`${circumference * 0.015} ${circumference * 0.985}`} strokeLinecap="round"
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      )}
    </svg>
  );
}

function GlassCard({ children, className = '', hover = false, glow = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border border-white/[0.07] bg-white/[0.035] backdrop-blur-xl ${hover ? 'hover:border-primary/20 hover:bg-white/[0.05] transition-all' : ''} ${glow ? 'shadow-lg shadow-primary/5' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function CustomDropdown({ value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-sm text-text hover:border-primary/30 hover:bg-white/[0.06] transition-all">
        {icon && <span className="text-base">{icon}</span>}
        <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 text-text3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0C0F23]/95 backdrop-blur-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${value === opt.value ? 'bg-primary/15 text-primary' : 'text-text2 hover:bg-white/[0.05] hover:text-text'}`}>
                {opt.icon && <span className="text-base">{opt.icon}</span>}
                <span>{opt.label}</span>
                {opt.progress !== undefined && (
                  <span className="ml-auto text-[10px] text-text3">{opt.progress}%</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StopwatchTimer() {
  const [swRunning, setSwRunning] = useState(false);
  const [swTime, setSwTime] = useState(0);
  const intervalRef = useRef(null);

  const startSW = useCallback(() => {
    setSwRunning(true);
    intervalRef.current = setInterval(() => setSwTime(t => t + 1), 1000);
  }, []);

  const pauseSW = useCallback(() => {
    setSwRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const resetSW = useCallback(() => {
    pauseSW();
    setSwTime(0);
  }, [pauseSW]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const hrs = Math.floor(swTime / 3600);
  const mins = Math.floor((swTime % 3600) / 60);
  const secs = swTime % 60;

  return (
    <GlassCard className="p-6" hover>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🕐</span>
        <h3 className="text-sm font-semibold text-text">Stopwatch</h3>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold font-mono text-text tracking-wider mb-1"
          style={{ textShadow: swRunning ? '0 0 20px rgba(139,92,246,0.5)' : 'none' }}>
          {String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <p className="text-[10px] text-text3 mb-4">Free-form study tracking</p>
        <div className="flex gap-2 justify-center">
          {!swRunning ? (
            <button onClick={startSW}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95">
              ▶ Start
            </button>
          ) : (
            <button onClick={pauseSW}
              className="px-5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all">
              ⏸ Pause
            </button>
          )}
          {swTime > 0 && (
            <button onClick={resetSW}
              className="px-5 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-text3 text-xs font-medium hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all">
              ↺ Reset
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default function ProductivityPage() {
  const navigate = useNavigate();
  const { productivity, updateProductivity, topics, pyqs, studyStats } = useProgress();
  const {
    isActive, isPaused, timeRemaining, mode, sessionsCompleted, dailyStreak,
    sessionDuration, DURATIONS, formatTime, startSession, selectDuration,
    pauseSession, resumeSession, stopSession, progress, focusHours,
    currentSubject, setCurrentSubject,
  } = useFocus();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [weeklyHours] = useState(() => {
    const h = [];
    for (let i = 0; i < 7; i++) h.push(Math.random() * 4 + 0.5);
    return h;
  });

  const subjectCompletion = useMemo(
    () => computeSubjectCompletion(studyStats?.subjects || [], topics || [], pyqs || []),
    [studyStats, topics, pyqs]
  );

  const subjectOptions = useMemo(() =>
    GATE_SUBJECTS.map(s => {
      const comp = subjectCompletion.find(c => c.name === s.name);
      return { value: s.name, label: `${s.icon} ${s.name}`, icon: s.icon, progress: comp?.progress || 0 };
    }), [subjectCompletion]
  );

  const topicOptions = useMemo(() => {
    if (!selectedSubject) return [];
    const subTopics = (topics || []).filter(t => t.subject?.name === selectedSubject || t.subject === selectedSubject);
    return subTopics.map(t => ({ value: t.name || t.title, label: t.name || t.title, done: t.done }));
  }, [selectedSubject, topics]);

  const goalOptions = useMemo(() => GOALS.map(g => ({ value: g, label: g })), []);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex(prev => (prev + 1) % QUOTES.length), 12000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[quoteIndex];

  const todayFocus = useMemo(() => {
    const df = productivity?.focusSessions || [];
    const today = new Date().toISOString().slice(0, 10);
    return df.filter(s => s.date === today);
  }, [productivity]);

  const studiedToday = useMemo(() => {
    const map = {};
    todayFocus.forEach(s => {
      if (s.subject) {
        if (!map[s.subject]) map[s.subject] = { mins: 0, topic: s.topic || null, done: s.completed || false };
        map[s.subject].mins += (s.duration || 0) / 60;
        if (s.topic) map[s.subject].topic = s.topic;
      }
    });
    return Object.entries(map).map(([name, data]) => ({ name, mins: Math.round(data.mins), topic: data.topic, done: data.done }));
  }, [todayFocus]);

  const totalStudyMins = studiedToday.reduce((s, x) => s + x.mins, 0);
  const todayHours = Math.round(totalStudyMins / 60 * 10) / 10;
  const weeklyAvg = Math.round(focusHours * 10) / 10;
  const focusScore = sessionsCompleted > 0 ? Math.min(100, Math.round((focusHours / Math.max(1, sessionsCompleted)) * 60 * 100 / 100)) : 0;
  const goalProgress = Math.min(100, (totalStudyMins / 180) * 100);

  const xp = sessionsCompleted * 25 + Math.round(totalStudyMins * 0.5);
  const level = Math.floor(xp / 300) + 1;
  const xpInLevel = xp % 300;

  const handleStart = () => {
    setCurrentSubject(selectedSubject || null);
    startSession(sessionDuration, selectedSubject || null);
  };

  const handleQuickBreak = (mins) => {
    if (isActive) return;
    startSession(mins * 60, null);
  };

  const maxWeekly = Math.max(...weeklyHours, 1);

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      <GalaxyBackground />
      <FloatingFormulas />

      <div className="relative z-10 p-4 sm:p-6">
        {/* Top Stats Bar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/15 backdrop-blur-md">
            <span className="text-lg">🔥</span>
            <div>
              <div className="text-lg font-bold text-orange-400 leading-none">{dailyStreak}</div>
              <div className="text-[9px] text-text3 uppercase tracking-wider">Day Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/5 border border-primary/15 backdrop-blur-md">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-lg font-bold text-primary leading-none">{focusScore}%</div>
              <div className="text-[9px] text-text3 uppercase tracking-wider">Focus Score</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/15 backdrop-blur-md">
            <span className="text-lg">⏱</span>
            <div>
              <div className="text-lg font-bold text-cyan-400 leading-none">{todayHours}h</div>
              <div className="text-[9px] text-text3 uppercase tracking-wider">Today's Hours</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/15 backdrop-blur-md">
            <span className="text-lg">📈</span>
            <div>
              <div className="text-lg font-bold text-emerald-400 leading-none">{weeklyAvg}h</div>
              <div className="text-[9px] text-text3 uppercase tracking-wider">Weekly Avg</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/15 backdrop-blur-md">
            <span className="text-lg">⚡</span>
            <div>
              <div className="text-lg font-bold text-violet-400 leading-none">Lv.{level}</div>
              <div className="text-[9px] text-text3 uppercase tracking-wider">{xpInLevel}/300 XP</div>
            </div>
            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all" style={{ width: `${(xpInLevel / 300) * 100}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Main Grid: 70/30 */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Main Timer Area */}
            <GlassCard className="p-6 sm:p-8 relative overflow-hidden" glow>
              <div className="absolute top-4 right-4 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold ${isActive ? (mode === 'work' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25') : 'bg-success/15 text-success border border-success/25'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? (mode === 'work' ? 'bg-primary animate-pulse' : 'bg-amber-400 animate-pulse') : 'bg-success'}`} />
                  {isActive ? (mode === 'work' ? 'Focus Session' : 'Break Time') : 'Ready'}
                </span>
              </div>

              <div className="flex flex-col items-center py-2">
                {/* Giant Timer Ring */}
                <div className="relative flex items-center justify-center mb-4 w-[min(380px,80vw)] h-[min(380px,80vw)]">
                  <NeonRing progress={progress} size={380} strokeWidth={10} isActive={isActive} isPaused={isPaused} />
                  <div className="flex flex-col items-center z-10">
                    <span className="text-8xl sm:text-9xl font-bold font-mono text-text tracking-tight leading-none"
                      style={{ textShadow: isActive && !isPaused ? '0 0 40px rgba(139,92,246,0.6)' : 'none', fontSize: 'clamp(4rem, 10vw, 7.5rem)' }}>
                      {formatTime(timeRemaining)}
                    </span>
                    <span className="text-sm text-text3 mt-3">
                      {isActive ? (mode === 'work' ? 'Focus Time' : 'Break Time') : 'Focus Time'}
                    </span>
                  </div>
                </div>

                {/* Active Session Info */}
                {isActive && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg mb-4 space-y-3">
                    {/* Current Subject + Topic */}
                    {(selectedSubject || currentSubject) && (
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                          <span className="text-sm">{GATE_SUBJECTS.find(s => s.name === (selectedSubject || currentSubject))?.icon || '📚'}</span>
                          <span className="text-xs font-medium text-primary">{selectedSubject || currentSubject}</span>
                        </div>
                        {selectedTopic && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <span className="text-xs font-medium text-blue-400">{selectedTopic}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Session Progress Bar */}
                    <div className="px-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-text3">Session Progress</span>
                        <span className="text-[10px] text-primary font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-1000"
                          style={{ width: `${progress}%`, backgroundSize: '200% 100%', animation: isActive && !isPaused ? 'shimmer 3s linear infinite' : 'none' }} />
                      </div>
                    </div>

                    {/* Goal */}
                    {selectedGoal && (
                      <div className="flex items-center justify-center gap-2 text-xs text-text3">
                        <span>🎯</span>
                        <span>Goal: <span className="text-text2 font-medium">{selectedGoal}</span></span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Duration Selector */}
                {!isActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-center mb-5 flex-wrap">
                    {DURATIONS.map((d) => (
                      <button key={d.value} onClick={() => selectDuration(d.value)}
                        className={`text-xs px-4 py-2 rounded-xl border transition-all ${
                          sessionDuration === d.value
                            ? 'bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/10'
                            : 'border-white/[0.08] text-text3 hover:border-primary/30 hover:text-text2'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Pre-Session Config */}
                {!isActive && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-3 mb-5">
                    <CustomDropdown value={selectedSubject} onChange={(v) => { setSelectedSubject(v); setSelectedTopic(''); }} options={subjectOptions} placeholder="Subject (optional)" icon="📚" />
                    {selectedSubject && topicOptions.length > 0 && (
                      <CustomDropdown value={selectedTopic} onChange={setSelectedTopic} options={topicOptions.map(t => ({ value: t.value, label: t.done ? `✅ ${t.label}` : t.label }))} placeholder="Topic (optional)" icon="📖" />
                    )}
                    <CustomDropdown value={selectedGoal} onChange={setSelectedGoal} options={goalOptions} placeholder="Goal (optional)" icon="🎯" />
                  </motion.div>
                )}

                {/* Controls */}
                {isActive ? (
                  <div className="flex gap-3 items-center">
                    {mode === 'work' && (
                      <button onClick={isPaused ? resumeSession : pauseSession}
                        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold text-sm shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                      </button>
                    )}
                    <button onClick={stopSession}
                      className="px-6 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] text-text2 font-medium text-sm hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                      ⏹ End
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <button onClick={handleStart}
                      className="px-12 py-4 rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-primary text-white font-bold text-base shadow-2xl shadow-primary/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }}>
                      ⚡ Start Focus Session
                    </button>
                    <button onClick={() => navigate('/deep-focus')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-text3 text-xs font-medium hover:text-text hover:border-primary/20 hover:bg-white/[0.05] transition-all">
                      <span>🌑</span> Deep Focus Mode
                    </button>
                  </div>
                )}

                {/* Session Counter */}
                {isActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 mt-5 text-xs text-text3">
                    <span>Session {sessionsCompleted + 1}/{Math.max(1, Math.ceil(sessionDuration / (25 * 60)))}</span>
                    {selectedGoal && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">{selectedGoal}</span>
                    )}
                  </motion.div>
                )}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-5" hover>
              <h3 className="text-sm font-semibold text-text mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Short Break', sub: '5 min', icon: '☕', color: 'from-green-500/20 to-emerald-500/10', action: () => handleQuickBreak(5) },
                  { label: 'Long Break', sub: '15 min', icon: '🛋️', color: 'from-blue-500/20 to-cyan-500/10', action: () => handleQuickBreak(15) },
                  { label: 'Stopwatch', sub: 'Free mode', icon: '🕐', color: 'from-purple-500/20 to-violet-500/10', action: () => {} },
                  { label: 'Motivation', sub: 'Get inspired', icon: '⭐', color: 'from-amber-500/20 to-yellow-500/10', action: () => setQuoteIndex((i) => (i + 1) % QUOTES.length) },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br ${a.color} border border-white/[0.06] hover:border-white/[0.12] transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                    <span className="text-xl">{a.icon}</span>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-text">{a.label}</div>
                      <div className="text-[10px] text-text3">{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Bottom Row: Goals + Weekly + Streak */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Focus Goal */}
              <GlassCard className="p-5" hover>
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <span>🎯</span> Focus Goal
                </h3>
                <div className="text-center mb-3">
                  <div className="text-3xl font-bold text-text">{todayHours}<span className="text-sm text-text3">h</span></div>
                  <div className="text-[10px] text-text3">of 3h daily target</div>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-700" style={{ width: `${goalProgress}%` }} />
                </div>
                <div className="text-center mt-2 text-[10px] text-text3">{Math.round(goalProgress)}% complete</div>
              </GlassCard>

              {/* Weekly Analytics */}
              <GlassCard className="p-5" hover>
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <span>📊</span> Weekly Focus
                </h3>
                <div className="flex items-end gap-1.5 h-20 mb-2">
                  {weeklyHours.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t-md transition-all ${i === new Date().getDay() - 1 ? 'bg-gradient-to-t from-primary to-blue-500' : 'bg-white/[0.08]'}`}
                        style={{ height: `${(h / maxWeekly) * 100}%`, minHeight: '4px' }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {WEEKLY_BAR_DATA.map((d, i) => (
                    <div key={i} className={`flex-1 text-center text-[9px] ${i === new Date().getDay() - 1 ? 'text-primary font-bold' : 'text-text3'}`}>{d}</div>
                  ))}
                </div>
                <div className="text-center mt-2 text-[10px] text-text3">Total: {weeklyAvg}h this week</div>
              </GlassCard>

              {/* Streak */}
              <GlassCard className="p-5" hover>
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <span>🔥</span> Streak
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-1">{dailyStreak}</div>
                  <div className="text-[10px] text-text3 mb-3">consecutive days</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }, (_, i) => (
                      <div key={i} className={`w-full aspect-square rounded-sm ${i < dailyStreak ? 'bg-gradient-to-br from-orange-500/40 to-amber-500/30' : 'bg-white/[0.05]'}`} />
                    ))}
                  </div>
                  <div className="text-[9px] text-text3 mt-2">Last 28 days</div>
                </div>
              </GlassCard>
            </div>

            {/* Motivation Quote */}
            <GlassCard className="p-5 relative overflow-hidden" hover>
              <div className="absolute top-3 left-5 text-5xl text-primary/10 font-serif">"</div>
              <div className="relative z-10 px-8 py-2">
                <p className="text-sm text-text leading-relaxed italic">{quote.text}</p>
                <p className="text-[10px] text-text3 mt-2">— {quote.author}</p>
              </div>
              <div className="absolute bottom-3 right-5 text-5xl text-primary/10 font-serif rotate-180">"</div>
            </GlassCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Study Summary */}
            <GlassCard className="p-5" glow>
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <span>📊</span> Study Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Time', value: formatTime(focusHours * 3600), icon: '⏱' },
                  { label: 'Sessions', value: sessionsCompleted, icon: '🎯' },
                  { label: 'Topics Studied', value: studiedToday.length, icon: '📖' },
                  { label: 'Focus Score', value: `${focusScore}%`, icon: '⚡', color: 'text-primary' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <div className="text-base mb-1">{s.icon}</div>
                    <div className={`text-lg font-bold ${s.color || 'text-text'}`}>{s.value}</div>
                    <div className="text-[9px] text-text3 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Stopwatch */}
            <StopwatchTimer />

            {/* What You Studied */}
            <GlassCard className="p-5" hover>
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <span>📖</span> What You Studied
              </h3>
              {studiedToday.length > 0 ? (
                <div className="space-y-3">
                  {studiedToday.map((s, i) => {
                    const sub = GATE_SUBJECTS.find(g => g.name === s.name);
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
                          {sub?.icon || '📖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-text truncate">{s.name}</div>
                          {s.topic && <div className="text-[10px] text-text3 truncate">{s.topic}</div>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono text-text2">{s.mins}m</div>
                          <div className={`text-[9px] ${s.done ? 'text-success' : 'text-text3'}`}>
                            {s.done ? '✓ Done' : 'In Progress'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-text3 text-xs">
                  <div className="text-2xl mb-2">📚</div>
                  No study sessions yet today. Start focusing!
                </div>
              )}
            </GlassCard>

            {/* Subject Progress */}
            <GlassCard className="p-5" hover>
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <span>📈</span> Subject Progress
              </h3>
              <div className="space-y-3">
                {subjectCompletion.slice(0, 6).map(s => {
                  const sub = GATE_SUBJECTS.find(g => g.name === s.name);
                  return (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{sub?.icon || '📖'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[11px] text-text2 truncate">{s.name.length > 16 ? s.name.slice(0, 16) + '...' : s.name}</span>
                          <span className="text-[10px] text-text3">{s.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{
                            width: `${s.progress}%`,
                            background: s.progress >= 70 ? 'linear-gradient(90deg, #22C55E, #10B981)' :
                              s.progress >= 40 ? 'linear-gradient(90deg, #F59E0B, #EAB308)' :
                                'linear-gradient(90deg, #8B5CF6, #6366F1)'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Motivation Panel */}
            <GlassCard className="p-5 relative overflow-hidden" hover>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5" />
              <div className="relative z-10">
                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <span>💡</span> Need Motivation?
                </h3>
                <p className="text-xs text-text2 mb-3">You're doing great! Keep going.</p>
                <div className="text-sm text-text italic leading-relaxed mb-3">"{quote.text}"</div>
                <button onClick={() => setQuoteIndex((i) => (i + 1) % QUOTES.length)}
                  className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-all">
                  Next Quote →
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

