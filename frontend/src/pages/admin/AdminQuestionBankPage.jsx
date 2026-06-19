import { useState, useEffect, useCallback } from 'react';
import { questionBankService } from '../../services/adminApi';

const SUBJECT_CODES = [
  { code: 'APT', name: 'Aptitude' },
  { code: 'EM', name: 'Engineering Mathematics' },
  { code: 'DL', name: 'Digital Logic' },
  { code: 'CO', name: 'Computer Organization' },
  { code: 'DS', name: 'Data Structures' },
  { code: 'AL', name: 'Algorithms' },
  { code: 'OS', name: 'Operating Systems' },
  { code: 'DB', name: 'Databases' },
  { code: 'CN', name: 'Computer Networks' },
  { code: 'TOC', name: 'Theory of Computation' },
  { code: 'CD', name: 'Compiler Design' },
];

const EMPTY_FORM = { subject: 'APT', topic: '', difficulty: 'medium', questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: 1 };

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importMode, setImportMode] = useState(null);
  const [importData, setImportData] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (subjectFilter) params.subject = subjectFilter;
      const res = await questionBankService.list(params);
      setQuestions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {} finally { setLoading(false); }
  }, [page, search, subjectFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    questionBankService.stats().then(r => setStats(r.data.data)).catch(() => {});
  }, []);

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
      load();
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await questionBankService.delete(id); load(); } catch {}
  };

  const handleImport = async () => {
    try {
      let res;
      if (importMode === 'json') {
        const data = JSON.parse(importData);
        res = await questionBankService.importJson(data.questions || data);
      } else {
        res = await questionBankService.importCsv(importData);
      }
      alert(`Imported: ${res.data.data.imported}, Failed: ${res.data.data.failed}`);
      setImportMode(null);
      setImportData('');
      load();
    } catch (e) { alert('Import failed: ' + (e.response?.data?.message || e.message)); }
  };

  const editQuestion = (q) => {
    setForm({ subject: q.subject, topic: q.topic, difficulty: q.difficulty, questionText: q.questionText, options: q.options.length === 4 ? q.options : [...q.options, '', '', '', ''].slice(0, 4), correctAnswer: q.correctAnswer, explanation: q.explanation || '', marks: q.marks || 1 });
    setEditing(q._id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Question Bank</h1>
          <p className="text-sm text-text3 mt-1">
            {stats ? `${stats.total} questions · ${stats.bySubject?.length || 0} subjects` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setImportMode('json'); setShowForm(false); setEditing(null); }} className="btn-ghost text-xs">Import</button>
          <button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); setImportMode(null); }} className="btn-primary text-xs">+ Add Question</button>
        </div>
      </div>

      {/* Stats bars */}
      {stats?.bySubject?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {stats.bySubject.slice(0, 10).map(s => (
            <div key={s._id} className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)', color: '#A78BFA' }}>
              {s._id}: {s.count}
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search questions..." className="flex-1 bg-bg-2 border border-border rounded-lg px-4 py-2 text-sm text-text" />
        <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1); }} className="bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
          <option value="">All Subjects</option>
          {(stats?.bySubject || []).map(s => <option key={s._id} value={s._id}>{s._id}</option>)}
        </select>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-3">📝</div>
          <p className="text-sm text-text3">No questions found. Add your first question!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q._id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{q.subject}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                      background: q.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : q.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                      color: q.difficulty === 'hard' ? '#EF4444' : q.difficulty === 'medium' ? '#FBBF24' : '#34D399',
                    }}>{q.difficulty}</span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-30">Prev</button>
          <span className="text-xs text-text3 self-center">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-30">Next</button>
        </div>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
                    {SUBJECT_CODES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text3 font-semibold block mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text">
                    {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
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
            <textarea value={importData} onChange={e => setImportData(e.target.value)} rows={10} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-3 text-sm text-text font-mono resize-none mb-4" placeholder={importMode === 'json' ? '[{"subject":"DS","topic":"Graph Theory","questionText":"...","options":["a","b","c","d"],"correctAnswer":1}]' : 'subject,topic,questiontext,options,correctanswer,difficulty\nDS,"Graph Theory","What is a tree?","A|B|C|D",1,easy'} />
            <button onClick={handleImport} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90">Import</button>
          </div>
        </div>
      )}
    </div>
  );
}
