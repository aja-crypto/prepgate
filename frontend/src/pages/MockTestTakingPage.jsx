import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockTestService, getApiErrorMessage } from '../services/api';
import { MockExamLoading } from '../components/common/GateLoadingScreen';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';

const MISTAKE_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'concept_error', label: 'Concept Error' },
  { value: 'formula_error', label: 'Formula Error' },
  { value: 'silly_mistake', label: 'Silly Mistake' },
  { value: 'time_pressure', label: 'Time Pressure' },
  { value: 'guess', label: 'Guess' },
];

const STORAGE_PREFIX = 'mock_test_';

function loadSavedState(testId) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + testId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.answers) parsed.answers = parsed.answers;
    if (parsed.markedForReview) parsed.markedForReview = new Set(parsed.markedForReview);
    if (parsed.visitedQuestions) parsed.visitedQuestions = new Set(parsed.visitedQuestions);
    if (parsed.questionTimes) parsed.questionTimes = parsed.questionTimes;
    return parsed;
  } catch { return null; }
}

function saveState(testId, state) {
  try {
    const toStore = {
      answers: state.answers,
      markedForReview: Array.from(state.markedForReview),
      visitedQuestions: Array.from(state.visitedQuestions),
      currentIndex: state.currentIndex,
      timeLeft: state.timeLeft,
      questionTimes: state.questionTimes || {},
      submitted: false,
    };
    localStorage.setItem(STORAGE_PREFIX + testId, JSON.stringify(toStore));
  } catch { /* storage full or unavailable */ }
}

function clearSavedState(testId) {
  try { localStorage.removeItem(STORAGE_PREFIX + testId); } catch {}
}

