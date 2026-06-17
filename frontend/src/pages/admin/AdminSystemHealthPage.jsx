import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminSystemHealthPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/stats').then(res => {
      setStats(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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