import { useState } from 'react';

export default function SuccessBlueprintCard({ principle, featured }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
        expanded ? '-translate-y-0.5' : 'hover:-translate-y-1'
      }`}
      style={{
        background: expanded
          ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))'
          : 'rgba(255,255,255,0.03)',
        border: expanded
          ? '1px solid rgba(124,58,237,0.2)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{principle.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white">{principle.title}</h3>
            <span
              className="text-[9px] mt-0.5 flex-shrink-0 transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : '' }}
            >
              ▼
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{principle.summary}</p>

          {!expanded && principle.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {principle.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {principle.details && (
                <ul className="space-y-1 mb-3">
                  {principle.details.map((d, i) => (
                    <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2">
                      <span style={{ color: '#22D3EE' }}>→</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
              {principle.gatenexaTip && (
                <div
                  className="rounded-xl p-3 text-[10px] leading-relaxed"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
                >
                  <span className="font-semibold" style={{ color: '#22D3EE' }}>GateNexa Tip: </span>
                  <span className="text-gray-300">{principle.gatenexaTip}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

