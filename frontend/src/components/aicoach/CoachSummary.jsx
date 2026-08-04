import { motion } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, spacing } = coachTokens;

export default function CoachSummary({ streak = 12 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        marginTop: spacing[5], padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 12,
        background: colors.accentSoft, border: `1px solid ${colors.borderHover}`,
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{
        fontSize: 13, color: colors.text, margin: 0, lineHeight: 1.5,
      }}>
        <span style={{ fontWeight: 600, color: colors.accent }}>Today's plan:</span>{' '}
        Strengthen TOC fundamentals, complete 15 PYQs, and keep your {streak}-day streak alive.{' '}
        <span style={{ color: colors.textMuted }}>Estimated: 2h 30m</span>
      </p>
    </motion.div>
  );
}
