import { useRef, useEffect, useCallback } from 'react';

const PARTICLE_COUNT = 55;
const CONNECTION_DIST = 120;
const PULSE_SPEED = 0.003;

export default function NeuralBackground() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    mouse: { x: 0, y: 0 },
    raf: 0,
    reducedMotion: false,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw aurora gradient
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.8);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.04)');
    grad.addColorStop(0.4, 'rgba(109, 40, 217, 0.02)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cyan glow
    const cyanGrad = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.4);
    cyanGrad.addColorStop(0, 'rgba(34, 211, 238, 0.03)');
    cyanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cyanGrad;
    ctx.fillRect(0, 0, w, h);

    // Update and draw particles
    const time = performance.now() * 0.001;
    s.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Mouse repulsion
      const dx = p.x - s.mouse.x;
      const dy = p.y - s.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.3;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Wrap
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      // Pulsing glow
      const pulse = Math.sin(time * PULSE_SPEED * 1000 + p.phase) * 0.3 + 0.7;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${0.4 * pulse})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${0.06 * pulse})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < s.particles.length; i++) {
      for (let j = i + 1; j < s.particles.length; j++) {
        const a = s.particles[i];
        const b = s.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < CONNECTION_DIST) {
          const alpha = (1 - d / CONNECTION_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Flowing pulse along connection
          const t = (time * 0.5 + i * 0.1) % 1;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 2})`;
          ctx.fill();
        }
      }
    }

    // Grid overlay
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.02)';
    ctx.lineWidth = 0.5;
    const gridSize = 60;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    s.raf = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;

    s.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    s.particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (s.reducedMotion ? 0 : 0.3),
      vy: (Math.random() - 0.5) * (s.reducedMotion ? 0 : 0.3),
      radius: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.6 ? '34, 211, 238' : '139, 92, 246',
    }));

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      s.mouse.x = e.clientX - rect.left;
      s.mouse.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMouse);

    s.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
