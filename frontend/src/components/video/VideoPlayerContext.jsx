import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const VideoPlayerContext = createContext(null);

export function VideoPlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);

  const playVideo = useCallback((video) => {
    if (!video) return;
    const videoId = video.videoId || video.youtubeId || null;
    const rawUrl = video.videoUrl || video.youtubeUrl || video.url || video.sourceUrl || '';
    const isYoutubeId = !!videoId;
    const youtubeUrl = isYoutubeId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1` : rawUrl;
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
  }, []);

  const closeVideo = useCallback(() => {
    setPlayer(null);
  }, []);

  const updatePlayer = useCallback((updates) => {
    setPlayer((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const value = useMemo(() => ({
    player,
    playVideo,
    closeVideo,
    updatePlayer,
  }), [player, playVideo, closeVideo, updatePlayer]);

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
