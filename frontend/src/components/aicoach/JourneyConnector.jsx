import { motion } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, spacing } = coachTokens;

export default function JourneyConnector({ isCompleted }) {
  return (
    <div style={{
      position: 'relative',
      height: 32,
      marginLeft: 8,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: isCompleted
          ? colors.accent
          : `linear-gradient(to bottom, ${colors.accent}, ${colors.border})`,
        borderRadius: 1,
        transition: 'background 0.5s',
      }} />

      {/* Arrow indicator */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          marginLeft: 10, display: 'flex', alignItems: 'center', gap: spacing[1],
        }}
      >
        <span style={{ fontSize: 10, color: isCompleted ? colors.textMuted : colors.textMuted }}>↓</span>
        <span style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {isCompleted ? 'Done' : 'Next'}
        </span>
      </motion.div>
    </div>
  );
}
