import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Rocket, Palette, Compass, PartyPopper, Check,
  ArrowRight, ArrowLeft, Eye, Zap, Layout, Activity,
  BookOpen, Bot, Calendar, BarChart3, FileText, Brain,
  ShieldCheck, Sparkles, Target, Gift, Crown,
  Clock, Monitor,
} from 'lucide-react';

const TOTAL_STEPS = 4;
const STEPS = [
  { icon: Rocket, label: 'Welcome', title: 'Welcome to GateNexa', subtitle: 'One intelligent workspace for your complete GATE preparation.' },
  { icon: Palette, label: 'Personalize', title: 'Personalize Your Experience', subtitle: 'Customize how GateNexa looks and feels.' },
  { icon: Compass, label: 'Discover', title: 'Discover Your Workspace', subtitle: 'Everything you need, connected in one place.' },
  { icon: PartyPopper, label: 'Launch', title: 'Welcome to GateNexa Early Access', subtitle: 'Thank you for being one of our early users.' },
];

const THEMES = [
  { id: 'violet', label: 'Aurora Purple', primary: '#8B5CF6', secondary: '#A855F7', glow: 'rgba(139,92,246,0.4)' },
  { id: 'blue', label: 'Midnight Blue', primary: '#3B82F6', secondary: '#06B6D4', glow: 'rgba(59,130,246,0.4)' },
  { id: 'emerald', label: 'AMOLED Black', primary: '#10B981', secondary: '#34D399', glow: 'rgba(16,185,129,0.4)' },
];

const FEATURES = [
  { icon: BookOpen, title: 'Learning Hub', desc: 'Curated lectures, roadmaps, PYQs, formula sheets, subject-wise resources, and smart recommendations.', tint: 'rgba(6,182,212,0.12)', color: '#06B6D4' },
  { icon: Bot, title: 'AI Mentor', desc: 'Personalized study guidance, daily planning, doubt solving, mock analysis, revision recommendations, and learning insights.', tint: 'rgba(168,85,247,0.14)', color: '#A855F7' },
  { icon: Calendar, title: 'Smart Planner', desc: 'Automatic study schedules, daily targets, focus sessions, revision planner, and progress tracking.', tint: 'rgba(139,92,246,0.13)', color: '#8B5CF6' },
  { icon: BarChart3, title: 'Analytics', desc: 'Study insights, topic completion, performance trends, weekly reports, and consistency tracking.', tint: 'rgba(236,72,153,0.10)', color: '#EC4899' },
  { icon: Target, title: 'NEXA Predictor', desc: 'AIR prediction, score estimation, college opportunities, and previous year comparisons.', tint: 'rgba(34,211,238,0.10)', color: '#22D3EE' },
  { icon: FileText, title: 'Reports', desc: 'Premium PDF reports, Excel exports, personalized analytics, and study summaries.', tint: 'rgba(168,85,247,0.12)', color: '#A855F7' },
];

const HIGHLIGHTS = [
  { icon: Sparkles, label: 'AI-powered guidance' },
  { icon: BookOpen, label: 'Curated Learning Hub' },
  { icon: BarChart3, label: 'Smart Analytics' },
  { icon: Target, label: 'Personalized Recommendations' },
  { icon: Brain, label: 'Built for GATE Aspirants' },
];

const COMING_SOON = [
  'Full Mock Test Platform', 'Community Discussions', 'Marketplace',
  'Study Groups', 'AI Interview Coach', 'Placement Hub',
  'Desktop Companion', 'Offline Sync',
];

