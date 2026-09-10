import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { runDiagnostics } from '../services/diagnostics';

const DiagnosticsContext = createContext(null);

export function DiagnosticsProvider({ children }) {
  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState('idle');
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const openDiagnostics = useCallback(() => {
    setShowModal(true);
    if (!results && state !== 'running') {
      setResults(null);
      setError(null);
      setProgress(0);
      setState('idle');
    }
  }, [results, state]);

  const closeDiagnostics = useCallback(() => {
    setShowModal(false);
    abortRef.current?.abort();
    if (mountedRef.current) setState(prev => prev === 'running' ? 'cancelled' : prev);
  }, []);

  const startDiagnostics = useCallback(async () => {
    setState('running');
    setProgress(0);
    setError(null);
    setResults(null);
    const abortController = new AbortController();
    abortRef.current = abortController;
    try {
      const res = await runDiagnostics({
        onProgress: (p) => { if (mountedRef.current) setProgress(p); },
        signal: abortController.signal,
      });
      if (!abortController.signal.aborted && mountedRef.current) {
        setResults(res);
        setProgress(1);
        setState('completed');
      }
    } catch (e) {
      if (!abortController.signal.aborted && mountedRef.current) {
        setError(e.message);
        setState('failed');
      }
    }
  }, []);

  const retryDiagnostics = useCallback(() => {
    startDiagnostics();
  }, [startDiagnostics]);

  const cancelDiagnostics = useCallback(() => {
    abortRef.current?.abort();
    if (mountedRef.current) setState('cancelled');
  }, []);

  const value = {
    showModal, openDiagnostics, closeDiagnostics,
    state, running: state === 'running', results, progress, error,
    startDiagnostics, retryDiagnostics, cancelDiagnostics,
  };

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
