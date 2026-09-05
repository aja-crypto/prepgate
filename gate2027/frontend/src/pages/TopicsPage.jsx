// Topic tracker — all GATE topics with filters and progress from API
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { topicService, subjectService, getApiErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

export default function TopicsPage() {
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load topics'));
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
    if (statusFilter === 'Completed' && !p.isCompleted) return false;
    if (statusFilter === 'Pending' && p.isCompleted) return false;
    if (statusFilter === 'Bookmarked' && !p.isBookmarked) return false;
    if (statusFilter === 'Revision' && !p.revisionNeeded) return false;
    if (statusFilter === 'Difficult' && !p.markedDifficult) return false;
    return true;
  });

  const done = filtered.filter((t) => t.progress?.isCompleted).length;
  const pct = filtered.length ? Math.round((done / filtered.length) * 100) : 0;

  const toggle = async (id) => {
    try {
      await topicService.toggle(id);
      load();
    } catch {
      toast.error('Toggle failed');
    }
  };

  if (loading) return <div className="text-sm text-text3 py-16 text-center">Loading topics...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">All Topics</h1>
          <p className="text-sm text-text3 mt-0.5">{topics.length} GATE syllabus topics · click to study</p>
        </div>
        <Link to="/subjects" className="text-xs text-primary hover:opacity-80">View by Subject →</Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {subjectNames.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>
            {s === 'All' ? 'All' : s.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {['All', 'Completed', 'Pending', 'Bookmarked', 'Revision', 'Difficult'].map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border ${statusFilter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl mb-4 p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text2">{done}/{filtered.length} completed</span>
          <span className="text-primary font-mono">{pct}%</span>
        </div>
        <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {filtered.map((t, i) => {
          const p = t.progress || {};
          return (
            <div key={t._id} className={`flex items-center gap-3 p-4 hover:bg-hover transition-colors ${i < filtered.length - 1 ? 'border-b border-border' : ''}`}>
              <button type="button" onClick={() => toggle(t._id)} className={`w-5 h-5 rounded flex items-center justify-center text-xs border flex-shrink-0 ${p.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-border'}`}>
                {p.isCompleted ? '✓' : ''}
              </button>
              <Link to={`/learn/topic/${t._id}`} className="flex-1 min-w-0">
                <div className={`text-sm ${p.isCompleted ? 'line-through text-text3' : 'text-text'}`}>{t.name}</div>
                <div className="text-[10px] text-text3 mt-0.5">
                  {t.subject?.name} · {t.difficulty} · ~{t.weightage}%
                  {p.isBookmarked && ' · ★'}{p.revisionNeeded && ' · ↻'}{p.markedDifficult && ' · !'}
                </div>
              </Link>
              <Link to={`/learn/topic/${t._id}`} className="text-[10px] text-primary hover:underline">Study →</Link>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-text3 text-sm">No topics match this filter</div>}
      </div>
    </div>
  );
}
