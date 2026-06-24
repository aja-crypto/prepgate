import { useState, useEffect, useRef, useCallback } from 'react';
import adminApi, { adminFlashcardService, adminPyqService, adminMockTestService } from '../../services/adminApi';
import toast from 'react-hot-toast';

const SUBJECTS = [
  { code: 'APT', name: 'Aptitude' }, { code: 'EM', name: 'Engineering Mathematics' },
  { code: 'DS', name: 'Programming & Data Structures' }, { code: 'AL', name: 'Algorithms' },
  { code: 'DB', name: 'DBMS' }, { code: 'OS', name: 'Operating Systems' },
  { code: 'CN', name: 'Computer Networks' }, { code: 'TOC', name: 'Theory of Computation' },
  { code: 'CD', name: 'Compiler Design' }, { code: 'CO', name: 'Computer Organization' },
  { code: 'DL', name: 'Digital Logic' }, { code: 'SE', name: 'Software Engineering' },
];

const CATEGORIES = ['Notes', 'PYQ', 'Formula Sheet', 'Short Notes', 'Reference', 'Question Bank', 'Other'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function detectSubject(fileName) {
  const upper = fileName.toUpperCase();
  for (const s of SUBJECTS) {
    if (upper.includes(s.code) || upper.includes(s.name.toUpperCase().slice(0, 4))) return s.code;
  }
  if (upper.includes('MATH') || upper.includes('MATHS') || upper.includes('ENGG')) return 'EM';
  if (upper.includes('PROG') || upper.includes('C++') || upper.includes('JAVA') || upper.includes('PYTHON')) return 'DS';
  if (upper.includes('NETWORK') || upper.includes('COMPUTER NET')) return 'CN';
  if (upper.includes('OPERAT') || upper.includes('OS')) return 'OS';
  if (upper.includes('DATABASE') || upper.includes('DBMS') || upper.includes('SQL')) return 'DB';
  if (upper.includes('ALGO')) return 'AL';
  return 'APT';
}

function detectCategory(fileName) {
  const upper = fileName.toUpperCase();
  if (upper.includes('PYQ') || upper.includes('PREVIOUS') || upper.includes('PAST')) return 'PYQ';
  if (upper.includes('FORMULA') || upper.includes('FORMULAE')) return 'Formula Sheet';
  if (upper.includes('SHORT') || upper.includes('QUICK')) return 'Short Notes';
  if (upper.includes('NOTES') || upper.includes('NOTE')) return 'Notes';
  if (upper.includes('QB') || upper.includes('QUESTION')) return 'Question Bank';
  if (upper.includes('REF')) return 'Reference';
  return 'Notes';
}

function detectTopic(fileName) {
  const cleaned = fileName.replace(/\.\w+$/, '').replace(/[_-]/g, ' ');
  const parts = cleaned.split(/\s+/);
  const skipWords = new Set(['notes', 'pyq', 'formula', 'sheet', 'short', 'gate', 'GateApex', 'apt', 'em', 'ds', 'al', 'db', 'os', 'cn', 'toc', 'cd', 'co', 'dl', 'se', 'pdf', 'questions', 'question', 'bank']);
  const filtered = parts.filter(p => p.length > 2 && !skipWords.has(p.toLowerCase()));
  if (filtered.length > 0) {
    return filtered.slice(0, 3).join(' ');
  }
  return '';
}

export default function AdminGateVaultPage() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState([]);
  const [monthlySets, setMonthlySets] = useState([]);
  const [showSetModal, setShowSetModal] = useState(false);
  const [monthlySetForm, setMonthlySetForm] = useState({ name: '', monthName: 'July', month: '07', year: 2026 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // modals
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', subject: 'APT', topic: '', importanceScore: 5, difficulty: 'medium', category: '', fileType: '', fileName: '' });

  // Smart Import (copy-paste question parser)
  const [smartImportText, setSmartImportText] = useState('');
  const [smartImportPreview, setSmartImportPreview] = useState([]);
  const [smartImportDiagrams, setSmartImportDiagrams] = useState([]);
  const smartImportFileRef = useRef(null);

  // Smart Upload states - text-based interface
  const [isImporting, setIsImporting] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');

  // Traditional upload (kept for backward compatibility)
  const [dragOver, setDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const newItems = files.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type.includes('pdf') ? 'pdf' : 'image',
      subject: detectSubject(f.name),
      category: detectCategory(f.name),
      topic: detectTopic(f.name),
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type.includes('pdf') ? 'pdf' : 'image',
      subject: detectSubject(f.name),
      category: detectCategory(f.name),
      topic: detectTopic(f.name),
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
  };

  const removeFromQueue = (idx) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQueueItem = (idx, field, value) => {
    setUploadQueue(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleUpload = async () => {
    if (uploadQueue.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      const items = uploadQueue.map((item, idx) => ({
        file: item.file,
        name: item.name,
        size: item.size,
        type: item.type,
        subject: item.subject,
        category: item.category,
        topic: item.topic,
        importanceScore: 5,
        difficulty: 'medium',
      }));
      items.forEach(item => { formData.append('files', item.file); });
      formData.append('metadata', JSON.stringify(items));

      const res = await adminApi.post('/admin/gate-vault/flashcards/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      if (res.data.success) { loadData(); setUploadQueue([]); }
    } catch (e) { toast.error('Upload failed'); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (subjectFilter) params.subject = subjectFilter;
      if (categoryFilter) params.category = categoryFilter;
      const [fcRes, setRes] = await Promise.all([
        adminApi.get('/admin/gate-vault/flashcards', { params }),
        adminApi.get('/admin/gate-vault/monthly-sets'),
      ]);
      if (fcRes.data.success) setFlashcards(fcRes.data.data || []);
      if (setRes.data.success) setMonthlySets(setRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load questions. Please try again.');
    } finally { setLoading(false); }
  }, [search, subjectFilter, categoryFilter]);

  // Smart Upload functions - text-based question parsing
  // IMPORTANT: Metadata ONLY comes from explicit headers. No keyword guessing.
  const parseQuestions = (text) => {
    const questions = [];
    
    // Split into blocks - each block represents one complete question
    // Split by double newline or by "Subject:" at start of line (after first)
    const blocks = text.split(/\n\s*\n(?=Subject:)/i);
    // If no double newline split worked, try splitting by "Subject:" at line start
    if (blocks.length === 1) {
      // Single block, try to split by lines starting with Subject:
      const singleBlock = blocks[0];
      const subjectSplits = singleBlock.split(/(?=^Subject:)/m).filter(b => b.trim());
      if (subjectSplits.length > 1) {
        blocks.splice(0, 1, ...subjectSplits);
      }
    }
    
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) continue;

      // Extract metadata ONLY from this block's explicit headers
      const getField = (prefix) => {
        const line = lines.find(l => l.toLowerCase().startsWith(prefix.toLowerCase()));
        return line ? line.substring(prefix.length).trim() : '';
      };

      const subject = getField('Subject:') || getField('Subject :') || getField('subject:') || '';
      const topic = getField('Topic:') || getField('Topic :') || getField('topic:') || '';
      const difficulty = getField('Difficulty:') || getField('Difficulty :') || getField('difficulty:') || '';
      const year = getField('Year:') || getField('Year :') || getField('year:') || '';
      const marks = getField('Marks:') || getField('Marks :') || getField('marks:') || '';
      const questionType = getField('Question Type:') || getField('Question Type :') || getField('Type:') || '';

      // Question text is everything before the first Option/Answer/Explanation line
      const optionStartIdx = lines.findIndex(l => /^[A-D]\)/i.test(l) || l.toLowerCase().startsWith('option'));
      const answerIdx = lines.findIndex(l => l.toLowerCase().startsWith('answer:'));
      const explanationIdx = lines.findIndex(l => l.toLowerCase().startsWith('explanation:'));
      
      const metaEnd = Math.min(
        optionStartIdx >= 0 ? optionStartIdx : lines.length,
        answerIdx >= 0 ? answerIdx : lines.length,
        explanationIdx >= 0 ? explanationIdx : lines.length
      );
      
      const questionLines = lines.slice(0, metaEnd > 0 ? metaEnd : undefined);
      // Remove any header lines from question text
      const questionText = questionLines
        .filter(l => !l.toLowerCase().startsWith('subject') && !l.toLowerCase().startsWith('topic') && 
                     !l.toLowerCase().startsWith('difficulty') && !l.toLowerCase().startsWith('year') &&
                     !l.toLowerCase().startsWith('marks') && !l.toLowerCase().startsWith('type'))
        .join('\n')
        .replace(/^Subject:.*/i, '').replace(/^Topic:.*/i, '').replace(/^Difficulty:.*/i, '')
        .replace(/^Year:.*/i, '').replace(/^Marks:.*/i, '').replace(/^Question Type:.*/i, '')
        .trim();

      // Options: collect A) B) C) D) lines
      const options = [];
      let correctAnswer = '';
      
      for (const line of lines) {
        const optMatch = line.match(/^([A-D])[\)\.:][ \t]*(.*)/i);
        if (optMatch) {
          options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
        }
      }

      // Answer: find "Answer: X" or "Correct Answer: X" in this block
      const answerLine = lines.find(l => /^Answer:/.test(l) || /^Correct Answer:/.test(l));
      if (answerLine) {
        const m = answerLine.match(/Answer:?\s*([A-D])\b/i);
        if (m) correctAnswer = m[1].toUpperCase();
      }

      // Explanation
      let explanation = '';
      const expLine = lines.find(l => l.toLowerCase().startsWith('explanation:'));
      if (expLine) {
        explanation = expLine.replace(/^Explanation:?\s*/i, '').trim();
      }

      // Only add if we actually found a question
      if (questionText || options.length > 0) {
        questions.push({
          question: questionText || '(no question text)',
          options,
          correctAnswer,
          explanation,
          subject: subject.toUpperCase(),
          topic,
          difficulty: difficulty.toLowerCase(),
          year,
          marks: marks || '2',
          questionType: questionType || 'MCQ',
        });
      }
    }

    return questions;
  };

  const handleSmartImportParse = () => {
    if (!smartImportText.trim()) return;
    
    const parsed = parseQuestions(smartImportText);
    setSmartImportPreview(parsed);
    
    if (parsed.length > 0) {
      const missingSubjects = parsed.filter(q => !q.subject).map((_, i) => i + 1);
      const missingTopics = parsed.filter(q => !q.topic).map((_, i) => i + 1);
      
      if (missingSubjects.length > 0) {
        toast.error(`Subject missing in question(s): ${missingSubjects.join(', ')}`);
      } else if (missingTopics.length > 0) {
        toast.warning(`Topic missing in question(s): ${missingTopics.join(', ')}`);
      } else {
        toast.success(`✅ Parsed ${parsed.length} questions`);
      }
    } else {
      toast.error('❌ No questions found. Check format (use "Question:" to start each block)');
    }
  };

  const handleInlineEdit = (index, field, value) => {
    setSmartImportPreview(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleInlineEditOption = (questionIndex, optionIndex, field, value) => {
    setSmartImportPreview(prev => prev.map((q, i) => {
      if (i !== questionIndex) return q;
      const updatedOptions = [...(q.options || [])];
      if (!updatedOptions[optionIndex]) {
        updatedOptions[optionIndex] = { key: String.fromCharCode(65 + optionIndex), text: '' };
      }
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
      return { ...q, options: updatedOptions };
    }));
  };

  const handleInlineDelete = (index) => {
    if (confirm('Delete this question?')) {
      setSmartImportPreview(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBulkSaveFromPreview = async (destination = 'question-bank') => {
    if (smartImportPreview.length === 0) return;
    
    setIsImporting(true);
    try {
      const formattedCards = smartImportPreview.map(q => ({
        question: q.question,
        options: (q.options || []).map(o => typeof o === 'string' ? o : (o.text || o.value || '')),
        correctAnswer: q.correctAnswer || 'B',
        explanation: q.explanation || '',
        subject: q.subject || 'APT',
        topic: q.topic || '',
        difficulty: q.difficulty || 'medium',
        importanceScore: 5,
        year: q.year || new Date().getFullYear(),
        set: q.set || '1',
        marks: q.marks || 2,
        questionType: q.questionType || 'MCQ'
      }));
      
      let response;
      if (destination === 'pyq') {
        response = await adminPyqService.bulkImport(formattedCards);
      } else if (destination === 'mock-test') {
        for (const q of formattedCards) {
          await adminMockTestService.createQuestion({ ...q, questionText: q.question });
        }
        response = { data: { success: true, count: formattedCards.length } };
      } else {
        response = await adminFlashcardService.bulkImport(formattedCards);
      }
      
      if (response.data.success) {
        setFlashcards(prev => [...formattedCards, ...prev]);
        setSmartImportText('');
        setSmartImportPreview([]);
        toast.success(`${formattedCards.length} questions saved to ${destination}!`);
        setTimeout(loadData, 500);
      } else {
        toast.error(response.data?.message || 'Save failed');
      }
    } catch (error) {
      console.error('Smart import failed:', error);
      toast.error(`Save failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  const handleSmartImportDiagramUpload = (e) => {
    const files = Array.from(e.target.files);
    setSmartImportDiagrams(prev => [...prev, ...files.map(f => ({
      file: f,
      name: f.name,
      url: URL.createObjectURL(f),
    }))]);
  };

  const handleSaveCard = async () => {
    try {
      if (editingCard) { await adminApi.put(`/admin/gate-vault/flashcards/${editingCard._id}`, form); }
      else { await adminApi.post('/admin/gate-vault/flashcards', form); }
      setShowModal(false); resetForm(); loadData();
    } catch (e) { toast.error('Failed to save flashcard'); }
  };

  const handleDeleteCard = async (id) => {
    if (!confirm('Delete this flashcard?')) return;
    try { await adminApi.delete(`/admin/gate-vault/flashcards/${id}`); loadData(); } catch (e) { toast.error('Failed to delete flashcard'); }
  };

  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const cards = JSON.parse(text);
        const res = await adminApi.post('/admin/gate-vault/flashcards/bulk', { cards });
        if (res.data.success) loadData();
      } catch (e) { toast.error('Failed to import flashcards'); }
    };
    input.click();
  };

  const handleCreateSet = async () => {
    try {
      const res = await adminApi.post('/admin/gate-vault/monthly-sets', monthlySetForm);
      if (res.data.success) { setShowSetModal(false); loadData(); }
    } catch (e) { toast.error('Failed to create monthly set'); }
  };

  const handlePublishSet = async (id) => {
    try { await adminApi.post(`/admin/gate-vault/monthly-sets/${id}/publish`); loadData(); } catch (e) { toast.error('Failed to publish set'); }
  };

  const resetForm = () => {
    setEditingCard(null);
    setForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', subject: 'APT', topic: '', importanceScore: 5, difficulty: 'medium', category: '', fileType: '', fileName: '' });
  };

  const handleBulkSave = async (destination) => {
    await handleBulkSaveFromPreview(destination);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    const subjectCode = typeof card.subject === 'string' ? card.subject : (card.subject?.code || 'APT');
    setForm({ question: card.question, options: card.options, correctAnswer: card.correctAnswer, explanation: card.explanation, subject: subjectCode, topic: card.topic, importanceScore: card.importanceScore, difficulty: card.difficulty, category: card.category || '', fileType: card.fileType || '', fileName: card.fileName || '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">GateVault Management</h1>
          <p className="text-sm text-text3">Independent smart content library — flashcards, uploads, monthly challenges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['flashcards', 'smart-upload', 'monthly-sets'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-bg-2 text-text3 hover:text-text border border-border'}`}>
            {tab === 'flashcards' ? '📚 Flashcards' : tab === 'smart-upload' ? '🧠 Smart Upload' : '📅 Monthly Sets'}
          </button>
        ))}
       </div>

      {activeTab === 'flashcards' ? (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>+ Add Card</button>
            <button onClick={() => setActiveTab('smart-upload')} className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-2 text-text border border-border">🧠 Smart Import</button>
            <label className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-2 text-text3 border border-border cursor-pointer hover:text-text">
              📎 Upload File
              <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Upload Queue ({uploadQueue.length} files)</p>
                <div className="flex gap-2">
                  <button onClick={() => setUploadQueue([])} className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-text3 hover:text-text">Clear</button>
                  <button onClick={handleUpload} disabled={uploading} className="text-[10px] px-4 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                    {uploading ? `Uploading ${uploadProgress}%` : `Upload All (${uploadQueue.length})`}
                  </button>
                </div>
              </div>
              {uploading && (
                <div className="h-1.5 rounded-full bg-bg-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }} />
                </div>
              )}
              {uploadQueue.map((item, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-bg-2 flex items-center justify-center text-lg shrink-0">{item.type === 'pdf' ? '📄' : '🖼️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{item.name}</p>
                      <p className="text-[10px] text-text3">{(item.size / 1024).toFixed(1)} KB · .{item.type}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <label className="text-[9px] text-text3 uppercase tracking-wider block mb-0.5">Subject</label>
                          <select value={item.subject} onChange={e => updateQueueItem(idx, 'subject', e.target.value)} className="w-full bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text">
                            {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-text3 uppercase tracking-wider block mb-0.5">Category</label>
                          <select value={item.category} onChange={e => updateQueueItem(idx, 'category', e.target.value)} className="w-full bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-text3 uppercase tracking-wider block mb-0.5">Topic</label>
                          <input value={item.topic} onChange={e => updateQueueItem(idx, 'topic', e.target.value)} className="w-full bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFromQueue(idx)} className="text-text3 hover:text-red-400 text-xs shrink-0">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Existing stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {SUBJECTS.map(sub => {
              const count = flashcards.filter(c => c.subject === sub.code).length;
              return (
                <div key={sub.code} className="bg-bg-2 border border-border rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-purple-400">{count}</p>
                  <p className="text-xs text-text3">{sub.code}</p>
                </div>
              );
            })}
          </div>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flashcards..." className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text">
              <option value="">All Subjects</option>
              {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Cards Table */}
          <div className="bg-bg-1 border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-2 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Question / Name</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Subject</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Category</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Difficulty</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Score</th>
                  <th className="text-left px-4 py-3 text-text3 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-xs text-text3">Loading...</td></tr>
                ) : flashcards.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-xs text-text3">No flashcards yet</td></tr>
                ) : flashcards.map(card => (
                  <tr key={card._id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-text max-w-xs truncate">
                      {card.fileName ? <span className="text-[10px] text-text3 mr-1">📄</span> : null}
                      {card.question || card.fileName || '(untitled)'}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">{typeof card.subject === 'string' ? card.subject : (card.subject?.code || '?')}</span></td>
                    <td className="px-4 py-3"><span className="text-[11px] text-text3">{card.category || '—'}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${card.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : card.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{card.difficulty}</span>
                    </td>
                    <td className="px-4 py-3 text-text3">{card.importanceScore}/10</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEditModal(card)} className="text-purple-400 hover:underline mr-2 text-xs">Edit</button>
                      <button onClick={() => handleDeleteCard(card._id)} className="text-red-400 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
) : activeTab === 'smart-upload' ? (
        <>
          {/* ─── Smart Upload Text Area ─── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-text">Paste Questions</h2>
                <p className="text-xs text-text3 mt-0.5">Format: Subject:, Topic:, Difficulty:, Question:, A) B) C) D), Answer:, Explanation: — one per block</p>
              </div>
              <button
                onClick={handleSmartImportParse}
                disabled={!smartImportText.trim() || isImporting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                🔍 Parse Questions
              </button>
            </div>

            <textarea
              value={smartImportText}
              onChange={e => setSmartImportText(e.target.value)}
              placeholder={`Subject: DS\nTopic: Binary Trees\nDifficulty: medium\nQuestion: What is the time complexity of searching in a BST?\nA) O(1)\nB) O(log n)\nC) O(n)\nD) O(n log n)\nAnswer: C\nExplanation: In worst case, BST search traverses all nodes.\n\nSubject: OS\nTopic: Deadlock\nDifficulty: hard\nQuestion: Banker's algorithm is used for:\nA) Deadlock Prevention\nB) Deadlock Avoidance\nC) Deadlock Detection\nD) Deadlock Recovery\nAnswer: B\nExplanation: Banker's algorithm avoids deadlock by ensuring safe allocation.`}
              className="w-full h-64 bg-bg-2 border border-border rounded-xl px-4 py-3 text-xs text-text font-mono resize-y focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* ─── Stats + Bulk Apply (only when questions parsed) ─── */}
          {smartImportPreview.length > 0 && (
            <>
              {/* Statistics row */}
              {(() => {
                const subjectCounts = {};
                const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
                smartImportPreview.forEach(q => {
                  subjectCounts[q.subject || '—'] = (subjectCounts[q.subject || '—'] || 0) + 1;
                  if (q.difficulty) difficultyCounts[q.difficulty.toLowerCase()] = (difficultyCounts[q.difficulty.toLowerCase()] || 0) + 1;
                });
                const missingSubject = smartImportPreview.filter(q => !q.subject).length;
                const missingTopic = smartImportPreview.filter(q => !q.topic).length;
                return (
                  <div className="flex flex-wrap items-center gap-3 mt-3 p-3 bg-bg-2 border border-border rounded-xl mb-4">
                    <span className="text-[10px] font-semibold text-purple-400">{smartImportPreview.length} questions</span>
                    {missingSubject > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">⚠ {missingSubject} missing Subject</span>}
                    {missingTopic > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">⚠ {missingTopic} missing Topic</span>}
                    <div className="flex items-center gap-1 ml-auto flex-wrap">
                      {Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).map(([sub, cnt]) => (
                        <span key={sub} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">{sub}: {cnt}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {Object.entries(difficultyCounts).filter(([, c]) => c > 0).map(([diff, cnt]) => (
                        <span key={diff} className={`text-[9px] px-1.5 py-0.5 rounded ${diff === 'easy' ? 'bg-emerald-500/10 text-emerald-400' : diff === 'hard' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{diff}: {cnt}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bulk-apply row */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-[10px] text-text3 shrink-0">Apply to all:</span>
                <select onChange={e => { const v = e.target.value; if (v) setSmartImportPreview(prev => prev.map(q => ({ ...q, subject: v }))); }} className="bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text">
                  <option value="">Subject</option>
                  {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
                </select>
                <input onChange={e => setSmartImportPreview(prev => prev.map(q => ({ ...q, topic: e.target.value })))} placeholder="Topic (all)" className="bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text w-28" />
                <select onChange={e => { const v = e.target.value; if (v) setSmartImportPreview(prev => prev.map(q => ({ ...q, difficulty: v }))); }} className="bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text">
                  <option value="">Difficulty</option>
                  <option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option>
                </select>
                <input onChange={e => setSmartImportPreview(prev => prev.map(q => ({ ...q, year: e.target.value })))} placeholder="Year (all)" className="bg-bg-2 border border-border rounded px-2 py-1 text-[10px] text-text w-16 text-center" />
              </div>

              {/* Question preview table */}
              <div className="bg-bg-1 border border-border rounded-xl overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-3 bg-bg-2 border-b border-border">
                  <h3 className="text-xs font-semibold text-text">Question Preview</h3>
                  <button onClick={() => { setSmartImportText(''); setSmartImportPreview([]); }} className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-text3 hover:text-text">
                    Clear
                  </button>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {smartImportPreview.map((q, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono text-text3">#{idx + 1}</span>
                          {!q.subject && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">⚠ No Subject</span>}
                          <input
                            value={q.subject || ''}
                            onChange={e => handleInlineEdit(idx, 'subject', e.target.value.toUpperCase())}
                            className={`bg-bg-2 border rounded px-1.5 py-0.5 text-[9px] uppercase w-14 text-center focus:outline-none focus:border-purple-500/50 ${!q.subject ? 'border-red-500/60 text-red-400' : 'border-border text-purple-400'}`}
                            placeholder="SUBJ"
                          />
                          {!q.topic && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">⚠ No Topic</span>}
                          <input
                            value={q.topic || ''}
                            onChange={e => handleInlineEdit(idx, 'topic', e.target.value)}
                            className={`bg-bg-2 border rounded px-1.5 py-0.5 text-[9px] w-28 focus:outline-none focus:border-purple-500/50 ${!q.topic ? 'border-amber-500/60 text-amber-400' : 'border-border text-blue-400'}`}
                            placeholder="Topic"
                          />
                          <select
                            value={q.difficulty || ''}
                            onChange={e => handleInlineEdit(idx, 'difficulty', e.target.value)}
                            className="bg-bg-2 border border-border rounded px-1.5 py-0.5 text-[9px] text-text focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">—</option>
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                          </select>
                          <input
                            value={q.year || ''}
                            onChange={e => handleInlineEdit(idx, 'year', e.target.value)}
                            className="bg-bg-2 border border-border rounded px-1.5 py-0.5 text-[9px] text-text w-14 text-center focus:outline-none focus:border-purple-500/50"
                            placeholder="Year"
                          />
                        </div>
                        <button onClick={() => handleInlineDelete(idx)} className="text-text3 hover:text-red-400 text-[9px] shrink-0">✕ Delete</button>
                      </div>

                      <textarea
                        value={q.question || ''}
                        onChange={e => handleInlineEdit(idx, 'question', e.target.value)}
                        className="w-full bg-bg-2 border border-border rounded px-2 py-1.5 text-[11px] text-text mb-2 resize-y focus:outline-none focus:border-purple-500/50"
                        rows={2}
                      />

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-text3 w-3 shrink-0">{String.fromCharCode(65 + optIdx)})</span>
                            <input
                              value={typeof opt === 'string' ? opt : (opt?.text || '')}
                              onChange={e => handleInlineEditOption(idx, optIdx, 'text', e.target.value)}
                              className={`flex-1 bg-bg-2 border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-purple-500/50 ${optIdx === (q.correctAnswer?.charCodeAt(0) - 65) ? 'border-green-500/40 text-green-400' : 'border-border text-text'}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-text3">Ans:</span>
                          <input
                            value={q.correctAnswer || ''}
                            onChange={e => handleInlineEdit(idx, 'correctAnswer', e.target.value.toUpperCase())}
                            className="bg-bg-2 border border-border rounded px-1.5 py-0.5 text-[9px] text-green-400 w-8 text-center uppercase focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        <input
                          value={q.explanation || ''}
                          onChange={e => handleInlineEdit(idx, 'explanation', e.target.value)}
                          placeholder="Explanation..."
                          className="flex-1 bg-bg-2 border border-border rounded px-2 py-0.5 text-[9px] text-text3 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Buttons */}
                <div className="flex gap-2 p-4 bg-bg-2 border-t border-border flex-wrap">
                  <button onClick={() => handleBulkSaveFromPreview('question-bank')} disabled={isImporting} className="flex-1 min-w-[120px] text-xs px-4 py-2.5 rounded-lg bg-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-40">
                    {isImporting ? 'Saving...' : '💾 Save to Question Bank'}
                  </button>
                  <button onClick={() => handleBulkSaveFromPreview('pyq')} disabled={isImporting} className="flex-1 min-w-[120px] text-xs px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold hover:opacity-90 disabled:opacity-40">
                    📚 Save to PYQ Bank
                  </button>
                  <button onClick={() => handleBulkSaveFromPreview('mock-test')} disabled={isImporting} className="flex-1 min-w-[120px] text-xs px-4 py-2.5 rounded-lg bg-amber-500 text-white font-semibold hover:opacity-90 disabled:opacity-40">
                    🧠 Save to Mock Test
                  </button>
                  <button onClick={() => handleBulkSaveFromPreview('gate-vault')} disabled={isImporting} className="flex-1 min-w-[120px] text-xs px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:opacity-90 disabled:opacity-40">
                    🔐 Save to GateVault
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Help text when no questions parsed */}
          {smartImportPreview.length === 0 && (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm text-text font-medium mb-1">Smart Import</p>
              <p className="text-xs text-text3">Paste your questions using the format shown in the placeholder above, then click "Parse Questions" to preview and save.</p>
            </div>
          )}
        </>
      ) : (
        /* Monthly Sets */
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setShowSetModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>+ Create Monthly Set</button>
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
                        <button onClick={() => handlePublishSet(set._id)} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-500 hover:bg-purple-600">Publish</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {/* Create Monthly Set Modal */}
      {showSetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-text">Create Monthly Set</h3>
              <button onClick={() => setShowSetModal(false)} className="text-text3 hover:text-text">✕</button>
            </div>
            <div className="space-y-4">
              <input value={monthlySetForm.name} onChange={e => setMonthlySetForm({ ...monthlySetForm, name: e.target.value })} placeholder="Set name (e.g. July 2026 Top 50)" className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <select value={monthlySetForm.monthName} onChange={e => { const idx = MONTHS.indexOf(e.target.value); setMonthlySetForm({ ...monthlySetForm, monthName: e.target.value, month: String(idx + 1).padStart(2, '0') }); }} className="bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text text-sm">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                <input type="number" value={monthlySetForm.year} onChange={e => setMonthlySetForm({ ...monthlySetForm, year: parseInt(e.target.value) || 2026 })} className="bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-text text-sm" />
              </div>
              <button onClick={handleCreateSet} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold text-sm">Create Set</button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

