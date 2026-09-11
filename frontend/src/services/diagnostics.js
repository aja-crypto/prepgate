import { normalizeDatabaseStatus } from './connectionHealth';

const API_BASE = import.meta.env?.VITE_API_URL || '/api';
const HEALTH_URL = `${API_BASE}/health`;
const AI_HEALTH_URL = `${API_BASE}/ai/health`;

function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

function latencyGrade(ms) {
  if (ms == null) return 'unknown';
  if (ms < 80) return 'excellent';
  if (ms < 200) return 'good';
  if (ms < 500) return 'fair';
  return 'poor';
}

function speedGrade(mbps) {
  if (mbps == null) return 'unknown';
  if (mbps >= 10) return 'excellent';
  if (mbps >= 4) return 'good';
  if (mbps >= 1.5) return 'fair';
  return 'poor';
}

const TESTS = [
  { id: 'latency', label: 'Internet Latency', icon: '📶', timeout: 6000 },
  { id: 'api', label: 'GateNexa API', icon: '⚡', timeout: 10000 },
  { id: 'backend', label: 'Backend Health', icon: '🖥️', timeout: 8000 },
  { id: 'database', label: 'Database', icon: '🗄️', timeout: 8000 },
  { id: 'auth', label: 'Authentication', icon: '🔐', timeout: 6000 },
  { id: 'ai', label: 'AI Services', icon: '🤖', timeout: 12000 },
  { id: 'video', label: 'Video Readiness', icon: '🎬', timeout: 5000 },
  { id: 'browser', label: 'Browser', icon: '🌐', timeout: 3000 },
  { id: 'device', label: 'Device', icon: '📱', timeout: 3000 },
  { id: 'pdf', label: 'PDF / Reports', icon: '📄', timeout: 10000 },
];

async function testLatency() {
  const start = performance.now();
  try {
    await fetchWithTimeout(`${HEALTH_URL}?_t=${Date.now()}`, { cache: 'no-store' }, 5000);
    const ms = performance.now() - start;
    return {
      id: 'latency', status: 'passed', grade: latencyGrade(ms),
      value: `${Math.round(ms)}ms`,
      detail: ms < 80 ? 'Excellent connection' : ms < 200 ? 'Good connection' : ms < 500 ? 'Moderate latency' : 'High latency — server may be waking',
      latencyMs: Math.round(ms),
    };
  } catch {
    return { id: 'latency', status: 'failed', grade: 'poor', value: '—', detail: 'Could not reach server', latencyMs: null, why: 'The reachability probe to the GateNexa backend did not respond.', impact: 'GateNexa may be temporarily unreachable from your network.', action: 'Retry' };
  }
}

async function testApi() {
  const start = performance.now();
  try {
    const res = await fetchWithTimeout(`${HEALTH_URL}?_t=${Date.now()}`, { cache: 'no-store' }, 10000);
    const ms = performance.now() - start;
    if (!res.ok) return { id: 'api', status: 'failed', grade: 'poor', value: `HTTP ${res.status}`, detail: `API returned ${res.status}`, latencyMs: Math.round(ms) };
    const data = await res.json().catch(() => ({}));
    const serverStatus = data?.status || data?.server || data?.data?.status;
    return {
      id: 'api', status: 'passed', grade: latencyGrade(ms),
      value: `${Math.round(ms)}ms`,
      detail: serverStatus === 'OK' || serverStatus === 'ok' ? 'API responsive' : `API responding (${serverStatus || 'unknown'})`,
      latencyMs: Math.round(ms),
    };
  } catch {
    const ms = performance.now() - start;
    return { id: 'api', status: 'failed', grade: 'poor', value: '—', detail: 'API endpoint unreachable', latencyMs: Math.round(ms), why: 'The GateNexa API did not respond to a health request.', impact: 'Pages that rely on this API may not load right now.', action: 'Retry' };
  }
}

async function testBackend() {
  try {
    const res = await fetchWithTimeout(HEALTH_URL, { cache: 'no-store' }, 8000);
    if (!res.ok) return { id: 'backend', status: 'failed', grade: 'poor', value: `HTTP ${res.status}`, detail: `Backend returned ${res.status}` };
    const data = await res.json().catch(() => ({}));
    const db = data?.database || data?.data?.mongoConnected;
    const serverOk = data?.server === 'ok' || data?.status === 'OK' || data?.data?.status === 'OK';
    const uptime = data?.uptime || data?.data?.uptime;
    const detail = serverOk
      ? `Backend healthy${uptime ? ` (${Math.round(uptime)}s uptime)` : ''}`
      : `Backend responded but status unclear`;
    return { id: 'backend', status: 'passed', grade: serverOk ? 'excellent' : 'fair', value: serverOk ? 'Healthy' : 'Partial', detail, why: serverOk ? undefined : 'The backend responded but did not report a clear healthy status.', action: serverOk ? undefined : 'Retry' };
  } catch {
    return { id: 'backend', status: 'failed', grade: 'poor', value: '—', detail: 'Backend not responding', why: 'The backend health endpoint did not respond in time.', impact: 'GateNexa services may be temporarily unavailable.', action: 'Retry' };
  }
}

