// Subject progress with rings instead of bars
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion, getSubjectAccuracy } from '../../utils/gateUtils';
import GlassCard from '../ui/GlassCard';
import { ProgressRingMini } from '../ui/ProgressRing';

export default function SubjectCompletionRings({ limit }) {
  const { studyStats, topics, pyqs } = useProgress();
  const safeSubjects = studyStats?.subjects || [];
  const subjects = computeSubjectCompletion(safeSubjects, topics, pyqs);
  const accuracies = getSubjectAccuracy(safeSubjects, pyqs);
  
  const display = limit ? subjects.slice(0, limit) : subjects;
  const overall = Math.round(subjects.reduce((s, x) => s + x.progress, 0) / (subjects.length || 1));

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text3 mb-1">Progress</p>
          <h3 className="text-sm font-semibold text-text">Subject Completion</h3>
          <p className="text-[11px] text-text3 mt-0.5">Topics 60% · PYQs 40%</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-primary">{overall}%</div>
          <div className="text-[10px] text-text3">Overall</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {display.map((s, idx) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-bg-2/40 p-3 hover:border-primary/20 transition-all duration-200 group"
          >
            <ProgressRingMini value={s.progress} size={40} stroke={3.5} color={s.color || 'var(--color-primary)'} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-text truncate">{s.name}</div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-text3">{s.icon}</div>
                {accuracies[idx] > 0 && (
                  <div className="text-[9px] font-bold text-success bg-success/10 px-1 rounded" title="PYQ Accuracy">
                    {accuracies[idx]}%
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
