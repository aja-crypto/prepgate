import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCheck, X, Trash2, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Portal from '../ui/Portal';
/* ── Type → category visual mapping ─────────────────────── */
const TYPE_TO_CATEGORY = {
  morning_mission: 'study',
  motivation: 'streak',
  success_story: 'achievement',
  roadmap: 'goal',
  recommendation: 'ai',
  dsa_challenge: 'study',
  revision: 'study',
  focus_reminder: 'reminder',
  daily_content: 'study',
  weekly_report: 'goal',
  did_you_know: 'goal',
  quick_fact: 'goal',
  productivity_tip: 'goal',
  campus_insight: 'achievement',
  success_spotlight: 'achievement',
  learning_hub: 'study',
  discovery: 'goal',
  smart_reminder: 'reminder',
  daily_inspiration: 'streak',
  login_day: 'streak',
  milestone: 'achievement',
};

const CATEGORY_META = {
  study: {
    icon: '📚', label: 'Study',
    chip: 'from-emerald-400/20 to-teal-500/20', text: 'text-emerald-300',
    ring: 'border-emerald-400/25', glow: 'shadow-emerald-500/10',
    accent: 'from-emerald-400 to-teal-500',
  },
  goal: {
    icon: '🎯', label: 'Goal',
    chip: 'from-violet-400/20 to-indigo-500/20', text: 'text-violet-300',
    ring: 'border-violet-400/25', glow: 'shadow-violet-500/10',
    accent: 'from-violet-400 to-indigo-500',
  },
  streak: {
    icon: '🔥', label: 'Streak',
    chip: 'from-orange-400/20 to-rose-500/20', text: 'text-orange-300',
    ring: 'border-orange-400/25', glow: 'shadow-orange-500/10',
    accent: 'from-orange-400 to-rose-500',
  },
  ai: {
    icon: '🤖', label: 'AI',
    chip: 'from-cyan-400/20 to-sky-500/20', text: 'text-cyan-300',
    ring: 'border-cyan-400/25', glow: 'shadow-cyan-500/10',
    accent: 'from-cyan-400 to-sky-500',
  },
  achievement: {
    icon: '🏆', label: 'Achievement',
    chip: 'from-yellow-400/20 to-amber-500/20', text: 'text-yellow-300',
    ring: 'border-yellow-400/25', glow: 'shadow-yellow-500/10',
    accent: 'from-yellow-400 to-amber-500',
  },
  reminder: {
    icon: '⚠️', label: 'Reminder',
    chip: 'from-red-400/20 to-pink-500/20', text: 'text-red-300',
    ring: 'border-red-400/25', glow: 'shadow-red-500/10',
    accent: 'from-red-400 to-pink-500',
  },
};

function categoryFor(n) {
  return CATEGORY_META[TYPE_TO_CATEGORY[n.type] || 'goal'] || CATEGORY_META.goal;
}

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* Group a date into Today / Yesterday / Earlier */
function groupFor(dateStr) {
  if (!dateStr) return 'Earlier';
  const now = new Date();
  const date = new Date(dateStr);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startToday.getDate() - 1);
  if (date >= startToday) return 'Today';
  if (date >= startYesterday) return 'Yesterday';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'];

