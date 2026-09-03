import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Rocket, Palette, Compass, Check,
  ArrowRight, ArrowLeft, Eye, Zap, Layout, Activity,
  BookOpen, Bot, Calendar, BarChart3, Target,
  ShieldCheck, Sparkles, FileText, Clock, Award, Brain,
} from 'lucide-react';

const TOTAL_STEPS = 4;
const STEPS = [
  { icon: ShieldCheck, label: 'EARLY ACCESS', title: "You're Early - Welcome to GateNexa", subtitle: "You're among the early learners helping shape GateNexa for GATE 2027." },
  { icon: Rocket, label: 'GATENEXA', title: 'Your GATE 2027 Preparation, Connected', subtitle: 'One workspace for learning, practice, planning, and progress.' },
  { icon: Palette, label: 'PERSONALIZE', title: 'Make GateNexa Work Your Way', subtitle: 'Personalize your workspace, then explore the tools built around your preparation.' },
  { icon: Compass, label: 'GET STARTED', title: 'Explore Your GateNexa Workspace', subtitle: "You don't need to use everything on day one. Start with one goal and explore as you go." },
];

const CTA_LABELS = ['I understand', 'Show me GateNexa', 'Save preferences', 'Start your GATE 2027 preparation'];

const THEMES = [
  { id: 'violet', label: 'Aurora Purple', primary: '#8B5CF6', secondary: '#A855F7', glow: 'rgba(139,92,246,0.4)' },
  { id: 'blue', label: 'Midnight Blue', primary: '#3B82F6', secondary: '#06B6D4', glow: 'rgba(59,130,246,0.4)' },
  { id: 'emerald', label: 'AMOLED Black', primary: '#10B981', secondary: '#34D399', glow: 'rgba(16,185,129,0.4)' },
];

const TIPS = [
  'Your study progress remains yours, even as GateNexa evolves.',
  "Start with one subject - you don't need to use everything at once.",
  'You can change your workspace preferences anytime from Settings.',
  'Use keyboard shortcuts to navigate onboarding quickly.',
];

const EASE_OUT = [0.16, 1, 0.3, 1];

