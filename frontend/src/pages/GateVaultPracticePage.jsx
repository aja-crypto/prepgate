import { useState, useRef } from 'react';
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
  FloatingOrb,
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

  const cardRef = useRef(null);
  const dragX = useMotionValue(0);
  const opacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);
  const { playCorrect, playWrong, playComplete } = useSoundEffects();

  const currentQuestion = questions[currentIndex];

  const resetCard = () => {
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
  };

  const flipCard = () => {
    animate(dragX, 0, { duration: 0.3 });
    setIsFlipped(!isFlipped);
  };

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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCard();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetCard();
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text3">No questions available</p>
        <button onClick={() => navigate('/gate-vault')} className="mt-4 text-primary underline">
          Go Back
        </button>
      </div>
    );
  }

  // Premium completion screen
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
          onFinish={handleFinish}
        />
      </>
    );
  }

  return (
    <div className="relative">
      {/* Neural Background */}
      <NeuralBackground />

      {/* Floating orbs */}
      <FloatingOrb color="#a855f7" size={200} blur={80} x="5%" y="10%" duration={20} />
      <FloatingOrb color="#6366f1" size={150} blur={60} x="70%" y="50%" duration={25} />
      <FloatingOrb color="#10b981" size={100} blur={50} x="85%" y="15%" duration={18} />

      {/* Confetti overlay */}
      <ConfettiCelebration active={showConfetti} count={60} />

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/gate-vault')}
            className="w-10 h-10 rounded-xl bg-bg-2/80 backdrop-blur-sm border border-border flex items-center justify-center text-text3 hover:text-text transition-colors"
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

        {/* Premium Progress Bar */}
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

        {/* XP Animation */}
        <XPGainAnimation amount={xpAmount} visible={showXP} />

        {/* Card Container */}
        <div ref={cardRef} className="mb-6 relative">
          {/* Success/Error Glow */}
          <SuccessGlow active={showResult && isCorrect} />
          <ErrorGlow active={showResult && !isCorrect} />

          {/* Particle explosion */}
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
              dragElastic={0.15}
              onDragEnd={(e, { offset }) => {
                if (Math.abs(offset.x) > 80) {
                  if (offset.x < 0) handleNext();
                  else handlePrevious();
                }
                animate(dragX, 0, { duration: 0.4, ease: 'easeOut' });
              }}
              style={{ x: dragX, opacity }}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* 3D Flip Card */}
              <div className="perspective-1000">
                <motion.div
                  onClick={flipCard}
                  className="relative w-full min-h-[380px] cursor-pointer"
                  initial={false}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                    x: cardShake ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
                  }}
                  transition={{
                    rotateY: { duration: 0.6, type: 'spring', stiffness: 280, damping: 28 },
                    x: { duration: 0.5 },
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border p-6 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,27,75,0.9), rgba(15,15,35,0.95))',
                      borderColor: 'rgba(168,85,247,0.3)',
                      backfaceVisibility: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg font-medium text-text leading-relaxed max-w-sm"
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
                    className="absolute inset-0 rounded-2xl border p-6 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30,27,75,0.9), rgba(15,15,35,0.95))',
                      borderColor: showResult
                        ? isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
                        : 'rgba(168,85,247,0.3)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: showResult
                        ? isCorrect
                          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(16,185,129,0.2)'
                          : '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(239,68,68,0.2)'
                        : '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(168,85,247,0.1)',
                    }}
                  >
                    <p className="text-xs text-text3 mb-3 uppercase tracking-wider font-semibold">Select your answer:</p>
                    <div className="space-y-3">
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
              className="mb-6 p-5 rounded-2xl backdrop-blur-sm"
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

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 py-3.5 rounded-xl border border-border bg-bg-2/80 backdrop-blur-sm text-text disabled:opacity-30 hover:bg-bg-3 transition-all flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>Previous</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 py-3.5 rounded-xl font-semibold text-white disabled:opacity-30 transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
            }}
          >
            <span>Next</span>
            <span>→</span>
          </motion.button>
        </div>

        {/* Swipe Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center text-xs text-text3 mt-4"
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