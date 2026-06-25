// src/pages/FlashcardReviewPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useProgress } from '../context/ProgressContext';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
import toast from 'react-hot-toast';

export default function FlashcardReviewPage() {
  const navigate = useNavigate();
  const { topics, subjects } = useProgress();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [reviewStartTime, setReviewStartTime] = useState(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 });

  useEffect(() => {
    loadReviewQueue();
    loadStats();
  }, []);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const res = await flashcardService.getReviewQueue(20);
      if (res.data?.data?.length > 0) {
        setReviewQueue(res.data.data);
        setReviewStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await flashcardService.getStats();
      setStats(res.data?.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleAnswer = async (qualityOfResponse) => {
    if (reviewQueue.length === 0) return;
    
    const current = reviewQueue[currentIndex];
    const reviewTime = reviewStartTime ? Math.round((Date.now() - reviewStartTime) / 1000) : 0;

    try {
      await flashcardService.submitReview(
        current.flashcard?._id || current._id,
        qualityOfResponse,
        reviewTime
      );

      // Update session stats
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: qualityOfResponse >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: qualityOfResponse < 3 ? prev.incorrect + 1 : prev.incorrect,
      }));

      // Move to next card
      if (currentIndex < reviewQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setSelectedAnswer(null);
        setReviewStartTime(Date.now());
      } else {
        toast.success('Review session complete!');
        loadReviewQueue();
        setCurrentIndex(0);
        setIsFlipped(false);
        loadStats();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error('Failed to save review');
    }
  };

  const currentCard = reviewQueue[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Flashcard Review</h1>
          <p className="text-sm text-text3 mt-0.5">
            {reviewQueue.length > 0 
              ? `${currentIndex + 1} of ${reviewQueue.length} cards` 
              : 'No cards due for review'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{stats.dueToday}</div>
                <div className="text-[10px] text-text3">Due</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{stats.streak}</div>
                <div className="text-[10px] text-text3">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{stats.total}</div>
                <div className="text-[10px] text-text3">Total</div>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/flashcard/bank')} className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all">
            Browse Bank
          </button>
        </div>
      </div>

      {/* Session Progress */}
      {sessionStats.reviewed > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-xs text-text3">Session:</span>
          <span className="text-xs text-green-400">{sessionStats.correct} correct</span>
          <span className="text-xs text-red-400">{sessionStats.incorrect} incorrect</span>
          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden ml-2">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(sessionStats.correct / sessionStats.reviewed) * 100}%` }} />
          </div>
        </div>
      )}

      {reviewQueue.length === 0 ? (
        <GlassCard hover={false} padding="p-12" className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-text mb-2">All Caught Up!</h2>
          <p className="text-text3 mb-6">No flashcards due for review right now.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/flashcard/bank')} className="px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium hover:bg-primary/20 transition-all">
              Browse Flashcard Bank
            </button>
            <button onClick={() => navigate('/topics')} className="px-6 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-text2 font-medium hover:bg-white/[0.1] transition-all">
              Study Topics
            </button>
          </div>
        </GlassCard>
      ) : currentCard && (
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }} />
            </div>
            <span className="text-xs text-text3 font-mono">{Math.round(((currentIndex + 1) / reviewQueue.length) * 100)}%</span>
          </div>

          {/* Flashcard */}
          <div 
            onClick={handleFlip}
            className="relative min-h-[400px] cursor-pointer mb-6"
          >
            <GlassCard hover={false} padding="p-8" className="min-h-[400px] flex flex-col items-center justify-center">
              {/* Question Side */}
              {!isFlipped ? (
                <div className="text-center w-full">
                  <div className="mb-4">
                    <span className="text-[10px] px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {currentCard.subject?.name || 'General'}
                    </span>
                    <span className="text-[10px] px-3 py-1 rounded-full bg-white/5 text-text3 ml-2">
                      {currentCard.topic?.name || 'Topic'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-text mb-6">
                    {currentCard.flashcard?.question || currentCard.question || 'Question not available'}
                  </h3>

                  {/* MCQ Options */}
                  {currentCard.flashcard?.options?.length > 0 && (
                    <div className="space-y-2 w-full max-w-md mx-auto">
                      {currentCard.flashcard.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setSelectedAnswer(opt.key); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            selectedAnswer === opt.key 
                              ? 'border-primary/50 bg-primary/10' 
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className="font-mono text-text2 mr-3">{opt.key}.</span>
                          <span className="text-text">{opt.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-text3 text-sm mt-8">Tap card or press Space to reveal answer</p>
                </div>
              ) : (
                /* Answer Side */
                <div className="text-center w-full">
                  <div className="mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
                      Answer
                    </span>
                  </div>

                  {currentCard.flashcard?.answer && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-lg font-semibold text-green-400">
                        {currentCard.flashcard.answer}
                      </p>
                    </div>
                  )}

                  {currentCard.flashcard?.explanation && (
                    <div className="mt-4 text-left">
                      <h4 className="text-sm font-semibold text-text3 mb-2">Explanation:</h4>
                      <p className="text-sm text-text">{currentCard.flashcard.explanation}</p>
                    </div>
                  )}

                  {currentCard.flashcard?.formula && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs text-blue-400 mb-1">Formula</div>
                      <div className="text-lg font-mono text-blue-300">
                        {currentCard.flashcard.formula.latex || currentCard.flashcard.formula.text}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Flip indicator */}
            <div className="absolute bottom-4 right-4 text-xs text-text3">
              {isFlipped ? 'Answer' : 'Question'}
            </div>
          </div>

          {/* Rating buttons */}
          {isFlipped && (
            <div className="space-y-3">
              <p className="text-center text-sm text-text3 mb-2">How well did you know this?</p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { q: 0, label: 'Again', color: 'bg-red-500', hover: 'hover:bg-red-600' },
                  { q: 1, label: 'Hard', color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
                  { q: 2, label: 'Good', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
                  { q: 3, label: 'Easy', color: 'bg-lime-500', hover: 'hover:bg-lime-600' },
                  { q: 4, label: 'Perfect', color: 'bg-green-500', hover: 'hover:bg-green-600' },
                ].map(({ q, label, color, hover }) => (
                  <button
                    key={q}
                    onClick={() => handleAnswer(q)}
                    className={`py-3 rounded-xl ${color} ${hover} text-white text-sm font-semibold transition-all`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-center text-[10px] text-text3 mt-2">
                Again = Complete blackout | Perfect = Instant recall
              </p>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-text3 text-xs">
        <span>Space: Flip</span>
        <span>1-5: Rate</span>
        <span>← →: Navigate</span>
      </div>
    </div>
  );
}