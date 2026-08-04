import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, X, ArrowRight } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { getNextTopicRecommendation, detectWeakTopics } from '../../utils/gateUtils';

// Full-width personalized AI recommendation strip. Dismissible.
// "Because you scored 42% in OS, watch these videos next."
export default function AiRecBanner({ onAction }) {
  const { topics, pyqs, mocks, studyStats, revisionSchedule } = useProgress();
  const subjects = studyStats?.subjects || [];
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem('lh_ai_banner_dismissed') === '1');
    } catch { /* ignore */ }
  }, []);

  const weak = (() => {
    try { return detectWeakTopics(topics, pyqs, mocks, subjects); } catch { return []; }
  })();
  const next = (() => {
    try { return getNextTopicRecommendation(topics, pyqs, subjects, { revisionSchedule, studyStats }); } catch { return null; }
  })();

  if (dismissed || !next) return null;

  // Find the strongest weakness with a real accuracy figure
  const weakSubject = weak.find(w => w.type === 'subject');
  const acc = weakSubject?.accuracy != null ? Math.round(weakSubject.accuracy) : null;
  const weakName = weakSubject?.name;
  const title = weakSubject && acc != null
    ? `You scored ${acc}% in ${weakName}`
    : weakSubject
      ? `${weakName} needs attention`
      : 'Your next best move';

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('lh_ai_banner_dismissed', '1'); } catch { /* ignore */ }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
      style={{
        background: 'linear-gradient(100deg, rgba(139,92,246,0.18), rgba(34,211,238,0.08), rgba(18,24,40,0.6))',
        border: '1px solid rgba(139,92,246,0.25)',
      }}
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#8B5CF6]/20 blur-3xl lh-breathe pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl lh-glass flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#A78BFA]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#A78BFA] flex items-center gap-1.5">
              <Bot className="w-3 h-3" /> AI Mentor
            </div>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">
              {title}, watch these videos next.
            </p>
            <p className="text-[11px] text-text3/70 mt-0.5 truncate">
              Next lesson: <span className="text-[#C4B5FD]">{next.topicName}</span>
              {next.expectedGain ? ` · ${next.expectedGain} estimated` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => onAction?.(next, weakName)}
            className="lh-glass flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Start Playlist
          </button>
          <button onClick={dismiss} aria-label="Dismiss" className="w-8 h-8 rounded-lg flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
