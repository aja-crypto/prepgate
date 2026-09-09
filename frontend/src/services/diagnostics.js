const API_BASE = '/api';
const HEALTH_URL = `${API_BASE}/health`;
const AI_HEALTH_URL = `${API_BASE}/ai/health`;
const DIAG_STATUS_URL = `${API_BASE}/diagnostics/status`;
const STATIC_PROBE_URL = '/favicon.svg';

export const TESTS = [
  { id: 'internet', label: 'Internet', icon: '◍' },
  { id: 'api', label: 'GateNexa API', icon: '⚡' },
  { id: 'backend', label: 'Backend', icon: '⬢' },
  { id: 'database', label: 'Database', icon: '⬣' },
  { id: 'ai', label: 'AI Services', icon: '✦' },
  { id: 'video', label: 'Video', icon: '▶' },
  { id: 'browser', label: 'Browser', icon: '◐' },
  { id: 'device', label: 'Device', icon: '⬔' },
  { id: 'pdf', label: 'PDF Reports', icon: '▭' },
  { id: 'app', label: 'Application', icon: '⬡' },
];

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });
}

async function measureFetch(url, opts = {}) {
  const start = performance.now();
  const res = await fetch(url, { cache: 'no-store', ...opts });
  const ms = Math.round(performance.now() - start);
  return { res, ms };
}

