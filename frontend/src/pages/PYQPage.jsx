// PYQ Practice — PDF subject browser + topic/subject/year-wise browse, practice, revision
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { pyqService } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import { computePyqStats, getMistakePatternSummary } from '../utils/gateUtils';
import QuestionPractice from '../components/pyq/QuestionPractice';
import PYQPdfViewer from '../components/pyq/PYQPdfViewer';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { SUBJECTS, PYQ_PDF_FILENAME } from '../config/pyqIndex';
import { BookOpen } from 'lucide-react';

const DIFF_STYLE = {
  easy: 'bg-green-500/10 border-green-500/20 text-green-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  hard: 'bg-red-500/10 border-red-500/20 text-red-400',
};
const STATUS_FILTERS = ['All', 'Solved', 'Unsolved', 'Revision Needed', 'Difficult'];
const MISTAKE_TYPES = ['Concept Mistake', 'Formula Mistake', 'Silly Mistake', 'Time Management', 'Guess'];

const HowItWorks = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left mb-4 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-400">🎯 How PYQ Practice Works</span>
          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>
      {expanded && (
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Choose Year</div>
            <p className="text-gray-400">Select from previous year GATE questions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Solve Questions</div>
            <p className="text-gray-400">Practice questions topic-wise or year-wise</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">View Explanations</div>
            <p className="text-gray-400">Check detailed solutions and explanations</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Track Accuracy</div>
            <p className="text-gray-400">Monitor your solving accuracy over time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Identify Weak Areas</div>
            <p className="text-gray-400">Find topics where you need more practice</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PYQPage() {
  const { pyqs, updatePyqs, refreshPyqs, mongoAvailable } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('subject') || 'All');
  const [topicFilter, setTopicFilter] = useState(searchParams.get('topic') || 'All');
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || 'All');
  const [diff, setDiff] = useState(searchParams.get('diff') || 'All');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [showStats, setShowStats] = useState(true);
  const [practiceId, setPracticeId] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [browse, setBrowse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewSolutionId, setViewSolutionId] = useState(null);
  const [solutionData, setSolutionData] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [pdfSubject, setPdfSubject] = useState(null); // { subject, startPage, endPage } or null

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'All') params.set('subject', filter);
    if (topicFilter !== 'All') params.set('topic', topicFilter);
    if (yearFilter !== 'All') params.set('year', yearFilter);
    if (diff !== 'All') params.set('diff', diff);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    setSearchParams(params, { replace: true });
  }, [filter, topicFilter, yearFilter, diff, statusFilter, setSearchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      refreshPyqs?.(),
      pyqService.getStats().then((r) => setGlobalStats(r.data.data)).catch(silentCatch('Load PYQ stats')),
      pyqService.getBrowse().then((r) => setBrowse(r.data.data)).catch(silentCatch('Load PYQ browse')),
    ]).finally(() => setLoading(false));
  }, [refreshPyqs]);

  const subjects = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.subject))], [pyqs]);
  const topics = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.topic).filter(Boolean))], [pyqs]);
  const years = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.year))].sort((a, b) => (b === 'All' ? 1 : a === 'All' ? -1 : b - a)), [pyqs]);
  const stats = useMemo(() => computePyqStats(pyqs), [pyqs]);
  const mistakeSummary = useMemo(() => getMistakePatternSummary(pyqs), [pyqs]);

  const filtered = pyqs.filter((q) => {
    if (filter !== 'All' && q.subject !== filter) return false;
    if (topicFilter !== 'All' && q.topic !== topicFilter) return false;
    if (yearFilter !== 'All' && q.year !== yearFilter) return false;
    if (diff !== 'All' && q.difficulty !== diff) return false;
    if (statusFilter === 'Solved' && !q.solved) return false;
    if (statusFilter === 'Unsolved' && q.solved) return false;
    if (statusFilter === 'Revision Needed' && !q.revisionNeeded) return false;
    if (statusFilter === 'Difficult' && !q.markedDifficult) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'year-desc') return b.year - a.year;
    if (sortBy === 'year-asc') return a.year - b.year;
    if (sortBy === 'difficulty') {
      const order = { easy: 0, medium: 1, hard: 2 };
      return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
    }
    if (sortBy === 'subject') return a.subject.localeCompare(b.subject);
    return 0;
  });

  const subjectStats = useMemo(() => {
    const stats = {};
    pyqs.forEach(q => {
      if (!stats[q.subject]) stats[q.subject] = { total: 0, solved: 0, revision: 0 };
      stats[q.subject].total++;
      if (q.solved) stats[q.subject].solved++;
      if (q.revisionNeeded) stats[q.subject].revision++;
    });
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [pyqs]);

  const toggle = useCallback(async (q, field) => {
    const next = !q[field];
    updatePyqs((d) => d.map((item) => (item.id === q.id ? { ...item, [field]: next } : item)));

    if (!q.mongoId || !mongoAvailable) return;

    try {
      if (field === 'revisionNeeded' || field === 'markedDifficult') {
        await pyqService.updateFlags(q.mongoId, { [field]: next });
      } else if (field === 'solved') {
        await pyqService.toggleSolved(q.mongoId, next);
      }
    } catch {
      toast.error('Sync failed — saved locally');
    }
  }, [updatePyqs, mongoAvailable]);

  const handleAttempt = () => {
    refreshPyqs?.();
    setPracticeId(null);
  };

  const viewSolution = async (q) => {
    if (!q.mongoId) return;
    setLoadingSolution(true);
    setViewSolutionId(q.mongoId);
    try {
      const res = await pyqService.getById(q.mongoId);
      setSolutionData(res.data.data);
    } catch {
      toast.error('Failed to load solution');
      setViewSolutionId(null);
    } finally {
      setLoadingSolution(false);
    }
  };

  const setMistakeType = async (q, mistakeType) => {
    updatePyqs((d) => d.map((item) => (
      item.id === q.id ? { ...item, mistakeType, revisionNeeded: true, markedDifficult: true } : item
    )));
    toast.success(`Tagged as ${mistakeType}`);
    if (q.mongoId && mongoAvailable) {
      try {
        await pyqService.updateFlags(q.mongoId, { mistakeType, revisionNeeded: true, markedDifficult: true });
      } catch {
        toast.error('Sync failed — saved locally');
      }
    }
  };

  // Subject color palette for PDF cards
  const subjectColors = [
    { bg: '#7C3AED', name: 'Engineering Mathematics' },
    { bg: '#EC4899', name: 'General Aptitude' },
    { bg: '#F59E0B', name: 'Digital Logic' },
    { bg: '#10B981', name: 'Computer Organization' },
    { bg: '#3B82F6', name: 'Programming' },
    { bg: '#8B5CF6', name: 'Data Structures' },
    { bg: '#EF4444', name: 'Algorithms' },
    { bg: '#06B6D4', name: 'Operating Systems' },
    { bg: '#22C55E', name: 'DBMS' },
    { bg: '#F97316', name: 'Computer Networks' },
    { bg: '#A855F7', name: 'Theory of Computation' },
    { bg: '#6B7280', name: 'Compiler Design' },
  ];

  // If PDF subject selected, show only the PDF viewer
  if (pdfSubject) {
    return (
      <div className="min-h-[80vh]">
        <PYQPdfViewer
          subject={pdfSubject.subject}
          pdfUrl={PYQ_PDF_FILENAME}
          startPage={pdfSubject.startPage}
          endPage={pdfSubject.endPage}
          onBack={() => setPdfSubject(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <HowItWorks />

      {/* PDF Subject Browser */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-primary" />
          <h2 className="text-base font-bold text-text">Browse PYQ PDF by Subject</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin snap-x">
          {SUBJECTS.map((sub, i) => {
            const color = subjectColors[i]?.bg || '#7C3AED';
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setPdfSubject({ subject: sub, startPage: sub.startPage, endPage: sub.endPage })}
                className="snap-start flex-shrink-0 w-40 bg-surface border border-border rounded-xl p-4 text-left hover:border-white/15 hover:-translate-y-0.5 transition-all group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white text-xs font-bold"
                  style={{ background: color }}
                >
                  {sub.short.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-xs font-semibold text-text mb-0.5 group-hover:text-primary transition-colors">{sub.short}</div>
                <div className="text-[10px] text-text3">{sub.endPage - sub.startPage + 1} pages</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">PYQ Practice</h1>
          <p className="text-sm text-text3 mt-0.5">
            {stats.solved}/{stats.total} solved · {stats.revisionNeeded} need revision
            {mongoAvailable ? ' · API synced' : ' · Local mode'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs bg-bg-2 border border-border text-text2 px-3 py-1.5 rounded-lg">
            <option value="default">Default Order</option>
            <option value="year-desc">Newest First</option>
            <option value="year-asc">Oldest First</option>
            <option value="difficulty">By Difficulty</option>
            <option value="subject">By Subject</option>
          </select>
          <button type="button" onClick={() => setShowStats(!showStats)} className="text-xs bg-bg-2 border border-border text-text2 px-3 py-1.5 rounded-lg hover:border-white/15">
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
      </div>

      {showStats && globalStats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Community Correct %', value: globalStats.correctPct, color: 'text-green-400' },
            { label: 'Community Incorrect %', value: globalStats.incorrectPct, color: 'text-red-400' },
            { label: 'Community Skip %', value: globalStats.skipPct, color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}%</div>
              <div className="text-[10px] text-text3 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {showStats && subjectStats.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-5">
          <div className="text-xs font-semibold text-text mb-3">Subject Progress</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {subjectStats.map(([subject, s]) => (
              <button key={subject} type="button" onClick={() => setFilter(filter === subject ? 'All' : subject)} className={`text-left p-2.5 rounded-lg border transition-all ${filter === subject ? 'bg-primary/10 border-primary/20' : 'bg-bg-2 border-border hover:border-white/10'}`}>
                <div className="text-[11px] font-medium text-text truncate">{subject.split(' ').slice(-1)[0]}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-bg-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${s.total ? (s.solved / s.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-text3">{s.solved}/{s.total}</span>
                </div>
                {s.revision > 0 && <div className="text-[8px] text-orange-400 mt-0.5">{s.revision} need revision</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {showStats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-xs font-semibold text-text mb-2">Topic-wise</div>
            {Object.entries(stats.byTopic).slice(0, 8).map(([topic, s]) => (
              <button key={topic} type="button" onClick={() => setTopicFilter(topic)} className="flex justify-between w-full text-[11px] text-text3 mb-1 hover:text-primary">
                <span className="truncate mr-2 text-left">{topic}</span>
                <span className="text-text2 font-mono">{s.solved}/{s.total}</span>
              </button>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-xs font-semibold text-text mb-2">Subject-wise</div>
            {Object.entries(stats.bySubject).map(([sub, s]) => (
              <button key={sub} type="button" onClick={() => setFilter(sub)} className="flex justify-between w-full text-[11px] text-text3 mb-1 hover:text-primary">
                <span className="truncate mr-2 text-left">{sub.split(' ').slice(-1)[0]}</span>
                <span className="text-text2 font-mono">{s.solved}/{s.total}</span>
              </button>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-xs font-semibold text-text mb-2">Year-wise</div>
            {Object.entries(stats.byYear).sort(([a], [b]) => b - a).map(([yr, s]) => (
              <button key={yr} type="button" onClick={() => setYearFilter(+yr)} className="flex justify-between w-full text-[11px] text-text3 mb-1 hover:text-primary">
                <span>GATE {yr}</span>
                <span className="text-text2 font-mono">{s.solved}/{s.total}</span>
              </button>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-xs font-semibold text-text mb-2">Difficulty</div>
            {Object.entries(stats.byDifficulty).map(([d, count]) => (
              <button key={d} type="button" onClick={() => setDiff(d)} className="flex justify-between w-full text-[11px] text-text3 mb-1 capitalize hover:text-primary">
                <span>{d}</span>
                <span className="text-text2 font-mono">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-text">Mistake Notebook</div>
            <div className="text-[11px] text-text3 mt-0.5">
              {mistakeSummary.total} tagged/weak PYQs · Dominant pattern: <span className="text-primary">{mistakeSummary.dominant}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(mistakeSummary.counts).slice(0, 5).map(([type, count]) => (
              <span key={type} className="text-[10px] px-2 py-1 rounded border bg-bg-2 border-border text-text3">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {browse && !pyqs.length && !loading && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-5 text-center">
          <p className="text-sm text-text2 mb-2">No PYQs loaded yet.</p>
          <p className="text-xs text-text3">
            {browse.total > 0
              ? `${browse.total} questions in database — refresh or check connection.`
              : 'Admin: import PYQs via Admin Panel → PYQs (CSV/JSON). Run npm run seed for samples.'}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {subjects.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex-shrink-0 ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {s === 'All' ? 'All Subjects' : s.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {topics.map((t) => (
          <button key={t} type="button" onClick={() => setTopicFilter(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex-shrink-0 ${topicFilter === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {t === 'All' ? 'All Topics' : t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {years.map((y) => (
          <button key={y} type="button" onClick={() => setYearFilter(y)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${yearFilter === y ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {y === 'All' ? 'All Years' : `GATE ${y}`}
          </button>
        ))}
        {['All', 'easy', 'medium', 'hard'].map((d) => (
          <button key={d} type="button" onClick={() => setDiff(d)} className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all whitespace-nowrap ${diff === d ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>{d}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${statusFilter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>{s}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((q) => (
          <div key={q.id} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-sm font-medium text-text flex items-center gap-1">
                {q.title}
              </div>
              <span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 capitalize ${DIFF_STYLE[q.difficulty]}`}>{q.difficulty}</span>
            </div>
            <div className="text-[11px] text-text3 mb-1">{q.subject} · GATE {q.year}{q.topic ? ` · ${q.topic}` : ''}</div>
            {q.questionText && <p className="text-[10px] text-text3 mb-2 line-clamp-2">{q.questionText}</p>}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {q.revisionNeeded && <span className="text-[9px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400">Revision</span>}
              {q.markedDifficult && <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">Difficult</span>}
              {q.solved && <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">Solved</span>}
              {q.mistakeType && <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">{q.mistakeType}</span>}
            </div>
            {(!q.solved || q.markedDifficult || q.mistakeType) && (
              <div className="mb-3">
                <div className="text-[9px] uppercase tracking-wider text-text3 mb-1.5">Mistake Type</div>
                <div className="flex flex-wrap gap-1.5">
                  {MISTAKE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMistakeType(q, type)}
                      className={`text-[9px] px-2 py-1 rounded border transition-all ${q.mistakeType === type ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/15'}`}
                    >
                      {type.replace(' Mistake', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-1.5">
              {q.mongoId && q.questionText ? (
                <>
                  <button type="button" onClick={() => setPracticeId(q.mongoId)} className="flex-1 text-[10px] px-2 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary">
                    Practice
                  </button>
                  <button type="button" onClick={() => viewSolution(q)} className="text-[10px] px-2 py-1.5 rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/15" title="View Solution">
                    💡
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => toggle(q, 'solved')} className={`flex-1 text-[10px] px-2 py-1.5 rounded-lg border transition-all ${q.solved ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-bg-2 border-border text-text3'}`}>
                  {q.solved ? '✓ Solved' : 'Mark Solved'}
                </button>
              )}
              <button type="button" onClick={() => toggle(q, 'revisionNeeded')} className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all ${q.revisionNeeded ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-bg-2 border-border text-text3'}`}>↻</button>
              <button type="button" onClick={() => toggle(q, 'markedDifficult')} className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all ${q.markedDifficult ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-bg-2 border-border text-text3'}`}>!</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="col-span-3 text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-base font-bold text-text mb-1">No PYQs Match This Filter</h3>
            <p className="text-sm text-text3 mb-4">Try adjusting your filters or check back later.</p>
            <button onClick={() => { setFilter('All'); setTopicFilter('All'); setYearFilter('All'); setDiff('All'); setStatusFilter('All'); }} className="text-xs px-4 py-2 rounded-xl font-semibold transition-all" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white' }}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <Modal open={!!practiceId} onClose={() => setPracticeId(null)} title="Practice Question" maxWidth="max-w-2xl">
        {practiceId && <QuestionPractice pyqId={practiceId} onClose={() => setPracticeId(null)} onAttempt={handleAttempt} />}
      </Modal>

      <Modal open={!!viewSolutionId} onClose={() => { setViewSolutionId(null); setSolutionData(null); }} title="Solution" maxWidth="max-w-2xl">
        {loadingSolution && <div className="text-sm text-text3 p-8 text-center">Loading solution...</div>}
        {solutionData && !loadingSolution && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-text mb-1">{solutionData.title}</h3>
              <p className="text-xs text-text3">{solutionData.subject?.name || solutionData.subject} · GATE {solutionData.year}</p>
            </div>
            {solutionData.questionText && <p className="text-sm text-text2 leading-relaxed">{solutionData.questionText}</p>}
            {solutionData.options?.length > 0 && (
              <div className="space-y-1.5">
                {solutionData.options.map((opt) => (
                  <div key={opt.key} className={`text-sm px-3 py-2 rounded-lg border ${opt.key === solutionData.correctAnswer ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-bg-2 border-border text-text2'}`}>
                    <span className="font-mono font-semibold mr-2">{opt.key}.</span>{opt.text}
                    {opt.key === solutionData.correctAnswer && <span className="ml-2 text-[10px]">✓ Correct</span>}
                  </div>
                ))}
              </div>
            )}
            {solutionData.explanation && (
              <div className="bg-bg-2 border border-border rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-wider text-text3 mb-2">Explanation</div>
                <p className="text-sm text-text2 leading-relaxed">{solutionData.explanation}</p>
              </div>
            )}
            {solutionData.questionStats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Correct %', value: solutionData.questionStats.correctPct, color: 'text-green-400' },
                  { label: 'Incorrect %', value: solutionData.questionStats.incorrectPct, color: 'text-red-400' },
                  { label: 'Skip %', value: solutionData.questionStats.skipPct, color: 'text-orange-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
                    <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}%</div>
                    <div className="text-[9px] text-text3 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
