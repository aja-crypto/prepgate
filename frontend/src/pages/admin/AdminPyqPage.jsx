import { useState, useEffect, useCallback, useRef } from 'react';
import { adminPyqService } from '../../services/adminApi';

const SUBJECT_OPTIONS = [
  { code: 'AL', name: 'Algorithms' }, { code: 'DS', name: 'Data Structures' },
  { code: 'CD', name: 'Compiler Design' }, { code: 'CN', name: 'Computer Networks' },
  { code: 'CO', name: 'Computer Organization' }, { code: 'DB', name: 'DBMS' },
  { code: 'DL', name: 'Digital Logic' }, { code: 'EM', name: 'Engineering Maths' },
  { code: 'APT', name: 'Aptitude' }, { code: 'OS', name: 'Operating Systems' },
  { code: 'TOC', name: 'Theory of Computation' },
];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const TYPE_OPTIONS = ['MCQ', 'MSQ', 'NAT'];

const EMPTY_FORM = {
  title: '', subject: '', topic: '', year: new Date().getFullYear(),
  difficulty: 'medium', marks: 2, questionType: 'MCQ',
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: '', explanation: '', tags: '', source: 'GATE Official', paperSet: '',
};

export default function AdminPyqPage() {
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ subject: '', year: '', difficulty: '', questionType: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // OCR upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [uploadSubject, setUploadSubject] = useState('DB');
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [savingExtracted, setSavingExtracted] = useState(false);
  const fileInputRef = useRef(null);

  const fetchPyqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filter.page, limit: 30 };
      if (filter.subject) params.subject = filter.subject;
      if (filter.year) params.year = filter.year;
      if (filter.difficulty) params.difficulty = filter.difficulty;
      if (filter.questionType) params.questionType = filter.questionType;
      const res = await adminPyqService.getAll(params);
      setPyqs(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (e) {
      setError('Failed to load PYQs. MongoDB may be required.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminPyqService.getStats();
      setStats(res.data.data);
    } catch (e) { /* stats are non-critical */ }
  }, []);

  useEffect(() => { fetchPyqs(); }, [fetchPyqs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, year: new Date().getFullYear() });
    setShowModal(true);
  };

  const openEdit = (pyq) => {
    setEditingId(pyq._id);
    setForm({
      title: pyq.title || '', subject: pyq.subject?._id || pyq.subject || '',
      topic: pyq.topic?._id || pyq.topic || '', year: pyq.year || new Date().getFullYear(),
      difficulty: pyq.difficulty || 'medium', marks: pyq.marks || 2,
      questionType: pyq.questionType || 'MCQ', questionText: pyq.questionText || '',
      optionA: pyq.options?.[0]?.text || '', optionB: pyq.options?.[1]?.text || '',
      optionC: pyq.options?.[2]?.text || '', optionD: pyq.options?.[3]?.text || '',
      correctAnswer: pyq.correctAnswer || '', explanation: pyq.explanation || '',
      tags: Array.isArray(pyq.tags) ? pyq.tags.join(', ') : (pyq.tags || ''),
      source: pyq.source || 'GATE Official', paperSet: pyq.paperSet || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    clearMsg();
    const options = [];
    if (form.optionA) options.push({ key: 'A', text: form.optionA });
    if (form.optionB) options.push({ key: 'B', text: form.optionB });
    if (form.optionC) options.push({ key: 'C', text: form.optionC });
    if (form.optionD) options.push({ key: 'D', text: form.optionD });
    if (!form.title || !form.questionText) { setError('Title and question text are required.'); return; }
    const payload = {
      title: form.title, subject: form.subject, topic: form.topic || undefined,
      year: Number(form.year), difficulty: form.difficulty, marks: Number(form.marks),
      questionType: form.questionType, questionText: form.questionText,
      options, correctAnswer: form.correctAnswer || undefined,
      explanation: form.explanation,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      source: form.source, paperSet: form.paperSet,
    };
    try {
      if (editingId) { await adminPyqService.update(editingId, payload); setSuccess('PYQ updated.'); }
      else { await adminPyqService.create(payload); setSuccess('PYQ created.'); }
      setShowModal(false); fetchPyqs(); fetchStats();
    } catch (e) { setError(e.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this PYQ?')) return;
    clearMsg();
    try { await adminPyqService.delete(id); setSuccess('PYQ deactivated.'); fetchPyqs(); fetchStats(); }
    catch (e) { setError('Delete failed.'); }
  };

  const handleToggle = async (id, current) => {
    clearMsg();
    try { await adminPyqService.toggle(id, !current); setSuccess(current ? 'Deactivated.' : 'Activated.'); fetchPyqs(); fetchStats(); }
    catch (e) { setError('Toggle failed.'); }
  };

  const handleBulkImport = async () => {
    clearMsg();
    let questions;
    try { questions = JSON.parse(importText); if (!Array.isArray(questions)) throw new Error('Must be an array'); }
    catch (e) { setError('Invalid JSON.'); return; }
    setImporting(true);
    try {
      const res = await adminPyqService.bulkImport(questions);
      setSuccess(`Imported ${res.data.created}/${res.data.total} questions.${res.data.errors ? ` ${res.data.errors.length} errors.` : ''}`);
      setShowImport(false); setImportText(''); fetchPyqs(); fetchStats();
    } catch (e) { setError(e.response?.data?.message || 'Import failed.'); }
    finally { setImporting(false); }
  };

  // ─── OCR Upload ───────────────────────────────────────────
  const handleUploadPdf = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Only PDF files allowed.'); return; }
    clearMsg();
    setUploading(true);
    setUploadProgress(0);
    setOcrResult(null);
    setExtractedQuestions([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectCode', uploadSubject);
    formData.append('year', String(uploadYear));

    try {
      const res = await adminPyqService.uploadPdf(formData, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      const qs = res.data.data.questions || [];
      setExtractedQuestions(qs.map((q, i) => ({ ...q, _tempId: `q_${i}` })));
      setOcrResult(res.data.data);
      setSuccess(`Extracted ${qs.length} questions from PDF. Verify and save.`);
    } catch (e) {
      setError(e.response?.data?.message || 'OCR processing failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateExtracted = (tempId, field, value) => {
    setExtractedQuestions(prev => prev.map(q => q._tempId === tempId ? { ...q, [field]: value } : q));
  };

  const updateExtractedOption = (tempId, optIdx, key, value) => {
    setExtractedQuestions(prev => prev.map(q => {
      if (q._tempId !== tempId) return q;
      const opts = [...(q.options || [])];
      if (!opts[optIdx]) opts[optIdx] = { key: String.fromCharCode(65 + optIdx), text: '' };
      opts[optIdx] = { ...opts[optIdx], [key]: value };
      return { ...q, options: opts };
    }));
  };

  const removeExtracted = (tempId) => {
    setExtractedQuestions(prev => prev.filter(q => q._tempId !== tempId));
  };

  const handleSaveExtracted = async () => {
    clearMsg();
    const valid = extractedQuestions.filter(q => q.questionText?.trim());
    if (valid.length === 0) { setError('No valid questions to save.'); return; }
    setSavingExtracted(true);
    try {
      const res = await adminPyqService.saveExtracted(valid.map(q => {
        const { _tempId, ...rest } = q;
        return rest;
      }));
      setSuccess(`Saved ${res.data.created}/${res.data.total} questions.`);
      setShowUpload(false);
      setOcrResult(null);
      setExtractedQuestions([]);
      fetchPyqs(); fetchStats();
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed.');
    } finally {
      setSavingExtracted(false);
    }
  };

  const getTypeBadge = (type) => {
    const colors = { MCQ: 'bg-blue-500/10 text-blue-400', MSQ: 'bg-purple-500/10 text-purple-400', NAT: 'bg-green-500/10 text-green-400' };
    return colors[type] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">PYQ Management</h1>
          <p className="text-sm text-text3 mt-0.5">Previous Year Questions &middot; {stats ? `${stats.totalCount} total, ${stats.activeCount} active` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); setShowUpload(false); }} className="text-xs px-4 py-2 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text transition-colors">Bulk Import</button>
          <button onClick={() => { setShowUpload(true); setShowImport(false); setUploadSubject('DB'); setUploadYear(new Date().getFullYear()); }} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">Upload PDF</button>
          <button onClick={openCreate} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">+ New PYQ</button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">&times;</button>
        </div>
      )}
      {success && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">&times;</button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-xl px-4 py-3"><div className="text-[11px] text-text3">Total PYQs</div><div className="text-lg font-bold text-text">{stats.totalCount}</div></div>
          <div className="bg-surface border border-border rounded-xl px-4 py-3"><div className="text-[11px] text-text3">Active</div><div className="text-lg font-bold text-green-400">{stats.activeCount}</div></div>
          <div className="bg-surface border border-border rounded-xl px-4 py-3"><div className="text-[11px] text-text3">Inactive</div><div className="text-lg font-bold text-yellow-400">{stats.totalCount - stats.activeCount}</div></div>
          <div className="bg-surface border border-border rounded-xl px-4 py-3"><div className="text-[11px] text-text3">Subjects</div><div className="text-lg font-bold text-text">{stats.bySubject?.length || 0}</div></div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filter.subject} onChange={(e) => setFilter(f => ({ ...f, subject: e.target.value, page: 1 }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Subjects</option>
          {SUBJECT_OPTIONS.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
        </select>
        <input value={filter.year} onChange={(e) => setFilter(f => ({ ...f, year: e.target.value, page: 1 }))} placeholder="Year..." className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder-text3 w-20" />
        <select value={filter.difficulty} onChange={(e) => setFilter(f => ({ ...f, difficulty: e.target.value, page: 1 }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Difficulties</option>
          {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.questionType} onChange={(e) => setFilter(f => ({ ...f, questionType: e.target.value, page: 1 }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[11px] text-text3">{pyqs.length} on this page</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading PYQs...</div>
      ) : pyqs.length === 0 ? (
        <div className="text-center py-12 text-sm text-text3">No PYQs found. Create one, upload a PDF, or import a batch.</div>
      ) : (
        <div className="space-y-2">
          {pyqs.map((pyq) => (
            <div key={pyq._id} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text truncate">{pyq.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadge(pyq.questionType)}`}>{pyq.questionType}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pyq.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' : pyq.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{pyq.difficulty}</span>
                    {!pyq.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-yellow-500/10 text-yellow-400">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text3 flex-wrap">
                    <span className="font-medium text-text2">{pyq.subject?.name || pyq.subject?.code || pyq.subject}</span>
                    {pyq.topic?.name && <span>{pyq.topic.name}</span>}
                    <span>{pyq.year}</span>
                    <span>{pyq.marks} mark{pyq.marks !== 1 ? 's' : ''}</span>
                    {pyq.stats && <span>Attempts: {pyq.stats.totalAttempts || 0}</span>}
                  </div>
                  <p className="text-xs text-text2 mt-1 line-clamp-1">{pyq.questionText}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(pyq)} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Edit"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                  <button onClick={() => handleToggle(pyq._id, pyq.isActive)} className={`p-1.5 rounded-lg transition-colors ${pyq.isActive ? 'text-green-500 hover:bg-green-500/10' : 'text-text3 hover:text-yellow-400 hover:bg-yellow-500/10'}`} title={pyq.isActive ? 'Deactivate' : 'Activate'}><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.5 5a1 1 0 011-1h2a1 1 0 010 2H5.5v7h1a1 1 0 010 2h-4a1 1 0 010-2h1V5zm8.707 2.293a1 1 0 00-1.414 1.414L12.086 10l-1.293 1.293a1 1 0 101.414 1.414L13.5 11.414l1.293 1.293a1 1 0 001.414-1.414L14.914 10l1.293-1.293a1 1 0 00-1.414-1.414L13.5 8.586l-1.293-1.293z" clipRule="evenodd" /></svg></button>
                  <button onClick={() => handleDelete(pyq._id)} className="p-1.5 rounded-lg text-text3 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Deactivate"><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))} className="text-xs px-3 py-1.5 rounded-lg bg-bg-2 text-text3 border border-border disabled:opacity-40 hover:text-text transition-colors">Previous</button>
          <span className="text-xs text-text3">Page {filter.page} of {totalPages}</span>
          <button disabled={filter.page >= totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))} className="text-xs px-3 py-1.5 rounded-lg bg-bg-2 text-text3 border border-border disabled:opacity-40 hover:text-text transition-colors">Next</button>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => { if (!uploading && !savingExtracted) setShowUpload(false); }}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {!ocrResult ? (
              <>
                <h2 className="text-base font-bold text-text mb-4">Upload PDF for OCR Extraction</h2>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-text3">Subject:</label>
                    <select value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text">
                      {SUBJECT_OPTIONS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-text3">Year:</label>
                    <input type="number" value={uploadYear} onChange={(e) => setUploadYear(Number(e.target.value))} className="bg-bg-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text w-20" />
                  </div>
                </div>
                <div
                  className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => handleUploadPdf(e.target.files[0])} />
                  {uploading ? (
                    <div className="space-y-2">
                      <div className="text-sm text-text2">Processing PDF... {uploadProgress}%</div>
                      <div className="w-full max-w-xs mx-auto h-2 bg-bg-3 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-text3">OCR extraction in progress. This may take a moment.</p>
                    </div>
                  ) : (
                    <div className="text-sm text-text3">
                      <span className="text-primary font-semibold">Click to upload</span> a GATE PYQ PDF
                      <br /><span className="text-[11px]">50 MB max. Questions are extracted via OCR — verify before saving.</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowUpload(false)} disabled={uploading} className="text-xs px-4 py-2.5 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text disabled:opacity-40 transition-colors">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-text">Verify Extracted Questions</h2>
                    <p className="text-[11px] text-text3">{extractedQuestions.length} questions extracted. Edit or remove any that are incorrect.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text3">{extractedQuestions.filter(q => q.questionText?.trim()).length} valid</span>
                    <button onClick={handleSaveExtracted} disabled={savingExtracted || extractedQuestions.filter(q => q.questionText?.trim()).length === 0} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
                      {savingExtracted ? 'Saving...' : `Save ${extractedQuestions.filter(q => q.questionText?.trim()).length} Questions`}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {extractedQuestions.map((q, idx) => (
                    <div key={q._tempId} className="bg-bg-2 border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] text-text3 font-mono shrink-0">#{idx + 1}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={q.questionType} onChange={(e) => updateExtracted(q._tempId, 'questionType', e.target.value)} className="bg-bg border border-border rounded px-1.5 py-0.5 text-[10px] text-text">
                            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select value={q.difficulty} onChange={(e) => updateExtracted(q._tempId, 'difficulty', e.target.value)} className="bg-bg border border-border rounded px-1.5 py-0.5 text-[10px] text-text">
                            {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select value={q.marks} onChange={(e) => updateExtracted(q._tempId, 'marks', Number(e.target.value))} className="bg-bg border border-border rounded px-1.5 py-0.5 text-[10px] text-text">
                            <option value={1}>1 mark</option>
                            <option value={2}>2 marks</option>
                          </select>
                          <input value={q.year} onChange={(e) => updateExtracted(q._tempId, 'year', Number(e.target.value))} className="bg-bg border border-border rounded px-1.5 py-0.5 text-[10px] text-text w-14" placeholder="Year" />
                          <input value={q.correctAnswer || ''} onChange={(e) => updateExtracted(q._tempId, 'correctAnswer', e.target.value)} className="bg-bg border border-border rounded px-1.5 py-0.5 text-[10px] text-text w-16" placeholder="Answer" />
                          <button onClick={() => removeExtracted(q._tempId)} className="text-red-400 hover:text-red-300 p-0.5"><svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        </div>
                      </div>
                      <textarea value={q.questionText} onChange={(e) => updateExtracted(q._tempId, 'questionText', e.target.value)} rows={2} className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text mb-2" placeholder="Question text..." />
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map(oi => {
                          const opt = q.options?.[oi];
                          const label = String.fromCharCode(65 + oi);
                          return (
                            <div key={oi} className="flex items-center gap-1">
                              <span className="text-[10px] text-text3 shrink-0">{label}.</span>
                              <input value={opt?.text || ''} onChange={(e) => updateExtractedOption(q._tempId, oi, 'text', e.target.value)} className="flex-1 bg-bg border border-border rounded px-1.5 py-1 text-[10px] text-text" placeholder={`Option ${label}`} />
                            </div>
                          );
                        })}
                      </div>
                      <textarea value={q.explanation || ''} onChange={(e) => updateExtracted(q._tempId, 'explanation', e.target.value)} rows={1} className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-text3 mt-2" placeholder="Explanation (optional)" />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setShowUpload(false); setOcrResult(null); setExtractedQuestions([]); }} disabled={savingExtracted} className="text-xs px-4 py-2.5 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text disabled:opacity-40 transition-colors">Discard</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-text mb-4">{editingId ? 'Edit PYQ' : 'New PYQ'}</h2>
            <div className="space-y-3">
              <div><label className="block text-[11px] text-text3 mb-1">Title *</label><input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. FCFS Convoy Effect" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-text3 mb-1">Subject *</label><select value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text"><option value="">Select...</option>{SUBJECT_OPTIONS.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}</select></div>
                <div><label className="block text-[11px] text-text3 mb-1">Year *</label><input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] text-text3 mb-1">Type</label><select value={form.questionType} onChange={(e) => setForm(f => ({ ...f, questionType: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">{TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-[11px] text-text3 mb-1">Difficulty</label><select value={form.difficulty} onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">{DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-[11px] text-text3 mb-1">Marks</label><select value={form.marks} onChange={(e) => setForm(f => ({ ...f, marks: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text"><option value={1}>1 mark</option><option value={2}>2 marks</option></select></div>
              </div>
              <div><label className="block text-[11px] text-text3 mb-1">Question Text *</label><textarea value={form.questionText} onChange={(e) => setForm(f => ({ ...f, questionText: e.target.value }))} rows={3} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              <div className="grid grid-cols-2 gap-3">{['optionA', 'optionB', 'optionC', 'optionD'].map((opt, oi) => { const label = String.fromCharCode(65 + oi); return (<div key={opt}><label className="block text-[11px] text-text3 mb-1">Option {label}</label><input value={form[opt]} onChange={(e) => setForm(f => ({ ...f, [opt]: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>); })}</div>
              <div><label className="block text-[11px] text-text3 mb-1">Correct Answer</label><input value={form.correctAnswer} onChange={(e) => setForm(f => ({ ...f, correctAnswer: e.target.value }))} placeholder="e.g. B for MCQ, 42 for NAT, A,C for MSQ" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              <div><label className="block text-[11px] text-text3 mb-1">Explanation</label><textarea value={form.explanation} onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-text3 mb-1">Tags</label><input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="scheduling, fcfs" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
                <div><label className="block text-[11px] text-text3 mb-1">Source</label><input value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} className="flex-1 text-xs px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">Save</button>
              <button onClick={() => setShowModal(false)} className="text-xs px-4 py-2.5 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowImport(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-text mb-2">Bulk Import PYQs</h2>
            <p className="text-[11px] text-text3 mb-4">Paste a JSON array of PYQ objects.</p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={10} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text font-mono" placeholder='[{...}]' />
            <div className="flex gap-2 mt-4">
              <button onClick={handleBulkImport} disabled={importing || !importText.trim()} className="flex-1 text-xs px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">{importing ? 'Importing...' : 'Import'}</button>
              <button onClick={() => setShowImport(false)} className="text-xs px-4 py-2.5 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
