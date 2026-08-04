// Weak topic detector — explains WHY a topic is weak, not just "below 50%"
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { detectWeakTopics } from '../../utils/gateUtils';
import { subjectIcon, recIcon } from '../../utils/subjectIcons';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

function WeakIcon({ w }) {
  if (w.type === 'subject') {
    const Icon = subjectIcon(w.name);
    return <Icon className="w-4 h-4" />;
  }
  const Icon = recIcon(w.icon || w.type);
  return <Icon className="w-4 h-4" />;
}

export default function WeakTopicsPanel({ limit = 5 }) {
  const { topics, pyqs, mocks, studyStats } = useProgress();

  const weak = useMemo(
    () => detectWeakTopics(topics, pyqs, mocks, studyStats?.subjects || []).slice(0, limit),
    [topics, pyqs, mocks, studyStats?.subjects, limit]
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text">Weak Topic Detector</div>
            <div className="text-[11px] text-text3 mt-0.5">From accuracy, PYQs & incomplete topics</div>
          </div>
        </div>
        <Link to="/analytics" className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {weak.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-sm text-green-400">No weak areas detected — keep it up!</p>
          <p className="text-[10px] text-text3 mt-1">Accuracy is strong across subjects.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {weak.map((w, i) => {
            const weakPct = typeof w.score === 'number' ? Math.max(0, Math.min(100, w.score)) : null;
            const completion = typeof w.completion === 'number' ? Math.max(0, Math.min(100, w.completion)) : null;
            const acc = typeof w.accuracy === 'number' ? w.accuracy : null;
            // Show real completion when we have it; otherwise the weakness/attention score
            const displayPct = completion != null ? completion : (weakPct != null ? 100 - weakPct : null);
            return (
              <div key={`${w.type}-${w.name}-${i}`} className="flex items-start gap-3 bg-bg-2 border border-border rounded-lg p-3 hover:border-red-500/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-border flex items-center justify-center shrink-0 mt-0.5" style={{ color: w.color }}>
                  <WeakIcon w={w} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text truncate">{w.name}</span>
                    <span className="text-[9px] font-mono text-text3 shrink-0">{w.type}</span>
                    {acc != null && acc < 60 && <span className="text-[9px] font-mono text-red-400 shrink-0">{Math.round(acc)}% acc</span>}
                  </div>
                  <p className="text-[11px] text-text3 mt-0.5 leading-relaxed">{w.reason}</p>
                  <div className="flex items-start gap-1.5 mt-1">
                    <span className="text-[11px] text-primary leading-snug">→ {w.recommendation}</span>
                  </div>
                  {displayPct != null && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-bg-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completion != null && completion >= 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                          style={{ width: `${displayPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-text3 shrink-0">
                        {completion != null ? `${Math.round(completion)}% complete` : `${Math.round(weakPct)}% attention`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