async function testDatabase() {
  try {
    // /api/health is proxied in production and, on the backend, is served by the
    // diagnostics router which reports the authoritative `data.mongoConnected`.
    const res = await fetchWithTimeout(HEALTH_URL, { cache: 'no-store' }, 8000);
    if (!res.ok) {
      return {
        id: 'database', status: 'unknown', grade: 'unknown', value: 'Unknown',
        detail: 'Database status cannot be checked because the GateNexa backend is currently unreachable.',
        why: 'The backend health endpoint did not respond, so the database state could not be verified.',
        impact: 'GateNexa cannot be used until the backend is reachable again.',
        action: 'Retry',
      };
    }
    const body = await res.json().catch(() => ({}));
    const db = normalizeDatabaseStatus(body);
    if (db === 'connected') {
      return {
        id: 'database', status: 'passed', grade: 'excellent', value: 'Connected',
        detail: 'Database connected. Your data can be read and synchronized normally.',
      };
    }
    if (db === 'disconnected') {
      return {
        id: 'database', status: 'failed', grade: 'poor', value: 'Disconnected',
        detail: "GateNexa's backend is reachable, but its database connection is currently unavailable. Data that requires the database may not load or sync until the connection is restored.",
        why: "The backend explicitly reports that its MongoDB connection is unavailable.",
        impact: 'Features that read or save account data may temporarily fail.',
        action: 'Retry',
      };
    }
    // Backend reachable but did not confirm the database state -> UNKNOWN, not DISCONNECTED.
    return {
      id: 'database', status: 'unknown', grade: 'unknown', value: 'Unknown',
      detail: "GateNexa's backend is reachable, but the database status could not be verified.",
      why: 'The backend health response did not include a usable database status.',
      impact: 'Database features may or may not work — the state could not be confirmed.',
      action: 'Retry',
    };
  } catch {
    return {
      id: 'database', status: 'unknown', grade: 'unknown', value: 'Unknown',
      detail: 'Database status cannot be checked because the GateNexa backend is currently unreachable.',
      why: 'The backend health request failed before a database status could be read.',
      impact: 'Database state could not be verified.',
      action: 'Retry',
    };
  }
}

async function testAuth() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const isGuest = typeof localStorage !== 'undefined' ? localStorage.getItem('isGuest') === 'true' : false;
    if (isGuest) return { id: 'auth', status: 'passed', grade: 'excellent', value: 'Guest', detail: 'Demo session active' };
    if (!token) return { id: 'auth', status: 'degraded', grade: 'fair', value: 'Not authenticated', detail: 'No active session — please log in' };
    const res = await fetchWithTimeout(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }, 5000);
    if (res.ok) return { id: 'auth', status: 'passed', grade: 'excellent', value: 'Session valid', detail: 'Authentication active' };
    if (res.status === 401) return { id: 'auth', status: 'degraded', grade: 'fair', value: 'Expired', detail: 'Session expired — please log in again' };
    return { id: 'auth', status: 'degraded', grade: 'fair', value: `HTTP ${res.status}`, detail: 'Authentication check returned error' };
  } catch {
    return { id: 'auth', status: 'degraded', grade: 'fair', value: 'Unknown', detail: 'Could not verify authentication status' };
  }
}

async function testAi() {
  try {
    const res = await fetchWithTimeout(AI_HEALTH_URL, { cache: 'no-store' }, 12000);
    if (!res.ok) return { id: 'ai', status: 'degraded', grade: 'fair', value: `HTTP ${res.status}`, detail: 'AI health endpoint returned error' };
    const data = await res.json().catch(() => ({}));
    const d = data?.data || data;
    const configured = d?.aiConfigured === true;
    const reachable = d?.aiReachable === true;
    const status = d?.status || (configured ? 'configured' : 'not_configured');
    if (configured && reachable) return { id: 'ai', status: 'passed', grade: 'excellent', value: 'Available', detail: 'AI provider configured and reachable' };
    if (configured) return { id: 'ai', status: 'degraded', grade: 'fair', value: 'Configured', detail: 'AI configured but not reachable — responses may be slow' };
    return { id: 'ai', status: 'degraded', grade: 'fair', value: 'Not configured', detail: 'AI provider not configured — AI features unavailable' };
  } catch {
    return { id: 'ai', status: 'degraded', grade: 'fair', value: '—', detail: 'AI health check timed out' };
  }
}

