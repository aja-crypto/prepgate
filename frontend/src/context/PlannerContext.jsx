// Planner widget layout — visibility, order, persistence (mobile-first)
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PlannerContext = createContext(null);

// Planner widget definitions
const PLANNER_WIDGETS = [
  { id: 'week-selector', label: 'Week Selector', category: 'navigation', defaultVisible: true },
  { id: 'heatmap', label: 'Weekly Heatmap', category: 'navigation', defaultVisible: true },
  { id: 'timeline', label: 'Timeline', category: 'core', defaultVisible: true, alwaysVisible: true },
  { id: 'quick-actions', label: 'Quick Actions', category: 'sidebar', defaultVisible: true },
  { id: 'subject-priority', label: 'Subject Priority', category: 'sidebar', defaultVisible: true },
  { id: 'today-goal', label: 'Today\'s Goal', category: 'sidebar', defaultVisible: true },
  { id: 'focus-panel', label: 'Focus Panel', category: 'right', defaultVisible: true },
  { id: 'revision-queue', label: 'Revision Queue', category: 'right', defaultVisible: true },
  { id: 'mock-reminder', label: 'Mock Reminder', category: 'right', defaultVisible: true },
];

function storageKey(userId) {
  return `gatenexa_planner_${userId || 'guest'}`;
}

function loadLayout(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const known = new Set(PLANNER_WIDGETS.map((w) => w.id));
      const filtered = parsed.filter((w) => known.has(w.id));
      const missing = PLANNER_WIDGETS.filter((w) => !filtered.some((f) => f.id === w.id));
      return [...filtered, ...missing.map((w, i) => ({
        id: w.id,
        visible: w.defaultVisible,
        order: filtered.length + i,
      }))];
    }
  } catch { /* ignore */ }
  return getDefaultLayout();
}

function getDefaultLayout() {
  return PLANNER_WIDGETS.map((w, i) => ({
    id: w.id,
    visible: w.defaultVisible,
    order: i,
  }));
}

export const PlannerProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const [widgets, setWidgets] = useState(() => loadLayout(userId));

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

  const isWidgetVisible = useCallback((id) => {
    const w = widgets.find((w) => w.id === id);
    return w?.visible ?? true;
  }, [widgets]);

  const toggleWidget = useCallback((id) => {
    setWidgets((prev) => prev.map((w) => {
      if (w.id === id) {
        const def = PLANNER_WIDGETS.find((pw) => pw.id === id);
        if (def?.alwaysVisible) return w;
        return { ...w, visible: !w.visible };
      }
      return w;
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(getDefaultLayout());
  }, []);

  const getWidgetMeta = useCallback((id) => PLANNER_WIDGETS.find((w) => w.id === id), []);

  return (
    <PlannerContext.Provider value={{
      widgets,
      visibleWidgets,
      isWidgetVisible,
      toggleWidget,
      resetLayout,
      getWidgetMeta,
      allWidgets: PLANNER_WIDGETS,
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
};
