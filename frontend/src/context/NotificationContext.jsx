import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.list({ limit: 20 });
      if (res?.data?.data?.notifications) {
        // Deduplicate by type + refId (entity) + date
        const seen = new Set();
        const deduped = res.data.data.notifications.filter(n => {
          const date = n.createdAt ? n.createdAt.slice(0, 10) : '';
          const key = `${n.type || ''}|${n.refId || n.entityId || ''}|${date}`;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setNotifications(deduped);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {}
  }, [user]);

  const fetchPrefs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getPrefs();
      setPrefs(res.data.data);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPrefs();
      pollingRef.current = setInterval(fetchNotifications, 60000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user, fetchNotifications, fetchPrefs]);

  const generateDaily = useCallback(async (context) => {
    try {
      await notificationService.generate('daily', context);
      await fetchNotifications();
    } catch {}
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    try {
      await notificationService.toggleBookmark(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isBookmarked: !n.isBookmarked } : n));
    } catch {}
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - (notifications.find(n => n._id === id)?.isRead ? 0 : 1)));
    } catch {}
  }, [notifications]);

  const clearAll = useCallback(async () => {
    const current = notifications || [];
    const unreadToClear = current.filter(n => !n.isRead).length;
    try {
      await Promise.allSettled(current.map(n => notificationService.delete(n._id)));
      setNotifications([]);
      setUnreadCount(prev => Math.max(0, prev - unreadToClear));
    } catch {}
  }, [notifications]);

  const updatePrefs = useCallback(async (data) => {
    try {
      const res = await notificationService.updatePrefs(data);
      setPrefs(res.data.data);
    } catch {}
  }, []);

  const val = useMemo(() => ({
    notifications: notifications || [],
    unreadCount: unreadCount || 0, prefs, loading,
    fetchNotifications, fetchPrefs, generateDaily,
    markRead, markAllRead, toggleBookmark, delete: deleteNotif, clearAll, updatePrefs,
  }), [notifications, unreadCount, prefs, loading, fetchNotifications, fetchPrefs, generateDaily,
    markRead, markAllRead, toggleBookmark, deleteNotif, clearAll, updatePrefs]);

  return (
    <NotificationContext.Provider value={val}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
