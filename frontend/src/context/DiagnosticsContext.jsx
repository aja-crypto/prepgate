import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { runDiagnostics } from '../services/diagnostics';

const DiagnosticsContext = createContext(null);

export function DiagnosticsProvider({ children }) {
  const [showModal, setShowModal] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const openDiagnostics = useCallback(() => {
    setShowModal(true);
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  const closeDiagnostics = useCallback(() => {
    setShowModal(false);
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const startDiagnostics = useCallback(async () => {
    setRunning(true);
    setProgress(0);
    setError(null);
    const abortController = new AbortController();
    abortRef.current = abortController;
    try {
      const res = await runDiagnostics({
        onProgress: setProgress,
        signal: abortController.signal,
      });
      if (!abortController.signal.aborted) {
        setResults(res);
        setProgress(1);
      }
    } catch (e) {
      if (!abortController.signal.aborted) {
        setError(e.message);
      }
    }
    if (!abortController.signal.aborted) {
      setRunning(false);
    }
  }, []);

  const retryDiagnostics = useCallback(() => {
    startDiagnostics();
  }, [startDiagnostics]);

  return (
    <DiagnosticsContext.Provider value={{
      showModal, openDiagnostics, closeDiagnostics,
      running, results, progress, error,
      startDiagnostics, retryDiagnostics,
    }}>
      {children}
    </DiagnosticsContext.Provider>
  );
}

export function useDiagnostics() {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  return ctx;
}
