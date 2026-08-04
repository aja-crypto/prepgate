import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiMentor } from '../../context/AiMentorContext';
import { useProgress } from '../../context/ProgressContext';

const QUESTIONS = [
  {
    id: 'gateExamYear',
    title: 'Which GATE exam are you preparing for?',
    type: 'select',
    options: [2025, 2026, 2027, 2028],
    icon: '🎯',
  },
  {
    id: 'firstAttempt',
    title: 'Is this your first GATE attempt?',
    type: 'boolean',
    icon: '🆕',
  },
  {
    id: 'previousGateScore',
    title: 'What was your previous GATE score?',
    type: 'number',
    placeholder: 'Enter score (or skip)',
    min: 0,
    max: 100,
    dependsOn: (answers) => answers.firstAttempt === false,
    icon: '📊',
  },
  {
    id: 'dailyStudyHours',
    title: 'How many hours can you study daily?',
    type: 'select',
    options: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12],
    icon: '⏰',
  },
  {
    id: 'completedSubjects',
    title: 'Which subjects have you completed?',
    type: 'multi-select',
    options: [
      'Engineering Mathematics',
      'Programming & Data Structures',
      'Algorithms',
      'DBMS',
      'Operating Systems',
      'Computer Networks',
      'Theory of Computation',
      'Compiler Design',
      'Computer Organization',
      'Digital Logic',
      'General Aptitude',
    ],
    icon: '📚',
  },
  {
    id: 'weakestSubject',
    title: 'Which is your weakest subject?',
    type: 'select',
    options: [
      'Engineering Mathematics',
      'Programming & Data Structures',
      'Algorithms',
      'DBMS',
      'Operating Systems',
      'Computer Networks',
      'Theory of Computation',
      'Compiler Design',
      'Computer Organization',
      'Digital Logic',
      'General Aptitude',
    ],
    icon: '💪',
  },
  {
    id: 'strongestSubject',
    title: 'Which is your strongest subject?',
    type: 'select',
    options: [
      'Engineering Mathematics',
      'Programming & Data Structures',
      'Algorithms',
      'DBMS',
      'Operating Systems',
      'Computer Networks',
      'Theory of Computation',
      'Compiler Design',
      'Computer Organization',
      'Digital Logic',
      'General Aptitude',
    ],
    icon: '🏆',
  },
  {
    id: 'targetAIR',
    title: 'What is your target AIR (All India Rank)?',
    type: 'select',
    options: [
      { label: 'AIR 1-10', value: 10 },
      { label: 'AIR 10-50', value: 50 },
      { label: 'AIR 50-100', value: 100 },
      { label: 'AIR 100-500', value: 500 },
      { label: 'AIR 500-2000', value: 2000 },
      { label: 'AIR 2000-5000', value: 5000 },
      { label: 'Just qualify', value: 999999 },
    ],
    icon: '🏅',
  },
  {
    id: 'dreamCollege',
    title: 'Which is your dream college/IIT?',
    type: 'select',
    options: [
      'IIT Bombay',
      'IIT Delhi',
      'IIT Madras',
      'IIT Kanpur',
      'IIT Kharagpur',
      'IIT Roorkee',
      'IIT Hyderabad',
      'IIT Guwahati',
      'IIT (BHU) Varanasi',
      'IIT Dhanbad',
      'NIT Trichy',
      'NIT Surathkal',
      'NIT Warangal',
      'IIIT Hyderabad',
      'Other',
    ],
    icon: '🎓',
  },
  {
    id: 'confidenceLevel',
    title: 'How confident are you about cracking GATE?',
    type: 'scale',
    min: 1,
    max: 10,
    labels: ['Not confident', 'Very confident'],
    icon: '⚡',
  },
];

