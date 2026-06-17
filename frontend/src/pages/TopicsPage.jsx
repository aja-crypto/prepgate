import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { topicService, subjectService, getApiErrorMessage } from '../services/api';
import { PageLoading } from '../components/common/GateLoadingScreen';
import SmartTopicCard from '../components/gate/SmartTopicCard';
import toast from 'react-hot-toast';

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
  const { topics: localTopics, studyStats } = useProgress();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [topRes, subRes] = await Promise.all([
        topicService.getAll({ withProgress: 'true' }),
        subjectService.getAll(),
      ]);
      setTopics(topRes.data.data || []);
      setSubjects(subRes.data.data || []);
    } catch {
      const fallbackSubjects = studyStats?.subjects || [];
      setSubjects(fallbackSubjects);
      const subMap = new Map(fallbackSubjects.map(s => [s.name, s]));
      setTopics((localTopics || []).map(t => ({
        ...t,
        subject: subMap.get(t.subject) || { name: t.subject, icon: '📘', color: '#4f8dff' },
        _id: String(t.id),
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

  const subjectNames = ['All', ...subjects.map((s) => s.name)];

  const filtered = topics.filter((t) => {
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

  return (
    <div>
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
          { label: 'Total Topics', value: topics.length, color: 'text-text' },
          { label: 'Completed', value: done, color: 'text-green-400' },
          { label: 'Revision Due', value: revisionDueTopics.length, color: 'text-yellow-400' },
          { label: 'Not Started', value: topics.filter((t) => {
            const p = t.progress || {};
            return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every((k) => !p[k]);
          }).length, color: 'text-red-400' },
          { label: 'In Progress', value: topics.filter((t) => {
            const p = t.progress || {};
            const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
            const done = tasks.filter((k) => p[k]).length;
            return done > 0 && done < tasks.length;
          }).length, color: 'text-blue-400' },
          { label: 'Readiness', value: `${pct}%`, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-text3 uppercase tracking-wider mt-0.5">{s.label}</div>
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
              <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden max-w-[60px]">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${s.total > 0 ? Math.round((s.done / s.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-text2">{Math.round((s.done / s.total) * 100)}%</span>
            </div>
          </Link>
        ))}
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
            {done}/{filtered.length} completed
            {statusFilter !== 'All' && ` (filtered)`}
          </span>
          <span className="text-primary font-mono">{pct}%</span>
        </div>
        <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <SmartTopicCard key={t._id} topic={t} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-text3"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
            </div>
            <h4 className="text-base font-semibold text-text mb-1">No Topics Found</h4>
            <p className="text-sm text-text3 max-w-xs leading-relaxed mb-5">Try adjusting your filters or search to find what you're looking for.</p>
            <Link to="/topics" className="text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.12)', color: '#A78BFA', border: '1px solid rgba(168,85,247,0.25)' }}>
              View All Topics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
