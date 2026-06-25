import { useState, useEffect, useCallback } from 'react';
import { adminNotificationService } from '../../services/adminApi';

const CATEGORIES = [
  { value: 'study', label: 'Study', color: 'bg-blue-500' },
  { value: 'mock_tests', label: 'Mock Tests', color: 'bg-purple-500' },
  { value: 'notes', label: 'Notes', color: 'bg-green-500' },
  { value: 'motivation', label: 'Motivation', color: 'bg-yellow-500' },
  { value: 'announcement', label: 'Announcement', color: 'bg-cyan-500' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-500' },
  { value: 'achievement', label: 'Achievement', color: 'bg-emerald-500' },
];

const AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'new_users', label: 'New Users (7 days)' },
  { value: 'active_users', label: 'Active Users' },
  { value: 'inactive_users', label: 'Inactive Users (30 days)' },
  { value: 'premium_users', label: 'Premium Users' },
  { value: 'free_users', label: 'Free Users' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-text3' },
  { value: 'normal', label: 'Normal', color: 'text-blue-400' },
  { value: 'high', label: 'High', color: 'text-yellow-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-text3/20 text-text3' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'sent', label: 'Sent', color: 'bg-green-500/20 text-green-400' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500/20 text-red-400' },
];

function StatCard({ label, value, icon, color = 'text-primary' }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text3 uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'text-primary' ? 'bg-primary/10' : 'bg-primary/10'}`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function CreateNotificationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', message: '', category: 'announcement', priority: 'normal',
    targetAudience: 'all', actionButtonText: '', actionUrl: '',
    status: 'draft', scheduledAt: '', recurrence: 'none',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        recurrence: { type: form.recurrence },
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
      };
      if (!form.actionButtonText) delete payload.actionButtonText;
      if (!form.actionUrl) delete payload.actionUrl;
      if (!form.scheduledAt) delete payload.scheduledAt;
      if (form.recurrence === 'none') payload.recurrence = { type: 'none' };

      await adminNotificationService.create(payload);
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-text">Create Notification</h2>
          <button onClick={onClose} className="text-text3 hover:text-text p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text3 mb-1">Title *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} required maxLength={200}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text3 mb-1">Message *</label>
            <textarea value={form.message} onChange={e => update('message', e.target.value)} required rows={3} maxLength={2000}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Priority</label>
              <select value={form.priority} onChange={e => update('priority', e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text3 mb-1">Target Audience</label>
            <select value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Action Button Text</label>
              <input value={form.actionButtonText} onChange={e => update('actionButtonText', e.target.value)} placeholder="e.g. View Details"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Action URL</label>
              <input value={form.actionUrl} onChange={e => update('actionUrl', e.target.value)} placeholder="e.g. /mock-tests"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Scheduling</label>
              <select value={form.scheduledAt ? 'schedule' : form.recurrence === 'none' ? 'now' : 'recur'}
                onChange={e => {
                  if (e.target.value === 'now') { update('scheduledAt', ''); update('recurrence', 'none'); }
                  else if (e.target.value === 'schedule') { update('recurrence', 'none'); }
                  else { update('scheduledAt', ''); }
                }}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="now">Send Now</option>
                <option value="schedule">Schedule Later</option>
                <option value="recur">Recurring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text3 mb-1">Status</label>
              <select value={form.status} onChange={e => update('status', e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
          {form.scheduledAt === '' && form.recurrence === 'none' ? null : (
            <div className="grid grid-cols-2 gap-4">
              {form.recurrence !== 'none' && (
                <div>
                  <label className="block text-xs font-medium text-text3 mb-1">Recurrence</label>
                  <select value={form.recurrence} onChange={e => update('recurrence', e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
              {form.recurrence === 'none' && (
                <div>
                  <label className="block text-xs font-medium text-text3 mb-1">Schedule Date & Time</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => update('scheduledAt', e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text3 hover:text-text rounded-lg border border-border">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendConfirmModal({ notification, onClose, onSend }) {
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    setSending(true);
    try { await adminNotificationService.send(notification._id); onSend(); }
    catch (e) { console.error(e); }
    finally { setSending(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text mb-2">Send Notification?</h3>
        <p className="text-sm text-text3 mb-4">This will send "{notification.title}" to {notification.targetAudience === 'all' ? 'all users' : notification.targetAudience.replace(/_/g, ' ')}. This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text3 hover:text-text rounded-lg border border-border">Cancel</button>
          <button onClick={handleSend} disabled={sending}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotificationCenterPage() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ status: '', category: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sendTarget, setSendTarget] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('week');
  const [tab, setTab] = useState('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      if (filter.search) params.search = filter.search;

      const [statsRes, listRes] = await Promise.all([
        adminNotificationService.getStats(),
        adminNotificationService.list(params),
      ]);
      setStats(statsRes.data.data);
      setNotifications(listRes.data.data);
      setTotalPages(listRes.data.pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await adminNotificationService.getAnalytics(analyticsPeriod);
      setAnalytics(res.data.data);
    } catch (e) { console.error(e); }
  }, [analyticsPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === 'analytics') fetchAnalytics(); }, [tab, fetchAnalytics]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try { await adminNotificationService.delete(id); fetchData(); } catch (e) { console.error(e); }
  };

  const handleSendComplete = () => { setSendTarget(null); fetchData(); };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">Notification Center</h1>
          <p className="text-sm text-text3 mt-0.5">Create, schedule, and track push notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'list' ? 'bg-primary/10 text-primary' : 'text-text3 hover:text-text border border-border'}`}>
            Notifications
          </button>
          <button onClick={() => setTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'analytics' ? 'bg-primary/10 text-primary' : 'text-text3 hover:text-text border border-border'}`}>
            Analytics
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
            + Create
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Sent" value={stats.totalSent} icon="📤" />
          <StatCard label="Today" value={stats.todayNotifications} icon="📅" />
          <StatCard label="Scheduled" value={stats.scheduledNotifications} icon="⏰" />
          <StatCard label="Delivery Rate" value={stats.deliveryRate} icon="✅" color="text-green-400" />
          <StatCard label="Open Rate" value={stats.openRate} icon="👁" color="text-blue-400" />
          <StatCard label="Click Rate" value={stats.clickRate} icon="🖱" color="text-yellow-400" />
        </div>
      )}

      {tab === 'analytics' ? (
        <AnalyticsView analytics={analytics} period={analyticsPeriod} setPeriod={setAnalyticsPeriod} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <input value={filter.search} onChange={e => { setFilter(f => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder="Search notifications..."
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 w-56" />
            <select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filter.category} onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setPage(1); }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <span className="text-xs text-text3 ml-auto">{notifications.length} results</span>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-surface border border-border rounded-xl p-4 h-24 animate-pulse" />)}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState onCreate={() => setShowCreate(true)} />
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <NotificationRow key={n._id} notification={n} onSend={setSendTarget} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs text-text3 hover:text-text border border-border rounded-lg disabled:opacity-30">Prev</button>
              <span className="px-3 py-1 text-xs text-text3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs text-text3 hover:text-text border border-border rounded-lg disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateNotificationModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchData(); }} />}
      {sendTarget && <SendConfirmModal notification={sendTarget} onClose={() => setSendTarget(null)} onSend={handleSendComplete} />}
    </div>
  );
}

function NotificationRow({ notification: n, onSend, onDelete }) {
  const cat = CATEGORIES.find(c => c.value === n.category);
  const statusStyle = STATUSES.find(s => s.value === n.status);
  const priorityStyle = PRIORITIES.find(p => p.value === n.priority);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cat?.color || 'bg-text3'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text truncate">{n.title}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusStyle?.color || ''}`}>{n.status}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-bg-3 ${priorityStyle?.color || ''}`}>{n.priority}</span>
            <span className="text-[10px] text-text3">{cat?.label}</span>
          </div>
          <p className="text-xs text-text3 mt-1 line-clamp-2">{n.message}</p>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-text3">
            <span>Audience: {n.targetAudience?.replace(/_/g, ' ')}</span>
            {n.analytics?.sent > 0 && <span>Sent: {n.analytics.sent}</span>}
            {n.analytics?.opened > 0 && <span>Opened: {n.analytics.opened}</span>}
            <span>{new Date(n.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {n.status === 'draft' && (
            <button onClick={() => onSend(n)} className="text-xs px-2 py-1 text-green-400 hover:bg-green-500/10 rounded-lg" title="Send">Send</button>
          )}
          <button onClick={() => onDelete(n._id)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">Del</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-10 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-sm font-semibold text-text mb-2">No Notifications Yet</h2>
      <p className="text-sm text-text3 max-w-sm mx-auto mb-5">Create your first notification to engage users with study reminders, announcements, and updates.</p>
      <button onClick={onCreate} className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
        Create Notification
      </button>
    </div>
  );
}

function AnalyticsView({ analytics, period, setPeriod }) {
  if (!analytics) return <div className="bg-surface border border-border rounded-xl p-8 text-center text-text3 animate-pulse">Loading analytics...</div>;

  const { totals, byCategory, byDay } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['day', 'week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${period === p ? 'bg-primary/10 text-primary' : 'text-text3 hover:text-text border border-border'}`}>
            {p === 'day' ? 'Day View' : p === 'week' ? 'Week View' : 'Month View'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Sent', value: totals.sent, color: 'text-blue-400' },
          { label: 'Delivered', value: totals.delivered, color: 'text-green-400' },
          { label: 'Opened', value: totals.opened, color: 'text-yellow-400' },
          { label: 'Clicked', value: totals.clicked, color: 'text-purple-400' },
          { label: 'Dismissed', value: totals.dismissed, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text3 uppercase">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* By Category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(byCategory).map(([cat, data]) => {
              const catInfo = CATEGORIES.find(c => c.value === cat);
              const maxSent = Math.max(...Object.values(byCategory).map(d => d.sent), 1);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-text3 w-24 truncate">{catInfo?.label || cat}</span>
                  <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${catInfo?.color || 'bg-primary'}`} style={{ width: `${(data.sent / maxSent) * 100}%` }} />
                  </div>
                  <span className="text-xs text-text3 w-16 text-right">{data.sent} sent</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Trend */}
      {Object.keys(byDay).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Daily Trend</h3>
          <div className="flex items-end gap-1 h-32">
            {Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, data]) => {
              const maxVal = Math.max(...Object.values(byDay).map(d => d.sent), 1);
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${data.sent} sent`}>
                  <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(data.sent / maxVal) * 100}%`, minHeight: 2 }} />
                  <span className="text-[8px] text-text3 -rotate-45 origin-left">{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(byCategory).length === 0 && Object.keys(byDay).length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text3">No analytics data for this period yet.</div>
      )}
    </div>
  );
}
