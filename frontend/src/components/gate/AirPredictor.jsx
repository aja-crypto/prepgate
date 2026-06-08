// AIR rank predictor from mock scores
import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { predictAIR } from '../../utils/gateUtils';

export default function AirPredictor({ score: overrideScore, compact = false }) {
  const { mocks } = useProgress();

  const score = useMemo(() => {
    if (overrideScore != null) return overrideScore;
    if (!mocks.length) return 0;
    const recent = mocks.slice(-3);
    return recent.reduce((s, m) => s + m.score, 0) / recent.length;
  }, [mocks, overrideScore]);

  const prediction = predictAIR(score);

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-primary">~{prediction.air.toLocaleString()}</div>
          <div className="text-[10px] text-text3">Est. AIR</div>
        </div>
        <div className="text-xs text-text3">
          <div>Score: <span className="text-text font-mono">{prediction.score.toFixed(1)}</span></div>
          <div>Percentile: <span className="text-accent font-mono">{prediction.percentile}%</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">🏆 AIR Predictor</div>
          <div className="text-[11px] text-text3 mt-0.5">Based on recent mock average ({score.toFixed(1)}/100)</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{prediction.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Est. AIR', value: `~${prediction.air.toLocaleString()}`, color: '#4f8dff' },
          { label: 'Percentile', value: `${prediction.percentile}%`, color: '#06d6a0' },
          { label: 'Mock Score', value: score.toFixed(1), color: '#ff9f43' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text3 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-3">
        <p className="text-[11px] text-text3 leading-relaxed">
          <span className="text-yellow-400 font-semibold">⚠️ Disclaimer:</span> This is a heuristic estimate based on score-to-percentile mapping (~1.5L CSE candidates). Actual AIR depends on exam difficulty, normalization, and competition. Use for motivation only.
        </p>
      </div>
    </div>
  );
}
