import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const VideoPlayerContext = createContext(null);

export function VideoPlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [floatingPip, setFloatingPip] = useState(false);
  const [pipPosition, setPipPosition] = useState(null);

  const buildYoutubeEmbedUrl = useCallback((videoId) => {
    if (!videoId) return '';
    const url = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('controls', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('origin', window.location.origin);
    return url.toString();
  }, []);

  const playVideo = useCallback((video) => {
    if (!video) return;
    const videoId = video.videoId || video.youtubeId || null;
    const rawUrl = video.videoUrl || video.youtubeUrl || video.url || video.sourceUrl || '';
    const isYoutubeId = !!videoId;
    const youtubeUrl = isYoutubeId ? buildYoutubeEmbedUrl(videoId) : rawUrl;
    const thumbnail = video.thumbnail || video.youtubeThumbnail || video.thumbnailUrl || video.image || '';
    setPlayer({
      id: video.id || video._id || videoId || String(Date.now()),
      title: video.title || 'GateNexa Video',
      thumbnail,
      videoUrl: youtubeUrl,
      rawUrl,
      source: video.source || (isYoutubeId ? 'youtube' : 'file'),
      videoId,
      currentTime: 0,
      isPlaying: true,
    });
  }, [buildYoutubeEmbedUrl]);

  const closeVideo = useCallback(() => {
    setPlayer(null);
    setFloatingPip(false);
    setPipPosition(null);
  }, []);

  const updatePlayer = useCallback((updates) => {
    setPlayer((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const updatePip = useCallback((updates) => {
    if (typeof updates === 'boolean') {
      setFloatingPip(updates);
      return;
    }
    if (updates.position) setPipPosition(updates.position);
    if (typeof updates.floating === 'boolean') setFloatingPip(updates.floating);
  }, []);

  const value = useMemo(() => ({
    player,
    playVideo,
    closeVideo,
    updatePlayer,
    floatingPip,
    pipPosition,
    updatePip,
  }), [player, playVideo, closeVideo, updatePlayer, floatingPip, pipPosition, updatePip]);

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used inside VideoPlayerProvider');
  }
  return context;
}
