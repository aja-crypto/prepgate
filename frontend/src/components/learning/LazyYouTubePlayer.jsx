import { useState } from 'react';
import { useYoutubeThumbnail } from '../../hooks/useYoutubeThumbnail';

export default function LazyYouTubePlayer({ videoId, title, onError, autoPlay = false }) {
  const [loaded, setLoaded] = useState(autoPlay);
  const [failed, setFailed] = useState(false);
  const { src: thumbnail, onError: onThumbError, exhausted: thumbExhausted } = useYoutubeThumbnail(videoId, '');

  const embedUrl = (() => {
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
  })();

  if (!videoId) return null;

  if (failed) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-3xl mb-2">🎬</div>
          <p className="text-sm text-text2/80 font-medium">Video unavailable</p>
          <p className="text-xs text-text3/60 mt-1 break-word">This video could not be loaded at the moment.</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className="relative w-full aspect-video rounded-2xl overflow-hidden group cursor-pointer bg-black"
        aria-label={`Play ${title || 'video'}`}
      >
        {thumbnail && !thumbExhausted ? (
          <img
            src={thumbnail}
            sizes="(min-width: 768px) 60vw, 100vw"
            alt={title || 'Video thumbnail'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={onThumbError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white/50"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white transition-all flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-purple-500/25 duration-300">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-900 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <p className="text-sm font-medium text-white truncate">{title}</p>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
      <iframe
        key={videoId}
        src={embedUrl}
        title={title || 'YouTube video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full"
        loading="lazy"
        onError={() => { setFailed(true); onError?.(); }}
      />
    </div>
  );
}
