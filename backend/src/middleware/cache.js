// src/middleware/cache.js – In-memory response caching for GET endpoints
const crypto = require('crypto');

// In-memory cache store
const cache = new Map();

// Cacheable route patterns with their TTL
const CACHE_CONFIG = {
  '/api/subjects/hierarchy': { ttl: 600000, key: 'subjects:hierarchy' },
  '/api/progress/sync': { ttl: 30000, key: 'progress:sync' },
  '/api/mocks': { ttl: 120000, key: 'mocks:list' },
  '/api/pyq': { ttl: 180000, key: 'pyq:list' },
  '/api/notes': { ttl: 180000, key: 'notes:list' },
  '/api/study-plan': { ttl: 300000, key: 'study-plan:list' },
  '/api/weekly-tests': { ttl: 300000, key: 'weekly-tests:list' },
};

function getCacheKey(req) {
  if (req.user?._id) return `${req.user._id}:${req.originalUrl}`;
  return req.originalUrl;
}

function shouldCache(req) {
  if (req.method !== 'GET') return false;
  const url = req.originalUrl || req.url;
  for (const pattern of Object.keys(CACHE_CONFIG)) {
    if (url.startsWith(pattern)) return true;
  }
  return false;
}

function responseCacheMiddleware(req, res, next) {
  if (!shouldCache(req)) return next();

  const key = getCacheKey(req);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `private, max-age=${Math.floor(cached.ttl / 1000)}`);
    return res.json(cached.data);
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    cache.set(key, { data: body, timestamp: Date.now(), ttl: 120000 });
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'private, max-age=120');
    for (const [pattern, config] of Object.entries(CACHE_CONFIG)) {
      if (req.originalUrl.startsWith(pattern)) {
        cache.get(key).ttl = config.ttl;
        res.set('Cache-Control', `private, max-age=${Math.floor(config.ttl / 1000)}`);
        break;
      }
    }
    return originalJson(body);
  };

  next();
}

// Invalidate cache by pattern
function invalidateCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const [key] of cache) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}, 300000);

if (cleanupInterval.unref) cleanupInterval.unref();

process.on('SIGTERM', () => clearInterval(cleanupInterval));
process.on('SIGINT', () => clearInterval(cleanupInterval));

module.exports = { responseCacheMiddleware, invalidateCache };
