// Study streak tracker with heatmap
import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getStreakHeatmap } from '../../utils/gateUtils';

export default function StreakTracker({ days = 28, compact = false }) {
  const { gateFeatures } = useProgress();
  const heatmap = useMemo(() => getStreakHeatmap(gateFeatures.streak.activityLog, days), [gateFeatures.streak.activityLog, days]);
  const { current, longest } = gateFeatures.streak;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="text-xl font-bold font-mono text-warning">{current}</div>
          <div className="text-[10px] text-text3">day streak</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">🔥 Study Streak</div>
          <div className="text-[11px] text-text3 mt-0.5">Consecutive study days</div>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold font-mono text-warning">{current}</div>
            <div className="text-[10px] text-text3">Current</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text2">{longest}</div>
            <div className="text-[10px] text-text3">Best</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-text3 mb-2">Last {days} days — green = full day, purple = partial</div>
      <div className="grid grid-cols-7 gap-1.5">
        {heatmap.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.hours ? `${d.hours.toFixed(1)}h` : 'No study'}`}
            className={`aspect-square rounded-sm transition-colors ${
              d.level === 'full' ? 'bg-primary' : d.level === 'partial' ? 'bg-secondary/50' : 'bg-bg-3'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
