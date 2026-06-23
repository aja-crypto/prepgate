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

const DEMO_QUESTIONS = [
  { _id: 'q1', index: 0, question: 'A train travels 120 km in 2 hours. Its average speed is:', options: ['40 km/h', '50 km/h', '60 km/h', '80 km/h'], correctAnswer: 2, explanation: 'Average speed = Total distance / Total time = 120/2 = 60 km/h', subject: 'APT', topic: 'Speed and Distance', difficulty: 'easy', importanceScore: 8 },
  { _id: 'q2', index: 1, question: 'If 20% of a number is 50, the number is:', options: ['200', '250', '300', '150'], correctAnswer: 1, explanation: '20% of x = 50 => x = 50 * 100 / 20 = 250', subject: 'APT', topic: 'Percentages', difficulty: 'easy', importanceScore: 8 },
  { _id: 'q3', index: 2, question: 'Average of 5, 10, 15, 20, 25 is:', options: ['10', '12', '15', '18'], correctAnswer: 2, explanation: 'Sum = 75, Count = 5, Average = 75/5 = 15', subject: 'APT', topic: 'Averages', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q4', index: 3, question: 'Find the next number: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '36'], correctAnswer: 1, explanation: 'Pattern: n*(n+1) => 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42', subject: 'APT', topic: 'Series and Patterns', difficulty: 'medium', importanceScore: 7 },
  { _id: 'q5', index: 4, question: 'A work is completed by 10 people in 20 days. How many days for 20 people?', options: ['5 days', '10 days', '15 days', '40 days'], correctAnswer: 1, explanation: 'Work = 10*20 = 200 man-days. With 20 people: 200/20 = 10 days', subject: 'APT', topic: 'Work and Time', difficulty: 'medium', importanceScore: 8 },
  { _id: 'q6', index: 5, question: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2x²'], correctAnswer: 1, explanation: 'd/dx(x²) = 2x (power rule: d/dx(x^n) = n*x^(n-1))', subject: 'MA', topic: 'Calculus - Differentiation', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q7', index: 6, question: 'What is the integral ∫1 dx?', options: ['1', 'x', 'x + C', '0'], correctAnswer: 2, explanation: '∫1 dx = x + C, where C is the constant of integration', subject: 'MA', topic: 'Calculus - Integration', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q8', index: 7, question: 'What is the determinant of the identity matrix |1 0; 0 1|?', options: ['0', '1', '2', 'undefined'], correctAnswer: 1, explanation: 'Determinant of 2x2 identity matrix = (1*1) - (0*0) = 1', subject: 'MA', topic: 'Linear Algebra - Determinants', difficulty: 'easy', importanceScore: 7 },
  { _id: 'q9', index: 8, question: 'What is the rank of an n×n identity matrix?', options: ['0', '1', 'n-1', 'n'], correctAnswer: 3, explanation: 'The rank of an n×n identity matrix is n (full rank, all rows/columns are linearly independent)', subject: 'MA', topic: 'Linear Algebra - Rank', difficulty: 'medium', importanceScore: 6 },
  { _id: 'q10', index: 9, question: 'What is the probability of getting Head once in one coin toss?', options: ['1', '1/2', '1/4', '0'], correctAnswer: 1, explanation: 'A fair coin has 2 equally likely outcomes (H, T). Probability of Head = 1/2', subject: 'MA', topic: 'Probability', difficulty: 'easy', importanceScore: 8 },
  { _id: 'q11', index: 10, question: 'Number of subsets of a set with 4 elements?', options: ['4', '8', '16', '32'], correctAnswer: 2, explanation: 'Number of subsets = 2^n = 2^4 = 16 (including empty set)', subject: 'DS', topic: 'Set Theory', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q12', index: 11, question: 'What is 5! (5 factorial)?', options: ['20', '60', '120', '240'], correctAnswer: 2, explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120', subject: 'DS', topic: 'Combinatorics', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q13', index: 12, question: 'A graph with no cycles is called:', options: ['Complete', 'Tree', 'Bipartite', 'Eulerian'], correctAnswer: 1, explanation: 'A connected acyclic graph is called a Tree. It has n vertices and n-1 edges.', subject: 'DS', topic: 'Graph Theory', difficulty: 'easy', importanceScore: 7 },
  { _id: 'q14', index: 13, question: 'Maximum edges in a complete graph with 4 vertices?', options: ['4', '6', '8', '12'], correctAnswer: 1, explanation: 'Maximum edges in complete graph Kn = n(n-1)/2 = 4*3/2 = 6', subject: 'DS', topic: 'Graph Theory - Complete Graphs', difficulty: 'medium', importanceScore: 8 },
  { _id: 'q15', index: 14, question: 'What is the binary representation of decimal 10?', options: ['1001', '1010', '1100', '1110'], correctAnswer: 1, explanation: '10 in binary: 1010 (8+0+2+0). Verification: 1*8 + 0*4 + 1*2 + 0*1 = 10', subject: 'DS', topic: 'Number Systems', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q16', index: 15, question: 'How many select lines are required for an 8:1 MUX?', options: ['2', '3', '4', '8'], correctAnswer: 1, explanation: 'For 2^n inputs, n select lines are needed. 8 = 2^3, so 3 select lines', subject: 'CO', topic: 'Multiplexers', difficulty: 'easy', importanceScore: 8 },
  { _id: 'q17', index: 16, question: 'How many outputs does a decoder have with 3 inputs?', options: ['3', '6', '8', '16'], correctAnswer: 2, explanation: 'An n-input decoder has 2^n outputs. With 3 inputs: 2^3 = 8 outputs', subject: 'CO', topic: 'Decoders', difficulty: 'easy', importanceScore: 8 },
  { _id: 'q18', index: 17, question: 'Which gate is called the Universal Gate?', options: ['NOT', 'AND', 'NAND', 'XOR'], correctAnswer: 2, explanation: 'NAND gate is universal because any Boolean function can be implemented using only NAND gates', subject: 'CO', topic: 'Logic Gates', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q19', index: 18, question: 'What is the output of 1 AND 0?', options: ['0', '1', 'Invalid', 'Both 0 and 1'], correctAnswer: 0, explanation: 'AND operation: 1 AND 0 = 0 (result is 1 only if both inputs are 1)', subject: 'CO', topic: 'Logic Gates - AND', difficulty: 'easy', importanceScore: 9 },
  { _id: 'q20', index: 19, question: 'How many bits are represented by one hexadecimal digit?', options: ['2', '4', '8', '16'], correctAnswer: 1, explanation: 'One hex digit represents 4 binary bits (0-F = 0000-1111 in binary)', subject: 'CO', topic: 'Number Systems - Hexadecimal', difficulty: 'easy', importanceScore: 9 },
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
      console.error('Failed to load monthly set:', e);
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
      questions: DEMO_QUESTIONS,
      totalQuestions: DEMO_QUESTIONS.length,
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
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}>🔥</div>
        <h2 className="text-xl font-bold text-text mb-2">GateVault Not Available</h2>
        <p className="text-text3">This month's challenge hasn't been published yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text2 mb-1">Continue where you left off</p>
              <p className="text-lg font-bold" style={{ color: '#a855f7' }}>
                Question {existingProgress.currentIndex + 1} of {monthlySet.questions?.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{existingProgress.score}%</p>
              <p className="text-xs text-text3">Current Score</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            Continue Challenge →
          </button>
        </div>
      )}

      {/* Subject Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text mb-4">Choose Completed Subjects</h2>
        <div className="grid grid-cols-2 gap-3">
          {GATE_SUBJECTS.map(subject => {
            const isSelected = selectedSubjects.includes(subject.code);
            return (
              <button
                key={subject.code}
                onClick={() => toggleSubject(subject.code)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-border bg-bg-2 hover:border-border/80'
                }`}
                disabled={subject.code === 'APT'}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: `${subject.color}20` }}
                >
                  {subject.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-text">{subject.name}</p>
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{selectedSubjects.length}</p>
          <p className="text-xs text-text3">Subjects</p>
        </div>
        <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">~50</p>
          <p className="text-xs text-text3">Questions</p>
        </div>
        <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">~30min</p>
          <p className="text-xs text-text3">Duration</p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={starting || selectedSubjects.length === 0}
        className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
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