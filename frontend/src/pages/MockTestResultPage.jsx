import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockTestService, mistakeService } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import { PageLoading } from '../components/common/GateLoadingScreen';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import ProgressRing from '../components/ui/ProgressRing';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ACCENT_GREEN = '#06d6a0';
const ACCENT_RED = '#ef476f';
const ACCENT_AMBER = '#ff9f43';

const MISTAKE_BADGE = {
  conceptual: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  silly: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  time: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  formula: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  reading: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
};

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-bg-3 rounded animate-pulse ${className}`} />;
}

export default function MockTestResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [testProgress, setTestProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('No test ID provided.');
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      mockTestService.getResult(id).then(res => setResult(res.data.data || res.data)),
      mockTestService.getAnalytics().then(res => setAnalytics(res.data.data)),
      mockTestService.getProgress().then(res => {
        const allAttempts = res.data.data || [];
        const testAttempts = allAttempts.filter(a => a.test === id || a.test?._id === id);
        setTestProgress(testAttempts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      }),
    ]).catch(err => {
      const msg = err?.response?.data?.message || 'Failed to load data';
      setError(msg);
      toast.error(msg);
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleQuestion = (qIndex) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const getAccuracyColor = (acc) => {
    if (acc == null) return 'var(--color-text3)';
    if (acc >= 80) return ACCENT_GREEN;
    if (acc >= 50) return ACCENT_AMBER;
    return ACCENT_RED;
  };

  if (loading) {
    return <PageLoading title="Loading Results" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Icon name="alert-triangle" className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-text mb-2">Result Not Found</h2>
        <p className="text-sm text-text3 mb-6 text-center max-w-sm">{error}</p>
        <Link to="/mock-tests" className="text-sm px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">
          Back to Mock Tests
        </Link>
      </div>
    );
  }

  if (!result) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-text3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" /></svg>
      </div>
      <h2 className="text-lg font-semibold text-text mb-2">No Result Data</h2>
      <p className="text-sm text-text3 max-w-sm mb-6 leading-relaxed">This test result isn't available. It may have been removed or you haven't attempted this test yet.</p>
      <Link to="/mock-tests" className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.25)' }}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Browse Tests
      </Link>
    </div>
  );

  const attempt = result.attempt || {};
  const { test, questions = [] } = result;
  const {
    score = 0,
    totalMarks = 0,
    accuracy = 0,
    timeTaken = null,
    rank = null,
    percentile = null,
    weakAreas = [],
    strongAreas = [],
  } = attempt;

  const attemptAnswers = attempt.answers || [];
  const correctAnswers = attemptAnswers.filter(a => a.isCorrect).length;
  const wrongAnswers = attemptAnswers.filter(a => a.selectedAnswer !== null && a.selectedAnswer !== undefined && !a.isCorrect).length;
  const unanswered = attemptAnswers.filter(a => a.selectedAnswer === null || a.selectedAnswer === undefined).length;

  const normalizedQuestions = questions.map(q => ({
    ...q,
    text: q.questionText || q.text || '',
    selectedOption: q.selectedAnswer ?? q.selectedOption,
    correctOption: q.correctAnswer ?? q.correctOption,
  }));

  const testTitle = test?.title || 'Mock Test';
  const subject = test?.subject || '';
  const difficulty = test?.difficulty || '';
  const hasWrongAnswers = wrongAnswers > 0;

  const accuracyColor = getAccuracyColor(accuracy);

  const handleReviewMistakes = async () => {
    try {
      for (const q of normalizedQuestions) {
        const qText = q.questionText || q.text;
        const chosen = q.selectedAnswer ?? q.selectedOption;
        const correct = q.correctAnswer ?? q.correctOption;
        if (!q.isCorrect && chosen != null && chosen !== '' && qText) {
          await mistakeService.create({
            questionText: qText,
            correctAnswer: String(correct),
            yourAnswer: String(chosen),
            category: q.mistakeCategory || 'concept_error',
            sourceTest: 'mock-test',
            subject: q.subject || '',
          }).catch(silentCatch('Create mistake entry', { toast: true }));
        }
      }
      toast.success('Mistakes added to notebook!');
    } catch {
      toast.error('Failed to save some mistakes');
    }
    navigate('/mistakes');
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/mock-tests')}
        className="inline-flex items-center gap-1.5 text-xs text-text3 hover:text-text mb-4 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Back to All Tests
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-start gap-2 mb-1">
            <h1 className="text-lg font-bold text-text truncate">{testTitle}</h1>
            {difficulty && (
              <span className={`text-[10px] px-2 py-0.5 rounded border capitalize shrink-0 ${
                difficulty === 'easy' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                difficulty === 'hard' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {difficulty}
              </span>
            )}
          </div>
          {subject && <p className="text-xs text-text3 mb-3">{subject}</p>}

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold font-mono text-text">{score}</span>
            <span className="text-lg font-mono text-text3">/ {totalMarks}</span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text3">
            <span className="flex items-center gap-1">
              <Icon name="target" className="w-3.5 h-3.5" /> Accuracy: {accuracy != null ? `${accuracy}%` : '—'}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="calendar" className="w-3.5 h-3.5" /> Time: {formatTime(timeTaken)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="award" className="w-3.5 h-3.5" /> Rank: {rank != null ? rank : '—'}
            </span>
            {percentile != null && (
              <span className="flex items-center gap-1">
                <Icon name="trending-up" className="w-3.5 h-3.5" /> Percentile: {percentile}
              </span>
            )}
          </div>
        </GlassCard>
        <GlassCard className="flex flex-col items-center justify-center py-4">
          <ProgressRing
            value={accuracy || 0}
            size={110}
            stroke={8}
            color={accuracyColor}
            trackColor="var(--color-border)"
            label="Accuracy"
          />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <GlassCard className="text-center" padding="p-4">
          <div className="text-xl font-bold font-mono text-green-400">{correctAnswers}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider mt-0.5">Correct</div>
        </GlassCard>
        <GlassCard className="text-center" padding="p-4">
          <div className="text-xl font-bold font-mono text-red-400">{wrongAnswers}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider mt-0.5">Wrong</div>
        </GlassCard>
        <GlassCard className="text-center" padding="p-4">
          <div className="text-xl font-bold font-mono text-text3">{unanswered}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider mt-0.5">Unanswered</div>
        </GlassCard>
      </div>

      {(weakAreas.length > 0 || strongAreas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <GlassCard>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
              <Icon name="alert-triangle" className="w-4 h-4 text-red-400" /> Weak Areas
            </h3>
            {weakAreas.length === 0 ? (
              <p className="text-xs text-text3 py-3">No weak areas detected!</p>
            ) : (
              <div className="space-y-1.5">
                {weakAreas.map((area, i) => (
                  <div key={i} className="text-xs px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-300">
                    {area}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
              <Icon name="star" className="w-4 h-4 text-green-400" /> Strong Areas
            </h3>
            {strongAreas.length === 0 ? (
              <p className="text-xs text-text3 py-3">Keep practicing!</p>
            ) : (
              <div className="space-y-1.5">
            {strongAreas.map((area, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10 text-green-300">
                      {area}
                    </div>
                  ))}
               </div>
            )}
          </GlassCard>
        </div>
      )}

      {testProgress.length > 1 ? (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text mb-3">Attempt Trend (This Test)</h2>
          <GlassCard className="p-4">
            <div className="text-xs text-text3 mb-3">Your performance on this test over time</div>
            <div className="relative h-32">
              <div className="absolute inset-0 flex items-center justify-between text-xs text-text3">
                <span>First: {testProgress[0].score}</span>
                <span>Latest: {testProgress[testProgress.length - 1].score}</span>
              </div>
              <div className="absolute inset-0 flex items-end justify-between gap-1">
                {testProgress.map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-sm transition-all hover:bg-primary/20"
                      style={{
                        height: `${Math.max(8, (point.score / (testProgress.reduce((m, p) => Math.max(m, p.score), 0) || 100)) * 100)}%`,
                        background: i === testProgress.length - 1
                          ? 'var(--color-success)'
                          : point.score >= testProgress.reduce((s, p) => s + p.score, 0) / testProgress.length
                          ? 'var(--color-primary)'
                          : 'var(--color-text3)',
                      }}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-text3 mt-1">
                        {new Date(point.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-text3">
              <span>Attempt Count: {testProgress.length}</span>
              <span>Average: {Math.round(testProgress.reduce((s, p) => s + p.score, 0) / testProgress.length)}</span>
              <span>Improvement: {testProgress.length >= 2 ? (testProgress[testProgress.length - 1].score - testProgress[0].score > 0 ? '+' : '') + (testProgress[testProgress.length - 1].score - testProgress[0].score) : 0}</span>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {normalizedQuestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text mb-3">Question Review</h2>
          <div className="space-y-2">
            {normalizedQuestions.map((q, idx) => {
              const isExpanded = expandedQuestions.has(idx);
              const isCorrect = q.isCorrect;
              const isUnanswered = q.selectedOption == null || q.selectedOption === '';
              const isWrong = !isCorrect && !isUnanswered;

              return (
                <div
                  key={idx}
                  className={`bg-surface border rounded-xl overflow-hidden transition-all ${
                    isCorrect ? 'border-green-500/20' : isWrong ? 'border-red-500/20' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(idx)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left"
                  >
                    <span className={`text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-text3'
                    }`}>
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text line-clamp-2">{q.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isCorrect && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Correct</span>}
                        {isWrong && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Wrong</span>}
                        {isUnanswered && <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-2 text-text3">Unanswered</span>}
                        {q.mistakeCategory && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${MISTAKE_BADGE[q.mistakeCategory] || 'bg-bg-2 text-text3 border-border'}`}>
                            {q.mistakeCategory}
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron" className={`w-3.5 h-3.5 text-text3 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0 border-t border-border/50">
                      <div className="text-xs space-y-2 mt-2">
                        <div className="flex items-center gap-4">
                          <span className="text-text3">Your answer:</span>
                          <span className={`font-mono font-semibold ${isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-text3'}`}>
                            {isUnanswered ? '—' : q.selectedOption}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-text3">Correct answer:</span>
                          <span className="font-mono font-semibold text-green-400">{q.correctOption}</span>
                        </div>
                        {q.explanation && (
                          <div className="bg-bg-2 border border-border rounded-lg p-3 mt-2">
                            <p className="text-text2 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2 pb-8">
        <button
          type="button"
          onClick={() => navigate(`/mock-tests/${id}`)}
          className="text-xs px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold"
        >
          Retake Test
        </button>
        <Link
          to="/mock-tests"
          className="text-xs px-5 py-2.5 rounded-lg bg-bg-2 border border-border text-text3 hover:text-text hover:border-white/10 transition-all"
        >
          Back to All Tests
        </Link>
        {hasWrongAnswers && (
          <button
            type="button"
            onClick={handleReviewMistakes}
            className="text-xs px-5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-semibold"
          >
            Review in Mistake Notebook
          </button>
        )}
      </div>
    </div>
  );
}
