import { useState, useEffect } from 'react';
import { PageLoading } from './GateLoadingScreen';

const ActionButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn-primary text-xs px-5 py-2.5"
  >
    {label}
  </button>
);

export function PageState({
  state,
  isLoading,
  isEmpty,
  isError,
  loadingTitle = 'Loading...',
  emptyMessage = 'No data found.',
  emptyAction,
  errorMessage = 'Something went wrong.',
  errorAction,
  children,
  className = '',
}) {
  // Support both `state` prop and shortcut boolean props
  const resolved = state ?? (isLoading ? 'loading' : isEmpty ? 'empty' : isError ? 'error' : 'success');

  if (resolved === 'loading') {
    return <PageLoading title={loadingTitle} />;
  }

  if (resolved === 'error') {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
          </svg>
        </div>
        <h4 className="text-base font-semibold text-text mb-1">Unable to Load</h4>
        <p className="text-sm text-text3 max-w-xs mx-auto leading-relaxed mb-5">{errorMessage}</p>
        {errorAction && <ActionButton onClick={errorAction.onClick} label={errorAction.label} />}
      </div>
    );
  }

  if (resolved === 'empty') {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-primary)', opacity: 0.08, border: '1px solid var(--color-border)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-text3">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <h4 className="text-base font-semibold text-text mb-1">No Data Found</h4>
        <p className="text-sm text-text3 max-w-xs mx-auto leading-relaxed mb-5">{emptyMessage}</p>
        {emptyAction && <ActionButton onClick={emptyAction.onClick} label={emptyAction.label} />}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

const pageCache = new Map();
const PAGE_TTL = 2 * 60 * 1000;
function pageKey(deps) {
  try { return JSON.stringify(deps); } catch { return String(deps); }
}
export function usePageState(loadFn, deps = [], cacheKey = null) {
  const key = cacheKey || pageKey(deps);
  const cached = pageCache.get(key);
  const hasFreshCache = cached && Date.now() - cached.ts < PAGE_TTL;
  const [state, setState] = useState(hasFreshCache ? 'success' : 'loading');
  const [data, setData] = useState(hasFreshCache ? cached.data : null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasFreshCache) {
      let cancelled = false;
      loadFn().then((result) => {
        if (cancelled) return;
        const isEmpty = !result || (Array.isArray(result) ? result.length === 0 : Object.keys(result).length === 0);
        if (!isEmpty) { pageCache.set(key, { data: result, ts: Date.now() }); setData(result); }
      }).catch(() => {});
      return () => { cancelled = true; };
    }
    let cancelled = false;
    setState('loading');
    setError(null);
    loadFn()
      .then((result) => {
        if (!cancelled) {
          pageCache.set(key, { data: result, ts: Date.now() });
          setData(result);
          setState(result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0) ? 'success' : 'empty');
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err); setState('error'); }
      });
    return () => { cancelled = true; };
  }, deps);

  const retry = () => {
    setState('loading');
    setError(null);
    loadFn()
      .then((result) => {
        setData(result);
        setState(
          result &&
          (Array.isArray(result)
            ? result.length > 0
            : Object.keys(result).length > 0)
            ? 'success'
            : 'empty'
        );
      })
      .catch((err) => {
        setError(err);
        setState('error');
      });
  };

  return { state, data, error, retry };
}
