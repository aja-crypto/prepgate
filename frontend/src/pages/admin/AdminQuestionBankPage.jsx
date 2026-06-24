import { useState, useEffect, useCallback, useMemo } from 'react';
import { questionBankService } from '../../services/adminApi';
import BulkImporter from '../../components/admin/BulkImporter';
import toast from 'react-hot-toast';

const SUBJECTS = [
  { code: 'APT', name: 'Aptitude' },
  { code: 'EM', name: 'Engineering Mathematics' },
  { code: 'DS', name: 'Programming & Data Structures' },
  { code: 'AL', name: 'Algorithms' },
  { code: 'DB', name: 'DBMS' },
  { code: 'OS', name: 'Operating Systems' },
  { code: 'CN', name: 'Computer Networks' },
  { code: 'TOC', name: 'Theory of Computation' },
  { code: 'CD', name: 'Compiler Design' },
  { code: 'CO', name: 'Computer Organization' },
  { code: 'DL', name: 'Digital Logic' },
  { code: 'SE', name: 'Software Engineering' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = ['MCQ', 'MSQ', 'NAT'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
  { value: 'subject', label: 'Subject' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'marks', label: 'Marks' },
];

const EMPTY_FORM = { subject: 'APT', topic: '', difficulty: 'medium', questionType: 'MCQ', questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: 1 };

export default function AdminQuestionBankPage() {
  const [view, setView] = useState('grouped'); // grouped | list
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedSubject, setExpandedSubject] = useState(null);

  // filters
  const [filters, setFilters] = useState({ search: '', subject: '', difficulty: '', topic: '', questionType: '', marks: '', year: '', set: '', sort: '-createdAt' });
  const hasActiveFilters = Object.values(filters).some(v => v && v !== '-createdAt' && v !== '');

  // bulk
  const [selected, setSelected] = useState([]);
  const [bulkSubjectTarget, setBulkSubjectTarget] = useState('');
  const [bulkDiffTarget, setBulkDiffTarget] = useState('');

  // modals
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importMode, setImportMode] = useState(null);
  const [importData, setImportData] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  const updateFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

  const loadGrouped = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.subject) params.subject = filters.subject;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.topic) params.topic = filters.topic;
      if (filters.questionType) params.questionType = filters.questionType;
      if (filters.marks) params.marks = filters.marks;
      const res = await questionBankService.grouped(params);
      setGroups(res.data.data || []);
    } catch (e) { toast.error('Failed to load questions'); } finally { setLoading(false); }
  }, [filters]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, sort: filters.sort };
      if (filters.search) params.search = filters.search;
      if (filters.subject) params.subject = filters.subject;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.topic) params.topic = filters.topic;
      if (filters.questionType) params.questionType = filters.questionType;
      if (filters.marks) params.marks = filters.marks;
      const res = await questionBankService.list(params);
      setQuestions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) { toast.error('Failed to load questions'); } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { if (view === 'grouped') loadGrouped(); else loadList(); }, [view, loadGrouped, loadList]);

  useEffect(() => {
    questionBankService.stats().then(r => setStats(r.data.data)).catch(e => console.warn('AdminQuestionBank stats failed', e?.message));
  }, []);

  const totalByType = useMemo(() => {
    if (!stats) return { total: 0, mcq: 0, msq: 0, nat: 0, easy: 0, medium: 0, hard: 0 };
    const byType = {};
    (stats.byQuestionType || []).forEach(t => byType[t._id] = t.count);
    const byDiff = {};
    (stats.byDifficulty || []).forEach(d => byDiff[d._id] = d.count);
    return { total: stats.total, mcq: byType['MCQ'] || 0, msq: byType['MSQ'] || 0, nat: byType['NAT'] || 0, easy: byDiff['easy'] || 0, medium: byDiff['medium'] || 0, hard: byDiff['hard'] || 0 };
  }, [stats]);

  const handleSave = async () => {
    try {
      const opts = form.options.filter(o => o.trim());
      if (opts.length < 2) return alert('At least 2 options required');
      const payload = { ...form, options: opts };
      if (editing) await questionBankService.update(editing, payload);
      else await questionBankService.create(payload);
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      if (view === 'grouped') loadGrouped(); else loadList();
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await questionBankService.delete(id); if (view === 'grouped') loadGrouped(); else loadList(); } catch (e) { toast.error('Failed to delete question'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} questions?`)) return;
    try { await questionBankService.bulkDelete(selected); setSelected([]); loadList(); } catch (e) { toast.error('Failed to delete questions'); }
  };

  const handleBulkSubject = async () => {
    if (!selected.length || !bulkSubjectTarget) return;
    try { await questionBankService.bulkSubject(selected, bulkSubjectTarget); setSelected([]); setBulkSubjectTarget(''); loadList(); } catch (e) { toast.error('Failed to update subjects'); }
  };

  const handleBulkDifficulty = async () => {
    if (!selected.length || !bulkDiffTarget) return;
    try { await questionBankService.bulkDifficulty(selected, bulkDiffTarget); setSelected([]); setBulkDiffTarget(''); loadList(); } catch (e) { toast.error('Failed to update difficulties'); }
  };

  const loadDuplicates = async () => {
    try { const res = await questionBankService.duplicates(); setDuplicates(res.data.data || []); setShowDuplicates(true); } catch (e) { toast.error('Failed to find duplicates'); }
  };

  const editQuestion = (q) => {
    setForm({ subject: q.subject, topic: q.topic, difficulty: q.difficulty, questionType: q.questionType || 'MCQ', questionText: q.questionText, options: q.options.length === 4 ? q.options : [...q.options, '', '', '', ''].slice(0, 4), correctAnswer: q.correctAnswer, explanation: q.explanation || '', marks: q.marks || 1 });
    setEditing(q._id);
    setShowForm(true);
  };

  const toggleSelect = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleImport = async () => {
    try {
      let res;
      if (importMode === 'json') { const data = JSON.parse(importData); res = await questionBankService.importJson(data.questions || data); }
      else { res = await questionBankService.importCsv(importData); }
      alert(`Imported: ${res.data.data.imported}, Failed: ${res.data.data.failed}`);
      setImportMode(null); setImportData(''); loadList();
    } catch (e) { alert('Import failed: ' + (e.response?.data?.message || e.message)); }
  };

  const subjectName = (code) => SUBJECTS.find(s => s.code === code)?.name || code;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Question Bank</h1>
          <p className="text-sm text-text3 mt-1">{totalByType.total} questions across {stats?.bySubject?.length || 0} subjects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)} className="btn-ghost text-xs" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#A78BFA' }}>Smart Import</button>
          <button onClick={() => { setImportMode('json'); setShowForm(false); setEditing(null); }} className="btn-ghost text-xs">Import</button>
          <button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); setImportMode(null); }} className="btn-primary text-xs">+ Add Question</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        <StatCard label="Total" value={totalByType.total} color="#A78BFA" sub={hasActiveFilters ? '(filtered)' : ''} />
        <StatCard label="Easy" value={totalByType.easy} color="#34D399" />
        <StatCard label="Medium" value={totalByType.medium} color="#FBBF24" />
        <StatCard label="Hard" value={totalByType.hard} color="#EF4444" />
        <StatCard label="MCQ" value={totalByType.mcq} color="#60A5FA" />
        <StatCard label="MSQ" value={totalByType.msq} color="#F472B6" />
        <StatCard label="NAT" value={totalByType.nat} color="#22D3EE" />
      </div>

      {/* View Toggle + Advanced Filters */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex gap-1 bg-bg-2 rounded-lg p-0.5 border border-border">
            {['grouped', 'list'].map(v => (
              <button key={v} onClick={() => { setView(v); setSelected([]); }} className={`text-[10px] px-3 py-1.5 rounded-md font-medium transition-all ${view === v ? 'bg-primary/15 text-primary' : 'text-text3 hover:text-text'}`}>
                {v === 'grouped' ? 'Grouped by Subject' : 'All Questions'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={loadDuplicates} className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-text3 hover:text-amber-400 hover:border-amber-500/30">🔍 Find Duplicates</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <input value={filters.search} onChange={e => updateFilter('search', e.target.value)} placeholder="Search Q/A, topic, subject..." className="col-span-2 sm:col-span-1 lg:col-span-2 bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-[11px] text-text" />
          <select value={filters.subject} onChange={e => updateFilter('subject', e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text">
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
          <select value={filters.difficulty} onChange={e => updateFilter('difficulty', e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text">
            <option value="">All Difficulty</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.questionType} onChange={e => updateFilter('questionType', e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text">
            <option value="">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={filters.topic} onChange={e => updateFilter('topic', e.target.value)} placeholder="Topic..." className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text" />
          <select value={filters.marks} onChange={e => updateFilter('marks', e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text">
            <option value="">All Marks</option>
            {[1, 2, 3, 4, 5].map(m => <option key={m} value={m}>{m} mark{m > 1 ? 's' : ''}</option>)}
          </select>
          {view === 'list' && (
            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text">
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && view === 'list' && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-[11px] text-primary font-semibold">{selected.length} selected</span>
          <button onClick={handleBulkDelete} className="text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">Delete</button>
          <select value={bulkSubjectTarget} onChange={e => setBulkSubjectTarget(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[10px] text-text">
            <option value="">Change Subject to...</option>
            {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
          {bulkSubjectTarget && <button onClick={handleBulkSubject} className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Apply</button>}
          <select value={bulkDiffTarget} onChange={e => setBulkDiffTarget(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-[10px] text-text">
            <option value="">Change Difficulty to...</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {bulkDiffTarget && <button onClick={handleBulkDifficulty} className="text-[10px] px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Apply</button>}
          <button onClick={() => setSelected([])} className="text-[10px] px-3 py-1.5 rounded-lg text-text3 hover:text-text">Clear</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading...</div>
      ) : view === 'grouped' ? (
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-text3 mb-4">No questions found matching filters</p>
              <button onClick={() => { setFilters({ search: '', subject: '', difficulty: '', questionType: '', topic: '', marks: '', sort: '-createdAt' }); setPage(1); }} className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                🔄 Reset All Filters
              </button>
            </div>
          ) : groups.map(g => (
            <div key={g._id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button onClick={() => setExpandedSubject(expandedSubject === g._id ? null : g._id)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">{subjectName(g._id)}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{g._id}</span>
                  </div>
                  <span className="text-xs text-text2 font-mono">{g.count} questions</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-[9px]">
                    <span style={{ color: '#34D399' }}>E: {g.easy}</span>
                    <span style={{ color: '#FBBF24' }}>M: {g.medium}</span>
                    <span style={{ color: '#EF4444' }}>H: {g.hard}</span>
                    <span className="text-text3">|</span>
                    <span style={{ color: '#60A5FA' }}>MCQ: {g.mcq}</span>
                    <span style={{ color: '#F472B6' }}>MSQ: {g.msq}</span>
                    <span style={{ color: '#22D3EE' }}>NAT: {g.nat}</span>
                  </div>
                  <span className={`transition-transform duration-200 ${expandedSubject === g._id ? 'rotate-90' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text3"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </span>
                </div>
              </button>

              {expandedSubject === g._id && (
                <SubjectQuestions subject={g._id} onEdit={editQuestion} onDelete={handleDelete} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-16"><p className="text-sm text-text3">No questions found</p></div>
          ) : (
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q._id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <input type="checkbox" checked={selected.includes(q._id)} onChange={() => toggleSelect(q._id)} className="accent-primary" />
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{q.subject}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                          background: q.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : q.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                          color: q.difficulty === 'hard' ? '#EF4444' : q.difficulty === 'medium' ? '#FBBF24' : '#34D399',
                        }}>{q.difficulty}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                          background: q.questionType === 'MSQ' ? 'rgba(244,114,182,0.1)' : q.questionType === 'NAT' ? 'rgba(34,211,238,0.1)' : 'rgba(96,165,250,0.1)',
                          color: q.questionType === 'MSQ' ? '#F472B6' : q.questionType === 'NAT' ? '#22D3EE' : '#60A5FA',
                        }}>{q.questionType || 'MCQ'}</span>
                        <span className="text-[9px] text-text3">{q.topic}</span>
                        <span className="text-[9px] text-text3">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-text font-medium leading-relaxed">{q.questionText}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.options.map((opt, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${i === q.correctAnswer ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-bg-2 text-text3 border border-border'}`}>
                            {i === q.correctAnswer && '✓ '}{opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => editQuestion(q)} className="text-[10px] px-2 py-1 rounded hover:bg-white/5 text-text2">Edit</button>
                      <button onClick={() => handleDelete(q._id)} className="text-[10px] px-2 py-1 rounded hover:bg-red-500/10 text-red-400">Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-30">Prev</button>
              <span className="text-xs text-text3 self-center">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-text">{editing ? 'Edit Question' : 'Add Question'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-text3 hover:text-text">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
                    {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Type</label>
                  <select value={form.questionType} onChange={e => setForm(f => ({ ...f, questionType: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
                    {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Marks</label>
                  <input type="number" min={1} max={5} value={form.marks} onChange={e => setForm(f => ({ ...f, marks: parseInt(e.target.value) || 1 }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Topic</label>
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Graph Theory" className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2 text-sm text-text" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Question</label>
                <textarea value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} rows={3} placeholder="Enter question text..." className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2 text-sm text-text resize-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Options</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button type="button" onClick={() => setForm(f => ({ ...f, correctAnswer: i }))} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.correctAnswer === i ? 'border-green-400 bg-green-400/20' : 'border-border'}`}>
                        {form.correctAnswer === i && <span className="w-2 h-2 rounded-full bg-green-400" />}
                      </button>
                      <input value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm(f => ({ ...f, options: o })); }} placeholder={`Option ${i + 1}`} className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text" />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-text3 mt-1">Green radio = correct answer</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Explanation (optional)</label>
                <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2 text-sm text-text resize-none" />
              </div>
              <button onClick={handleSave} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90">
                {editing ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Bulk Import */}
      {showBulk && (
        <BulkImporter
          onImport={async (questions) => {
            try {
              const qs = questions.map(q => ({ subject: q.subject, topic: q.topic, difficulty: q.difficulty, questionType: 'MCQ', questionText: q.question, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation }));
              const res = await questionBankService.importJson(qs);
              alert(`Imported: ${res.data.data.imported}, Failed: ${res.data.data.failed}`);
              setShowBulk(false); loadList();
            } catch (e) { alert('Import failed: ' + (e.response?.data?.message || e.message)); }
          }}
          onClose={() => setShowBulk(false)}
        />
      )}

      {/* Import Modal */}
      {importMode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-text">Import Questions</h3>
              <button onClick={() => setImportMode(null)} className="text-text3 hover:text-text">✕</button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setImportMode('json')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${importMode === 'json' ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>JSON</button>
              <button onClick={() => setImportMode('csv')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${importMode === 'csv' ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>CSV</button>
            </div>
            <textarea value={importData} onChange={e => setImportData(e.target.value)} rows={10} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-3 text-sm text-text font-mono resize-none mb-4" placeholder={importMode === 'json' ? '[{"subject":"DS","topic":"Graph Theory","questionText":"...","options":["a","b","c","d"],"correctAnswer":1}]' : 'subject,topic,questiontext,options,correctanswer,difficulty'} />
            <button onClick={handleImport} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90">Import</button>
          </div>
        </div>
      )}

      {/* Duplicates Modal */}
      {showDuplicates && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-text">Duplicate Questions ({duplicates.length})</h3>
              <button onClick={() => setShowDuplicates(false)} className="text-text3 hover:text-text">✕</button>
            </div>
            {duplicates.length === 0 ? (
              <p className="text-sm text-text3">No duplicates found</p>
            ) : (
              <div className="space-y-3">
                {duplicates.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold">{d.count}x duplicate</span>
                      <span className="text-[9px] text-text3">{d.subjects.join(', ')}</span>
                    </div>
                    <p className="text-xs text-text font-mono">{d._id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
      <p className="text-[9px] text-text3 uppercase tracking-wider font-medium">{label}</p>
      {sub && <p className="text-[8px] text-text3 mt-0.5">{sub}</p>}
    </div>
  );
}

function SubjectQuestions({ subject, onEdit, onDelete }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    import('../../services/adminApi').then(async ({ questionBankService }) => {
      try {
        const res = await questionBankService.list({ subject, limit: 200 });
        setQuestions(res.data.data || []);
      } catch (e) { toast.error('Failed to load questions'); } finally { setLoading(false); }
    });
  }, [subject]);

  if (loading) return <div className="px-4 pb-4 text-[11px] text-text3">Loading questions...</div>;
  if (questions.length === 0) return <div className="px-4 pb-4 text-[11px] text-text3">No questions</div>;

  return (
    <div className="border-t border-border">
      {questions.map(q => (
        <div key={q._id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-white/[0.015]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                  background: q.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : q.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                  color: q.difficulty === 'hard' ? '#EF4444' : q.difficulty === 'medium' ? '#FBBF24' : '#34D399',
                }}>{q.difficulty}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                  background: (q.questionType || 'MCQ') === 'MSQ' ? 'rgba(244,114,182,0.1)' : (q.questionType || 'MCQ') === 'NAT' ? 'rgba(34,211,238,0.1)' : 'rgba(96,165,250,0.1)',
                  color: (q.questionType || 'MCQ') === 'MSQ' ? '#F472B6' : (q.questionType || 'MCQ') === 'NAT' ? '#22D3EE' : '#60A5FA',
                }}>{q.questionType || 'MCQ'}</span>
                <span className="text-[9px] text-text3">{q.topic}</span>
                <span className="text-[9px] text-text3">{q.marks}m</span>
              </div>
              <p className="text-xs text-text">{q.questionText}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => onEdit(q)} className="text-[9px] px-2 py-1 rounded hover:bg-white/5 text-text2">Edit</button>
              <button onClick={() => onDelete(q._id)} className="text-[9px] px-2 py-1 rounded hover:bg-red-500/10 text-red-400">Del</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
