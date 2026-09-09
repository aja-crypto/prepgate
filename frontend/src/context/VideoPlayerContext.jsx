// VideoPlayerContext — manages persistent video state across routes
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const VideoPlayerContext = createContext(null);

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isNativeVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function getVideoType(url) {
  const ytId = extractYouTubeId(url);
  if (ytId) return { type: 'youtube', youtubeId: ytId };
  if (isNativeVideoUrl(url)) return { type: 'native' };
  return { type: 'iframe' };
}

export function VideoPlayerProvider({ children }) {
  const [videoState, setVideoState] = useState({
    active: false,
    url: '',
    title: '',
    type: 'native',
    youtubeId: null,
  });

  const [pipActive, setPipActive] = useState(false);
  const [pipPosition, setPipPosition] = useState({ x: null, y: null });
  const [minimized, setMinimized] = useState(false);
  const playbackTimeRef = useRef(0);
  const videoRef = useRef(null);

  const playVideo = useCallback((url, title = '') => {
    const { type, youtubeId } = getVideoType(url);
    setVideoState({ active: true, url, title, type, youtubeId });
    setPipActive(false);
    setMinimized(false);
    setPipPosition({ x: null, y: null });
    playbackTimeRef.current = 0;
  }, []);

  const stopVideo = useCallback(() => {
    setVideoState({ active: false, url: '', title: '', type: 'native', youtubeId: null });
    setPipActive(false);
    setMinimized(false);
    setPipPosition({ x: null, y: null });
    playbackTimeRef.current = 0;
  }, []);

  const enterPip = useCallback(() => {
    setPipActive(true);
    setMinimized(false);
  }, []);

  const exitPip = useCallback(() => {
    setPipActive(false);
    setPipPosition({ x: null, y: null });
  }, []);

  const minimizePip = useCallback(() => {
    setMinimized(true);
  }, []);

  const restorePip = useCallback(() => {
    setMinimized(false);
  }, []);

  const updatePipPosition = useCallback((pos) => {
    setPipPosition(pos);
  }, []);

  const value = {
    videoState,
    pipActive,
    pipPosition,
    minimized,
    playbackTimeRef,
    videoRef,
    playVideo,
    stopVideo,
    enterPip,
    exitPip,
    minimizePip,
    restorePip,
    updatePipPosition,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  return ctx;
}

export { extractYouTubeId, getVideoType };
