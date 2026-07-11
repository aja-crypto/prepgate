import { useRef, useCallback } from 'react';

const MAX_ENTRIES = 100;
const TTL_MS = 3600000;

function createCache() {
  const cache = new Map();

  function _key(question) {
    return question.trim().toLowerCase();
  }

  function get(question) {
    const entry = cache.get(_key(question));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(_key(question));
      return null;
    }
    entry.hits++;
    return entry.data;
  }

  function set(question, data, ttl = TTL_MS) {
    if (cache.size >= MAX_ENTRIES) {
      let oldest = null;
      let oldestTime = Infinity;
      for (const [k, v] of cache.entries()) {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldest = k;
        }
      }
      if (oldest) cache.delete(oldest);
    }
    cache.set(_key(question), {
      data,
      expiresAt: Date.now() + ttl,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  function has(question) {
    return get(question) !== null;
  }

  function clear() {
    cache.clear();
  }

  return { get, set, has, clear };
}

export default function useAiCache() {
  const cacheRef = useRef(createCache());

  const getCached = useCallback((question) => {
    return cacheRef.current.get(question);
  }, []);

  const setCached = useCallback((question, data, ttl) => {
    cacheRef.current.set(question, data, ttl);
  }, []);

  const hasCached = useCallback((question) => {
    return cacheRef.current.has(question);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getCached, setCached, hasCached, clearCache };
}
