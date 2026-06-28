export function safeGet(key, fallback = null) {
  try { return localStorage.getItem(key); }
  catch { return fallback; }
}

export function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch { return false; }
}

export function safeRemove(key) {
  try { localStorage.removeItem(key); }
  catch { /* noop */ }
}

export function safeJsonGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function safeJsonSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
