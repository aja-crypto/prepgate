// Interactive mock test runner with timer and solution review
import { useState, useEffect, useRef, useCallback } from 'react';
import { mockSessionService, mistakeService, getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

const MISTAKE_CATEGORIES = [
  { key: 'concept_error', label: 'Concept Error', icon: '💡' },
  { key: 'formula_error', label: 'Formula Error', icon: '📐' },
  { key: 'silly_mistake', label: 'Silly Mistake', icon: '😅' },
  { key: 'time_pressure', label: 'Time Pressure', icon: '⏱' },
  { key: 'guess', label: 'Guess', icon: '🎲' },
];

export default function MockTestRunner({ sessionId, onComplete, onCancel }) {
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [loggedMistakes, setLoggedMistakes] = useState({});
  const [loggingMistakes, setLoggingMistakes] = useState({});
  const qStart = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await mockSessionService.getById(sessionId);
        const data = res.data.data;
        setSession(data);
        setTimeLeft((data.config?.durationMinutes || 60) * 60);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load mock test'));
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    if (!session || results) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = session?.questions || [];
  const q = questions[current];
  const pyq = q?.pyq;

  const recordTime = useCallback(() => {
    if (!pyq) return;
    const elapsed = Math.round((Date.now() - qStart.current) / 1000);
    setQuestionTimes((prev) => ({ ...prev, [pyq._id]: (prev[pyq._id] || 0) + elapsed }));
    qStart.current = Date.now();
  }, [pyq]);

  const selectAnswer = (key) => {
    if (!pyq) return;
    setAnswers((prev) => ({ ...prev, [pyq._id]: key }));
  };

  const goTo = (idx) => {
    recordTime();
    setCurrent(idx);
    qStart.current = Date.now();
  };

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    recordTime();
    setSubmitting(true);
    try {
      const payload = questions.map((item) => {
        const id = item.pyq._id;
        const sel = answers[id];
        return {
          pyqId: id,
          selectedAnswer: sel || null,
          timeTaken: questionTimes[id] || 0,
          skipped: !sel,
        };
      });
      const res = await mockSessionService.submit(sessionId, payload);
      setResults(res.data.data);
      onComplete?.(res.data.data);
      if (auto) toast('Time up — test auto-submitted', { icon: '⏱' });
      else toast.success('Mock test submitted!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Submit failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const logMistake = async (sol, idx) => {
    if (!session || loggedMistakes[sol.pyqId]) return;
    setLoggingMistakes((prev) => ({ ...prev, [sol.pyqId]: true }));
    try {
      const question = session.questions.find((q) => q.pyq._id === sol.pyqId)?.pyq;
      const subjectName = question?.subject?.name || 'Unknown';
      const subjectCode = subjectName.split(' ').slice(-1)[0].substring(0, 3).toUpperCase();
      
      await mistakeService.create({
        questionText: question?.questionText || sol.title || 'PYQ Question',
        subject: subjectCode,
        topic: question?.topic?.name || '',
        yourAnswer: sol.selectedAnswer,
        correctAnswer: Array.isArray(sol.correctAnswer) ? sol.correctAnswer.join(', ') : String(sol.correctAnswer),
        category: selectedCategories[sol.pyqId] || 'concept_error',
        sourceTest: session.name || 'Mock Test',
      });
      setLoggedMistakes((prev) => ({ ...prev, [sol.pyqId]: true }));
      toast.success('Mistake logged to Mistake Notebook!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to log mistake: ${msg}`);
    } finally {
      setLoggingMistakes((prev) => ({ ...prev, [sol.pyqId]: false }));
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!session) return <div className="text-sm text-text3 p-8 text-center">Loading mock test...</div>;

  if (results) {
    const { resultStats, score, maxScore, accuracy, totalTime, solutions } = results;
    return (
      <div className="space-y-5">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text mb-4">{session.name} — Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-bg-2 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-primary">{score}/{maxScore}</div>
              <div className="text-[10px] text-text3">Score</div>
            </div>
            <div className="bg-bg-2 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-green-400">{accuracy}%</div>
              <div className="text-[10px] text-text3">Accuracy</div>
            </div>
            <div className="bg-bg-2 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono text-text">{formatTime(totalTime)}</div>
              <div className="text-[10px] text-text3">Time</div>
            </div>
            <div className="bg-bg-2 rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono text-text">
                <span className="text-green-400">{resultStats.correct}</span>/
                <span className="text-red-400">{resultStats.incorrect}</span>/
                <span className="text-orange-400">{resultStats.skipped}</span>
              </div>
              <div className="text-[10px] text-text3">C / I / S</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Solutions</h3>
          {(solutions || []).map((sol, i) => (
            <div key={sol.pyqId || i} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text">Q{i + 1}. {sol.title}</span>
                <span className={`text-[10px] capitalize ${
                  sol.status === 'correct' ? 'text-green-400' : sol.status === 'incorrect' ? 'text-red-400' : 'text-orange-400'
                }`}>{sol.status}</span>
              </div>
              {sol.explanation && <p className="text-xs text-text2 mb-2">{sol.explanation}</p>}
              <div className="text-[10px] text-text3">
                Your: {sol.selectedAnswer || '—'} · Correct: {Array.isArray(sol.correctAnswer) ? sol.correctAnswer.join(', ') : sol.correctAnswer}
              </div>
              {sol.questionStats && (
                <div className="flex gap-3 mt-2 text-[9px] text-text3">
                  <span className="text-green-400">✓ {sol.questionStats.correctPct}%</span>
                  <span className="text-red-400">✗ {sol.questionStats.incorrectPct}%</span>
                  <span className="text-orange-400">— {sol.questionStats.skipPct}%</span>
                </div>
              )}
              {sol.status === 'incorrect' && (
                <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Log to Mistake Notebook</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {MISTAKE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategories((prev) => ({ ...prev, [sol.pyqId]: cat.key }))}
                        className={`text-[9px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                          selectedCategories[sol.pyqId] === cat.key
                            ? 'bg-primary/15 border-primary/30 text-primary'
                            : 'bg-bg-2 border-border text-text3 hover:border-white/15'
                        }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => logMistake(sol, i)}
                    disabled={loggingMistakes[sol.pyqId] || loggedMistakes[sol.pyqId]}
                    className={`w-full text-[10px] font-bold py-1.5 rounded-lg transition-all ${
                      loggedMistakes[sol.pyqId]
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-primary text-white hover:opacity-90'
                    }`}
                  >
                    {loggingMistakes[sol.pyqId] ? 'Logging...' : loggedMistakes[sol.pyqId] ? '✓ Logged!' : 'Log Mistake'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!pyq) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-text">{session.name}</h2>
          <p className="text-xs text-text3">Question {current + 1} of {questions.length}</p>
        </div>
        <div className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-primary'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-4">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`w-8 h-8 text-[10px] rounded-lg border ${
              i === current ? 'bg-primary/20 border-primary/40 text-primary'
                : answers[questions[i].pyq._id] ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-bg-2 border-border text-text3'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 mb-4">
        <div className="text-sm font-medium text-text mb-1">{pyq.title}</div>
        <div className="text-[11px] text-text3 mb-4">
          {pyq.subject?.name} · {pyq.topic?.name} · GATE {pyq.year} · {q.marks} marks
        </div>
        {pyq.questionText && <p className="text-sm text-text2 mb-4 whitespace-pre-wrap">{pyq.questionText}</p>}

        <div className="space-y-2">
          {(pyq.options || []).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => selectAnswer(opt.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm ${
                answers[pyq._id] === opt.key
                  ? 'bg-primary/15 border-primary/30 text-text'
                  : 'bg-bg-2 border-border text-text2 hover:border-white/15'
              }`}
            >
              <span className="font-mono font-semibold mr-2">{opt.key}.</span>{opt.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={current === 0} onClick={() => goTo(current - 1)} className="btn-ghost">Previous</button>
        {current < questions.length - 1 ? (
          <button type="button" onClick={() => goTo(current + 1)} className="btn-primary flex-1">Next</button>
        ) : (
          <button type="button" disabled={submitting} onClick={() => handleSubmit(false)} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        )}
        <button type="button" onClick={onCancel} className="btn-ghost">Exit</button>
      </div>
    </div>
  );
}
