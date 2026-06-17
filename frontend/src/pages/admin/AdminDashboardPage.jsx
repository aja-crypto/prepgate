import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import adminApi from '../../services/adminApi';

function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" style={{ color }}>
            <path d={icon} />
          </svg>
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="h-6 w-16 bg-bg-3 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-bg-3 rounded animate-pulse" />
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-text font-mono">{value}</div>
              <div className="text-[11px] text-text3 truncate">{label}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatSection({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-primary" />
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

const ICONS = {
  users: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
  active: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V5z',
  newUser: 'M8 16a6 6 0 1112 0H8zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM1 7a1 1 0 011-1h1a1 1 0 010 2H2a1 1 0 01-1-1z',
  calendar: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z',
  clipboard: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h.5A1.5 1.5 0 008 4.5h4A1.5 1.5 0 0013.5 3H14a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z',
  chart: 'M2 10a8 8 0 1116 0 8 8 0 01-16 0zm10-2.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-5zM6 10a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-1A.5.5 0 016 13v-3zm3-4.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v7.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V5.5z',
  cpu: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v10h10V5H5z',
  file: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z',
  book: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804z',
  db: 'M4 7v6a2 2 0 002 2h8a2 2 0 002-2V7M4 7a2 2 0 012-2h8a2 2 0 012 2M4 7a2 2 0 012 2h8a2 2 0 002-2',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 bg-bg-3 rounded animate-pulse mb-1" />
            <div className="h-4 w-32 bg-bg-3 rounded animate-pulse" />
          </div>
        </div>
        {[1,2,3,4,5].map(s => (
          <div key={s}>
            <div className="h-4 w-24 bg-bg-3 rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1,2,3,4].map(c => (
                <div key={c} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-3 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 w-12 bg-bg-3 rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-bg-3 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">Dashboard</h1>
            <p className="text-sm text-text3 mt-0.5">Welcome back, {admin?.name || 'Admin'}</p>
          </div>
        </div>
        <div className="bg-surface border border-red-500/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-text mb-2">Database Disconnected</h2>
          <p className="text-sm text-text3 max-w-md mx-auto leading-relaxed mb-4">
            Connect MongoDB to view live analytics including user growth, mock test performance, AI usage, and PDF metrics.
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] text-text3">Status: Database Not Connected</span>
          </div>
          <button onClick={fetchStats} className="text-xs px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const dbConnected = stats?.system?.databaseConnected;

  if (!dbConnected) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">Dashboard</h1>
            <p className="text-sm text-text3 mt-0.5">Welcome back, {admin?.name || 'Admin'}</p>
          </div>
        </div>
        <div className="bg-surface border border-red-500/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
              <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-text mb-2">Live Analytics Not Available</h2>
          <p className="text-sm text-text3 max-w-md mx-auto leading-relaxed mb-4">
            Connect MongoDB to view:<br />
            • User Growth<br />
            • Mock Test Analytics<br />
            • AI Usage Statistics<br />
            • PDF Metrics
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] text-text3">Status: Database Not Connected</span>
          </div>
          <button onClick={fetchStats} className="text-xs px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const u = stats.users || {};
  const m = stats.mockTests || {};
  const p = stats.pdfs || {};
  const s = stats.system || {};
  const a = stats.aiMentor || {};

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">Dashboard</h1>
          <p className="text-sm text-text3 mt-0.5">Welcome back, {admin?.name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-text3 bg-bg-2 border border-border rounded-lg px-3 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${s.databaseConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            {s.databaseConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-[11px] text-text3 bg-bg-2 border border-border rounded-lg px-3 py-1.5 capitalize">
            {admin?.role?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Users Section */}
      <StatSection title="Users">
        <StatCard label="Total Users" value={u.total?.toLocaleString() || '—'} icon={ICONS.users} color="#8B5CF6" />
        <StatCard label="Active Today" value={u.activeToday?.toLocaleString() || '—'} icon={ICONS.active} color="#10B981" />
        <StatCard label="New This Week" value={u.newThisWeek?.toLocaleString() || '—'} icon={ICONS.newUser} color="#3B82F6" />
        <StatCard label="New This Month" value={u.newThisMonth?.toLocaleString() || '—'} icon={ICONS.calendar} color="#F59E0B" />
      </StatSection>

      {/* Content Section */}
      <StatSection title="Content">
        <StatCard label="Subjects" value={stats.subjects?.toLocaleString() || '—'} icon={ICONS.book} color="#8B5CF6" />
        <StatCard label="Topics" value={stats.topics?.toLocaleString() || '—'} icon={ICONS.book} color="#14B8A6" />
        <StatCard label="Mock Tests" value={stats.tests?.toLocaleString() || '—'} icon={ICONS.clipboard} color="#EC4899" />
        <StatCard label="PYQs" value={stats.pyqs?.toLocaleString() || '—'} icon={ICONS.file} color="#F59E0B" />
      </StatSection>

      {/* PDFs Section */}
      <StatSection title="PDFs">
        <StatCard label="Total PDFs" value={p.total?.toLocaleString() || '—'} icon={ICONS.file} color="#14B8A6" />
        {p.published !== undefined && <StatCard label="Published" value={p.published?.toLocaleString() || '—'} icon={ICONS.check} color="#10B981" />}
        {p.drafts !== undefined && <StatCard label="Drafts" value={p.drafts?.toLocaleString() || '—'} icon={ICONS.file} color="#F59E0B" />}
      </StatSection>

      {/* System Section */}
      <StatSection title="System">
        <StatCard label="Database" value={s.databaseConnected ? 'Connected' : 'Disconnected'} icon={ICONS.db} color={s.databaseConnected ? '#10B981' : '#EF4444'} />
        <StatCard label="API Status" value={s.apiStatus || '—'} icon={s.apiStatus === 'healthy' ? ICONS.check : ICONS.warning} color={s.apiStatus === 'healthy' ? '#10B981' : '#F59E0B'} />
        <StatCard label="Storage" value={s.storageUsage || '—'} icon={ICONS.db} color="#8B5CF6" />
      </StatSection>

      <div className="text-center pt-2 pb-4">
        <p className="text-[10px] text-text3">
          Auto-refreshes every 60s &middot; Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}