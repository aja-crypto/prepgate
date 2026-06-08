// Smart study recommendations from weak topics, PYQs, revisions
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { generateRecommendations } from '../../utils/gateUtils';

const PRIORITY_STYLE = {
  high: 'border-red-500/20 bg-red-500/5',
  medium: 'border-orange-500/20 bg-orange-500/5',
  low: 'border-border bg-bg-2',
};

export default function SmartRecommendations({ limit = 5 }) {
  const { topics, pyqs, mocks, studyStats, revisionSchedule } = useProgress();

  const recs = useMemo(
    () => generateRecommendations(topics, pyqs, mocks, studyStats.subjects, revisionSchedule).slice(0, limit),
    [topics, pyqs, mocks, studyStats.subjects, revisionSchedule, limit]
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">💡 Smart Recommendations</div>
          <div className="text-[10px] text-text3">Personalized next steps</div>
        </div>
        <Link to="/planner" className="text-[10px] text-primary hover:underline">AI Planner →</Link>
      </div>
      <div className="space-y-2">
        {recs.map((r, i) => (
          <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${PRIORITY_STYLE[r.priority]}`}>
            <span className="text-lg flex-shrink-0">{r.icon}</span>
            <div>
              <div className="text-xs font-medium text-text">{r.title}</div>
              <div className="text-[10px] text-text3 mt-0.5">{r.action}</div>
            </div>
          </div>
        ))}
        {recs.length === 0 && <div className="text-xs text-text3 text-center py-4">You&apos;re on track! Keep going.</div>}
      </div>
    </div>
  );
}
