import { useState } from 'react';

export default function MistakePatternCard({ category }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
        expanded ? '-translate-y-0.5' : 'hover:-translate-y-1'
      }`}
      style={{
        background: expanded
          ? `linear-gradient(135deg, ${category.color}12, rgba(79,70,229,0.04))`
          : 'rgba(255,255,255,0.03)',
        border: expanded
          ? `1px solid ${category.color}25`
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">{category.title}</h3>
              <p className="text-[11px] text-text2 mt-0.5 leading-relaxed">{category.description}</p>
            </div>
            <span
              className="text-[9px] mt-1 flex-shrink-0 transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : '' }}
            >
              ▼
            </span>
          </div>

          <div
            className="mt-2 rounded-xl p-2.5 text-[10px] leading-relaxed"
            style={{ background: `${category.color}08`, border: `1px solid ${category.color}15` }}
          >
            <span className="font-semibold" style={{ color: category.color }}>Impact: </span>
            <span className="text-text3">{category.impact}</span>
          </div>

          {!expanded && category.commonPatterns && (
            <div className="flex flex-wrap gap-1 mt-2">
              {category.commonPatterns.slice(0, 2).map((p, i) => (
                <span
                  key={i}
                  className="text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: `${category.color}12`, color: category.color, border: `1px solid ${category.color}20` }}
                >
                  {p.pattern}
                </span>
              ))}
              {category.commonPatterns.length > 2 && (
                <span className="text-[8px] px-1.5 py-0.5 text-text3">+{category.commonPatterns.length - 2} more</span>
              )}
            </div>
          )}

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Symptoms</h4>
                <ul className="space-y-1">
                  {category.symptoms.map((s, i) => (
                    <li key={i} className="text-[11px] text-text2 flex items-start gap-2">
                      <span style={{ color: category.color }}>→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Prevention</h4>
                <ul className="space-y-1">
                  {category.prevention.map((p, i) => (
                    <li key={i} className="text-[11px] text-text2 flex items-start gap-2">
                      <span style={{ color: '#34D399' }}>★</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="rounded-xl p-3 text-[10px] leading-relaxed"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
              >
                <span className="font-semibold" style={{ color: '#22D3EE' }}>Recovery: </span>
                <span className="text-text2">{category.recoveryStrategy}</span>
              </div>

              {category.commonPatterns && (
                <div>
                  <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Common Patterns</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {category.commonPatterns.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-lg p-2 text-[10px]"
                        style={{ background: `${category.color}08`, border: `1px solid ${category.color}15` }}
                      >
                        <span className="text-text2">{p.pattern}</span>
                        <span className="text-text3 ml-1">({p.subject})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
