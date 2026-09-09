// Weak topic detector with recommendations
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { detectWeakTopics } from '../../utils/gateUtils';

export default function WeakTopicsPanel({ limit = 5 }) {
  const { topics, pyqs, mocks, studyStats } = useProgress();

  const weak = useMemo(
    () => detectWeakTopics(topics, pyqs, mocks, studyStats.subjects).slice(0, limit),
    [topics, pyqs, mocks, studyStats.subjects, limit]
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">❌ Weak Topic Detector</div>
          <div className="text-[11px] text-text3 mt-0.5">From mocks, PYQs & incomplete topics</div>
        </div>
        <Link to="/analytics" className="text-[11px] text-primary hover:underline">View all →</Link>
      </div>

      {weak.length === 0 ? (
        <p className="text-green-400 text-sm">🎉 No weak areas detected — keep it up!</p>
      ) : (
        <div className="space-y-2">
          {weak.map((w, i) => (
            <div key={`${w.type}-${w.name}-${i}`} className="flex items-start gap-3 bg-bg-2 border border-border rounded-lg p-3">
              <span className="text-base">{w.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text truncate">{w.name}</div>
                <div className="text-[11px] text-text3 mt-0.5">{w.reason}</div>
                <div className="text-[11px] text-primary mt-1">💡 {w.recommendation}</div>
                {w.score > 0 && (
                  <div className="h-1 bg-bg-3 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: `${w.score}%` }} />
                  </div>
                )}
              </div>
              {w.score > 0 && <span className="text-sm font-bold font-mono text-red-400">{w.score}%</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