async function testVideo() {
  const conn = navigator.connection;
  const downlink = conn?.downlink;
  const effectiveType = conn?.effectiveType;
  const saveData = conn?.saveData;

  const parts = [];
  if (downlink != null) parts.push(`~${downlink.toFixed(1)} Mbps estimated`);
  if (effectiveType) parts.push(effectiveType.toUpperCase());
  if (saveData) parts.push('Data Saver on');

  const grade = speedGrade(downlink);
  const label = downlink == null ? 'Unknown'
    : downlink >= 10 ? '4K ready'
    : downlink >= 4 ? '1080p ready'
    : downlink >= 1.5 ? '720p ready'
    : 'Low bandwidth';

  return {
    id: 'video', status: 'passed', grade,
    value: downlink != null ? `~${downlink.toFixed(1)} Mbps` : 'Unknown',
    detail: downlink != null ? `${label} (browser estimate, not measured)` : 'Browser cannot report connection speed',
    note: 'Estimate via navigator.connection — not a real speed test',
  };
}

async function testBrowser() {
  const checks = [];
  if ('serviceWorker' in navigator) checks.push('Service Worker');
  if ('IntersectionObserver' in window) checks.push('IntersectionObserver');
  if ('ResizeObserver' in window) checks.push('ResizeObserver');
  if (window.crypto?.subtle) checks.push('Web Crypto');
  if ('requestIdleCallback' in window) checks.push('IdleCallback');
  if (CSS?.supports?.('backdrop-filter', 'blur(1px)')) checks.push('Backdrop blur');
  const count = checks.length;
  const grade = count >= 5 ? 'excellent' : count >= 3 ? 'good' : 'fair';
  return {
    id: 'browser', status: 'passed', grade,
    value: `${count}/6`,
    detail: count >= 5 ? 'Full capability' : checks.join(', ') || 'Limited features detected',
  };
}

async function testDevice() {
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const grade = (mem >= 4 || cores >= 6) ? 'excellent' : (mem >= 2 || cores >= 4) ? 'good' : 'fair';
  const parts = [];
  if (cores) parts.push(`${cores} cores`);
  if (mem) parts.push(`${mem} GB RAM`);
  return {
    id: 'device', status: 'passed', grade,
    value: parts.join(', ') || 'Detected',
    detail: grade === 'excellent' ? 'Smooth experience expected' : grade === 'good' ? 'Good performance' : 'Limited resources — close other tabs for best experience',
  };
}

async function testPdf() {
  try {
    const start = performance.now();
    const mod = await import('@react-pdf/renderer');
    const ms = performance.now() - start;
    const hasFn = typeof mod.pdf === 'function';
    if (!hasFn) return { id: 'pdf', status: 'failed', grade: 'poor', value: 'Error', detail: 'PDF library loaded but pdf() not available' };
    return {
      id: 'pdf', status: 'passed',
      grade: ms < 1500 ? 'excellent' : ms < 3000 ? 'good' : 'fair',
      value: `${Math.round(ms)}ms load`,
      detail: `@react-pdf/renderer available`,
    };
  } catch {
    return { id: 'pdf', status: 'failed', grade: 'poor', value: '—', detail: 'PDF library unavailable — report generation disabled' };
  }
}

const TEST_FN = {
  latency: testLatency,
  api: testApi,
  backend: testBackend,
  database: testDatabase,
  auth: testAuth,
  ai: testAi,
  video: testVideo,
  browser: testBrowser,
  device: testDevice,
  pdf: testPdf,
};

// Core services determine whether GateNexa itself is usable and carry most of
// the weight. Optional capabilities (AI, video, PDF, browser, device) must not
// be able to make an otherwise healthy install look broken. UNKNOWN is skipped.
const CORE_IDS = new Set(['latency', 'api', 'backend', 'database', 'auth']);
const CORE_WEIGHT = 0.75;
const OPTIONAL_WEIGHT = 0.25;

function gradeToScore(grade) {
  if (grade === 'excellent') return 100;
  if (grade === 'good') return 75;
  if (grade === 'fair') return 50;
  return 0;
}

function scoreGroup(results) {
  if (results.length === 0) return null;
  let sum = 0;
  for (const r of results) sum += gradeToScore(r.grade);
  return Math.round(sum / results.length);
}

