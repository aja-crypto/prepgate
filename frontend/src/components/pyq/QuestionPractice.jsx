// Single PYQ practice with attempt, solution, and stats
import { useState, useEffect } from 'react';
import { pyqService, getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

const DIFF_STYLE = {
  easy: 'bg-green-500/10 border-green-500/20 text-green-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  hard: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function QuestionPractice({ pyqId, onClose, onAttempt }) {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startTime, result]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await pyqService.getById(pyqId);
        setQuestion(res.data.data);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load question'));
      } finally {
        setLoading(false);
      }
    })();
  }, [pyqId]);

  const submit = async (skipped = false) => {
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = await pyqService.attempt(pyqId, {
        selectedAnswer: skipped ? null : selected,
        timeTaken,
        skipped,
      });
      setResult(res.data.data);
      onAttempt?.(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Submit failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-text3 p-8 text-center">Loading question...</div>;
  if (!question) return <div className="text-sm text-text3 p-8 text-center">Question not found</div>;

  const statusColor = { correct: 'text-green-400', incorrect: 'text-red-400', skipped: 'text-orange-400' };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-text">{question.title}</h2>
          <p className="text-xs text-text3 mt-1">
            {question.subject?.name || question.subject} · {question.topic?.name || question.topic} · GATE {question.year}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded border capitalize ${DIFF_STYLE[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6 text-[11px] font-bold text-text3 uppercase tracking-widest">
        <div className={`px-2 py-0.5 rounded ${elapsed > 180 ? 'text-red-400 bg-red-500/10' : 'text-primary bg-primary/10'}`}>
          ⏱️ {formatTime(elapsed)}
        </div>
        <span>· Recommended: 3:00</span>
      </div>

      {question.questionText && (
        <div className="text-sm text-text2 mb-5 leading-relaxed whitespace-pre-wrap">{question.questionText}</div>
      )}

      {question.imageUrl && (
        <img src={question.imageUrl} alt="Question" className="max-w-full rounded-lg mb-4 border border-border" />
      )}

      {!result && question.options?.length > 0 && (
        <div className="space-y-2 mb-5">
          {question.options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelected(opt.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                selected === opt.key
                  ? 'bg-primary/15 border-primary/30 text-text'
                  : 'bg-bg-2 border-border text-text2 hover:border-white/15'
              }`}
            >
              <span className="font-mono font-semibold mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {!result && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={() => submit(false)}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {submitting ? 'Checking...' : 'Submit Answer'}
          </button>
          <button type="button" onClick={() => submit(true)} className="btn-ghost">Skip</button>
          {onClose && <button type="button" onClick={onClose} className="btn-ghost">Close</button>}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`text-sm font-semibold capitalize ${statusColor[result.status]}`}>
            {result.status === 'correct' ? '✓ Correct' : result.status === 'incorrect' ? '✗ Incorrect' : '— Skipped'}
            {result.marks > 0 && <span className="ml-2 text-text3">+{result.marks} marks</span>}
          </div>

          {result.correctAnswer && (
            <div className="text-sm text-text2">
              <span className="text-text3">Correct answer: </span>
              <span className="font-mono font-semibold text-primary">
                {Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer}
              </span>
            </div>
          )}

          {result.explanation && (
            <div className="bg-bg-2 border border-border rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-text3 mb-2">Solution</div>
              <p className="text-sm text-text2 leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {result.questionStats && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Correct %', value: result.questionStats.correctPct, color: 'text-green-400' },
                { label: 'Incorrect %', value: result.questionStats.incorrectPct, color: 'text-red-400' },
                { label: 'Skip %', value: result.questionStats.skipPct, color: 'text-orange-400' },
              ].map((s) => (
                <div key={s.label} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}%</div>
                  <div className="text-[9px] text-text3 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {onClose && <button type="button" onClick={onClose} className="btn-primary w-full">Done</button>}
        </div>
      )}
    </div>
  );
}
