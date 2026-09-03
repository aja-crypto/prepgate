// src/middleware/cache.js – In-memory response caching for GET endpoints
const crypto = require('crypto');

// In-memory cache store
const cache = new Map();

const CACHE_CONFIG = {
  '/api/subjects/hierarchy': { ttl: 600000, key: 'subjects:hierarchy' },
};

const MAX_CACHE_ENTRIES = 500;

function getCacheKey(req) {
  if (req.user?._id) return `${req.user._id}:${req.originalUrl}`;
  const token = req.headers.authorization || req.headers['x-demo-user'] || '';
  const hash = crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 12);
  return `anon:${hash}:${req.originalUrl}`;
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
    const config = Object.entries(CACHE_CONFIG).find(([p]) => req.originalUrl.startsWith(p))?.[1];
    const ttl = config ? config.ttl : 120000;
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, { data: body, timestamp: Date.now(), ttl });
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', `private, max-age=${Math.floor(ttl / 1000)}`);
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
