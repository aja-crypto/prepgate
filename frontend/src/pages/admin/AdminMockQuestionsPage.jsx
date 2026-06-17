import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminMockTestService } from '../../services/adminApi';

const SUBJECT_OPTIONS = ['AL', 'DS', 'CD', 'CN', 'CO', 'DB', 'DL', 'EM', 'APT', 'OS', 'TOC'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const TOPIC_OPTIONS = [
  'Asymptotic Analysis', 'Sorting', 'Graph Algorithms', 'DP', 'Greedy', 'Divide & Conquer',
  'Arrays', 'Linked Lists', 'Stacks & Queues', 'Trees', 'BSTs', 'Heaps', 'Hashing',
  'Lexical Analysis', 'Parsing', 'SDT', 'Code Generation', 'OSI Model', 'TCP/IP', 'Network Layer',
  'Number Systems', 'ALU', 'Memory Hierarchy', 'Cache', 'Pipeline',
  'ER Model', 'Relational Model', 'SQL', 'Normalization', 'Transactions', 'Concurrency',
  'Boolean Algebra', 'K-Maps', 'Combinational Circuits', 'Sequential Circuits',
  'Linear Algebra', 'Probability', 'Calculus', 'Diff Eqs', 'Graph Theory',
  'Numerical Ability', 'Logical Reasoning', 'Data Interpretation',
  'Process Management', 'Memory Management', 'File Systems', 'Synchronization', 'Deadlocks',
  'Regular Languages', 'CFL & PDA', 'Turing Machines', 'Undecidability',
];

export default function AdminMockQuestionsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    subject: 'AL', topic: '', difficulty: 'medium',
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 0, explanation: '', marks: 1,
  });

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMockTestService.getQuestions(testId);
      setTestInfo(res.data.data.test);
      setQuestions(res.data.data.questions || []);
    } catch (e) {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const clearMsg = () => { setError(''); setSuccess(''); };

  const openCreate = () => {
    setEditingId(null);
    setForm({ subject: testInfo?.subject || 'AL', topic: '', difficulty: 'medium', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 0, explanation: '', marks: 1 });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingId(q._id);
    setForm({
      subject: q.subject || 'AL', topic: q.topic || '', difficulty: q.difficulty || 'medium',
      questionText: q.questionText || '',
      optionA: q.options?.[0] || '', optionB: q.options?.[1] || '',
      optionC: q.options?.[2] || '', optionD: q.options?.[3] || '',
      correctAnswer: q.correctAnswer ?? 0, explanation: q.explanation || '', marks: q.marks || 1,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    clearMsg();
    const options = [form.optionA, form.optionB, form.optionC, form.optionD].filter(Boolean);
    if (!form.questionText || options.length < 2) {
      setError('Question text and at least 2 options are required.');
      return;
    }
    const payload = {
      subject: form.subject, topic: form.topic, difficulty: form.difficulty,
      questionText: form.questionText, options,
      correctAnswer: Number(form.correctAnswer), explanation: form.explanation,
      marks: Number(form.marks) || 1,
    };
    try {
      if (editingId) {
        await adminMockTestService.updateQuestion(editingId, payload);
        setSuccess('Question updated.');
      } else {
        await adminMockTestService.createQuestion(payload);
        setSuccess('Question created.');
      }
      setShowModal(false);
      fetchQuestions();
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question permanently?')) return;
    clearMsg();
    try {
      await adminMockTestService.deleteQuestion(id);
      setSuccess('Question deleted.');
      fetchQuestions();
    } catch (e) {
      setError('Delete failed.');
    }
  };

  const optionLabel = (index) => String.fromCharCode(65 + index);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/mock-tests')} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-text">Questions</h1>
            <p className="text-sm text-text3 mt-0.5">{testInfo?.title || 'Loading...'} &middot; {questions.length} questions</p>
          </div>
        </div>
        <button onClick={openCreate} className="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">
          + New Question
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

      {loading ? (
        <div className="text-center py-12 text-sm text-text3">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-sm text-text3">No questions for this test. Add one above.</div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={q._id} className="bg-surface border border-border rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-text3 font-mono">#{idx + 1}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-500/10 text-purple-400">{q.subject}</span>
                    {q.topic && <span className="text-[10px] text-text3">{q.topic}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      q.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                      q.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{q.difficulty}</span>
                    <span className="text-[10px] text-text3">{q.marks || 1} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm text-text mt-1 line-clamp-2">{q.questionText}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(q.options || []).map((opt, oi) => (
                      <span key={oi} className={`text-[11px] px-2 py-0.5 rounded-full ${
                        oi === q.correctAnswer
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : 'bg-bg-2 text-text3 border border-border'
                      }`}>
                        {optionLabel(oi)}. {opt}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-[11px] text-text3 mt-2 line-clamp-1">{q.explanation}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg text-text3 hover:text-text hover:bg-bg-2 transition-colors" title="Edit">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(q._id)} className="p-1.5 rounded-lg text-text3 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
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
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-text mb-4">{editingId ? 'Edit Question' : 'New Question'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Subject *</label>
                  <select value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                    {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text3 mb-1">Marks</label>
                  <input type="number" value={form.marks} onChange={(e) => setForm(f => ({ ...f, marks: e.target.value }))} min={1} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Topic</label>
                <select value={form.topic} onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text">
                  <option value="">No topic</option>
                  {TOPIC_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Question Text *</label>
                <textarea value={form.questionText} onChange={(e) => setForm(f => ({ ...f, questionText: e.target.value }))} rows={3} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['optionA', 'optionB', 'optionC', 'optionD'].map((opt, oi) => (
                  <div key={opt}>
                    <label className="block text-[11px] text-text3 mb-1">Option {optionLabel(oi)} *</label>
                    <div className="flex items-center gap-2">
                      <input value={form[opt]} onChange={(e) => setForm(f => ({ ...f, [opt]: e.target.value }))} className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
                      <input type="radio" name="correctAnswer" checked={Number(form.correctAnswer) === oi} onChange={() => setForm(f => ({ ...f, correctAnswer: oi }))} className="accent-primary" title="Correct answer" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text3 -mt-2">Select the radio button next to the correct answer</p>
              <div>
                <label className="block text-[11px] text-text3 mb-1">Explanation</label>
                <textarea value={form.explanation} onChange={(e) => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text" />
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
