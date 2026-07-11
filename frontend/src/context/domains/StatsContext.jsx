import { createContext, useContext, useCallback } from 'react';

const StatsContext = createContext(null);
export const useStatsContext = () => { const c = useContext(StatsContext); if (!c) throw new Error('useStatsContext must be within StatsProvider'); return c; };

export function StatsProvider({ data, setData, children }) {
  const studyStats = data?.studyStats || {};
  const gateFeatures = data?.gateFeatures || {};
  const revisionSchedule = data?.revisionSchedule || [];
  const backupStatus = data?.backupStatus || 'saved';

  const updateStudyStats = useCallback((updates) => {
    setData(prev => ({ ...prev, studyStats: { ...(prev.studyStats || {}), ...updates } }));
  }, [setData]);

  return (
    <StatsContext.Provider value={{ studyStats, gateFeatures, revisionSchedule, backupStatus, updateStudyStats }}>
      {children}
    </StatsContext.Provider>
  );
}