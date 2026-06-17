import { useRef, useMemo, useState, Suspense, useCallback, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// ─── BRAIN GEOMETRY GENERATOR ────────────────────────────────────────
// Creates a brain-shaped neural network with nodes and connections
function generateBrainGeometry(nodeCount = 280) {
  const nodes = [];
  const connections = [];

  // Helper: sample point on deformed sphere (brain-shaped)
  function sampleBrainPoint() {
    // Random spherical coords
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Base sphere radius with brain deformations
    let r = 1.0;

    // Flatten top/bottom slightly (brain is wider than tall)
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    // Elongate front-back (brain is longer front-to-back)
    const frontBack = Math.cos(theta) * sinPhi;
    r += frontBack * 0.15; // longer in front

    // Widen side-to-side
    const sideToSide = Math.abs(Math.sin(theta) * sinPhi);
    r += sideToSide * 0.1;

    // Flatten the bottom
    if (cosPhi < -0.3) r *= 0.85;

    // Central fissure — dip at the top center
    const topness = Math.max(0, cosPhi);
    const centerNess = 1 - Math.abs(Math.sin(theta));
    if (topness > 0.5 && centerNess > 0.6) {
      r -= 0.08 * topness * centerNess;
    }

    // Frontal lobe bulge
    if (Math.cos(theta) > 0.3 && cosPhi > -0.2) {
      r += 0.06;
    }

    // Add noise for organic feel
    r += (Math.random() - 0.5) * 0.08;

    return [
      r * sinPhi * Math.cos(theta) * 1.3,  // x — wider
      r * cosPhi * 0.9,                      // y — slightly shorter
      r * sinPhi * Math.sin(theta) * 1.0,   // z
    ];
  }

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(sampleBrainPoint());
  }

  // Add cerebellum nodes (smaller cluster at bottom-back)
  const cerebellumCount = Math.floor(nodeCount * 0.12);
  for (let i = 0; i < cerebellumCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.4 + (Math.random() - 0.5) * 0.05;
    nodes.push([
      r * Math.sin(phi) * Math.cos(theta) * 1.1,
      r * Math.cos(phi) * 0.7 - 0.75,
      r * Math.sin(phi) * Math.sin(theta) * 0.9 - 0.3,
    ]);
  }

  // Add brainstem nodes (thin column going down)
  const stemCount = Math.floor(nodeCount * 0.06);
  for (let i = 0; i < stemCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.12 + Math.random() * 0.05;
    const y = -0.7 - Math.random() * 0.5;
    nodes.push([
      r * Math.cos(angle),
      y,
      r * Math.sin(angle) - 0.15,
    ]);
  }

  // Generate connections between nearby nodes
  const maxDist = 0.35;
  for (let i = 0; i < nodes.length; i++) {
    let connectionCount = 0;
    for (let j = i + 1; j < nodes.length && connectionCount < 5; j++) {
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      const dz = nodes[i][2] - nodes[j][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < maxDist && dist > 0.05) {
        connections.push([i, j, dist]);
        connectionCount++;
      }
    }
  }

  return { nodes, connections };
}

