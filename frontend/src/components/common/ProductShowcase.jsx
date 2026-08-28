import { useState, useEffect, useRef, memo, useCallback } from 'react';

const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const FEATURES = [
  {
    id: 'ai-assistant',
    badge: '💬',
    tag: '01',
    title: 'AI Assistant',
    desc: 'Ask anything — concept explanations, study planning, and instant problem solving.',
    highlights: ['Concept explanations on demand', 'Personalised study planning', 'Instant step-by-step solutions'],
    href: '/mentor',
    cta: 'Try AI Assistant',
    color: '#A78BFA',
    rgb: '167,139,250',
    image: '/showcase/ai-assistant.png',
  },
  {
    id: 'predictor',
    badge: '🔮',
    tag: '02',
    title: 'NEXA Predictor',
    desc: 'Know your chances at IITs, NITs, and top colleges — updated with live cutoff data.',
    highlights: ['Live cutoff database', 'College & branch ranking', 'Personalised success score'],
    href: '/opportunity-predictor',
    cta: 'Try Predictor',
    color: '#818CF8',
    rgb: '129,140,248',
    image: '/showcase/predictor.png',
  },
  {
    id: 'learning-hub',
    badge: '📚',
    tag: '03',
    title: 'Learning Hub',
    desc: '120+ curated videos, roadmaps, resources — all organized by subject and topic.',
    highlights: ['120+ curated video lectures', 'Subject & topic roadmaps', 'Formula sheets & notes'],
    href: '/learning-hub',
    cta: 'Explore Hub',
    color: '#22D3EE',
    rgb: '34,211,238',
    image: '/showcase/learning-hub.png',
  },
  {
    id: 'ai-mentor',
    badge: '🤖',
    tag: '04',
    title: 'AI Mentor',
    desc: 'Personalized daily coaching — weak topic analysis, revision plans, and progress tracking.',
    highlights: ['Weak topic analysis', 'Daily revision plans', 'Progress tracking'],
    href: '/mentor',
    cta: 'Meet Your Mentor',
    color: '#C084FC',
    rgb: '192,132,252',
    image: '/showcase/ai-mentor.png',
  },
  {
    id: 'gate-vault',
    badge: '🔥',
    tag: '05',
    title: 'GateVault',
    desc: 'Monthly Top 50 curated questions — test yourself against the best.',
    highlights: ['Top 50 monthly questions', 'Real exam difficulty', 'Ranked against peers'],
    href: '/gate-vault',
    cta: 'Enter GateVault',
    color: '#F472B6',
    rgb: '244,114,182',
    image: '/showcase/gate-vault.png',
  },
];

