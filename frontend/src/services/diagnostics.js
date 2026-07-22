const API_BASE = '/api';
const TIMEOUT = 8000;
const LATENCY_PING_URL = `${API_BASE}/health`;
const AI_PING_URL = `${API_BASE}/ai/health`;
const PDF_CHECK_URL = `${API_BASE}/health`;

const TESTS = [
  { id: 'latency', label: 'Internet Latency', icon: '📶', timeout: 5000 },
  { id: 'api', label: 'API Response Time', icon: '⚡', timeout: 8000 },
  { id: 'backend', label: 'Backend Health', icon: '🖥️', timeout: 6000 },
  { id: 'ai', label: 'AI Services', icon: '🤖', timeout: 10000 },
  { id: 'video', label: 'Video Streaming', icon: '🎬', timeout: 6000 },
  { id: 'browser', label: 'Browser Compatibility', icon: '🌐', timeout: 3000 },
  { id: 'device', label: 'Device Capability', icon: '📱', timeout: 3000 },
  { id: 'pdf', label: 'PDF Generation', icon: '📄', timeout: 8000 },
];

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms));
}

async function measureLatency() {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    await fetch(LATENCY_PING_URL, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    const ms = performance.now() - start;
    return { value: Math.round(ms), grade: ms < 50 ? 'excellent' : ms < 150 ? 'good' : ms < 300 ? 'fair' : 'poor', status: 'passed' };
  } catch {
    return { value: null, grade: 'poor', status: 'failed', detail: 'Could not reach server' };
  }
}

async function measureApiResponse() {
  const start = performance.now();
  try {
    await Promise.race([fetch(`${API_BASE}/health?_=${Date.now()}`, { cache: 'no-store' }), timeout(TIMEOUT)]);
    const ms = performance.now() - start;
    return { value: Math.round(ms), grade: ms < 200 ? 'excellent' : ms < 500 ? 'good' : ms < 1000 ? 'fair' : 'poor', status: 'passed' };
  } catch {
    return { value: null, grade: 'poor', status: 'failed', detail: 'API endpoint unreachable' };
  }
}

async function checkBackendHealth() {
  try {
    const res = await Promise.race([fetch(LATENCY_PING_URL), timeout(6000)]);
    if (!res.ok) return { status: 'failed', grade: 'poor', detail: `HTTP ${res.status}` };
    const data = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => ({})) : {};
    return { value: data.status || 'running', grade: 'excellent', status: 'passed' };
  } catch {
    return { status: 'failed', grade: 'poor', detail: 'Backend not responding' };
  }
}

async function checkAiServices() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(AI_PING_URL, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    if (!res.ok) return { status: 'degraded', grade: 'fair', detail: `AI service returned ${res.status}` };
    return { value: 'Available', grade: 'excellent', status: 'passed' };
  } catch {
    return { status: 'degraded', grade: 'fair', detail: 'AI service unavailable (offline mode)' };
  }
}

async function estimateVideoQuality() {
  const base = navigator.connection?.downlink;
  if (!base) return { value: 'Unknown', grade: 'good', status: 'passed', detail: 'Using default quality' };
  const speed = base;
  let grade, label;
  if (speed >= 8) { grade = 'excellent'; label = '4K Ready'; }
  else if (speed >= 3) { grade = 'good'; label = '1080p Ready'; }
  else if (speed >= 1.5) { grade = 'fair'; label = '720p Ready'; }
  else { grade = 'poor'; label = 'Likely Buffering'; }
  return { value: `${speed.toFixed(1)} Mbps`, grade, status: 'passed', detail: label };
}

async function checkBrowserCompat() {
  const checks = [];
  if ('serviceWorker' in navigator) checks.push('Service Worker');
  if ('IntersectionObserver' in window) checks.push('IntersectionObserver');
  if ('ResizeObserver' in window) checks.push('ResizeObserver');
  if (window.crypto?.subtle) checks.push('Web Crypto');
  if ('requestIdleCallback' in window) checks.push('IdleCallback');
  if (CSS?.supports?.('backdrop-filter', 'blur(1px)')) checks.push('backdrop-filter');
  const count = checks.length;
  const grade = count >= 5 ? 'excellent' : count >= 3 ? 'good' : 'fair';
  return { value: `${count}/6 checks`, grade, status: 'passed', detail: checks.join(', ') };
}

