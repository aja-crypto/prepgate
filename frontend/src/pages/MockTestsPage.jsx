import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTestService } from '../services/api';
import toast from 'react-hot-toast';

const SUBJECT_CODES = {
  APT: { name: 'General Aptitude', color: '#43aa8b' },
  EM: { name: 'Engineering Mathematics', color: '#4f8dff' },
  DS: { name: 'Programming & Data Structures', color: '#ff9f43' },
  AL: { name: 'Algorithms', color: '#ef476f' },
  DB: { name: 'DBMS', color: '#06d6a0' },
  OS: { name: 'Operating Systems', color: '#a855f7' },
  CN: { name: 'Computer Networks', color: '#ffd166' },
  CO: { name: 'Computer Organization', color: '#e5989b' },
  TOC: { name: 'Theory of Computation', color: '#f4845f' },
  CD: { name: 'Compiler Design', color: '#7b2cbf' },
  DL: { name: 'Digital Logic', color: '#3a86ff' },
};

const DIFF_BADGE = {
  easy: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  medium: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  hard: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const TYPE_BADGE = {
  'subject-wise': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'topic-wise': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'full-length': 'bg-rose-500/10 border-rose-500/20 text-rose-400',
};

const FILTER_TABS = ['All', 'Subject-wise', 'Topic-wise', 'Full-length'];

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
      <div className="h-3.5 bg-bg-3 rounded w-3/4 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <div className="h-4 bg-bg-3 rounded w-14" />
        <div className="h-4 bg-bg-3 rounded w-16" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3 bg-bg-3 rounded w-1/2" />
        <div className="h-3 bg-bg-3 rounded w-1/3" />
      </div>
      <div className="flex gap-1.5 mb-4">
        <div className="h-4 bg-bg-3 rounded w-12" />
        <div className="h-4 bg-bg-3 rounded w-16" />
        <div className="h-4 bg-bg-3 rounded w-14" />
      </div>
      <div className="h-8 bg-bg-3 rounded-lg w-full" />
    </div>
  );
}

export default function MockTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [subjectCounts, setSubjectCounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mockTestService.getAll().then(r => setTests(r.data.data || [])).catch(() => toast.error('Failed to load mock tests')),
      mockTestService.getSubjectCounts().then(r => setSubjectCounts(r.data.data || [])).catch(() => {}),
      mockTestService.getAnalytics().then(r => setAnalytics(r.data.data || null)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filteredTests = useMemo(() => {
    if (activeFilter === 'All') return tests;
    const typeMap = { 'subject-wise': 'subject', 'topic-wise': 'topic', 'full-length': 'full' };
    const expected = typeMap[activeFilter.toLowerCase()]
    if (!expected) return [];
    return tests.filter(t => t.type === expected);
  }, [tests, activeFilter]);

  const groupedBySubject = useMemo(() => {
    const map = {};
    filteredTests.forEach(t => {
      const code = t.subject;
      if (!map[code]) map[code] = [];
      map[code].push(t);
    });

    const ordered = subjectCounts
      .map(s => s.subject)
      .filter(code => map[code]?.length);

    const remaining = Object.keys(map).filter(code => !ordered.includes(code)).sort();
    return [...ordered, ...remaining].filter(code => map[code]?.length).map(code => ({
      subjectCode: code,
      subjectMeta: SUBJECT_CODES[code] || { name: code, color: '#636b82' },
      tests: map[code],
    }));
  }, [filteredTests, subjectCounts]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-5 bg-bg-3 rounded w-32 mb-1.5 animate-pulse" />
          <div className="h-3.5 bg-bg-3 rounded w-96 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-bg-3 rounded w-12 mb-1 mx-auto" />
              <div className="h-3 bg-bg-3 rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-7 bg-bg-3 rounded-lg w-24 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1,2,3].map(s => (
            <div key={s}>
              <div className="h-4 bg-bg-3 rounded w-40 mb-3 animate-pulse" />
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3,4].map(c => <SkeletonCard key={c} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Mock Tests</h1>
        <p className="text-sm text-text3 mt-0.5">Test your preparation with subject-wise, topic-wise, and full-length mocks</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tests', value: analytics?.totalTests ?? tests.length, color: 'text-primary' },
          { label: 'Tests Completed', value: analytics?.completedTests ?? 0, color: 'text-secondary' },
          { label: 'Average Score', value: analytics?.averageScore != null ? `${analytics.averageScore}%` : '--', color: 'text-green-400' },
          { label: 'Best Score', value: analytics?.bestScore != null ? `${analytics.bestScore}%` : '--', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {FILTER_TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveFilter(t)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              activeFilter === t
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-bg-2 border-border text-text3 hover:border-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {groupedBySubject.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)', boxShadow: '0 0 25px rgba(168,85,247,0.08)' }}>
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-lg font-bold text-text mb-2">No Tests for This Filter</h3>
          <p className="text-sm text-text3 max-w-sm mb-6 leading-relaxed">Try a different subject or type, or check back later — new tests are added regularly.</p>
          <button onClick={() => { setFilterSubject('all'); setFilterType('all'); }} className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.25)' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedBySubject.map(({ subjectCode, subjectMeta, tests: subjectTests }) => (
            <div key={subjectCode}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: subjectMeta.color }}
                />
                <h2 className="text-sm font-semibold text-text">{subjectMeta.name}</h2>
                <span className="text-[10px] text-text3">({subjectTests.length} test{subjectTests.length > 1 ? 's' : ''})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {subjectTests.map(test => {
                  const attempted = test.isAttempted || test.score != null;
                  const topics = test.topics || [];
                  return (
                    <div
                      key={test._id}
                      className="bg-surface border border-border rounded-xl p-4 hover:border-white/15 transition-all hover:-translate-y-0.5"
                    >
                      <h3 className="text-sm font-semibold text-text mb-2 line-clamp-2">{test.title}</h3>

                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        {test.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${DIFF_BADGE[test.difficulty] || DIFF_BADGE.medium}`}>
                            {test.difficulty}
                          </span>
                        )}
                        {test.type && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${TYPE_BADGE[test.type] || TYPE_BADGE['subject-wise']}`}>
                            {test.type === 'full-length' ? 'Full' : test.type === 'subject-wise' ? 'Subject' : 'Topic'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-text3 mb-2.5">
                        <span>{test.questionCount} Qs</span>
                        <span>{test.duration} min</span>
                      </div>

                      {topics.length > 0 && (
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {topics.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-bg-2 border border-border text-text3">
                              {t}
                            </span>
                          ))}
                          {topics.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-2 border border-border text-text3">
                              +{topics.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {attempted ? (
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-[10px] text-text3">Your Score</span>
                          <span className="text-sm font-bold font-mono text-green-400">{test.score}/{test.totalMarks || test.questionCount}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/mock-tests/${test._id}`)}
                          className="w-full text-xs py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold"
                        >
                          Start Test
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
