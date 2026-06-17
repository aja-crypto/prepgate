import { useState } from 'react';
import { Link } from 'react-router-dom';
import NeuralBackground from '../components/common/NeuralBackground';

const SUBJECT_MOCKS = [
  { code: 'APT', name: 'General Aptitude', icon: '🧮', color: '#6366F1', total: 20, done: 8, best: 88, avg: 72 },
  { code: 'EM', name: 'Engineering Mathematics', icon: '📐', color: '#8B5CF6', total: 18, done: 5, best: 76, avg: 64 },
  { code: 'DS', name: 'Data Structures', icon: '📚', color: '#06B6D4', total: 22, done: 12, best: 92, avg: 78 },
  { code: 'AL', name: 'Algorithms', icon: '⚡', color: '#10B981', total: 20, done: 7, best: 85, avg: 69 },
  { code: 'DB', name: 'DBMS', icon: '🗄️', color: '#F59E0B', total: 18, done: 10, best: 90, avg: 74 },
  { code: 'OS', name: 'Operating Systems', icon: '🖥️', color: '#F43F5E', total: 20, done: 4, best: 71, avg: 55 },
  { code: 'CN', name: 'Computer Networks', icon: '🌐', color: '#22D3EE', total: 18, done: 6, best: 80, avg: 61 },
  { code: 'CO', name: 'COA', icon: '🔧', color: '#F97316', total: 16, done: 3, best: 65, avg: 52 },
  { code: 'TOC', name: 'Theory of Computation', icon: '🔤', color: '#A78BFA', total: 16, done: 2, best: 60, avg: 45 },
  { code: 'CD', name: 'Compiler Design', icon: '⚙️', color: '#34D399', total: 14, done: 1, best: 55, avg: 55 },
  { code: 'DL', name: 'Digital Logic', icon: '🔲', color: '#FB923C', total: 14, done: 5, best: 82, avg: 68 },
];

export default function SubjectMocksPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? SUBJECT_MOCKS : SUBJECT_MOCKS.filter(s => {
    if (filter === 'done') return s.done > 0;
    if (filter === 'pending') return s.done === 0;
    if (filter === 'strong') return s.avg >= 70;
    if (filter === 'weak') return s.avg < 60 && s.avg > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] relative">
      <NeuralBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}>
            🧪 Subject-wise Mock Tests
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Mocks', value: SUBJECT_MOCKS.reduce((s, m) => s + m.total, 0), color: '#6366F1' },
            { label: 'Completed', value: SUBJECT_MOCKS.reduce((s, m) => s + m.done, 0), color: '#10B981' },
            { label: 'Best Score', value: `${Math.max(...SUBJECT_MOCKS.map(m => m.best))}%`, color: '#F59E0B' },
            { label: 'Overall Avg', value: `${Math.round(SUBJECT_MOCKS.reduce((s, m) => s + m.avg, 0) / SUBJECT_MOCKS.filter(m => m.avg > 0).length)}%`, color: '#06B6D4' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
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

        {/* Subject Mock Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => {
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <div key={s.code} className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${s.color}15` }}>{s.icon}</div>
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

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                    <span>{s.done}/{s.total} done</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-gray-500">
                    Best: <span className="font-semibold" style={{ color: s.color }}>{s.best}%</span>
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
      </div>
    </div>
  );
}
