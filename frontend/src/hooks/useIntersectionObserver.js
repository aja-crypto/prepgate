import { useState, useEffect, useRef } from 'react';

export function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.once !== false) {
            setHasIntersected(true);
            observer.unobserve(el);
          }
        } else if (options.once === false) {
          setIsVisible(false);
        }
      },
      { rootMargin: '200px', threshold: 0, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold, options.once, hasIntersected]);

  return [ref, isVisible || hasIntersected];
}

export function useLazyImage(options = {}) {
  return useIntersectionObserver({ ...options, once: true });
}
