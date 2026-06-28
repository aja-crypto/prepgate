import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// ─── Constants ───────────────────────────────────────────────
const EYE_LERP = 0.06;
const BLINK_MIN = 2800;
const BLINK_MAX = 5500;

// ─── Holographic Ring ────────────────────────────────────────
function HoloRing({ radius = 1.6, y = 0, speed = 0.4, color = '#8B5CF6' }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2 + Math.sin(t * speed) * 0.1;
      ref.current.rotation.z = t * speed * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 16, 128]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Concentric Hologram Rings (background) ──────────────────
function HoloBackground() {
  const groupRef = useRef();
  const rings = useMemo(() => [
    { radius: 2.2, speed: 0.15, opacity: 0.08 },
    { radius: 2.8, speed: -0.1, opacity: 0.05 },
    { radius: 3.5, speed: 0.08, opacity: 0.03 },
  ], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {rings.map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.radius, 0.005, 8, 128]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={0.5}
            transparent
            opacity={r.opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── AI Core (chest) ─────────────────────────────────────────
function AICore() {
  const groupRef = useRef();
  const innerRef = useRef();
  const outerRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.5;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.8;
      innerRef.current.material.emissiveIntensity = 0.6 + Math.sin(t * 2) * 0.3;
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.4;
      outerRef.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe icosahedron */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* Inner glowing sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#22D3EE"
          emissiveIntensity={1.5}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Eye ─────────────────────────────────────────────────────
function Eye({ position, mood, blinkScale, mouseRef, side }) {
  const eyeRef = useRef();
  const pupilRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mouse = mouseRef.current;

    // Pupil follows cursor
    if (pupilRef.current) {
      const tx = mouse.x * 0.04 * side;
      const ty = mouse.y * 0.03;
      pupilRef.current.position.x = THREE.MathUtils.lerp(pupilRef.current.position.x, tx, EYE_LERP);
      pupilRef.current.position.y = THREE.MathUtils.lerp(pupilRef.current.position.y, ty, EYE_LERP);
    }

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.3;
    }
  });

  const eyeColor = mood === 'error' ? '#EF4444' : mood === 'success' ? '#22C55E' : '#8B5CF6';

  return (
    <group ref={eyeRef} position={position}>
      {/* Outer glow ring — visible against dark head */}
      <mesh>
        <torusGeometry args={[0.13, 0.008, 12, 48]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      {/* Iris — bright sphere */}
      <mesh scale={[1, 1 - blinkScale * 0.8, 1]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      {/* Pupil — dark center */}
      <mesh ref={pupilRef} position={[0, 0, 0.05]} scale={[1, 1 - blinkScale * 0.9, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#010104" />
      </mesh>
      {/* Main reflection dot */}
      <mesh position={[0.03, 0.035, 0.09]} scale={[1, 1 - blinkScale, 1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* Small reflection */}
      <mesh position={[-0.015, -0.015, 0.09]} scale={[1, 1 - blinkScale, 1]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* Glow halo */}
      <mesh ref={glowRef} scale={[1, 1 - blinkScale * 0.7, 1]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
          emissiveIntensity={1}
          transparent
          opacity={0.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Mouth ───────────────────────────────────────────────────
function Mouth({ mood }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle breathing
    ref.current.scale.x = 1 + Math.sin(t * 1.5) * 0.03;
  });

  const mouthColor = mood === 'success' ? '#22C55E' : mood === 'error' ? '#EF4444' : '#8B5CF6';

  if (mood === 'success') {
    // Happy arc — upward curve, thicker and brighter
    return (
      <group ref={ref} position={[0, -0.14, 0.48]} rotation={[Math.PI, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.08, 0.012, 12, 32, Math.PI]} />
          <meshStandardMaterial
            color={mouthColor}
            emissive={mouthColor}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  }

  if (mood === 'error') {
    // Confused — tilted line
    return (
      <mesh ref={ref} position={[0, -0.14, 0.48]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.1, 0.012, 0.012]} />
        <meshStandardMaterial color={mouthColor} emissive={mouthColor} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    );
  }

  if (mood === 'loading') {
    // Neutral — small dot
    return (
      <mesh ref={ref} position={[0, -0.14, 0.48]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color={mouthColor} emissive={mouthColor} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
    );
  }

  // Idle — subtle smile arc
  return (
    <group ref={ref} position={[0, -0.14, 0.48]} rotation={[Math.PI, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.06, 0.01, 10, 24, Math.PI]} />
        <meshStandardMaterial
          color={mouthColor}
          emissive={mouthColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Head ────────────────────────────────────────────────────
function Head({ mood, mouseRef, blinkScale }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mouse = mouseRef.current;
    if (ref.current) {
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mouse.x * 0.12, 0.04);
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, mouse.y * 0.06, 0.04);
      ref.current.rotation.z = Math.sin(t * 0.4) * 0.015;
    }
  });

  return (
    <group ref={ref} position={[0, 0.55, 0]}>
      {/* Head shell — sphere scaled to rounded rectangle (Tesla/Vision style) */}
      <group scale={[1.75, 1.3, 1.25]}>
        <mesh>
          <sphereGeometry args={[0.42, 48, 48]} />
          <meshStandardMaterial
            color="#0c0c1a"
            metalness={0.92}
            roughness={0.08}
          />
        </mesh>
      </group>
      {/* Subtle edge highlight — thin ring */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.44, 0.003, 8, 64]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
        />
      </mesh>
      {/* Eyes — positioned on head surface */}
      <Eye position={[-0.16, 0.04, 0.4]} mood={mood} blinkScale={blinkScale} mouseRef={mouseRef} side={-1} />
      <Eye position={[0.16, 0.04, 0.4]} mood={mood} blinkScale={blinkScale} mouseRef={mouseRef} side={1} />
      {/* Mouth */}
      <Mouth mood={mood} />
    </group>
  );
}

// ─── Neck + Core ─────────────────────────────────────────────
function NeckAndCore() {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02;
    }
  });

  return (
    <group ref={ref}>
      {/* Neck */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 12]} />
        <meshStandardMaterial color="#0c0c1a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Neck glow ring */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.004, 8, 32]} />
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
      {/* Torso — floating slab */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.32]} />
        <meshStandardMaterial
          color="#0c0c1a"
          metalness={0.92}
          roughness={0.08}
        />
      </mesh>
      {/* Torso subtle edge glow */}
      {[
        { pos: [0, 0.04, 0], scale: [0.51, 0.002, 0.33] },
        { pos: [0, -0.2, 0], scale: [0.51, 0.002, 0.33] },
      ].map((e, i) => (
        <mesh key={i} position={e.pos}>
          <boxGeometry args={e.scale} />
          <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.3} transparent opacity={0.15} />
        </mesh>
      ))}
      {/* AI Core */}
      <group position={[0, -0.08, 0.2]}>
        <AICore />
      </group>
    </group>
  );
}

// ─── Floating Particles ──────────────────────────────────────
function Particles() {
  const ref = useRef();
  const count = 25;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#8B5CF6" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── Robot Assembly ──────────────────────────────────────────
function Robot({ mood, mouseRef, blinkScale }) {
  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group position={[0, -0.15, 0]}>
        <Head mood={mood} mouseRef={mouseRef} blinkScale={blinkScale} />
        <NeckAndCore />
        <HoloRing radius={0.9} y={-0.08} speed={0.6} color="#8B5CF6" />
        <HoloRing radius={1.1} y={-0.08} speed={-0.4} color="#22D3EE" />
        <Particles />
      </group>
    </Float>
  );
}

// ─── Blink Controller ────────────────────────────────────────
function BlinkController({ children, onBlink }) {
  const blinkRef = useRef(0);
  const nextBlink = useRef(BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN));
  const blinkTimer = useRef(0);
  const blinkProgress = useRef(0);
  const isBlinking = useRef(false);

  useFrame((_, delta) => {
    blinkTimer.current += delta * 1000;

    if (!isBlinking.current && blinkTimer.current > nextBlink.current) {
      isBlinking.current = true;
      blinkProgress.current = 0;
      blinkTimer.current = 0;
      nextBlink.current = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
    }

    if (isBlinking.current) {
      blinkProgress.current += delta * 7;
      const t = blinkProgress.current;
      const scale = t < 1 ? t : Math.max(0, 2 - t);
      onBlink(scale);
      if (t >= 2) {
        isBlinking.current = false;
        onBlink(0);
      }
    }
  });

  return children;
}

// ─── Scene ───────────────────────────────────────────────────
function Scene({ mood, mouseRef }) {
  const [blinkScale, setBlinkScale] = useState(0);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} color="#8B5CF6" intensity={1.8} distance={10} />
      <pointLight position={[-2, 2, -2]} color="#22D3EE" intensity={0.8} distance={8} />
      <pointLight position={[0, -1, 2]} color="#8B5CF6" intensity={0.4} distance={5} />
      <spotLight position={[0, 4, 0]} angle={0.3} penumbra={0.8} color="#8B5CF6" intensity={0.5} />
      <spotLight position={[2, 2, 4]} angle={0.4} penumbra={0.6} color="#C084FC" intensity={0.3} distance={8} />

      <BlinkController onBlink={setBlinkScale}>
        <Robot mood={mood} mouseRef={mouseRef} blinkScale={blinkScale} />
      </BlinkController>

      <HoloBackground />
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────
export default function RobotScene({ mood = 'idle', mouse = { x: 0, y: 0 } }) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => { mouseRef.current = mouse; }, [mouse.x, mouse.y]);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  if (!ready) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0.2, 3], fov: 32 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Scene mood={mood} mouseRef={mouseRef} />
      </Suspense>
    </Canvas>
  );
}
