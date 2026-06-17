import { useState, useEffect } from 'react';

function Particle() {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [color, setColor] = useState('#8B5CF6');
  const [size, setSize] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const colors = ['#8B5CF6', '#06B6D4', '#F59E0B', '#F472B6', '#A78BFA', '#22D3EE'];
    setColor(colors[Math.floor(Math.random() * colors.length)]);
    setSize(Math.random() * 2 + 1);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.02 + 0.01;
    setVelocity({
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
      z: (Math.random() - 0.5) * 0.005,
    });

    const initialX = (Math.random() - 0.5) * 100;
    const initialY = (Math.random() - 0.5) * 60;
    const initialZ = (Math.random() - 0.5) * 20;
    setPosition({ x: initialX, y: initialY, z: initialZ });
  }, []);

  useEffect(() => {
    let animationId;
    const animate = () => {
      setPosition(prev => {
        const newX = prev.x + velocity.x;
        const newY = prev.y + velocity.y;
        const newZ = prev.z + velocity.z;

        const newOpacity = 1 - (Math.hypot(newX, newY, newZ) / 150);

        if (newOpacity <= 0) {
          return { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 20 };
        }

        setOpacity(newOpacity);
        return { x: newX, y: newY, z: newZ };
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [velocity]);

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate3d(${position.x}px, ${position.y}px, ${position.z}px) translate(-50%, -50%)`,
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        opacity: opacity,
        filter: `blur(${size / 2}px)`,
        boxShadow: `0 0 ${size * 3}px ${color}60`,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}

function ParticleSystem({ activeBrainRegion, activeSubject }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const createParticle = () => {
      setParticles(prev => {
        if (prev.length < 20) {
          return [...prev, { id: Date.now() }];
        }
        return prev;
      });
    };

    const interval = setInterval(createParticle, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setParticles([]);
  }, [activeBrainRegion, activeSubject]);

  return (
    <div className="absolute inset-0">
      {particles.map(particle => (
        <Particle key={particle.id} />
      ))}
    </div>
  );
}

export default ParticleSystem;