import { useRef, useState } from 'react';

export default function FeatureCard({
  icon,
  title,
  description,
  accent = 'purple',
  tagline,
}) {
  const cardRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const accents = {
    purple: { c1: '139,92,246', c2: '124,58,237' },
    cyan:   { c1: '34,211,238',  c2: '6,182,212'   },
    amber:  { c1: '245,158,11',  c2: '217,119,6'   },
    emerald:{ c1: '34,197,94',   c2: '22,163,74'   },
    rose:   { c1: '236,72,153',  c2: '219,39,119'  },
    indigo: { c1: '99,102,241',  c2: '79,70,229'   },
  };
  const a = accents[accent] || accents.purple;

  return (
    <article
      ref={cardRef}
      role="listitem"
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="group relative shrink-0 focus:outline-none"
      style={{
        width: 'clamp(240px, 30vw, 340px)',
        height: 'clamp(200px, 26vw, 260px)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300 ease-out"
        style={{
          background: `
            linear-gradient(145deg,
              rgba(${a.c1}, 0.06) 0%,
              rgba(17, 19, 38, 0.94) 40%,
              rgba(14, 16, 34, 0.96) 65%,
              rgba(${a.c2 === '6,182,212' ? '34,211,238' : '99,102,241'}, 0.04) 100%
            )
          `,
          border: focused
            ? `1px solid rgba(${a.c1}, 0.45)`
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: focused
            ? `0 18px 48px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(${a.c1}, 0.12)`
            : '0 10px 30px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.035)',
          transform: focused
            ? 'translate3d(0, -3px, 0)'
            : 'translate3d(0, 0, 0)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          willChange: 'transform, border-color, box-shadow',
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `
            radial-gradient(600px circle at var(--mx, 30%) var(--my, 20%), rgba(${a.c1}, 0.08), transparent 45%)
          `,
        }}
      />
      <div
        className="absolute top-0 left-4 right-4 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${a.c1}, 0.35), transparent)`,
        }}
      />

      <div className="relative h-full w-full p-6 flex flex-col">
        <div
          className="flex items-center justify-center rounded-xl shrink-0 mb-4"
          style={{
            width: 48,
            height: 48,
            background: `linear-gradient(145deg, rgba(${a.c1}, 0.14), rgba(${a.c2}, 0.06))`,
            border: `1px solid rgba(${a.c1}, 0.22)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <span className="text-2xl leading-none" style={{ filter: 'saturate(1.1)' }}>
            {icon}
          </span>
        </div>

        {tagline && (
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
            style={{ color: `rgba(${a.c1}, 0.75)` }}
          >
            {tagline}
          </div>
        )}

        <h3
          className="text-[15px] font-bold leading-tight text-white mb-2 tracking-tight"
          style={{ letterSpacing: '-0.01em' }}
        >
          {title}
        </h3>

        <p
          className="text-[12.5px] leading-relaxed"
          style={{
            color: 'rgba(226,232,240,0.52)',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>

        <div className="mt-auto pt-4 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-3.5 h-3.5"
            style={{ color: `rgba(${a.c1}, 0.85)` }}
          >
            <path
              d="M4 10h12M12 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-[11px] font-semibold tracking-wide"
            style={{ color: `rgba(${a.c1}, 0.85)` }}
          >
            Explore
          </span>
        </div>
      </div>
    </article>
  );
}
