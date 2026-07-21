import { useState, useRef, useEffect, useCallback } from 'react';

const EMBED_BASE = 'https://www.youtube-nocookie.com/embed';

export default function EmbeddedYouTubePlayer({ videoId, title, onProgress, autoPlay, onError }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const progressTimer = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | playing | paused | error
  const [errorReason, setErrorReason] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const cleanup = useCallback(() => {
    clearInterval(progressTimer.current);
    if (playerRef.current?.destroy) {
      try { playerRef.current.destroy(); } catch {}
    }
    playerRef.current = null;
  }, []);

  useEffect(() => {
    if (!videoId) return;
    let mounted = true;

    const loadPlayer = () => {
      if (!mounted || !containerRef.current) return;
      try {
        playerRef.current = new YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            rel: 0, modestbranding: 1, playsinline: 1,
            autoplay: autoPlay ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!mounted) return;
              setState('ready');
              if (autoPlay) playerRef.current?.playVideo();
            },
            onStateChange: (e) => {
              if (!mounted) return;
              if (e.data === YT.PlayerState.PLAYING) {
                setState('playing');
                clearInterval(progressTimer.current);
                progressTimer.current = setInterval(() => {
                  const t = playerRef.current?.getCurrentTime();
                  const dur = playerRef.current?.getDuration() || 0;
                  if (t !== undefined) {
                    setCurrentTime(t);
                    onProgress?.(t, dur);
                  }
                }, 15000);
              } else if (e.data === YT.PlayerState.PAUSED) {
                setState('paused');
                clearInterval(progressTimer.current);
              } else if (e.data === YT.PlayerState.ENDED) {
                setState('paused');
                clearInterval(progressTimer.current);
                onProgress?.(currentTime, duration);
              }
            },
            onError: (e) => {
              if (!mounted) return;
              let reason = 'Unknown error';
              switch (e.data) {
                case 2: reason = 'Invalid video ID'; break;
                case 5: reason = 'HTML5 player error'; break;
                case 100: reason = 'Video not found or removed'; break;
                case 101: case 150: reason = 'Embedding disabled by video owner'; break;
              }
              setState('error');
              setErrorReason(reason);
              onError?.(reason);
              cleanup();
            },
          },
        });
      } catch (err) {
        if (!mounted) return;
        setState('error');
        setErrorReason(err.message || 'Player initialization failed');
        onError?.(err.message);
      }
    };

    // Ensure YT API is loaded
    if (!window.YT?.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onload = () => {
        if (window.YT?.Player) loadPlayer();
        else setTimeout(loadPlayer, 500);
      };
      document.head.appendChild(tag);
      // If YT API was already loading, wait for it
      const check = setInterval(() => {
        if (window.YT?.Player) { clearInterval(check); loadPlayer(); }
      }, 200);
      setTimeout(() => clearInterval(check), 10000);
    } else {
      loadPlayer();
    }

    return () => { mounted = false; cleanup(); };
  }, [videoId]);

  const retry = useCallback(() => {
    setState('loading');
    setErrorReason('');
    cleanup();
    setTimeout(() => {
      if (containerRef.current && window.YT?.Player) {
        try {
          playerRef.current = new YT.Player(containerRef.current, {
            videoId, playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1 },
            events: {
              onReady: () => { setState('ready'); playerRef.current?.playVideo(); },
              onError: (e) => {
                let r = 'Unknown error';
                if (e.data === 101 || e.data === 150) r = 'Embedding disabled by video owner';
                else if (e.data === 100) r = 'Video not found';
                else if (e.data === 2) r = 'Invalid video ID';
                setState('error'); setErrorReason(r);
              },
            },
          });
        } catch { setState('error'); setErrorReason('Failed to retry'); }
      } else {
        setState('error'); setErrorReason('Player not ready');
      }
    }, 300);
  }, [videoId, cleanup]);

  const directUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Error state → fallback UI
  if (state === 'error') {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-gray-900/80 p-6 text-center" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="text-3xl mb-3">⛔</div>
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Video unavailable for in-app playback</h3>
        <p className="text-xs text-gray-500 mb-1">{errorReason || 'The creator has disabled embedding for this video.'}</p>
        <p className="text-[10px] text-gray-600 mb-4">You can open it directly on YouTube to watch.</p>
        <div className="flex items-center justify-center gap-3">
          <a href={directUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
            ▶ Open on YouTube
          </a>
          <button onClick={retry}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden bg-black" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="relative aspect-video bg-gray-950">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
