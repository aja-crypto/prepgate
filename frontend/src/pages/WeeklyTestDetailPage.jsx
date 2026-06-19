import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { weeklyTestService } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
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

const DIFF_BADGE = {
  easy: 'bg-green-500/10 border-green-500/20 text-green-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  hard: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function WeeklyTestDetailPage() {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [progress, setProgress] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [scoreInput, setScoreInput] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewerPdfUrl, setViewerPdfUrl] = useState(null);

  const meta = SUBJECT_META[subjectCode] || { icon: '📝', color: 'var(--color-primary)', name: subjectCode };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      weeklyTestService.getAll({ subject: subjectCode }).then(r => setTests(r.data.data)).catch(silentCatch('Load weekly tests by subject')),
      weeklyTestService.getProgress().then(r => setProgress(r.data.data || [])).catch(silentCatch('Load weekly test progress')),
    ]).finally(() => setLoading(false));
  }, [subjectCode]);

  const progressByTest = useMemo(() => {
    const map = {};
    progress.forEach(p => {
      const testId = p.test?._id || p.test;
      map[testId] = p;
    });
    return map;
  }, [progress]);

  const filtered = useMemo(() => {
    let list = tests;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s));
    }
    if (statusFilter === 'Completed') list = list.filter(t => progressByTest[t._id]?.isCompleted);
    if (statusFilter === 'Pending') list = list.filter(t => !progressByTest[t._id]?.isCompleted);
    return list;
  }, [tests, search, statusFilter, progressByTest]);

  const completed = tests.filter(t => progressByTest[t._id]?.isCompleted).length;
  const totalMarksEarned = tests.reduce((sum, t) => {
    const p = progressByTest[t._id];
    return sum + (p?.score || 0);
  }, 0);
  const totalPossibleMarks = tests.reduce((sum, t) => sum + (t.totalMarks || 0), 0);
  const avgAccuracy = completed ? Math.round(totalMarksEarned / totalPossibleMarks * 100) : 0;

  const handleComplete = async (testId) => {
    const score = parseInt(scoreInput[testId], 10);
    if (isNaN(score) || score < 0) {
      toast.error('Enter a valid score');
      return;
    }
    setSubmitting(prev => ({ ...prev, [testId]: true }));
    try {
      const test = tests.find(t => t._id === testId);
      const res = await weeklyTestService.complete(testId, {
        score,
        totalMarks: test?.totalMarks || 25,
      });
      toast.success('Test marked as completed!');
      const updated = res.data.data;
      setProgress(prev => {
        const existing = prev.findIndex(p => (p.test?._id || p.test) === testId);
        if (existing >= 0) {
          const copy = [...prev];
          copy[existing] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      setScoreInput(prev => ({ ...prev, [testId]: '' }));
    } catch {
      toast.error('Failed to save progress');
    } finally {
      setSubmitting(prev => ({ ...prev, [testId]: false }));
    }
  };

  if (loading) {
    return <PageLoading title="Loading Tests" />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/weekly-tests')}
        className="inline-flex items-center gap-1.5 text-xs text-text3 hover:text-text mb-4 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Back to Weekly Tests
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: `${meta.color}15`, color: meta.color }}
        >
          {meta.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">{meta.name}</h1>
          <p className="text-sm text-text3 mt-0.5">{tests.length} Weekly Test{tests.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Tests', value: tests.length, color: 'text-primary' },
          { label: 'Attempted', value: completed, color: 'text-secondary' },
          { label: 'Remaining', value: tests.length - completed, color: 'text-amber-400' },
          { label: 'Avg Score', value: avgAccuracy ? `${avgAccuracy}%` : '--', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text3">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search tests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Completed'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all ${statusFilter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(test => {
          const p = progressByTest[test._id];
          const isDone = p?.isCompleted;
          const key = test._id;

          return (
            <div
              key={key}
              className={`bg-surface border rounded-xl p-4 transition-all ${isDone ? 'border-green-500/20' : 'border-border hover:border-white/10'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-text3">Test {test.testNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${DIFF_BADGE[test.difficulty] || DIFF_BADGE.medium}`}>{test.difficulty}</span>
                    {isDone && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">✓ Completed</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-text">{test.title}</h3>
                  <p className="text-[11px] text-text3 mt-0.5 line-clamp-1">{test.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text3">
                    <span>{test.questionCount} questions</span>
                    <span>{test.duration} min</span>
                    <span>{test.totalMarks} marks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {test.pdfUrl && (
                    <button
                      onClick={() => setViewerPdfUrl(test.pdfUrl)}
                      className="text-xs px-3 py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all"
                    >
                      View PDF
                    </button>
                  )}
                  {!isDone ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={test.totalMarks}
                        placeholder="Score"
                        value={scoreInput[key] ?? ''}
                        onChange={e => setScoreInput(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-16 bg-bg-2 border border-border rounded-lg px-2 py-2 text-xs text-text text-center focus:outline-none focus:border-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleComplete(key)}
                        disabled={submitting[key]}
                        className="text-xs px-3 py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                      >
                        {submitting[key] ? 'Saving...' : 'Mark Completed'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-green-400">{p.score}/{test.totalMarks}</div>
                      <div className="text-[10px] text-text3">{p.accuracy}% accuracy</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-text3 text-sm">No tests found</div>
        )}
      </div>

      {viewerPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setViewerPdfUrl(null)}>
          <div className="max-w-4xl max-h-[90vh] w-full bg-surface rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-text">Test Paper</div>
              <button onClick={() => setViewerPdfUrl(null)} className="text-text3 hover:text-text p-1">&times;</button>
            </div>
            <div className="p-2">
              <iframe src={viewerPdfUrl} className="w-full h-[75vh] rounded" title="Test Paper" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
