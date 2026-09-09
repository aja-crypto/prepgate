// PersistentVideoPlayer — draggable PiP player that survives route changes
import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVideoPlayer } from '../../context/VideoPlayerContext';

const PIP_WIDTH = 360;
const PIP_HEIGHT = 202;
const EDGE_MARGIN = 12;
const MOBILE_NAV_HEIGHT = 64;

function clampPosition(x, y, isMobile) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minY = isMobile ? vh - MOBILE_NAV_HEIGHT - PIP_HEIGHT - EDGE_MARGIN : EDGE_MARGIN;
  const maxY = isMobile ? vh - MOBILE_NAV_HEIGHT - EDGE_MARGIN : vh - EDGE_MARGIN;
  return {
    x: Math.max(EDGE_MARGIN, Math.min(x, vw - PIP_WIDTH - EDGE_MARGIN)),
    y: Math.max(EDGE_MARGIN, Math.min(y, maxY)),
  };
}

function getDefaultPosition(isMobile) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = vw - PIP_WIDTH - EDGE_MARGIN;
  const y = isMobile
    ? vh - MOBILE_NAV_HEIGHT - PIP_HEIGHT - EDGE_MARGIN
    : vh - PIP_HEIGHT - EDGE_MARGIN;
  return { x, y };
}

function YouTubeEmbed({ videoId, playbackTimeRef }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
      title="YouTube video player"
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

function NativeVideo({ url, videoRef, playbackTimeRef }) {
  return (
    <video
      ref={videoRef}
      src={url}
      controls
      autoPlay
      className="w-full h-full object-contain bg-black"
      onTimeUpdate={(e) => {
        playbackTimeRef.current = e.target.currentTime;
      }}
    />
  );
}

function IframePlayer({ url }) {
  return (
    <iframe
      src={url}
      title="Video player"
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

export default function PersistentVideoPlayer() {
  const {
    videoState,
    pipActive,
    pipPosition,
    minimized,
    playbackTimeRef,
    videoRef,
    exitPip,
    minimizePip,
    restorePip,
    updatePipPosition,
    stopVideo,
  } = useVideoPlayer();

  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Clamp position on resize / orientation change
  useEffect(() => {
    if (!pipActive || !videoState.active) return;
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const current = pipPosition.x === null ? getDefaultPosition(mobile) : pipPosition;
      const clamped = clampPosition(current.x, current.y, mobile);
      updatePipPosition(clamped);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pipActive, videoState.active, pipPosition.x, pipPosition.y, updatePipPosition]);

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    setIsDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const newX = dragStartRef.current.elemX + dx;
    const newY = dragStartRef.current.elemY + dy;
    const clamped = clampPosition(newX, newY, isMobile);
    updatePipPosition(clamped);
  }, [isDragging, isMobile, updatePipPosition]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!videoState.active || !pipActive) return null;

  const pos = pipPosition.x === null ? getDefaultPosition(isMobile) : pipPosition;

  const playerContent = (
    <div
      ref={containerRef}
      className={`gx-persistent-player ${minimized ? 'gx-pip-minimized' : ''}`}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
        zIndex: 9998,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="gx-pip-chrome">
        <div className="gx-pip-titlebar">
          <span className="gx-pip-title">{videoState.title || 'Video'}</span>
          <div className="gx-pip-controls">
            <button
              className="gx-pip-btn"
              onClick={(e) => { e.stopPropagation(); minimized ? restorePip() : minimizePip(); }}
              title={minimized ? 'Restore' : 'Minimize'}
            >
              {minimized ? '□' : '—'}
            </button>
            <button
              className="gx-pip-btn gx-pip-btn-close"
              onClick={(e) => { e.stopPropagation(); exitPip(); }}
              title="Close PiP"
            >
              ✕
            </button>
          </div>
        </div>
        {!minimized && (
          <div className="gx-pip-video">
            {videoState.type === 'youtube' && (
              <YouTubeEmbed videoId={videoState.youtubeId} playbackTimeRef={playbackTimeRef} />
            )}
            {videoState.type === 'native' && (
              <NativeVideo url={videoState.url} videoRef={videoRef} playbackTimeRef={playbackTimeRef} />
            )}
            {videoState.type === 'iframe' && (
              <IframePlayer url={videoState.url} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(playerContent, document.body);
}
