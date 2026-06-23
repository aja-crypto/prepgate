import { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../services/adminApi';
import GlassCard from '../../components/ui/GlassCard';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const ENGAGEMENT_COLORS = {
  'Power User': { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  'High': { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  'Medium': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Low': { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

function StatCard({ icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}20` }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
        <div className="text-xs text-text3">{label}</div>
        {sub && <div className="text-[10px] text-text3 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = 'bg-primary' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden w-20">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const GATE_TARGETS = ['GATE 2025', 'GATE 2026', 'GATE 2027', 'GATE DA', 'GATE CSE', 'Other'];

function isTestUser(user) {
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();
  return email.includes('@test.com') || name.includes('gate test') || name === 'gate test';
}

function getTargetLabel(user) {
  return user.gateTarget || user.targetExam || 'GATE 2027';
}

function getEngagementDetails(user) {
  const hours = user.studyHours || 0;
  const streak = user.streakCurrent || 0;
  const logins = user.totalLogins || 0;
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
  const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  
  if (hours > 100 && streak > 30 && daysSinceLogin <= 1) return 'Power User';
  if (hours > 50 && streak > 14 && daysSinceLogin <= 3) return 'High';
  if (hours > 10 && streak > 3 && daysSinceLogin <= 7) return 'Medium';
  return 'Low';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, newThisWeek: 0, avgStudyHours: 0, powerUsers: 0, activeToday: 0, studyingNow: 0 });
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearch(val), 300);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.get('/admin/users', { params });
      let allUsers = res.data.data || [];

      // Filter out test users
      const realUsers = allUsers.filter(u => !isTestUser(u));

      setUsers(realUsers);
      setTotal(res.data.count || 0);
      setTotalPages(res.data.pages || 1);

      // Compute summary from real users
      const activeUsers = realUsers.filter(u => !u.deletedAt && u.isActive !== false);
      const activeToday = realUsers.filter(u => {
        const last = u.lastLogin ? new Date(u.lastLogin) : null;
        if (!last) return false;
        const today = new Date();
        return last.getDate() === today.getDate() && last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear();
      }).length;
      const studyingNow = realUsers.filter(u => {
        const last = u.lastLogin ? new Date(u.lastLogin) : null;
        if (!last) return false;
        return (Date.now() - new Date(u.lastLogin).getTime()) < 5 * 60 * 1000;
      }).length;
      const avgHours = realUsers.length > 0
        ? Math.round(realUsers.reduce((s, u) => s + (u.studyHours || 0), 0) / realUsers.length)
        : 0;
      const powerUsers = realUsers.filter(u => u.engagement === 'Power User').length;
      setSummary(prev => ({
        ...prev,
        active: realUsers.filter(u => !u.deletedAt && u.isActive !== false).length,
        avgStudyHours: Math.round(realUsers.reduce((s, u) => s + (u.studyHours || 0), 0) / Math.max(1, realUsers.length)),
        powerUsers: realUsers.filter(u => u.engagement === 'Power User').length,
        activeToday,
        studyingNow,
      }));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load total from stats
  useEffect(() => {
    adminApi.get('/admin/stats').then(r => {
      if (r.data?.data?.users) {
        setSummary(prev => ({
          ...prev,
          total: r.data.data.users.total || 0,
          newThisWeek: r.data.data.users.newThisWeek || 0,
        }));
      }
    }).catch(e => console.warn('AdminUsersPage fetch failed', e?.message));
  }, []);

  const handleStatusToggle = async (user) => {
    try {
      await adminApi.put(`/admin/users/${user._id || user.id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'suspended' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await adminApi.put(`/admin/users/${user._id || user.id}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleTargetChange = async (user, newTarget) => {
    try {
      await adminApi.put(`/admin/users/${user._id || user.id}/target`, { gateTarget: newTarget });
      toast.success('Target updated');
      fetchUsers();
    } catch { toast.error('Failed to update target'); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.name}"? This is a soft delete.`)) return;
    try {
      await adminApi.delete(`/admin/users/${user._id || user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text">User Management</h1>
          <p className="text-sm text-text3">Analytics & engagement overview</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon="👥" label="Total Users" value={summary.total} sub="Real users only" color="var(--color-primary)" />
        <StatCard icon="🟢" label="Active Users" value={summary.active} sub="Enrolled & active" color="#34D399" />
        <StatCard icon="📅" label="New This Week" value={summary.newThisWeek} sub="Last 7 days" color="#FBBF24" />
        <StatCard icon="🎯" label="Active Today" value={summary.activeToday} sub="Logged in today" color="#60A5FA" />
        <StatCard icon="📚" label="Studying Now" value={summary.studyingNow} sub="Active <5 min ago" color="#FBBF24" />
        <StatCard icon="🏆" label="Power Users" value={summary.powerUsers} sub="High engagement" color="#F87171" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => { handleSearchChange(e); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/40"
        >
          <option value="">All users</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* User Table */}
      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text3 bg-bg-2">
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Last Active</th>
                <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Logins</th>
                <th className="text-center px-4 py-3 font-semibold">Study Hours</th>
                <th className="text-center px-4 py-3 font-semibold hidden sm:table-cell">Streak</th>
                <th className="text-center px-4 py-3 font-semibold">Engagement</th>
                <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Target</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-text3 text-sm">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-text3 text-sm">No users found</td></tr>
              ) : users.map((user) => {
                const eng = user.engagement || 'Low';
                const engStyle = ENGAGEMENT_COLORS[eng] || ENGAGEMENT_COLORS['Low'];
                return (
                  <tr key={user._id || user.id} className="border-b border-border/50 hover:bg-bg-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                          {(user.name || '?').charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-text truncate max-w-[160px]">{user.name || 'Unknown'}</div>
                          <div className="text-[10px] text-text3 truncate max-w-[160px]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text2 hidden md:table-cell">
                      {user.lastLogin || '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="font-mono text-sm text-text2">{user.totalLogins || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ProgressBar value={user.studyHours || 0} max={100} color="bg-gradient-to-r from-primary to-secondary" />
                        <span className="font-mono text-xs text-text2 w-10 text-right">{user.studyHours || 0}h</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="font-mono text-sm text-text2">
                        {user.streakCurrent || 0}
                        <span className="text-[10px] text-text3 ml-0.5">🔥</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${engStyle.dot}`} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${engStyle.bg} ${engStyle.text} font-medium`}>
                          {eng}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <select
                        value={getTargetLabel(user)}
                        onChange={(e) => handleTargetChange(user, e.target.value)}
                        className="text-[10px] px-2 py-1 rounded bg-bg-3 border border-border text-text focus:outline-none focus:border-primary/40"
                      >
                        {GATE_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.deletedAt ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400">Deleted</span>
                      ) : user.isActive === false ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Suspended</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStatusToggle(user)}
                          disabled={!!user.deletedAt}
                          className="p-1.5 rounded-lg hover:bg-bg-3 text-text3 hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={user.isActive === false ? 'Activate' : 'Suspend'}
                        >
                          <Icon name={user.isActive === false ? 'unlock' : 'lock'} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={!!user.deletedAt}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-text3 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Icon name="trash-2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-text3 hover:text-text disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-text3 px-3">
            Page {page} of {totalPages} · {total} users
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-text3 hover:text-text disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}