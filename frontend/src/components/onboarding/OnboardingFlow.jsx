import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Rocket, Palette, Compass, PartyPopper, Check,
  ArrowRight, ArrowLeft, Eye, Zap, Layout, Activity,
  BookOpen, Bot, Calendar, BarChart3, Target,
  ShieldCheck, Sparkles,
} from 'lucide-react';

const TOTAL_STEPS = 4;
const STEPS = [
  { icon: ShieldCheck, label: 'EARLY ACCESS', title: "You're Early \u2014 Welcome to GateNexa", subtitle: "You\u2019re among the early learners helping shape GateNexa for GATE 2027." },
  { icon: Rocket, label: 'GATENEXA', title: 'Your GATE 2027 Preparation, Connected', subtitle: 'Learn, practice, plan, and track your preparation from one workspace.' },
  { icon: Palette, label: 'PERSONALIZE', title: 'Make GateNexa Work Your Way', subtitle: 'Set up your workspace now, then discover the tools that fit your preparation.' },
  { icon: Compass, label: 'GET STARTED', title: 'Start Your GATE 2027 Journey', subtitle: "You don\u2019t need to learn the whole platform today. Start with one useful step." },
];

const CTA_LABELS = ['I understand', 'Show me GateNexa', 'Save preferences', 'Start preparing'];

const THEMES = [
  { id: 'violet', label: 'Aurora Purple', primary: '#8B5CF6', secondary: '#A855F7', glow: 'rgba(139,92,246,0.4)' },
  { id: 'blue', label: 'Midnight Blue', primary: '#3B82F6', secondary: '#06B6D4', glow: 'rgba(59,130,246,0.4)' },
  { id: 'emerald', label: 'AMOLED Black', primary: '#10B981', secondary: '#34D399', glow: 'rgba(16,185,129,0.4)' },
];

const PILLARS = [
  { icon: BookOpen, label: 'LEARN', heading: 'Build your understanding', desc: 'Resources, notes, topics, formulas and curated learning material.', color: '#06B6D4' },
  { icon: Target, label: 'PRACTICE', heading: 'Turn knowledge into performance', desc: 'PYQs, mock tests, weekly tests and mistake tracking.', color: '#A855F7' },
  { icon: Calendar, label: 'PLAN', heading: 'Know what to do next', desc: 'Daily goals, focus sessions, study planning and revision.', color: '#8B5CF6' },
  { icon: BarChart3, label: 'TRACK', heading: 'See your preparation grow', desc: 'Progress, consistency, performance insights and prediction tools.', color: '#EC4899' },
];

const EXPLORE_TOOLS = [
  { icon: Bot, name: 'AI Coach', desc: 'Ask for guidance' },
  { icon: BookOpen, name: 'Learning Hub', desc: 'Find study material' },
  { icon: Target, name: 'PYQs', desc: 'Practice real questions' },
  { icon: Sparkles, name: 'Mock Tests', desc: 'Test your preparation' },
  { icon: Zap, name: 'Focus', desc: 'Protect your study time' },
  { icon: BarChart3, name: 'Analytics', desc: 'Understand your progress' },
  { icon: ShieldCheck, name: 'GateVault', desc: 'Keep revision engaging' },
  { icon: Compass, name: 'Predictor', desc: 'Explore your current estimate' },
];

