import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// PARTICLE SYSTEM - Correct Answer Celebration
// ============================================
export function ParticleExplosion({ x = 0, y = 0, color = '#10b981', count = 20 }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const velocity = 100 + Math.random() * 150;
    return {
      id: i,
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: 0,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}, transparent)`,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            left: '50%',
            top: '50%',
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// CONFETTI SYSTEM - Full Celebration
// ============================================
const CONFETTI_COLORS = ['#a855f7', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

function ConfettiPiece({ style, color }) {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = 6 + Math.random() * 8;

  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
      animate={{
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{ duration: 3 + Math.random() * 2, ease: 'easeIn' }}
      className="absolute"
      style={{
        width: size,
        height: size,
        background: color,
        ...style,
        ...(shape === 'circle' && { borderRadius: '50%' }),
        ...(shape === 'triangle' && {
          width: 0,
          height: 0,
          background: 'transparent',
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }),
      }}
    />
  );
}

export function ConfettiCelebration({ active, count = 80 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.5,
    duration: 2.5 + Math.random() * 1.5,
  }));

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {pieces.map((p) => (
            <ConfettiPiece key={p.id} color={p.color} style={{ left: p.left }} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// XP GAIN ANIMATION
// ============================================
export function XPGainAnimation({ amount = 10, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -60, scale: 1.2 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ marginLeft: -30 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(99,102,241,0.9))',
              boxShadow: '0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)',
            }}
          >
            <span className="text-lg">⚡</span>
            <span className="text-white font-bold text-lg">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// STREAK COUNTER ANIMATION
// ============================================
export function StreakCounter({ streak, visible }) {
  const [displayStreak, setDisplayStreak] = useState(streak);
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (streak > prevStreak.current) {
      // Animate increment
      let current = prevStreak.current;
      const interval = setInterval(() => {
        current++;
        setDisplayStreak(current);
        if (current >= streak) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
    setDisplayStreak(streak);
    prevStreak.current = streak;
  }, [streak]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={streak}
        initial={{ scale: 1.3, color: '#f59e0b' }}
        animate={{ scale: 1, color: streak >= 5 ? '#ef4444' : streak >= 3 ? '#f59e0b' : '#a855f7' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center gap-1"
      >
        <span className="text-lg">🔥</span>
        <span className="font-bold text-lg">{displayStreak}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// SUCCESS GLOW EFFECT
// ============================================
export function SuccessGlow({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0, scale: 1.3 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(16,185,129,0.5), inset 0 0 30px rgba(16,185,129,0.2)',
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ============================================
// ERROR GLOW EFFECT
// ============================================
export function ErrorGlow({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(239,68,68,0.4), inset 0 0 30px rgba(239,68,68,0.15)',
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ============================================
// CARD SHAKE ANIMATION
// ============================================
export function CardShake({ children, trigger }) {
  const shakeVariants = {
    initial: { x: 0 },
    shake: {
      x: [0, -12, 12, -10, 10, -6, 6, -3, 3, 0],
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      animate={trigger ? 'shake' : 'initial'}
      variants={shakeVariants}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// FLOATING GRADIENT ORB
// ============================================
export function FloatingOrb({ color = '#a855f7', size = 300, blur = 100, x = 0, y = 0, duration = 20 }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full blur-3xl"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        left: x,
        top: y,
      }}
      animate={{
        x: [0, 30, -20, 40, 0],
        y: [0, -20, 30, -10, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ============================================
// PREMIUM CARD WRAPPER
// ============================================
export function PremiumCard({ children, className = '', glowColor = null, shake = false, pulse = false }) {
  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
          : pulse
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      {glowColor && (
        <div
          className="absolute -inset-1 rounded-2xl blur-xl opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
        />
      )}
      {children}
    </motion.div>
  );
}

// ============================================
// TROPHY ANIMATION
// ============================================
export function TrophyAnimation({ visible, rank }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <div className="relative">
            {/* Trophy glow */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-10 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4), transparent 70%)' }}
            />
            {/* Trophy icon */}
            <div className="text-8xl relative z-10">🏆</div>
            {/* Sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((Math.PI * 2 * i) / 8) * 60,
                  y: Math.sin((Math.PI * 2 * i) / 8) * 60,
                }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="absolute left-1/2 top-1/2 text-2xl"
              >
                ✨
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// ACCURACY COUNTER
// ============================================
export function AccuracyCounter({ accuracy, visible }) {
  const [display, setDisplay] = useState(0);
  const prevAccuracy = useRef(0);

  useEffect(() => {
    if (visible) {
      const start = prevAccuracy.current;
      const end = accuracy;
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
        const current = Math.round(start + (end - start) * eased);
        setDisplay(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevAccuracy.current = end;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [accuracy, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="text-6xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {display}%
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-text3 mt-2"
          >
            Accuracy
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// RANK REVELATION
// ============================================
export function RankReveal({ rank, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="text-center mt-6"
        >
          <p className="text-text3 text-sm mb-2">Estimated GATE Rank</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <span className="text-2xl">🎯</span>
            <span className="text-3xl font-bold text-transparent bg-clip-text" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
              {rank}
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-text2 text-xs mt-2"
          >
            Based on your performance
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// NEURAL NETWORK BACKGROUND
// ============================================
export function NeuralBackground() {
  const nodes = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient orbs */}
      <FloatingOrb color="#a855f7" size={400} blur={150} x="10%" y="20%" duration={25} />
      <FloatingOrb color="#6366f1" size={350} blur={120} x="60%" y="60%" duration={30} />
      <FloatingOrb color="#10b981" size={250} blur={100} x="80%" y="10%" duration={20} />

      {/* Neural network lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        {nodes.current.slice(0, 10).map((n1, i) =>
          nodes.current.slice(i + 1, i + 4).map((n2, j) => (
            <motion.line
              key={`${n1.id}-${n2.id}`}
              x1={`${n1.x}%`}
              y1={`${n1.y}%`}
              x2={`${n2.x}%`}
              y2={`${n2.y}%`}
              stroke="url(#neuralGradient)"
              strokeWidth="0.5"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{
                duration: n1.duration,
                repeat: Infinity,
                delay: j * 0.5,
              }}
            />
          ))
        )}
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nodes */}
      {nodes.current.map((n) => (
        <motion.div
          key={n.id}
          className="absolute rounded-full bg-purple-500"
          style={{
            width: n.size,
            height: n.size,
            left: `${n.x}%`,
            top: `${n.y}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: n.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// PREMIUM OPTION BUTTON
