// src/hooks/usePrefetch.js – DEPRECATED. Not imported anywhere; kept for backward compatibility.
// This hook is no longer used. See src/services/apiCache.js for potential future use (also unused).
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Cache for prefetched data
const prefetchedData = new Map();

// Prefetch a specific endpoint
export function prefetchApi(url, ttl = 300000) {
  if (prefetchedData.has(url)) return prefetchedData.get(url);
  
  const promise = api.get(url)
    .then(res => {
      const data = { data: res.data, timestamp: Date.now() };
      prefetchedData.set(url, data);
      setTimeout(() => prefetchedData.delete(url), ttl);
      return data;
    })
    .catch(() => null);
  
  prefetchedData.set(url, promise);
  return promise;
}

// Get prefetched data if available
export function getPrefetched(url) {
  const cached = prefetchedData.get(url);
  if (cached && !cached.then) {
    if (Date.now() - cached.timestamp < 300000) return cached.data;
    prefetchedData.delete(url);
  }
  return null;
}

// Hook to prefetch data when route mounts
export function usePrefetch(url, options = {}) {
  const { user } = useAuth();
  const hasPrefetched = useRef(false);
  
  useEffect(() => {
    if (!user || hasPrefetched.current) return;
    
    if (options.enabled === false) return;
    
    const timeout = setTimeout(() => {
      prefetchApi(url);
      hasPrefetched.current = true;
    }, options.delay || 500);
    
    return () => clearTimeout(timeout);
  }, [user, url, options.enabled, options.delay]);
}

// Prefetch critical data on app load
export function useCriticalPrefetch() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const prefetchOnIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Prefetch most-used data
          prefetchApi('/subjects?hierarchy=true');
          prefetchApi('/progress');
          prefetchApi('/pyq?limit=50');
          prefetchApi('/mocks');
        }, { timeout: 3000 });
      }
    };
    
    // Start prefetching after initial render
    const timer = setTimeout(prefetchOnIdle, 1000);
    return () => clearTimeout(timer);
  }, [user]);
}

// Hook for smart data loading with cache
export function useSmartFetch(url, options = {}) {
  const { user } = useAuth();
  const dataRef = useRef(null);
  const loadingRef = useRef(true);
  
  useEffect(() => {
    if (!user) return;
    
    const cached = getPrefetched(url);
    if (cached) {
      dataRef.current = cached;
      loadingRef.current = false;
      return;
    }
    
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        const res = await api.get(url, { signal: AbortSignal.timeout(15000) });
        if (!cancelled) {
          dataRef.current = res.data;
          loadingRef.current = false;
        }
      } catch (err) {
        if (!cancelled) loadingRef.current = false;
      }
    };
    
    fetchData();
    return () => { cancelled = true; };
  }, [url, user]);
  
  return { data: dataRef.current, loading: loadingRef.current };
}