const LogoIcon = memo(function LogoIcon({ size = 42 }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 relative"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 0 24px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <img src="/images/logo.png" alt="" className="object-contain" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
});

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-11 h-[24px] rounded-full shrink-0"
      style={{
        background: value ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : 'rgba(255,255,255,0.08)',
        boxShadow: value ? '0 0 16px rgba(139,92,246,0.4)' : 'none',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`onb-glass relative rounded-3xl border overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
      }} />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function OnboardingFlow() {
  const { completeOnboarding } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [exiting, setExiting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [selectedTheme, setSelectedTheme] = useState('violet');
  const [glassEnabled, setGlassEnabled] = useState(true);
  const [smoothAnimations, setSmoothAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) finish(true);
      if (e.key === 'ArrowRight' && !submitting && step < TOTAL_STEPS - 1) goNext();
      if (e.key === 'ArrowLeft' && !submitting && step > 0) goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const goNext = useCallback(() => {
    setCompletedSteps((prev) => [...new Set([...prev, step])]);
    setDirection(1);
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const finish = useCallback(async (skipped = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/auth/complete-onboarding', { skipped });
    } catch {}
    completeOnboarding({ themeMode: undefined, colorPreset: selectedTheme });
    setExiting(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 600);
  }, [submitting, selectedTheme, navigate, completeOnboarding]);

  const isLast = step === TOTAL_STEPS - 1;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const currentTip = useMemo(() => TIPS[step % TIPS.length], [step]);

  const stepVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="onb-step space-y-4">
            <div className="rounded-2xl border px-4 py-3.5 text-center" style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(139,92,246,0.04))',
              borderColor: 'rgba(34,197,94,0.12)',
            }}>
              <div className="text-[13px] font-bold text-white">GateNexa is in Early Access</div>
              <div className="text-[12px] mt-0.5" style={{ color: '#9498B0' }}>We're testing, refining, and improving the platform with early users before the wider launch.</div>
            </div>

            <GlassCard>
              <div className="p-4 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#5A5F78' }}>What Early Access means</div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22C55E' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Early improvements</div>
                    <div className="text-[12px] leading-relaxed" style={{ color: '#9498B0' }}>See new tools and improvements as GateNexa evolves.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#F59E0B' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Some things may change</div>
                    <div className="text-[12px] leading-relaxed" style={{ color: '#9498B0' }}>Features, layouts, and workflows may be refined based on what we learn.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#A855F7' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Your feedback matters</div>
                    <div className="text-[12px] leading-relaxed" style={{ color: '#9498B0' }}>Your experience helps us improve GateNexa for future GATE aspirants.</div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#5A5F78' }}>What you can expect</div>
                <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: '#C0C4DC' }}>
                  {['GATE 2027-focused preparation tools', 'Continuous product improvements', 'New learning and practice experiences over time', "A place to share feedback while you're early"].map((t) => (
                    <span key={t} className="flex items-start gap-1.5"><Check size={11} className="mt-0.5 shrink-0" style={{ color: '#22C55E' }} /> {t}</span>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="text-[12px] leading-relaxed px-1 text-center font-medium" style={{ color: '#8B8FA8' }}>
              You're not just using GateNexa early - you're helping shape it.
            </div>

            <div className="flex items-center justify-center pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-bold uppercase tracking-wider" style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#22C55E',
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                EARLY ACCESS
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="onb-step space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: BookOpen, label: 'LEARN', desc: 'Study subjects and topics, explore curated resources, notes, formulas and learning material.', color: '#06B6D4' },
                { icon: Target, label: 'PRACTICE', desc: 'Solve PYQs, take mock and weekly tests, and keep track of mistakes.', color: '#A855F7' },
                { icon: Calendar, label: 'PLAN', desc: 'Build daily goals, focus sessions, study routines and revision plans.', color: '#8B5CF6' },
                { icon: BarChart3, label: 'TRACK', desc: 'Understand progress, consistency, performance trends and preparation insights.', color: '#EC4899' },
              ].map((p, i) => (
                <motion.div
                  key={p.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                >
                  <GlassCard>
                    <div className="p-4">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: p.color + '18' }}>
                          <p.icon size={13} style={{ color: p.color }} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.label}</span>
                      </div>
                      <div className="text-[12px] leading-relaxed" style={{ color: '#9CA0B8' }}>{p.desc}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            <GlassCard>
              <div className="p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.12)' }}>
                  <Brain size={13} style={{ color: '#A855F7' }} />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Guided by AI</div>
                  <div className="text-[12px] leading-relaxed mt-0.5" style={{ color: '#9CA0B8' }}>Use GateNexa's AI-powered experiences for study guidance, explanations, planning and recommendations where available.</div>
                </div>
              </div>
            </GlassCard>

            <div className="text-[12px] leading-relaxed px-1 font-medium text-center" style={{ color: '#6D728C' }}>
              Spend less time organizing your preparation and more time actually preparing.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onb-step space-y-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">
                <Palette size={13} /> Theme
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {THEMES.map((t) => {
                  const active = selectedTheme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedTheme(t.id)}
                      className="relative flex flex-col items-center gap-2.5 h-[84px] rounded-2xl border px-2 py-3"
                      style={{
                        borderColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                        background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        boxShadow: active ? '0 0 20px ' + t.glow : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span className="w-7 h-7 rounded-full relative z-10" style={{
                        background: 'linear-gradient(135deg, ' + t.primary + ', ' + t.secondary + ')',
                        boxShadow: active ? '0 0 16px ' + t.glow : '0 0 10px ' + t.glow + '40',
                      }} />
                      <span className="text-[11px] font-semibold text-white/75 relative z-10">{t.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">
                <Zap size={13} /> Visual Effects
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Glass Effects', value: glassEnabled, onChange: setGlassEnabled, icon: Eye, desc: 'Frosted glass panels' },
                  { label: 'Smooth Animations', value: smoothAnimations, onChange: setSmoothAnimations, icon: Activity, desc: 'Fluid transitions' },
                  { label: 'Compact Mode', value: compactMode, onChange: setCompactMode, icon: Layout, desc: 'Denser layout' },
                  { label: 'High Contrast Mode', value: highContrast, onChange: setHighContrast, icon: Zap, desc: 'Enhanced readability' },
                ].map((opt) => (
                  <label
                    key={opt.label}
                    className="group flex items-center justify-between h-[52px] px-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1]"
                    style={{ transition: 'background 0.2s, border-color 0.2s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <opt.icon size={14} className="text-white/40" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-medium text-white/85">{opt.label}</div>
                        <div className="text-[10.5px] text-white/30">{opt.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch value={opt.value} onChange={opt.onChange} />
                  </label>
                ))}
              </div>
            </div>

            <div className="text-[11px] font-medium" style={{ color: '#5A5F78' }}>
              These preferences only affect how GateNexa looks for you and can be changed anytime in Settings.
            </div>

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#5A5F78' }}>Explore after setup</div>
              <div className="space-y-1.5">
                {[
                  { icon: Bot, name: 'AI Coach', desc: 'Ask questions, get study guidance, explanations and preparation help.' },
                  { icon: Sparkles, name: 'Auto Mode', desc: 'Let GateNexa choose the appropriate AI assistance for the question or task.' },
                  { icon: BookOpen, name: 'Learning', desc: 'Explore subjects, topics, resources and focused learning paths.' },
                  { icon: Calendar, name: 'Planner', desc: 'Turn preparation goals into an organized study routine.' },
                  { icon: Compass, name: 'Predictor', desc: 'Explore score, rank and opportunity insights based on your preparation data.' },
                ].map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.03 * i }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/[0.04] bg-white/[0.015]"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <tool.icon size={12} style={{ color: '#A855F7' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold text-white/80">{tool.name}</span>
                      <span className="text-[11px] ml-1.5" style={{ color: '#6D728C' }}>{tool.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="text-[11px] leading-relaxed px-1" style={{ color: '#5A5F78' }}>
              These settings affect your experience and can be changed anytime. Explore the rest of GateNexa at your own pace.
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onb-step space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#5A5F78' }}>Your main tools</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: BookOpen, name: 'Learning Hub', desc: 'Study resources, topics, lectures, notes and learning material.' },
                  { icon: FileText, name: 'PYQ Practice', desc: 'Practice previous-year questions and track mistakes.' },
                  { icon: Target, name: 'Mock Tests', desc: 'Test your preparation and review performance.' },
                  { icon: Clock, name: 'Focus', desc: 'Protect study time with focused sessions.' },
                  { icon: Calendar, name: 'Planner & Revision', desc: 'Organize daily work and keep important topics in rotation.' },
                  { icon: BarChart3, name: 'Analytics', desc: 'Understand progress, consistency and performance.' },
                  { icon: Award, name: 'GateVault', desc: 'Practice, revise and keep learning engaging.' },
                  { icon: Compass, name: 'NEXA Predictor', desc: 'Explore score, rank and opportunity insights.' },
                  { icon: Brain, name: 'AI Coach', desc: "Get guidance when you don't know what to study or what to do next." },
                ].map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.03 * i }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015]"
                  >
                    <tool.icon size={13} className="mt-0.5 shrink-0" style={{ color: '#A855F7' }} />
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-semibold text-white/80">{tool.name}</div>
                      <div className="text-[10.5px] leading-relaxed" style={{ color: '#6D728C' }}>{tool.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <GlassCard>
              <div className="p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#5A5F78' }}>Your first path</div>
                <div className="space-y-0">
                  {[
                    'Choose a subject',
                    'Learn a topic',
                    'Practice PYQs',
                    'Focus on weak areas',
                    'Track your progress',
                  ].map((text, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, delay: 0.04 * i }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{
                          background: 'rgba(139,92,246,0.12)',
                          color: '#A855F7',
                        }}>{String(i + 1).padStart(2, '0')}</div>
                        {i < 4 && <div className="w-px h-3 my-0.5" style={{ background: 'rgba(139,92,246,0.15)' }} />}
                      </div>
                      <div className="text-[12.5px] font-medium text-white/80">{text}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="text-[11px] leading-relaxed px-1" style={{ color: '#6D728C' }}>
              GateNexa is still evolving. More improvements and experiences will be introduced as we learn from early users.
            </div>

            <div className="text-center pt-1">
              <div className="text-[17px] font-bold text-white">You're ready.</div>
              <div className="text-[12px] mt-0.5" style={{ color: '#7A7F98' }}>Start your GATE 2027 preparation.</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="onb-root fixed inset-0 z-[9999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to GateNexa"
    >
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', left: '-12%',
          width: '65vw', height: '65vw',
          maxWidth: 850, maxHeight: 850,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 60%)',
          filter: 'blur(80px)',
          willChange: 'transform, opacity',
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: '-22%', right: '-12%',
          width: '58vw', height: '58vw',
          maxWidth: 750, maxHeight: 750,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.16), transparent 60%)',
          filter: 'blur(70px)',
          willChange: 'transform, opacity',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 45%, transparent 35%, rgba(3,4,13,0.65) 100%)' }} />

      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.04 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{ filter: 'blur(32px)', mixBlendMode: 'soft-light' }}>
          <img src="/images/logo.png" alt="" className="w-[380px] h-auto object-contain" />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!exiting ? (
          <motion.div
            key="onb-main"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="onb-shell relative h-full flex items-center justify-center p-4 md:p-6"
          >
            <div className="onb-grid w-full max-w-[880px] grid md:grid-cols-[1fr,260px] gap-4 max-h-[92vh]">
              <div
                className="onb-panel relative rounded-[28px] border border-white/[0.08] overflow-hidden flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  boxShadow: '0 32px 100px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
                }} />

                <div className="relative px-6 md:px-7 pt-6 md:pt-7 pb-0">
                  <div className="flex items-center gap-3 mb-4">
                    <LogoIcon size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold tracking-tight text-white">
                        <span style={{ color: '#A855F7' }}>Gate</span><span className="text-white">Nexa</span>
                      </div>
                      <div className="text-[10.5px] font-medium text-white/30">GATE 2027 - Your AI-Powered Study Platform</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-white/50">Step {step + 1} of {TOTAL_STEPS}</span>
                      <span className="text-[11px] font-bold" style={{ color: '#8B5CF6' }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full relative"
                        style={{ background: 'linear-gradient(90deg, #8B5CF6, #6366F1, #3B82F6)' }}
                        initial={{ width: 0 }}
                        animate={{ width: progress + '%' }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                      >
                        <div className="absolute inset-0 rounded-full" style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                          animation: 'onb-shimmer 2s infinite',
                        }} />
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-0 mt-2.5">
                      {STEPS.map((s, i) => {
                        const isComplete = completedSteps.includes(i);
                        const isCurrent = i === step;
                        return (
                          <div key={i} className="flex items-center flex-1">
                            <motion.div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative"
                              style={{
                                background: isComplete ? 'rgba(34,197,94,0.15)' : isCurrent ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                                border: isCurrent ? '1.5px solid rgba(139,92,246,0.4)' : '1.5px solid transparent',
                              }}
                              animate={isCurrent ? { boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 14px rgba(139,92,246,0.3)', '0 0 0px rgba(139,92,246,0)'] } : undefined}
                              transition={{ duration: 2.5, repeat: Infinity }}
                            >
                              {isComplete ? (
                                <Check size={12} strokeWidth={3} style={{ color: '#22C55E' }} />
                              ) : (
                                <s.icon size={12} style={{ color: isCurrent ? '#A855F7' : 'rgba(255,255,255,0.2)' }} />
                              )}
                            </motion.div>
                            {i < STEPS.length - 1 && (
                              <div className="flex-1 h-px mx-1.5" style={{
                                background: isComplete ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                transition: 'background 0.3s',
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-0 mt-1.5">
                      {STEPS.map((s, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{
                            color: i === step ? '#A855F7' : completedSteps.includes(i) ? '#22C55E' : 'rgba(255,255,255,0.22)',
                          }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-5">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={step}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.28 }}
                        className="text-[22px] md:text-[28px] font-bold tracking-tight text-white leading-tight"
                      >
                        {STEPS[step].title}
                      </motion.h2>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.28, delay: 0.03 }}
                        className="text-[13px] mt-1.5 font-medium leading-relaxed"
                        style={{ color: '#7A7F98' }}
                      >
                        {STEPS[step].subtitle}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="onb-content flex-1 overflow-y-auto px-6 md:px-7 pb-3" style={{ maxHeight: '48vh' }}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28 }}
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="relative px-6 md:px-7 py-4 border-t border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="flex items-center gap-2.5">
                    {step > 0 ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={goBack}
                        className="h-11 min-h-[44px] px-4 rounded-2xl text-[13px] font-semibold flex items-center gap-1.5 shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        <ArrowLeft size={14} /> Back
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => finish(true)}
                        disabled={submitting}
                        className="h-11 min-h-[44px] px-4 rounded-2xl text-[13px] font-semibold shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        Skip
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -1 }}
                      onClick={isLast ? () => finish(false) : goNext}
                      disabled={submitting}
                      className="flex-1 h-11 min-h-[44px] rounded-2xl px-5 text-[13px] font-semibold flex items-center justify-center gap-2 text-white relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)',
                        boxShadow: '0 6px 24px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                      }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
                      }} />
                      <span className="relative z-10 flex items-center gap-2">
                        {CTA_LABELS[step]} <ArrowRight size={14} />
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="onb-sidebar hidden md:flex flex-col gap-3">
                <div
                  className="rounded-[20px] border border-white/[0.07] overflow-hidden relative"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    backdropFilter: 'blur(28px)',
                  }}
                >
                  <div className="relative p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2">Quick tip</div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={step}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[12px] leading-relaxed"
                        style={{ color: '#7A7F98' }}
                      >
                        {currentTip}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="rounded-[16px] border border-white/[0.05] p-3 text-center" style={{ background: 'rgba(255,255,255,0.015)' }}>
                  <div className="text-[10px] text-white/20">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">Left</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">Right</kbd> to navigate
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center h-full"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <img src="/images/logo.png" alt="" className="w-7 h-7 object-contain" />
              </motion.div>
              <p className="text-[13px] font-medium text-white/45">Launching GateNexa\u2026</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes onb-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .onb-content::-webkit-scrollbar { width: 4px; }
        .onb-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        @media (max-width: 768px) {
          .onb-grid { grid-template-columns: 1fr !important; max-width: 100% !important; }
          .onb-sidebar { display: none !important; }
          .onb-panel { border-radius: 20px !important; }
          .onb-content { max-height: calc(100vh - 320px) !important; }
        }
      `}</style>
    </div>
  );
}


