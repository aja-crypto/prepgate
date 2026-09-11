import { useEffect, useRef, useState } from 'react';

// Shared single-shot in-view hook (no animation library).
function useInViewOnce(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const o = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); o.disconnect(); } },
      options || { threshold: 0.1 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, inView];
}

export function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '', className = '' }) {
  const [count, setCount] = useState(0);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => {
      if (reduced) { setCount(end); setShown(true); return; }
      setShown(true);
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * end));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };
    if (typeof IntersectionObserver === 'undefined') { start(); return; }
    const o = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { start(); o.disconnect(); } },
      { rootMargin: '100px' }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [end, duration]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function AnimatedProgressBar({ value, max = 100, color = '#a855f7', label, showPercent = true }) {
  const [ref, isInView] = useInViewOnce({ threshold: 0.1 });

  return (
    <div ref={ref} className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text2">{label}</span>
          {showPercent && <span className="text-text3">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: isInView ? `${(value / max) * 100}%` : '0%',
            transition: 'width 1.5s ease-out',
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: '0 0 8px rgba(139,92,246,0.3)',
          }}
        />
      </div>
    </div>
  );
}

export function PulseGlow({ color = '#a855f7', size = 200, blur = 40, duration = 4 }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none animate-pulse"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: 0.5,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export function FloatingCard({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const o = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setShown(true), delay * 1000); o.disconnect(); } },
      { rootMargin: '-50px' }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, className = '', glowColor = null }) {
  return (
    <div
      className={`relative transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-0.5 ${className}`}
    >
      {glowColor && (
        <div
          className="absolute -inset-1 rounded-2xl opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )}
      <div className="relative backdrop-blur-xl bg-bg-2/60 border border-border rounded-2xl">
        {children}
      </div>
    </div>
  );
}

export function NeuralParticles({ count = 30 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-purple-500/30 animate-pulse"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
