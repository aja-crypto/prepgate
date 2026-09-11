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

// Floor between any two user-facing notifications. Prevents rapid-fire popups
// even when genuinely different incidents arrive back-to-back.
const MIN_NOTIFY_GAP_MS = 60 * 1000;
// sessionStorage key that survives page navigation AND reload within a tab.
const INCIDENT_STORAGE_KEY = 'gatenexa:connection-incident';

// Severity ordering used to detect a genuine escalation (slow -> degraded ->
// unavailable -> offline). An escalation may notify even if it is "related".
const SEVERITY_RANK = {
  [SEVERITY.NONE]: 0,
  [SEVERITY.SLOW]: 1,
  [SEVERITY.DEGRADED]: 2,
  [SEVERITY.UNAVAILABLE]: 3,
  [SEVERITY.OFFLINE]: 4,
};

let events = [];
let lastNotifyAt = 0;
let lastSeverity = SEVERITY.NONE;
let lastRecoveryAt = 0;
let listeners = new Set();
let backendStatus = BACKEND.UNKNOWN;
let databaseStatus = DATABASE.UNKNOWN;
let backendHealthCheckedAt = 0;
let backendHealthInFlight = null;
let useSessionStorage = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

function now() { return Date.now(); }

/**
 * Trend: the aggregation window is per-tab/module (not persisted), matching the
 * existing "aggregate evidence" behaviour. Only the NOTIFICATION state is
 * session-persisted so a reload does not immediately spam the user again.
 * Never persist sensitive data — only the fields below.
 */
