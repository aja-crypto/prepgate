import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gateVaultService } from '../services/api';
import { useProgress } from '../context/ProgressContext';

const GATE_SUBJECTS = [
  { code: 'APT', name: 'Aptitude', color: '#f59e0b', icon: '🧮', mandatory: true },
  { code: 'DS', name: 'Data Structures', color: '#10b981', icon: '📊' },
  { code: 'DBMS', name: 'Database Systems', color: '#6366f1', icon: '🗄' },
  { code: 'OS', name: 'Operating Systems', color: '#8b5cf6', icon: '⚙️' },
  { code: 'CN', name: 'Computer Networks', color: '#06b6d4', icon: '🌐' },
  { code: 'CO', name: 'Computer Organization', color: '#ec4899', icon: '🖥' },
  { code: 'TOC', name: 'Theory of Computation', color: '#f97316', icon: '🤖' },
  { code: 'CD', name: 'Compiler Design', color: '#14b8a6', icon: '🔧' },
  { code: 'AL', name: 'Algorithms', color: '#ef4444', icon: '⚡' },
];

export default function GateVaultPage() {
  const navigate = useNavigate();
  const { data } = useProgress();
  const [monthlySet, setMonthlySet] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState(['APT']);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [existingProgress, setExistingProgress] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    loadMonthlySet();
  }, []);

  const loadMonthlySet = async () => {
    try {
      const res = await gateVaultService.getMonthlySet();
      if (res.data.success && res.data.data) {
        setMonthlySet(res.data.data);
        const progressRes = await gateVaultService.getProgress();
        if (progressRes.data.success && progressRes.data.data) {
          setExistingProgress(progressRes.data.data);
        }
      } else {
        useDemoMode();
      }
    } catch (e) {
      // 403 = premium-gated in this environment — fall back to demo mode silently
      if (e?.response?.status !== 403) console.error('Failed to load monthly set:', e);
      useDemoMode();
    } finally {
      setLoading(false);
    }
  };

  const useDemoMode = () => {
    const now = new Date();
    const monthName = now.toLocaleString('en', { month: 'long' });
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setMonthlySet({
      _id: 'demo-set',
      name: `${monthName} ${year} Top 50`,
      month,
      year,
      monthName,
      questions: [
        { _id: 'd1', question: 'The number of spanning trees in a complete graph K₄ is:', options: ['8', '12', '16', '24'], correctAnswer: 2, subject: 'DS', topic: 'Graph Theory', difficulty: 'medium', explanation: 'By Cayley\'s formula, Kₙ has n^(n-2) spanning trees. For K₄: 4² = 16.' },
        { _id: 'd2', question: 'Which of the following is NOT a valid deadlock prevention technique?', options: ['Resource ordering', 'Banker\'s algorithm', 'Mutex locks', 'All of the above'], correctAnswer: 2, subject: 'OS', topic: 'Deadlocks', difficulty: 'easy', explanation: 'Mutex locks are a synchronization primitive, not a deadlock prevention technique.' },
        { _id: 'd3', question: 'What is the time complexity of building a heap from an unsorted array?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, subject: 'AL', topic: 'Heap', difficulty: 'medium', explanation: 'Building a heap using bottom-up approach takes O(n) time.' },
        { _id: 'd4', question: 'In TCP, the three-way handshake involves:', options: ['SYN, ACK, FIN', 'SYN, SYN-ACK, ACK', 'SYN, FIN, ACK', 'ACK, SYN, SYN-ACK'], correctAnswer: 1, subject: 'CN', topic: 'TCP', difficulty: 'easy', explanation: 'TCP connection establishment uses SYN → SYN-ACK → ACK.' },
        { _id: 'd5', question: 'The closure of a relation R in relational algebra is:', options: ['R ∪ R² ∪ R³ ∪ ...', 'R ∩ R²', 'R × R', 'R ÷ R'], correctAnswer: 0, subject: 'DBMS', topic: 'Relational Algebra', difficulty: 'medium', explanation: 'Transitive closure is the union of R, R², R³, ... until no new tuples are added.' },
      ],
      totalQuestions: 5,
    });
    setIsDemo(true);
  };

  const toggleSubject = (code) => {
    if (code === 'APT') return; // APT is always selected
    setSelectedSubjects(prev =>
      prev.includes(code)
        ? prev.filter(s => s !== code)
        : [...prev, code]
    );
  };

  const handleStart = async () => {
    if (selectedSubjects.length === 0) return;
    setStarting(true);
    try {
      if (!isDemo) {
        const res = await gateVaultService.startSession(selectedSubjects);
        if (res.data.success) {
          navigate('/gate-vault/practice', {
            state: {
              setId: monthlySet._id,
              questions: monthlySet.questions.filter(q => selectedSubjects.includes(q.subject)),
              totalQuestions: res.data.data.totalQuestions,
              progressId: res.data.data.progress._id,
              selectedSubjects,
            },
          });
        }
      } else {
        const filteredQuestions = monthlySet.questions.filter(q => selectedSubjects.includes(q.subject));
        navigate('/gate-vault/practice', {
          state: {
            setId: monthlySet._id,
            questions: filteredQuestions.length > 0 ? filteredQuestions : monthlySet.questions,
            totalQuestions: filteredQuestions.length || monthlySet.questions.length,
            progressId: 'demo-progress',
            selectedSubjects,
            isDemo: true,
          },
        });
      }
    } catch (e) {
      console.error('Failed to start session:', e);
      const filteredQuestions = monthlySet.questions.filter(q => selectedSubjects.includes(q.subject));
      navigate('/gate-vault/practice', {
        state: {
          setId: monthlySet._id,
          questions: filteredQuestions.length > 0 ? filteredQuestions : monthlySet.questions,
          totalQuestions: filteredQuestions.length || monthlySet.questions.length,
          progressId: 'demo-progress',
          selectedSubjects,
          isDemo: true,
        },
      });
    } finally {
      setStarting(false);
    }
  };

  const handleContinue = () => {
    if (!monthlySet || !existingProgress) return;
    navigate('/gate-vault/practice', {
      state: {
        setId: monthlySet._id,
        questions: monthlySet.questions,
        totalQuestions: monthlySet.questions.length,
        progressId: existingProgress._id,
        selectedSubjects,
        currentIndex: existingProgress.currentIndex,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!monthlySet) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}>🔥</div>
        <h2 className="text-xl font-bold text-text mb-2">GateVault Not Available</h2>
        <p className="text-sm text-text3 max-w-xs mx-auto">This month's challenge hasn't been published yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="mb-6 p-4 rounded-xl border" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-yellow-400">Demo Mode</p>
              <p className="text-xs text-yellow-400/70">Showing sample questions. Subscribe to unlock the full Top 50 challenge.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}>
          <span className="text-lg">🔥</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">GateVault</span>
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">This Month's Top 50</h1>
        <p className="text-text3">{monthlySet.monthName} {monthlySet.year} • {monthlySet.questions?.length || 50} Questions</p>
      </div>

      {/* Existing Progress Card */}
      {existingProgress && !existingProgress.isCompleted && (
        <div className="mb-6 p-4 rounded-xl border" style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-text2 mb-1">Continue where you left off</p>
              <p className="text-base md:text-lg font-bold truncate" style={{ color: '#a855f7' }}>
                Question {existingProgress.currentIndex + 1} of {monthlySet.questions?.length}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#a855f7' }}>{existingProgress.score}%</p>
              <p className="text-[10px] md:text-xs text-text3">Current Score</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full mt-4 py-3 min-h-[44px] rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            Continue Challenge →
          </button>
        </div>
      )}

      {/* Subject Selection */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-text mb-3 md:mb-4">Choose Completed Subjects</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {GATE_SUBJECTS.map(subject => {
            const isSelected = selectedSubjects.includes(subject.code);
            return (
              <button
                key={subject.code}
                onClick={() => toggleSubject(subject.code)}
                className={`flex items-center gap-2 md:gap-3 p-3 rounded-xl border transition-all min-h-[48px] ${
                  isSelected
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-border bg-bg-2 hover:border-border/80'
                }`}
                disabled={subject.code === 'APT'}
              >
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg md:text-xl shrink-0"
                  style={{ background: `${subject.color}20` }}
                >
                  {subject.icon}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{subject.name}</p>
                  <p className="text-xs text-text3">{subject.code}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected ? 'border-purple-500 bg-purple-500' : 'border-border'
                }`}>
                  {isSelected && (
                    <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
        <div className="bg-bg-2 border border-border rounded-xl p-3 md:p-4 text-center">
          <p className="text-xl md:text-2xl font-bold text-purple-400">{selectedSubjects.length}</p>
          <p className="text-[10px] md:text-xs text-text3 mt-0.5">Subjects</p>
        </div>
        <div className="bg-bg-2 border border-border rounded-xl p-3 md:p-4 text-center">
          <p className="text-xl md:text-2xl font-bold text-indigo-400">~50</p>
          <p className="text-[10px] md:text-xs text-text3 mt-0.5">Questions</p>
        </div>
        <div className="bg-bg-2 border border-border rounded-xl p-3 md:p-4 text-center">
          <p className="text-xl md:text-2xl font-bold text-emerald-400">~30min</p>
          <p className="text-[10px] md:text-xs text-text3 mt-0.5">Duration</p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={starting || selectedSubjects.length === 0}
        className="w-full py-3.5 md:py-4 rounded-xl font-bold text-white text-sm md:text-base transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 min-h-[48px]"
        style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1, #8b5cf6)' }}
      >
        {starting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Generating Your Set...
          </span>
        ) : (
          '🎯 Generate My Challenge Set'
        )}
      </button>
    </div>
  );
}