import { useState, useEffect } from 'react';
import adminApi, { adminFlashcardService } from '../../services/adminApi';
import toast from 'react-hot-toast';

const SUBJECTS = ['APT', 'DS', 'DBMS', 'OS', 'CN', 'CO', 'TOC', 'CD', 'AL'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminGateVaultPage() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState([]);
  const [monthlySets, setMonthlySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    subject: 'APT',
    topic: '',
    importanceScore: 5,
    difficulty: 'medium',
  });

  const [showSetModal, setShowSetModal] = useState(false);
  const [monthlySetForm, setMonthlySetForm] = useState({
    name: '',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: new Date().getFullYear(),
    monthName: MONTHS[new Date().getMonth()],
    subjectDistribution: { 'APT': 10, 'DS': 6, 'DBMS': 6, 'OS': 6, 'CN': 5, 'CO': 5, 'TOC': 4, 'CD': 4, 'AL': 4 },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fcRes, setRes] = await Promise.all([
        adminApi.get('/admin/gate-vault/flashcards'),
        adminApi.get('/admin/gate-vault/monthly-sets'),
      ]);
      if (fcRes.data.success) setFlashcards(fcRes.data.data);
      if (setRes.data.success) setMonthlySets(setRes.data.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    try {
      if (editingCard) {
        const res = await adminApi.put(`/admin/gate-vault/flashcards/${editingCard._id}`, form);
        if (res.data.success) {
          toast.success('Card updated');
          loadData();
        }
      } else {
        const res = await adminApi.post('/admin/gate-vault/flashcards', form);
        if (res.data.success) {
          toast.success('Card created');
          loadData();
        }
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      toast.error('Failed to save card');
    }
  };

  const handleDeleteCard = async (id) => {
    if (!confirm('Delete this card?')) return;
    try {
      const res = await adminApi.delete(`/admin/gate-vault/flashcards/${id}`);
      if (res.data.success) {
        toast.success('Card deleted');
        loadData();
      }
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const cards = JSON.parse(text);
        const res = await adminApi.post('/admin/gate-vault/flashcards/bulk', { cards });
        if (res.data.success) {
          toast.success(`Imported ${res.data.count} cards`);
          loadData();
        }
      } catch (e) {
        toast.error('Failed to import: ' + e.message);
      }
    };
    input.click();
  };

  const handleCreateSet = async () => {
    try {
      const res = await adminApi.post('/admin/gate-vault/monthly-sets', monthlySetForm);
      if (res.data.success) {
        toast.success('Monthly set created');
        loadData();
        setShowSetModal(false);
      }
    } catch (e) {
      toast.error('Failed to create set');
    }
  };

  const handlePublishSet = async (id) => {
    try {
      const res = await adminApi.post(`/admin/gate-vault/monthly-sets/${id}/publish`);
      if (res.data.success) {
        toast.success('Set published!');
        loadData();
      }
    } catch (e) {
      toast.error('Failed to publish');
    }
  };

  const resetForm = () => {
    setEditingCard(null);
    setForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      subject: 'APT',
      topic: '',
      importanceScore: 5,
      difficulty: 'medium',
    });
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setForm({
      question: card.question,
      options: card.options,
      correctAnswer: card.correctAnswer,
      explanation: card.explanation,
      subject: card.subject,
      topic: card.topic,
      importanceScore: card.importanceScore,
      difficulty: card.difficulty,
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">GateVault Management</h1>
          <p className="text-sm text-text3">Manage flashcards and publish monthly challenges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['flashcards', 'monthly-sets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-bg-2 text-text3 hover:text-text border border-border'
            }`}
          >
            {tab === 'flashcards' ? '📚 Flashcards' : '📅 Monthly Sets'}
          </button>
        ))}
      </div>

      {activeTab === 'flashcards' ? (
        <div>
          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
            >
              + Add Card
            </button>
            <button
              onClick={handleBulkImport}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-2 text-text border border-border hover:bg-bg-3"
            >
              📥 Bulk Import JSON
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {SUBJECTS.map(sub => {
              const count = flashcards.filter(c => c.subject === sub).length;
              return (
                <div key={sub} className="bg-bg-2 border border-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-purple-400">{count}</p>
                  <p className="text-xs text-text3">{sub}</p>
                </div>
              );
            })}
          </div>

          {/* Cards Table */}
          <div className="bg-bg-1 border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-2 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Question</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Subject</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Difficulty</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Score</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flashcards.slice(0, 50).map(card => (
                  <tr key={card._id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-text max-w-xs truncate">{card.question}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">{card.subject}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        card.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        card.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{card.difficulty}</span>
                    </td>
                    <td className="px-4 py-3 text-text3">{card.importanceScore}/10</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEditModal(card)} className="text-purple-400 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDeleteCard(card._id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowSetModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
            >
              + Create Monthly Set
            </button>
          </div>

          <div className="space-y-4">
            {monthlySets.map(set => (
              <div key={set._id} className="bg-bg-2 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text">{set.name}</h3>
                    <p className="text-sm text-text3">{set.monthName} {set.year} • {set.flashcardIds?.length || 0} questions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {set.isPublished ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">Published</span>
                    ) : (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">Draft</span>
                        <button
                          onClick={() => handlePublishSet(set._id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-500 hover:bg-purple-600"
                        >
                          Publish
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Card Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-text">{editingCard ? 'Edit Flashcard' : 'Add Flashcard'}</h3>
              <button onClick={() => setShowModal(false)} className="text-text3 hover:text-text">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Question</label>
                <textarea
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                  className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {form.options.map((opt, idx) => (
                  <div key={idx}>
                    <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">
                      Option {String.fromCharCode(65 + idx)}
                    </label>
                    <input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[idx] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }}
                      className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Correct Answer</label>
                  <select
                    value={form.correctAnswer}
                    onChange={e => setForm({ ...form, correctAnswer: parseInt(e.target.value) })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  >
                    {form.options.map((_, idx) => (
                      <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Importance (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.importanceScore}
                    onChange={e => setForm({ ...form, importanceScore: parseInt(e.target.value) })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Explanation</label>
                <textarea
                  value={form.explanation}
                  onChange={e => setForm({ ...form, explanation: e.target.value })}
                  className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSaveCard}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                {editingCard ? 'Update Card' : 'Create Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Monthly Set Modal */}
      {showSetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-text">Create Monthly Set</h3>
              <button onClick={() => setShowSetModal(false)} className="text-text3 hover:text-text">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Set Name</label>
                <input
                  value={monthlySetForm.name}
                  onChange={e => setMonthlySetForm({ ...monthlySetForm, name: e.target.value })}
                  placeholder="e.g., June 2026 Top 50"
                  className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Month</label>
                  <select
                    value={monthlySetForm.month}
                    onChange={e => setMonthlySetForm({ ...monthlySetForm, month: e.target.value, monthName: MONTHS[parseInt(e.target.value) - 1] })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  >
                    {MONTHS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Year</label>
                  <input
                    type="number"
                    value={monthlySetForm.year}
                    onChange={e => setMonthlySetForm({ ...monthlySetForm, year: parseInt(e.target.value) })}
                    className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-purple-500/60"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateSet}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                Create Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}