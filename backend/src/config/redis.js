let client = null;

async function connectRedis() {
  if (!process.env.REDIS_URL) return null;
  try {
    const { createClient } = require('redis');
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('[Redis] Error:', err.message));
    client.on('connect', () => console.log('[Redis] Connected'));
    await client.connect();
    return client;
  } catch (e) {
    console.warn('[Redis] Not available — using in-memory fallback.');
    return null;
  }
}

function getClient() {
  return client;
}

async function get(key) {
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function set(key, value, ttlSeconds = 3600) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch { /* silent */ }
}

async function del(key) {
  if (!client) return;
  try { await client.del(key); } catch { /* silent */ }
}

async function incr(key, ttlSeconds = 3600) {
  if (!client) return null;
  try {
    const val = await client.incr(key);
    if (val === 1 && ttlSeconds) await client.expire(key, ttlSeconds);
    return val;
  } catch { return null; }
}

module.exports = { connectRedis, getClient, get, set, del, incr };
