import { useState, useEffect } from 'react';

export default function MarqueeRow({
  children,
  direction = 'left',
  speed = 40,
  gap = 20,
  className = '',
  pauseOnHover = true,
  ariaLabel = '',
}) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    try { mq.addEventListener('change', handler); } catch { mq.addListener(handler); }
    return () => {
      try { mq.removeEventListener('change', handler); } catch { mq.removeListener(handler); }
    };
  }, []);

  const isLeft = direction === 'left';
  const dur = Math.round(Math.max(16, 1600 / speed));
  const childrenArray = Array.isArray(children) ? children : [children];
  const animName = `marquee-${isLeft ? 'l' : 'r'}-${dur}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      }}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      onTouchStart={() => pauseOnHover && setPaused(true)}
      onTouchEnd={() => pauseOnHover && setPaused(false)}
      role="list"
      aria-label={ariaLabel}
    >
      {reduced ? (
        <div className="flex w-max">
          {childrenArray.map((child, i) => (
            <span key={i} className="inline-flex shrink-0" style={{ marginRight: gap }}>{child}</span>
          ))}
        </div>
      ) : (
        <div
          className="flex w-max"
          data-marquee-track
          style={{
            animationName: animName,
            animationDuration: `${dur}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationPlayState: paused ? 'paused' : 'running',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {childrenArray.flatMap((child, i) => [
            <span key={`a-${i}`} className="inline-flex shrink-0">{child}</span>,
            <span key={`as-${i}`} className="inline-block shrink-0" style={{ width: gap }} />,
          ])}
          {childrenArray.flatMap((child, i) => [
            <span key={`b-${i}`} className="inline-flex shrink-0">{child}</span>,
            <span key={`bs-${i}`} className="inline-block shrink-0" style={{ width: gap }} />,
          ])}
        </div>
      )}
      <style>{`
        @keyframes marquee-l-${dur} {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-r-${dur} {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
