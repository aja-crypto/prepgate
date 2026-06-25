// First-time user onboarding — theme selection & welcome
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BRAND, COLOR_PRESETS } from '../../design/tokens';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

const STEPS = [
  { id: 'welcome', title: 'Welcome to GateApex' },
  { id: 'theme', title: 'Choose your theme' },
  { id: 'colors', title: 'Pick your accent' },
  { id: 'ready', title: 'You\'re all set' },
];

export default function OnboardingFlow() {
  const { completeOnboarding, themeMode, setThemeMode, colorPreset, setColorPreset } = useTheme();
  const [step, setStep] = useState(0);
  const [localMode, setLocalMode] = useState(themeMode);
  const [localPreset, setLocalPreset] = useState(colorPreset);

  const applyMode = (mode) => {
    setLocalMode(mode);
    setThemeMode(mode);
  };

  const applyPreset = (id) => {
    setLocalPreset(id);
    setColorPreset(id);
  };

  const finish = () => {
    completeOnboarding({ themeMode: localMode, colorPreset: localPreset });
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 mesh-bg">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" />
      <GlassCard className="relative w-full max-w-lg animate-scale-in" padding="p-0" hover={false}>
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-8">
            <Icon name="logo" className="w-10 h-10" />
            <div>
              <div className="font-bold text-text tracking-tight" style={{ fontSize: '20px', lineHeight: '1.1' }}>GateApex</div>
              <div style={{ color: '#A855F7', fontSize: '10px', fontWeight: 600, letterSpacing: '1px' }}>GATE 2027</div>
            </div>
          </div>

          <div className="flex gap-1.5 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>

          {current.id === 'welcome' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-text tracking-tight mb-2">Your GATE Preparation Hub</h2>
              <p className="text-sm text-text2 leading-relaxed mb-6">
                GateApex is a premium preparation platform for GATE 2027. Track progress, analyze trends, and stay exam-ready — built for focus, not distraction.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '0% start', desc: 'Clean slate' },
                  { label: 'Cloud sync', desc: 'Any device' },
                  { label: 'Live data', desc: 'GATE updates' },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl bg-bg-2/60 border border-border p-3 text-center">
                    <div className="text-xs font-semibold text-primary">{f.label}</div>
                    <div className="text-[10px] text-text3 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.id === 'theme' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-2">Appearance</h2>
              <p className="text-sm text-text2 mb-5">Choose how GateApex looks. You can change this anytime in Settings.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark', preview: 'bg-[#0F172A] border-primary/30' },
                  { id: 'light', label: 'Light', preview: 'bg-[#F8FAFC] border-primary/30' },
                  { id: 'system', label: 'System', preview: 'bg-gradient-to-br from-[#0F172A] to-[#F8FAFC] border-primary/30' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyMode(t.id)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${localMode === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
                  >
                    <div className={`w-full h-12 rounded-lg mb-2 border ${t.preview}`} />
                    <span className="text-xs font-medium text-text">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === 'colors' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text mb-2">Accent palette</h2>
              <p className="text-sm text-text2 mb-5">Make it yours with a custom accent color scheme.</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(COLOR_PRESETS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${localPreset === p.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
                  >
                    <div className="flex -space-x-1">
                      <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: p.primary }} />
                      <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: p.secondary }} />
                      <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: p.accent }} />
                    </div>
                    <span className="text-xs font-medium text-text">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {current.id === 'ready' && (
            <div className="animate-fade-in text-center py-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center stat-glow glass-card">
                <Icon name="logo" className="scale-150" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Ready to prepare</h2>
              <p className="text-sm text-text2">Your dashboard starts at 0%. Every milestone you hit is earned.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-border bg-bg-2/40 rounded-b-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`text-sm text-text3 hover:text-text transition-colors ${step === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>
            <button
              onClick={finish}
              className="text-xs text-text4 hover:text-text3 transition-colors underline underline-offset-2"
            >
              Skip
            </button>
          </div>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Continue
            </button>
          ) : (
            <button onClick={finish} className="btn-primary">
              Launch Dashboard
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

