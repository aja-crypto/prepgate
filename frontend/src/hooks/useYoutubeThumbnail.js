import { useState, useCallback } from 'react';

// YouTube thumbnail quality fallback chain (highest → lowest)
const QUALITY_CHAIN = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];

/**
 * Returns a YouTube thumbnail URL with an automatic fallback chain:
 * maxresdefault → hqdefault → mqdefault → default.
 *
 * `onError` should be attached to the <img> element. When a quality 404s,
 * the hook advances to the next one. `exhausted` is true once all
 * qualities have failed, so callers can render a placeholder.
 */
export function useYoutubeThumbnail(videoId, fallbackThumbnail) {
  const [step, setStep] = useState(0);

  const exhausted = videoId ? step >= QUALITY_CHAIN.length : false;
  const src = videoId
    ? (exhausted ? null : `https://img.youtube.com/vi/${videoId}/${QUALITY_CHAIN[step]}.jpg`)
    : (fallbackThumbnail || '');

  const onError = useCallback(() => {
    setStep(s => s + 1);
  }, []);

  return { src, onError, exhausted };
}

export default useYoutubeThumbnail;
