const API_BASE = import.meta.env?.VITE_API_URL || '/api';
const HEALTH_URL = `${API_BASE}/health`;
const AI_HEALTH_URL = `${API_BASE}/ai/health`;
const READINESS_URL = `/health/readiness`;

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
    return { id: 'latency', status: 'failed', grade: 'poor', value: '—', detail: 'Could not reach server', latencyMs: null };
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
    return { id: 'api', status: 'failed', grade: 'poor', value: '—', detail: 'API endpoint unreachable', latencyMs: Math.round(ms) };
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
    return { id: 'backend', status: 'passed', grade: serverOk ? 'excellent' : 'fair', value: serverOk ? 'Healthy' : 'Partial', detail };
  } catch {
    return { id: 'backend', status: 'failed', grade: 'poor', value: '—', detail: 'Backend not responding' };
  }
}

async function testDatabase() {
  try {
    const res = await fetchWithTimeout(READINESS_URL, { cache: 'no-store' }, 8000);
    if (!res.ok) {
      const res2 = await fetchWithTimeout(HEALTH_URL, { cache: 'no-store' }, 5000);
      if (!res2.ok) return { id: 'database', status: 'failed', grade: 'poor', value: '—', detail: 'Cannot check database status' };
      const d2 = await res2.json().catch(() => ({}));
      const connected = d2?.database === 'connected' || d2?.data?.mongoConnected === true;
      return { id: 'database', status: connected ? 'passed' : 'degraded', grade: connected ? 'excellent' : 'fair', value: connected ? 'Connected' : 'Disconnected', detail: connected ? 'MongoDB connected' : 'MongoDB not connected — data may be unavailable' };
    }
    const data = await res.json().catch(() => ({}));
    const dbStatus = data?.database || data?.data?.database;
    const connected = dbStatus === 'connected' || dbStatus === true;
    return {
      id: 'database', status: connected ? 'passed' : 'degraded',
      grade: connected ? 'excellent' : 'fair',
      value: connected ? 'Connected' : 'Disconnected',
      detail: connected ? 'MongoDB connected' : 'MongoDB not connected — data may be unavailable',
    };
  } catch {
    return { id: 'database', status: 'degraded', grade: 'fair', value: 'Unknown', detail: 'Could not verify database status' };
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

function computeScore(results) {
  const total = results.length;
  if (total === 0) return { score: 0, grade: 'poor' };
  let sum = 0;
  for (const r of results) {
    if (r.status === 'unknown') continue;
    if (r.grade === 'excellent') sum += 100;
    else if (r.grade === 'good') sum += 75;
    else if (r.grade === 'fair') sum += 50;
    else sum += 0;
  }
  const score = Math.round(sum / total);
  const grade = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 45 ? 'fair' : 'poor';
  return { score, grade };
}

function buildRecommendations(results) {
  const recs = [];
  const failed = results.filter(r => r.status === 'failed');
  const degraded = results.filter(r => r.status === 'degraded');
  const poor = results.filter(r => r.grade === 'poor' && r.status !== 'failed');

  if (failed.some(r => r.id === 'latency')) recs.push('Cannot reach the GateNexa server. Check your internet connection or try again later.');
  if (failed.some(r => r.id === 'api')) recs.push('The GateNexa API is not responding. The server may be starting up — try again in a minute.');
  if (failed.some(r => r.id === 'backend')) recs.push('The backend server is not responding. Contact support if this persists.');
  if (degraded.some(r => r.id === 'database')) recs.push('Database is not connected. Your data may not sync until it reconnects.');
  if (degraded.some(r => r.id === 'ai')) recs.push('AI services are currently unavailable. Core GateNexa features will work normally.');
  if (poor.some(r => r.id === 'latency')) recs.push('High latency detected. You may experience slower page loads.');
  if (poor.some(r => r.id === 'api')) recs.push('API response times are elevated. The server may be under load.');
  if (results.find(r => r.id === 'pdf' && r.status === 'failed')) recs.push('PDF generation is unavailable. Report downloads will not work.');
  if (results.find(r => r.id === 'device' && r.grade === 'fair')) recs.push('Your device has limited resources. Close other tabs for a smoother experience.');

  if (recs.length === 0) recs.push('Everything looks good. Your connection and device are well-suited for GateNexa.');
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
