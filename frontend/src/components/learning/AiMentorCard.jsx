import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { getNextTopicRecommendation, detectWeakTopics, getSubjectPriorities } from '../../utils/gateUtils';

// Personalized AI Mentor card: tells the user what they mastered, what's next,
// and the estimated GATE marks gain — driven by real progress, no hardcoded copy.
export default function AiMentorCard({ onAction }) {
  const { topics, pyqs, mocks, studyStats, revisionSchedule } = useProgress();
  const subjects = studyStats?.subjects || [];

  const mentor = useMemo(() => {
    const next = getNextTopicRecommendation(topics, pyqs, subjects, { revisionSchedule, studyStats });
    const weak = detectWeakTopics(topics, pyqs, mocks, subjects);
    const priorities = getSubjectPriorities(subjects, topics, pyqs || []);

    // "You mastered X" — the strongest completed subject/topic
    let mastered = null;
    const doneTopics = (topics || []).filter((t) => t.done);
    if (doneTopics.length) {
      mastered = doneTopics[0].name;
    } else if (subjects.length) {
      const best = subjects.reduce((a, b) => ((b.progress || 0) > (a.progress || 0) ? b : a), subjects[0]);
      if ((best.progress || 0) >= 60) mastered = best.name;
    }

    const weakest = weak[0];
    return {
      next,
      mastered,
      weakest,
      topPriority: priorities[0],
      readyForRevision: (topics || []).length > 0 && !(topics || []).some((t) => !t.done),
    };
  }, [topics, pyqs, mocks, subjects, revisionSchedule, studyStats]);

  const { next } = mentor;
  if (!next) return null;

  const subjectTag = next.subject || mentor.weakest?.name || mentor.topPriority?.subject;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(34,211,238,0.05), rgba(18,24,40,0.6))',
        border: '1px solid rgba(139,92,246,0.2)',
      }}
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#8B5CF6]/18 blur-3xl lh-breathe pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#22D3EE]/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl lh-glass flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-[#A78BFA]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">AI Mentor</span>
            <span className="text-[10px] text-text3/60">Personalized for you</span>
          </div>

          {mentor.mastered ? (
            <p className="text-sm text-text2">
              You mastered <span className="font-bold text-white">{mentor.mastered}</span>.
              Next lesson: <span className="font-bold text-[#C4B5FD]">{next.topicName}</span>
            </p>
          ) : (
            <p className="text-sm text-text2">
              {mentor.weakest && mentor.weakest.type === 'subject' ? (
                <>Your weakest area is <span className="font-bold text-white">{mentor.weakest.name}</span>. Start with <span className="font-bold text-[#C4B5FD]">{next.topicName}</span></>
              ) : (
                <>Start your journey with <span className="font-bold text-[#C4B5FD]">{next.topicName}</span></>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-text2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-400">{next.expectedGain || '+3 marks'}</span>
              <span className="text-text3/60">estimated gain</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">{next.confidence || 85}%</span>
              <span className="text-text3/60">confidence</span>
            </span>
            {subjectTag && <span className="lh-chip"><span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" /> {subjectTag}</span>}
          </div>

          {next.reason && (
            <p className="text-[11px] text-text3/60 mt-2 leading-relaxed">{next.reason}</p>
          )}
        </div>

        <button
          onClick={() => onAction?.(next, subjectTag)}
          className="lh-glass shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all self-start sm:self-center"
        >
          Start Learning <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.section>
  );
}
