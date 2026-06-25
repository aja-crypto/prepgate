// Dashboard widget layout — visibility, order, drag-and-drop
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getDefaultWidgetLayout, DEFAULT_WIDGETS } from '../design/tokens';

const DashboardContext = createContext(null);

function storageKey(userId) {
  return `gateapex_dashboard_${userId || 'guest'}`;
}

function loadLayout(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const known = new Set(DEFAULT_WIDGETS.map((w) => w.id));
      const filtered = parsed.filter((w) => known.has(w.id));
      const missing = DEFAULT_WIDGETS.filter((w) => !filtered.some((f) => f.id === w.id));
      return [...filtered, ...missing.map((w, i) => ({ id: w.id, visible: w.defaultVisible, order: filtered.length + i }))];
    }
  } catch { /* ignore */ }
  return getDefaultWidgetLayout();
}

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const [widgets, setWidgets] = useState(() => loadLayout(userId));
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    setWidgets(loadLayout(userId));
  }, [userId]);

  useEffect(() => {
    if (userId === 'guest') return;
    localStorage.setItem(storageKey(userId), JSON.stringify(widgets));
  }, [widgets, userId]);

  const visibleWidgets = useMemo(() => [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order), [widgets]);

  const toggleWidget = useCallback((id) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  }, []);

  const reorderWidgets = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const fromIdx = sorted.findIndex((w) => w.id === fromId);
      const toIdx = sorted.findIndex((w) => w.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = sorted.splice(fromIdx, 1);
      sorted.splice(toIdx, 0, moved);
      return sorted.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(getDefaultWidgetLayout());
  }, []);

  const getWidgetMeta = useCallback((id) => DEFAULT_WIDGETS.find((w) => w.id === id), []);

  return (
    <DashboardContext.Provider value={{
      widgets,
      visibleWidgets,
      editMode,
      setEditMode,
      dragId,
      setDragId,
      toggleWidget,
      reorderWidgets,
      resetLayout,
      getWidgetMeta,
      allWidgets: DEFAULT_WIDGETS,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
