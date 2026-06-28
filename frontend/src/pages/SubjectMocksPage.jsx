import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockTestService } from '../services/api';
import NeuralBackground from '../components/common/NeuralBackground';

export default function SubjectMocksPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    mockTestService.getSubjectCounts()
      .then((res) => { if (!cancelled) setSubjects(res.data.data || []); })
      .catch((err) => { if (!cancelled) setError('Failed to load subject data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = filter === 'all' ? subjects : subjects.filter(s => {
    if (filter === 'done') return s.done > 0;
    if (filter === 'pending') return s.done === 0;
    if (filter === 'strong') return s.avg >= 70;
    if (filter === 'weak') return s.avg < 60 && s.avg > 0;
    return true;
  });

  const totals = subjects.reduce((acc, s) => ({
    total: acc.total + (s.total || 0),
    done: acc.done + (s.done || 0),
    best: Math.max(acc.best, s.best || 0),
    avgTotal: acc.avgTotal + (s.avg || 0),
    avgCount: acc.avgCount + (s.avg > 0 ? 1 : 0),
  }), { total: 0, done: 0, best: 0, avgTotal: 0, avgCount: 0 });

  return (
    <div className="min-h-screen bg-bg text-text relative">
      <NeuralBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-text3 hover:text-text2 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}>
            Subject-wise Mock Tests
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Mocks', value: totals.total, color: '#6366F1' },
            { label: 'Completed', value: totals.done, color: '#10B981' },
            { label: 'Best Score', value: totals.best > 0 ? `${totals.best}%` : '—', color: '#F59E0B' },
            { label: 'Overall Avg', value: totals.avgCount > 0 ? `${Math.round(totals.avgTotal / totals.avgCount)}%` : '—', color: '#06B6D4' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Subjects' },
            { key: 'done', label: 'Attempted' },
            { key: 'pending', label: 'Not Attempted' },
            { key: 'strong', label: 'Strong (≥70%)' },
            { key: 'weak', label: 'Weak (<60%)' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filter === f.key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === f.key ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: filter === f.key ? '#A78BFA' : '#9CA3AF',
              }}
            >{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[10px] text-gray-400">Loading subject data...</div>
          </div>
        ) : error ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.12)' }}>
            <p className="text-xs text-gray-400 mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-gray-400">No subject data available for this filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => {
              const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <div key={s.code || s.name} className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${s.color}15` }}>{s.icon || '📋'}</div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{s.name}</h3>
                        <span className="text-[9px]" style={{ color: s.color }}>{s.code}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: s.avg >= 70 ? '#10B981' : s.avg > 0 ? '#F59E0B' : '#6B7280' }}>
                        {s.avg > 0 ? `${s.avg}%` : '—'}
                      </div>
                      <div className="text-[8px] text-gray-500">avg</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                      <span>{s.done}/{s.total} done</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color || '#6366F1'}, ${(s.color || '#6366F1')}88)` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-gray-500">
                      Best: <span className="font-semibold" style={{ color: s.color }}>{s.best > 0 ? `${s.best}%` : '—'}</span>
                    </div>
                    <Link to={`/mock-tests?subject=${s.code}`}
                      className="text-[9px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={{ background: `${s.color}12`, border: `1px solid ${s.color}2`, color: s.color }}
                    >
                      Start Test →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
