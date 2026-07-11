import { useState, useRef, useEffect, useCallback } from 'react';

const AI_INTRO_KEY = 'aiIntroSeen';
const VIDEO_SRC = '/icons/ai-assistant-intro.mp4';

export default function AiIntroModal({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const finish = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = true;
    localStorage.setItem(AI_INTRO_KEY, 'true');
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnd = () => finish();
    const onError = () => finish();
    vid.addEventListener('ended', onEnd);
    vid.addEventListener('error', onError);
    vid.play().catch(() => finish());
    return () => {
      vid.removeEventListener('ended', onEnd);
      vid.removeEventListener('error', onError);
    };
  }, [finish]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200000,
        background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        onClick={finish}
        style={{
          position: 'absolute', top: 24, right: 24, zIndex: 200001,
          width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        aria-label="Skip intro"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 24, height: 24 }}>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <video
        ref={videoRef}
        src={VIDEO_SRC}
        style={{
          width: '100vw', height: '100vh',
          objectFit: 'contain',
          display: 'block', background: '#000000',
          willChange: 'transform',
        }}
        preload="auto"
        playsInline
        autoPlay
        disablePictureInPicture
      />
    </div>
  );
}

export function shouldShowAiIntro() {
  return !localStorage.getItem(AI_INTRO_KEY);
}
