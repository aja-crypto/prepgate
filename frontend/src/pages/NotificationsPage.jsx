import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Bookmark, BookmarkX, Trash2, ArrowLeft, Filter, Settings, Sparkles } from 'lucide-react';
import { useNotificationData, useNotificationActions } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TYPE_EMOJIS = {
  morning_mission: '🌅', motivation: '🔥', success_story: '🎓',
  roadmap: '🗺️', recommendation: '🧠', dsa_challenge: '💻',
  revision: '🔁', focus_reminder: '⏰', daily_content: '📘',
  weekly_report: '📊', did_you_know: '💡', quick_fact: '🎯',
  productivity_tip: '🚀', campus_insight: '🏛️', success_spotlight: '🏆',
  learning_hub: '🎥', discovery: '🔍', smart_reminder: '🔔',
  daily_inspiration: '💡', login_day: '🎉', milestone: '⭐',
};

const TYPE_LABELS = {
  morning_mission: 'Morning Mission', motivation: 'Motivation', success_story: 'Success Story',
  roadmap: 'Roadmap', recommendation: 'AI Recommendation', dsa_challenge: 'DSA Challenge',
  revision: 'Revision', focus_reminder: 'Focus Reminder', daily_content: 'Daily Content',
  weekly_report: 'Weekly Report', did_you_know: 'Did You Know', quick_fact: 'Quick Fact',
  productivity_tip: 'Productivity Tip', campus_insight: 'Campus Insight',
  learning_hub: 'Learning Hub', discovery: 'Discovery', smart_reminder: 'Smart Reminder',
  daily_inspiration: 'Daily Inspiration', login_day: 'Login Day', milestone: 'Milestone',
};

const TYPE_GRADIENTS = {
  morning_mission: 'from-amber-500/15 to-orange-500/5',
  motivation: 'from-red-500/15 to-rose-500/5',
  success_story: 'from-purple-500/15 to-violet-500/5',
  roadmap: 'from-emerald-500/15 to-teal-500/5',
  recommendation: 'from-blue-500/15 to-indigo-500/5',
  dsa_challenge: 'from-cyan-500/15 to-sky-500/5',
  revision: 'from-yellow-500/15 to-amber-500/5',
  focus_reminder: 'from-orange-500/15 to-red-500/5',
  did_you_know: 'from-pink-500/15 to-fuchsia-500/5',
  quick_fact: 'from-green-500/15 to-emerald-500/5',
  productivity_tip: 'from-sky-500/15 to-blue-500/5',
  campus_insight: 'from-violet-500/15 to-purple-500/5',
  weekly_report: 'from-indigo-500/15 to-blue-500/5',
  learning_hub: 'from-pink-500/15 to-rose-500/5',
  discovery: 'from-teal-500/15 to-cyan-500/5',
  smart_reminder: 'from-amber-500/15 to-yellow-500/5',
  daily_inspiration: 'from-fuchsia-500/15 to-purple-500/5',
  login_day: 'from-violet-500/15 to-indigo-500/5',
  milestone: 'from-yellow-500/15 to-amber-500/5',
};

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🔔' },
  { key: 'unread', label: 'Unread', emoji: '🆕' },
  { key: 'bookmarked', label: 'Bookmarked', emoji: '🔖' },
  { key: 'learning', label: 'Learning', emoji: '🎥' },
  { key: 'ai', label: 'AI Mentor', emoji: '🧠' },
  { key: 'reminders', label: 'Reminders', emoji: '⏰' },
  { key: 'discover', label: 'Discover', emoji: '🔍' },
  { key: 'achievements', label: 'Achievements', emoji: '⭐' },
];

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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function matchesCategory(n, cat) {
  if (cat === 'all') return true;
  if (cat === 'unread') return !n.isRead;
  if (cat === 'bookmarked') return n.isBookmarked;
  if (cat === 'learning') return ['learning_hub', 'motivation', 'campus_insight', 'success_story'].includes(n.type);
  if (cat === 'ai') return ['recommendation', 'roadmap', 'dsa_challenge', 'daily_inspiration'].includes(n.type);
  if (cat === 'reminders') return ['smart_reminder', 'focus_reminder', 'revision', 'morning_mission'].includes(n.type);
  if (cat === 'discover') return ['discovery', 'did_you_know', 'quick_fact', 'productivity_tip', 'weekly_report'].includes(n.type);
  if (cat === 'achievements') return ['milestone', 'login_day'].includes(n.type);
  return true;
}