const N = FEATURES.length;
const BEHIND_Y = [12, 24, 36, 48];
const BEHIND_OP = [0.18, 0.12, 0.07, 0.03];
const STICKY_TOP = 0;
const NAV_CLEARANCE = 140;
const TRANSITION_MS = 750;
const POST_TRANSITION_COOLDOWN = 150;
const DISENGAGE_COOLDOWN_MS = 300;
const WHEEL_THRESHOLD = 55;
const SWIPE_THRESHOLD = 42;
const INDICATOR_PITCH = 44; // 36px row + 8px gap-2

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// cubic-bezier(0.22,1,0.36,1) — the single easing for the whole state machine.
// Fast-start: incoming card crosses above outgoing ~15% in, no intermix/ghosting.
function easeShow(t) {
  const x = clamp01(t);
  const bx = (u) => {
    const v = 1 - u;
    return 3 * u * v * v * 0.22 + 3 * u * u * v * 0.36 + u * u * u;
  };
  const by = (u) => {
    const v = 1 - u;
    return 3 * u * v * v + 3 * u * u * v + u * u * u;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const m = (lo + hi) / 2;
    if (bx(m) < x) lo = m;
    else hi = m;
  }
  return by((lo + hi) / 2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function shotOpacity(cardIndex, frontIndex, progress, direction) {
  if (direction === 0) return cardIndex === frontIndex ? 1 : 0;
  const from = Math.max(0, Math.min(frontIndex, N - 1));
  const to = Math.max(0, Math.min(from + direction, N - 1));
  if (cardIndex !== from && cardIndex !== to) return 0;
  const MID = 0.5;
  const BLEND = 0.05;
  if (progress <= MID - BLEND) return cardIndex === from ? 1 : 0;
  if (progress >= MID + BLEND) return cardIndex === to ? 1 : 0;
  if (cardIndex === from) return clamp01(1 - (progress - (MID - BLEND)) / (2 * BLEND));
  return clamp01((progress - (MID - BLEND)) / (2 * BLEND));
}

function textOpacity(cardIndex, frontIndex, progress, direction) {
  if (direction === 0) return cardIndex === frontIndex ? 1 : 0;
  const from = Math.max(0, Math.min(frontIndex, N - 1));
  const to = Math.max(0, Math.min(from + direction, N - 1));
  if (cardIndex !== from && cardIndex !== to) return 0;
  if (progress <= 0.35) return cardIndex === from ? 1 : 0;
  if (progress >= 0.65) return cardIndex === to ? 1 : 0;
  if (cardIndex === from) return clamp01(1 - (progress - 0.35) / 0.3);
  return clamp01((progress - 0.35) / 0.3);
}

function textYOffset(cardIndex, frontIndex, progress, direction) {
  if (direction === 0) return cardIndex === frontIndex ? 0 : 14;
  const from = Math.max(0, Math.min(frontIndex, N - 1));
  const to = Math.max(0, Math.min(from + direction, N - 1));
  if (cardIndex !== from && cardIndex !== to) return 14;
  const e = easeShow(progress);
  if (cardIndex === from) return -10 * e;
  return 14 * (1 - e);
}

function stackState(i, frontIndex) {
  if (i >= frontIndex) return null;
  const depth = frontIndex - i - 1;
  const d = Math.min(depth, BEHIND_Y.length - 1);
  return {
    y: -BEHIND_Y[d],
    op: BEHIND_OP[d],
    z: 20 + d,
    shot: 0,
    textOp: 0,
    textY: 0,
  };
}

function layoutAt(i, frontIndex, progress, direction) {
  const clampedFront = Math.max(0, Math.min(frontIndex, N - 1));
  if (direction === 0) {
    if (i === clampedFront) {
      return { y: 0, op: 1, z: 100, shot: 1, textOp: 1, textY: 0 };
    }
    const behind = stackState(i, clampedFront);
    if (behind) return behind;
    return { y: 64, op: 0, z: 0, shot: 0, textOp: 0, textY: 0 };
  }

  const e = easeShow(progress);
  const from = clampedFront;
  const to = Math.max(0, Math.min(clampedFront + direction, N - 1));

  if (direction === 1) {
    if (i === from) {
      return {
        y: lerp(0, -BEHIND_Y[0], e),
        op: lerp(1, BEHIND_OP[0], e),
        z: lerp(100, 20, e),
        shot: shotOpacity(i, from, progress, direction),
        textOp: textOpacity(i, from, progress, direction),
        textY: textYOffset(i, from, progress, direction),
      };
    }
    if (i === to) {
      return {
        y: lerp(64, 0, e),
        op: lerp(0, 1, e),
        z: lerp(30, 100, e),
        shot: shotOpacity(i, from, progress, direction),
        textOp: textOpacity(i, from, progress, direction),
        textY: textYOffset(i, from, progress, direction),
      };
    }
    if (i < from) {
      const behind = stackState(i, from);
      if (behind) {
        const deeper = stackState(i, to);
        if (deeper) {
          return {
            y: lerp(behind.y, deeper.y, e),
            op: lerp(behind.op, deeper.op, e),
            z: behind.z,
            shot: 0,
            textOp: 0,
            textY: 0,
          };
        }
      }
      return behind || { y: 64, op: 0, z: 0, shot: 0, textOp: 0, textY: 0 };
    }
    return { y: 64, op: 0, z: 0, shot: 0, textOp: 0, textY: 0 };
  }

  if (i === from) {
    return {
      y: lerp(0, 64, e),
      op: lerp(1, 0, e),
      z: lerp(100, 10, e),
      shot: shotOpacity(i, from, progress, direction),
      textOp: textOpacity(i, from, progress, direction),
      textY: textYOffset(i, from, progress, direction),
    };
  }
  if (i === to) {
    return {
      y: lerp(-BEHIND_Y[0], 0, e),
      op: lerp(BEHIND_OP[0], 1, e),
      z: lerp(60, 100, e),
      shot: shotOpacity(i, from, progress, direction),
      textOp: textOpacity(i, from, progress, direction),
      textY: textYOffset(i, from, progress, direction),
    };
  }
  if (i < to) {
    return stackState(i, to) || { y: -BEHIND_Y[3], op: BEHIND_OP[3], z: 21, shot: 0, textOp: 0, textY: 0 };
  }
  return { y: 64, op: 0, z: 0, shot: 0, textOp: 0, textY: 0 };
}

function isSectionInView(wrap, vh) {
  if (!wrap) return false;
  const rect = wrap.getBoundingClientRect();
  const topRatio = rect.top / vh;
  const bottomRatio = rect.bottom / vh;
  return topRatio >= -0.05 && topRatio <= 0.25 && bottomRatio >= 0.75;
}

export default function ProductShowcase() {
  const [ready, setReady] = useState(false);
  const [shownIndex, setShownIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);

  const wrapRef = useRef(null);
  const stickyRef = useRef(null);
  const cardEls = useRef([]);
  const textEls = useRef([]);
  const shotEls = useRef([]);
  const indicatorRef = useRef(null);
  const indicatorBarRefs = useRef([]);

  const engagedRef = useRef(false);
  const indexRef = useRef(0);
  const transitionRef = useRef({ active: false, from: 0, direction: 0, start: 0 });
  const wheelAccumRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const postTransitionUntilRef = useRef(0);
  const touchStartYRef = useRef(null);
  const touchStartTimeRef = useRef(0);
  const rafRef = useRef(0);
  const rafRunningRef = useRef(false);
  const mountedRef = useRef(true);

  const emitShowcaseState = useCallback((state) => {
    try {
      window.dispatchEvent(new CustomEvent('gatenexa:showcase', { detail: state }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    let done = 0;
    FEATURES.forEach((f) => {
      const im = new Image();
      im.onload = im.onerror = () => {
        done += 1;
        if (done === FEATURES.length && mountedRef.current) setReady(true);
      };
      im.src = f.image;
    });
    if (mountedRef.current) setReady(true);
  }, []);

  const cacheShotEls = useCallback(() => {
    cardEls.current.forEach((card, i) => {
      if (!card) return;
      const shots = Array.from(card.querySelectorAll('[data-showcase-shot]'));
      shotEls.current[i] = shots;
    });
  }, []);

  const renderFrame = useCallback(() => {
    const tr = transitionRef.current;
    let dir = tr.active ? tr.direction : 0;
    let base = tr.active ? tr.from : indexRef.current;
    let p = 0;

    if (tr.active) {
      p = clamp01((performance.now() - tr.start) / TRANSITION_MS);
      if (p >= 1) {
        const finalIndex = Math.max(0, Math.min(tr.from + tr.direction, N - 1));
        indexRef.current = finalIndex;
        transitionRef.current = { active: false, from: 0, direction: 0, start: 0 };
        postTransitionUntilRef.current = performance.now() + POST_TRANSITION_COOLDOWN;
        wheelAccumRef.current = 0;
        if (mountedRef.current) setShownIndex(finalIndex);
        dir = 0;
        base = finalIndex;
        p = 0;
      }
    }

    const front = dir !== 0 ? base + (dir > 0 ? p : -p) : base;
    const peFront = dir !== 0 ? (dir > 0 ? (p >= 0.5 ? base + 1 : base) : (p >= 0.5 ? base - 1 : base)) : base;
    const bars = indicatorBarRefs.current;
    for (let i = 0; i < N; i++) {
      const bar = bars[i];
      if (!bar) continue;
      const fill = dir !== 0 ? clamp01(front - i) : (i <= base ? 1 : 0);
      bar.style.transform = `scaleX(${fill})`;
    }

    for (let i = 0; i < N; i++) {
      const el = cardEls.current[i];
      if (!el) continue;
      const s = layoutAt(i, base, p, dir);
      el.style.opacity = String(s.op);
      el.style.transform = `translate3d(0, ${s.y}px, 0)`;
      el.style.zIndex = String(Math.round(s.z));
      el.style.pointerEvents = i === peFront ? 'auto' : 'none';

      const shots = shotEls.current[i] || [];
      shots.forEach((shot) => {
        shot.style.opacity = String(s.shot);
        shot.style.visibility = s.shot > 0.01 ? 'visible' : 'hidden';
      });

      const textEl = textEls.current[i];
      if (textEl) {
        textEl.style.opacity = String(s.textOp);
        textEl.style.transform = `translate3d(0, ${s.textY}px, 0)`;
      }
    }

    const ind = indicatorRef.current;
    if (ind) {
      const drawIndex = base + (dir !== 0 ? dir * easeShow(p) : 0);
      ind.style.transform = `translate3d(0, ${drawIndex * INDICATOR_PITCH + 6}px, 0)`;
    }
  }, []);

  const startRafLoop = useCallback(() => {
    if (rafRunningRef.current) return;
    rafRunningRef.current = true;
    const loop = () => {
      if (!mountedRef.current) return;
      renderFrame();
      const keepGoing =
        engagedRef.current &&
        (transitionRef.current.active ||
          performance.now() < postTransitionUntilRef.current + 250);
      if (keepGoing) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRunningRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [renderFrame]);

  const stopRafLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRunningRef.current = false;
  }, []);

  const disengage = useCallback((reason) => {
    if (!engagedRef.current) return;
    if (transitionRef.current.active) {
      indexRef.current = Math.max(0, Math.min(transitionRef.current.from + transitionRef.current.direction, N - 1));
      if (mountedRef.current) setShownIndex(indexRef.current);
    }
    engagedRef.current = false;
    transitionRef.current = { active: false, from: 0, direction: 0, start: 0 };
    wheelAccumRef.current = 0;
    lastWheelTimeRef.current = 0;
    postTransitionUntilRef.current = 0;
    touchStartYRef.current = null;
    cooldownUntilRef.current = performance.now() + DISENGAGE_COOLDOWN_MS;
    if (mountedRef.current) {
      setShownIndex(indexRef.current);
      setEngaged(false);
    }
    emitShowcaseState({ engaged: false });
    stopRafLoop();
  }, [emitShowcaseState, stopRafLoop]);

  const engage = useCallback(() => {
    if (engagedRef.current) return;
    if (performance.now() < cooldownUntilRef.current) return;
    const wrap = wrapRef.current;
    if (!wrap || !isSectionInView(wrap, window.innerHeight)) return;

    engagedRef.current = true;
    transitionRef.current = { active: false, from: 0, direction: 0, start: 0 };
    wheelAccumRef.current = 0;
    postTransitionUntilRef.current = performance.now() + 250;
    if (mountedRef.current) {
      setShownIndex(indexRef.current);
      setEngaged(true);
    }
    emitShowcaseState({ engaged: true });
    cacheShotEls();
    startRafLoop();
  }, [emitShowcaseState, cacheShotEls, startRafLoop]);

  const startCardTransition = useCallback((direction) => {
    if (transitionRef.current.active) return false;
    const idx = indexRef.current;
    const next = idx + direction;
    if (next < 0 || next >= N) return false;

    transitionRef.current = {
      active: true,
      from: idx,
      direction: direction,
      start: performance.now(),
    };
    wheelAccumRef.current = 0;
    startRafLoop();
    return true;
  }, [startRafLoop]);

  useEffect(() => {
    if (!ready) return;
    cacheShotEls();
    renderFrame();
  }, [ready, cacheShotEls, renderFrame]);

  useEffect(() => {
    if (!ready) return;

    let scrollRAF = null;
    const onScroll = () => {
      if (scrollRAF === null) {
        scrollRAF = requestAnimationFrame(() => {
          if (!engagedRef.current) {
            engage();
          }
          scrollRAF = null;
        });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && engagedRef.current) {
          disengage('section-left-viewport');
        }
      },
      { threshold: 0 }
    );

    const wrap = wrapRef.current;
    if (wrap) observer.observe(wrap);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
        scrollRAF = null;
      }
      observer.disconnect();
      if (engagedRef.current) {
        disengage('unmount');
      }
    };
  }, [ready, engage, disengage]);

  useEffect(() => {
    if (!ready) return;

    const onWheel = (e) => {
      if (!engagedRef.current) return;

      const now = performance.now();
      const idx = indexRef.current;
      const delta = e.deltaY;

      if (delta > 0 && idx >= N - 1) {
        disengage('forward-past-last');
        return;
      }
      if (delta < 0 && idx <= 0) {
        disengage('backward-past-first');
        return;
      }

      if (e.cancelable) e.preventDefault();

      if (transitionRef.current.active) return;

      if (now < postTransitionUntilRef.current) return;

      const timeSinceLast = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      if (timeSinceLast > 150) {
        wheelAccumRef.current = 0;
      }

      wheelAccumRef.current += delta;

      if (wheelAccumRef.current >= WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        startCardTransition(1);
      } else if (wheelAccumRef.current <= -WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        startCardTransition(-1);
      }
    };

    const onTouchStart = (e) => {
      if (!engagedRef.current) return;
      touchStartYRef.current = e.touches[0]?.clientY ?? null;
      touchStartTimeRef.current = performance.now();
    };

    const onTouchMove = (e) => {
      if (!engagedRef.current || touchStartYRef.current == null) return;
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = (e) => {
      if (!engagedRef.current || touchStartYRef.current == null) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
      const dy = touchStartYRef.current - endY;
      const dt = performance.now() - touchStartTimeRef.current;
      touchStartYRef.current = null;

      const absDy = Math.abs(dy);
      const velocity = dt > 0 ? absDy / dt : 0;
      const fastSwipe = velocity > 0.35 && absDy > SWIPE_THRESHOLD * 0.5;
      const normalSwipe = absDy > SWIPE_THRESHOLD;

      const idx = indexRef.current;

      if (dy > 0 && (normalSwipe || fastSwipe)) {
        if (idx >= N - 1) {
          disengage('touch-forward-past-last');
          return;
        }
        if (!transitionRef.current.active) startCardTransition(1);
      } else if (dy < 0 && (normalSwipe || fastSwipe)) {
        if (idx <= 0) {
          disengage('touch-backward-past-first');
          return;
        }
        if (!transitionRef.current.active) startCardTransition(-1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [ready, disengage, startCardTransition]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const activeIndex = shownIndex;

  return (
    <section
      ref={wrapRef}
      className="product-showcase relative isolate"
      style={{ height: '100vh', touchAction: engaged ? 'none' : 'pan-y' }}
      aria-label="Product showcase"
    >
      <style>{`
        @media (min-width: 1024px) {
          .product-showcase .showcase-layout-mobile { display: none !important; }
          .product-showcase .showcase-layout-desktop { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .product-showcase .showcase-layout-desktop { display: none !important; }
          .product-showcase .showcase-layout-mobile { display: flex !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .product-showcase * { transition-duration: 0.001ms !important; }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: engaged
            ? 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(5,8,22,0.75) 0%, rgba(5,8,22,0.44) 55%, rgba(5,8,22,0.18) 100%)'
            : 'transparent',
          opacity: ready ? 1 : 0,
          transition: `opacity .8s ${EASE}`,
          backdropFilter: engaged ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: engaged ? 'blur(2px)' : 'none',
        }}
      />

      <div
        ref={stickyRef}
        className="sticky h-screen overflow-hidden z-[2]"
        style={{ top: STICKY_TOP, contain: 'layout paint' }}
      >
        <div
          className="relative mx-auto flex h-full w-full max-w-[1280px] items-center justify-center px-4 lg:px-8"
          style={{ paddingTop: NAV_CLEARANCE, paddingBottom: 56 }}
        >
          <div
            className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:left-6 lg:flex xl:left-8 z-[60]"
            style={{ opacity: ready ? 1 : 0, transition: `opacity .6s ${EASE}` }}
          >
            <div className="relative">
              <div
                ref={indicatorRef}
                className="absolute left-[11px] top-0 h-6 w-[2px] rounded-full"
                style={{
                  background: 'linear-gradient(180deg, #A78BFA, #22D3EE)',
                  willChange: 'transform',
                  transition: 'none',
                }}
              />
              {FEATURES.map((f, i) => {
                const isCur = i === shownIndex;
                const done = i < shownIndex;
                return (
                  <div key={f.id} className="flex items-center gap-3 h-9">
                    <div
                      className="relative flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold"
                      style={{
                        background: done
                          ? `linear-gradient(135deg, ${f.color}CC, ${f.color}88)`
                          : isCur
                            ? `linear-gradient(135deg, ${f.color}, ${f.color}AA)`
                            : 'rgba(255,255,255,0.04)',
                        color: done || isCur ? '#fff' : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${done || isCur ? `${f.color}33` : 'rgba(255,255,255,0.04)'}`,
                        boxShadow: isCur ? `0 2px 8px rgba(${f.rgb},0.1)` : 'none',
                        transition: `all .6s ${EASE}`,
                        fontWeight: 700,
                        transform: isCur ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {f.tag}
                    </div>
                    <div className="h-[2px] w-8 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        ref={(el) => { indicatorBarRefs.current[i] = el; }}
                        className="h-full rounded-full"
                        style={{
                          transformOrigin: '0% 50%',
                          transform: 'scaleX(0)',
                          background: `linear-gradient(90deg, ${f.color}CC, ${f.color})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="relative w-full"
            style={{
              height: 'min(calc(100vh - 200px), 740px)',
              maxWidth: 1200,
              perspective: 1600,
              perspectiveOrigin: '50% 50%',
              contain: 'layout style',
            }}
          >
            {FEATURES.map((f, i) => (
              <CardLayer
                key={f.id}
                feature={f}
                isActive={i === activeIndex}
                layerRef={(el) => { cardEls.current[i] = el; }}
                textRef={(el) => { textEls.current[i] = el; }}
                ready={ready}
              />
            ))}
          </div>

          <div
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2.5 z-[60]"
            style={{ opacity: ready ? 1 : 0, transition: `opacity .6s ${EASE}` }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="relative h-2 w-8 overflow-hidden rounded-full"
                style={{ background: 'rgba(255,255,255,0.09)', transition: 'none' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    transformOrigin: '0% 50%',
                    transform: `scaleX(${i === shownIndex ? 1 : i < shownIndex ? 0.45 : 0})`,
                    background: i <= shownIndex
                      ? `linear-gradient(90deg, ${f.color}, ${f.color}BB)`
                      : 'transparent',
                    transition: `transform .55s ${EASE}`,
                    boxShadow: i === shownIndex ? `0 0 10px rgba(${f.rgb},0.15)` : 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const CardLayer = memo(
  ({ feature, isActive, ready, layerRef, textRef }) => (
    <div
      ref={layerRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 28,
        pointerEvents: isActive ? 'auto' : 'none',
        visibility: ready ? 'visible' : 'hidden',
        zIndex: 10,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'layout paint',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 28,
          background: isActive
            ? 'linear-gradient(155deg, rgba(24,20,44,0.96) 0%, rgba(12,14,32,0.97) 50%, rgba(14,18,38,0.96) 100%)'
            : 'linear-gradient(155deg, rgba(9,11,24,0.98) 0%, rgba(7,9,20,0.99) 100%)',
          border: isActive
            ? '1px solid rgba(255,255,255,0.09)'
            : '1px solid rgba(255,255,255,0.04)',
          boxShadow: isActive
            ? '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
            : 'inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: 28 }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 28,
            background: isActive
              ? 'linear-gradient(135deg, rgba(167,139,250,0.035) 0%, transparent 35%), linear-gradient(315deg, rgba(34,211,238,0.028) 0%, transparent 40%)'
              : 'transparent',
            transition: `opacity .8s ${EASE}`,
            opacity: isActive ? 1 : 0,
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[40%]"
          style={{
            borderRadius: '28px 28px 0 0',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 100%)',
            opacity: isActive ? 1 : 0.3,
            transition: `opacity .8s ${EASE}`,
          }}
        />
      </div>

      <DesktopCardBody feature={feature} isActive={isActive} textRef={textRef} />
      <MobileCardBody feature={feature} isActive={isActive} />
    </div>
  ),
  (p, n) => p.isActive === n.isActive && p.ready === n.ready
);

const DesktopCardBody = memo(function DesktopCardBody({ feature, isActive, textRef }) {
  return (
    <div className="showcase-layout-desktop absolute inset-0" style={{ borderRadius: 28 }}>
      <div
        ref={textRef}
        className="flex h-full w-[24%] shrink-0 flex-col justify-center px-8 py-7 xl:px-10"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="text-2xl"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
          >
            {feature.badge}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: feature.color }}
          >
            Feature {feature.tag}
          </span>
        </div>
        <h3
          className="mb-3 text-[1.75rem] font-bold leading-[1.1] tracking-tight text-white xl:text-[2.15rem]"
          style={{ textShadow: '0 1px 12px rgba(0,0,0,0.25)' }}
        >
          {feature.title}
        </h3>
        <p className="mb-6 text-[0.95rem] leading-[1.65] text-[#a1a7b3]">
          {feature.desc}
        </p>
        <ul className="mb-8 space-y-3">
          {feature.highlights.map((h) => (
            <li key={h} className="flex items-center gap-3 text-sm text-gray-300 leading-relaxed">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `linear-gradient(135deg, rgba(${feature.rgb},0.18), rgba(${feature.rgb},0.06))`,
                  border: `1px solid rgba(${feature.rgb},0.25)`,
                }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" style={{ color: feature.color }}>
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.59l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
              </div>
              {h}
            </li>
          ))}
        </ul>
        <a
          href={feature.href || '/register'}
          className="group inline-flex items-center gap-2.5 self-start rounded-2xl px-6 py-3 text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${feature.color}, ${feature.color}DD 60%, ${feature.color}BB 100%)`,
            boxShadow: `0 4px 14px rgba(${feature.rgb},0.2), 0 1px 3px rgba(0,0,0,0.15)`,
            transform: 'translate3d(0,0,0)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate3d(0,-2px,0)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate3d(0,0,0)'; }}
        >
          {feature.cta}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>

      <div className="flex h-full w-[76%] items-stretch justify-center px-6 py-5 xl:px-8 xl:py-6">
        <DeviceFrame color={feature.color} rgb={feature.rgb} image={feature.image} title={feature.title} fillHeight />
      </div>
    </div>
  );
});

const MobileCardBody = memo(function MobileCardBody({ feature, isActive }) {
  return (
    <div
      className="showcase-layout-mobile absolute inset-0 flex-col overflow-hidden px-5 py-4"
      style={{
        borderRadius: 28,
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translate3d(0,0,0)' : 'translate3d(0,12px,0)',
        transition: isActive ? `opacity .55s ${EASE}, transform .55s ${EASE}` : 'none',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{feature.badge}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: feature.color }}>
          Feature {feature.tag}
        </span>
      </div>
      <h3 className="mb-1.5 text-[1.35rem] font-bold leading-tight tracking-tight text-white">
        {feature.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-[0.85rem] leading-relaxed text-gray-400">
        {feature.desc}
      </p>

      <div className="mb-3.5 min-h-0 flex-1 w-full">
        <DeviceFrame color={feature.color} rgb={feature.rgb} image={feature.image} title={feature.title} compact fillHeight mobile />
      </div>

      <ul className="mb-3.5 space-y-2 max-h-[4.5rem] overflow-y-auto">
        {feature.highlights.slice(0, 2).map((h) => (
          <li key={h} className="flex items-center gap-2 text-[0.8rem] text-gray-300">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0" style={{ color: feature.color }}>
              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.59l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
            </svg>
            {h}
          </li>
        ))}
      </ul>

      <a
        href={feature.href || '/register'}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${feature.color}, ${feature.color}DD)`,
          boxShadow: `0 4px 14px rgba(${feature.rgb},0.18)`,
        }}
      >
        {feature.cta}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  );
});

function DeviceFrame({ color, rgb, image, title, compact = false, fillHeight = false, mobile = false }) {
  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-2xl"
      style={{
        height: fillHeight ? '100%' : 'auto',
        maxHeight: fillHeight ? '100%' : undefined,
        background: 'linear-gradient(180deg, rgba(15,18,36,0.98), rgba(8,10,22,0.98))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -16px 48px rgba(0,0,0,0.22)',
        transform: 'translate3d(0,0,0)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-2 px-3.5 py-2.5"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.2)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.2)' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.2)' }} />
        </div>
        <span className="flex-1" />
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-0.5"
          style={{
            background: `rgba(${rgb},0.08)`,
            border: `1px solid rgba(${rgb},0.15)`,
          }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 6px rgba(${rgb},0.5)` }}
          />
          <span className="text-[9.5px] font-semibold tracking-wide" style={{ color }}>
            {title}
          </span>
        </div>
        <span className="flex-1" />
        <div
          className="h-5 w-5 rounded-md"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
        />
      </div>
      <div
        className="relative min-h-0 w-full flex-1 overflow-hidden"
        style={{ aspectRatio: fillHeight ? undefined : '3/2' }}
      >
        <div
          className="h-full w-full"
          data-showcase-shot
          style={{
            opacity: 1,
            visibility: 'visible',
            backfaceVisibility: 'hidden',
            transition: 'opacity 280ms ease, transform 280ms ease',
          }}
        >
          <img
            src={image}
            alt={title || ''}
            decoding="async"
            draggable={false}
            loading="eager"
            fetchPriority="high"
            onError={(e) => console.error('[Showcase] image failed:', e.currentTarget.src)}
            className="block h-full w-full object-cover object-top select-none"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'translate3d(0,0,0)',
              WebkitUserDrag: 'none',
              userSelect: 'none',
              imageRendering: 'auto',
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(to top, rgba(6,8,20,0.4) 0%,
              transparent 35%,
              transparent 65%,
              rgba(${rgb},0.04) 100%
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${rgb},0.12), transparent)`,
          }}
        />
      </div>
    </div>
  );
}
