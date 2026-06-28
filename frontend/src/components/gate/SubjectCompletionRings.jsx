// Subject progress with rings instead of bars
import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion, getSubjectAccuracy } from '../../utils/gateUtils';
import GlassCard from '../ui/GlassCard';
import { ProgressRingMini } from '../ui/ProgressRing';

function getProgressColor(value) {
  if (value < 30) return '#EF4444';
  if (value < 70) return '#F59E0B';
  return '#22C55E';
}

export default function SubjectCompletionRings({ limit }) {
  const { studyStats, topics, pyqs } = useProgress();
  const safeSubjects = studyStats?.subjects || [];
  const subjects = computeSubjectCompletion(safeSubjects, topics, pyqs);
  const accuracies = getSubjectAccuracy(safeSubjects, pyqs);
  
  const display = limit ? subjects.slice(0, limit) : subjects;
  const overall = Math.round(subjects.reduce((s, x) => s + x.progress, 0) / (subjects.length || 1));
  const needsAttention = subjects.filter((s) => s.progress < 50).sort((a, b) => a.progress - b.progress);

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

      {needsAttention.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">Needs Attention</div>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map((s) => (
              <span key={s.name} className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                {s.name} ({s.progress}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {display.map((s, idx) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 group"
            style={{
              borderColor: s.progress < 30 ? 'rgba(239,68,68,0.2)' : s.progress < 70 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
              background: s.progress < 30 ? 'rgba(239,68,68,0.04)' : s.progress < 70 ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)',
            }}
          >
            <ProgressRingMini value={s.progress} size={40} stroke={3.5} color={getProgressColor(s.progress)} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-text truncate" title={s.name}>{s.name}</div>
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
