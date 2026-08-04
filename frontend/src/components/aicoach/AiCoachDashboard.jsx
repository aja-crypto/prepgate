import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useCoachState from './useCoachState';
import AiCoachHeader from './AiCoachHeader';
import AIDailyBrief from './AIDailyBrief';
import CoachChat from './CoachChat';
import TodaysJourneyCard from './TodaysJourneyCard';
import ProgressCard from './ProgressCard';
import RoadmapCard from './RoadmapCard';
import RecommendationsCard from './RecommendationsCard';
import LiveTimer from './LiveTimer';
import CoachErrorBoundary from './CoachErrorBoundary';
import { coachTokens } from './coachTokens';
import OnboardingPanel from '../ai/OnboardingPanel';
import { useAiMentor } from '../../context/AiMentorContext';

const { spacing } = coachTokens;

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const S = ({ h = spacing[6] }) => <div style={{ height: h }} />;

function Section({ children, delay = 0 }) {
  return (
    <motion.div variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}

export default function AiCoachDashboard() {
  const coach = useCoachState();
  const { profile, updateProfile, completeOnboarding } = useAiMentor();
  const [showOnboarding, setShowOnboarding] = useState(!profile?.onboardingCompleted);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (showOnboarding) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ maxWidth: 640, margin: '0 auto', padding: '24px 24px 48px', minHeight: '100vh', position: 'relative' }}>
        <OnboardingPanel colors={{
          text: '#E2E8F0', text3: '#94A3B8', text4: '#64748B',
          border: 'rgba(255,255,255,0.08)',
          accent: '#A78BFA', accentHover: '#C4B5FD',
        }} onComplete={(answers) => {
          updateProfile({ ...answers, onboardingCompleted: true });
          completeOnboarding();
          setShowOnboarding(false);
          setOnboardingComplete(true);
        }} fullWidth />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.03), transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 48px', minHeight: '100vh', position: 'relative', zIndex: 1 }} className="coach-container">
        {/* Greeting — minimal, 2 lines */}
        <Section delay={0}><CoachErrorBoundary name="Header"><AiCoachHeader name={coach.profile.name} streak={coach.streak} /></CoachErrorBoundary></Section>
        <S h={20} />

        {/* 1. AI Daily Brief — the live AI coach narrative */}
        <Section delay={0.05}><CoachErrorBoundary name="DailyBrief"><AIDailyBrief brief={coach.dailyBrief} name={coach.profile.name} /></CoachErrorBoundary></Section>
        <S h={20} />

        {/* 2. Today's Mission / Journey */}
        <Section delay={0.1}><CoachErrorBoundary name="Journey"><TodaysJourneyCard journey={coach.journey} streak={coach.streak} /></CoachErrorBoundary></Section>
        <S h={20} />

        {/* Conversation — primary interface */}
        <Section delay={0.08}><CoachErrorBoundary name="Chat"><CoachChat coachState={coach} onboardingComplete={onboardingComplete} /></CoachErrorBoundary></Section>
        <S h={24} />

        {/* Below the fold: supporting context */}
        <Section delay={0.2}><CoachErrorBoundary name="Session"><LiveTimer weakTopic={coach.raw?.weakTopics?.[0]} weakSubject={coach.analytics?.weakestSubject?.name} /></CoachErrorBoundary></Section>
        <S />
        <Section delay={0.25}><CoachErrorBoundary name="Roadmap"><RoadmapCard roadmap={coach.roadmap} profile={coach.profile} /></CoachErrorBoundary></Section>
        <S />
        <Section delay={0.3}><CoachErrorBoundary name="Progress"><ProgressCard studyStats={coach.raw.studyStats} pyqs={coach.raw.pyqs} mocks={coach.raw.mocks} gateFeatures={coach.raw.gateFeatures} /></CoachErrorBoundary></Section>
        <S />
        <Section delay={0.35}><CoachErrorBoundary name="Recommendations"><RecommendationsCard recommendations={coach.recommendations} /></CoachErrorBoundary></Section>
      </div>

      <style>{`
        .coach-container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; position: relative; }
        @media (max-width: 768px) { .coach-container { padding: 20px 16px 40px !important; } }
        @media (max-width: 480px) { .coach-container { padding: 16px 12px 32px !important; } }
        .coach-memory-grid { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 640px) { .coach-memory-grid { grid-template-columns: 1fr; } }
        @media (min-width: 1024px) {
          .coach-container::before { content: ''; position: absolute; left: -24px; top: 40px; bottom: 40px; width: 1px; background: linear-gradient(to bottom, rgba(139,92,246,0.12), rgba(139,92,246,0.04), transparent); pointer-events: none; }
        }
      `}</style>
    </motion.div>
  );
}
