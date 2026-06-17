import { useState } from 'react';

export default function RoadmapCard({ phase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${phase.color}15`, border: `1px solid ${phase.color}30` }}
          >
            {phase.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-white">{phase.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${phase.color}15`, color: phase.color }}>
                {phase.subtitle}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{phase.focus}</p>
          </div>
          <span className="text-gray-500 text-xs transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : '' }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div className="animate-fadeIn pt-3 border-t space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">✅ Action Items</p>
            <div className="space-y-1.5">
              {phase.tasks.map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="text-[10px] mt-0.5" style={{ color: '#34D399' }}>✓</span>
                  <span className="text-[11px] text-gray-400">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${phase.color}06`, border: `1px solid ${phase.color}12` }}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">🧠 Mindset</p>
            <p className="text-[11px] italic text-gray-400">{phase.mindset}</p>
          </div>
        </div>
      )}
    </div>
  );
}
