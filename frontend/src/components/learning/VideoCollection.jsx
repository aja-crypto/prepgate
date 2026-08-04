import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CinematicVideoCard from './CinematicVideoCard';

// Netflix-style horizontal carousel: scrollable row of fixed-width cinematic
// cards with prev/next arrow buttons and edge fade.
export default function VideoCollection({
  id, icon, title, subtitle, videos, onSelect, accent, progressOf,
  savedIds, completedIds, pinnedIds, onToggle, onNotes, onShare,
}) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  if (!videos || videos.length === 0) return null;

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amt = Math.max(300, el.clientWidth * 0.7);
    el.scrollBy({ left: dir * amt, behavior: 'smooth' });
  };

  return (
    <section className="relative group/carousel">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: (accent || '#8B5CF6') + '18', border: '1px solid ' + (accent || '#8B5CF6') + '30', color: accent || '#C4B5FD' }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">{title}</h2>
          {subtitle && <p className="text-[10px] text-text3/60">{subtitle}</p>}
        </div>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10" style={{ background: 'linear-gradient(90deg, #09090F, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10" style={{ background: 'linear-gradient(-90deg, #09090F, transparent)' }} />

        {/* Arrow buttons */}
        {canLeft && (
          <button onClick={() => scrollBy(-1)} aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full lh-glass flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {canRight && (
          <button onClick={() => scrollBy(1)} aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full lh-glass flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Scrollable row */}
        <div ref={scrollerRef} onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory scroll-smooth"
          style={{ scrollPaddingLeft: '4px', scrollbarWidth: 'thin' }}>
          {videos.map((v, i) => (
            <CinematicVideoCard
              key={v._id || v.id || `${id}-${i}`}
              item={v}
              index={i}
              accent={accent}
              progress={progressOf?.(v)}
              badges={v.badges}
              savedIds={savedIds}
              completedIds={completedIds}
              pinnedIds={pinnedIds}
              onToggle={onToggle}
              onNotes={onNotes}
              onShare={onShare}
              onClick={() => onSelect?.(v)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
