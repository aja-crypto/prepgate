import { motion, AnimatePresence } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, spacing } = coachTokens;

const STATES = {
  ready: { label: 'AI Ready', dotColor: colors.success, breathe: false },
  preparing: { label: 'Preparing Today\'s Plan...', dotColor: colors.accent, breathe: true, icon: '🧠' },
  personalizing: { label: 'Personalizing Recommendations...', dotColor: colors.info, breathe: true, icon: '✨' },
  reviewing: { label: 'Reviewing Your Progress...', dotColor: colors.info, breathe: true, icon: '📚' },
  offline: { label: 'Offline — Using Cached Data', dotColor: colors.textMuted, breathe: false, icon: '🌐' },
};

export default function AiStatusIndicator({ state = 'ready' }) {
  const s = STATES[state] || STATES.ready;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: spacing[1] + 2,
      padding: '6px 14px', borderRadius: 20,
      background: colors.accentSoft, border: `1px solid ${colors.borderHover}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
            background: s.dotColor,
            boxShadow: s.breathe ? `0 0 8px ${s.dotColor}` : 'none',
          }}
        />
      </AnimatePresence>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSoft, letterSpacing: '0.02em' }}>
        {s.icon ? `${s.icon} ` : ''}{s.label}
      </span>
    </div>
  );
}