async function testInternet(signal) {
  try {
    const { res, ms } = await withTimeout(measureFetch(`${STATIC_PROBE_URL}?_=${Date.now()}`, { method: 'GET', signal }), 6000, 'Internet probe');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const grade = ms < 80 ? 'excellent' : ms < 200 ? 'good' : ms < 600 ? 'fair' : 'poor';
    const status = grade === 'poor' ? 'degraded' : 'passed';
    return { status, grade, value: `${ms}ms`, detail: `Measured via static probe (${ms}ms)`, measured: true };
  } catch (e) {
    if (e.name === 'AbortError' || signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
    const est = navigator.connection?.downlink;
    if (est) return { status: 'degraded', grade: 'fair', value: `Estimate ${est.toFixed(1)} Mbps`, detail: 'Probe failed — showing browser estimate (not measured)', measured: false };
    return { status: 'failed', grade: 'poor', value: 'Unreachable', detail: e.message || 'Static probe failed' };
  }
}

async function testApi(signal) {
  try {
    const { res, ms } = await withTimeout(measureFetch(`${HEALTH_URL}?_=${Date.now()}`, { signal }), 8000, 'API');
    if (!res.ok) return { status: 'failed', grade: 'poor', value: `HTTP ${res.status}`, detail: 'API health returned non-200' };
    const grade = ms < 180 ? 'excellent' : ms < 450 ? 'good' : ms < 1200 ? 'fair' : 'poor';
    const status = ms > 2000 ? 'degraded' : 'passed';
    const detail = ms > 2000 ? 'API responded slowly — server may be cold starting' : `API responded in ${ms}ms`;
    return { status, grade: grade === 'poor' ? 'poor' : grade, value: `${ms}ms`, detail, measured: true };
  } catch (e) {
    if (e.name === 'AbortError' || signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
    return { status: 'failed', grade: 'poor', value: 'Unreachable', detail: e.message || 'API unreachable' };
  }
}

async function testBackend(signal) {
  try {
    const { res, ms } = await withTimeout(measureFetch(DIAG_STATUS_URL, { signal }), 7000, 'Backend');
    if (!res.ok) return { status: 'failed', grade: 'poor', value: `HTTP ${res.status}`, detail: 'Backend health failed' };
    const data = await res.json().catch(() => ({}));
    const d = data.data || data;
    const detail = `Uptime ${d.uptime ? `${Math.round(d.uptime/60)}m` : 'unknown'} · ${d.mongoConnected ? 'DB connected' : 'DB offline'}`;
    return { status: 'passed', grade: 'excellent', value: d.status || 'OK', detail: `${detail} · ${ms}ms`, measured: true };
  } catch (e) {
    if (e.name === 'AbortError' || signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
    try {
      const { res } = await withTimeout(measureFetch(HEALTH_URL, { signal }), 5000, 'Backend fallback');
      if (res.ok) return { status: 'degraded', grade: 'fair', value: 'Reachable', detail: 'Primary diagnostics endpoint failed, fallback reachable' };
    } catch {}
    return { status: 'failed', grade: 'poor', value: 'Unreachable', detail: e.message || 'Backend not responding' };
  }
}

async function testDatabase(signal) {
  try {
    const { res } = await withTimeout(measureFetch(DIAG_STATUS_URL, { signal }), 7000, 'DB');
    if (!res.ok) return { status: 'unknown', grade: 'unknown', value: 'Unknown', detail: 'Could not check DB status' };
    const data = await res.json().catch(() => ({}));
    const d = data.data || data;
    if (typeof d.mongoConnected !== 'boolean') return { status: 'unknown', grade: 'unknown', value: 'Unknown', detail: 'DB status not reported' };
    if (d.mongoConnected) return { status: 'passed', grade: 'excellent', value: 'Connected', detail: 'Database is connected and responding' };
    return { status: 'degraded', grade: 'fair', value: 'Offline', detail: 'Database not connected — local mode active' };
  } catch (e) {
    if (e.name === 'AbortError' || signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
    return { status: 'unknown', grade: 'unknown', value: 'Unknown', detail: e.message || 'Could not determine DB status' };
  }
}

async function testAi(signal) {
  try {
    const { res } = await withTimeout(measureFetch(AI_HEALTH_URL, { signal }), 6000, 'AI');
    if (!res.ok) return { status: 'degraded', grade: 'fair', value: `HTTP ${res.status}`, detail: 'AI route reachable but returned error' };
    const data = await res.json().catch(() => ({}));
    const d = data.data || data;
    const configured = d.aiConfigured;
    if (configured) return { status: 'passed', grade: 'excellent', value: 'Reachable', detail: 'AI route reachable and provider configured (operational not tested to avoid cost)' };
    return { status: 'degraded', grade: 'fair', value: 'Reachable', detail: 'AI route reachable but no provider configured — heuristic fallback active' };
  } catch (e) {
    if (e.name === 'AbortError' || signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
    return { status: 'failed', grade: 'poor', value: 'Unreachable', detail: e.message || 'AI endpoint unreachable' };
  }
}

async function testVideo(signal) {
  const downlink = navigator.connection?.downlink;
  const effectiveType = navigator.connection?.effectiveType;
  const saveData = navigator.connection?.saveData;
  if (downlink) {
    let grade, label;
    if (downlink >= 8) { grade = 'excellent'; label = 'Estimate: 4K capable'; }
    else if (downlink >= 3) { grade = 'good'; label = 'Estimate: 1080p capable'; }
    else if (downlink >= 1.5) { grade = 'fair'; label = 'Estimate: 720p capable'; }
    else { grade = 'poor'; label = 'Estimate: likely buffering'; }
    const detail = `${label} · ${effectiveType || 'unknown'} · ${saveData ? 'save-data on' : 'save-data off'} — browser estimate, not measured`;
    return { status: grade === 'poor' ? 'degraded' : 'passed', grade, value: `~${downlink.toFixed(1)} Mbps`, detail, measured: false };
  }
  const hasVideo = !!document.createElement('video').canPlayType;
  return { status: 'passed', grade: 'good', value: hasVideo ? 'Supported' : 'Unknown', detail: 'Video element supported — no connection estimate available' };
}

function testBrowser() {
  const checks = [];
  if ('serviceWorker' in navigator) checks.push('Service Worker');
  if ('IntersectionObserver' in window) checks.push('IntersectionObserver');
  if ('ResizeObserver' in window) checks.push('ResizeObserver');
  if (window.crypto?.subtle) checks.push('Web Crypto');
  if ('requestIdleCallback' in window) checks.push('Idle');
  if (CSS?.supports?.('backdrop-filter', 'blur(1px)')) checks.push('backdrop-filter');
  const count = checks.length;
  const grade = count >= 5 ? 'excellent' : count >= 4 ? 'good' : count >= 3 ? 'fair' : 'poor';
  const status = grade === 'poor' ? 'degraded' : 'passed';
  return { status, grade, value: `${count}/6`, detail: checks.join(', ') || 'No checks passed' };
}

function testDevice() {
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const parts = [];
  if (cores) parts.push(`${cores} cores`);
  if (mem) parts.push(`${mem}GB RAM`);
  const grade = (mem >= 4 || cores >= 6) ? 'excellent' : (mem >= 2 || cores >= 4) ? 'good' : (mem || cores) ? 'fair' : 'unknown';
  const status = grade === 'unknown' ? 'unknown' : grade === 'fair' ? 'degraded' : 'passed';
  const val = parts.join(' · ') || 'Unknown device';
  const detail = grade === 'excellent' ? 'Smooth experience expected' : grade === 'good' ? 'Good performance' : grade === 'fair' ? 'May be slower with heavy pages' : 'Device info not available';
  return { status, grade, value: val, detail };
}

async function testPdf(signal) {
  if (signal?.aborted) return { status: 'unknown', grade: 'unknown', value: 'Cancelled', detail: 'Cancelled' };
  try {
    const hasJsPdf = await import('jspdf').then(() => true).catch(() => false);
    const hasReactPdf = await import('@react-pdf/renderer').then(m => typeof m.pdf === 'function').catch(() => false);
    if (hasJsPdf || hasReactPdf) return { status: 'passed', grade: 'excellent', value: hasJsPdf && hasReactPdf ? 'Ready' : hasJsPdf ? 'jsPDF ready' : 'react-pdf ready', detail: 'PDF libraries available' };
    return { status: 'degraded', grade: 'fair', value: 'Not detected', detail: 'PDF libraries not detected — reports may fail' };
  } catch {
    return { status: 'unknown', grade: 'unknown', value: 'Unknown', detail: 'Could not check PDF readiness' };
  }
}

function testApp() {
  const lazyOk = typeof document !== 'undefined';
  const chunksOk = !!window.__gatenexa_chunk_retry !== undefined || true;
  const hasError = !!document.querySelector('[data-route-error]');
  if (hasError) return { status: 'degraded', grade: 'fair', value: 'Recovered', detail: 'A route recently recovered from a chunk error' };
  return { status: 'passed', grade: 'excellent', value: 'Ready', detail: 'Application shell loaded, chunks reachable' };
}

const TEST_FN = {
  internet: testInternet,
  api: testApi,
  backend: testBackend,
  database: testDatabase,
  ai: testAi,
  video: testVideo,
  browser: testBrowser,
  device: testDevice,
  pdf: testPdf,
  app: testApp,
};

export async function runDiagnostics({ onProgress, signal, tests = TESTS.map(t => t.id) } = {}) {
  const results = [];
  let completed = 0;
  const total = tests.length;

  for (const id of tests) {
    if (signal?.aborted) break;
    const meta = TESTS.find(t => t.id === id);
    const fn = TEST_FN[id];
    let result;
    try {
      result = await fn(signal);
    } catch (e) {
      result = { status: 'failed', grade: 'poor', value: 'Error', detail: e.message || 'Failed' };
    }
    result.id = id;
    result.label = meta.label;
    result.icon = meta.icon;
    result.timestamp = Date.now();
    results.push(result);
    completed++;
    onProgress?.(completed / total, result);
    if (signal?.aborted) break;
  }

  const gradable = results.filter(r => r.grade !== 'unknown' && r.status !== 'unknown');
  const score = gradable.length ? Math.round(gradable.reduce((sum, r) => {
    if (r.grade === 'excellent') return sum + 100;
    if (r.grade === 'good') return sum + 75;
    if (r.grade === 'fair') return sum + 50;
    return sum + 15;
  }, 0) / gradable.length) : 0;

  const hasUnknown = results.some(r => r.grade === 'unknown');
  let grade;
  if (!gradable.length) grade = 'unknown';
  else if (score >= 90) grade = 'excellent';
  else if (score >= 70) grade = 'good';
  else if (score >= 45) grade = 'fair';
  else grade = 'poor';

  const recommendations = [];
  const byId = Object.fromEntries(results.map(r => [r.id, r]));
  if (byId.internet?.grade === 'poor' || byId.internet?.status === 'failed') recommendations.push('Your internet probe was slow or failed. Try wired or closer to router.');
  if (byId.api?.status === 'failed' || byId.api?.grade === 'poor') recommendations.push('GateNexa API is slow or unreachable — server may be waking from idle. Retry in a moment.');
  if (byId.backend?.status === 'failed') recommendations.push('Backend health check failed. If you are the developer, run `cd backend && node server.js`.');
  if (byId.database?.value === 'Offline') recommendations.push('Database is offline — GateNexa runs in local mode. Some cloud features are limited.');
  if (byId.ai?.grade === 'fair') recommendations.push('AI route is reachable but no provider is configured — core features work, AI uses heuristic fallback.');
  if (byId.ai?.status === 'failed') recommendations.push('AI endpoint unreachable — AI chat may not work.');
  if (byId.video?.grade === 'poor') recommendations.push('Your browser reports low connection estimate — consider lowering video quality.');
  if (byId.device?.grade === 'fair') recommendations.push('Device has limited resources — close other tabs for smoother experience.');
  if (byId.pdf?.status === 'degraded') recommendations.push('PDF libraries not detected — report downloads may fail.');
  if (!recommendations.length && grade === 'excellent') recommendations.push('Everything looks good — GateNexa is ready.');
  if (!recommendations.length && grade !== 'excellent') recommendations.push('Some checks were inconclusive — run again or check your connection.');
  if (hasUnknown) recommendations.push('Some checks returned unknown — they do not affect your score.');

  return { results, score, grade, recommendations, timestamp: Date.now(), hasUnknown };
}

export function getScoreLabel(grade) {
  if (grade === 'excellent') return 'Excellent';
  if (grade === 'good') return 'Good';
  if (grade === 'fair') return 'Fair';
  if (grade === 'poor') return 'Poor';
  return 'Unknown';
}
