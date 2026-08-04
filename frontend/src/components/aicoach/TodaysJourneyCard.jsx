import { useState } from 'react';
import { motion } from 'framer-motion';
import CoachCard from './CoachCard';
import JourneyProgress from './JourneyProgress';
import JourneyStep from './JourneyStep';
import JourneyConnector from './JourneyConnector';
import JourneyFooter from './JourneyFooter';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, divider } = coachTokens;

const DEFAULT_STEPS = [
  { icon: '📺', title: 'Watch TOC Lecture', duration: '45 min' },
  { icon: '✍️', title: 'Solve 15 PYQs', duration: '1h' },
  { icon: '📖', title: 'Revise Notes', duration: '30 min' },
];

const ICON_BY_TYPE = { learn: '📺', pyq: '✍️', revise: '📖', mock: '📝', default: '🎯' };

export default function TodaysJourneyCard({ journey }) {
  const [completed, setCompleted] = useState(0);
  const steps = (journey?.steps?.length ? journey.steps : DEFAULT_STEPS).map((s, i) => ({
    icon: s.icon || ICON_BY_TYPE[s.type] || ICON_BY_TYPE.default,
    title: s.title || s.name || DEFAULT_STEPS[i]?.title || `Step ${i + 1}`,
    duration: s.duration ? `${s.duration} min` : DEFAULT_STEPS[i]?.duration || '',
  }));
  const total = steps.length;
  const goal = journey?.goal;
  const expectedImprovement = journey?.expectedImprovement;
  const totalMinutes = journey?.totalMinutes || steps.reduce((s, x) => s + (parseInt(x.duration) || 0), 0);

  const handleToggle = (idx) => {
    if (idx === completed) setCompleted(prev => Math.min(prev + 1, total));
    else if (idx === completed - 1) setCompleted(prev => Math.max(prev - 1, 0));
  };

  const allDone = completed >= total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>
              {goal ? 'Today\'s Mission' : 'Today\'s Journey'}
            </h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>{goal || 'Here\'s your plan for today.'}</p>
          </div>
          {allDone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ fontSize: 20 }}
            >
              🎉
            </motion.span>
          )}
        </div>
        <div style={divider} />

        <JourneyProgress current={completed} total={total} />

        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {steps.map((step, i) => (
            <div key={i}>
              <JourneyStep
                icon={step.icon}
                title={step.title}
                duration={step.duration}
                isCompleted={i < completed}
                isActive={i === completed}
                index={i}
                onToggle={handleToggle}
              />
              {i < total - 1 && (
                <JourneyConnector isCompleted={i < completed} />
              )}
            </div>
          ))}
        </div>

        <JourneyFooter completed={completed} total={total} totalMinutes={totalMinutes} />

        {expectedImprovement && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3], paddingTop: spacing[3], borderTop: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: typography.caption.size, color: colors.success, padding: '2px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              📈 {expectedImprovement}
            </span>
          </div>
        )}
      </CoachCard>
    </motion.div>
  );
}
