import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { topicService, subjectService, getApiErrorMessage } from '../services/api';
import { PageLoading } from '../components/common/GateLoadingScreen';
import SmartTopicCard from '../components/gate/SmartTopicCard';
import { useSEO } from '../hooks/useSEO';
import { publish, EVENTS } from '../services/aiEventSystem';

function computeSubjectReadiness(topics) {
  const subjects = {};
  topics.forEach((t) => {
    const name = t.subject?.name || t.subject || 'Other';
    if (!subjects[name]) subjects[name] = { topics: [], icon: t.subject?.icon, color: t.subject?.color };
    subjects[name].topics.push(t);
  });
  return Object.entries(subjects).map(([name, data]) => {
    const done = data.topics.filter((t) => {
      const p = t.progress || {};
      return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every((k) => p[k]);
    }).length;
    return { name, total: data.topics.length, done, icon: data.icon, color: data.color };
  });
}

function getRevisionDueTopics(topics) {
  return topics.filter((t) => {
    const p = t.progress || {};
    const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
    const done = tasks.filter((k) => p[k]).length;
    if (done < tasks.length) return false;
    if (!t.lastRevised) return true;
    const days = Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000);
    const schedule = t.revisionSchedule || [3, 7, 15, 30];
    const nextRevDays = schedule.find((d) => days >= d);
    return nextRevDays !== undefined;
  });
}

function getWeakTopics(topics) {
  return topics.filter((t) => {
    const p = t.progress || {};
    return !p.lecture && !p.notes;
  }).slice(0, 5);
}

function getHighWeightageNotDone(topics) {
  return topics.filter((t) => {
    const p = t.progress || {};
    const done = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].filter((k) => p[k]).length;
    return (t.weightage || 0) >= 4 && done < 8;
  }).sort((a, b) => (b.weightage || 0) - (a.weightage || 0)).slice(0, 5);
}

