import { useState, useEffect } from 'react';
import { mistakeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';

const SUBJECTS = ['APT', 'EM', 'DS', 'AL', 'DB', 'OS', 'CN', 'CO', 'TOC', 'CD', 'DL'];

const CATEGORY_COLORS = {
  concept_error: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)', label: 'Concept Error' },
  formula_error: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)', label: 'Formula Error' },
  silly_mistake: { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)', label: 'Silly Mistake' },
  time_pressure: { bg: 'rgba(6,182,212,0.1)', text: '#22d3ee', border: 'rgba(6,182,212,0.2)', label: 'Time Pressure' },
  guess: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.2)', label: 'Guess' },
};

const CATEGORY_ICONS = {
  concept_error: '💡',
  formula_error: '📐',
  silly_mistake: '😅',
  time_pressure: '⏱',
  guess: '🎲',
};

const DEFAULT_FORM = {
  questionText: '',
  subject: SUBJECTS[0],
  topic: '',
  yourAnswer: '',
  correctAnswer: '',
  category: 'concept_error',
  notes: '',
  sourceTest: '',
};

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="h-4 bg-bg-3 rounded w-3/4" />
      <div className="h-3 bg-bg-3 rounded w-1/2" />
      <div className="h-3 bg-bg-3 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-5 bg-bg-3 rounded-full w-20" />
        <div className="h-5 bg-bg-3 rounded-full w-16" />
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [form, setForm] = useState(DEFAULT_FORM);

  const fetchMistakes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter !== 'All') params.subject = subjectFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const [mistakesRes, aggRes] = await Promise.all([
        mistakeService.getAll(params).catch(() => ({ data: { data: [] } })),
        mistakeService.getAggregates().catch(() => ({ data: { data: {} } })),
      ]);

      setMistakes(mistakesRes.data?.data || []);
      setAggregates(aggRes.data?.data || null);
    } catch (err) {
      toast.error('Failed to load mistakes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, [subjectFilter, categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.questionText.trim()) return toast.error('Question text is required');
    if (!form.category) return toast.error('Category is required');

    try {
      setSubmitting(true);
      const res = await mistakeService.create(form);
      if (res.data?.success) {
        toast.success('Mistake logged successfully');
        setForm(DEFAULT_FORM);
        setShowForm(false);
        fetchMistakes();
      } else {
        throw new Error(res.data?.message || 'Server error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to log mistake: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this mistake entry?')) return;
    try {
      await mistakeService.delete(id);
      toast.success('Mistake deleted');
      fetchMistakes();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const truncate = (text, len = 100) => text?.length > len ? text.slice(0, len) + '...' : text;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Mistake Notebook</h1>
          <p className="text-sm text-text3">Log and review your mistakes to avoid repeating them</p>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            showForm ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90'
          }`}
        >
          <Icon name={showForm ? 'close' : 'mistake'} className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Log New Mistake'}
        </button>
      </div>

      {/* Add Mistake Form */}
      {showForm && (
        <GlassCard padding="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Question Text *</label>
                <textarea
                  required
                  value={form.questionText}
                  onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Subject *</label>
                <select
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Topic</label>
                <input
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Spanning Trees"
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Your Answer</label>
                <input
                  value={form.yourAnswer}
                  onChange={e => setForm(f => ({ ...f, yourAnswer: e.target.value }))}
                  placeholder="What you wrote"
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Correct Answer</label>
                <input
                  value={form.correctAnswer}
                  onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                  placeholder="What the answer was"
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none"
                >
                  {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
                    <option key={key} value={key}>{CATEGORY_ICONS[key]} {val.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Why did this mistake happen? How to avoid it next time?"
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 mb-1.5 block">Source Test (optional)</label>
                <input
                  value={form.sourceTest}
                  onChange={e => setForm(f => ({ ...f, sourceTest: e.target.value }))}
                  placeholder="e.g. GATE 2026, Mock Test 3"
                  className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Log Mistake
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Stats Bar */}
      {aggregates && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard padding="p-4" className="text-center">
            <div className="text-2xl font-black text-text">{aggregates.totalMistakes || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text3 mt-1">Total Mistakes</div>
          </GlassCard>
          <GlassCard padding="p-4" className="text-center">
            <div className="text-2xl font-black text-text">
              {aggregates.topCategory ? (CATEGORY_COLORS[aggregates.topCategory]?.label || aggregates.topCategory) : 'N/A'}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text3 mt-1">Top Category</div>
          </GlassCard>
          <GlassCard padding="p-4" className="text-center">
            <div className="text-2xl font-black text-text">{aggregates.topSubject || 'N/A'}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text3 mt-1">Top Subject</div>
          </GlassCard>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Subject</span>
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
          >
            <option value="All">All</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Category</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
          >
            <option value="All">All</option>
            {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
              <option key={key} value={key}>{CATEGORY_ICONS[key]} {val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistake List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : mistakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-dashed border-border rounded-3xl text-text3">
          <div className="text-5xl mb-4 opacity-30">📓</div>
          <p className="text-sm font-medium">No mistakes logged yet</p>
          <p className="text-xs text-text3 mt-1">Click "Log New Mistake" to track the first one</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Log Your First Mistake
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {mistakes.map(m => {
            const cat = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.concept_error;
            return (
              <GlassCard key={m._id} className="group relative" padding="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text leading-relaxed">{truncate(m.questionText, 120)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(m._id)}
                    className="ml-3 p-1.5 rounded-lg text-text3 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Icon name="close" className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                  >
                    {CATEGORY_ICONS[m.category] || '💡'} {cat.label}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {m.subject}
                  </span>
                  {m.topic && (
                    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-bg-3 text-text3 border border-border">
                      {m.topic}
                    </span>
                  )}
                </div>

                {(m.yourAnswer || m.correctAnswer) && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {m.yourAnswer && (
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Your Answer</div>
                        <div className="text-xs text-text font-mono">{m.yourAnswer}</div>
                      </div>
                    )}
                    {m.correctAnswer && (
                      <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                        <div className="text-[9px] font-black uppercase tracking-widest text-green-400 mb-1">Correct Answer</div>
                        <div className="text-xs text-text font-mono">{m.correctAnswer}</div>
                      </div>
                    )}
                  </div>
                )}

                {m.notes && (
                  <div className="bg-bg-3 border border-border rounded-xl p-3 mb-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-text3 mb-1">Notes</div>
                    <p className="text-xs text-text2 leading-relaxed">{m.notes}</p>
                  </div>
                )}

                {m.sourceTest && (
                  <div className="text-[10px] text-text3 italic">
                    Source: {m.sourceTest}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
