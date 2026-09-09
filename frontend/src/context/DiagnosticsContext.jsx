import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { runDiagnostics } from '../services/diagnostics';

const DiagnosticsContext = createContext(null);

export function DiagnosticsProvider({ children }) {
  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState('idle');
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  const abortRef = useRef(null);

  const openDiagnostics = useCallback(() => {
    setShowModal(true);
    setState('idle');
    setResults(null);
    setError(null);
    setProgress(0);
    setCurrentTest(null);
  }, []);

  const closeDiagnostics = useCallback(() => {
    setShowModal(false);
    abortRef.current?.abort();
    setState(prev => prev === 'running' ? 'cancelled' : prev);
  }, []);

  const startDiagnostics = useCallback(async (opts = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('running');
    setProgress(0);
    setError(null);
    setResults(null);
    setCurrentTest(null);
    try {
      const res = await runDiagnostics({
        onProgress: (p, r) => {
          if (controller.signal.aborted) return;
          setProgress(p);
          if (r) setCurrentTest(r.id);
        },
        signal: controller.signal,
        ...opts,
      });
      if (controller.signal.aborted) {
        setState('cancelled');
        return null;
      }
      setResults(res);
      setProgress(1);
      const hasFailed = res.results.some(r => r.status === 'failed');
      const hasUnknown = res.results.some(r => r.status === 'unknown');
      if (hasFailed && res.grade === 'poor') setState('failed');
      else if (hasFailed || hasUnknown) setState('partial');
      else setState('completed');
      return res;
    } catch (e) {
      if (controller.signal.aborted) {
        setState('cancelled');
        return null;
      }
      setError(e.message || 'Diagnostics failed');
      setState('failed');
      return null;
    } finally {
      setCurrentTest(null);
    }
  }, []);

  const retryFailed = useCallback(async () => {
    if (!results) return startDiagnostics();
    const failedIds = results.results.filter(r => r.status === 'failed' || r.status === 'degraded').map(r => r.id);
    if (!failedIds.length) return startDiagnostics();
    return startDiagnostics({ tests: failedIds });
  }, [results, startDiagnostics]);

  const value = {
    showModal, openDiagnostics, closeDiagnostics,
    state, running: state === 'running', results, progress, error, currentTest,
    startDiagnostics, retryFailed, retryDiagnostics: retryFailed,
  };

  if (typeof window !== 'undefined') window.__openDiagnostics = openDiagnostics;

  return (
    <DiagnosticsContext.Provider value={value}>
      {children}
    </DiagnosticsContext.Provider>
  );
}

export function useDiagnostics() {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  return ctx;
}