export default function NotificationsPage() {
  const { notifications = [], prefs } = useNotificationData();
  const { fetchNotifications, markRead, markAllRead, toggleBookmark, delete: deleteNotif, updatePrefs } = useNotificationActions();
  const nav = useNavigate();
  const [filter, setFilter] = useState('all');
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const filtered = useMemo(() => {
    return notifications.filter(n => matchesCategory(n, filter));
  }, [notifications, filter]);

  const categoryCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    bookmarked: notifications.filter(n => n.isBookmarked).length,
    learning: notifications.filter(n => matchesCategory(n, 'learning')).length,
    ai: notifications.filter(n => matchesCategory(n, 'ai')).length,
    reminders: notifications.filter(n => matchesCategory(n, 'reminders')).length,
    discover: notifications.filter(n => matchesCategory(n, 'discover')).length,
    achievements: notifications.filter(n => matchesCategory(n, 'achievements')).length,
  }), [notifications]);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-white/5 text-text2 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Bell size={20} className="text-purple-400" />
                </div>
                Notifications
              </h1>
              <p className="text-sm text-text2/70 mt-1">Personalized insights from your AI mentor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPrefs(!showPrefs)} className={`p-2 rounded-xl transition-all ${showPrefs ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-text2 hover:text-white'}`}>
              <Settings size={18} />
            </button>
            <button onClick={markAllRead} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text2 hover:text-white transition-all text-xs font-medium flex items-center gap-2">
              <CheckCheck size={14} /> Mark All Read
            </button>
          </div>
        </div>

        {/* Preferences panel */}
        <AnimatePresence>
          {showPrefs && prefs && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-4">Notification Preferences</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(prefs.categories || {}).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-white/5">
                      <span className="text-lg">{TYPE_EMOJIS[key] || '🔔'}</span>
                      <span className="text-xs text-text2 flex-1">{TYPE_LABELS[key] || key}</span>
                      <button
                        onClick={() => updatePrefs({ categories: { ...prefs.categories, [key]: !val } })}
                        className={`w-9 h-5 rounded-full transition-all relative ${val ? 'bg-purple-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-text2">
                    <span>Max per day:</span>
                    <select
                      value={prefs.maxPerDay}
                      onChange={(e) => updatePrefs({ maxPerDay: parseInt(e.target.value) })}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text2">
                    <input
                      type="checkbox"
                      checked={prefs.enabled}
                      onChange={(e) => updatePrefs({ enabled: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    Enable notifications
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                filter === cat.key
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-white/5 text-text2 hover:text-white border-transparent hover:border-white/10'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              {categoryCounts[cat.key] > 0 && (
                <span className="opacity-50">({categoryCounts[cat.key]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Bell size={32} className="text-white/10" />
              </div>
              <p className="text-sm text-text2">No {filter !== 'all' ? CATEGORIES.find(c => c.key === filter)?.label.toLowerCase() : ''} notifications</p>
              <p className="text-xs text-text2/50 mt-1">Check back later for personalized updates</p>
            </div>
          ) : (
            filtered.map((n, i) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`group relative rounded-2xl border transition-all cursor-pointer hover:bg-white/[0.02] overflow-hidden ${
                  n.isRead ? 'border-white/5' : 'border-white/10'
                }`}
                onClick={() => { if (!n.isRead) markRead(n._id); if (n.action?.path) nav(n.action.path); }}
              >
                {/* Gradient background for unread */}
                {!n.isRead && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${TYPE_GRADIENTS[n.type] || 'from-purple-500/5 to-transparent'} opacity-50`} />
                )}

                {/* Left accent bar for unread */}
                {!n.isRead && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${TYPE_GRADIENTS[n.type]?.replace('/15', '').replace('/5', '') || 'from-purple-500 to-pink-500'}`} />
                )}

                <div className="relative flex gap-4 p-5">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                    n.isRead ? 'bg-white/5 border-white/5' : 'bg-white/5 border-white/10'
                  }`}>
                    {n.emoji || TYPE_EMOJIS[n.type] || '🔔'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-semibold ${n.isRead ? 'text-text2' : 'text-white'}`}>{n.title}</h3>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 shadow-sm shadow-purple-500/50" />}
                    </div>
                    <p className="text-xs text-text2/70 whitespace-pre-line leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-3 mt-3">
                      {n.action?.label && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] font-medium text-purple-400 hover:bg-purple-500/20 transition-all">
                          <Sparkles size={10} />
                          {n.action.label}
                        </div>
                      )}
                      <span className="text-[10px] text-text2/40">
                        {getRelativeTime(n.scheduledAt || n.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(n._id); }}
                      className={`p-2 rounded-lg transition-all ${n.isBookmarked ? 'text-yellow-400 bg-yellow-500/10' : 'text-text2 hover:text-white hover:bg-white/5'}`}
                    >
                      {n.isBookmarked ? <BookmarkX size={14} /> : <Bookmark size={14} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                      className="p-2 rounded-lg text-text2 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
