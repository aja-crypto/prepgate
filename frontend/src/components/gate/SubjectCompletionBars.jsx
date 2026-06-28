// Subject-wise completion progress bars
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion } from '../../utils/gateUtils';

export default function SubjectCompletionBars({ limit, showChart = false }) {
  const { studyStats, topics, pyqs } = useProgress();
  const subjects = computeSubjectCompletion(studyStats.subjects, topics, pyqs);
  const display = limit ? subjects.slice(0, limit) : subjects;
  const overall = subjects.length ? Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">📈 Subject-wise Completion</div>
          <div className="text-[11px] text-text3 mt-0.5">Based on topics (60%) + PYQs (40%)</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-primary">{overall}%</div>
          <div className="text-[10px] text-text3">Overall</div>
        </div>
      </div>

      {showChart && (
        <div className="flex items-end gap-1 h-24 mb-4 px-1">
          {display.map((s) => (
            <div key={s.name} className="flex-1 flex flex-col items-center gap-1" title={s.name}>
              <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(4, s.progress * 0.9)}px`, background: s.color }} />
              <span className="text-[8px] text-text3 truncate w-full text-center">{s.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {display.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="text-base w-5">{s.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text2 truncate">{s.name}</span>
                <span className="text-text3 font-mono flex-shrink-0 ml-2">{s.progress}%</span>
              </div>
              <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, background: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
