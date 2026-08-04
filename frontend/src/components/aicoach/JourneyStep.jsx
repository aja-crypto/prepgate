import { motion } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

export default function JourneyStep({
  icon,
  title,
  duration,
  isCompleted,
  isActive,
  isNext,
  index,
  onToggle,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.08 * index }}
      style={{ position: 'relative' }}
    >
      {/* Step dot */}
      <div style={{
        position: 'absolute', left: -16, top: 4, width: 20, height: 20, borderRadius: '50%',
        background: isCompleted ? colors.success : isActive ? colors.accent : colors.surface,
        border: `2px solid ${isCompleted ? colors.success : isActive ? colors.accent : colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        transition: 'all 0.3s',
        boxShadow: isActive ? `0 0 12px ${colors.accentGlow}` : 'none',
      }}>
        {isCompleted && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            viewBox="0 0 12 12" fill="none" width="10" height="10"
          >
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </div>

      {/* Step content */}
      <div
        onClick={() => onToggle?.(index)}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onToggle) { e.preventDefault(); onToggle(index); } }}
        tabIndex={0}
        role="button"
        aria-label={`${title} (${duration})${isCompleted ? ' — completed' : isActive ? ' — in progress' : ''}`}
        style={{
          marginLeft: 20, padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 12,
          background: isActive ? colors.accentSoft : isCompleted ? colors.surface : colors.surface,
          border: `1px solid ${isActive ? colors.borderHover : isCompleted ? 'rgba(34,197,94,0.1)' : colors.border}`,
          cursor: onToggle ? 'pointer' : 'default',
          opacity: isCompleted ? 0.65 : 1,
          transition: 'all 0.25s',
          outline: 'none',
        }}
        onMouseEnter={e => {
          if (onToggle) {
            e.currentTarget.style.borderColor = colors.borderHover;
            e.currentTarget.style.background = isActive ? colors.accentSoft : colors.surfaceHover;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isActive ? colors.borderHover : isCompleted ? 'rgba(34,197,94,0.1)' : colors.border;
          e.currentTarget.style.background = isActive ? colors.accentSoft : colors.surface;
        }}
        onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 1; }}
        onBlur={e => { e.currentTarget.style.outline = 'none'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <motion.span
              animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
              style={{ fontSize: 18 }}
            >
              {icon}
            </motion.span>
            <div>
              <div style={{
                fontSize: typography.cardTitle.size, fontWeight: isActive ? 600 : 500,
                color: isCompleted ? colors.textSoft : colors.text,
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}>
                {title}
              </div>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: typography.small.size, color: colors.accent, fontWeight: 500, marginTop: 2 }}
                >
                  In progress
                </motion.div>
              )}
            </div>
          </div>
          <span style={{ fontSize: typography.caption.size, color: colors.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{duration}</span>
        </div>
      </div>
    </motion.div>
  );
}