// ─── NEURAL MESH (The Brain) ─────────────────────────────────────────
function NeuralMesh() {
  const groupRef = useRef();
  const nodesRef = useRef();
  const linesRef = useRef();
  const synapseRef = useRef();

  const { nodes, connections, nodePositions, linePositions, lineColors } = useMemo(() => {
    const geo = generateBrainGeometry(260);
    const np = new Float32Array(geo.nodes.length * 3);
    geo.nodes.forEach((n, i) => { np[i * 3] = n[0]; np[i * 3 + 1] = n[1]; np[i * 3 + 2] = n[2]; });

    const lp = new Float32Array(geo.connections.length * 6);
    const lc = new Float32Array(geo.connections.length * 6);
    geo.connections.forEach(([a, b], i) => {
      lp[i * 6] = geo.nodes[a][0]; lp[i * 6 + 1] = geo.nodes[a][1]; lp[i * 6 + 2] = geo.nodes[a][2];
      lp[i * 6 + 3] = geo.nodes[b][0]; lp[i * 6 + 4] = geo.nodes[b][1]; lp[i * 6 + 5] = geo.nodes[b][2];
      // Base color: purple with slight variation
      const c = 0.3 + Math.random() * 0.15;
      lc[i * 6] = c; lc[i * 6 + 1] = c * 0.6; lc[i * 6 + 2] = 0.95;
      lc[i * 6 + 3] = c; lc[i * 6 + 4] = c * 0.6; lc[i * 6 + 5] = 0.95;
    });

    return { nodes: geo.nodes, connections: geo.connections, nodePositions: np, linePositions: lp, lineColors: lc };
  }, []);

  // Synapse firing data
  const synapseData = useMemo(() => {
    const count = 15; // active synapses
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      const startNode = nodes[conn[0]];
      velocities.push({
        sx: startNode[0], sy: startNode[1], sz: startNode[2],
        ex: nodes[conn[1]][0], ey: nodes[conn[1]][1], ez: nodes[conn[1]][2],
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    return { positions, velocities, count };
  }, [nodes, connections]);

  // Breathing + synapse animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      const breathe = 1 + Math.sin(t * 0.6) * 0.012;
      groupRef.current.scale.setScalar(breathe);
      groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.05;
    }

    // Animate synapse particles traveling along connections
    if (synapseRef.current) {
      const pos = synapseRef.current.geometry.attributes.position.array;
      const vels = synapseData.velocities;
      for (let i = 0; i < synapseData.count; i++) {
        const v = vels[i];
        v.progress += v.speed * 0.016;
        if (v.progress >= 1) {
          // Reset to a new random connection
          v.progress = 0;
          const conn = connections[Math.floor(Math.random() * connections.length)];
          const sn = nodes[conn[0]];
          const en = nodes[conn[1]];
          v.sx = sn[0]; v.sy = sn[1]; v.sz = sn[2];
          v.ex = en[0]; v.ey = en[1]; v.ez = en[2];
          v.speed = 0.3 + Math.random() * 0.5;
        }
        pos[i * 3] = v.sx + (v.ex - v.sx) * v.progress;
        pos[i * 3 + 1] = v.sy + (v.ey - v.sy) * v.progress;
        pos[i * 3 + 2] = v.sz + (v.ez - v.sz) * v.progress;
      }
      synapseRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Pulse node brightness
    if (nodesRef.current) {
      nodesRef.current.material.size = 0.032 + Math.sin(t * 2) * 0.004;
    }
  });

  // Region detection moved to parent AIBrainScene div handler — no R3F pointer events needed here

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Neural connections (lines) — no pointer events, use mesh below instead */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.18} linewidth={1} />
      </lineSegments>

      {/* Neural nodes (points) */}
      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.026} color="#C4B5FD" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
      </points>

      {/* Synapse firing particles (traveling bright dots) */}
      <points ref={synapseRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[synapseData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#67E8F9" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>

      {/* Hover region detection moved to parent div — removes R3F pointer event race condition */}

      {/* Brain glow halo */}
      <mesh>
        <sphereGeometry args={[1.6, 24, 24]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.015} depthWrite={false} />
      </mesh>

      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.02} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── GLOW PLATFORM (concentric rings beneath brain) ──────────────────
function GlowPlatform() {
  const ringsRef = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const pulse = 1 + Math.sin(t * 0.8 + i * 0.5) * 0.03;
      ring.scale.setScalar(pulse);
      ring.material.opacity = 0.12 + Math.sin(t * 0.6 + i * 0.7) * 0.04;
    });
  });

  const rings = [0.8, 1.1, 1.4, 1.7, 2.0];

  return (
    <group position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((r, i) => (
        <mesh key={i} ref={(el) => { ringsRef.current[i] = el; }}>
          <ringGeometry args={[r - 0.015, r + 0.015, 80]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? '#8B5CF6' : '#6D28D9'}
            transparent
            opacity={0.12 - i * 0.015}
            side={2}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Center glow disc */}
      <mesh>
        <circleGeometry args={[0.8, 48]} />
        <meshBasicMaterial color="#7C3AED" transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── AMBIENT PARTICLES ───────────────────────────────────────────────
function AmbientParticles({ count = 120 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#8B5CF6" transparent opacity={0.15} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── ENERGY FIELD (vertical light beams) ─────────────────────────────
function EnergyField() {
  const ref = useRef();
  const count = 30;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.0 + Math.random() * 0.5;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = -1.2 + Math.random() * 2.5;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.0 + Math.sin(t * 0.3 + i) * 0.15;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = -1.2 + ((t * 0.2 + i * 0.1) % 1) * 2.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#A78BFA" transparent opacity={0.3} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── COMPLETE 3D SCENE ───────────────────────────────────────────────
function NeuralBrainScene() {
  return (
    <>
      <ambientLight intensity={0.03} />
      <pointLight position={[0, 2, 3]} intensity={0.4} color="#8B5CF6" />
      <pointLight position={[-2, -1, 2]} intensity={0.25} color="#06B6D4" />
      <pointLight position={[0, 0, 0]} intensity={0.2} color="#7C3AED" />
      <NeuralMesh />
      <GlowPlatform />
      <AmbientParticles count={60} />
      <EnergyField />
    </>
  );
}

// ─── CSS 2D FALLBACK ─────────────────────────────────────────────────
function NeuralBrain2DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <style>{`
        @keyframes brain-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes brain-glow { 0%,100% { filter: drop-shadow(0 0 30px rgba(124,58,237,0.4)); } 50% { filter: drop-shadow(0 0 60px rgba(124,58,237,0.7)); } }
        @keyframes ring-pulse { 0%,100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.25; transform: scale(1.03); } }
      `}</style>
      {/* Brain shape */}
      <div className="relative" style={{ animation: 'brain-breathe 4s ease-in-out infinite, brain-glow 3s ease-in-out infinite' }}>
        <svg viewBox="0 0 200 180" className="w-64 h-64 sm:w-80 sm:h-80">
          {/* Brain outline */}
          <ellipse cx="100" cy="75" rx="70" ry="60" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="0.5" />
          <ellipse cx="100" cy="75" rx="65" ry="55" fill="rgba(124,58,237,0.05)" stroke="rgba(139,92,246,0.2)" strokeWidth="0.3" />
          {/* Neural nodes */}
          {Array.from({ length: 40 }, (_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const r = 30 + Math.random() * 25;
            const cx = 100 + Math.cos(angle) * r * (0.8 + Math.random() * 0.4);
            const cy = 75 + Math.sin(angle) * r * (0.7 + Math.random() * 0.3);
            return <circle key={i} cx={cx} cy={cy} r="1.5" fill="#C4B5FD" opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" /></circle>;
          })}
          {/* Neural connections */}
          {Array.from({ length: 25 }, (_, i) => {
            const x1 = 60 + Math.random() * 80, y1 = 40 + Math.random() * 70;
            const x2 = x1 + (Math.random() - 0.5) * 40, y2 = y1 + (Math.random() - 0.5) * 30;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(139,92,246,0.2)" strokeWidth="0.3" />;
          })}
        </svg>
      </div>
      {/* Platform rings */}
      {[1, 2, 3].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: `${40 + i * 15}%`, height: '4px',
          bottom: `${25 - i * 3}%`, left: '50%', transform: 'translateX(-50%)',
          background: `rgba(139,92,246,${0.2 - i * 0.05})`,
          borderRadius: '50%',
          animation: `ring-pulse 3s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── MEMOIZED CANVAS (prevents re-mount on mouse state changes) ─────
const MemoizedBrainCanvas = memo(function MemoizedBrainCanvas() {
  return (
    <Suspense fallback={<NeuralBrain2DFallback />}>
      <Canvas
        camera={{ position: [0, 0.1, 3.2], fov: 55 }}
        style={{ background: 'transparent', position: 'absolute', inset: 0 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <NeuralBrainScene />
      </Canvas>
    </Suspense>
  );
});

// ─── MAIN EXPORT ─────────────────────────────────────────────────────
export default function AIBrainScene() {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const tooltipRef = useRef({ x: 0, y: 0 });
  const regionRef = useRef(null);
  const containerRef = useRef(null);


  let useWebGL = true;
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2') && !c.getContext('webgl')) useWebGL = false;
  } catch { useWebGL = false; }

  const handleMouseMove = useCallback((e) => {
    tooltipRef.current = { x: e.clientX, y: e.clientY };
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    let region = null;
    if (y < -0.3) {
      region = { label: 'Theory of Computation', progress: 81, weakTopics: 2 };
    } else if (x > 0.3) {
      region = y > 0 ? { label: 'Computer Networks', progress: 58, weakTopics: 6 } : { label: 'Operating Systems', progress: 78, weakTopics: 3 };
    } else if (x < -0.3) {
      region = y > 0 ? { label: 'Algorithms & DS', progress: 72, weakTopics: 4 } : { label: 'Engineering Math', progress: 54, weakTopics: 7 };
    } else if (y > 0.3) {
      region = { label: 'Compiler Design', progress: 45, weakTopics: 8 };
    }
    if (region?.label !== regionRef.current?.label) {
      regionRef.current = region;
      setHoveredRegion(region);
    }
  }, []);

  const tooltip = hoveredRegion && (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: tooltipRef.current.x + 16, top: tooltipRef.current.y - 10 }}
    >
      <div className="rounded-xl px-4 py-3 backdrop-blur-md" style={{
        background: 'rgba(5,8,22,0.92)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow: '0 0 20px rgba(139,92,246,0.15)',
      }}>
        <div className="text-sm font-bold text-white">{hoveredRegion.label}</div>
        <div className="flex items-center gap-4 mt-1.5">
          <div>
            <span className="text-xs font-mono font-bold" style={{ color: '#A78BFA' }}>{hoveredRegion.progress}%</span>
            <span className="text-[8px] ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Progress</span>
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-white">{hoveredRegion.weakTopics}</span>
            <span className="text-[8px] ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Weak Topics</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ position: 'absolute', inset: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { regionRef.current = null; setHoveredRegion(null); }}
    >
      {useWebGL ? <MemoizedBrainCanvas /> : <NeuralBrain2DFallback />}

      {/* Vignette overlay — darkens edges to blend with page */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,8,22,0.5) 70%, rgba(5,8,22,0.95) 100%)',
        }}
      />

      {tooltip}
    </div>
  );
}