async function checkDeviceCapability() {
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const grade = (mem >= 4 || cores >= 6) ? 'excellent' : (mem >= 2 || cores >= 4) ? 'good' : 'fair';
  const parts = [];
  if (cores) parts.push(`${cores} cores`);
  if (mem) parts.push(`${mem} GB RAM`);
  return { value: parts.join(', ') || 'Detected', grade, status: 'passed', detail: grade === 'excellent' ? 'Smooth experience expected' : grade === 'good' ? 'Good performance' : 'May struggle with heavy animations' };
}

async function checkPdfGeneration() {
  try {
    const start = performance.now();
    const pdfMod = await import('@react-pdf/renderer');
    if (typeof pdfMod.pdf !== 'function') return { status: 'failed', grade: 'poor', detail: 'PDF library missing pdf() export' };
    const ms = performance.now() - start;
    return { value: `${Math.round(ms)}ms`, grade: ms < 1000 ? 'excellent' : ms < 3000 ? 'good' : 'fair', status: 'passed', detail: `@react-pdf/renderer v${pdfMod.version || 'detected'}` };
  } catch (e) {
    return { status: 'failed', grade: 'poor', detail: 'PDF library unavailable' };
  }
}

const TEST_FN = {
  latency: measureLatency,
  api: measureApiResponse,
  backend: checkBackendHealth,
  ai: checkAiServices,
  video: estimateVideoQuality,
  browser: checkBrowserCompat,
  device: checkDeviceCapability,
  pdf: checkPdfGeneration,
};

export async function runDiagnostics({ onProgress, signal } = {}) {
  const results = [];
  let completed = 0;
  const total = TESTS.length;

  const tasks = TESTS.map(test => async () => {
    if (signal?.aborted) return null;
    try {
      const result = await TEST_FN[test.id]();
      result.id = test.id;
      result.label = test.label;
      result.icon = test.icon;
      results.push(result);
    } catch (e) {
      results.push({ id: test.id, label: test.label, icon: test.icon, status: 'failed', grade: 'poor', detail: e.message });
    }
    completed++;
    onProgress?.(completed / total);
    return null;
  });

  await Promise.all(tasks.map(t => t()));

  const score = results.reduce((sum, r) => {
    if (r.grade === 'excellent') return sum + 100;
    if (r.grade === 'good') return sum + 75;
    if (r.grade === 'fair') return sum + 50;
    return sum + 20;
  }, 0) / results.length;

  const grade = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 45 ? 'fair' : 'poor';

  const recommendations = [];
  if (results.find(r => r.id === 'latency' && r.grade === 'poor')) recommendations.push('Your internet connection has high latency. Try switching to a wired connection or moving closer to your router.');
  if (results.find(r => r.id === 'api' && r.grade === 'poor')) recommendations.push('API response times are slow. The server may be under load — try again later or contact support.');
  if (results.find(r => r.id === 'backend' && r.status === 'failed')) recommendations.push('Backend server is not responding. Start the server with `cd backend && node server.js` and ensure MongoDB is running.');
  if (results.find(r => r.id === 'ai' && r.status === 'degraded')) recommendations.push('AI services are in offline mode. Core features will work but AI chat may not respond.');
  if (results.find(r => r.id === 'video' && r.grade === 'poor')) recommendations.push('Your connection speed may cause video buffering. Consider lowering video quality or downloading content for offline use.');
  if (results.find(r => r.id === 'device' && r.grade === 'fair')) recommendations.push('Your device has limited resources. Close other tabs and applications for the best experience.');
  if (results.find(r => r.id === 'pdf' && r.status === 'failed')) recommendations.push('PDF generation is not available. Report download requires @react-pdf/renderer to be properly installed.');
  if (!recommendations.length) recommendations.push('Everything looks good! Your connection, device, and browser are well-suited for GateNexa.');

  return { results, score: Math.round(score), grade, recommendations, timestamp: Date.now() };
}

export { TESTS };
