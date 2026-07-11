import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Section Detection ────────────────────────────────────
function useActiveSection(sectionIds) {
  const [active, setActive] = useState('');
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    if (!sectionIds.length) return;
    const obs = new IntersectionObserver((entries) => {
      let best = { id: activeRef.current, ratio: 0 };
      entries.forEach(entry => {
        if (entry.intersectionRatio > best.ratio) best = { id: entry.target.id, ratio: entry.intersectionRatio };
      });
      if (best.id) setActive(best.id);
    }, { threshold: [0.1, 0.3, 0.5], rootMargin: '-80px 0px -40% 0px' });
    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sectionIds]);
  return active;
}

function scanSections() {
  const els = document.querySelectorAll('h1, h2, h3, h4, section[id], div[data-section]');
  const sections = [];
  const seen = new Set();
  els.forEach(h => {
    const id = h.id || h.getAttribute('data-section') || h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || seen.has(id) || id.length < 2 || h.closest('nav') || h.closest('aside') || h.closest('header')) return;
    seen.add(id);
    const text = h.getAttribute('data-label') || h.textContent?.trim()?.slice(0, 35) || id;
    const icon = h.getAttribute('data-icon') || guessIcon(text, id);
    sections.push({ id, text, icon });
  });
  const unique = [];
  const textSeen = new Set();
  sections.forEach(s => { const k = s.text.toLowerCase().slice(0, 20); if (!textSeen.has(k)) { textSeen.add(k); unique.push(s); } });
  return unique;
}

function guessIcon(text, id) {
  const t = (text + ' ' + id).toLowerCase();
  if (t.includes('hero') || t.includes('welcome')) return '★';
  if (t.includes('feature') || t.includes('pillar')) return '◆';
  if (t.includes('subject') || t.includes('topic')) return '📘';
  if (t.includes('note') || t.includes('resource')) return '📄';
  if (t.includes('pyq')) return '📝';
  if (t.includes('mock') || t.includes('test')) return '🎯';
  if (t.includes('analytic') || t.includes('insight') || t.includes('chart')) return '📊';
  if (t.includes('planner') || t.includes('schedule')) return '📅';
  if (t.includes('ai') || t.includes('mentor')) return '🤖';
  if (t.includes('focus') || t.includes('deep')) return '🎯';
  if (t.includes('faq')) return '❓';
  if (t.includes('footer')) return '⬇';
  if (t.includes('dashboard') || t.includes('overview')) return '📊';
  return '●';
}

// ─── Settings Hook ────────────────────────────────────────
const SCROLL_NAV_KEY = 'gatenexa_scroll_nav_enabled';

function useScrollNavSettings() {
  const [enabled, setEnabled] = useState(() => {
    try { const v = localStorage.getItem(SCROLL_NAV_KEY); return v !== null ? v === 'true' : true; }
    catch { return true; }
  });
  useEffect(() => { localStorage.setItem(SCROLL_NAV_KEY, String(enabled)); }, [enabled]);
  return { enabled, toggle: () => setEnabled(p => !p) };
}

// ─── Reduced Motion ───────────────────────────────────────
function useReducedMotion() {
  const mq = useRef(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    mq.current = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.current.matches);
    const h = (e) => setReduced(e.matches);
    mq.current.addEventListener('change', h);
    return () => mq.current?.removeEventListener('change', h);
  }, []);
  return reduced;
}

