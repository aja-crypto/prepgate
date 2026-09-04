import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence, useSpring, useTransform, useMotionValue, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Brain, Target, BarChart3, Calendar, BookOpen, CheckCircle2, ArrowRight, ArrowDown, ChevronRight, Award, Zap, Shield, TrendingUp, FileText, MessageCircle, PenTool, Search, Clock, Star, Trophy, Users, BookMarked, Lightbulb, Layers, PieChart, Rocket, ChevronDown, ChevronUp, Eye, MousePointerClick, Sparkles, Activity, Smartphone, Monitor, Gauge, Quote, Play, MessageSquare } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };
const fadeUpFast = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } };
const stagger = { initial: {}, whileInView: { transition: { staggerChildren: 0.08 } }, viewport: { once: true, margin: '-60px' } };

const CARD_COLORS = { dashboard: '#8B5CF6', assistant: '#22D3EE', predictor: '#F97316' };
const _FORCE_RELOAD = 1;

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '', decimals = 0, reducedMotion }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (reducedMotion) { setDisplay(value); return; }
    let start = 0;
    const dur = 1200;
    const step = Math.max(1, Math.floor(value / 30));
    const interval = dur / (value / step);
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(start);
    }, interval);
    return () => clearInterval(t);
  }, [value, reducedMotion]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

/* ─── Typing Animation ─── */
function useTypewriter(text, speed = 40) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { displayed, done };
}

