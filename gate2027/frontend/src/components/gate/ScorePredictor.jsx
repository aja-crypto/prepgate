// GATE score predictor from topics, PYQs, and mock trend
import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { predictScore } from '../../utils/gateUtils';

export default function ScorePredictor() {
  const { topics, pyqs, mocks } = useProgress();
  const prediction = useMemo(() => predictScore(topics, pyqs, mocks), [topics, pyqs, mocks]);

  const trendLabel = prediction.trend > 2 ? 'Improving ↑' : prediction.trend < -2 ? 'Declining ↓' : 'Stable →';
  const trendColor = prediction.trend > 2 ? '#06d6a0' : prediction.trend < -2 ? '#ff6b6b' : '#ff9f43';

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">📊 Score Predictor</div>
      <div className="text-[11px] text-text3 mb-4">Estimated GATE score based on preparation data</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-2 border border-border rounded-lg p-3 text-center">
          <div className="text-xl font-bold font-mono text-primary">{prediction.current}</div>
          <div className="text-[10px] text-text3 mt-1">Current Est.</div>
        </div>
        <div className="bg-bg-2 border border-border rounded-lg p-3 text-center">
          <div className="text-xl font-bold font-mono text-accent">{prediction.projected}</div>
          <div className="text-[10px] text-text3 mt-1">Projected</div>
        </div>
        <div className="bg-bg-2 border border-border rounded-lg p-3 text-center">
          <div className="text-sm font-bold" style={{ color: trendColor }}>{trendLabel}</div>
          <div className="text-[10px] text-text3 mt-1">Mock Trend</div>
        </div>
      </div>
    </div>
  );
}
