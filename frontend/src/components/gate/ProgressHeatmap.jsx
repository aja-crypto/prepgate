import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getStreakHeatmap } from '../../utils/gateUtils';

const LEVEL_COLORS = {
  '': 'bg-bg-3',
  partial: 'bg-green-500/30',
  full: 'bg-green-500',
};

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ProgressHeatmap({ days = 91 }) {
  const { gateFeatures } = useProgress();
  const activityLog = gateFeatures?.streak?.activityLog || {};

  const heatmap = useMemo(() => getStreakHeatmap(activityLog, days), [activityLog, days]);

  if (!heatmap.length) return null;

  const weeks = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold text-text">Study Activity</div>
          <div className="text-[10px] text-text3 mt-0.5">Last {days} days</div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-text3">
          <span>Less</span>
          {['', 'partial', 'full'].map((l) => (
            <span key={l} className={`w-3 h-3 rounded ${LEVEL_COLORS[l]} border border-border`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-2">
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((d, i) => (
            <span key={i} className="text-[7px] text-text3 h-3 flex items-center">{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[day.level]} border border-border/30`}
                title={`${day.date}: ${day.hours}h`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[9px] text-text3">
        <span>Total active days: {Object.keys(activityLog).length}</span>
        <button
          type="button"
          onClick={() => {
            import('../../utils/gateUtils').then((m) => {
              const data = m.getStreakHeatmap(activityLog, 365);
              const weeks = [];
              for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
              // Simple UI toggle - could be improved with proper modal
              const el = document.getElementById('heatmap-full');
              if (el) el.classList.toggle('hidden');
            });
          }}
          className="text-primary hover:underline"
        >
          Show full year
        </button>
      </div>
    </div>
  );
}