const TIPS = [
  'Your study progress remains yours, even as GateNexa evolves.',
  'You can customize your dashboard anytime from Settings.',
  'Start with one subject \u2014 you don\u2019t need to use everything at once.',
  'Use keyboard shortcuts \u2190 \u2192 to navigate onboarding faster.',
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
      className={`relative rounded-3xl border overflow-hidden ${className}`}
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
          <div className="space-y-4">
            {/* Early access hero */}
            <div className="rounded-2xl border p-4 text-center" style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(139,92,246,0.04))',
              borderColor: 'rgba(34,197,94,0.12)',
            }}>
              <div className="text-[14px] font-bold text-white mb-1">GateNexa is in Early Access</div>
              <div className="text-[12px]" style={{ color: '#9498B0' }}>We\u2019re testing, refining, and improving the experience with real learners before the wider launch.</div>
            </div>

            {/* Three compact points */}
            <GlassCard>
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22C55E' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Early access</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: '#9498B0' }}>See improvements as GateNexa evolves.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#F59E0B' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Things may change</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: '#9498B0' }}>Some features, layouts, and workflows may be refined along the way.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#A855F7' }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Your feedback matters</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: '#9498B0' }}>Your experience helps us build a better preparation platform.</div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Trust line */}
            <div className="text-[11.5px] leading-relaxed px-1" style={{ color: '#6D728C' }}>
              Your study progress remains yours. Product improvements may change the experience, but they shouldn\u2019t change the purpose: helping you prepare better.
            </div>

            {/* Bottom statement + badge */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[13px] font-semibold text-white/70">Thanks for being here early.</div>
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
          <div className="space-y-5">
            {/* Four pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.06 * i }}
                >
                  <GlassCard>
                    <div className="p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${p.color}15` }}>
                          <p.icon size={15} style={{ color: p.color }} />
                        </div>
                        <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.label}</div>
                      </div>
                      <div className="text-[13px] font-semibold text-white mb-1">{p.heading}</div>
                      <div className="text-[11.5px] leading-relaxed" style={{ color: '#8085A0' }}>{p.desc}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Closing line */}
            <div className="text-[12px] leading-relaxed px-1" style={{ color: '#6D728C' }}>
              You don\u2019t have to use everything at once. Start with what you need today.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3.5">
                <Palette size={13} /> Theme
              </div>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((t) => {
                  const active = selectedTheme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedTheme(t.id)}
                      className="relative flex flex-col items-center gap-3 h-[88px] rounded-2xl border px-2 py-3.5"
                      style={{
                        borderColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                        background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        boxShadow: active ? `0 0 28px ${t.glow}` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span className="w-7 h-7 rounded-full relative z-10" style={{
                        background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                        boxShadow: active ? `0 0 24px ${t.glow}` : `0 0 12px ${t.glow}40`,
                      }} />
                      <span className="text-[11px] font-semibold text-white/75 relative z-10">{t.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Visual effects */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3.5">
                <Zap size={13} /> Visual Effects
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Glass Effects', value: glassEnabled, onChange: setGlassEnabled, icon: Eye, desc: 'Frosted glass panels' },
                  { label: 'Smooth Animations', value: smoothAnimations, onChange: setSmoothAnimations, icon: Activity, desc: 'Fluid transitions' },
                  { label: 'Compact Mode', value: compactMode, onChange: setCompactMode, icon: Layout, desc: 'Denser layout' },
                  { label: 'High Contrast Mode', value: highContrast, onChange: setHighContrast, icon: Zap, desc: 'Enhanced readability' },
                ].map((opt) => (
                  <label
                    key={opt.label}
                    className="group flex items-center justify-between h-[56px] px-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1]"
                    style={{ transition: 'background 0.2s, border-color 0.2s' }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <opt.icon size={16} className="text-white/40" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-white/85">{opt.label}</div>
                        <div className="text-[10.5px] text-white/30 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch value={opt.value} onChange={opt.onChange} />
                  </label>
                ))}
              </div>
            </div>

            <p className="text-[11px] font-medium" style={{ color: '#5A5F78' }}>
              These preferences only affect how GateNexa looks for you and can be changed anytime in Settings.
            </p>

            {/* Explore after setup */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#5A5F78' }}>Explore after setup</div>
              <div className="space-y-2">
                {[
                  { icon: Bot, name: 'AI Coach', action: 'Ask', desc: 'Ask GateNexa for guidance, explanations and study help.' },
                  { icon: Sparkles, name: 'Auto Mode', action: 'Let', desc: 'Let GateNexa choose appropriate assistance for the current question.' },
                  { icon: BookOpen, name: 'Learning', action: 'Explore', desc: 'Explore subjects, topics, resources and focused study paths.' },
                  { icon: Calendar, name: 'Planner', action: 'Turn', desc: 'Turn goals into a practical study routine.' },
                  { icon: Compass, name: 'Predictor', action: 'Explore', desc: 'Explore score, rank and opportunity insights.' },
                ].map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015]"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <tool.icon size={13} style={{ color: '#A855F7' }} />
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
              These tools work together, but you stay in control of what you use.
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            {/* Journey flow */}
            <GlassCard>
              <div className="p-5">
                <div className="space-y-0">
                  {[
                    { num: '01', text: 'Choose a subject' },
                    { num: '02', text: 'Learn a topic' },
                    { num: '03', text: 'Practice PYQs' },
                    { num: '04', text: 'Focus on what matters' },
                    { num: '05', text: 'Track your progress' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.num}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.06 * i }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                          background: 'rgba(139,92,246,0.12)',
                          color: '#A855F7',
                        }}>{item.num}</div>
                        {i < 4 && <div className="w-[1px] h-4 my-0.5" style={{ background: 'rgba(139,92,246,0.15)' }} />}
                      </div>
                      <div className="text-[12.5px] font-medium text-white/80 pb-0.5">{item.text}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Explore GateNexa */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#5A5F78' }}>Explore GateNexa</div>
              <div className="grid grid-cols-2 gap-2">
                {EXPLORE_TOOLS.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015]"
                  >
                    <tool.icon size={13} style={{ color: '#A855F7' }} />
                    <div>
                      <div className="text-[11.5px] font-semibold text-white/80">{tool.name}</div>
                      <div className="text-[10px]" style={{ color: '#6D728C' }}>{tool.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Early access note */}
            <div className="text-[11px] leading-relaxed px-1" style={{ color: '#6D728C' }}>
              GateNexa is still evolving. More improvements will be introduced as we learn from early users.
            </div>

            {/* Final */}
            <div className="text-center pt-2">
              <div className="text-[18px] font-bold text-white mb-1">You\u2019re ready.</div>
              <div className="text-[12px]" style={{ color: '#7A7F98' }}>Continue to GateNexa</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to GateNexa"
    >
      {/* Cinematic ambient lighting */}
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

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 45%, transparent 35%, rgba(3,4,13,0.65) 100%)' }} />

      {/* Watermark */}
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
            className="relative h-full flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-[1080px] grid md:grid-cols-[1fr,280px] gap-5 max-h-[90vh]">
              {/* Main card */}
              <div
                className="relative rounded-[28px] border border-white/[0.08] overflow-hidden flex flex-col"
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

                {/* Header */}
                <div className="relative px-7 md:px-8 pt-7 md:pt-8 pb-0">
                  <div className="flex items-center gap-3.5 mb-5">
                    <LogoIcon size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-bold tracking-tight text-white">
                        <span style={{ color: '#A855F7' }}>Gate</span><span className="text-white">Nexa</span>
                      </div>
                      <div className="text-[10.5px] font-medium text-white/30">GATE 2027 \u2022 Your AI-Powered Study Platform</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-white/50">Step {step + 1} of {TOTAL_STEPS}</span>
                      <span className="text-[11px] font-bold" style={{ color: '#8B5CF6' }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full relative"
                        style={{ background: 'linear-gradient(90deg, #8B5CF6, #6366F1, #3B82F6)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                      >
                        <div className="absolute inset-0 rounded-full" style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                          animation: 'shimmer 2s infinite',
                        }} />
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-0 mt-3">
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
                              <div className="flex-1 h-[1.5px] mx-1.5" style={{
                                background: isComplete ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                transition: 'background 0.3s',
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Step labels */}
                    <div className="flex items-center gap-0 mt-2">
                      {STEPS.map((s, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{
                            color: i === step ? '#A855F7' : completedSteps.includes(i) ? '#22C55E' : 'rgba(255,255,255,0.2)',
                          }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-6">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={step}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="text-[26px] md:text-[32px] font-bold tracking-tight text-white leading-tight"
                      >
                        {STEPS[step].title}
                      </motion.h2>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3, delay: 0.03 }}
                        className="text-[13.5px] mt-2.5 font-medium"
                        style={{ color: '#7A7F98' }}
                      >
                        {STEPS[step].subtitle}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-7 md:px-8 pb-3 overscroll-behavior-contain" style={{ maxHeight: '42vh' }}>
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

                {/* Footer */}
                <div className="relative px-7 md:px-8 py-5 border-t border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="flex items-center gap-3">
                    {step > 0 ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={goBack}
                        className="h-12 min-h-[44px] px-5 rounded-2xl text-[13px] font-semibold flex items-center gap-2"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                          transition: 'background 0.2s',
                        }}
                      >
                        <ArrowLeft size={15} /> Back
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => finish(true)}
                        disabled={submitting}
                        className="h-12 min-h-[44px] px-5 rounded-2xl text-[13px] font-semibold flex items-center gap-2"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                          transition: 'background 0.2s',
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
                      className="flex-1 h-12 min-h-[44px] rounded-2xl px-6 text-[13px] font-semibold flex items-center justify-center gap-2 text-white relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)',
                        boxShadow: '0 6px 24px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                      }}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
                      }} />
                      <span className="relative z-10 flex items-center gap-2">
                        {isLast ? <><Rocket size={15} /> {CTA_LABELS[step]}</> : <>{CTA_LABELS[step]} <ArrowRight size={15} /></>}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Sidebar (desktop only) */}
              <div className="hidden md:flex flex-col gap-4">
                <div
                  className="rounded-[24px] border border-white/[0.07] overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    backdropFilter: 'blur(28px)',
                  }}
                >
                  <div className="absolute inset-0 rounded-[24px] pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
                  }} />
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

                <div className="rounded-[20px] border border-white/[0.05] p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.015)' }}>
                  <div className="text-[10px] text-white/20">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">\u2190</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">\u2192</kbd> to navigate
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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
