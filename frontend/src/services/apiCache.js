// src/services/apiCache.js – Request deduplication + response caching
import { api } from './api';

// In-flight request deduplication
const inflight = new Map();

// Response cache
const responseCache = new Map();

// Cache TTL defaults
const CACHE_TTL = {
  subjects: 300000,      // 5 minutes
  topics: 300000,        // 5 minutes
  pyq: 180000,           // 3 minutes
  mocks: 300000,         // 5 minutes
  progress: 120000,      // 2 minutes
  analytics: 300000,     // 5 minutes
  liveData: 60000,       // 1 minute
  user: 600000,          // 10 minutes
};

function getCacheKey(config) {
  return `${config.method || 'get'}:${config.url}:${JSON.stringify(config.params || {})}`;
}

// Deduplicate in-flight requests
async function dedupedRequest(config) {
  const key = getCacheKey(config);
  
  // If same request is in-flight, return existing promise
  if (inflight.has(key)) {
    return inflight.get(key);
  }
  
  const promise = api(config).finally(() => {
    inflight.delete(key);
  });
  
  inflight.set(key, promise);
  return promise;
}

// Cached request
export async function cachedRequest(config, ttl = 30000) {
  const key = getCacheKey(config);
  
  // Check cache first
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.response;
  }
  
  // Make request with deduplication
  const response = await dedupedRequest(config);
  
  // Cache the response
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
  });
  
  // Auto-expire cache entries
  setTimeout(() => responseCache.delete(key), ttl);
  
  return response;
}

// Predefined cached API calls
export const cachedApi = {
  getSubjects: () => cachedRequest({ url: '/subjects', params: { hierarchy: 'true' } }, CACHE_TTL.subjects),
  getTopics: (subjectId) => cachedRequest({ url: `/subjects/${subjectId}` }, CACHE_TTL.topics),
  getProgress: () => cachedRequest({ url: '/progress' }, CACHE_TTL.progress),
  getAnalytics: () => cachedRequest({ url: '/subjects/analytics/overview' }, CACHE_TTL.analytics),
  getPyqs: (params = {}) => cachedRequest({ url: '/pyq', params }, CACHE_TTL.pyq),
  getMocks: () => cachedRequest({ url: '/mocks' }, CACHE_TTL.mocks),
  getLiveData: () => cachedRequest({ url: '/live-data' }, CACHE_TTL.liveData),
  getUser: () => cachedRequest({ url: '/auth/me' }, CACHE_TTL.user),
};

// Clear cache
export function clearCache(pattern) {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  for (const [key] of responseCache) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

// Invalidate specific cache entries on mutations
export function invalidateCache(urlPattern) {
  for (const [key] of responseCache) {
    if (key.includes(urlPattern)) {
      responseCache.delete(key);
    }
  }
}

export default { cachedRequest, cachedApi, clearCache, invalidateCache };
