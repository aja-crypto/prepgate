import { useState, useRef, useEffect, useCallback } from 'react';

const VIDEO_SRC = '/icons/gatenexa-brand-intro.mp4';
const BRAND_IMG = '/images/logo.png';
const DESKTOP_SCALE = 1.45;
const MOBILE_SCALE = 1.8;

export default function BrandIntroModal({ open, onClose }) {
  const [phase, setPhase] = useState('video');
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setPhase('video');
      closeTimerRef.current = setTimeout(() => {
        const vid = videoRef.current;
        if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
      }, 150);
    }
    return () => clearTimeout(closeTimerRef.current);
  }, [open]);

  const handleVideoEnd = useCallback(() => setPhase('brand'), []);

  const handleReplay = useCallback(() => {
    setPhase('video');
    const vid = videoRef.current;
    if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(onClose, 200);
  }, [onClose]);

  if (!open || !visible) return null;

  const scale = isMobile ? MOBILE_SCALE : DESKTOP_SCALE;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200000,
        background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
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
            width: isMobile ? '140vw' : '100vw',
            height: isMobile ? '100vh' : '105vh',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            onEnded={handleVideoEnd}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: isMobile ? '50% 48%' : '50% 50%',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              display: 'block', background: '#000000',
              willChange: 'transform',
            }}
            preload="auto"
            playsInline
            autoPlay
            disablePictureInPicture
          />
        </div>
      )}

      {/* Brand Phase */}
      {phase === 'brand' && (
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 32,
            animation: 'brandFadeIn 0.3s ease-out forwards',
          }}
        >
          <img
            src={BRAND_IMG}
            alt="GateNexa"
            style={{
              maxWidth: isMobile ? '70vw' : '60vw',
              maxHeight: isMobile ? '50vh' : '60vh',
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
