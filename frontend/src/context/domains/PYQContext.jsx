import { createContext, useContext, useCallback } from 'react';

const PYQContext = createContext(null);
export const usePYQContext = () => { const c = useContext(PYQContext); if (!c) throw new Error('usePYQContext must be within PYQProvider'); return c; };

export function PYQProvider({ data, setData, children }) {
  const pyqs = data?.pyqs || [];

  const toggleBookmark = useCallback((pyqId) => {
    setData(prev => ({ ...prev, pyqs: (prev.pyqs || []).map(p => p._id === pyqId ? { ...p, bookmarked: !p.bookmarked } : p) }));
  }, [setData]);

  const markSolved = useCallback((pyqId, status) => {
    setData(prev => ({ ...prev, pyqs: (prev.pyqs || []).map(p => p._id === pyqId ? { ...p, status: status || 'solved' } : p) }));
  }, [setData]);

  const addPYQ = useCallback((pyq) => {
    setData(prev => ({ ...prev, pyqs: [...(prev.pyqs || []), pyq] }));
  }, [setData]);

  return (
    <PYQContext.Provider value={{ pyqs, toggleBookmark, markSolved, addPYQ }}>
      {children}
    </PYQContext.Provider>
  );
}