import { useRef, useState } from 'react';

export default function CommunityCard({
  type = 'testimonial',
  data,
}) {
  const cardRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const accentRgb = data.rgb || '245,158,11';

  if (type === 'achievement') {
    return (
      <article
        ref={cardRef}
        role="listitem"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="group relative shrink-0 focus:outline-none"
        style={{
          width: 'clamp(240px, 28vw, 320px)',
          height: 'clamp(180px, 22vw, 220px)',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl transition-all duration-300 ease-out"
          style={{
            background: `
              linear-gradient(145deg,
                rgba(${accentRgb}, 0.08) 0%,
                rgba(17, 19, 38, 0.93) 45%,
                rgba(14, 16, 34, 0.95) 100%
              )
            `,
            border: focused
              ? `1px solid rgba(${accentRgb}, 0.4)`
              : '1px solid rgba(255,255,255,0.055)',
            boxShadow: focused
              ? `0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(${accentRgb}, 0.1)`
              : '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
            transform: focused
              ? 'translate3d(0, -3px, 0)'
              : 'translate3d(0, 0, 0)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            willChange: 'transform, border-color, box-shadow',
          }}
        />
        <div className="relative h-full w-full p-6 flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(145deg, rgba(${accentRgb}, 0.18), rgba(${accentRgb}, 0.06))`,
                border: `1px solid rgba(${accentRgb}, 0.22)`,
              }}
            >
              {data.icon || '🏆'}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1"
                style={{ color: `rgba(${accentRgb}, 0.75)` }}
              >
                {data.badgeLabel || 'Achievement'}
              </div>
              <div
                className="text-[18px] font-bold leading-none text-white tracking-tight"
                style={{ letterSpacing: '-0.015em' }}
              >
                {data.headline}
              </div>
            </div>
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(226,232,240,0.5)' }}>
            {data.description}
          </p>
          <div className="mt-auto pt-3 flex items-center justify-between">
            <div>
              <div className="text-[12px] font-semibold text-white">{data.name}</div>
              <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.7)' }}>
                {data.subtitle}
              </div>
            </div>
            {data.value && (
              <div
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{
                  background: `rgba(${accentRgb}, 0.1)`,
                  color: `rgba(${accentRgb}, 0.9)`,
                  border: `1px solid rgba(${accentRgb}, 0.2)`,
                }}
              >
                {data.value}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  if (type === 'milestone') {
    return (
      <article
        ref={cardRef}
        role="listitem"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="group relative shrink-0 focus:outline-none"
        style={{
          width: 'clamp(220px, 24vw, 280px)',
          height: 'clamp(180px, 22vw, 220px)',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl transition-all duration-300 ease-out"
          style={{
            background: `
              linear-gradient(145deg,
                rgba(139,92,246, 0.06) 0%,
                rgba(17, 19, 38, 0.94) 45%,
                rgba(14, 16, 34, 0.95) 100%
              )
            `,
            border: focused
              ? '1px solid rgba(139,92,246, 0.38)'
              : '1px solid rgba(255,255,255,0.055)',
            boxShadow: focused
              ? '0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(139,92,246, 0.1)'
              : '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
            transform: focused
              ? 'translate3d(0, -3px, 0)'
              : 'translate3d(0, 0, 0)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            willChange: 'transform, border-color, box-shadow',
          }}
        />
        <div className="relative h-full w-full p-6 flex flex-col items-center justify-center text-center">
          <div
            className="text-[40px] font-black leading-none mb-2 tracking-tight"
            style={{
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #C4B5FD, #67E8F9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {data.value}
          </div>
          <div className="text-[13px] font-semibold text-white mb-1.5">
            {data.label}
          </div>
          <p className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: 'rgba(148,163,184,0.65)' }}>
            {data.description}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(139,92,246, 0.7)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      ref={cardRef}
      role="listitem"
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="group relative shrink-0 focus:outline-none"
      style={{
        width: 'clamp(260px, 30vw, 340px)',
        height: 'clamp(200px, 26vw, 260px)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300 ease-out"
        style={{
          background: `
            linear-gradient(145deg,
              rgba(167,139,250, 0.05) 0%,
              rgba(17, 19, 38, 0.94) 45%,
              rgba(14, 16, 34, 0.95) 70%,
              rgba(${accentRgb}, 0.04) 100%
            )
          `,
          border: focused
            ? `1px solid rgba(${accentRgb}, 0.38)`
            : '1px solid rgba(255,255,255,0.055)',
          boxShadow: focused
            ? `0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(${accentRgb}, 0.1)`
            : '0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
          transform: focused
            ? 'translate3d(0, -3px, 0)'
            : 'translate3d(0, 0, 0)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          willChange: 'transform, border-color, box-shadow',
        }}
      />
      <div className="relative h-full w-full p-6 flex flex-col">
        <div className="flex items-center gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="text-[13px]"
              style={{ color: i < (data.rating || 5) ? '#FBBF24' : 'rgba(55,65,81,0.7)' }}
            >
              ★
            </span>
          ))}
        </div>
        <p
          className="text-[13px] leading-relaxed flex-1"
          style={{ color: 'rgba(226,232,240,0.62)' }}
        >
          "{data.quote}"
        </p>
        <div className="mt-5 flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
            style={{
              background: `linear-gradient(145deg, rgba(${accentRgb}, 0.2), rgba(${accentRgb}, 0.06))`,
              color: `rgba(${accentRgb}, 0.95)`,
              border: `1px solid rgba(${accentRgb}, 0.2)`,
            }}
          >
            {(data.author || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-white truncate">
              {data.author}
            </div>
            <div className="text-[10.5px] truncate" style={{ color: 'rgba(148,163,184,0.7)' }}>
              {data.role}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
