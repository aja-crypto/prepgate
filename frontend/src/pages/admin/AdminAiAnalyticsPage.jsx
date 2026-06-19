import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminAiAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = () => {
    setLoading(true);
    setError(null);
    adminApi.get('/admin/stats').then(res => {
      setStats(res.data.data);
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load AI analytics');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const a = stats?.aiMentor || {};

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="h-6 w-36 bg-bg-3 rounded animate-pulse mb-1" />
        <div className="h-4 w-56 bg-bg-3 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 w-20 bg-bg-3 rounded mb-3" />
              <div className="h-8 w-16 bg-bg-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div><h1 className="text-lg font-bold text-text">AI Analytics</h1><p className="text-sm text-text3 mt-0.5">Track AI mentor usage, requests, and performance</p></div>
        <div className="bg-surface border border-red-500/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
          </div>
          <h2 className="text-base font-bold text-text mb-2">Failed to Load AI Analytics</h2>
          <p className="text-sm text-text3 mb-4">{error}</p>
          <button onClick={fetchStats} className="text-xs px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">AI Analytics</h1>
        <p className="text-sm text-text3 mt-0.5">Track AI mentor usage, requests, and performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text3 mb-1">Total Requests</div>
          <div className="text-2xl font-bold font-mono text-primary">{a.totalRequests?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text3 mb-1">Requests Today</div>
          <div className="text-2xl font-bold font-mono text-green-400">{a.requestsToday?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text3 mb-1">Failed Requests</div>
          <div className="text-2xl font-bold font-mono text-red-400">{a.failed?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text3 mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold font-mono text-amber-400">{a.avgResponseTime || 0}s</div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
        Detailed AI conversation logs, prompt analysis, and cost tracking coming soon. Connect MongoDB for live data.
      </div>
    </div>
  );
}