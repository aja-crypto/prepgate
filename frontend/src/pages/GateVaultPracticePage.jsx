import { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { gateVaultService } from '../services/api';
import {
  PremiumOptionButton,
  PremiumProgressBar,
  ParticleExplosion,
  ConfettiCelebration,
  XPGainAnimation,
  StreakCounter,
  SuccessGlow,
  ErrorGlow,
  NeuralBackground,
  CompletionScreen,
  useSoundEffects,
} from '../components/gate/GateVaultAnimations';

export default function GateVaultPracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setId, questions = [], totalQuestions, progressId, selectedSubjects = ['APT'], isDemo } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(location.state?.currentIndex || 0);
  const [answers, setAnswers] = useState({});
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [progress, setProgress] = useState({ score: 0, correctCount: 0, accuracy: 0, streak: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(10);
  const [cardShake, setCardShake] = useState(false);
  const [showKnown, setShowKnown] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [slideDir, setSlideDir] = useState(null);
  const [knownQueue, setKnownQueue] = useState(new Set());
  const [reviewQueue, setReviewQueue] = useState(new Set());

  const cardRef = useRef(null);
  const dragX = useMotionValue(0);
  const opacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);
  const { playCorrect, playWrong, playComplete } = useSoundEffects();

  const currentQuestion = questions[currentIndex];
  const isLastCard = currentIndex === questions.length - 1;

  const totalAnswered = useMemo(() => Object.keys(answers).length, [answers]);

  const stats = useMemo(() => {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    return {
      correctCount,
      score: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
    };
  }, [answers, totalAnswered]);

  const resetCard = () => {
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setShowKnown(false);
    setShowReview(false);
    setSlideDir(null);
  };

  const flipCard = () => {
    animate(dragX, 0, { duration: 0.3 });
    setIsFlipped(!isFlipped);
  };

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCard();
    }
  }, [currentIndex, questions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetCard();
    }
  }, [currentIndex]);

  const handleAnswer = async (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    let correct = false;
    let ca = null;
    let exp = '';

    if (isDemo) {
      correct = answerIndex === currentQuestion.correctAnswer;
      ca = currentQuestion.correctAnswer;
      exp = currentQuestion.explanation || '';
    } else {
      try {
        const res = await gateVaultService.submitAnswer({
          monthlySetId: setId,
          questionIndex: currentIndex,
          selectedAnswer: answerIndex,
          timeTaken: 30,
        });
        if (res.data.success) {
          const d = res.data.data;
          correct = d.isCorrect;
          ca = d.correctAnswer;
          exp = d.explanation;
        }
      } catch (e) {
        console.error('Failed to submit answer:', e);
        correct = answerIndex === currentQuestion.correctAnswer;
        ca = currentQuestion.correctAnswer;
        exp = currentQuestion.explanation || '';
      }
    }

    setIsCorrect(correct);
    setCorrectAnswer(ca);
    setExplanation(exp);

    const newAnswers = { ...answers, [currentIndex]: { selected: answerIndex, correct } };
    setAnswers(newAnswers);

    const correctCount = Object.values(newAnswers).filter(a => a.correct).length;
    const totalAnswered = Object.keys(newAnswers).length;
    const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const newStreak = correct ? progress.streak + 1 : 0;

    const xp = correct ? 10 + Math.min(newStreak * 2, 20) : 0;

    setProgress({
      score,
      correctCount,
      accuracy: score,
      streak: newStreak,
    });

    if (correct) {
      setShowParticles(true);
      setShowXP(true);
      setXpAmount(xp);
      playCorrect();
      setTimeout(() => setShowParticles(false), 1000);
      setTimeout(() => setShowXP(false), 1500);
    } else {
      setCardShake(true);
      playWrong();
      setTimeout(() => setCardShake(false), 600);
    }

    if (currentIndex === questions.length - 1) {
      setShowConfetti(true);
      playComplete();
      setTimeout(() => setIsCompleted(true), 2000);
    }
  };

  const handleKnown = () => {
    setShowKnown(true);
    setSlideDir('right');
    const updated = new Set(knownQueue);
    updated.add(currentIndex);
    setKnownQueue(updated);
    setTimeout(() => goToNext(), 400);
  };

  const handleReviewAgain = () => {
    setShowReview(true);
    setSlideDir('left');
    const updated = new Set(reviewQueue);
    updated.add(currentIndex);
    setReviewQueue(updated);
    setTimeout(() => goToNext(), 400);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-text3">No questions available</p>
        <button onClick={() => navigate('/gate-vault')} className="mt-4 text-primary underline">
          Go Back
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <>
        <NeuralBackground />
        <CompletionScreen
          visible={true}
          score={progress.score}
          correctCount={progress.correctCount}
          totalQuestions={questions.length}
          streak={progress.streak}
          onFinish={() => navigate('/dashboard')}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NeuralBackground />

      <ConfettiCelebration active={showConfetti} count={60} />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/gate-vault')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-bg-2/80 backdrop-blur-sm border border-border flex items-center justify-center text-text3 hover:text-text transition-colors"
            aria-label="Close practice"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium text-purple-400">GateVault</span>
          </motion.div>

          <StreakCounter streak={progress.streak} visible={true} />
        </div>

        {/* Progress Bar */}
        <PremiumProgressBar progress={currentIndex} total={questions.length} score={progress.score} />

        {/* Subject Badge */}
        <div className="flex justify-center mb-4">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: `linear-gradient(135deg, ${getSubjectColor(currentQuestion?.subject)}20, ${getSubjectColor(currentQuestion?.subject)}10)`,
              color: getSubjectColor(currentQuestion?.subject),
              border: `1px solid ${getSubjectColor(currentQuestion?.subject)}40`,
            }}
          >
            {currentQuestion?.subject} • {currentQuestion?.topic || 'General'}
          </motion.span>
        </div>

        <XPGainAnimation amount={xpAmount} visible={showXP} />

        {/* Card Container */}
        <div ref={cardRef} className="mb-5 relative">
          <SuccessGlow active={showResult && isCorrect} />
          <ErrorGlow active={showResult && !isCorrect} />

          {showResult && (
            <>
              <motion.div
                className="absolute -right-3 top-1/3 z-20 pointer-events-none"
                initial={{ opacity: 0, x: 20 }}
                animate={showKnown ? { opacity: 1, x: 0, scale: [1, 1.3, 0], transition: { duration: 0.4 } } : {}}
              >
                <span className="text-2xl">✅</span>
              </motion.div>
              <motion.div
                className="absolute -left-3 top-1/3 z-20 pointer-events-none"
                initial={{ opacity: 0, x: -20 }}
                animate={showReview ? { opacity: 1, x: 0, scale: [1, 1.3, 0], transition: { duration: 0.4 } } : {}}
              >
                <span className="text-2xl">🔄</span>
              </motion.div>
            </>
          )}

          <AnimatePresence>
            {showParticles && (
              <ParticleExplosion
                x={cardRef.current?.offsetWidth / 2 || 0}
                y={cardRef.current?.offsetHeight / 2 || 0}
                color="#10b981"
                count={25}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(e, { offset }) => {
                if (Math.abs(offset.x) > 80) {
                  if (offset.x < 0) goToNext();
                  else goToPrev();
                }
                animate(dragX, 0, { duration: 0.3, ease: 'easeOut' });
              }}
              style={{
                x: slideDir === 'right' ? [0, 300] : slideDir === 'left' ? [0, -300] : dragX,
                opacity: slideDir ? [1, 0] : opacity,
              }}
              className="cursor-grab active:cursor-grabbing"
              transition={slideDir ? { duration: 0.35 } : {}}
            >
              <div className="perspective-1000">
                <motion.div
                  onClick={flipCard}
                  className="relative w-full min-h-[380px] md:min-h-[420px] cursor-pointer"
                  initial={false}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                    x: cardShake ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
                  }}
                  transition={{
                    rotateY: { duration: 0.5, type: 'spring', stiffness: 260, damping: 24 },
                    x: { duration: 0.4, ease: 'easeOut' },
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border p-5 md:p-7 backdrop-blur-md overflow-y-auto"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,27,75,0.92), rgba(15,15,35,0.96))',
                      borderColor: 'rgba(168,85,247,0.3)',
                      backfaceVisibility: 'hidden',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base md:text-lg font-medium text-text leading-relaxed max-w-sm"
                      >
                        {currentQuestion?.question}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xs text-text3 mt-6 flex items-center gap-2"
                      >
                        <span>Tap to reveal options</span>
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          👆
                        </motion.span>
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* Back */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border p-5 md:p-7 backdrop-blur-md overflow-y-auto"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,27,75,0.92), rgba(15,15,35,0.96))',
                      borderColor: showResult
                        ? isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
                        : 'rgba(168,85,247,0.3)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: showResult
                        ? isCorrect
                          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(16,185,129,0.15)'
                          : '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(239,68,68,0.15)'
                        : '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(168,85,247,0.08)',
                    }}
                  >
                    <p className="text-xs text-text3 mb-3 uppercase tracking-wider font-semibold">Select your answer:</p>
                    <div className="space-y-2.5">
                      {currentQuestion?.options?.map((option, idx) => (
                        <PremiumOptionButton
                          key={idx}
                          option={option}
                          index={idx}
                          selected={selectedAnswer}
                          correct={correctAnswer}
                          wrong={selectedAnswer !== correctAnswer && showResult && selectedAnswer === idx}
                          disabled={showResult}
                          onClick={() => !showResult && handleAnswer(idx)}
                          showResult={showResult}
                          correctAnswer={correctAnswer}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Explanation Panel */}
        <AnimatePresence>
          {showResult && explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="mb-5 p-4 md:p-5 rounded-2xl backdrop-blur-sm"
              style={{
                background: isCorrect
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))',
                border: isCorrect
                  ? '1px solid rgba(16,185,129,0.3)'
                  : '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </span>
                {isCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-lg"
                  >
                    ⚡
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-text leading-relaxed">{explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {showResult ? (
          <div className="flex gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReviewAgain}
              className="flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold text-amber-300 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(217,119,6,0.2), rgba(217,119,6,0.1))',
                border: '1px solid rgba(217,119,6,0.35)',
                boxShadow: showReview ? '0 0 30px rgba(217,119,6,0.3)' : 'none',
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(217,119,6,0.15)' }}
                animate={showReview ? { opacity: [0, 1, 0], scale: [0.95, 1.05, 0.95] } : {}}
                transition={{ duration: 0.4 }}
              />
              <span className="relative">🔄 Review Again</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleKnown}
              className="flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: showKnown ? '0 0 30px rgba(22,163,74,0.4)' : '0 4px 16px rgba(22,163,74,0.25)',
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                animate={showKnown ? { opacity: [0, 1, 0], scale: [0.95, 1.05, 0.95] } : {}}
                transition={{ duration: 0.4 }}
              />
              <span className="relative">✅ Known</span>
            </motion.button>
          </div>
        ) : (
          <div className="flex gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex-1 py-3.5 min-h-[48px] rounded-xl border border-border bg-bg-2/80 backdrop-blur-sm text-text disabled:opacity-30 hover:bg-bg-3 transition-all flex items-center justify-center gap-2"
            >
              <span>←</span>
              <span>Previous</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNext}
              disabled={currentIndex === questions.length - 1}
              className="flex-1 py-3.5 min-h-[48px] rounded-xl font-semibold text-white disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
              }}
            >
              <span>Next</span>
              <span>→</span>
            </motion.button>
          </div>
        )}

        {/* Swipe Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center text-xs text-text3 mt-2"
        >
          ← Swipe to navigate →
        </motion.p>
      </div>
    </div>
  );
}

function getSubjectColor(subject) {
  const colors = {
    APT: '#f59e0b',
    DS: '#10b981',
    DBMS: '#6366f1',
    OS: '#8b5cf6',
    CN: '#06b6d4',
    CO: '#ec4899',
    TOC: '#f97316',
    CD: '#14b8a6',
    AL: '#ef4444',
    MA: '#a855f7',
  };
  return colors[subject] || '#a855f7';
}
