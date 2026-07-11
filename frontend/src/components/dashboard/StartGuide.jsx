import { memo } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    icon: '\uD83C\uDFAF',
    title: 'Know Your Current Level',
    subtitle: 'Take a quick AI assessment. Find your strengths and weak areas.',
    cta: 'Start Assessment \u2192',
    to: '/mentor',
  },
  {
    icon: '\uD83D\uDCDA',
    title: 'Pick ONE Subject',
    subtitle: "Don't study everything at once. Complete one subject fully before moving to the next.",
    flow: ['Theory', 'Notes', 'Short Notes', 'PYQs', 'Weekly Test'],
    cta: 'Choose Subject \u2192',
    to: '/subjects',
  },
  {
    icon: '\uD83D\uDCD6',
    title: 'Study Daily',
    subtitle: 'Build consistency. Small daily efforts beat occasional long sessions.',
    bullet: ['Learn Concepts', 'Revise Notes', 'Solve PYQs', 'Take Practice Tests'],
  },
  {
    icon: '\uD83D\uDCDD',
    title: 'Practice',
    subtitle: 'Practice every topic immediately after learning it.',
    bullet: ['PYQs', 'Topic Tests', 'Weekly Tests', 'Mistake Notebook'],
    cta: 'Practice Now \u2192',
    to: '/pyq',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Analyze Yourself',
    subtitle: 'Track accuracy, weak topics, progress, study time, and completion %.',
    cta: 'View Analytics \u2192',
    to: '/analytics',
  },
  {
    icon: '\uD83D\uDD04',
    title: 'Revise Smartly',
    subtitle: 'Use short notes, formula sheets, mistake notebook, and AI revision planner.',
    cta: 'Open Revision \u2192',
    to: '/revision',
  },
  {
    icon: '\uD83E\uDD16',
    title: 'Ask GateNexa AI',
    subtitle: 'Whenever confused, ask AI. Generate plans, understand concepts, predict AIR.',
    cta: 'Open GateNexa AI \u2192',
    to: '/GateNexa-ai',
  },
  {
    icon: '\uD83C\uDFC6',
    title: 'Crack GATE',
    subtitle: 'Complete your roadmap. Revise. Attempt mock tests. Stay consistent.',
  },
];

const QUICK_ACTIONS = [
  { icon: '\uD83C\uDFAF', label: "I Don't Know What To Study", desc: 'Opens AI Study Planner', to: '/planner' },
  { icon: '\uD83D\uDCC5', label: 'Create My Study Plan', desc: 'Generate Personalized Roadmap', to: '/roadmap' },
  { icon: '\uD83D\uDCDA', label: 'Start My First Subject', desc: 'Open Recommended Subject', to: '/subjects' },
  { icon: '\uD83E\uDD16', label: 'Ask GateNexa AI', desc: 'Open AI Assistant', to: '/GateNexa-ai' },
];

const StepCard = memo(function StepCard({ step, idx }) {
  return (
    <div
      className="relative group opacity-0 animate-fade-in"
      style={{
        animationDelay: `${idx * 120}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="glass-card p-5 h-full transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.04] pointer-events-none"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
        />
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))',
              boxShadow: '0 0 12px rgba(139,92,246,0.15)',
            }}
          >
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)' }}
              >
                Step {idx + 1}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text">{step.title}</h3>
          </div>
        </div>

        <p className="text-xs text-text2 leading-relaxed mb-3">{step.subtitle}</p>

        {step.flow && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {step.flow.map((f, i) => (
              <span key={f} className="flex items-center gap-0.5 text-[10px] text-text3">
                {i > 0 && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-primary/40 shrink-0 mx-0.5">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {f}
              </span>
            ))}
          </div>
        )}

        {step.bullet && (
          <div className="space-y-1 mb-3">
            {step.bullet.map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs text-text2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-primary)' }} />
                {b}
              </div>
            ))}
          </div>
        )}

        {step.cta && step.to && (
          <Link
            to={step.to}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
              color: 'white',
              boxShadow: '0 0 10px rgba(139,92,246,0.25)',
            }}
          >
            {step.cta}
          </Link>
        )}
      </div>
    </div>
  );
});

export default function StartGuide({ isEmptyProgress }) {
  return (
    <div className="mb-4">
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.2))',
              boxShadow: '0 0 16px rgba(139,92,246,0.2)',
            }}
          >
            {'\uD83D\uDE80'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">{"Don't Know Where to Start?"}</h2>
            <p className="text-xs text-text2/80">
              No worries. GateNexa AI will guide you from Day 1 until your GATE exam.
            </p>
          </div>
        </div>

        <div
          className="mt-3 mb-6 rounded-xl border px-4 py-2.5 text-xs flex items-center gap-2.5"
          style={{
            borderColor: 'rgba(139,92,246,0.2)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))',
          }}
        >
          <span className="text-base">{isEmptyProgress ? '\uD83D\uDC4B' : '\uD83D\uDE80'}</span>
          <span className="text-text2">
            {isEmptyProgress
              ? "Welcome! Let's build your first study plan."
              : 'Continue your preparation from where you left off.'}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STEPS.map((step, idx) => (
          <StepCard key={idx} step={step} idx={idx} />
        ))}
      </div>

      <div
        className="mt-4 rounded-2xl border p-4 opacity-0 animate-fade-in relative overflow-hidden"
        style={{
          borderColor: 'rgba(251,191,36,0.25)',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',
          boxShadow: '0 0 20px rgba(251,191,36,0.08)',
          animationDelay: '1000ms',
          animationFillMode: 'forwards',
        }}
      >
        <div
          className="absolute top-0 left-0 w-32 h-32 rounded-br-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.1), transparent)' }}
        />
        <div className="flex items-start gap-3 relative">
          <span className="text-2xl shrink-0">{'\uD83D\uDCA1'}</span>
          <div>
            <h3 className="text-sm font-bold text-amber-300 mb-1">Remember</h3>
            <p className="text-xs text-text2/80 leading-relaxed">
              You don't need to study everything today.
              <br />
              Just complete today's task.
              <br />
              <span className="text-amber-300/80 font-medium">
                Small progress every day leads to a great GATE rank.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-4 opacity-0 animate-fade-in"
        style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-bold text-text">Quick Actions</h3>
          <span className="text-[10px] text-text3">Get started instantly</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={action.label}
              to={action.to}
              className="glass-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 group active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-lg">{action.icon}</span>
                <div className="text-xs font-bold text-text leading-tight">{action.label}</div>
              </div>
              <div className="text-[10px] text-text3">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
