const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// In-memory cache for fast lookups (survives between DB queries)
const memCache = new Map();
const CLEANUP_INTERVAL = 15 * 60 * 1000;

let TokenBlacklist = null;
try {
  TokenBlacklist = require('../models/TokenBlacklist');
} catch {
  // Model unavailable — falls back to in-memory only
}

/**
 * Blacklist a token (both in-memory and DB for persistence)
 */
async function add(token, { reason = 'logout', userId = null, expiresInMs = 7 * 24 * 60 * 60 * 1000 } = {}) {
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Always cache in memory for fast reads
  memCache.set(hash, expiresAt.getTime());

  // Persist to DB if available
  if (TokenBlacklist && userId) {
    try {
      await TokenBlacklist.findOneAndUpdate(
        { tokenHash: hash },
        { tokenHash: hash, userId, reason, expiresAt },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Log but don't fail — in-memory cache still works
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[TokenBlacklist] DB write failed:', err.message);
      }
    }
  }
}

/**
 * Check if a token is blacklisted
 */
async function has(token) {
  const hash = hashToken(token);
  const now = Date.now();

  // Fast path: check in-memory cache
  const cached = memCache.get(hash);
  if (cached !== undefined) {
    if (now > cached) {
      memCache.delete(hash);
      return false;
    }
    return true;
  }

  // Slow path: check DB (handles server restarts)
  if (TokenBlacklist) {
    try {
      const entry = await TokenBlacklist.findOne({ tokenHash: hash, expiresAt: { $gt: new Date() } }).lean();
      if (entry) {
        // Rehydrate into memory cache
        memCache.set(hash, entry.expiresAt.getTime());
        return true;
      }
    } catch {
      // DB unavailable — treat as not blacklisted to avoid blocking all requests
      return false;
    }
  }

  return false;
}

/**
 * Check if a token is blacklisted (synchronous fast path only, for hot paths)
 * Returns false if not in memory — caller should use async has() for full check
 */
function hasSync(token) {
  const hash = hashToken(token);
  const cached = memCache.get(hash);
  if (cached === undefined) return false;
  if (Date.now() > cached) {
    memCache.delete(hash);
    return false;
  }
  return true;
}

/**
 * Blacklist ALL tokens for a user (used on password reset)
 */
async function blacklistAllForUser(userId, { reason = 'password_reset' } = {}) {
  // Bump tokenVersion on user — this invalidates all JWTs without iterating them
  const User = require('../models/User');
  try {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[TokenBlacklist] Failed to bump tokenVersion:', err.message);
    }
  }

  // Also clean up any active refresh tokens in DB blacklist
  if (TokenBlacklist) {
    try {
      await TokenBlacklist.updateMany(
        { userId, expiresAt: { $gt: new Date() } },
        { reason, expiresAt: new Date() }
      );
    } catch {
      // Non-critical — tokenVersion bump is the primary mechanism
    }
  }
}

// Periodic cleanup of expired in-memory entries
setInterval(() => {
  const now = Date.now();
  for (const [hash, expiry] of memCache) {
    if (now > expiry) memCache.delete(hash);
  }
}, CLEANUP_INTERVAL).unref();

module.exports = { add, has, hasSync, blacklistAllForUser, hashToken };
