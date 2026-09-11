const NETWORK = { ONLINE: 'online', OFFLINE: 'offline', UNKNOWN: 'unknown' };
const BACKEND = { REACHABLE: 'reachable', SLOW: 'slow', UNAVAILABLE: 'unavailable', UNKNOWN: 'unknown' };
const DATABASE = { CONNECTED: 'connected', DISCONNECTED: 'disconnected', UNKNOWN: 'unknown' };

const SEVERITY = { NONE: 'none', SLOW: 'slow', DEGRADED: 'degraded', UNAVAILABLE: 'unavailable', OFFLINE: 'offline' };

const WINDOW_MS = 3 * 60 * 1000;
const COOLDOWN_MS = {
  [SEVERITY.SLOW]: 90 * 1000,
  [SEVERITY.DEGRADED]: 120 * 1000,
  [SEVERITY.UNAVAILABLE]: 180 * 1000,
  [SEVERITY.OFFLINE]: 60 * 1000,
  recovered: 60 * 1000,
};
const SLOW_THRESHOLD_MS = 3000;

let events = [];
let lastNotifyAt = 0;
let lastSeverity = SEVERITY.NONE;
let lastRecoveryAt = 0;
let listeners = new Set();
let backendStatus = BACKEND.UNKNOWN;
let databaseStatus = DATABASE.UNKNOWN;
let backendHealthCheckedAt = 0;
let backendHealthInFlight = null;

function now() { return Date.now(); }

function prune() {
  const cutoff = now() - WINDOW_MS;
  events = events.filter(e => e.at > cutoff);
}

function classify() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { severity: SEVERITY.OFFLINE, reason: 'offline' };
  }
  prune();
  const slows = events.filter(e => e.type === 'slow');
  const fails = events.filter(e => e.type === 'failed');
  const slowEndpoints = new Set(slows.map(e => e.url));
  const failEndpoints = new Set(fails.map(e => e.url));

  if (backendStatus === BACKEND.UNAVAILABLE || fails.length >= 2 && failEndpoints.size >= 1) {
    return { severity: SEVERITY.UNAVAILABLE, reason: 'backend_unavailable', slows, fails };
  }
  if (fails.length >= 1 && slows.length >= 1) {
    return { severity: SEVERITY.DEGRADED, reason: 'mixed_failures', slows, fails };
  }
  if (fails.length >= 1) {
    return fails.length === 1 ? { severity: SEVERITY.NONE, reason: 'single_failed' } : { severity: SEVERITY.DEGRADED, reason: 'multiple_failed', fails };
  }
  if (slows.length >= 2) {
    return { severity: SEVERITY.SLOW, reason: slowEndpoints.size >= 2 ? 'multiple_endpoints_slow' : 'repeated_slow', slows };
  }
  if (slows.length === 1) {
    return { severity: SEVERITY.NONE, reason: 'single_slow' };
  }
  return { severity: SEVERITY.NONE, reason: 'healthy' };
}

function shouldNotify(severity) {
  if (severity === SEVERITY.NONE) return false;
  const elapsed = now() - lastNotifyAt;
  const cooldown = COOLDOWN_MS[severity] || 120000;
  if (elapsed < cooldown) return false;
  if (severity === lastSeverity && elapsed < cooldown) return false;
  return true;
}

function buildMessage(classification) {
  const { severity } = classification;
  if (severity === SEVERITY.OFFLINE) {
    return { title: 'You appear to be offline', message: 'Check your Wi-Fi or mobile data connection.', action: 'Retry' };
  }
  if (databaseStatus === DATABASE.DISCONNECTED) {
    return { title: 'GateNexa database is currently unavailable', message: 'Some features may not work until the service recovers.', action: 'View Diagnostics' };
  }
  if (severity === SEVERITY.UNAVAILABLE) {
    return { title: 'GateNexa services are temporarily unavailable', message: 'Please try again in a moment.', action: 'Check Status' };
  }
  if (severity === SEVERITY.DEGRADED) {
    return { title: 'Some GateNexa services are having trouble responding', message: 'We’re retrying automatically.', action: 'View Diagnostics' };
  }
  if (severity === SEVERITY.SLOW) {
    return { title: 'Some GateNexa services are responding slowly', message: 'Your connection may be unstable, or the service may be busy.', action: 'Check Connection' };
  }
  return null;
}