function loadIncidentState() {
  try {
    if (!useSessionStorage) return null;
    const raw = window.sessionStorage.getItem(INCIDENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveIncidentState(state) {
  try {
    if (!useSessionStorage) return;
    window.sessionStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

function clearIncidentState() {
  try {
    if (useSessionStorage) window.sessionStorage.removeItem(INCIDENT_STORAGE_KEY);
  } catch {
    /* best effort */
  }
}

/**
 * Decide whether a notification should be shown for the given classification.
 *
 * Incident-based model:
 *  - NONE              -> never notify.
 *  - NO active incident -> it is NEW, notify once.
 *  - SAME incident       -> suppress (never re-notify the same continuing incident).
 *  - ESCALATION          -> a higher-severity problem -> allow one notification.
 *  - Recovery clears the active incident, so a later new failure can notify again.
 *
 * A minimum gap still applies so brand-new incidents cannot spam every second.
 */
function decideToNotify(severity, incidentId) {
  if (severity === SEVERITY.NONE) return { notify: false, state: null };
  const prev = loadIncidentState();
  const shownAt = prev?.shownAt || 0;
  if (now() - shownAt < MIN_NOTIFY_GAP_MS) {
    // Floor gap — even a new/escalated incident waits out the minimum spacing.
    return { notify: false, state: prev };
  }
  if (!prev?.activeId) {
    return { notify: true, state: { activeId: incidentId, shownSeverity: severity, shownAt: now() } };
  }
  if (prev.activeId === incidentId) {
    const escalated = SEVERITY_RANK[severity] > SEVERITY_RANK[prev.shownSeverity];
    if (escalated) {
      return { notify: true, state: { activeId: incidentId, shownSeverity: severity, shownAt: now() } };
    }
    // Same continuing incident, no escalation -> suppress.
    return { notify: false, state: prev };
  }
  // Different incident identity (e.g. database problem vs slow API) -> notify once.
  return { notify: true, state: { activeId: incidentId, shownSeverity: severity, shownAt: now() } };
}

/**
 * The single authoritative database-status interpreter used by BOTH the notice
 * system and the diagnostics page. It only reports DISCONNECTED when the backend
 * explicitly confirms it; otherwise it returns UNKNOWN (never DISCONNECTED).
 *
 * Accepts any of the real backend response shapes:
 *   { data: { mongoConnected: <boolean> } }   from /api/health, /api/diagnostics/status
 *   { mongoConnected: <boolean> }             from /health
 *   { database: 'connected'|'disconnected' }  from /health/readiness
 */
export function normalizeDatabaseStatus(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : {};
  const candidateValue = body?.mongoConnected ?? body?.database ?? data?.mongoConnected ?? data?.database ?? body?.server?.database;
  if (typeof candidateValue === 'boolean') {
    return candidateValue ? DATABASE.CONNECTED : DATABASE.DISCONNECTED;
  }
  if (typeof candidateValue === 'string') {
    const v = candidateValue.toLowerCase();
    if (v === 'connected' || v === 'true') return DATABASE.CONNECTED;
    if (v === 'disconnected' || v === 'false') return DATABASE.DISCONNECTED;
  }
  // Could not determine the database state from an authoritative response.
  return DATABASE.UNKNOWN;
}

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

function buildMessage(classification) {
  const { severity } = classification;
  if (severity === SEVERITY.OFFLINE) {
    return { title: "You're offline", message: 'Reconnect to Wi-Fi or mobile data to continue syncing.', action: 'Retry' };
  }
  if (databaseStatus === DATABASE.DISCONNECTED && severity !== SEVERITY.NONE) {
    return {
      title: 'Some GateNexa data is temporarily unavailable',
      message: "GateNexa's backend is reachable, but its database connection is currently unavailable. Data that requires the database may not load or sync until the connection is restored.",
      action: 'Troubleshoot',
    };
  }
  if (severity === SEVERITY.UNAVAILABLE) {
    return { title: 'GateNexa services are temporarily unavailable', message: 'Please try again in a moment.', action: 'Troubleshoot' };
  }
  if (severity === SEVERITY.DEGRADED || severity === SEVERITY.SLOW) {
    return { title: 'GateNexa is responding slowly', message: 'Some requests are taking longer than usual.', action: 'Troubleshoot' };
  }
  return null;
}

/** Incident identity for notification suppression. Severity maps to a distinct
 *  incident, so the SAME severity never re-notifies while it continues, but a
 *  severity escalation (slow -> degraded -> unavailable) is treated as a new,
 *  more severe incident and is allowed to notify once. */
function incidentIdFor(classification) {
  if (classification.severity === SEVERITY.OFFLINE) return 'offline';
  if (databaseStatus === DATABASE.DISCONNECTED) return 'database_disconnected';
  return classification.severity;
}

function emitState(classification) {
  const msg = buildMessage(classification);
  if (!msg) return;
  const incidentId = incidentIdFor(classification);
  const decision = decideToNotify(classification.severity, incidentId);
  if (!decision.notify) return;
  if (decision.state) {
    saveIncidentState({ ...decision.state, lastBackend: backendStatus, lastDatabase: databaseStatus });
  }
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
  // Recovery closes the active incident so a later genuine failure can notify again.
  clearIncidentState();
  const payload = { severity: SEVERITY.NONE, reason: 'recovered', title: 'Connection restored', message: 'GateNexa is responding normally again.', action: null };
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
      // Single authoritative interpretation for database status.
      databaseStatus = normalizeDatabaseStatus(data);
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
  if (type === 'slow_chunk') recordSlowApi('chunk', 4000);
  else recordFailedApi('chunk', 0);
}

export function subscribeConnectionState(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getConnectionSnapshot() {
  prune();
  return { events: [...events], classification: classify(), backendStatus, databaseStatus, lastSeverity, incident: loadIncidentState() };
}

export function resetConnectionHealth() {
  events = [];
  lastNotifyAt = 0;
  lastSeverity = SEVERITY.NONE;
  lastRecoveryAt = 0;
  backendStatus = BACKEND.UNKNOWN;
  databaseStatus = DATABASE.UNKNOWN;
  clearIncidentState();
}

export function handleOnline() {
  prune();
  const cls = classify();
  if (cls.severity === SEVERITY.NONE && lastSeverity !== SEVERITY.NONE) emitRecovery();
}

export function handleOffline() {
  const decision = decideToNotify(SEVERITY.OFFLINE, 'offline');
  if (decision.notify && decision.state) {
    saveIncidentState({ ...decision.state, lastBackend: backendStatus, lastDatabase: databaseStatus });
  }
  lastNotifyAt = now();
  lastSeverity = SEVERITY.OFFLINE;
  const payload = { severity: SEVERITY.OFFLINE, reason: 'offline', title: "You're offline", message: 'Reconnect to Wi-Fi or mobile data to continue syncing.', action: 'Retry' };
  listeners.forEach(fn => { try { fn(payload); } catch {} });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gatenexa:connection-state', { detail: payload }));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export const __internals = { SEVERITY, WINDOW_MS, COOLDOWN_MS, SLOW_THRESHOLD_MS, MIN_NOTIFY_GAP_MS };
