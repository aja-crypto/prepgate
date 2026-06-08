// Empty dashboard — premium welcome for new users
import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

export default function EmptyDashboard({ userName }) {
  const steps = [
    { icon: 'topics', title: 'Track topics', desc: 'Mark syllabus topics as you complete them', path: '/topics', label: 'Open Topics' },
    { icon: 'pyq', title: 'Solve PYQs', desc: 'Log previous year question practice', path: '/pyq', label: 'Browse PYQs' },
    { icon: 'mocks', title: 'Mock tests', desc: 'Record scores and track rank trends', path: '/mocks', label: 'Add Mock' },
    { icon: 'productivity', title: 'Log hours', desc: 'Build your daily study streak', path: '/productivity', label: 'Start logging' },
  ];

  return (
    <GlassCard className="col-span-full overflow-hidden" glow padding="p-0">
      <div className="p-8 md:p-10 relative">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'var(--color-primary)' }} />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">Getting started</p>
          <h2 className="text-2xl md:text-3xl font-bold text-text tracking-tight mb-2">
            {userName ? `Welcome, ${userName}` : 'Welcome aboard'}
          </h2>
          <p className="text-sm text-text2 max-w-lg leading-relaxed mb-8">
            Your workspace starts at <span className="text-primary font-semibold">0% progress</span>.
            Every milestone here is earned — track topics, PYQs, mocks, and study hours as you prepare for GATE 2027.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((s) => (
              <Link
                key={s.title}
                to={s.path}
                className="group rounded-xl border border-border bg-bg-2/50 backdrop-blur-sm p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                  <Icon name={s.icon} />
                </div>
                <div className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{s.title}</div>
                <div className="text-[11px] text-text3 mt-1 mb-3 leading-relaxed">{s.desc}</div>
                <span className="text-[10px] font-medium text-primary">{s.label} →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
