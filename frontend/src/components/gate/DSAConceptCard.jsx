import { useState } from 'react';

export default function DSAConceptCard({ concept }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${concept.color}15`, border: `1px solid ${concept.color}30` }}
        >
          {concept.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white">{concept.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${concept.color}15`, color: concept.color }}>
              Real-Life
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic">
            "{concept.insight}"
          </p>
        </div>
        <span className="text-gray-500 text-xs transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : '' }}>
          ▼
        </span>
      </div>

      {expanded && (
        <div className="animate-fadeIn pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Real-World Applications</p>
          <div className="flex flex-wrap gap-1.5">
            {concept.apps.map((app) => (
              <span
                key={app}
                className="text-[10px] px-2 py-1 rounded-lg"
                style={{ background: `${concept.color}08`, border: `1px solid ${concept.color}15`, color: concept.color }}
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