function OnboardingQuestion({ question, value, onChange, onNext, isLast, currentIndex, total }) {
  const renderInput = () => {
    switch (question.type) {
      case 'select':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(question.options || []).map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return (
                <button
                  key={val}
                  onClick={() => onChange(val)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    value === val
                      ? 'bg-primary/20 border border-primary/40 text-primary shadow-lg shadow-primary/10'
                      : 'bg-white/[0.04] border border-white/[0.08] text-text2 hover:bg-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex gap-3 justify-center">
            {[
              { label: 'Yes, first attempt', value: true, emoji: '🚀' },
              { label: 'No, attempted before', value: false, emoji: '🔄' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => onChange(opt.value)}
                className={`flex flex-col items-center gap-2 px-8 py-6 rounded-2xl text-sm font-medium transition-all ${
                  value === opt.value
                    ? 'bg-primary/20 border-2 border-primary/40 text-primary shadow-lg shadow-primary/10'
                    : 'bg-white/[0.04] border-2 border-white/[0.08] text-text2 hover:bg-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        );

      case 'multi-select':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {(question.options || []).map((opt) => {
              const selected = (value || []).includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const next = selected
                      ? (value || []).filter((v) => v !== opt)
                      : [...(value || []), opt];
                    onChange(next);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    selected
                      ? 'bg-primary/20 border border-primary/40 text-primary'
                      : 'bg-white/[0.04] border border-white/[0.08] text-text2 hover:bg-white/[0.08]'
                  }`}
                >
                  {selected && '✓ '}{opt}
                </button>
              );
            })}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            min={question.min}
            max={question.max}
            placeholder={question.placeholder}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-xs bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3 text-center text-lg text-text font-mono focus:outline-none focus:border-primary/40"
          />
        );

      case 'scale':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
                const val = question.min + i;
                return (
                  <button
                    key={val}
                    onClick={() => onChange(val)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      value === val
                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                        : 'bg-white/[0.06] text-text3 hover:bg-white/[0.1]'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between w-full max-w-xs text-[10px] text-text3">
              <span>{question.labels?.[0]}</span>
              <span>{question.labels?.[1]}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex flex-col items-center text-center px-4"
    >
      <div className="text-5xl mb-5">{question.icon}</div>
      <h2 className="text-xl font-bold text-text mb-2 leading-snug max-w-md">
        {question.title}
      </h2>
      <div className="mt-6 w-full max-w-md">{renderInput()}</div>
      <div className="mt-8 flex items-center gap-3">
        {currentIndex > 0 && (
          <button
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-text3 hover:text-text2 transition-all border border-white/[0.08]"
          >
            Skip
          </button>
        )}
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
        >
          {isLast ? 'Complete ✨' : 'Continue →'}
        </button>
      </div>
      <div className="mt-6 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentIndex ? 'w-6 bg-primary' : i < currentIndex ? 'w-2 bg-primary/40' : 'w-2 bg-white/[0.1]'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function AiMentorOnboarding({ onComplete }) {
  const { updateProfile, completeOnboarding } = useAiMentor();
  const { updateGateFeatures } = useProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.dependsOn || q.dependsOn(answers)),
    [answers]
  );

  const currentQuestion = visibleQuestions[step];
  const currentValue = answers[currentQuestion?.id];

  const handleChange = useCallback((val) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  }, [currentQuestion?.id]);

  const handleNext = useCallback(() => {
    if (step < visibleQuestions.length - 1) {
      setStep((s) => s + 1);
    } else {
      const profileData = {
        gateExamYear: answers.gateExamYear || 2027,
        firstAttempt: answers.firstAttempt ?? true,
        previousGateScore: answers.previousGateScore || null,
        dailyStudyHours: answers.dailyStudyHours || 4,
        completedSubjects: answers.completedSubjects || [],
        weakestSubject: answers.weakestSubject || '',
        strongestSubject: answers.strongestSubject || '',
        targetAIR: answers.targetAIR || null,
        dreamCollege: answers.dreamCollege || '',
        confidenceLevel: answers.confidenceLevel || 5,
        preparationStage:
          (answers.completedSubjects?.length || 0) >= 8
            ? 'advanced'
            : (answers.completedSubjects?.length || 0) >= 4
              ? 'intermediate'
              : 'beginner',
      };
      updateProfile(profileData);
      completeOnboarding();
      if (typeof onComplete === 'function') onComplete();
    }
  }, [step, visibleQuestions.length, answers, updateProfile, completeOnboarding, onComplete]);

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🧠</div>
          <h1 className="text-2xl font-bold text-text">Let's Get to Know You</h1>
          <p className="text-sm text-text3 mt-1">
            Help your AI Mentor understand your GATE preparation
          </p>
        </div>
        <div className="bg-surface/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <OnboardingQuestion
              key={currentQuestion.id}
              question={currentQuestion}
              value={currentValue}
              onChange={handleChange}
              onNext={handleNext}
              isLast={step === visibleQuestions.length - 1}
              currentIndex={step}
              total={visibleQuestions.length}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
