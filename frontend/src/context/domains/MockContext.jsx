import { createContext, useContext, useCallback } from 'react';

const MockContext = createContext(null);
export const useMockContext = () => { const c = useContext(MockContext); if (!c) throw new Error('useMockContext must be within MockProvider'); return c; };

export function MockProvider({ data, setData, children }) {
  const mocks = data?.mocks || [];

  const addMock = useCallback((mock) => {
    setData(prev => ({ ...prev, mocks: [...(prev.mocks || []), mock] }));
  }, [setData]);

  const updateMock = useCallback((mockId, updates) => {
    setData(prev => ({ ...prev, mocks: (prev.mocks || []).map(m => m._id === mockId ? { ...m, ...updates } : m) }));
  }, [setData]);

  const removeMock = useCallback((mockId) => {
    setData(prev => ({ ...prev, mocks: (prev.mocks || []).filter(m => m._id !== mockId) }));
  }, [setData]);

  return (
    <MockContext.Provider value={{ mocks, addMock, updateMock, removeMock }}>
      {children}
    </MockContext.Provider>
  );
}