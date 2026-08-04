import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

const MOTIVATION = [
  'Great start! Keep the momentum going.',
  "You're making solid progress today.",
  'Halfway there! Stay focused.',
  'Almost done — finish strong!',
];

export default function JourneyFooter({ completed, total, streak = 12, totalMinutes = 0 }) {
  const allDone = completed >= total;
  const msg = MOTIVATION[Math.min(completed, MOTIVATION.length - 1)];
  const timeStr = totalMinutes > 0
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : null;

  if (allDone) {
    return (
      <div style={{
        marginTop: spacing[5], padding: `${spacing[4]}px ${spacing[5]}px`,
        borderRadius: 12, textAlign: 'center',
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
      }}>
        <div style={{ fontSize: 32, marginBottom: spacing[2] }}>🎉</div>
        <h3 style={{ fontSize: typography.cardTitle.size, fontWeight: 700, color: colors.success, margin: `0 0 ${spacing[1]}px` }}>
          Excellent work!
        </h3>
        <p style={{ fontSize: typography.body.size, color: colors.textSoft, margin: `0 0 ${spacing[1]}px`, lineHeight: typography.body.lh }}>
          You completed today's journey. {streak > 0 && `Keep your ${streak}-day streak alive! 🔥`}
        </p>
        {timeStr && (
          <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: `0 0 ${spacing[4]}px`, fontStyle: 'italic' }}>
            Estimated study time: {timeStr}
          </p>
        )}
        <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            tabIndex={0}
            aria-label="Review what you learned today"
            style={{
              padding: `${spacing[2]}px ${spacing[5]}px`, borderRadius: 12,
              fontSize: typography.caption.size, fontWeight: 600,
              background: `linear-gradient(135deg, ${colors.accent}, #7C3AED)`,
              color: '#fff', border: 'none', cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          >
            📖 Review Today's Learning
          </button>
          <button
            tabIndex={0}
            aria-label="Ask your AI coach a question"
            style={{
              padding: `${spacing[2]}px ${spacing[5]}px`, borderRadius: 12,
              fontSize: typography.caption.size, fontWeight: 600,
              background: 'transparent', color: colors.text,
              border: `1px solid ${colors.border}`, cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.borderHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; }}
            onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          >
            💬 Ask My Coach
          </button>
        </div>
      </div>
    );
  }

  if (completed === 0) {
    return (
      <div style={{
        marginTop: spacing[4], padding: `${spacing[3]}px ${spacing[4]}px`,
        borderRadius: 10, background: colors.surface, border: `1px dashed ${colors.border}`,
      }}>
        <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
          💡 Complete each step to make progress toward today's goal.{timeStr ? ` About ${timeStr} total.` : ''}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: spacing[4], padding: `${spacing[3]}px ${spacing[4]}px`,
      borderRadius: 10, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`,
    }}>
      <p style={{ fontSize: typography.body.size, color: colors.text, margin: 0, fontWeight: 500 }}>
        {msg}
      </p>
    </div>
  );
}
