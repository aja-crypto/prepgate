import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/stats').then(res => {
      setStats(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.users ?? '—', color: '#8B5CF6' },
    { label: 'Subjects', value: stats?.subjects ?? '—', color: '#3B82F6' },
    { label: 'Topics', value: stats?.topics ?? '—', color: '#10B981' },
    { label: 'Notes', value: stats?.notes ?? '—', color: '#F59E0B' },
    { label: 'Mock Tests', value: stats?.tests ?? '—', color: '#EC4899' },
    { label: 'PYQs', value: stats?.pyqs ?? '—', color: '#14B8A6' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">Analytics</h1>
        <p className="text-sm text-text3 mt-0.5">Platform-wide statistics and insights</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 w-20 bg-bg-3 rounded mb-3" />
              <div className="h-8 w-16 bg-bg-3 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="text-sm text-text3 mb-1">{card.label}</div>
              <div className="text-3xl font-bold font-mono" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
        Detailed analytics charts and export features coming soon. Connect MongoDB for live data.
      </div>
    </div>
  );
}