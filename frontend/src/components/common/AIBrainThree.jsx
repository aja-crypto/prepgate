import { useRef, useMemo, useEffect, memo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function generateBrainGeometry(nodeCount = 280) {
  const nodes = [];
  const connections = [];
  function sampleBrainPoint() {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    let r = 1.0;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const frontBack = Math.cos(theta) * sinPhi;
    r += frontBack * 0.15;
    const sideToSide = Math.abs(Math.sin(theta) * sinPhi);
    r += sideToSide * 0.1;
    if (cosPhi < -0.3) r *= 0.85;
    const topness = Math.max(0, cosPhi);
    const centerNess = 1 - Math.abs(Math.sin(theta));
    if (topness > 0.5 && centerNess > 0.6) r -= 0.08 * topness * centerNess;
    if (Math.cos(theta) > 0.3 && cosPhi > -0.2) r += 0.06;
    r += (Math.random() - 0.5) * 0.08;
    return [r * sinPhi * Math.cos(theta) * 1.3, r * cosPhi * 0.9, r * sinPhi * Math.sin(theta) * 1.0];
  }
  for (let i = 0; i < nodeCount; i++) nodes.push(sampleBrainPoint());
  const cerebellumCount = Math.floor(nodeCount * 0.12);
  for (let i = 0; i < cerebellumCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.4 + (Math.random() - 0.5) * 0.05;
    nodes.push([r * Math.sin(phi) * Math.cos(theta) * 1.1, r * Math.cos(phi) * 0.7 - 0.75, r * Math.sin(phi) * Math.sin(theta) * 0.9 - 0.3]);
  }
  const stemCount = Math.floor(nodeCount * 0.06);
  for (let i = 0; i < stemCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.12 + Math.random() * 0.05;
    const y = -0.7 - Math.random() * 0.5;
    nodes.push([r * Math.cos(angle), y, r * Math.sin(angle) - 0.15]);
  }
  const maxDist = 0.35;
  for (let i = 0; i < nodes.length; i++) {
    let connectionCount = 0;
    for (let j = i + 1; j < nodes.length && connectionCount < 5; j++) {
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      const dz = nodes[i][2] - nodes[j][2];
      const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
      if (dist < maxDist && dist > 0.05) { connections.push([i,j,dist]); connectionCount++; }
    }
  }
  return { nodes, connections };
}

function NeuralMesh() {
  const groupRef = useRef();
  const nodesRef = useRef();
  const synapseRef = useRef();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const { nodes, connections, nodePositions, linePositions, lineColors } = useMemo(() => {
    const geo = generateBrainGeometry(260);
    const np = new Float32Array(geo.nodes.length * 3);
    geo.nodes.forEach((n,i)=>{ np[i*3]=n[0]; np[i*3+1]=n[1]; np[i*3+2]=n[2]; });
    const lp = new Float32Array(geo.connections.length * 6);
    const lc = new Float32Array(geo.connections.length * 6);
    geo.connections.forEach(([a,b],i)=>{
      lp[i*6]=geo.nodes[a][0]; lp[i*6+1]=geo.nodes[a][1]; lp[i*6+2]=geo.nodes[a][2];
      lp[i*6+3]=geo.nodes[b][0]; lp[i*6+4]=geo.nodes[b][1]; lp[i*6+5]=geo.nodes[b][2];
      const c=0.3+Math.random()*0.15; lc[i*6]=c; lc[i*6+1]=c*0.6; lc[i*6+2]=0.95; lc[i*6+3]=c; lc[i*6+4]=c*0.6; lc[i*6+5]=0.95;
    });
    return { nodes: geo.nodes, connections: geo.connections, nodePositions: np, linePositions: lp, lineColors: lc };
  }, []);
  const synapseData = useMemo(() => {
    const count=15; const positions=new Float32Array(count*3); const velocities=[];
    for(let i=0;i<count;i++){ const conn=connections[Math.floor(Math.random()*connections.length)]; const sn=nodes[conn[0]]; velocities.push({sx:sn[0],sy:sn[1],sz:sn[2], ex:nodes[conn[1]][0],ey:nodes[conn[1]][1],ez:nodes[conn[1]][2], progress:Math.random(), speed:0.3+Math.random()*0.5}); }
    return { positions, velocities, count };
  }, [nodes, connections]);
  useFrame(({clock})=>{
    if(!mountedRef.current) return;
    const t=clock.getElapsedTime();
    if(groupRef.current){ const b=1+Math.sin(t*0.6)*0.012; groupRef.current.scale.setScalar(b); groupRef.current.rotation.y=Math.sin(t*0.08)*0.05; }
    if(synapseRef.current){
      const pos=synapseRef.current.geometry.attributes.position.array; const vels=synapseData.velocities;
      for(let i=0;i<synapseData.count;i++){ const v=vels[i]; v.progress+=v.speed*0.016; if(v.progress>=1){ v.progress=0; const c=connections[Math.floor(Math.random()*connections.length)]; const sn=nodes[c[0]]; const en=nodes[c[1]]; v.sx=sn[0];v.sy=sn[1];v.sz=sn[2]; v.ex=en[0];v.ey=en[1];v.ez=en[2]; v.speed=0.3+Math.random()*0.5; } pos[i*3]=v.sx+(v.ex-v.sx)*v.progress; pos[i*3+1]=v.sy+(v.ey-v.sy)*v.progress; pos[i*3+2]=v.sz+(v.ez-v.sz)*v.progress; }
      synapseRef.current.geometry.attributes.position.needsUpdate=true;
    }
    if(nodesRef.current) nodesRef.current.material.size=0.032+Math.sin(t*2)*0.004;
  });
  return (
    <group ref={groupRef} position={[0,0.2,0]}>
      <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[linePositions,3]} /><bufferAttribute attach="attributes-color" args={[lineColors,3]} /></bufferGeometry><lineBasicMaterial vertexColors transparent opacity={0.18} linewidth={1} /></lineSegments>
      <points ref={nodesRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[nodePositions,3]} /></bufferGeometry><pointsMaterial size={0.026} color="#C4B5FD" transparent opacity={0.55} sizeAttenuation depthWrite={false} /></points>
      <points ref={synapseRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[synapseData.positions,3]} /></bufferGeometry><pointsMaterial size={0.045} color="#67E8F9" transparent opacity={0.5} sizeAttenuation depthWrite={false} /></points>
      <mesh><sphereGeometry args={[1.6,24,24]} /><meshBasicMaterial color="#7C3AED" transparent opacity={0.015} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[0.8,16,16]} /><meshBasicMaterial color="#8B5CF6" transparent opacity={0.02} depthWrite={false} /></mesh>
    </group>
  );
}