function groupNotifications(list) {
  const groups = {};
  for (const n of list) {
    const g = groupFor(n.scheduledAt || n.createdAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  }
  return GROUP_ORDER.filter(g => groups[g] && groups[g].length > 0).map(g => ({ label: g, items: groups[g] }));
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [dotRing, setDotRing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const { notifications = [], unreadCount = 0, markRead, markAllRead, delete: deleteNotif, clearAll } = useNotifications();
  const nav = useNavigate();
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const prevUnread = useRef(unreadCount);
  const reduceMotion = useReducedMotion();
  const bellGradId = useId();

  const displayNotifications = notifications.slice(0, 15);
  const grouped = groupNotifications(displayNotifications);

  /* Track new notifications → trigger one-shot shake + dot pulse */
  useEffect(() => {
    const prev = prevUnread.current;
    prevUnread.current = unreadCount;
    if (unreadCount > prev) {
      if (reduceMotion) return;
      setShake(true);
      setDotRing(true);
      const t = setTimeout(() => { setShake(false); setDotRing(false); }, 1700);
      return () => clearTimeout(t);
    }
  }, [unreadCount, reduceMotion]);

  /* Responsive breakpoint */
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isInsidePanel = useCallback((el) => {
    if (!el) return false;
    if (btnRef.current && btnRef.current.contains(el)) return true;
    if (panelRef.current && panelRef.current.contains(el)) return true;
    return false;
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (!isInsidePanel(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [open, isInsidePanel]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const toggle = () => setOpen(prev => !prev);

  const handleClick = (n) => {
    if (!n.isRead) markRead(n._id);
    if (n.action?.path) nav(n.action.path);
    setOpen(false);
  };

  const handleDelete = (n, e) => {
    e.stopPropagation();
    if (deletingId === n._id) return;
    setDeletingId(n._id);
    setTimeout(() => {
      deleteNotif(n._id);
      setDeletingId(null);
    }, 280);
  };

  const handleMouseEnter = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  const panelStyle = isMobile
    ? { left: 0, right: 0, bottom: 0 }
    : (() => {
        const r = btnRef.current?.getBoundingClientRect();
        return {
          top: (r?.bottom || 0) + 10,
          right: window.innerWidth - (r?.right || window.innerWidth),
        };
      })();

  const panelEnter = reduceMotion
    ? { opacity: 1, scale: 1 }
    : { opacity: 1, scale: 1, filter: 'blur(0px)' };

  const handleClearAll = () => {
    clearAll();
  };

  return (
    <div className="relative">
      {/* ── Premium Bell Button ─────────────────────────── */}
      <button
        ref={btnRef}
        onClick={toggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={open}
        className={`group relative w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer select-none
          bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent
          border border-white/[0.10]
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.25)]
          backdrop-blur-xl
          transition-[transform,box-shadow,background-color,border-color] duration-[220ms] ease-out
          hover:scale-[1.08] hover:from-purple-500/[0.14] hover:via-white/[0.06] hover:border-purple-400/30
          hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_22px_rgba(139,92,246,0.35),0_8px_28px_rgba(0,0,0,0.35)]
          active:scale-[0.96]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
          ${shake ? 'notif-shake' : ''}`}
      >
        {/* Glass highlight sweep */}
        <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-80" />
        {/* Soft purple→cyan halo */}
        <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 blur-[10px] bg-gradient-to-br from-purple-500/40 via-transparent to-cyan-400/40 transition-opacity duration-[220ms] group-hover:opacity-100" />

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={`url(#${bellGradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative w-[18px] h-[18px] drop-shadow-[0_0_6px_rgba(139,92,246,0.45)] transition-transform duration-[220ms] group-hover:scale-105"
        >
          <defs>
            <linearGradient id={bellGradId} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* ── Unread Badge (gradient red, spring on change) ── */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={reduceMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 18, mass: 0.5 }}
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                bg-gradient-to-br from-red-500 to-rose-600
                text-[10px] font-bold text-white
                flex items-center justify-center
                border border-white/25
                shadow-[0_2px_8px_rgba(244,63,94,0.5)]
                ${dotRing ? 'notif-dot-ring' : ''}`}
              aria-live="polite"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <Portal>
            <div
              ref={panelRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="fixed z-[10000]"
              style={panelStyle}
            >
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                animate={panelEnter}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
                className={`overflow-hidden
                  bg-white/[0.03] backdrop-blur-2xl
                  border border-white/10
                  shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]
                  ${isMobile
                    ? 'w-full h-[80vh] rounded-t-3xl border-b-0'
                    : 'w-[380px] max-h-[70vh] rounded-2xl'
                  }`}
              >
                {/* Gradient hairline */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

                {/* Mobile drag handle */}
                {isMobile && (
                  <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/15" />
                  </div>
                )}

                {/* ── Fixed Header ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                      <Bell size={14} className="text-purple-300" />
                    </span>
                    Notifications
                    {unreadCount > 0 && (
                      <motion.span
                        key={unreadCount}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[10px] font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 px-2 py-0.5 rounded-full shadow-sm shadow-red-500/30"
                      >
                        {unreadCount} new
                      </motion.span>
                    )}
                  </h3>
                  <div className="flex items-center gap-0.5">
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        title="Clear all notifications"
                        aria-label="Clear all notifications"
                        className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-red-300 transition-colors duration-150 flex items-center gap-1.5 text-[11px] font-medium"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Clear all</span>
                      </button>
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        title="Mark all as read"
                        aria-label="Mark all as read"
                        className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-emerald-300 transition-colors duration-150 flex items-center gap-1.5 text-[11px] font-medium"
                      >
                        <CheckCheck size={15} />
                        <span className="hidden sm:inline">Mark all</span>
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      title="Close notifications"
                      aria-label="Close notifications"
                      className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors duration-150"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* ── Scrollable List (grouped) ── */}
                <div className="overflow-y-auto flex-1 overscroll-contain" style={{ maxHeight: 'min(70vh - 96px, 520px)' }}>
                  {displayNotifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="flex flex-col items-center justify-center py-14 px-6 text-center"
                    >
                      <div className="relative w-20 h-20 mb-5 notif-empty-float">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/25 to-cyan-500/25 blur-2xl" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10 flex items-center justify-center">
                          <Bell size={28} className="text-purple-300/80" />
                          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-white/85">You're all caught up</p>
                      <p className="text-xs text-white/40 mt-1">New notifications will appear here</p>
                    </motion.div>
                  ) : (
                    grouped.map(group => (
                      <div key={group.label}>
                        {/* Section header */}
                        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{group.label}</span>
                          <span className="text-[9px] font-medium text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">{group.items.length}</span>
                          <span className="flex-1 h-px bg-gradient-to-r from-white/[0.07] to-transparent" />
                        </div>

                        {group.items.map((n) => {
                          const cat = categoryFor(n);
                          const isDeleting = deletingId === n._id;
                          return (
                            <motion.div
                              key={n._id}
                              layout={!isDeleting}
                              initial={{ opacity: 0, y: 8 }}
                              animate={
                                isDeleting
                                  ? { opacity: 0, x: 32, height: 0, paddingTop: 0, paddingBottom: 0 }
                                  : { opacity: 1, y: 0 }
                              }
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              onClick={() => handleClick(n)}
                              className={`group relative cursor-pointer overflow-hidden
                                border-b border-white/[0.04] last:border-0
                                ${isDeleting ? 'pointer-events-none' : ''}`}
                            >
                              {/* Hover glow wash */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-white/[0.03] to-transparent pointer-events-none" />
                              {/* Left accent line */}
                              <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b ${cat.accent} transition-opacity duration-200 ${n.isRead ? 'opacity-0' : 'opacity-80'}`} />

                              <div className="flex gap-3.5 px-4 py-3 relative">
                                {/* Icon chip */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg
                                  bg-gradient-to-br ${cat.chip}
                                  border ${cat.ring} shadow-sm ${cat.glow}`}
                                >
                                  {cat.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-[13px] font-semibold leading-tight truncate transition-colors duration-200
                                      ${n.isRead ? 'text-white/60' : 'text-white'}`}
                                    >
                                      {n.title}
                                    </p>
                                    {/* Unread dot (fades out on read) */}
                                    <AnimatePresence>
                                      {!n.isRead && (
                                        <motion.span
                                          initial={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.3 }}
                                          transition={{ duration: 0.3, ease: 'easeOut' }}
                                          className="w-2 h-2 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 shrink-0 shadow-sm shadow-rose-500/40"
                                        />
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  <p className={`text-[12px] leading-relaxed line-clamp-2 mt-0.5 whitespace-pre-line transition-colors duration-200 ${n.isRead ? 'text-white/30' : 'text-white/45'}`}>
                                    {n.body}
                                  </p>
                                  <div className="flex items-center gap-2.5 mt-1.5">
                                    <span className={`text-[10px] font-medium ${n.isRead ? 'text-white/25' : 'text-white/35'}`}>
                                      {getRelativeTime(n.scheduledAt || n.createdAt)}
                                    </span>
                                    {n.action?.label && (
                                      <span className="text-[10px] font-semibold text-purple-300/80 group-hover:text-purple-300 transition-colors">
                                        {n.action.label} →
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Delete (on hover) */}
                                <button
                                  onClick={(e) => handleDelete(n, e)}
                                  title="Delete notification"
                                  aria-label={`Delete notification: ${n.title}`}
                                  className="flex-shrink-0 self-start p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* ── Footer ── */}
                {notifications.length > 8 && (
                  <div className="border-t border-white/[0.06] px-4 py-2.5 shrink-0">
                    <button
                      onClick={() => { nav('/notifications'); setOpen(false); }}
                      className="w-full text-center text-[11px] font-semibold text-white/50 hover:text-white py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-150"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