const TIPS = [
  'Everything syncs automatically across supported devices.',
  'You can customize your dashboard anytime from Settings.',
  'Your AI Mentor learns from your activity to improve recommendations.',
  'Use keyboard shortcuts to navigate faster.',
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
      className={`relative rounded-3xl border border-white/[0.07] overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(20px)',
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
  const previewTheme = useMemo(() => THEMES.find((t) => t.id === selectedTheme) || THEMES[0], [selectedTheme]);
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
          <div className="space-y-6">
            <p className="text-[15px] leading-[1.8]" style={{ color: '#C0C4DC', maxWidth: '52ch' }}>
              GateNexa brings together everything you need in one place—from AI-powered learning and personalized study planning to analytics, reports, predictors, and curated learning resources.
            </p>
            <p className="text-[14px] leading-[1.75]" style={{ color: '#9498B0', maxWidth: '52ch' }}>
              No more switching between multiple apps. Everything is connected inside one intelligent ecosystem designed to keep you focused on learning.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={h.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.06 * i }}
                  className="group flex items-center gap-3.5 h-[52px] px-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] cursor-default"
                  style={{ transition: 'background 0.2s, border-color 0.2s' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <h.icon size={15} style={{ color: '#A855F7' }} />
                  </div>
                  <span className="text-[13px] font-medium text-white/80">{h.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-2.5 text-[12px] font-medium pt-1" style={{ color: '#6D728C' }}>
              <ShieldCheck size={15} style={{ color: '#22C55E' }} />
              Setup takes less than 20 seconds.
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-7">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 * i }}
                >
                  <GlassCard>
                    <div className="p-5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3.5" style={{
                        background: f.tint,
                        boxShadow: `0 0 20px ${f.color}15`,
                      }}>
                        <f.icon size={18} style={{ color: f.color }} />
                      </div>
                      <div className="text-[13.5px] font-semibold text-white mb-1.5">{f.title}</div>
                      <div className="text-[12px] leading-[1.6]" style={{ color: '#8085A0' }}>{f.desc}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Premium card */}
            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))' }}>
                    <Crown size={16} style={{ color: '#F59E0B' }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white">Unlock Premium</div>
                    <div className="text-[10.5px] text-white/30">Take your preparation even further</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]" style={{ color: '#B0B4CC' }}>
                  {['Unlimited AI Mentor', 'Advanced Analytics', 'Premium Reports', 'Excel Export', 'Cloud Backup', 'Exclusive Resources', 'Early Feature Access', 'Priority Support'].map((f) => (
                    <span key={f} className="flex items-center gap-1.5"><Check size={10} style={{ color: '#22C55E' }} /> {f}</span>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Referral card */}
            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <Gift size={16} style={{ color: '#22C55E' }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white">Refer Friends, Unlock Premium</div>
                    <div className="text-[10.5px] text-white/30">Earn rewards without purchasing</div>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: '#8085A0' }}>
                  Invite your friends to GateNexa. Earn referral rewards that unlock Premium features directly from your dashboard.
                </p>
              </div>
            </GlassCard>

            {/* Coming Soon */}
            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[13px] font-bold text-white mb-3">
                  <Clock size={14} style={{ color: '#06B6D4' }} /> Coming Soon
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMING_SOON.map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-lg text-[10.5px] font-medium border" style={{
                      background: 'rgba(6,182,212,0.06)',
                      borderColor: 'rgba(6,182,212,0.12)',
                      color: '#9498B0',
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border p-4 text-center" style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))',
              borderColor: 'rgba(139,92,246,0.15)',
            }}>
              <div className="text-[14px] font-bold text-white mb-1">🧪 Early Access Beta</div>
              <div className="text-[12px]" style={{ color: '#9498B0' }}>GateNexa is currently available only to selected early-access users.</div>
              <div className="text-[11px] mt-1" style={{ color: '#6D728C' }}>You're helping shape the platform before the public launch.</div>
            </div>

            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-white mb-3">
                  <Sparkles size={15} style={{ color: '#F59E0B' }} /> During Beta
                </div>
                <ul className="space-y-2 text-[12px] leading-relaxed" style={{ color: '#C0C4DC' }}>
                  {['Frequent feature updates', 'UI improvements', 'Performance optimization', 'Bug fixes', 'New AI capabilities', 'New learning resources'].map((item) => (
                    <li key={item} className="flex items-start gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#8B5CF6' }} /> {item}</li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-white mb-3">
                  <Gift size={15} style={{ color: '#22C55E' }} /> Your Feedback Matters
                </div>
                <p className="text-[12px] leading-relaxed mb-2" style={{ color: '#B0B4CC' }}>
                  Every suggestion helps us:
                </p>
                <ul className="space-y-1.5 text-[11.5px] leading-relaxed" style={{ color: '#9498B0' }}>
                  {['Improve the experience', 'Fix bugs faster', 'Prioritize new features', 'Build a better platform for everyone'].map((item) => (
                    <li key={item} className="flex items-start gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22C55E' }} /> {item}</li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-white mb-3">
                  <ShieldCheck size={15} style={{ color: '#06B6D4' }} /> Data Notice
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: '#B0B4CC' }}>
                  This platform is actively evolving. Some features and datasets may change during development. For important study notes or reports, we recommend keeping personal backups while we continue improving stability.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-5">
                <div className="flex items-center gap-2.5 text-[13px] font-bold text-white mb-3">
                  <Monitor size={15} style={{ color: '#A855F7' }} /> 💻 Best Experience
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#B0B4CC' }}>
                  For the smoothest experience, we recommend using GateNexa on a desktop or laptop with Google Chrome or Microsoft Edge.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: '#9498B0' }}>
                  {['Larger workspace', 'Better dashboards', 'Faster navigation', 'Improved multitasking', 'Better AI interaction', 'Rich analytics'].map((item) => (
                    <span key={item} className="flex items-center gap-1.5"><Check size={10} style={{ color: '#A855F7' }} /> {item}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
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
                      <div className="text-[10.5px] font-medium text-white/30">GATE 2027 • Early Access</div>
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
                        {isLast ? <><Rocket size={15} /> Launch GateNexa</> : <>Continue <ArrowRight size={15} /></>}
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
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[9px]">→</kbd> to navigate
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
              <p className="text-[13px] font-medium text-white/45">Launching GateNexa…</p>
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
