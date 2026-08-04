// Smart study recommendations — derived from real progress data
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { generateRecommendations } from '../../utils/gateUtils';
import { recIcon } from '../../utils/subjectIcons';
import { ArrowRight, Sparkles } from 'lucide-react';

const PRIORITY_STYLE = {
  high: {
    card: 'border-red-500/20 bg-red-500/[0.04]',
    bar: 'from-red-500 to-orange-400',
    tag: 'bg-red-500/15 text-red-400 border-red-500/20',
    label: 'High priority',
  },
  medium: {
    card: 'border-orange-500/20 bg-orange-500/[0.04]',
    bar: 'from-orange-500 to-amber-400',
    tag: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    label: 'Medium priority',
  },
  low: {
    card: 'border-border bg-bg-2',
    bar: 'from-slate-500 to-slate-400',
    tag: 'bg-white/[0.04] text-text3 border-border',
    label: 'Optional',
  },
};

const KIND_META = {
  priority: { label: 'Today’s Priority', color: 'text-red-400', chip: 'bg-red-500/12 text-red-400 border-red-500/20' },
  'revision-due': { label: 'Revision Due', color: 'text-amber-400', chip: 'bg-amber-500/12 text-amber-400 border-amber-500/20' },
  completed: { label: 'Recently Completed', color: 'text-green-400', chip: 'bg-green-500/12 text-green-400 border-green-500/20' },
  'next-action': { label: 'Next Best Action', color: 'text-primary', chip: 'bg-primary/12 text-primary border-primary/20' },
  default: { label: 'Recommendation', color: 'text-text2', chip: 'bg-white/[0.04] text-text3 border-border' },
};

export default function SmartRecommendations({ limit = 5 }) {
  const { topics, pyqs, mocks, studyStats, revisionSchedule } = useProgress();

  const { recs, groups } = useMemo(() => {
    const all = generateRecommendations(topics, pyqs, mocks, studyStats?.subjects || [], revisionSchedule, studyStats).slice(0, limit);
    // Group by kind so the panel reads like a plan, not a flat list
    const order = ['priority', 'revision-due', 'next-action', 'completed'];
    const grouped = order
      .map((k) => ({ kind: k, items: all.filter((r) => r.kind === k) }))
      .filter((g) => g.items.length);
    // Anything not grouped falls into a trailing group
    const known = new Set(order);
    const rest = all.filter((r) => !known.has(r.kind));
    if (rest.length) grouped.push({ kind: 'next-action', items: rest });
    return { recs: all, groups: grouped };
  }, [topics, pyqs, mocks, studyStats, revisionSchedule, limit]);

  if (!recs.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold text-text">Smart Recommendations</div>
        </div>
        <p className="text-xs text-text3 text-center py-4">You’re on track! Start today’s plan to keep momentum.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div>
            <div className="text-sm font-semibold text-text">Smart Recommendations</div>
            <div className="text-[10px] text-text3">Derived from your real progress</div>
          </div>
        </div>
        <Link to="/planner" className="flex items-center gap-1 text-[10px] text-primary hover:underline shrink-0">
          AI Planner <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.kind} className="mb-3 last:mb-0">
          <div className={`text-[9px] font-semibold uppercase tracking-wider mb-1.5 ${KIND_META[group.kind]?.color || KIND_META.default.color}`}>
            {KIND_META[group.kind]?.label || KIND_META.default.label}
          </div>
          <div className="space-y-2">
            {group.items.map((r, i) => {
              const Icon = recIcon(r.icon || r.type);
              const style = PRIORITY_STYLE[r.priority] || PRIORITY_STYLE.medium;
              const weakPct = typeof r.progress === 'number' ? Math.max(0, Math.min(100, r.progress)) : null;
              // For weakness cards show completion (inverted); for others show the raw metric
              const isWeak = r.kind === 'priority' || r.type === 'weak';
              const displayPct = r.completion != null ? r.completion : isWeak && weakPct != null ? 100 - weakPct : weakPct;
              return (
                <div key={`${group.kind}-${i}`} className={`flex items-start gap-3 border rounded-lg p-3 ${style.card}`}>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-text2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text truncate">{r.title}</span>
                      {r.accuracy != null && r.accuracy < 60 && (
                        <span className="text-[9px] font-mono text-red-400 shrink-0">{Math.round(r.accuracy)}% acc</span>
                      )}
                    </div>
                    <div className="text-[10px] text-text3 mt-0.5 leading-relaxed">{r.action}</div>
                    {r.detail && r.detail !== r.action && (
                      <div className="text-[9px] text-text3/70 mt-0.5">{r.detail}</div>
                    )}
                    {(displayPct != null || (r.pyqTotal > 0)) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-bg-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${displayPct != null && displayPct >= 60 ? 'from-emerald-500 to-teal-400' : style.bar}`}
                            style={{ width: `${displayPct != null ? displayPct : (r.pyqSolved / r.pyqTotal) * 100}%` }}
                          />
                        </div>
                        {displayPct != null && (
                          <span className="text-[9px] font-mono text-text3 shrink-0">
                            {isWeak && r.completion == null ? `${Math.round(weakPct)}% weak` : `${Math.round(displayPct)}% done`}
                          </span>
                        )}
                        {r.pyqTotal > 0 && <span className="text-[9px] font-mono text-text3 shrink-0">{r.pyqSolved}/{r.pyqTotal} PYQs</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
