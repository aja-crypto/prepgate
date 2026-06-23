import { useState } from 'react';

export default function SubjectInsightCard({ subject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
        expanded ? '-translate-y-0.5' : 'hover:-translate-y-1'
      }`}
      style={{
        background: expanded
          ? `linear-gradient(135deg, ${subject.color}15, rgba(79,70,229,0.05))`
          : 'rgba(255,255,255,0.03)',
        border: expanded
          ? `1px solid ${subject.color}30`
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${subject.color}20`, color: subject.color }}
        >
          {subject.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">{subject.name}</h3>
              <span className="text-[10px] text-text3">{subject.expectedWeightage}</span>
            </div>
            <span
              className="text-[9px] mt-1 flex-shrink-0 transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : '' }}
            >
              ▼
            </span>
          </div>

          {!expanded && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: `${subject.color}15`, color: subject.color, border: `1px solid ${subject.color}25` }}
              >
                {subject.difficulty}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-text3 border border-white/10">
                {subject.highRoiTopics.length} ROI topics
              </span>
            </div>
          )}

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">High ROI Topics</h4>
                <ul className="space-y-1">
                  {subject.highRoiTopics.map((t, i) => (
                    <li key={i} className="text-[11px] text-text2 flex items-start gap-2">
                      <span style={{ color: subject.color }}>→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Easy Marks Topics</h4>
                <ul className="space-y-1">
                  {subject.easyMarksTopics.map((t, i) => (
                    <li key={i} className="text-[11px] text-text2 flex items-start gap-2">
                      <span style={{ color: '#34D399' }}>★</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-text2 uppercase tracking-wider mb-1.5">Common Mistakes</h4>
                <ul className="space-y-1">
                  {subject.commonMistakes.map((m, i) => (
                    <li key={i} className="text-[11px] text-text3 flex items-start gap-2">
                      <span style={{ color: '#EF4444' }}>!</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[8px] text-text3 uppercase">Revision</span>
                  <p className="text-[11px] text-text mt-0.5">{subject.revisionFrequency}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[8px] text-text3 uppercase">PYQs Priority</span>
                  <p className="text-[11px] text-text mt-0.5">{subject.pyqPriorityTopics[0]}</p>
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-[10px] leading-relaxed"
                style={{ background: `${subject.color}08`, border: `1px solid ${subject.color}15` }}
              >
                <span className="font-semibold" style={{ color: subject.color }}>Insight: </span>
                <span className="text-text2">{subject.keyInsight}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
