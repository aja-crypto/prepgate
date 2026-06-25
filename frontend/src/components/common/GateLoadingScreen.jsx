import { useState, useEffect, useRef } from 'react';
import Icon from '../ui/Icon';

const MESSAGES = [
  'Loading PYQs...',
  'Analyzing Syllabus...',
  'Building Study Plan...',
  'Preparing Mock Tests...',
  'Launching Dashboard...',
];

function injectStyles() {
  const id = 'pg-loader-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @keyframes pg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pg-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pg-float { from { transform: translateY(100vh); opacity: 0; } to { transform: translateY(-100vh); opacity: 0.25; } }
    @keyframes pg-glow { 0%,100% { box-shadow: 0 0 6px rgba(168,85,247,0.08); } 50% { box-shadow: 0 0 15px rgba(168,85,247,0.15); } }
  `;
  document.head.appendChild(style);
}

function Particles() {
  const arr = useRef([]);
  if (arr.current.length === 0) {
    for (let i = 0; i < 20; i++) {
      arr.current.push({
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
      });
    }
  }
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {arr.current.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.left}%`,
          top: '100%',
          width: '2px',
          height: '2px',
          borderRadius: '50%',
          background: '#A855F7',
          opacity: 0,
          animation: `pg-float ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function GateLoadingScreen({
  mode = 'fullscreen',
  subtitle,
  autoComplete = false,
  onComplete,
}) {
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [done, setDone] = useState(false);
  const ran = useRef(false);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (!autoComplete || ran.current) return;
    ran.current = true;
    let cur = 0;
    const id = setInterval(() => {
      cur += 1;
      setPct(cur);
      if (cur >= 100) {
        clearInterval(id);
        setDone(true);
        if (onComplete) setTimeout(onComplete, 600);
      }
    }, 40);
    return () => clearInterval(id);
  }, [autoComplete, onComplete]);

  useEffect(() => {
    if (pct >= 100) return;
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [pct]);

  const content = (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden" style={{ background: '#000' }}>

      <Particles />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center" style={{ animation: 'pg-fade-in 0.8s ease-out both' }}>
        <Icon name="logo" className="w-14 h-14 mb-3" />
        <div className="text-white text-center" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '6px' }}>GateApex</div>
        <div style={{ color: '#A855F7', fontSize: '11px', fontWeight: 600, letterSpacing: '3px', marginTop: '4px' }}>GATE 2027</div>
      </div>

      {/* Rotating ring */}
      <div className="relative z-10" style={{ animation: 'pg-fade-in 0.8s ease-out 0.15s both' }}>
        <div style={{
          width: '200px', height: '200px', borderRadius: '50%',
          border: '1.5px solid rgba(168,85,247,0.1)',
          borderTop: '1.5px solid #A855F7',
          animation: 'pg-spin 12s linear infinite',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: '15px', borderRadius: '50%',
            border: '1px solid rgba(168,85,247,0.12)',
          }} />
          <div style={{
            position: 'absolute', inset: '30px', borderRadius: '50%',
            border: '1px solid rgba(168,85,247,0.06)',
          }} />
        </div>
      </div>

      {/* Percentage */}
      <div className="relative z-10" style={{
        color: '#C084FC',
        fontSize: '1.6rem',
        fontWeight: 700,
        marginTop: '24px',
        animation: 'pg-fade-in 0.8s ease-out 0.3s both',
      }}>
        {pct}%
      </div>

      {/* Progress bar */}
      <div className="relative z-10" style={{
        width: '320px', maxWidth: '80vw', height: '4px',
        marginTop: '16px', borderRadius: '50px',
        background: '#111',
        overflow: 'hidden',
        animation: 'pg-fade-in 0.8s ease-out 0.4s both',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          borderRadius: '50px',
          background: 'linear-gradient(90deg, #7C3AED, #A855F7, #C084FC)',
          transition: 'width 0.15s linear',
        }} />
      </div>

      {/* Status */}
      <div className="relative z-10" style={{
        color: '#bbb',
        fontSize: '0.85rem',
        marginTop: '16px',
        height: '1.3em',
        animation: 'pg-fade-in 0.8s ease-out 0.5s both',
      }}>
        {done ? 'Ready' : MESSAGES[msgIdx]}
      </div>

      {/* Tip card */}
      <div className="relative z-10" style={{
        marginTop: '36px',
        width: '340px', maxWidth: '85vw',
        padding: '18px',
        borderRadius: '16px',
        background: 'rgba(168,85,247,0.04)',
        border: '1px solid rgba(168,85,247,0.12)',
        backdropFilter: 'blur(10px)',
        animation: 'pg-fade-in 0.8s ease-out 0.6s both',
      }}>
        <div style={{ color: '#A855F7', fontSize: '0.7rem', marginBottom: '6px', letterSpacing: '2px' }}>
          TIP OF THE DAY
        </div>
        <div style={{ color: '#ddd', fontSize: '0.85rem' }}>
          Consistency today, excellence tomorrow.
        </div>
      </div>

      {subtitle && (
        <p className="relative z-10" style={{
          color: 'rgba(255,255,255,0.15)',
          fontSize: '0.6rem',
          marginTop: '24px',
          animation: 'pg-fade-in 0.8s ease-out 0.7s both',
        }}>{subtitle}</p>
      )}
    </div>
  );

  if (mode === 'inline') {
    return <div className="w-full py-12 flex items-center justify-center" style={{ background: '#000' }}><div className="max-w-sm w-full">{content}</div></div>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{
      background: '#000',
      transition: 'opacity 0.6s ease',
      opacity: done ? 0 : 1,
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(circle at center, #111 0%, #050505 50%, #000 100%)',
        pointerEvents: 'none',
      }} />
      {content}
    </div>
  );
}

export function PageLoading({ title }) {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center" style={{ background: '#000', minHeight: '40vh' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1.5px solid rgba(168,85,247,0.1)', borderTop: '1.5px solid #A855F7', animation: 'pg-spin 1.2s linear infinite', marginBottom: '16px' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{title || 'Loading...'}</span>
    </div>
  );
}

export function InlineLoading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 py-4 justify-center">
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid rgba(168,85,247,0.1)', borderTop: '1.5px solid #A855F7', animation: 'pg-spin 0.8s linear infinite' }} />
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</span>
    </div>
  );
}

export function SubjectLoading({ subjectName }) {
  return <PageLoading title={`Loading ${subjectName || 'Subject'}`} />;
}

export function MentorLoading() {
  return <PageLoading title="AI Mentor Thinking..." />;
}

export function MockExamLoading() {
  return <PageLoading title="Preparing Exam..." />;
}

