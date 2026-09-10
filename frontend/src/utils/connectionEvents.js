const listeners = new Set();
let lastEmit = 0;
const THROTTLE_MS = 5 * 60 * 1000;

export function emitConnectionEvent(payload) {
  const now = Date.now();
  if (payload.throttle !== false && now - lastEmit < THROTTLE_MS) return;
  lastEmit = now;
  listeners.forEach(fn => { try { fn(payload); } catch {} });

  if (payload.type === 'slow_api') {
    window.dispatchEvent(new CustomEvent('gatenexa:slow-api', { detail: { url: payload.url, latencyMs: payload.latency } }));
  } else if (payload.type === 'failed_api') {
    window.dispatchEvent(new CustomEvent('gatenexa:failed-api', { detail: { url: payload.url, status: payload.status } }));
  } else if (payload.type === 'slow_chunk') {
    window.dispatchEvent(new CustomEvent('gatenexa:slow-chunk'));
  } else if (payload.type === 'failed_chunk') {
    window.dispatchEvent(new CustomEvent('gatenexa:failed-chunk'));
  }
}

export function subscribeConnectionEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetThrottle() { lastEmit = 0; }
