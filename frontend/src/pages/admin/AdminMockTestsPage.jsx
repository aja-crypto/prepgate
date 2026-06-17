import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMockTestService } from '../../services/adminApi';

const SUBJECT_OPTIONS = [
  'AL', 'DS', 'CD', 'CN', 'CO', 'DB', 'DL', 'EM', 'APT', 'OS', 'TOC',
];
const TYPE_OPTIONS = ['subject', 'topic', 'full'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];

export default function AdminMockTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', testType: '', difficulty: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    subject: 'AL', subjectName: 'Algorithms', testType: 'subject',
    topic: '', title: '', description: '', duration: 30, totalMarks: 25,
    questionCount: 10, difficulty: 'medium', topics: '',
  });

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.subject) params.subject = filter.subject;
      if (filter.testType) params.testType = filter.testType;
      if (filter.difficulty) params.difficulty = filter.difficulty;
      const res = await adminMockTestService.getAll(params);
      setTests(res.data.data || []);
    } catch (e) {
      setError('Failed to load mock tests.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const openCreate = () => {
    setEditingId(null);
    setForm({ subject: 'AL', subjectName: 'Algorithms', testType: 'subject', topic: '', title: '', description: '', duration: 30, totalMarks: 25, questionCount: 10, difficulty: 'medium', topics: '' });
    setShowModal(true);
  };

  const openEdit = (test) => {
    setEditingId(test._id);
    setForm({
      subject: test.subject, subjectName: test.subjectName || '',
      testType: test.testType || 'subject', topic: test.topic || '',
      title: test.title, description: test.description || '',
      duration: test.duration || 30, totalMarks: test.totalMarks || 25,
      questionCount: test.questionCount || 10, difficulty: test.difficulty || 'medium',
      topics: Array.isArray(test.topics) ? test.topics.join(', ') : (test.topics || ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    clearMsg();
    const payload = {
      ...form,
      topics: form.topics ? form.topics.split(',').map(t => t.trim()).filter(Boolean) : [],
      totalMarks: Number(form.totalMarks), questionCount: Number(form.questionCount), duration: Number(form.duration),
    };
    if (!payload.title) { setError('Title is required.'); return; }
    try {
      if (editingId) {
        await adminMockTestService.update(editingId, payload);
        setSuccess('Mock test updated.');
      } else {
        await adminMockTestService.create(payload);
        setSuccess('Mock test created.');
      }
      setShowModal(false);
      fetchTests();
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this mock test? Users will no longer see it.')) return;
    clearMsg();
    try {
      await adminMockTestService.delete(id);
      setSuccess('Mock test deactivated.');
      fetchTests();
    } catch (e) {
      setError('Delete failed.');
    }
  };

  const handleToggle = async (id, current) => {
    clearMsg();
    try {
      await adminMockTestService.toggle(id, !current);
      setSuccess(current ? 'Test deactivated.' : 'Test activated.');
      fetchTests();
    } catch (e) {
      setError('Toggle failed.');
    }
  };

  const getTypeBadge = (type) => {
    const colors = { subject: 'bg-blue-500/10 text-blue-400', topic: 'bg-purple-500/10 text-purple-400', full: 'bg-green-500/10 text-green-400' };
    return colors[type] || 'bg-gray-500/10 text-gray-400';
  };

  const getDifficultyBadge = (diff) => {
    const colors = { easy: 'bg-green-500/10 text-green-400', medium: 'bg-yellow-500/10 text-yellow-400', hard: 'bg-red-500/10 text-red-400' };
    return colors[diff] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">Mock Tests</h1>
          <p className="text-sm text-text3 mt-0.5">Manage pre-seeded mock tests and questions</p>
        </div>
        <button onClick={openCreate} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">
          + New Test
        </button>
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

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filter.subject} onChange={(e) => setFilter(f => ({ ...f, subject: e.target.value }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Subjects</option>
          {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.testType} onChange={(e) => setFilter(f => ({ ...f, testType: e.target.value }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.difficulty} onChange={(e) => setFilter(f => ({ ...f, difficulty: e.target.value }))} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text">
          <option value="">All Difficulties</option>
          {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-[11px] text-text3">{tests.length} test{tests.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading mock tests...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 text-sm text-text3">No mock tests found. Create one above.</div>
      ) : (
        <div className="space-y-2">
          {tests.map((test) => (
            <div key={test._id} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text truncate">{test.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadge(test.testType)}`}>{test.testType}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getDifficultyBadge(test.difficulty)}`}>{test.difficulty}</span>
                    {!test.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-yellow-500/10 text-yellow-400">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text3 flex-wrap">
                    <span className="font-medium text-text2">{test.subject}{test.subjectName ? ` - ${test.subjectName}` : ''}</span>
                    {test.testNumber && <span>Test #{test.testNumber}</span>}
                    <span>{test.questionCount || 0} questions</span>
                    <span>{test.duration || 30} min</span>
                    <span>{test.totalMarks || 0} marks</span>
                    {test.topic && <span>Topic: {test.topic}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(test)} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Edit">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  </button>
                  <button onClick={() => navigate(`/admin/mock-tests/${test._id}/questions`)} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Questions">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handleToggle(test._id, test.isActive)} className={`p-1.5 rounded-lg transition-colors ${test.isActive ? 'text-green-500 hover:bg-green-500/10' : 'text-text3 hover:text-yellow-400 hover:bg-yellow-500/10'}`} title={test.isActive ? 'Deactivate' : 'Activate'}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.5 5a1 1 0 011-1h2a1 1 0 010 2H5.5v7h1a1 1 0 010 2h-4a1 1 0 010-2h1V5zm8.707 2.293a1 1 0 00-1.414 1.414L12.086 10l-1.293 1.293a1 1 0 101.414 1.414L13.5 11.414l1.293 1.293a1 1 0 001.414-1.414L14.914 10l1.293-1.293a1 1 0 00-1.414-1.414L13.5 8.586l-1.293-1.293z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => handleDelete(test._id)} className="p-1.5 rounded-lg text-text3 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Deactivate">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-text mb-4">{editingId ? 'Edit Mock Test' : 'Create Mock Test'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Subject *</label>
                  <select value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                    {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Subject Name</label>
                  <input value={form.subjectName} onChange={(e) => setForm(f => ({ ...f, subjectName: e.target.value }))} placeholder="e.g. Algorithms" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Algorithms Subject Test - Medium" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Test Type</label>
                  <select value={form.testType} onChange={(e) => setForm(f => ({ ...f, testType: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Question Count</label>
                  <input type="number" value={form.questionCount} onChange={(e) => setForm(f => ({ ...f, questionCount: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={(e) => setForm(f => ({ ...f, totalMarks: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Topic (for topic tests)</label>
                <input value={form.topic} onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Asymptotic Analysis" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Topics (comma-separated)</label>
                <input value={form.topics} onChange={(e) => setForm(f => ({ ...f, topics: e.target.value }))} placeholder="e.g. Asymptotic Analysis, Sorting, Graphs" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} className="flex-1 text-xs px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">Save</button>
              <button onClick={() => setShowModal(false)} className="text-xs px-4 py-2.5 rounded-lg bg-bg-2 text-text3 border border-border hover:text-text transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