export default function MockTestTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateMocks } = useProgress();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [mistakeCategories, setMistakeCategories] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [restored, setRestored] = useState(false);

  const autoSubmittedRef = useRef(false);
  const totalTimeRef = useRef(0);
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const testRef = useRef(test);
  const saveTimerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());
  const questionTimesRef = useRef({});

  answersRef.current = answers;
  questionsRef.current = questions;
  testRef.current = test;

  useEffect(() => {
    if (!id) {
      setError('No test ID provided.');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await mockTestService.getQuestions(id);
        const data = res.data.data;
        const testData = data.test || data;
        const qs = data.questions || [];
        setTest(testData);
        setQuestions(qs);

        // Restore saved state from localStorage only if it's a continuation
        const saved = loadSavedState(id);
        if (saved && saved.answers && Object.keys(saved.answers).length > 0 && !saved.submitted) {
          setAnswers(saved.answers);
          setMarkedForReview(saved.markedForReview || new Set());
          setVisitedQuestions(new Set([...(saved.visitedQuestions || []), 0]));
          if (saved.questionTimes) questionTimesRef.current = saved.questionTimes;
          if (typeof saved.currentIndex === 'number') setCurrentIndex(saved.currentIndex);
          if (typeof saved.timeLeft === 'number' && saved.timeLeft > 0) {
            totalTimeRef.current = saved.timeLeft;
            setTimeLeft(saved.timeLeft);
          } else {
            totalTimeRef.current = testData.duration ? testData.duration * 60 : qs.length * 90;
            setTimeLeft(totalTimeRef.current);
          }
          setRestored(true);
        } else {
          totalTimeRef.current = testData.duration ? testData.duration * 60 : qs.length * 90;
          setTimeLeft(totalTimeRef.current);
        }
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load test');
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!test || loading || autoSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, loading, autoSubmitted]);

  useEffect(() => {
    if (timeLeft !== 0 || !test || loading || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    setAutoSubmitted(true);
    toast('Time up — auto-submitting', { icon: '\u23F1' });
    submitTest(false);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (questions.length === 0) return;
    setVisitedQuestions((prev) => new Set([...prev, currentIndex]));
    const now = Date.now();
    const elapsed = Math.round((now - questionStartTimeRef.current) / 1000);
    const prevIdx = visitedQuestions.size > 0 ? [...visitedQuestions].pop() : null;
    if (prevIdx !== null && prevIdx !== currentIndex) {
      questionTimesRef.current[prevIdx] = (questionTimesRef.current[prevIdx] || 0) + elapsed;
    }
    questionStartTimeRef.current = now;
  }, [currentIndex, questions.length]);

  // Auto-save to localStorage every 3s
  useEffect(() => {
    if (!id || !questions.length || autoSubmitted) return;
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    saveTimerRef.current = setInterval(() => {
      saveState(id, { answers, markedForReview, visitedQuestions, currentIndex, timeLeft, questionTimes: questionTimesRef.current });
    }, 3000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [id, questions.length, autoSubmitted, answers, markedForReview, visitedQuestions, currentIndex, timeLeft]);

  const qId = (q, idx) => q?._id || q?.questionId || `q_${idx}`;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = totalQuestions - answeredCount;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const selectAnswer = (optKey) => {
    if (!currentQuestion) return;
    const id = qId(currentQuestion, currentIndex);
    setAnswers((prev) => {
      if (prev[id] === optKey) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: optKey };
    });
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const key = qId(currentQuestion, currentIndex);
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearResponse = () => {
    if (!currentQuestion) return;
    const key = qId(currentQuestion, currentIndex);
    setAnswers((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const goToQuestion = (idx) => {
    if (idx < 0 || idx >= totalQuestions) return;
    setCurrentIndex(idx);
  };

  const getStatus = (idx) => {
    const q = questions[idx];
    const key = qId(q, idx);
    const isAnswered = answers[key] !== undefined;
    const isVisited = visitedQuestions.has(idx);
    const isMarked = markedForReview.has(key);
    const isCurrent = idx === currentIndex;
    if (isCurrent) return 'current';
    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'visited';
    return 'unvisited';
  };

  const statusColors = {
    current: 'bg-primary/20 border-primary/40 text-primary',
    answered: 'bg-green-500/15 border-green-500/30 text-green-400',
    'answered-marked': 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    visited: 'bg-red-500/10 border-red-500/20 text-red-400',
    unvisited: 'bg-bg-3 border-border text-text3',
  };

  const openSubmitModal = () => {
    setSubmitModalOpen(true);
    const cats = {};
    questions.forEach((q, idx) => {
      const key = qId(q, idx);
      if (answers[key] === undefined) {
        cats[key] = '';
      }
    });
    setMistakeCategories(cats);
  };

  const submitTest = useCallback(async (withMistakes = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const currentQuestions = questionsRef.current;
      const currentAnswers = answersRef.current;
      const currentTest = testRef.current;

      const answersPayload = currentQuestions.map((q, idx) => {
        const key = qId(q, idx);
        const sel = currentAnswers[key];
        const spent = questionTimesRef.current[idx] || 0;
        return {
          questionId: q._id,
          selectedAnswer: sel !== undefined ? sel : null,
          timeSpent: spent,
          skipped: sel === undefined,
          mistakeCategory: withMistakes ? (mistakeCategories[key] || null) : null,
        };
      });

      const timeTaken = totalTimeRef.current - timeLeft;
      await mockTestService.submit(id, { answers: answersPayload, timeTaken });
      const answeredCount = answersPayload.filter(a => a.selectedAnswer !== null).length;
      const totalMarks = currentQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      const correctMarks = answersPayload.reduce((sum, a, idx) => {
        const q = currentQuestions[idx];
        if (q && a.selectedAnswer !== null && a.selectedAnswer === q.correctAnswer) {
          return sum + (q.marks || 1);
        }
        return sum;
      }, 0);
      updateMocks(ts => [...ts, {
        id: Date.now(),
        name: currentTest?.title || 'Mock Test',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        score: totalMarks ? Math.round((correctMarks / totalMarks) * 100) : 0,
        rank: null,
        notes: `${answeredCount}/${currentQuestions.length} answered`,
      }]);
      clearSavedState(id);
      toast.success('Test submitted successfully!');
      navigate(`/mock-tests/${id}/result`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit test'));
    } finally {
      setSubmitting(false);
    }
  }, [id, navigate, timeLeft, mistakeCategories, submitting]);

  const handleConfirmSubmit = () => {
    submitTest(true);
    setSubmitModalOpen(false);
  };

  if (loading) {
    return <MockExamLoading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard padding="p-8" className="text-center max-w-md">
          <Icon name="alert-triangle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-text mb-2">Test Not Found</h2>
          <p className="text-sm text-text3 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/mock-tests')}
            className="text-sm px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            Back to Mock Tests
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!test || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard padding="p-8" className="text-center max-w-md">
          <Icon name="alert-triangle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-text mb-2">Test Data Unavailable</h2>
          <p className="text-sm text-text3 mb-4">The test questions could not be loaded. This may be due to a connection issue or the test has been removed.</p>
          <button
            type="button"
            onClick={() => navigate('/mock-tests')}
            className="text-sm px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            Back to Mock Tests
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen -m-6 p-6 bg-bg">
      <GlassCard padding="p-4" className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-text truncate">{test.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text3 mt-0.5">
              <span>{test.subject}</span>
              <span>{test.duration} min</span>
              <span>{totalQuestions} Questions</span>
              <span>{test.totalMarks || totalQuestions} Marks</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`font-mono text-lg font-bold tabular-nums ${timeLeft < 300 ? 'text-red-400' : 'text-primary'}`}
            >
              {formatTime(timeLeft)}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Auto-saved</span>
            <button
              type="button"
              onClick={openSubmitModal}
              className="text-xs px-4 py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all"
            >
              Submit Test
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <GlassCard padding="p-5" className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-text3">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {currentQuestion && markedForReview.has(qId(currentQuestion, currentIndex)) && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  Marked for Review
                </span>
              )}
            </div>

            {currentQuestion && (
              <>
                <p className="text-sm text-text mb-5 leading-relaxed">
                  {currentQuestion.text || currentQuestion.title || currentQuestion.questionText}
                </p>

                <div className="space-y-2.5 mb-5">
                  {(currentQuestion.options || []).map((opt, optIdx) => {
                    const labels = ['A', 'B', 'C', 'D'];
                    const qKey = qId(currentQuestion, currentIndex);
                    const optValue = typeof opt === 'object' ? opt.key : optIdx;
                    const optText = typeof opt === 'object' ? opt.text : opt;
                    const isSelected = answers[qKey] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => selectAnswer(optIdx)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          isSelected
                            ? 'bg-primary/15 border-primary/40 text-text shadow-sm shadow-primary/5'
                            : 'bg-bg-2 border-border text-text2 hover:border-white/20 hover:bg-bg-2/80'
                        }`}
                      >
                        <span className="font-mono font-semibold mr-2.5 text-[13px]">{labels[optIdx] || optIdx}.</span>
                        {optText}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMarkForReview}
                    className={`text-xs px-4 py-2.5 min-h-[44px] rounded-lg border transition-all ${
                      markedForReview.has(qId(currentQuestion, currentIndex))
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                        : 'bg-bg-2 border-border text-text3 hover:border-white/20'
                    }`}
                  >
                    {markedForReview.has(qId(currentQuestion, currentIndex))
                      ? '\u2713 Marked for Review'
                      : 'Mark for Review'}
                  </button>
                  <button
                    type="button"
                    onClick={clearResponse}
                    disabled={answers[qId(currentQuestion, currentIndex)] === undefined}
                    className="text-xs px-4 py-2.5 min-h-[44px] rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear Response
                  </button>
                  <button
                    type="button"
                    onClick={() => goToQuestion(currentIndex + 1)}
                    disabled={currentIndex >= totalQuestions - 1}
                    className="text-xs px-5 py-2.5 min-h-[44px] rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 ml-auto"
                  >
                    Save & Next
                  </button>
                </div>
              </>
            )}
          </GlassCard>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="text-xs px-4 py-2.5 min-h-[44px] rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm font-mono text-text3">
              {currentIndex + 1}/{totalQuestions}
            </span>
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={currentIndex >= totalQuestions - 1}
              className="text-xs px-4 py-2.5 min-h-[44px] rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="mt-4 sm:hidden">
            <button
              type="button"
              onClick={openSubmitModal}
              className="w-full text-sm py-3 rounded-xl border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold"
            >
              Submit Test
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`${sidebarOpen ? 'w-56 fixed right-0 top-0 h-full z-50 lg:static lg:h-auto' : 'w-0 overflow-hidden'}`}>
          <div className="w-56">
            <GlassCard padding="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text3 uppercase tracking-wider">Navigator</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-text3 hover:text-text transition-colors lg:hidden"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {questions.map((_, idx) => {
                  const status = getStatus(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`w-full aspect-square text-[11px] font-mono rounded-lg border transition-all ${statusColors[status]} hover:opacity-80`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-[10px] text-text3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-green-500/30 bg-green-500/15" />
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-red-500/20 bg-red-500/10" />
                  Not Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-purple-500/30 bg-purple-500/15" />
                  Marked & Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-border bg-bg-3" />
                  Not Visited
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-text3">Answered</span>
                  <span className="text-green-400 font-mono">{answeredCount}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text3">Unanswered</span>
                  <span className="text-red-400 font-mono">{unansweredCount}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-text3">Marked</span>
                  <span className="text-purple-400 font-mono">{markedCount}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-14 rounded-l-lg bg-surface border border-border border-r-0 flex items-center justify-center text-text3 hover:text-text transition-colors shadow-lg lg:hidden"
          >
            <Icon name="chevron-right" className="w-4 h-4" />
          </button>
        )}
      </div>

      {submitModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={() => setSubmitModalOpen(false)}
        >
          <div
            className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-text mb-1">Submit Test</h3>
            <p className="text-xs text-text3 mb-4">Review your attempt before final submission</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-bg-2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold font-mono text-green-400">{answeredCount}</div>
                <div className="text-[10px] text-text3">Answered</div>
              </div>
              <div className="bg-bg-2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold font-mono text-red-400">{unansweredCount}</div>
                <div className="text-[10px] text-text3">Unanswered</div>
              </div>
              <div className="bg-bg-2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold font-mono text-purple-400">{markedCount}</div>
                <div className="text-[10px] text-text3">Marked</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-text2 mb-2">Categorize mistakes (optional):</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questions.map((q, idx) => {
                    const key = qId(q, idx);
                    if (answers[key] !== undefined) return null;
                    return (
                      <div key={key} className="flex items-center gap-2 bg-bg-2 rounded-lg px-3 py-2">
                        <span className="text-[11px] text-text3 font-mono shrink-0">Q{idx + 1}.</span>
                        <span className="text-[11px] text-text truncate flex-1">
                          {q.text || q.title || `Question ${idx + 1}`}
                        </span>
                        <select
                          value={mistakeCategories[key] || ''}
                          onChange={(e) =>
                            setMistakeCategories((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="text-[10px] bg-bg-3 border border-border rounded-lg px-2 py-1.5 text-text3 focus:outline-none focus:border-primary/40 max-w-[130px]"
                        >
                          {MISTAKE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="flex-1 text-sm py-2.5 rounded-xl border bg-bg-2 border-border text-text3 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 text-sm py-2.5 rounded-xl border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
