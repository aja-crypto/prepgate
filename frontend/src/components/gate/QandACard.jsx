import { useState } from 'react';

export default function QandACard({ item, featured }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
        featured
          ? 'hover:-translate-y-0.5'
          : open
          ? '-translate-y-0.5'
          : 'hover:-translate-y-0.5'
      }`}
      style={{
        background: featured
          ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))'
          : open
          ? 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(79,70,229,0.03))'
          : 'rgba(255,255,255,0.03)',
        border: featured
          ? '1px solid rgba(124,58,237,0.2)'
          : open
          ? '1px solid rgba(124,58,237,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => !featured && setOpen(!open)}
    >
      <div className="flex items-start gap-3">
        <span
          className="text-lg flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}
        >
          Q
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-white leading-relaxed">{item.q}</h3>
            {!featured && (
              <span
                className="text-[9px] mt-0.5 flex-shrink-0 transition-transform duration-300"
                style={{ transform: open ? 'rotate(180deg)' : '' }}
              >
                ▼
              </span>
            )}
          </div>

          {(open || featured) && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-start gap-2">
                <span
                  className="text-xs flex-shrink-0 w-5 h-5 rounded flex items-center justify-center font-bold"
                  style={{ background: 'rgba(6,182,212,0.12)', color: '#22D3EE' }}
                >
                  A
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed">{item.a}</p>
              </div>
              {item.tags && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.map((t) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
