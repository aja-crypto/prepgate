const logger = require('../utils/aiLogger');

const AI_LIMITS = {
  chat: { maxRequests: 60, windowMs: 60000 },
  stream: { maxRequests: 30, windowMs: 60000 },
  planner: { maxRequests: 20, windowMs: 60000 },
  recommendations: { maxRequests: 30, windowMs: 60000 },
  doubt: { maxRequests: 30, windowMs: 60000 },
};

const userLimits = new Map();

function checkRateLimit(userId, limitKey) {
  const config = AI_LIMITS[limitKey];
  if (!config) return { allowed: true };

  const key = `${userId}:${limitKey}`;
  const now = Date.now();
  const userRecord = userLimits.get(key) || { requests: [], blocked: false };

  userRecord.requests = userRecord.requests.filter(t => now - t < config.windowMs);

  if (userRecord.requests.length >= config.maxRequests) {
    const oldestRequest = userRecord.requests[0];
    const resetTime = oldestRequest + config.windowMs;
    const waitMs = resetTime - now;

    userLimits.set(key, userRecord);
    return {
      allowed: false,
      retryAfter: Math.ceil(waitMs / 1000),
      message: `Rate limit exceeded for ${limitKey}. Try again in ${Math.ceil(waitMs / 1000)}s.`,
    };
  }

  userRecord.requests.push(now);
  userLimits.delete(key);
  userLimits.set(key, userRecord);

  return { allowed: true };
}

function aiRateLimit(limitKey) {
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.user?.id?.toString() || 'anonymous';

    const result = checkRateLimit(userId, limitKey);
    if (!result.allowed) {
      logger.logRateLimit(userId, limitKey);
      res.set('Retry-After', result.retryAfter?.toString() || '60');
      return res.status(429).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userLimits.entries()) {
    const limitKey = key.split(':')[1];
    const config = AI_LIMITS[limitKey];
    if (!config) continue;

    const recent = record.requests.filter(t => now - t < config.windowMs);
    if (recent.length === 0) {
      userLimits.delete(key);
    } else {
      record.requests = recent;
    }
  }
}, 300000);

if (setInterval.unref) {
  setInterval.unref();
}

function getRateLimitStats() {
  return {
    activeUsers: userLimits.size,
    limits: AI_LIMITS,
  };
}

module.exports = {
  aiRateLimit,
  checkRateLimit,
  getRateLimitStats,
  AI_LIMITS,
};