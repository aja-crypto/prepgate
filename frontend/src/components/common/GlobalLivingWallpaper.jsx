import { useRef, useEffect, useState } from 'react';

// ─── ZONE CONFIGURATION ──────────────────────────────────────────────
// Each zone activates different visual effects based on scroll percentage
const ZONES = [
  { id: 'hero',      start: 0,    end: 0.12, hue: [139, 92, 246],  mode: 'neural'  },
  { id: 'stats',     start: 0.12, end: 0.20, hue: [99, 102, 241],  mode: 'streams' },
  { id: 'features',  start: 0.20, end: 0.36, hue: [124, 58, 237],  mode: 'streams' },
  { id: 'workflow',  start: 0.36, end: 0.48, hue: [6, 182, 212],   mode: 'grid'    },
  { id: 'community', start: 0.48, end: 0.62, hue: [236, 72, 153],  mode: 'glow'    },
  { id: 'ai',        start: 0.62, end: 0.74, hue: [139, 92, 246],  mode: 'pulse'   },
  { id: 'content',   start: 0.74, end: 0.84, hue: [99, 102, 241],  mode: 'grid'    },
  { id: 'roadmap',   start: 0.84, end: 1.01, hue: [245, 158, 11],  mode: 'glow'    },
];

function getZoneIntensity(scrollPct, zone) {
  const fadeIn = 0.06;
  const fadeOut = 0.06;
  if (scrollPct < zone.start - fadeIn) return 0;
  if (scrollPct > zone.end + fadeOut) return 0;
  let intensity = 1;
  if (scrollPct < zone.start) intensity = (scrollPct - zone.start + fadeIn) / fadeIn;
  if (scrollPct > zone.end) intensity = 1 - (scrollPct - zone.end) / fadeOut;
  return Math.max(0, Math.min(1, intensity));
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function GlobalLivingWallpaper() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    nodes: [], scrollY: 0, mouseX: 0, mouseY: 0,
    width: 0, height: 0, raf: 0, startTime: 0,
    reducedMotion: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    s.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.startTime = performance.now();

    // ─── RESIZE ──────────────────────────────────────────────────
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.width = window.innerWidth;
      s.height = window.innerHeight;
      canvas.width = s.width * dpr;
      canvas.height = s.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // ─── CREATE NODES ────────────────────────────────────────────
    const isMobile = s.width < 768;
    const NODE_COUNT = isMobile ? 35 : 65;
    const CONN_DIST = isMobile ? 140 : 180;

    s.nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      s.nodes.push({
        x: Math.random() * s.width,
        y: Math.random() * s.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        size: 0.8 + Math.random() * 1.4,
        hue: Math.random() > 0.55 ? 0 : 1, // 0 = purple, 1 = cyan
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ─── EVENT HANDLERS ─────────────────────────────────────────
    function onScroll() { s.scrollY = window.scrollY; }
    function onMouse(e) { s.mouseX = e.clientX; s.mouseY = e.clientY; }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });
    onScroll();

    // ─── ANIMATION LOOP ─────────────────────────────────────────
    function animate(now) {
      const t = (now - s.startTime) / 1000;
      const { width: W, height: H, nodes, scrollY, mouseX, mouseY } = s;
      const maxScroll = document.documentElement.scrollHeight - H;
      const scrollPct = maxScroll > 0 ? scrollY / maxScroll : 0;
      const parallax = scrollY * 0.04;
      const slow = s.reducedMotion ? 0.1 : 1;

      ctx.clearRect(0, 0, W, H);

      // ── LAYER 0: Subtle gradient wash ──
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.7);
      grad.addColorStop(0, 'rgba(124,58,237,0.025)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── LAYER 1: Zone glow effects ──
      for (const zone of ZONES) {
        const intensity = getZoneIntensity(scrollPct, zone);
        if (intensity < 0.02) continue;
        const [r, g, b] = zone.hue;

        if (zone.mode === 'neural' || zone.mode === 'glow' || zone.mode === 'pulse') {
          // Soft radial glow with breathing
          const breathe = 0.6 + Math.sin(t * 0.5 + zone.start * 10) * 0.25;
          const pulse = zone.mode === 'pulse' ? 0.5 + Math.sin(t * 0.8) * 0.35 : breathe;
          const radius = W * 0.4;
          const cx = W * 0.5;
          const cy = H * (0.3 + zone.start * 0.4);
          const zGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          zGrad.addColorStop(0, `rgba(${r},${g},${b},${0.06 * intensity * pulse})`);
          zGrad.addColorStop(0.5, `rgba(${r},${g},${b},${0.025 * intensity * pulse})`);
          zGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = zGrad;
          ctx.fillRect(0, 0, W, H);
        }

        if (zone.mode === 'streams') {
          // Horizontal data streams — more visible
          ctx.save();
          ctx.globalAlpha = intensity * 0.05;
          for (let i = 0; i < 8; i++) {
            const sy = (H * (0.08 + i * 0.12) - parallax * (i + 1) * 0.25) % H;
            const speed = 30 + i * 8;
            const xOff = (t * speed * slow + i * 180) % (W + 600) - 300;
            const lineGrad = ctx.createLinearGradient(xOff, 0, xOff + 450, 0);
            const c = i % 2 === 0 ? '139,92,246' : '6,182,212';
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.2, `rgba(${c},1)`);
            lineGrad.addColorStop(0.8, `rgba(${c},1)`);
            lineGrad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.moveTo(xOff, sy);
            ctx.lineTo(xOff + 450, sy);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
          ctx.restore();
        }

        if (zone.mode === 'grid') {
          // Grid dots — more visible
          ctx.save();
          ctx.globalAlpha = intensity * 0.07;
          const spacing = 50;
          const ox = (scrollY * 0.02) % spacing;
          const oy = (scrollY * 0.02) % spacing;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          for (let x = -spacing + ox; x < W + spacing; x += spacing) {
            for (let y = -spacing + oy; y < H + spacing; y += spacing) {
              const dotPulse = 0.7 + Math.sin(t * 0.8 + x * 0.01 + y * 0.01) * 0.3;
              ctx.beginPath();
              ctx.arc(x, y, 0.8 * dotPulse + 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // ── LAYER 2: Update nodes ──
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * slow;
        n.y += n.vy * slow;

        // Subtle mouse repulsion
        const mdx = n.x - mouseX;
        const mdy = n.y - mouseY;
        const md = dist(n.x, n.y, mouseX, mouseY);
        if (md < 150 && md > 1) {
          n.x += (mdx / md) * 0.3;
          n.y += (mdy / md) * 0.3;
        }

        // Wrap around edges
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }

      // ── LAYER 3: Neural connections — stronger visibility ──
      const connAlpha = 0.07 + (1 - Math.min(scrollPct * 3, 1)) * 0.04;
      ctx.lineWidth = 0.6;

      const nodeLen2 = nodes?.length || 0;
      for (let i = 0; i < nodeLen2; i++) {
        const a = nodes[i];
        if (!a) continue;
        for (let j = i + 1; j < nodeLen2; j++) {
          const b = nodes[j];
          if (!b) continue;
          const d = dist(a.x, a.y - parallax * 0.5, b.x, b.y - parallax * 0.5);
          if (d < CONN_DIST) {
            const fade = (1 - d / CONN_DIST) * connAlpha;
            const isPurple = a.hue === 0 || b.hue === 0;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - parallax * 0.5);
            ctx.lineTo(b.x, b.y - parallax * 0.5);
            ctx.strokeStyle = isPurple
              ? `rgba(139,92,246,${fade})`
              : `rgba(6,182,212,${fade})`;
            ctx.stroke();
          }
        }
      }

      // ── LAYER 4: Node dots — brighter ──
      const nodeLen = nodes?.length || 0;
      for (let i = 0; i < nodeLen; i++) {
        const n = nodes[i];
        if (!n) continue;
        const drawY = n.y - parallax * 0.5;
        const pulse = 0.5 + Math.sin(t * 1.2 + n.phase) * 0.3;
        const alpha = 0.18 + pulse * 0.12;

        ctx.beginPath();
        ctx.arc(n.x, drawY, n.size * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = n.hue === 0
          ? `rgba(196,181,253,${alpha})`
          : `rgba(103,232,249,${alpha})`;
        ctx.fill();
      }

      // ── LAYER 5: Energy pulses traveling along nodes ──
      if (!s.reducedMotion) {
        const pulseCount = 8;
        for (let p = 0; p < pulseCount; p++) {
          const cyclePos = (t * 0.15 + p * 0.125) % 1;
          const idx = Math.floor(cyclePos * nodes.length) % nodes.length;
          const n = nodes[idx];
          if (!n) continue;
          const drawY = n.y - parallax * 0.5;
          const brightness = Math.sin(cyclePos * Math.PI);
          ctx.beginPath();
          ctx.arc(n.x, drawY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = n.hue === 0
            ? `rgba(167,139,250,${0.12 + brightness * 0.2})`
            : `rgba(34,211,238,${0.12 + brightness * 0.2})`;
          ctx.fill();
          // Glow around pulse
          ctx.beginPath();
          ctx.arc(n.x, drawY, 6, 0, Math.PI * 2);
          ctx.fillStyle = n.hue === 0
            ? `rgba(139,92,246,${brightness * 0.04})`
            : `rgba(6,182,212,${brightness * 0.04})`;
          ctx.fill();
        }
      }

      // ── LAYER 6: Scroll progress glow at bottom ──
      if (scrollPct > 0.3) {
        const bottomIntensity = (scrollPct - 0.3) * 1.4;
        const bGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
        bGrad.addColorStop(0, 'transparent');
        bGrad.addColorStop(1, `rgba(124,58,237,${0.04 * bottomIntensity})`);
        ctx.fillStyle = bGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // ── LAYER 7: Ambient breathing wash ──
      const ambientAlpha = 0.008 + Math.sin(t * 0.3) * 0.004;
      const ambGrad = ctx.createRadialGradient(
        W * (0.3 + Math.sin(t * 0.1) * 0.15),
        H * (0.5 + Math.cos(t * 0.08) * 0.2),
        0,
        W * 0.5, H * 0.5, W * 0.6
      );
      ambGrad.addColorStop(0, `rgba(139,92,246,${ambientAlpha})`);
      ambGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, W, H);

      s.raf = requestAnimationFrame(animate);
    }

    s.raf = requestAnimationFrame(animate);
    setReady(true);

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: ready ? 1 : 0,
        transition: 'opacity 1s ease-in',
      }}
    />
  );
}
