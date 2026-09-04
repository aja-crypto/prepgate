import React, { useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from './VideoPlayerContext';
import './PersistentVideoPlayer.css';

export default function PersistentVideoPlayer() {
  const { player, closeVideo, updatePlayer } = useVideoPlayer();
  const videoRef = useRef(null);
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

  const handleMinimize = () => {
    setMinimized((v) => !v);
  };

  const handlePictureInPicture = async () => {
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
    <div className={`gx-persistent-player ${minimized ? 'gx-persistent-player--mini' : ''}`} role="dialog" aria-label={`Playing ${player.title}`}>
      <div className="gx-player-shell">
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
        <div className="gx-player-info">
          <div className="gx-player-title" title={player.title}>{player.title}</div>
          <div className="gx-player-actions">
            <button type="button" onClick={handleMinimize} aria-label={minimized ? 'Expand video' : 'Minimize video'}>
              {minimized ? '↗' : '—'}
            </button>
            {isNativeVideo && (
              <button type="button" onClick={handlePictureInPicture} aria-label="Picture in Picture">
                ⧉
              </button>
            )}
            <button type="button" onClick={handleClose} aria-label="Close video">×</button>
          </div>
        </div>
      </div>
    </div>
  );
}
