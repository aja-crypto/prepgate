import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mistakeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['Engineering Mathematics', 'Digital Logic', 'Computer Organization', 'C Programming', 'Data Structures', 'Algorithms', 'Theory of Computation', 'Compiler Design', 'Operating Systems', 'DBMS', 'Computer Networks', 'General Aptitude'];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const MISTAKE_TYPES = [
  { id: 'concept_error', label: 'Concept Error', icon: '💡', color: '#ef4444' },
  { id: 'formula_forgotten', label: 'Formula Forgotten', icon: '📐', color: '#f59e0b' },
  { id: 'silly_mistake', label: 'Silly Mistake', icon: '😅', color: '#8B5CF6' },
  { id: 'calculation_mistake', label: 'Calculation Mistake', icon: '🧮', color: '#ec4899' },
  { id: 'time_management', label: 'Time Management', icon: '⏱', color: '#06B6D4' },
  { id: 'question_misread', label: 'Misread Question', icon: '👓', color: '#14B8A6' },
  { id: 'guessing_error', label: 'Guessing Error', icon: '🎲', color: '#F97316' },
  { id: 'logic_error', label: 'Logic Error', icon: '🧠', color: '#6366F1' },
  { id: 'memory_error', label: 'Memory Error', icon: '🧩', color: '#A855F7' },
  { id: 'careless_reading', label: 'Careless Reading', icon: '📖', color: '#22C55E' },
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES = [
  { id: 'pending', label: 'Pending', icon: '⏳', color: '#F59E0B' },
  { id: 'revised', label: 'Revised', icon: '📖', color: '#06B6D4' },
  { id: 'mastered', label: 'Mastered', icon: '✅', color: '#22C55E' },
];

const DEFAULT_FORM = {
  questionText: '',
  subject: SUBJECTS[0],
  topic: '',
  difficulty: 'Medium',
  mistakeType: 'concept_error',
  correctAnswer: '',
  userAnswer: '',
  reason: '',
  learning: '',
  source: 'Practice',
  sourceTest: '',
  priority: 'Medium',
  tags: [],
};

function MistakeCard({ entry, onDelete, onToggleStatus }) {
  const mt = MISTAKE_TYPES.find(t => t.id === entry.mistakeType) || MISTAKE_TYPES[0];
  const status = entry.resolved ? 'mastered' : 'pending';
  const st = STATUSES.find(s => s.id === status);
  const date = new Date(entry.createdAt || entry.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 group relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{mt.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white truncate">{entry.questionText || 'Untitled'}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}25` }}>{st.icon} {st.label}</span>
            <span className="text-[9px] text-text3/50">{date}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}>{entry.subject}</span>
            {entry.topic && <span className="text-[9px] text-text3/60">‧ {entry.topic}</span>}
            <span className="text-[9px] text-text3/60">‧ {entry.difficulty || 'Medium'}</span>
          </div>
          {entry.reason && <p className="text-[10px] text-text3/60 mt-2 line-clamp-2">{entry.reason}</p>}
          {entry.learning && (
            <div className="mt-2 rounded-lg p-2" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
              <span className="text-[9px] font-semibold text-green-400">Learning: </span>
              <span className="text-[9px] text-text3/70">{entry.learning}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
        <button onClick={() => onToggleStatus(entry._id || entry.id, !entry.resolved)}
          className="text-[9px] font-medium px-2 py-1 rounded-lg transition-colors"
          style={{ background: entry.resolved ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: entry.resolved ? '#22C55E' : '#F59E0B', border: `1px solid ${entry.resolved ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
          {entry.resolved ? '✅ Mastered' : '⏳ Pending'}
        </button>
        <button onClick={() => onDelete(entry._id || entry.id)}
          className="text-[9px] font-medium px-2 py-1 rounded-lg text-red-400 transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 space-y-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="flex gap-2">
        <div className="h-5 rounded-full w-20" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-5 rounded-full w-16" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

export default function MistakeNotebookPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState([]);
  const [aggregates, setAggregates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState('');

  const fetchMistakes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter !== 'All') params.subject = subjectFilter;
      if (typeFilter !== 'All') params.mistakeType = typeFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const [mistakesRes, aggRes] = await Promise.all([
        mistakeService.getAll(params).catch(() => ({ data: { data: [] } })),
        mistakeService.getAggregates().catch(() => ({ data: { data: {} } })),
      ]);
      setMistakes(mistakesRes.data?.data || []);
      setAggregates(aggRes.data?.data || null);
    } catch { toast.error('Failed to load mistakes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMistakes(); }, [subjectFilter, typeFilter, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.questionText.trim()) return toast.error('Question text is required');
    try {
      setSubmitting(true);
      const res = await mistakeService.create(form);
      if (res.data?.success) {
        toast.success('Mistake logged');
        setForm(DEFAULT_FORM);
        setShowForm(false);
        fetchMistakes();
      } else throw new Error(res.data?.message || 'Server error');
    } catch (err) {
      toast.error(`Failed: ${err.response?.data?.message || err.message}`);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mistake?')) return;
    try {
      await mistakeService.delete(id);
      toast.success('Deleted');
      fetchMistakes();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleStatus = async (id, resolved) => {
    try {
      await mistakeService.update?.(id, { resolved });
      fetchMistakes();
    } catch { toast.error('Failed to update status'); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const counts = aggregates || { total: 0, totalPending: 0, totalResolved: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Mistake Notebook</h1>
          <p className="text-xs text-text3/70 mt-0.5">{counts.total} entries · {counts.totalPending} pending · {counts.totalResolved} mastered</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(o => !o)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showForm ? 'text-red-400' : 'text-white'}`}
          style={showForm
            ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }
            : { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
          {showForm ? '✕ Cancel' : '+ Log Mistake'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Question *</label>
                  <textarea required value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
                    rows={2} placeholder="What was the question?"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Topic</label>
                  <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Spanning Trees"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Mistake Type</label>
                  <select value={form.mistakeType} onChange={e => setForm(f => ({ ...f, mistakeType: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    {MISTAKE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Your Answer</label>
                  <input value={form.userAnswer} onChange={e => setForm(f => ({ ...f, userAnswer: e.target.value }))}
                    placeholder="What you wrote"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Correct Answer</label>
                  <input value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                    placeholder="What the answer was"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Why did you make this mistake?</label>
                  <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    rows={2} placeholder="Be honest — this helps identify patterns"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">What did you learn?</label>
                  <textarea value={form.learning} onChange={e => setForm(f => ({ ...f, learning: e.target.value }))}
                    rows={2} placeholder="Write the key takeaway so you never repeat this mistake"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                    {['PYQ', 'Mock', 'Topic Test', 'Practice', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Test Name</label>
                  <input value={form.sourceTest} onChange={e => setForm(f => ({ ...f, sourceTest: e.target.value }))}
                    placeholder="e.g. Mock Test 4"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text3/70 mb-1 block">Tags</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Add a tag and press Enter"
                      className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
                    <button type="button" onClick={addTag}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.15)' }}>
                          #{t}
                          <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="hover:text-white">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                  {submitting ? 'Saving...' : 'Log Mistake'}
                </motion.button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
          <option value="All">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
          <option value="All">All Types</option>
          {MISTAKE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : mistakes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-3xl mb-3 opacity-40">📓</span>
          <p className="text-sm font-medium text-text3/60">No mistakes logged yet</p>
          <p className="text-xs text-text3/40 mt-1">Start logging to track your progress</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {mistakes.map(entry => (
            <MistakeCard key={entry._id || entry.id} entry={entry} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
