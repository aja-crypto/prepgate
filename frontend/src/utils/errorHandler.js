import toast from 'react-hot-toast';

let toastThrottle = {};
const THROTTLE_MS = 5000;

function shouldShowToast(key) {
  const now = Date.now();
  if (toastThrottle[key] && now - toastThrottle[key] < THROTTLE_MS) return false;
  toastThrottle[key] = now;
  return true;
}

export function warn(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[GateApex]', ...args);
  }
}

export function logError(operation, error, context = {}) {
  const msg = error?.response?.data?.message || error?.message || String(error);
  console.error(`[GateApex] ${operation} failed:`, msg, Object.keys(context).length ? context : '');
  return msg;
}

export function silentCatch(operation, { fallback, toast: showToast, retry, retryDelay = 2000 } = {}) {
  return (error) => {
    const msg = logError(operation, error);
    if (showToast && shouldShowToast(operation)) {
      toast.error(showToast === true ? msg : showToast);
    }
    if (retry && typeof retry === 'function') {
      setTimeout(() => {
        try { retry(); } catch (e) { logError(`${operation} retry`, e); }
      }, retryDelay);
    }
    if (fallback !== undefined) return fallback;
    return null;
  };
}

export function withErrorHandling(fn, operation, options = {}) {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result && typeof result.catch === 'function') {
        return result.catch(silentCatch(operation, options));
      }
      return result;
    } catch (error) {
      return silentCatch(operation, options)(error);
    }
  };
}

export function createServiceHandler(serviceFn, operation, options = {}) {
  return (...args) => {
    return serviceFn(...args).catch(silentCatch(operation, options));
  };
}

