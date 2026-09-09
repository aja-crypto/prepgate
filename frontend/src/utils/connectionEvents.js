const listeners = new Set();
let lastEmit = 0;
const THROTTLE_MS = 5 * 60 * 1000;

export function emitConnectionEvent(payload) {
  const now = Date.now();
  if (payload.throttle !== false && now - lastEmit < THROTTLE_MS) return;
  lastEmit = now;
  listeners.forEach(fn => { try { fn(payload); } catch {} });
}

export function subscribeConnectionEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetThrottle() { lastEmit = 0; }
