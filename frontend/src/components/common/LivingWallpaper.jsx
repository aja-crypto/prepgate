import { useEffect, useRef } from 'react';

const NODE_COUNT = 55;
const PARTICLE_COUNT = 80;
const STAR_COUNT = 120;
const STREAK_COUNT = 4;
const CONNECTION_DIST = 180;

export default function LivingWallpaper() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const particlesRef = useRef([]);
  const starsRef = useRef([]);
  const streaksRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, hidden = false;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initNodes();
      initParticles();
      initStars();
      initStreaks();
    }

    function initNodes() {
      nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 1.5 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function initParticles() {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15 - 0.08,
        radius: 0.5 + Math.random() * 1.2,
        opacity: 0.1 + Math.random() * 0.3,
        life: Math.random(),
        maxLife: 0.5 + Math.random() * 0.5,
      }));
    }

    function initStars() {
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.3 + Math.random() * 0.8,
        baseOp: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.006,
      }));
    }

    function initStreaks() {
      streaksRef.current = Array.from({ length: STREAK_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 40 + Math.random() * 80,
        speed: 0.08 + Math.random() * 0.12,
        opacity: 0.01 + Math.random() * 0.02,
        angle: Math.random() * Math.PI * 2,
      }));
    }

    function draw(t) {
      if (hidden) {
        animRef.current = requestAnimationFrame(() => draw(performance.now() / 1000));
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Aurora base layers
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.5);
      g1.addColorStop(0, 'rgba(124, 58, 237, 0.04)');
      g1.addColorStop(0.5, 'rgba(45, 19, 102, 0.02)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.85, h * 0.75, 0, w * 0.85, h * 0.75, w * 0.45);
      g2.addColorStop(0, 'rgba(139, 92, 246, 0.035)');
      g2.addColorStop(0.5, 'rgba(45, 19, 102, 0.015)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Slow-moving aurora wave
      const waveX = w * (0.3 + 0.08 * Math.sin(t * 0.008));
      const waveY = h * (0.4 + 0.06 * Math.cos(t * 0.01));
      const g3 = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, w * 0.35);
      g3.addColorStop(0, 'rgba(124, 58, 237, 0.025)');
      g3.addColorStop(0.4, 'rgba(45, 19, 102, 0.012)');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      if (prefersReduced) {
        animRef.current = requestAnimationFrame(() => draw(performance.now() / 1000));
        return;
      }

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx + Math.sin(t * 0.005 + n.phase) * 0.08;
        n.y += n.vy + Math.cos(t * 0.006 + n.phase * 1.3) * 0.08;

        // Mouse repulsion
        const dx = n.x - mx;
        const dy = n.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.5;
          n.x += (dx / dist) * force;
          n.y += (dy / dist) * force;
        }

        // Wrap around edges
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        // Draw node
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.008 + n.phase);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${n.opacity * pulse * 0.6})`;
        ctx.fill();

        // Glow ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${n.opacity * pulse * 0.08})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const cdx = n.x - n2.x;
          const cdy = n.y - n2.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cd < CONNECTION_DIST) {
            const alpha = (1 - cd / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t * 0.003 + i) * 0.05;
        p.y += p.vy;
        p.life += 0.002;

        if (p.life > p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          particles[i] = {
            x: Math.random() * w,
            y: h + 10,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.1 - Math.random() * 0.3,
            radius: 0.5 + Math.random() * 1.2,
            opacity: 0.1 + Math.random() * 0.25,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.5,
          };
          continue;
        }

        const fade = p.life < 0.1 ? p.life / 0.1 : p.life > p.maxLife - 0.1 ? (p.maxLife - p.life) / 0.1 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity * fade * 0.5})`;
        ctx.fill();
      }

      // Draw twinkling stars
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = s.baseOp * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${twinkle})`;
        ctx.fill();
      }

      // Draw light streaks
      const streaks = streaksRef.current;
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        if (s.x < -s.len || s.x > w + s.len || s.y < -s.len || s.y > h + s.len) {
          s.x = Math.random() * w;
          s.y = Math.random() * h;
          s.angle = Math.random() * Math.PI * 2;
        }
        const endX = s.x - Math.cos(s.angle) * s.len;
        const endY = s.y - Math.sin(s.angle) * s.len;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(124, 58, 237, ${s.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(() => draw(performance.now() / 1000));
    }

    function handleMouse(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    resize();
    draw(performance.now() / 1000);

    const visibilityHandler = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: '#05030B' }} />
      {/* Digital mesh grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Galaxy vignette and fog */}
      <div className="absolute inset-0" style={{ background: `
        radial-gradient(ellipse 80% 60% at 30% 20%, rgba(124,58,237,0.04) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 70% 80%, rgba(45,19,102,0.05) 0%, transparent 50%),
        radial-gradient(ellipse 40% 30% at 50% 50%, rgba(18,8,31,0.15) 0%, transparent 40%),
        linear-gradient(180deg, rgba(5,3,11,0.25) 0%, transparent 25%, transparent 75%, rgba(5,3,11,0.45) 100%)
      `}} />
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }} />
    </div>
  );
}
