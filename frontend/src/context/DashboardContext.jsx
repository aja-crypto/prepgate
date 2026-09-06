// Dashboard widget layout — visibility, order, drag-and-drop
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getDefaultWidgetLayout, DEFAULT_WIDGETS } from '../design/tokens';

const DashboardContext = createContext(null);

function storageKey(userId) {
  return `gatenexa_dashboard_${userId || 'guest'}`;
}

function mobileStorageKey(userId) {
  return `gatenexa_dashboard_mobile_${userId || 'guest'}`;
}

// Mobile default widgets — minimal command center
const MOBILE_DEFAULTS = [
  { id: 'countdown', visible: true },
  { id: 'announcements', visible: true },
  { id: 'recruitment', visible: true },
  { id: 'trending', visible: true },
  { id: 'live-news', visible: true },
  { id: 'daily-content', visible: true },
  { id: 'analysis', visible: true },
  { id: 'exam-schedule', visible: true },
];

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

function loadMobileLayout(userId) {
  try {
    const raw = localStorage.getItem(mobileStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const known = new Set(DEFAULT_WIDGETS.map((w) => w.id));
      return parsed.filter((w) => known.has(w.id));
    }
  } catch { /* ignore */ }
  return MOBILE_DEFAULTS.map((w, i) => ({ id: w.id, visible: w.visible, order: i }));
}

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const [widgets, setWidgets] = useState(() => loadLayout(userId));
  const [mobileWidgets, setMobileWidgets] = useState(() => loadMobileLayout(userId));
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    setWidgets(loadLayout(userId));
    setMobileWidgets(loadMobileLayout(userId));
  }, [userId]);

  useEffect(() => {
    if (userId === 'guest') return;
    localStorage.setItem(storageKey(userId), JSON.stringify(widgets));
  }, [widgets, userId]);

  useEffect(() => {
    if (userId === 'guest') return;
    localStorage.setItem(mobileStorageKey(userId), JSON.stringify(mobileWidgets));
  }, [mobileWidgets, userId]);

  const visibleWidgets = useMemo(() => [...widgets]
    .filter((w) => w.visible || w.id === 'motivation')
    .sort((a, b) => a.order - b.order), [widgets]);

  const visibleMobileWidgets = useMemo(() => [...mobileWidgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order), [mobileWidgets]);

  const isMobileWidgetVisible = useCallback((id) => {
    const w = mobileWidgets.find((w) => w.id === id);
    return w?.visible ?? false;
  }, [mobileWidgets]);

  const toggleWidget = useCallback((id) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  }, []);

  const toggleMobileWidget = useCallback((id) => {
    setMobileWidgets((prev) => {
      const exists = prev.find((w) => w.id === id);
      if (exists) {
        return prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      }
      return [...prev, { id, visible: true, order: prev.length }];
    });
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

  const resetMobileLayout = useCallback(() => {
    setMobileWidgets(MOBILE_DEFAULTS.map((w, i) => ({ id: w.id, visible: w.visible, order: i })));
  }, []);

  const getWidgetMeta = useCallback((id) => DEFAULT_WIDGETS.find((w) => w.id === id), []);

  return (
    <DashboardContext.Provider value={{
      widgets,
      visibleWidgets,
      mobileWidgets,
      visibleMobileWidgets,
      isMobileWidgetVisible,
      toggleMobileWidget,
      resetMobileLayout,
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
