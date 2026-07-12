import { useState, useRef, useEffect, useCallback } from 'react';

const VIDEO_SRC = '/icons/gatenexa-brand-intro.mp4';
const BRAND_IMG = '/images/logo.png';

function calcContainer(w, h) {
  const ratio = 16 / 9;
  if (w < 768) {
    const cw = Math.min(w * 0.95, 480);
    return { width: cw, height: Math.min(cw / ratio, h * 0.55) };
  }
  const maxCw = w * 0.70;
  const maxCh = h * 0.68;
  const cw = Math.min(maxCw, maxCh * ratio);
  return { width: cw, height: Math.min(cw / ratio, maxCh) };
}

export default function BrandIntroModal({ open, onClose }) {
  const [phase, setPhase] = useState('video');
  const [visible, setVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerStyle = useRef({});
  const videoRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      containerStyle.current = calcContainer(window.innerWidth, window.innerHeight);
      forceUpdate({});
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (open) {
      setVisible(true);
      setPhase('video');
      requestAnimationFrame(() => setFadeIn(true));
      containerStyle.current = calcContainer(window.innerWidth, window.innerHeight);
    } else {
      setFadeIn(false);
    }
  }, [open]);

  const handleVideoEnd = useCallback(() => {
    setPhase('brand');
  }, []);

  const handleReplay = useCallback(() => {
    setPhase('video');
    requestAnimationFrame(() => {
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
    });
  }, []);

  const handleClose = useCallback(() => {
    setFadeIn(false);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 250);
  }, [onClose]);

  const handleCanPlayThrough = useCallback(() => {
    const vid = videoRef.current;
    if (vid && vid.paused && vid.readyState >= 4) {
      vid.play().catch(() => {});
    }
  }, []);

  if (!open || !visible) return null;

  const cs = containerStyle.current;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200000,
        background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
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
        aria-label="Close"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 24, height: 24 }}>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Video Phase */}
      {phase === 'video' && (
        <div
          style={{
            overflow: 'hidden',
            borderRadius: isMobile ? 12 : 16,
            width: cs.width,
            height: cs.height,
            transform: 'translateZ(0)',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            onEnded={handleVideoEnd}
            onCanPlayThrough={handleCanPlayThrough}
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
      )}

      {/* Brand Phase */}
      {phase === 'brand' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 32,
            animation: 'brandFadeIn 0.35s ease-out forwards',
          }}
        >
          <img
            src={BRAND_IMG}
            alt="GateNexa"
            style={{
              maxWidth: isMobile ? '55vw' : '35vw',
              maxHeight: isMobile ? '40vh' : '45vh',
              width: 'auto', height: 'auto',
              objectFit: 'contain', display: 'block',
            }}
          />

          <button
            onClick={handleReplay}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              animation: 'replayFadeIn 0.3s ease-out 0.3s both',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}>
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Replay Video
          </button>

          <style>{`
            @keyframes brandFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes replayFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
