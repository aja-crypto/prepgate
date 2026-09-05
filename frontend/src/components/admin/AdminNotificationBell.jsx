import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminNotificationService } from '../../services/adminApi';

const TYPE_STYLES = {
  feedback_admin: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#A78BFA', icon: '🔔' },
  motivation: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', color: '#A78BFA', icon: '💡' },
  ranker_quote: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#FBBF24', icon: '🏆' },
  revision: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', color: '#22D3EE', icon: '📖' },
  pyq: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: '#34D399', icon: '📝' },
  countdown: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', color: '#F43F5E', icon: '⏰' },
  streak: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', color: '#FB923C', icon: '🔥' },
  reality_check: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#EF4444', icon: '⚠️' },
  ai_coach: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#818CF8', icon: '🤖' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function normalizeList(data) {
  if (!data) return [];
  const raw = Array.isArray(data) ? data : (data.notifications || data.items || data.data || []);
  return raw.map(n => ({
    id: n._id || n.id,
    type: n.type,
    title: n.title || n.subject,
    message: n.body || n.message || n.description,
    icon: n.icon || n.emoji,
    actionUrl: n.action?.path || n.actionUrl || n.link,
    actionLabel: n.action?.label,
    isRead: n.isRead !== undefined ? n.isRead : n.read !== undefined ? n.read : true,
    read: n.isRead !== undefined ? n.isRead : n.read !== undefined ? n.read : true,
    createdAt: n.createdAt || n.scheduledAt || n.date || Date.now(),
    metadata: n.metadata || {},
  }));
}

function resolveAction(n) {
  if (n.actionUrl) return n.actionUrl;
  const tid = n.metadata?.ticketId;
  if (tid) {
    const rid = n.metadata?.replyId;
    return rid ? `/admin/feedback?ticketId=${tid}&replyId=${rid}` : `/admin/feedback?ticketId=${tid}`;
  }
  return null;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        adminNotificationService.getPersonal(),
        adminNotificationService.getPersonalUnreadCount(),
      ]);
      const list = listRes?.data?.success !== undefined
        ? normalizeList(listRes.data.data || listRes.data.notifications || [])
        : normalizeList(listRes?.data || []);
      setNotifications(list);
      const count = countRes?.data?.success !== undefined
        ? Number(countRes.data.unread ?? countRes.data.count ?? 0)
        : Number(countRes?.data?.unread ?? countRes?.data?.count ?? 0);
      setUnread(Number.isFinite(count) ? count : 0);
    } catch (e) {
      if (e.code !== 'ERR_CANCELED' && e.code !== 'ECONNABORTED') {
        // silent for 401s — adminApi interceptor handles redirects
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const markRead = async (id) => {
    const prev = notifications;
    const prevUnread = unread;
    setNotifications(prevN => prevN.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
    try { await adminNotificationService.markPersonalRead(id); }
    catch (e) { setNotifications(prev); setUnread(prevUnread); }
  };

  const markAllRead = async () => {
    const prev = notifications;
    const prevUnread = unread;
    setNotifications(prevN => prevN.map(n => ({ ...n, isRead: true, read: true })));
    setUnread(0);
    try { await adminNotificationService.markPersonalAllRead(); }
    catch (e) { setNotifications(prev); setUnread(prevUnread); }
  };

  const deleteNote = async (id) => {
    const prev = notifications;
    const prevUnread = unread;
    const wasUnread = notifications.find(n => n.id === id)?.isRead === false || notifications.find(n => n.id === id)?.read === false;
    setNotifications(prevN => prevN.filter(n => n.id !== id));
    if (wasUnread) setUnread(u => Math.max(0, u - 1));
    try { await adminNotificationService.deletePersonal(id); }
    catch (e) { setNotifications(prev); setUnread(prevUnread); }
  };

  const handleItemClick = (n) => {
    if (!n.read || !n.isRead) markRead(n.id);
    const url = resolveAction(n);
    if (url) {
      setOpen(false);
      setTimeout(() => { window.location.href = url; }, 50);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        aria-label={`Admin notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className="relative p-2.5 rounded-xl transition-all hover:bg-white/5"
        title="Admin Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-text3">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center font-bold text-white"
            style={{ minWidth: '16px', height: '16px', padding: '0 4px', background: '#F43F5E', fontSize: '8px', lineHeight: 1 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-4 top-[72px] max-h-[480px] rounded-2xl overflow-hidden z-50 shadow-2xl border border-white/[0.08] backdrop-blur-2xl"
            style={{ background: 'rgba(15,17,25,0.95)', width: 'min(360px, calc(100vw - 32px))' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Admin Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors min-h-[32px]"
                    style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={fetchNotifications} className="text-text3 hover:text-text transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center" title="Refresh">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[380px]">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-3" />
                  <p className="text-xs text-text3">Loading…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <div className="text-3xl mb-3">🔔</div>
                  <p className="text-xs text-text3">No notifications yet. New feedback and replies will appear here.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.motivation;
                  const isUnread = n.read === false || n.isRead === false;
                  const url = resolveAction(n);
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 transition-colors hover:bg-white/[0.02] ${isUnread ? 'border-l-2' : ''}`}
                      style={{ borderLeftColor: isUnread ? style.color : 'transparent', cursor: url ? 'pointer' : 'default' }}
                      onClick={() => handleItemClick(n)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base mt-0.5 flex-shrink-0">{n.icon || style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white truncate">{n.title}</span>
                            <span className="text-[10px] text-text3 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-[11px] text-text3 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                              {(n.type || 'notification').replace(/_/g, ' ')}
                            </span>
                            {url && (
                              <Link to={url} className="text-[10px] font-medium" style={{ color: style.color }} onClick={(e) => e.stopPropagation()}>
                                {n.actionLabel || 'Open →'}
                              </Link>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                              className="text-[10px] text-text3 hover:text-text ml-auto transition-colors p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