function emitState(classification) {
  const msg = buildMessage(classification);
  if (!msg) return;
  if (!shouldNotify(classification.severity)) return;
  lastNotifyAt = now();
  lastSeverity = classification.severity;
  const payload = {
    severity: classification.severity,
    reason: classification.reason,
    title: msg.title,
    message: msg.message,
    action: msg.action,
    detail: classification,
    databaseStatus,
    backendStatus,
  };
  listeners.forEach(fn => { try { fn(payload); } catch {} });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gatenexa:connection-state', { detail: payload }));
  }
}

function emitRecovery() {
  const elapsed = now() - lastRecoveryAt;
  if (elapsed < COOLDOWN_MS.recovered) return;
  if (lastSeverity === SEVERITY.NONE) return;
  lastRecoveryAt = now();
  lastSeverity = SEVERITY.NONE;
  const payload = { severity: SEVERITY.NONE, reason: 'recovered', title: 'Connection restored', message: 'GateNexa services are responding normally.', action: null };
  listeners.forEach(fn => { try { fn(payload); } catch {} });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gatenexa:connection-state', { detail: payload }));
}

async function checkBackendHealth() {
  if (backendHealthInFlight) return backendHealthInFlight;
  if (now() - backendHealthCheckedAt < 45000) return;
  backendHealthCheckedAt = now();
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';
  const url = `${base.replace(/\/api\/?$/, '')}/health`;
  backendHealthInFlight = fetch(url, { cache: 'no-store', signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined })
    .then(async res => {
      if (!res.ok) { backendStatus = BACKEND.UNAVAILABLE; return; }
      const data = await res.json().catch(() => ({}));
      const db = data?.mongoConnected ?? data?.database === 'connected' ?? data?.data?.mongoConnected;
      if (db === true || data?.database === 'connected') databaseStatus = DATABASE.CONNECTED;
      else if (db === false || data?.database === 'disconnected') databaseStatus = DATABASE.DISCONNECTED;
      else databaseStatus = DATABASE.UNKNOWN;
      backendStatus = BACKEND.REACHABLE;
      if (events.length === 0) emitRecovery();
    })
    .catch(() => { backendStatus = BACKEND.UNAVAILABLE; })
    .finally(() => { backendHealthInFlight = null; });
  return backendHealthInFlight;
}

export function recordSlowApi(url, latencyMs) {
  if (latencyMs < SLOW_THRESHOLD_MS) return;
  const norm = url ? String(url).split('?')[0] : 'unknown';
  events.push({ type: 'slow', url: norm, latencyMs, at: now() });
  prune();
  const cls = classify();
  if (cls.severity !== SEVERITY.NONE) {
    emitState(cls);
    if (cls.severity === SEVERITY.UNAVAILABLE || cls.severity === SEVERITY.DEGRADED) checkBackendHealth();
  }
}

export function recordFailedApi(url, status) {
  const norm = url ? String(url).split('?')[0] : 'unknown';
  events.push({ type: 'failed', url: norm, status, at: now() });
  prune();
  const cls = classify();
  if (cls.severity !== SEVERITY.NONE) emitState(cls);
  checkBackendHealth();
}

export function recordChunkEvent(type) {
  const url = type.includes('slow') ? 'chunk' : 'chunk';
  if (type === 'slow_chunk') recordSlowApi(url, 4000);
  else recordFailedApi(url, 0);
}

export function subscribeConnectionState(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getConnectionSnapshot() {
  prune();
  return { events: [...events], classification: classify(), backendStatus, databaseStatus, lastSeverity };
}

export function resetConnectionHealth() {
  events = [];
  lastNotifyAt = 0;
  lastSeverity = SEVERITY.NONE;
  lastRecoveryAt = 0;
  backendStatus = BACKEND.UNKNOWN;
  databaseStatus = DATABASE.UNKNOWN;
}

export function handleOnline() {
  prune();
  const cls = classify();
  if (cls.severity === SEVERITY.NONE && lastSeverity !== SEVERITY.NONE) emitRecovery();
}

export function handleOffline() {
  const payload = { severity: SEVERITY.OFFLINE, reason: 'offline', title: "You're offline", message: 'Reconnect to the internet to continue syncing data.', action: 'Check Connection' };
  lastNotifyAt = now();
  lastSeverity = SEVERITY.OFFLINE;
  listeners.forEach(fn => { try { fn(payload); } catch {} });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gatenexa:connection-state', { detail: payload }));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export const __internals = { SEVERITY, WINDOW_MS, COOLDOWN_MS, SLOW_THRESHOLD_MS };