// ============================================
export function PremiumOptionButton({
  option,
  index,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
  showResult,
  correctAnswer,
}) {
  const letter = String.fromCharCode(65 + index);
  const isCorrectOpt = showResult && index === correctAnswer;
  const isWrongOpt = showResult && index === selected && index !== correctAnswer;
  const isSelected = selected === index && !showResult;

  const getStyle = () => {
    if (isCorrectOpt) return 'border-emerald-500/60 bg-emerald-500/15';
    if (isWrongOpt) return 'border-red-500/60 bg-red-500/15';
    if (isSelected) return 'border-purple-500/60 bg-purple-500/10';
    return 'border-border bg-bg-2 hover:bg-bg-3 hover:border-purple-500/30';
  };

  const getIconStyle = () => {
    if (isCorrectOpt) return 'bg-emerald-500 text-white';
    if (isWrongOpt) return 'bg-red-500 text-white';
    return 'bg-bg-3 text-text3';
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${getStyle()} ${
        !showResult ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'
      }`}
      initial={false}
      animate={
        isCorrectOpt
          ? {
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 0 0 0 rgba(16,185,129,0)',
                '0 0 25px 5px rgba(16,185,129,0.4)',
                '0 0 0 0 rgba(16,185,129,0)',
              ],
            }
          : isWrongOpt
          ? {
              x: [0, -10, 10, -8, 8, -5, 5, 0],
              boxShadow: [
                '0 0 0 0 rgba(239,68,68,0)',
                '0 0 25px 5px rgba(239,68,68,0.3)',
                '0 0 0 0 rgba(239,68,68,0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
    >
      {/* Letter indicator */}
      <motion.span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getIconStyle()}`}
        animate={
          isCorrectOpt
            ? { scale: [0, 1.3, 1], rotate: [0, 10, -10, 0] }
            : isWrongOpt
            ? { scale: [0, 1.2, 1] }
            : {}
        }
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isCorrectOpt ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : isWrongOpt ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : letter}
      </motion.span>

      {/* Option text */}
      <span className="text-text flex-1">{option}</span>

      {/* Result labels */}
      <AnimatePresence>
        {showResult && (isCorrectOpt || isWrongOpt) && (
          <motion.span
            initial={{ opacity: 0, scale: 0, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isCorrectOpt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isCorrectOpt ? '✓ Correct' : '✗ Wrong'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// PROGRESS BAR PREMIUM
// ============================================
export function PremiumProgressBar({ progress, total, score }) {
  const percentage = ((progress + 1) / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-text3 mb-2">
        <span>Question {progress + 1} of {total}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2.5 bg-bg-2 rounded-full overflow-hidden relative">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #a855f7, #6366f1)',
            boxShadow: '0 0 20px rgba(168,85,247,0.5)',
          }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// ============================================
// SOUND EFFECTS HOOK
// ============================================
export function useSoundEffects() {
  const playCorrect = useCallback(() => {
    // Create a simple beep sound for correct (if Web Audio available)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const playWrong = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const playComplete = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      // Audio not supported
    }
  }, []);

  return { playCorrect, playWrong, playComplete };
}

// ============================================
// COMPLETION SCREEN
// ============================================
export function CompletionScreen({
  visible,
  score,
  correctCount,
  totalQuestions,
  streak,
  onFinish
}) {
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const rank = calculateRank(accuracy, score);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
          {/* Neural background */}
          <NeuralBackground />

          {/* Confetti */}
          <ConfettiCelebration active={true} count={100} />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative max-w-md w-full text-center"
          >
            {/* Trophy */}
            <TrophyAnimation visible={true} />

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-text mb-2"
            >
              Challenge Complete! 🎉
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text3 mb-8"
            >
              You've conquered this month's Top 50!
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-bg-2/80 backdrop-blur-sm border border-border rounded-2xl p-4">
                <div className="text-3xl font-bold text-purple-400">{score}%</div>
                <div className="text-xs text-text3 mt-1">Score</div>
              </div>
              <div className="bg-bg-2/80 backdrop-blur-sm border border-border rounded-2xl p-4">
                <div className="text-3xl font-bold text-emerald-400">{correctCount}</div>
                <div className="text-xs text-text3 mt-1">Correct</div>
              </div>
              <div className="bg-bg-2/80 backdrop-blur-sm border border-border rounded-2xl p-4">
                <div className="text-3xl font-bold text-amber-400">{streak}🔥</div>
                <div className="text-xs text-text3 mt-1">Streak</div>
              </div>
            </motion.div>

            {/* Accuracy Ring */}
            <AccuracyCounter accuracy={accuracy} visible={true} />

            {/* Rank */}
            <RankReveal rank={rank} visible={true} />

            {/* Finish Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              onClick={onFinish}
              className="mt-8 w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                boxShadow: '0 0 30px rgba(168,85,247,0.4)',
              }}
            >
              Continue Learning
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper function
function calculateRank(accuracy, score) {
  const combined = (accuracy * 0.6 + score * 0.4);
  if (combined >= 90) return '1 - 500';
  if (combined >= 80) return '500 - 1000';
  if (combined >= 70) return '1000 - 3000';
  if (combined >= 60) return '3000 - 6000';
  if (combined >= 50) return '6000 - 10000';
  return '10000+';
}