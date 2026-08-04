import { motion } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

const ICONS = { foundation: '🌱', mathematics: '📐', core: '📚', revision: '🔄', mocks: '📊', sprint: '🏁' };

export default function RoadmapStage({ stage, isCurrent, isCompleted, isLocked, progress, daysLeft, advice, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.08 * index }}
      style={{ position: 'relative', opacity: isLocked && !isCurrent ? 0.4 : 1 }}
    >
      {/* Stage dot */}
      <motion.div
        animate={isCurrent ? { scale: [1, 1.15, 1], boxShadow: [`0 0 0px ${colors.accentGlow}`, `0 0 16px ${colors.accentGlow}`, `0 0 0px ${colors.accentGlow}`] } : {}}
        transition={isCurrent ? { duration: 2.5, repeat: Infinity } : {}}
        style={{
          position: 'absolute', left: -16, top: 4, width: 20, height: 20, borderRadius: '50%',
          background: isCompleted ? colors.success : isCurrent ? colors.accent : colors.surface,
          border: `2px solid ${isCompleted ? colors.success : isCurrent ? colors.accent : colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        }}
      >
        {isCompleted && (
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        animate={isCurrent ? { borderColor: [colors.borderHover, 'rgba(139,92,246,0.35)', colors.borderHover] } : {}}
        transition={isCurrent ? { duration: 2.5, repeat: Infinity } : {}}
        style={{
          marginLeft: 20, padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 12,
          background: isCurrent ? colors.accentSoft : colors.surface,
          border: `1px solid ${isCurrent ? colors.borderHover : colors.border}`,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[2] }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>{ICONS[stage.id] || '📍'}</span>
              <h3 style={{ fontSize: typography.cardTitle.size, fontWeight: isCurrent ? 700 : 500, color: isCompleted ? colors.textSoft : colors.text, margin: 0 }}>
                {stage.label}
              </h3>
              {isCurrent && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: colors.accentSoft, color: colors.accent, border: `1px solid ${colors.borderHover}`, whiteSpace: 'nowrap' }}>
                  You are here
                </span>
              )}
              {isLocked && !isCurrent && <span style={{ fontSize: 10, color: colors.textMuted }}>🔒</span>}
              {isCompleted && <span style={{ fontSize: 9, color: colors.success, fontWeight: 600 }}>Completed</span>}
            </div>
            {advice && (
              <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: `${spacing[1]}px 0 0`, fontStyle: 'italic', lineHeight: 1.4 }}>
                {advice}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {daysLeft > 0 && <div style={{ fontSize: typography.caption.size, color: colors.textSoft, fontWeight: 500 }}>{daysLeft}d left</div>}
            <div style={{ fontSize: typography.small.size, color: colors.textMuted, marginTop: 2 }}>{progress}%</div>
          </div>
        </div>

        {isCurrent && (
          <div style={{ marginTop: spacing[2], height: 3, borderRadius: 2, background: colors.surface, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})` }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