// ─── Main Component ───────────────────────────────────────
export default function SmartScrollNavigator() {
  const { enabled, toggle: toggleNav } = useScrollNavSettings();
  const reducedMotion = useReducedMotion();
  const [sections, setSections] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const rafRef = useRef(null);
  const dragState = useRef({ startY: 0, startPct: 0 });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scan sections on mount and DOM changes
  useEffect(() => {
    const run = () => setSections(scanSections());
    run();
    const obs = new MutationObserver(run);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // ─── Scroll Position Tracking ──────────────────────────
  const getScrollMain = useCallback(() => document.querySelector('main'), []);
  const getScrollPct = useCallback(() => {
    const main = getScrollMain();
    if (!main || main.scrollHeight <= main.clientHeight) return 0;
    return Math.min(1, Math.max(0, main.scrollTop / (main.scrollHeight - main.clientHeight)));
  }, [getScrollMain]);

  const [scrollPct, setScrollPct] = useState(0);
  const rafScrollRef = useRef(null);

  useEffect(() => {
    const main = getScrollMain();
    if (!main) return;
    const handler = () => {
      if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);
      rafScrollRef.current = requestAnimationFrame(() => {
        setScrollPct(getScrollPct());
      });
    };
    handler();
    main.addEventListener('scroll', handler, { passive: true });
    return () => {
      main.removeEventListener('scroll', handler);
      if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);
    };
  }, [getScrollMain, getScrollPct]);

  const sectionIds = useMemo(() => sections.map(s => s.id), [sections]);
  const active = useActiveSection(sectionIds);
  const activeIdx = sections.findIndex(s => s.id === active);
  const pct = Math.round(scrollPct * 100);

  // ─── Scroll Functions ──────────────────────────────────
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    const main = getScrollMain();
    if (!el || !main) return;
    const top = el.getBoundingClientRect().top + main.scrollTop - 100;
    main.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [getScrollMain, reducedMotion]);

  const scrollToTop = useCallback(() => {
    getScrollMain()?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [getScrollMain, reducedMotion]);

  const scrollToBottom = useCallback(() => {
    const main = getScrollMain();
    if (main) main.scrollTo({ top: main.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [getScrollMain, reducedMotion]);

  const scrollToPct = useCallback((targetPct) => {
    const main = getScrollMain();
    if (!main) return;
    const top = targetPct * (main.scrollHeight - main.clientHeight);
    main.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [getScrollMain, reducedMotion]);

  // ─── Draggable Thumb ───────────────────────────────────
  const thumbToPct = useCallback((clientY) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.min(1, Math.max(0, y / rect.height));
  }, []);

  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragState.current = { startY: e.clientY, startPct: getScrollPct() };

    const onMove = (me) => {
      const targetPct = thumbToPct(me.clientY);
      scrollToPct(targetPct);
    };
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseup', onUp);
  }, [getScrollPct, scrollToPct, thumbToPct]);

  const handleThumbTouchStart = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    const touch = e.touches[0];
    dragState.current = { startY: touch.clientY, startPct: getScrollPct() };

    const onMove = (te) => {
      te.preventDefault();
      const targetPct = thumbToPct(te.touches[0].clientY);
      scrollToPct(targetPct);
    };
    const onEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', onMove, { passive: false });
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [getScrollPct, scrollToPct, thumbToPct]);

  // ─── Track Click ───────────────────────────────────────
  const handleTrackClick = useCallback((e) => {
    if (isDragging) return;
    const targetPct = thumbToPct(e.clientY);
    scrollToPct(targetPct);
  }, [isDragging, thumbToPct, scrollToPct]);

  const handleTrackTouchStart = useCallback((e) => {
    if (isDragging) return;
    const touch = e.touches[0];
    const targetPct = thumbToPct(touch.clientY);
    scrollToPct(targetPct);
  }, [isDragging, thumbToPct, scrollToPct]);

  // ─── Keyboard Navigation ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!enabled || e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); scrollToTop(); }
      else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); scrollToBottom(); }
      else if (e.key === 'PageUp' && e.ctrlKey) { e.preventDefault(); scrollToTop(); }
      else if (e.key === 'PageDown' && e.ctrlKey) { e.preventDefault(); scrollToBottom(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, scrollToTop, scrollToBottom]);

  if (!enabled || sections.length < 2) return null;

  // ─── Desktop View ──────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger */}
        {!mobileOpen && (
          <button onClick={() => setMobileOpen(true)}
            className="fixed right-2 top-1/2 -translate-y-1/2 z-[9999] w-1.5 h-24 rounded-full transition-opacity"
            style={{ background: 'linear-gradient(180deg, #8B5CF6, #22D3EE)', boxShadow: '0 0 12px rgba(139,92,246,0.3)', opacity: 0.6 }}
            aria-label="Open scroll navigator" />
        )}

        {/* Mobile expanded panel */}
        {mobileOpen && (
          <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[9999] py-3 px-2 rounded-2xl"
            style={{ background: 'rgba(10,15,44,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <button onClick={scrollToTop} className="p-2 rounded-lg text-slate-500 hover:text-white w-full text-left text-xs" aria-label="Scroll to top">⬆ Top</button>
            <div className="w-full h-px bg-white/10 my-1" />
            {sections.map(s => {
              const isAct = s.id === active;
              return (
                <button key={s.id} onClick={() => { scrollTo(s.id); setMobileOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-full text-left text-xs transition-colors ${isAct ? 'text-purple-300 bg-purple-500/10' : 'text-slate-400'}`}>
                  <span>{s.icon || '●'}</span>
                  <span className="truncate">{s.text}</span>
                </button>
              );
            })}
            <div className="w-full h-px bg-white/10 my-1" />
            <button onClick={scrollToBottom} className="p-2 rounded-lg text-slate-500 hover:text-white w-full text-left text-xs" aria-label="Scroll to bottom">⬇ Bottom</button>
            <button onClick={() => setMobileOpen(false)} className="mt-1 text-[9px] text-slate-600 w-full text-center">✕</button>
          </div>
        )}
      </>
    );
  }

  // ─── Desktop View ──────────────────────────────────────
  const trackHeight = 200;
  const thumbHeight = isDragging ? 40 : isHovering ? 36 : 28;
  const thumbTop = scrollPct * (trackHeight - thumbHeight);

  return (
    <div
      className="fixed z-[9999] flex flex-col items-center gap-1.5"
      style={{ right: 10, top: '50%', transform: 'translateY(-50%)', transition: 'opacity 0.3s', opacity: isDragging ? 1 : 0.7 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top button */}
      <button onClick={scrollToTop} className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }} aria-label="Scroll to top">
        <svg viewBox="0 0 16 16" fill="#A78BFA" className="w-3 h-3"><path fillRule="evenodd" d="M8 12a1 1 0 001-1V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L7 6.414V11a1 1 0 001 1z" /></svg>
      </button>

      {/* Track with draggable thumb */}
      <div
        ref={trackRef}
        className="relative rounded-full cursor-pointer select-none"
        style={{
          width: 14,
          height: trackHeight,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(139,92,246,0.12)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleTrackClick}
        onTouchStart={handleTrackTouchStart}
        role="slider"
        aria-label="Scroll position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); scrollToPct(Math.max(0, scrollPct - 0.1)); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); scrollToPct(Math.min(1, scrollPct + 0.1)); }
        }}
      >
        {/* Progress fill */}
        <div className="absolute bottom-0 left-0 right-0 rounded-full pointer-events-none" style={{
          height: `${pct}%`,
          background: 'linear-gradient(180deg, #22D3EE, #8B5CF6)',
          boxShadow: '0 0 12px rgba(139,92,246,0.25)',
          transition: reducedMotion ? 'none' : 'height 0.15s ease-out',
        }} />

        {/* Draggable thumb */}
        <div
          ref={thumbRef}
          className="absolute left-1/2 -translate-x-1/2 rounded-full cursor-grab active:cursor-grabbing transition-all"
          style={{
            top: thumbTop,
            width: isDragging ? 10 : isHovering ? 9 : 7,
            height: thumbHeight,
            background: isDragging
              ? 'linear-gradient(180deg, #A78BFA, #8B5CF6)'
              : 'linear-gradient(180deg, #8B5CF6, #7C3AED)',
            boxShadow: isDragging
              ? '0 0 20px rgba(139,92,246,0.6), 0 0 8px rgba(139,92,246,0.3)'
              : isHovering
                ? '0 0 12px rgba(139,92,246,0.4)'
                : '0 0 6px rgba(139,92,246,0.2)',
            transition: reducedMotion || isDragging ? 'none' : 'width 0.2s, height 0.2s, box-shadow 0.2s',
          }}
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbTouchStart}
          aria-label="Drag to scroll"
        />

        {/* Section markers */}
        {sections.map((s, i) => {
          const pos = (i / Math.max(sections.length - 1, 1)) * 100;
          const isAct = s.id === active;
          return (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className="absolute left-1/2 -translate-x-1/2 rounded-full transition-all hover:scale-150"
              style={{
                bottom: `${pos}%`,
                width: isAct ? 6 : 4,
                height: isAct ? 6 : 4,
                background: isAct ? '#A78BFA' : i < activeIdx ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.15)',
                boxShadow: isAct ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
                zIndex: 10,
              }}
              aria-label={`Scroll to ${s.text}`} />
          );
        })}
      </div>

      {/* Bottom button */}
      <button onClick={scrollToBottom} className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }} aria-label="Scroll to bottom">
        <svg viewBox="0 0 16 16" fill="#A78BFA" className="w-3 h-3"><path fillRule="evenodd" d="M8 4a1 1 0 011 1v4.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L7 9.586V5a1 1 0 011-1z" /></svg>
      </button>

      {/* Percentage */}
      <div className="text-[8px] font-mono text-center select-none" style={{ color: pct > 0 ? '#A78BFA' : 'rgba(255,255,255,0.2)', width: 36 }}>{pct}%</div>
    </div>
  );
}

// ─── Settings Panel Export ─────────────────────────────────
export function ScrollNavSettings() {
  const { enabled, toggle } = useScrollNavSettings();
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-text">Custom Scroll Navigator</span>
        <p className="text-[10px] text-text3">Floating scroll indicator with section markers</p>
      </div>
      <button onClick={toggle} className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-primary' : 'bg-gray-600'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-5.5' : 'left-0.5'}`}
          style={{ left: enabled ? 22 : 2 }} />
      </button>
    </div>
  );
}