export default function TopicsPage() {
  useSEO({ title: 'Topics', description: 'Study GATE topics with progress tracking and completion checklists.' });
  const { topics: localTopics, studyStats } = useProgress();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [topRes, subRes] = await Promise.all([
        topicService.getAll({ withProgress: 'true' }),
        subjectService.getAll(),
      ]);
      setTopics(topRes.data.data || []);
      setSubjects(subRes.data.data || []);
    } catch (err) {
      setLoadError(err);
      const fallbackSubjects = studyStats?.subjects || [];
      setSubjects(fallbackSubjects);
      const subMap = new Map(fallbackSubjects.map(s => [s.name, s]));
      setTopics((localTopics || []).map((t, idx) => ({
        ...t,
        subject: subMap.get(t.subject) || { name: t.subject, icon: '📘', color: '#4f8dff' },
        _id: String(t.id != null ? t.id : `fallback-${idx}`),
        progress: {
          lecture: t.progress?.lecture || false,
          notes: t.progress?.notes || false,
          revision1: t.progress?.revision1 || false,
          revision2: t.progress?.revision2 || false,
          revision3: t.progress?.revision3 || false,
          revision4: t.progress?.revision4 || false,
          pyqs: t.progress?.pyqs || false,
          topicTest: t.progress?.topicTest || false,
        },
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (topics.length > 0) {
      publish('page:navigated', { page: 'topics', topicCount: topics.length, timestamp: Date.now() });
    }
  }, [topics.length > 0]);

  const subjectNames = ['All', ...subjects.map((s) => s.name).filter(Boolean)];

  const filtered = topics.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (t.name || '').toLowerCase();
      const sub = (t.subject?.name || '').toLowerCase();
      if (!name.includes(q) && !sub.includes(q)) return false;
    }
    const subName = t.subject?.name || '';
    if (filter !== 'All' && subName !== filter) return false;
    const p = t.progress || {};
    if (statusFilter === 'Completed') {
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      if (done < tasks.length) return false;
    }
    if (statusFilter === 'Pending') {
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      if (done > 0) return false;
    }
    if (statusFilter === 'In Progress') {
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      if (done === 0 || done === tasks.length) return false;
    }
    if (statusFilter === 'Revision Due') {
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      if (done < tasks.length) return false;
      if (!t.lastRevised) return true;
      const days = Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000);
      const schedule = t.revisionSchedule || [3, 7, 15, 30];
      return schedule.some((d) => days >= d);
    }
    return true;
  });

  const done = filtered.filter((t) => {
    const p = t.progress || {};
    return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every((k) => p[k]);
  }).length;
  const pct = filtered.length ? Math.round((done / filtered.length) * 100) : 0;

  const subjectReadiness = useMemo(() => computeSubjectReadiness(topics), [topics]);
  const nameToCode = useMemo(() => {
    const map = {};
    subjects.forEach(s => { if (s.name && s.code) map[s.name.toLowerCase()] = s.code; });
    return map;
  }, [subjects]);
  const revisionDueTopics = useMemo(() => getRevisionDueTopics(topics), [topics]);
  const weakTopics = useMemo(() => getWeakTopics(topics), [topics]);
  const highValueTopics = useMemo(() => getHighWeightageNotDone(topics), [topics]);

  if (loading) return <PageLoading title="Loading Topics" />;

  if (loadError && topics.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-red-400"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" /><line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" /></svg>
        </div>
        <h4 className="text-base font-semibold text-text mb-1">Unable to Load Topics</h4>
        <p className="text-sm text-text3 max-w-xs mx-auto leading-relaxed mb-5">{getApiErrorMessage(loadError, 'Could not connect to the server.')}</p>
        <button type="button" onClick={load} className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)' }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {loadError && topics.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm">⚠</span>
            <span className="text-xs text-yellow-300">Using offline data — server unreachable.</span>
          </div>
          <button type="button" onClick={load} className="text-[10px] px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20">Retry</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Smart Topic Tracker</h1>
          <p className="text-sm text-text3 mt-0.5">{topics.length} GATE syllabus topics · smart progress system</p>
        </div>
        <Link to="/subjects" className="text-xs text-primary hover:opacity-80">View by Subject →</Link>
      </div>

      {revisionDueTopics.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-sm">↻</span>
            <span className="text-xs font-semibold text-yellow-400">{revisionDueTopics.length} topic(s) due for revision</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {revisionDueTopics.slice(0, 5).map((t) => (
              <Link key={t._id} to={`/learn/topic/${t._id}`}
                className="text-[10px] px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 transition-all"
              >
                {t.name}
              </Link>
            ))}
            {revisionDueTopics.length > 5 && (
              <span className="text-[10px] text-text3 self-center">+{revisionDueTopics.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total Topics', value: filtered.length, color: 'text-text' },
          { label: 'Completed', value: done, color: 'text-green-400' },
          { label: 'Revision Due', value: revisionDueTopics.length, color: 'text-yellow-400' },
          { label: 'Not Started', value: filtered.filter((t) => {
            const p = t.progress || {};
            return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every((k) => !p[k]);
          }).length, color: 'text-red-400' },
          { label: 'In Progress', value: filtered.filter((t) => {
            const p = t.progress || {};
            const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
            const done = tasks.filter((k) => p[k]).length;
            return done > 0 && done < tasks.length;
          }).length, color: 'text-blue-400' },
          { label: 'Readiness', value: `${pct}%`, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] sm:text-[11px] text-text3 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {weakTopics.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
          <div className="text-xs font-semibold text-red-400 mb-2">Weak Topics — Start Here</div>
          <div className="flex flex-wrap gap-1">
            {weakTopics.map((t) => (
              <Link key={t._id} to={`/learn/topic/${t._id}`}
                className="text-[10px] px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {highValueTopics.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <div className="text-xs font-semibold text-primary mb-2">High Weightage — Priority Topics</div>
          <div className="flex flex-wrap gap-1">
            {highValueTopics.map((t) => (
              <Link key={t._id} to={`/learn/topic/${t._id}`}
                className="text-[10px] px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
              >
                {t.name} (~{t.weightage}%)
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {subjectReadiness.filter((s) => s.total > 0).map((s) => (
          <Link key={s.name} to={`/subjects/${nameToCode[s.name.toLowerCase()] || s.name}`}
            className="bg-surface border border-border rounded-xl p-3 text-center hover:border-primary/30 transition-all"
          >
            <div className="text-lg">{s.icon || '📘'}</div>
            <div className="text-[10px] font-semibold text-text mt-1 truncate">{s.name}</div>
            <div className="flex items-center gap-1 justify-center mt-1">
              <div className="w-full h-1.5 rounded-full max-w-[60px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${s.total > 0 ? Math.round((s.done / s.total) * 100) : 0}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-text2">{Math.round((s.done / s.total) * 100)}%</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="relative mb-3">
        <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search topics..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary/50" />
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {subjectNames.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}
          >
            {s === 'All' ? 'All' : s.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {['All', 'Completed', 'In Progress', 'Pending', 'Revision Due'].map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${statusFilter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}
          >
            {s === 'Revision Due' && '↻ '}{s}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl mb-4 p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text2">
            {filtered.length > 0 ? `${done}/${filtered.length} completed` : 'No topics loaded yet'}
            {statusFilter !== 'All' && ` (filtered)`}
          </span>
          <span className="text-primary font-mono">{filtered.length > 0 ? `${pct}%` : '—'}</span>
        </div>
        <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed, #6d28d9)', boxShadow: '0 0 10px rgba(139,92,246,0.35)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <SmartTopicCard key={t._id} topic={t} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-text3"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
            </div>
          <h4 className="text-sm font-semibold text-text mb-1">{topics.length === 0 ? '🚀 Your Topic Journey Starts Now' : 'No Topics Found'}</h4>
          <p className="text-sm text-text3 max-w-xs leading-relaxed mb-4">
            {topics.length === 0
              ? 'Every master was once a beginner. Start with PYQs or browse subjects — your progress builds your topic list automatically.'
              : 'Try adjusting your filters or search to find what you\'re looking for.'}
          </p>
          {topics.length === 0 ? (
            <div className="flex items-center gap-3">
              <Link to="/pyq" className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02] text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                Practice PYQs →
              </Link>
              <Link to="/subjects" className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A78BFA', border: '1px solid rgba(168,85,247,0.25)' }}>
                Browse Subjects
              </Link>
            </div>
          ) : (
            <Link to="/topics" className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A78BFA', border: '1px solid rgba(168,85,247,0.25)' }}>
              View All Topics
            </Link>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
