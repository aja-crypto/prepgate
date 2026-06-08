// Weekly & monthly goal progress trackers
import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';

function GoalBar({ label, current, target, unit, color }) {
  const pct = target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-text2">{label}</span>
        <span className="font-mono text-text">{current}{unit} / {target}{unit}</span>
      </div>
      <div className="h-1.5 bg-bg-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function GoalTrackerCard({ period = 'weekly' }) {
  const { studyStats, topics, mocks, gateFeatures } = useProgress();

  const progress = useMemo(() => {
    if (period === 'weekly') {
      const goal = gateFeatures.weeklyGoal || { hours: 50, topics: 15, mocks: 1 };
      const topicsDone = topics.filter((t) => t.done).length;
      const weekMocks = mocks.filter((m) => {
        const d = new Date(m.date);
        const now = new Date();
        return (now - d) < 7 * 86400000;
      }).length;
      return {
        title: '📅 Weekly Goals',
        hours: { current: studyStats.weekHours, target: goal.hours },
        topics: { current: Math.min(topicsDone, goal.topics), target: goal.topics },
        mocks: { current: weekMocks, target: goal.mocks },
      };
    }
    const goal = gateFeatures.monthlyGoal || { hours: 200, topics: 60, mocks: 4 };
    const monthHours = (gateFeatures.monthlyHours || []).reduce((a, b) => a + b, 0);
    return {
      title: '🗓 Monthly Goals',
      hours: { current: monthHours, target: goal.hours },
      topics: { current: topics.filter((t) => t.done).length, target: goal.topics },
      mocks: { current: mocks.length, target: goal.mocks },
    };
  }, [period, studyStats, topics, mocks, gateFeatures]);

  const overallPct = Math.round(
    ([progress.hours, progress.topics, progress.mocks].reduce((s, g) => s + Math.min(100, (g.current / g.target) * 100), 0)) / 3
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-text">{progress.title}</div>
        <span className="text-xs font-mono text-primary">{overallPct}%</span>
      </div>
      <GoalBar label="Study Hours" current={progress.hours.current} target={progress.hours.target} unit="h" color="#4f8dff" />
      <GoalBar label="Topics" current={progress.topics.current} target={progress.topics.target} unit="" color="#06d6a0" />
      <GoalBar label="Mock Tests" current={progress.mocks.current} target={progress.mocks.target} unit="" color="#ff9f43" />
    </div>
  );
}
