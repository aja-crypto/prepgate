import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from './VideoPlayerContext';
import './PersistentVideoPlayer.css';

const DRAG_THRESHOLD = 6;
const VIEWPORT_MARGIN = 8;
const LOAD_FALLBACK_MS = 8000;

function clampToViewport(left, top, width, height) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    left: Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN)),
    top: Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN)),
  };
}

export default function PersistentVideoPlayer() {
  const { player, closeVideo, updatePlayer, floatingPip, pipPosition, updatePip } = useVideoPlayer();
  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const loadedIdRef = useRef(null);
  const dragRef = useRef(null);
  const loadTimerRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!player) return;
    setMinimized(false);
    setPos(null);
    setLoading(loadedIdRef.current === player.id ? false : true);
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), LOAD_FALLBACK_MS);
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [player?.id]);

  useEffect(() => {
    if (!player) return;
    const onResize = () => {
      setPos((p) => {
        if (!p) return p;
        const rect = shellRef.current?.getBoundingClientRect();
        const w = p.width || rect?.width || 320;
        const h = rect?.height || 200;
        return { ...clampToViewport(p.left, p.top, w, h), width: p.width };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [player?.id]);

  useEffect(() => {
    setPos((p) => {
      if (!p) return p;
      const rect = shellRef.current?.getBoundingClientRect();
      const w = p.width || rect?.width || 320;
      const h = rect?.height || 200;
      return { ...clampToViewport(p.left, p.top, w, h), width: p.width };
    });
  }, [minimized]);

  if (!player) return null;

  const isNativeVideo = player.source === 'file' || player.source === 'mp4' || (player.rawUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(player.rawUrl));

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    updatePlayer({ currentTime: videoRef.current.currentTime });
  };

  const handleLoaded = () => {
    loadedIdRef.current = player.id;
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setLoading(false);
  };

  const handleClose = () => {
    if (videoRef.current && document.pictureInPictureElement === videoRef.current) {
      document.exitPictureInPicture().catch(() => {});
    }
    closeVideo();
  };

  const clampPosition = useCallback((x, y) => {
    const rect = shellRef.current?.getBoundingClientRect();
    const margin = 12;
    const safeInset = parseFloat(getComputedStyle(shellRef.current || document.documentElement)
      .getPropertyValue('--gx-safe-bottom')) || 0;
    const bottomSafeArea = window.matchMedia('(max-width: 767px)').matches ? 78 + safeInset : margin;
    const width = rect?.width || Math.min(420, window.innerWidth - margin * 2);
    const height = rect?.height || 280;
    return {
      x: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - height - bottomSafeArea)),
    };
  }, []);

  const setInitialPipPosition = useCallback(() => {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 12;
    const safeInset = parseFloat(getComputedStyle(shellRef.current || document.documentElement)
      .getPropertyValue('--gx-safe-bottom')) || 0;
    const bottomSafeArea = window.matchMedia('(max-width: 767px)').matches ? 78 + safeInset : margin;
    updatePip({
      position: clampPosition(window.innerWidth - rect.width - margin, window.innerHeight - rect.height - bottomSafeArea),
    });
  }, [clampPosition, updatePip]);

  useEffect(() => {
    if (!floatingPip) return undefined;
    if (!pipPosition) setInitialPipPosition();
    const onResize = () => {
      if (pipPosition) updatePip({ position: clampPosition(pipPosition.x, pipPosition.y) });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [floatingPip, pipPosition, setInitialPipPosition, clampPosition, updatePip]);

  const handlePointerDown = (event) => {
    if (!floatingPip || event.button !== 0 || event.target.closest('button')) return;
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    updatePip({ position: clampPosition(
      event.clientX - dragRef.current.offsetX,
      event.clientY - dragRef.current.offsetY,
    ) });
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const handleMinimize = () => {
    setMinimized((v) => !v);
  };

  const handlePictureInPicture = async () => {
    if (!isNativeVideo) {
      updatePip({ floating: !floatingPip });
      return;
    }
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      if (document.pictureInPictureEnabled && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('[GateNexa Video] PiP unavailable', e);
    }
  };

  const handleDragStart = (e) => {
    if (e.target.closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const shell = shellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
      width: rect.width,
      height: rect.height,
      active: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture unavailable — drag still works via bubbled moves */
    }
  };

  const handleDragMove = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.active = true;
      setDragging(true);
    }
    const p = clampToViewport(d.baseLeft + dx, d.baseTop + dy, d.width, d.height);
    setPos({ ...p, width: d.width });
  };

  const handleDragEnd = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    if (d.active) setDragging(false);
  };

  return (
    <div
      className={`gx-persistent-player${minimized ? ' gx-persistent-player--mini' : ''}${dragging ? ' gx-persistent-player--dragging' : ''}${floatingPip ? ' gx-persistent-player--floating' : ''}`}
      role="dialog"
      aria-label={`Playing ${player.title}`}
      style={floatingPip && pipPosition ? { left: pipPosition.x, top: pipPosition.y, right: 'auto', bottom: 'auto', width: pipPosition.width || undefined, maxWidth: 'calc(100vw - 16px)' } : pos ? { left: pos.left, top: pos.top, right: 'auto', bottom: 'auto', width: pos.width, maxWidth: 'calc(100vw - 16px)' } : undefined}
    >
      <div className="gx-player-shell" ref={shellRef}>
        <div className="gx-player-media">
          {loading && (
            <div className="gx-player-loading">
              <span className="gx-player-spinner" />
              <span>Loading video...</span>
            </div>
          )}
          {isNativeVideo ? (
            <video
              key={player.id}
              ref={videoRef}
              src={player.rawUrl || player.videoUrl}
              poster={player.thumbnail || undefined}
              controls
              playsInline
              autoPlay
              onLoadedData={handleLoaded}
              onTimeUpdate={handleTimeUpdate}
              onError={handleLoaded}
            />
          ) : (
            <iframe
              key={player.id}
              src={player.videoUrl}
              title={player.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={handleLoaded}
              onError={handleLoaded}
            />
          )}
        </div>
        <div
          className="gx-player-info gx-player-handle"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="gx-player-title" title={player.title}>{player.title}</div>
          <div className="gx-player-actions">
            <button type="button" onClick={handleMinimize} aria-label={minimized ? 'Expand video' : 'Minimize video'}>
              {minimized ? '↗' : '—'}
            </button>
            <button type="button" onClick={handlePictureInPicture} aria-label={floatingPip ? 'Exit Picture in Picture' : 'Picture in Picture'}>
              {floatingPip ? '↙' : '⧉'}
            </button>
            <button type="button" onClick={handleClose} aria-label="Close video">×</button>
          </div>
        </div>
      </div>
    </div>
  );
}
