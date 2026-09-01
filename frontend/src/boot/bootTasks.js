function withSoftFail(promiseFactory, timeoutMs = 1200) {
  return () =>
    new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({ ok: false, reason: 'timeout' });
        }
      }, timeoutMs);
      promiseFactory()
        .then((value) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ ok: true, value });
          }
        })
        .catch((error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ ok: false, reason: error?.message || 'error' });
          }
        });
    });
}
async function mountApp() {
  return { ok: true };
}
const restoreSession = withSoftFail(async () => true, 800);
const loadConfig = withSoftFail(async () => true, 800);
async function loadCriticalAssets() {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(() => r(true), 700)),
      ]);
    } catch {}
  }
  return { ok: true };
}
async function readyCheck() {
  return { ok: true };
}
export const BOOT_STAGES = [
  { key: 'app', weight: 35, label: 'Initializing GateNexa', run: mountApp, soft: false },
  { key: 'session', weight: 25, label: 'Restoring your session', run: restoreSession, soft: true },
  { key: 'config', weight: 15, label: 'Preparing your workspace', run: loadConfig, soft: true },
  { key: 'assets', weight: 5, label: 'Loading study data', run: withSoftFail(loadCriticalAssets, 900), soft: true },
  { key: 'readyCheck', weight: 20, label: 'Ready', run: readyCheck, soft: false },
];
export const BOOT_SAFETY_TIMEOUT_MS = 2200;
