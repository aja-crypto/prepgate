import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from './VideoPlayerContext';
import './PersistentVideoPlayer.css';

export default function PersistentVideoPlayer() {
  const { player, closeVideo, updatePlayer, floatingPip, pipPosition, updatePip } = useVideoPlayer();
  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const dragRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!player) return;
    setMinimized(false);
    setLoading(true);
  }, [player?.id]);

  if (!player) return null;

  const isNativeVideo = player.source === 'file' || player.source === 'mp4' || (player.rawUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(player.rawUrl));

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    updatePlayer({ currentTime: videoRef.current.currentTime });
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

  return (
    <div
      className={`gx-persistent-player ${minimized ? 'gx-persistent-player--mini' : ''} ${floatingPip ? 'gx-persistent-player--floating' : ''}`}
      style={floatingPip && pipPosition ? { left: pipPosition.x, top: pipPosition.y, right: 'auto', bottom: 'auto' } : undefined}
      role="dialog"
      aria-label={`Playing ${player.title}`}
    >
      <div ref={shellRef} className="gx-player-shell">
        <div className="gx-player-media">
          {loading && (
            <div className="gx-player-loading">
              <span className="gx-player-spinner" />
              <span>Loading video...</span>
            </div>
          )}
          {isNativeVideo ? (
            <video
              ref={videoRef}
              src={player.rawUrl || player.videoUrl}
              poster={player.thumbnail || undefined}
              controls
              playsInline
              autoPlay
              onLoadedData={() => setLoading(false)}
              onTimeUpdate={handleTimeUpdate}
              onError={() => setLoading(false)}
            />
          ) : (
            <iframe
              src={player.videoUrl}
              title={player.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
        <div
          className={`gx-player-info ${floatingPip ? 'gx-player-drag-handle' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