/* ─── Particle Background ─── */
function ParticleField({ count = 30, reducedMotion }) {
  const particles = useRef([]);
  if (particles.current.length === 0) {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 2 + 1, speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.4 + 0.1, delay: Math.random() * 5,
      });
    }
  }
  if (reducedMotion) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity, background: '#8B5CF6' }}
          animate={{
            y: [0, -20, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{ duration: 4 + p.speed * 3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Connection Lines SVG ─── */
function ConnectionLines({ positions, reducedMotion }) {
  const { p1, p2, p3 } = positions;
  if (!p1 || !p2 || !p3) return null;
  const lines = [
    { from: p1, to: p2, color: '#8B5CF6' },
    { from: p2, to: p3, color: '#22D3EE' },
    { from: p3, to: p1, color: '#F97316' },
  ];
  return (
    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full">
      {lines.map((l, i) => {
        const mx = (l.from.x + l.to.x) / 2;
        const my = Math.min(l.from.y, l.to.y) - 20;
        return (
          <g key={i}>
            <path d={`M${l.from.x},${l.from.y} Q${mx},${my} ${l.to.x},${l.to.y}`} fill="none" stroke={l.color} strokeWidth="1" opacity="0.2" strokeDasharray={reducedMotion ? "0" : "4 4"}>
              {!reducedMotion && <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.5s" repeatCount="indefinite" />}
            </path>
            {!reducedMotion && <circle r="2" fill={l.color} opacity="0.6">
              <animateMotion dur="2.5s" repeatCount="indefinite" path={`M${l.from.x},${l.from.y} Q${mx},${my} ${l.to.x},${l.to.y}`} />
            </circle>}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── 3D Rotating Card Stack ─── */
const CARD_DATA = [
  {
    id: 'dashboard', icon: BarChart3, title: 'Dashboard', badge: null, color: CARD_COLORS.dashboard,
    content: (inView, rm) => (
      <>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-semibold text-white">Good Morning, Ajay</div>
            <div className="text-[9px] text-slate-500">Here's your progress today.</div>
          </div>
          <button className="text-[9px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">View Plan</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { val: 78, suffix: '%', color: 'text-green-400', bg: 'bg-green-500/10', label: 'Readiness' },
            { val: 18, suffix: '', color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Streak' },
            { num: 3, den: 5, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Mission' },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} p-2 rounded-lg text-center`}>
              <div className={`text-sm font-bold ${item.color}`}>
                {item.den ? <>{item.num}/{item.den}</> : <>{inView ? <AnimatedCounter value={item.val} suffix={item.suffix} reducedMotion={rm} /> : `${item.val}${item.suffix}`}</>}
              </div>
              <div className="text-[8px] text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-8">
          {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={inView ? { height: `${h}%` } : {}}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
              style={{ background: i === 4 ? '#8B5CF6' : 'rgba(139,92,246,0.2)' }}
            />
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'assistant', icon: Brain, title: 'AI Assistant', badge: 'GPT', color: CARD_COLORS.assistant,
    content: (inView, rm) => {
      const question = 'Explain Dynamic Programming with examples';
      const reply = 'Dynamic Programming solves overlapping subproblems by storing their results...';
      const { displayed: typedQ, done: qDone } = useTypewriter(inView && !rm ? question : '', 35);
      const { displayed: typedR } = useTypewriter(qDone ? reply : '', 20);
      return (
        <div className="space-y-2 text-[11px]">
          <div className="p-2 rounded-lg flex items-start gap-2" style={{ background: 'rgba(6,182,212,0.08)' }}>
            <MessageSquare size={10} className="text-cyan-400 shrink-0 mt-0.5" />
            <span className="text-slate-300">{typedQ}{!qDone && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-cyan-400">|</motion.span>}</span>
          </div>
          {qDone && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-2 rounded-lg flex items-start gap-2" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <Brain size={10} className="text-purple-400 shrink-0 mt-0.5" />
              <span style={{ color: '#C4B5FD' }}>{typedR}{qDone && typedR.length < reply.length && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-purple-400">|</motion.span>}</span>
            </motion.div>
          )}
          <div className="flex gap-1.5 mt-2">
            <div className="p-1.5 rounded-lg bg-white/[0.02] text-[9px] text-slate-600 border border-white/5 flex-1 text-center">→ DP basics</div>
            <div className="p-1.5 rounded-lg bg-white/[0.02] text-[9px] text-slate-600 border border-white/5 flex-1 text-center">→ Top-down vs Bottom-up</div>
          </div>
        </div>
      );
    },
  },
  {
    id: 'predictor', icon: Target, title: 'Nexa Predictor', badge: 'LIVE', color: CARD_COLORS.predictor,
    content: (inView, rm) => (
      <>
        <div className="mb-3">
          <div className="text-[9px] text-slate-500">Predicted AIR</div>
          <div className="flex items-end gap-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-3xl font-bold text-white font-mono tracking-tight"
            >
              {inView ? <AnimatedCounter value={426} reducedMotion={rm} /> : '0'}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-1 text-green-400 text-[10px] mb-1"
            >
              <TrendingUp size={10} /> +86
            </motion.div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <div className="text-[9px] text-slate-500">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-purple-500/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: '82%' } : {}}
                  transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-purple-400"
                />
              </div>
              <span className="text-sm font-semibold text-purple-400">82%</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-500/10">
            <div className="text-[9px] text-slate-500">Target</div>
            <div className="text-sm font-semibold text-white">Top 100</div>
          </div>
        </div>
      </>
    ),
  },
];

/* ─── Hero Card (positioned in 3D stack) ─── */
function HeroCard({ card, position, totalCards, cardRefs, onCardClick, reducedMotion }) {
  const isFront = position === 0;
  const scale = isFront ? 1 : 0.92 - position * 0.03;
  const yOffset = isFront ? 0 : 20 + (position - 1) * 15;
  const rotate = isFront ? 0 : position === 1 ? -5 : 6;
  const zIdx = 30 - position * 12;
  const opacity = 1 - position * 0.15;
  const xOffset = isFront ? 0 : position === 1 ? -20 : 18;
  const translateZ = isFront ? 60 : -20 - position * 30;
  const floatY = isFront ? [0, -10, 0] : position === 1 ? [0, -6, 0] : [0, -4, 0];
  const floatDur = isFront ? 6 : 7 + position;

  return (
    <motion.div
      ref={(el) => { cardRefs.current[card.id] = el; }}
      layout
      initial={false}
      animate={reducedMotion ? {
        scale, y: yOffset, rotate, opacity,
        x: xOffset,
        zIndex: zIdx,
      } : {
        scale, rotate, opacity,
        x: xOffset,
        zIndex: zIdx,
        y: [yOffset, yOffset + (isFront ? -10 : position === 1 ? -6 : -4), yOffset],
      }}
      transition={reducedMotion ? {
        layout: { duration: 0.3 },
      } : {
        duration: floatDur,
        repeat: Infinity,
        ease: 'easeInOut',
        layout: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={onCardClick}
      className="absolute cursor-pointer w-[clamp(180px,70%,290px)] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(18,24,40,0.95)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: isFront
          ? `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${card.color}25, 0 8px 40px ${card.color}20`
          : `0 15px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.08)`,
        transformStyle: 'preserve-3d',
        left: 0,
        right: 0,
        margin: '0 auto',
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <card.icon size={16} style={{ color: card.color }} />
          <span className="text-xs font-semibold text-white">{card.title}</span>
          {card.badge && <span className="ml-auto text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">{card.badge}</span>}
        </div>
        {card.content(isFront, reducedMotion)}
      </div>
    </motion.div>
  );
}

/* ─── Magnetic Button ─── */
function MagneticButton({ children, to, primary = true, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2;
    const dy = e.clientY - r.top - r.height / 2;
    x.set(dx * 0.25);
    y.set(dy * 0.25);
  }, [x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  const [ripples, setRipples] = useState([]);
  const onClick = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((p) => p.filter(r => r.id !== id)), 600);
  }, []);

  const baseClass = primary
    ? 'inline-flex items-center gap-2 px-6 min-h-[44px] rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] relative overflow-hidden'
    : 'inline-flex items-center gap-2 px-6 min-h-[44px] rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 hover:bg-white/[0.03] relative overflow-hidden';

  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`${baseClass} ${className}`}
      style={primary ? {
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        boxShadow: '0 4px 24px rgba(139,92,246,0.35)',
        x: springX, y: springY,
      } : { x: springX, y: springY }}
    >
      {ripples.map(r => (
        <span key={r.id} className="absolute w-4 h-4 rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x - 8, top: r.y - 8, animation: 'ripple 0.6s ease-out forwards' }} />
      ))}
      {children}
    </Link>
  );
}

const FEATURE_CARDS = [
  { icon: Brain, title: 'GateNexa AI', sub: '24×7 Personal Mentor', desc: 'AI that understands your weak areas, recommends daily tasks, solves doubts instantly, and creates personalized study plans.', color: '#8B5CF6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.02))' },
  { icon: Target, title: 'Nexa Predictor', sub: 'Predict Your AIR', desc: 'Analyze your performance across tests, PYQs, and study hours to predict your expected AIR with confidence scoring.', color: '#F97316', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.02))' },
  { icon: Calendar, title: 'Smart Planner', sub: 'Daily AI Planning', desc: 'AI generates a dynamic study plan based on your syllabus, available time, strengths, and weak areas — updated weekly.', color: '#06B6D4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.02))' },
  { icon: BarChart3, title: 'Complete Analytics', sub: 'Track & Improve', desc: 'Monitor study hours, accuracy, topic completion, and readiness with detailed charts and actionable insights.', color: '#22C55E', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.02))' },
];

const JOURNEY_STEPS = [
  { icon: Users, label: 'Sign Up', sub: 'Create your GateNexa account', color: '#8B5CF6' },
  { icon: Brain, label: 'AI Assessment', sub: 'AI evaluates your preparation level', color: '#22D3EE' },
  { icon: Calendar, label: 'AI Study Plan', sub: 'Personalized roadmap generated instantly', color: '#3B82F6' },
  { icon: BookOpen, label: 'Study Daily', sub: 'Topics, Notes, PYQs', color: '#22C55E' },
  { icon: Target, label: 'Practice', sub: 'Daily questions and mocks', color: '#F97316' },
  { icon: BarChart3, label: 'AI Analytics', sub: 'Performance tracking', color: '#A855F7' },
  { icon: Layers, label: 'Smart Revision', sub: 'AI identifies weak areas', color: '#EC4899' },
  { icon: Trophy, label: 'GATE Success', sub: 'College Prediction · AIR Estimation', color: '#F59E0B' },
];

const SECTIONS = [
  { n: 1, title: 'Dashboard — Your Command Center', desc: 'Get a quick overview of your progress, daily goals, AI recommendations, streak, upcoming revisions and more.', bullets: ['Daily Mission with AI Recommendations', 'Study Streak & Readiness Score', 'Weekly Study Hours Visualization', 'Quick Actions & Upcoming Revisions'], imageSrc: '/assets/explore/dashboard.webp', imageLabel: 'Dashboard', link: '/dashboard' },
  { n: 2, title: 'GateNexa AI — Your Personal Guide', desc: 'Get instant help, study plans, doubt solutions, topic recommendations and smart performance analysis — available 24×7.', bullets: ['Doubt Solving with Concept Explanations', 'Personalized Study Plans', 'Weak Topic Detection & Alerts', 'Smart Revision Scheduler & Next Best Task'], imageSrc: '/assets/explore/assistant.webp', imageLabel: 'AI Mentor', link: '/mentor' },
  { n: 3, title: 'Subjects & Study Library', desc: 'Complete syllabus organized subject-wise with notes, formula sheets, short notes, PYQs, tests, and resources.', bullets: ['Complete Syllabus & Roadmap', 'Topic-wise Progress Tracking', 'Notes, Short Notes & Formula Sheets', 'Important PDFs & Video Resources'], imageSrc: '/assets/explore/subjects.webp', imageLabel: 'Subjects', link: '/subjects' },
  { n: 4, title: 'PYQs — 2001 to 2026', desc: 'Access GATE PYQs from 2001 to 2026 with filters, detailed solutions, bookmarks and progress tracking.', bullets: ['2001 – 2026 PYQs with Solutions', 'Subject / Topic / Year / Difficulty Filters', 'Bookmark & Personal Notes', 'AI-Powered Explanations & Progress'], imageSrc: '/assets/explore/pyqs.webp', imageLabel: 'PYQs', link: '/pyq' },
  { n: 5, title: 'Weekly Questions', desc: 'New sets of high-quality questions released every week to keep you consistent and challenge your understanding.', bullets: ['Weekly Curated Question Sets', 'Topic-wise Coverage', 'Timed Practice with Instant Solutions', 'Consistency & Performance Analysis'], imageSrc: '/assets/explore/weekly.webp', imageLabel: 'Weekly Questions', link: '/weekly-tests' },
  { n: 6, title: 'Mock Tests', desc: 'Full-length, subject-wise and topic-wise mocks with detailed analysis to boost your accuracy and exam readiness.', bullets: ['Subject-wise & Topic-wise Mocks', 'Full-length GATE Simulators', 'Detailed Analysis with Mistake Review', 'Accuracy, Time Management & Score Trends'], imageSrc: '/assets/explore/mocktests.webp', imageLabel: 'Mock Tests', link: '/mocks' },
  { n: 7, title: 'Nexa Predictor', desc: 'AI analyzes your performance across tests, PYQs, study time and predicts your expected AIR with high confidence.', bullets: ['Predicted AIR with Confidence Score', 'Readiness & Weak Area Analysis', 'Improvement Suggestions', 'College Cutoff-based Recommendations'], imageSrc: '/assets/explore/predictor.webp', imageLabel: 'Nexa Predictor', link: '/opportunity-predictor' },
  { n: 8, title: 'Deep Focus Mode', desc: 'Distraction-free study environment with Pomodoro timer, ambient themes, and detailed session insights.', bullets: ['Pomodoro Timer with Custom Intervals', 'Ambient Themes & White Noise', 'Session Tracking & Focus Statistics', 'Productivity Trends & Insights'], imageSrc: '/assets/explore/focus.webp', imageLabel: 'Deep Focus', link: '/productivity' },
  { n: 9, title: 'GateVault — Achievements', desc: 'Complete daily challenges, earn badges, level up with XP, and compete on the leaderboard to stay motivated.', bullets: ['Daily Challenges & Milestones', 'Badges, XP & Level System', 'Rewards & Unlockables', 'Leaderboard & Community Motivation'], imageSrc: '/assets/explore/gatevault.webp', imageLabel: 'GateVault', link: '/gate-vault' },
  { n: 10, title: 'Analytics & Insights', desc: 'Track your performance with powerful analytics and identify areas that need improvement before it\'s too late.', bullets: ['Study Hours & Accuracy Trends', 'Topic Completion & Weak Topic Detection', 'Performance Trends Over Time', 'Readiness Score & Predictive Insights'], imageSrc: '/assets/explore/analytics.webp', imageLabel: 'Analytics', link: '/analytics' },
  { n: 11, title: 'Resource Hub', desc: 'Everything you need in one place — notes, formula sheets, short notes, PDFs, videos, and important resources.', bullets: ['Notes & Short Notes', 'Formula Sheets & PDFs', 'Video Resources & Tutorials', 'Bookmarks & Downloads'], imageSrc: '/assets/explore/resources.webp', imageLabel: 'Resources', link: '/subjects' },
];

function Section({ number, title, subtitle, bullets, imageSrc, imageLabel, reverse, children }) {
  const imgRef = useRef(null);
  const isInView = useInView(imgRef, { once: true, margin: '-100px' });
  return (
    <motion.div {...fadeUp} className={`flex flex-col lg:flex-row gap-10 lg:gap-16 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-purple-400" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>{String(number).padStart(2, '0')}</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6 max-w-lg">{subtitle}</p>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle2 size={12} className="text-green-400" />
              </div>
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
        {children}
      </div>
      <div ref={imgRef} className="flex-1 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl p-[2px] overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.2), rgba(139,92,246,0.1))' }}
        >
          <div className="rounded-2xl overflow-hidden relative" style={{ background: '#0B1020' }}>
            <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: 'rgba(18,24,40,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" /></div>
              <span className="text-[10px] text-slate-500 ml-2 font-medium">{imageLabel}</span>
              <div className="ml-auto flex gap-1"><div className="w-2 h-2 rounded-full bg-white/10" /><div className="w-2 h-2 rounded-full bg-white/10" /><div className="w-2 h-2 rounded-full bg-white/10" /></div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }}>
              {imageSrc ? (
                <img src={imageSrc} alt={imageLabel} className="w-full h-auto" loading="lazy" />
              ) : (
                <div className="p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
                  <p className="text-xs text-slate-600">{imageLabel}</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const FEATURE_PILLS = [
  { icon: Brain, label: 'AI Mentor', color: '#8B5CF6' },
  { icon: TrendingUp, label: 'Nexa Predictor', color: '#F97316' },
  { icon: Calendar, label: 'Smart Planner', color: '#06B6D4' },
  { icon: FileText, label: 'PYQs 2001–2026', color: '#22C55E' },
  { icon: Clock, label: 'Deep Focus', color: '#F59E0B' },
  { icon: Award, label: 'GateVault', color: '#EC4899' },
];

export default function PlatformPage() {
  useSEO({ title: 'Platform', description: 'Explore GateNexa platform — dashboard, AI mentor, study planner, PYQs, mock tests, analytics, revision and college prediction.' });
  const reducedMotion = useReducedMotion();
  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard');
  const [activeFeature, setActiveFeature] = useState(0);
  const [frontCard, setFrontCard] = useState(0);
  const [heroInView, setHeroInView] = useState(false);
  const featureIntervalRef = useRef(null);
  const journeyRef = useRef(null);
  const journeyInView = useInView(journeyRef, { once: true, margin: '-50px' });
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const heroObserved = useInView(sectionRef, { once: true, margin: '-100px' });
  const cardRefs = useRef({});

  /* Feature card auto-cycle (disabled for reduced motion) */
  useEffect(() => {
    if (reducedMotion) return;
    featureIntervalRef.current = setInterval(() => {
      setActiveFeature((p) => (p + 1) % FEATURE_CARDS.length);
    }, 4000);
    return () => clearInterval(featureIntervalRef.current);
  }, [reducedMotion]);

  /* 3D card stack rotation (disabled when user prefers reduced motion) */
  useEffect(() => {
    if (!heroObserved || reducedMotion) return;
    const t = setInterval(() => setFrontCard((p) => (p + 1) % 3), 5000);
    return () => clearInterval(t);
  }, [heroObserved, reducedMotion]);

  /* Trigger hero entrance */
  useEffect(() => {
    if (heroObserved) {
      const t = setTimeout(() => setHeroInView(true), 100);
      return () => clearTimeout(t);
    }
  }, [heroObserved]);

  /* Connection line positions from card refs */
  const [linePositions, setLinePositions] = useState({});
  useEffect(() => {
    if (!heroInView) return;
    const update = () => {
      const positions = {};
      Object.entries(cardRefs.current).forEach(([id, el]) => {
        if (el) {
          const r = el.getBoundingClientRect();
          const pr = cardsContainerRef.current?.getBoundingClientRect();
          if (pr) {
            positions[id] = { x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height / 2 };
          }
        }
      });
      setLinePositions(positions);
    };
    update();
    const t = setInterval(update, 100);
    return () => clearInterval(t);
  }, [heroInView]);

  const sidebarItems = [
    { name: 'Dashboard', icon: BarChart3, what: 'Your main hub showing daily missions, AI recommendations, streak, and readiness score.', when: 'Check it every morning to plan your day.', how: 'Opens a real-time dashboard with daily mission, study streak, weekly hours graph, and AI-powered recommendations tailored to your progress.' },
    { name: 'AI Mentor', icon: Brain, what: '24/7 AI chatbot that answers doubts, explains concepts, and generates study plans.', when: 'Ask doubts after studying a topic or when stuck on a concept.', how: 'Type your question — the AI understands GATE CSE context, provides step-by-step explanations, and even generates practice questions.' },
    { name: 'Subjects', icon: BookOpen, what: 'Complete GATE CSE syllabus with 74 topics, progress tracking, and resources.', when: 'Start here to see what topics you need to study and their completion status.', how: 'Each subject has topics, notes, formula sheets, PYQs, and micro-tests. Track your completion per topic.' },
    { name: 'PYQs', icon: FileText, what: 'Previous year questions from 2001-2026 with filters, solutions, and bookmarks.', when: 'After studying a topic, solve its PYQs to test understanding.', how: 'Filter by year, subject, topic, or difficulty. Each question has a detailed solution with AI explanation option.' },
    { name: 'Weekly Questions', icon: Layers, what: 'Fresh curated practice sets released weekly for consistent practice.', when: 'Complete at least one set per week to maintain consistency.', how: 'Every Monday, a new set of mixed-topic questions drops. Timed mode available to simulate exam pressure.' },
    { name: 'Mock Tests', icon: Target, what: 'Subject-wise, topic-wise, and full-length mocks with detailed analysis.', when: 'Take a mock every 2-3 weeks to benchmark your progress.', how: 'After each mock, get a breakdown by subject, accuracy, time spent, and mistake review with recommendations.' },
    { name: 'Planner', icon: Calendar, what: 'AI-powered study scheduling with daily goals and calendar integration.', when: 'Set up your plan at the start, then follow daily targets.', how: 'Tell the AI your exam date and available hours. It generates a day-by-day plan that adapts as you progress.' },
    { name: 'Analytics', icon: BarChart3, what: 'Track study hours, accuracy, topic completion, and performance trends.', when: 'Review weekly to identify weak areas and adjust your plan.', how: 'Visual charts show your study patterns, subject-wise accuracy, topic completion status, and readiness score trend.' },
    { name: 'Deep Focus', icon: Clock, what: 'Pomodoro timer, ambient themes, and session tracking for distraction-free study.', when: 'Use during every study session for maximum productivity.', how: 'Set focus/break intervals, choose an ambient theme, and start. Session history shows your daily focus stats.' },
    { name: 'GateVault', icon: Award, what: 'Earn badges, complete challenges, level up, and compete on leaderboards.', when: 'Daily to stay motivated and track milestones.', how: 'Complete challenges like "7-day streak" or "Solve 100 PYQs" to earn XP, badges, and climb the leaderboard.' },
    { name: 'Resources', icon: BookMarked, what: 'Notes, formula sheets, PDFs, short notes, and video lectures.', when: 'Bookmark important resources for quick revision before exams.', how: 'Upload or browse curated resources. Organize with folders, bookmarks, and quick-access for revision.' },
    { name: 'Settings', icon: Eye, what: 'Customize themes, notifications, focus duration, and manage your account.', when: 'Visit once to set up preferences, then as needed.', how: 'Toggle dark/light mode, set study reminders, configure Pomodoro intervals, and manage your profile.' },
  ];

  const activeItem = sidebarItems.find(i => i.name === activeSidebarItem);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#070B1A' }}>
      {/* Persistent background glow / mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(124,58,237,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,138,0,0.05) 0%, transparent 50%)' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={reducedMotion ? { opacity: 0.06 } : { opacity: [0.3, 0.5, 0.3] }}
          transition={reducedMotion ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(120px)', opacity: 0.06 }}
        />
        <motion.div
          animate={reducedMotion ? { opacity: 0.05 } : { opacity: [0.2, 0.4, 0.2] }}
          transition={reducedMotion ? {} : { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)', filter: 'blur(120px)', opacity: 0.05 }}
        />
        <motion.div
          animate={reducedMotion ? { opacity: 0.04 } : { opacity: [0.1, 0.3, 0.1] }}
          transition={reducedMotion ? {} : { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-2/3 left-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #F97316, transparent 70%)', filter: 'blur(100px)', opacity: 0.04 }}
        />
      </div>

      {/* ============================== */}
      {/* HERO SECTION */}
      {/* ============================== */}
      <section ref={sectionRef} className="relative z-10 overflow-hidden pt-28 pb-16 sm:pt-40 sm:pb-28">
        <ParticleField count={25} reducedMotion={reducedMotion} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-16 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 lg:max-w-xl w-full">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={heroObserved ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-5"
              >
                <motion.span
                  animate={reducedMotion ? {} : { boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 20px rgba(139,92,246,0.2)', '0 0 0px rgba(139,92,246,0)'] }}
                  transition={reducedMotion ? {} : { duration: 2.5, repeat: Infinity }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}
                >
                  <Sparkles size={10} /> All-in-One AI Powered GATE Platform
                </motion.span>
              </motion.div>

              {/* Headline — line by line */}
              <div className="overflow-hidden mb-5">
                <motion.div
                  initial={{ y: 80 }}
                  animate={heroObserved ? { y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
                    Your Complete Journey<br />
                    from Day 1 to{' '}
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                      GATE
                    </span>{' '}
                    Success
                  </h1>
                </motion.div>
              </div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={heroObserved ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm sm:text-base leading-relaxed mb-5 max-w-lg"
                style={{ color: '#B7BED5' }}
              >
                GateNexa is an AI-powered preparation ecosystem that guides aspirants through planning, studying, practicing, revising, analyzing, and achieving their best possible GATE rank.
              </motion.p>

              {/* Floating Feature Pills */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={heroObserved ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {FEATURE_PILLS.map((pill, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={heroObserved ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -1 }}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-default transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <pill.icon size={10} style={{ color: pill.color }} />
                    <span className="text-[9px] font-medium text-slate-400 group-hover:text-white transition-colors">{pill.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={heroObserved ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex items-center gap-4 mb-12 lg:mb-0"
              >
                <MagneticButton to="/register" primary>
                  Start Preparing <ArrowRight size={14} />
                </MagneticButton>
                <MagneticButton to="/register" primary={false}>
                  <motion.span
                    className="flex items-center gap-1"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Play size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    Explore Demo
                  </motion.span>
                </MagneticButton>
              </motion.div>
            </div>

            {/* Right — 3D Rotating Card Stack */}
            <div ref={cardsContainerRef} className="flex-1 w-full relative min-h-[420px] sm:min-h-[480px]">
              {/* Strong glow behind cards */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 60% 50%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(6,182,212,0.2) 0%, transparent 40%)',
                  filter: 'blur(80px)',
                }}
              />
              {/* Pedestal rings */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ bottom: '5%', width: 220, height: 80 }}
              >
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(6,182,212,0.2), transparent)' }} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-24 h-[1px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)' }} />
              </motion.div>
              <ConnectionLines positions={linePositions} reducedMotion={reducedMotion} />
              {CARD_DATA.map((card, i) => {
                const pos = (i - frontCard + 3) % 3;
                return (
                  <HeroCard
                    key={card.id}
                    card={card}
                    position={pos}
                    totalCards={3}
                    cardRefs={cardRefs}
                    onCardClick={() => setFrontCard(i)}
                    reducedMotion={reducedMotion}
                  />
                );
              })}

              {/* Card indicator dots */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => setFrontCard(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{ background: i === frontCard ? CARD_COLORS[CARD_DATA[i].id] : 'rgba(255,255,255,0.15)', width: i === frontCard ? 16 : 6 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* PREMIUM FEATURE CARDS */}
      {/* ============================== */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Zap size={10} /> Everything You Need
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Four Pillars of GateNexa</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">AI-powered tools designed to guide you from Day 1 to GATE Success.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURE_CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative rounded-2xl p-5 group cursor-default"
                style={{ background: card.gradient, border: `1px solid ${card.color}20`, boxShadow: `0 4px 24px ${card.color}08` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: `${card.color}18`, border: `1px solid ${card.color}25` }}>
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: card.color }}>{card.sub}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                <div className="mt-4 w-8 h-[2px] rounded-full transition-all duration-300 group-hover:w-12" style={{ background: card.color }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* AI POWERED SUCCESS ROADMAP */}
      {/* ============================== */}
      <section ref={journeyRef} className="relative z-10 py-12 sm:py-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #A855F7, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <motion.div {...fadeUp} className="text-center mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase mb-3" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>●</motion.span> AI-Powered Success Journey
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #22D3EE, #A78BFA)' }}>
                Your AI Roadmap to GATE 2027
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">From sign-up to college admission — every step guided by GateNexa AI.</p>
          </motion.div>

          <div className="relative">
            {/* Animated connection line - thinner and more subtle */}
            <div className="absolute left-[22px] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.06)' }}>
              <motion.div
                className="absolute top-0 left-0 right-0 rounded-full"
                initial={{ height: '0%' }}
                animate={journeyInView ? { height: '100%' } : {}}
                transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(180deg, #8B5CF6, #22D3EE, #A855F7, #F59E0B)' }}
              />
              {/* Glowing dots - fewer and tighter */}
              {journeyInView && [0.2, 0.5, 0.8].map((pos, idx) => (
                <motion.div
                  key={idx}
                  className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#A78BFA', boxShadow: '0 0 8px rgba(167,139,250,0.5)' }}
                  initial={{ top: '0%' }}
                  animate={{ top: `${pos * 100}%` }}
                  transition={{ duration: 1.5, delay: 1 + idx * 0.3, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* Steps */}
            <div className="space-y-4 sm:space-y-5 relative">
              {JOURNEY_STEPS.map((step, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex items-start gap-3 sm:gap-0 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                  >
                    {/* Card - compact */}
                    <div className={`flex-1 ${isLeft ? 'sm:text-right sm:pr-8' : 'sm:text-left sm:pl-8'}`}>
                      <motion.div
                        whileHover={{ scale: 1.01, y: -1 }}
                        className="group relative p-3 sm:p-3.5 rounded-xl transition-all duration-200 cursor-default"
                        style={{
                          background: 'rgba(18,24,40,0.5)',
                          border: '1px solid rgba(139,92,246,0.08)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className={`flex items-start gap-3 ${isLeft ? 'sm:flex-row-reverse' : ''}`}>
                          {/* Icon - smaller */}
                          <div className="relative shrink-0">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: `${step.color}12`, border: `1px solid ${step.color}15` }}
                            >
                              <step.icon size={16} style={{ color: step.color }} />
                            </motion.div>
                            {/* Step number - smaller */}
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: `${step.color}25`, border: `1px solid ${step.color}30`, color: '#C4B5FD' }}>
                              {i + 1}
                            </div>
                          </div>

                          {/* Content - compact */}
                          <div className={`flex-1 min-w-0 ${isLeft ? 'sm:text-right' : ''}`}>
                            <h3 className="text-sm sm:text-base font-bold text-white">{step.label}</h3>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{step.sub}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Timeline dot - smaller */}
                    <div className="hidden sm:flex flex-col items-center shrink-0 w-[2px] relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                        className="w-3.5 h-3.5 rounded-full border relative z-10"
                        style={{ borderColor: step.color, background: 'rgba(10,15,44,0.95)', boxShadow: `0 0 10px ${step.color}30` }}
                      >
                        <motion.div
                          className="absolute inset-[2px] rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          style={{ background: step.color }}
                        />
                      </motion.div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden sm:block flex-1" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* FEATURE SECTIONS (11 items) */}
      {/* ============================== */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Explore Every Feature in Detail</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">Each tool is designed to solve a specific problem in your GATE preparation journey.</p>
          </motion.div>

          <div className="space-y-16 sm:space-y-32">
            {SECTIONS.map((s, i) => (
              <Section key={s.n} number={s.n} title={s.title} subtitle={s.desc} bullets={s.bullets} imageSrc={s.imageSrc} imageLabel={s.imageLabel} reverse={i % 2 === 1}>
                {s.link && (
                  <Link to={s.link} className="inline-flex items-center gap-1.5 mt-5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors group/link">
                    Explore {s.title.split('—')[0].trim()} <ArrowRight size={12} className="transition-transform duration-200 group-hover/link:translate-x-0.5" />
                  </Link>
                )}
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* SIDEBAR GUIDE */}
      {/* ============================== */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Explore Every Tool in GateNexa</h2>
            <p className="text-sm text-slate-400 mt-3">Click any tool to learn what it does, how it works, and when to use it.</p>
          </motion.div>

          <motion.div {...fadeUp} className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden" style={{ background: 'rgba(18,24,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="lg:w-72 shrink-0 overflow-y-auto max-h-[500px]" style={{ background: 'rgba(10,15,30,0.6)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="p-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-2 px-3 py-1.5">NAVIGATION</div>
                {sidebarItems.map((item, i) => (
                  <button key={i} onClick={() => setActiveSidebarItem(item.name)}
                    className={`w-full flex items-center gap-2.5 text-left px-3 min-h-[44px] py-2 rounded-xl text-[11px] font-medium transition-all mb-0.5 ${activeSidebarItem === item.name ? 'text-purple-300 border border-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'}`}
                    style={activeSidebarItem === item.name ? { background: 'rgba(139,92,246,0.1)' } : {}}>
                    <item.icon size={14} className={activeSidebarItem === item.name ? 'text-purple-400' : 'text-current'} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 sm:p-8 lg:p-10 min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSidebarItem}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {activeItem && <activeItem.icon size={20} className="text-purple-400" />}
                    <h3 className="text-lg font-bold text-white">{activeSidebarItem}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-1.5">What it is</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{activeItem?.what}</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-1.5">How it works</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{activeItem?.how}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-1">When to use it</div>
                      <p className="text-sm text-slate-300">{activeItem?.when}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================== */}
      {/* BOTTOM CTA */}
      {/* ============================== */}
      <section className="relative z-10 py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Rocket size={28} className="text-orange-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">One Platform. Every Resource.<br />Infinite Possibilities.</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-md mx-auto">Join thousands of GATE aspirants who trust GateNexa for their preparation journey.</p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 min-h-[44px] rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 4px 24px rgba(249,115,22,0.35)' }}>
              Start Preparing Now <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
