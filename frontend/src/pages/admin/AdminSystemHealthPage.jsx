import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminSystemHealthPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = () => {
    setLoading(true);
    setError(null);
    adminApi.get('/admin/stats').then(res => {
      setStats(res.data.data);
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load system health');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div><div className="h-6 w-32 bg-bg-3 rounded animate-pulse mb-1" /><div className="h-4 w-48 bg-bg-3 rounded animate-pulse" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse"><div className="h-4 w-20 bg-bg-3 rounded mb-4" /><div className="space-y-2"><div className="h-3 w-full bg-bg-3 rounded" /><div className="h-3 w-2/3 bg-bg-3 rounded" /></div></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div><h1 className="text-lg font-bold text-text">System Health</h1><p className="text-sm text-text3 mt-0.5">Monitor server status, database, and storage</p></div>
        <div className="bg-surface border border-red-500/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
          </div>
          <h2 className="text-base font-bold text-text mb-2">Failed to Load System Health</h2>
          <p className="text-sm text-text3 mb-4">{error}</p>
          <button onClick={fetchStats} className="text-xs px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  const s = stats?.system || {};

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">System Health</h1>
        <p className="text-sm text-text3 mt-0.5">Monitor server status, database, and storage</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-xl p-5 border ${s.databaseConnected ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${s.databaseConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm font-semibold text-text">Database</span>
          </div>
          <div className="text-xs text-text3 space-y-1">
            <div className="flex justify-between"><span>Status</span><span className={s.databaseConnected ? 'text-green-400' : 'text-red-400'}>{s.databaseConnected ? 'Connected' : 'Disconnected'}</span></div>
            {s.databaseName && <div className="flex justify-between"><span>Database</span><span className="text-text2">{s.databaseName}</span></div>}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${s.apiStatus === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-sm font-semibold text-text">API Server</span>
          </div>
          <div className="text-xs text-text3 space-y-1">
            <div className="flex justify-between"><span>Status</span><span className="text-green-400">{s.apiStatus === 'healthy' ? 'Healthy' : 'Degraded'}</span></div>
            <div className="flex justify-between"><span>Uptime</span><span className="text-text2">Running</span></div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-sm font-semibold text-text">Storage</span>
          </div>
          <div className="text-xs text-text3 space-y-1">
            <div className="flex justify-between"><span>Usage</span><span className="text-text2">{s.storageUsage || '0 MB'}</span></div>
            <div className="flex justify-between"><span>Provider</span><span className="text-text2">Local</span></div>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
        Real-time monitoring with alerts, logs, and performance graphs coming soon.
      </div>
    </div>
  );
}