import { useState } from 'react';

export default function StrategyInsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1">{insight.title}</h3>
          <p className="text-[10px]" style={{ color: '#818CF8' }}>Source: {insight.source}</p>
        </div>
        <span className="text-sm mt-0.5 transition-transform duration-300" style={{ transform: expanded ? 'rotate(180deg)' : '' }}>
          ▼
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-3">{insight.summary}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {insight.tags.map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {insight.phases.map((phase, pi) => (
            <div key={pi} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-white">{phase.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24' }}>
                  {phase.duration}
                </span>
              </div>
              <ul className="space-y-1">
                {phase.points.map((pt, i) => (
                  <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2">
                    <span style={{ color: '#22D3EE' }}>→</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-4">
            <h4 className="text-xs font-semibold text-white mb-2">Key Recommendations</h4>
            <div className="space-y-1">
              {insight.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-gray-400">
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h4 className="text-[11px] font-semibold mb-2" style={{ color: '#A78BFA' }}>Mindset</h4>
            <div className="flex flex-wrap gap-1.5">
              {insight.mindset.map((m, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.1)', color: '#22D3EE' }}>
                  💡 {m}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-gray-500 text-center">
              Track this strategy in PrepGate → 
              <span className="text-primary ml-1">Dashboard</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
