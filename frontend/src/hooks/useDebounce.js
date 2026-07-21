import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useDebouncedCallback(fn, deps = [], delay = 300) {
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, deps);
}
