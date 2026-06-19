const usage = new Map();
let totalRequests = 0;
let totalFailed = 0;
let totalResponseTime = 0;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function increment(success = true, responseTimeMs = 0) {
  const key = todayKey();
  usage.set(key, (usage.get(key) || 0) + 1);
  totalRequests++;
  if (!success) totalFailed++;
  totalResponseTime += responseTimeMs;
}

function getStats() {
  const key = todayKey();
  const today = usage.get(key) || 0;
  const avgResponseTime = totalRequests > 0
    ? Math.round(totalResponseTime / totalRequests)
    : 0;
  return { totalRequests, requestsToday: today, failed: totalFailed, avgResponseTime };
}

function reset() {
  usage.clear();
  totalRequests = 0;
  totalFailed = 0;
  totalResponseTime = 0;
}

module.exports = { increment, getStats, reset };
