import { useState, useRef, useEffect, useCallback } from 'react';

const AI_INTRO_KEY = 'aiIntroSeen';
const VIDEO_SRC = '/icons/ai-assistant-intro.mp4';

export default function AiIntroModal({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const containerStyle = useRef({});
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = 16 / 9;

      if (w < 768) {
        const cw = Math.min(w * 0.92, 460);
        const ch = cw / ratio;
        containerStyle.current = {
          width: cw,
          height: Math.min(ch, h * 0.50),
        };
      } else {
        const maxCw = w * 0.65;
        const maxCh = h * 0.65;
        const cw = Math.min(maxCw, maxCh * ratio);
        const ch = cw / ratio;
        containerStyle.current = {
          width: cw,
          height: Math.min(ch, maxCh),
        };
      }
      forceUpdate({});
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const [, forceUpdate] = useState({});

  const finish = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = true;
    setFadeOut(true);
    setTimeout(() => {
      localStorage.setItem(AI_INTRO_KEY, 'true');
      onComplete();
    }, 250);
  }, [onComplete]);

  const onCanPlayThrough = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const playPromise = vid.play();
    if (playPromise) {
      playPromise.catch(() => finish());
    }
  }, [finish]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnd = () => finish();
    const onError = () => finish();
    vid.addEventListener('canplaythrough', onCanPlayThrough);
    vid.addEventListener('ended', onEnd);
    vid.addEventListener('error', onError);
    return () => {
      vid.removeEventListener('canplaythrough', onCanPlayThrough);
      vid.removeEventListener('ended', onEnd);
      vid.removeEventListener('error', onError);
    };
  }, [finish, onCanPlayThrough]);

  if (!visible) return null;

  const cs = containerStyle.current;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200000,
        background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <button
        onClick={finish}
        style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200001,
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

      <div
        style={{
          overflow: 'hidden',
          borderRadius: 12,
          width: cs.width,
          height: cs.height,
          transform: 'translateZ(0)',
        }}
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block', background: '#000000',
            willChange: 'transform',
          }}
          preload="auto"
          playsInline
          muted
          disablePictureInPicture
        />
      </div>
    </div>
  );
}

export function shouldShowAiIntro() {
  // Never stack over the onboarding experience.
  if (localStorage.getItem('gatenexa_onboarding_done') !== 'true') return false;
  return !localStorage.getItem(AI_INTRO_KEY);
}