function GlowPlatform(){
  const ringsRef=useRef([]);
  useFrame(({clock})=>{
    const t=clock.getElapsedTime();
    ringsRef.current.forEach((r,i)=>{ if(!r) return; const p=1+Math.sin(t*0.8+i*0.5)*0.03; r.scale.setScalar(p); r.material.opacity=0.12+Math.sin(t*0.6+i*0.7)*0.04; });
  });
  const rings=[0.8,1.1,1.4,1.7,2.0];
  return (
    <group position={[0,-1.2,0]} rotation={[-Math.PI/2,0,0]}>
      {rings.map((r,i)=>(
        <mesh key={i} ref={(el)=>{ringsRef.current[i]=el;}}><ringGeometry args={[r-0.015,r+0.015,80]} /><meshBasicMaterial color={i%2===0?'#8B5CF6':'#6D28D9'} transparent opacity={0.12-i*0.015} side={2} depthWrite={false} /></mesh>
      ))}
      <mesh><circleGeometry args={[0.8,48]} /><meshBasicMaterial color="#7C3AED" transparent opacity={0.06} depthWrite={false} /></mesh>
    </group>
  );
}

function AmbientParticles({count=120}){
  const ref=useRef();
  const positions=useMemo(()=>{ const a=new Float32Array(count*3); for(let i=0;i<count;i++){ a[i*3]=(Math.random()-0.5)*6; a[i*3+1]=(Math.random()-0.5)*5; a[i*3+2]=(Math.random()-0.5)*4; } return a; },[count]);
  useFrame(({clock})=>{ if(ref.current) ref.current.rotation.y=clock.getElapsedTime()*0.01; });
  return (<points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial size={0.012} color="#8B5CF6" transparent opacity={0.15} sizeAttenuation depthWrite={false} /></points>);
}

function EnergyField(){
  const ref=useRef(); const count=30;
  const positions=useMemo(()=>{ const a=new Float32Array(count*3); for(let i=0;i<count;i++){ const ang=(i/count)*Math.PI*2; const r=1.0+Math.random()*0.5; a[i*3]=Math.cos(ang)*r; a[i*3+1]=-1.2+Math.random()*2.5; a[i*3+2]=Math.sin(ang)*r; } return a; },[]);
  useFrame(({clock})=>{
    if(!ref.current) return;
    const pos=ref.current.geometry.attributes.position.array; const t=clock.getElapsedTime();
    for(let i=0;i<count;i++){ const ang=(i/count)*Math.PI*2; const r=1.0+Math.sin(t*0.3+i)*0.15; pos[i*3]=Math.cos(ang)*r; pos[i*3+1]=-1.2+((t*0.2+i*0.1)%1)*2.5; pos[i*3+2]=Math.sin(ang)*r; }
    ref.current.geometry.attributes.position.needsUpdate=true;
  });
  return (<points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial size={0.02} color="#A78BFA" transparent opacity={0.3} sizeAttenuation depthWrite={false} /></points>);
}

function NeuralBrainScene(){
  const mountedRef=useRef(true);
  useEffect(()=>{ mountedRef.current=true; return()=>{mountedRef.current=false;}; },[]);
  return (
    <>
      <ambientLight intensity={0.03} />
      <pointLight position={[0,2,3]} intensity={0.4} color="#8B5CF6" />
      <pointLight position={[-2,-1,2]} intensity={0.25} color="#06B6D4" />
      <pointLight position={[0,0,0]} intensity={0.2} color="#7C3AED" />
      <NeuralMesh />
      <GlowPlatform />
      <AmbientParticles count={60} />
      <EnergyField />
    </>
  );
}

export default function AIBrainThree(){
  return (
    <Canvas camera={{ position: [0, 0.1, 3.2], fov: 55 }} style={{ background: 'transparent', position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }} dpr={[1, 1]} frameloop="demand">
      <NeuralBrainScene />
    </Canvas>
  );
}
