import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { weeklyTestService } from '../services/api';
import { PageLoading } from '../components/common/GateLoadingScreen';
import toast from 'react-hot-toast';

const SUBJECT_META = {
  AL: { icon: '⚡', color: '#ff6b6b', name: 'Algorithms' },
  DS: { icon: '🐍', color: '#ff9f43', name: 'Programming & Data Structures' },
  CD: { icon: '🔧', color: '#4cc9f0', name: 'Compiler Design' },
  CN: { icon: '🌐', color: '#ffd166', name: 'Computer Networks' },
  CO: { icon: '🖥', color: '#06d6a0', name: 'Computer Organization (COA)' },
  DB: { icon: '🗄', color: '#06b6d4', name: 'DBMS' },
  DL: { icon: '💻', color: '#7c5cfc', name: 'Digital Logic' },
  EM: { icon: '🔢', color: '#4f8dff', name: 'Engineering Mathematics' },
  APT: { icon: '🧮', color: '#43aa8b', name: 'General Aptitude' },
  OS: { icon: '⚙️', color: '#a855f7', name: 'Operating Systems' },
  TOC: { icon: '🤖', color: '#f72585', name: 'Theory of Computation' },
};

export default function WeeklyTestsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [progress, setProgress] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      weeklyTestService.getSubjectCounts().then(r => setSubjects(r.data.data)).catch(() => {}),
      weeklyTestService.getAll().then(r => setTests(r.data.data)).catch(() => {}),
      weeklyTestService.getProgress().then(r => setProgress(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const completedIds = useMemo(() => {
    const set = new Set();
    progress.forEach(p => { if (p.isCompleted) set.add(p.test?._id || p.test); });
    return set;
  }, [progress]);

  const filtered = useMemo(() => {
    if (!search) return subjects;
    const s = search.toLowerCase();
    return subjects.filter(sub =>
      sub.subjectName?.toLowerCase().includes(s) ||
      sub.subject?.toLowerCase().includes(s)
    );
  }, [subjects, search]);

  const totalTests = subjects.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalCompleted = completedIds.size;

  if (loading) {
    return <PageLoading title="Loading Weekly Tests" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Weekly Tests</h1>
        <p className="text-sm text-text3 mt-0.5">Subject-wise weekly practice tests for GATE 2027</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Subjects', value: subjects.length, color: 'text-primary' },
          { label: 'Total Tests', value: totalTests, color: 'text-secondary' },
          { label: 'Completed', value: totalCompleted, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative mb-5">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text3">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-bg-2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sub => {
          const meta = SUBJECT_META[sub.subject] || {};
          const subTests = tests.filter(t => t.subject === sub.subject);
          const completed = subTests.filter(t => completedIds.has(t._id)).length;
          const pct = subTests.length ? Math.round((completed / subTests.length) * 100) : 0;

          return (
            <button
              key={sub.subject}
              type="button"
              onClick={() => navigate(`/weekly-tests/${sub.subject}`)}
              className="bg-surface border border-border rounded-xl p-5 text-left hover:border-white/15 transition-all hover:-translate-y-0.5 active:scale-[0.98] group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${meta.color}15`, color: meta.color }}
                  >
                    {meta.icon || '📝'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">{sub.subjectName || sub.subject}</div>
                    <div className="text-xs text-text3 mt-0.5">{sub.count} Test{sub.count > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text3 group-hover:text-primary transition-colors">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-bg-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: meta.color || 'var(--color-primary)' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text3">{completed}/{subTests.length}</span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-text3 text-sm">No subjects found</div>
        )}
      </div>
    </div>
  );
}
