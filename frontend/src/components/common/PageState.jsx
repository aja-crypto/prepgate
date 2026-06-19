import { useState, useEffect } from 'react';
import { PageLoading } from './GateLoadingScreen';

export function PageState({
  state,
  loadingTitle = 'Loading...',
  emptyMessage = 'No data found.',
  emptyAction,
  errorMessage = 'Something went wrong.',
  errorAction,
  children,
  className = '',
}) {
  if (state === 'loading') {
    return <PageLoading title={loadingTitle} />;
  }

  if (state === 'error') {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
          </svg>
        </div>
        <h4 className="text-base font-semibold text-text mb-1">Unable to Load</h4>
        <p className="text-sm text-text3 max-w-xs mx-auto leading-relaxed mb-5">{errorMessage}</p>
        {errorAction && (
          <button type="button" onClick={errorAction.onClick} className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)' }}>
            {errorAction.label}
          </button>
        )}
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-text3"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
        </div>
        <h4 className="text-base font-semibold text-text mb-1">No Data Found</h4>
        <p className="text-sm text-text3 max-w-xs mx-auto leading-relaxed mb-5">{emptyMessage}</p>
        {emptyAction && (
          <button type="button" onClick={emptyAction.onClick} className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)' }}>
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

export function usePageState(loadFn, deps = []) {
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setError(null);

    loadFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setState(result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0) ? 'success' : 'empty');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setState('error');
        }
      });

    return () => { cancelled = true; };
  }, deps);

  const retry = () => {
    setState('loading');
    setError(null);
    loadFn()
      .then((result) => {
        setData(result);
        setState(result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0) ? 'success' : 'empty');
      })
      .catch((err) => {
        setError(err);
        setState('error');
      });
  };

  return { state, data, error, retry };
}