function computeScore(results) {
  const total = results.length;
  if (total === 0) return { score: 0, grade: 'poor' };
  const core = results.filter(r => CORE_IDS.has(r.id) && r.status !== 'unknown');
  const optional = results.filter(r => !CORE_IDS.has(r.id) && r.status !== 'unknown');
  const coreScore = scoreGroup(core);
  const optionalScore = scoreGroup(optional);
  let score;
  if (coreScore == null && optionalScore == null) return { score: 0, grade: 'unknown' };
  if (coreScore == null) score = optionalScore;
  else if (optionalScore == null) score = coreScore;
  else score = Math.round(coreScore * CORE_WEIGHT + optionalScore * OPTIONAL_WEIGHT);
  const grade = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 45 ? 'fair' : 'poor';
  return { score, grade };
}

const TRUST_MESSAGE = '💜 GateNexa is continuously improving through your feedback. If you notice something unusual, please tell us through Feedback.';

function buildRecommendations(results) {
  const conn = typeof navigator !== 'undefined' ? navigator : null;
  const byId = id => results.find(r => r.id === id);
  const offline = conn?.onLine === false;
  const failedIds = new Set(results.filter(r => r.status === 'failed').map(r => r.id));
  const degradedIds = new Set(results.filter(r => r.status === 'degraded').map(r => r.id));

  // (priority, message) — lower priority number = more severe, shown first.
  const actionable = [];

  // PRIORITY 1 — OFFLINE
  if (offline) {
    actionable.push({ p: 1, m: 'Your device appears to be offline. Reconnect to Wi-Fi or mobile data and try again.' });
  }

  // PRIORITY 2 — BACKEND UNAVAILABLE (API / latency / backend all unreachable)
  if (failedIds.has('api') || failedIds.has('backend') || failedIds.has('latency')) {
    actionable.push({
      p: 2,
      m: "GateNexa's backend is currently unreachable. Your internet connection may still be working normally, so this may be a temporary service-side issue.",
    });
  }

  // PRIORITY 3 — DATABASE CONFIRMED DISCONNECTED (only when backend explicitly confirmed it)
  const dbRes = byId('database');
  if (dbRes && (dbRes.status === 'failed') && dbRes.value === 'Disconnected') {
    actionable.push({
      p: 3,
      m: "GateNexa's backend is reachable, but its database connection is currently unavailable. Some data may not load or sync until the database reconnects.",
    });
  }

  // PRIORITY 4 — HIGH NETWORK LATENCY (latency degraded/poor but reachable)
  if (!failedIds.has('latency') && (degradedIds.has('latency') || byId('latency')?.grade === 'poor')) {
    actionable.push({ p: 4, m: 'Your connection has higher-than-usual latency. Try switching to a stronger Wi-Fi or mobile-data connection.' });
  }

  // PRIORITY 5 — GATENEXA API SLOW (api degraded/poor but reachable)
  if (!failedIds.has('api') && (byId('api')?.grade === 'poor' || byId('api')?.grade === 'fair')) {
    actionable.push({ p: 5, m: "GateNexa's services are responding slowly. This may be temporary; try again in a moment." });
  }

  // PRIORITY 6 — AI ONLY (never claims the whole app is down)
  if (degradedIds.has('ai') || failedIds.has('ai')) {
    actionable.push({ p: 6, m: 'AI services are temporarily unavailable. Core GateNexa study features remain available.' });
  }

  // PRIORITY 7 — DEVICE/BROWSER only on a meaningful limitation (not a low reported value)
  if (byId('device')?.grade === 'poor') {
    actionable.push({ p: 7, m: 'Your device/browser has limited available resources. Closing unused tabs may improve responsiveness.' });
  }

  actionable.sort((a, b) => a.p - b.p);

  // Trust/informational message always first; then at most 3 relevant actions.
  const recs = [TRUST_MESSAGE];
  for (const r of actionable.slice(0, 3)) recs.push(r.m);
  return recs;
}

export async function runDiagnostics({ onProgress, signal } = {}) {
  const results = [];
  let completed = 0;
  const total = TESTS.length;

  const tasks = TESTS.map(test => async () => {
    if (signal?.aborted) return;
    try {
      const result = await TEST_FN[test.id]();
      result.label = test.label;
      result.icon = test.icon;
      result.timeout = test.timeout;
      if (!signal?.aborted) results.push(result);
    } catch (e) {
      if (!signal?.aborted) {
        results.push({ id: test.id, label: test.label, icon: test.icon, status: 'failed', grade: 'poor', detail: e.message || 'Test error' });
      }
    }
    completed++;
    onProgress?.(completed / total);
  });

  await Promise.all(tasks.map(t => t()));
  if (signal?.aborted) return null;

  const { score, grade } = computeScore(results);
  const recommendations = buildRecommendations(results);

  return { results, score, grade, recommendations, timestamp: Date.now() };
}

export { TESTS };
