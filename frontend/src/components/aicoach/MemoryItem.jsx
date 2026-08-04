import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

export default function MemoryItem({ icon, label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: spacing[3],
      padding: `${spacing[2]}px ${spacing[3]}px`,
      borderRadius: 10,
      background: highlight ? colors.accentSoft : colors.surface,
      border: `1px solid ${highlight ? colors.borderHover : colors.border}`,
      transition: 'border-color 0.2s, background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.borderHover; e.currentTarget.style.background = colors.surfaceHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = highlight ? colors.borderHover : colors.border; e.currentTarget.style.background = highlight ? colors.accentSoft : colors.surface; }}
      tabIndex={0}
      role="listitem"
      aria-label={`${label}: ${value}`}
      onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 1; }}
      onBlur={e => { e.currentTarget.style.outline = 'none'; }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: typography.small.size, fontWeight: typography.small.weight,
          color: colors.textMuted, textTransform: 'uppercase', letterSpacing: typography.small.ls,
          marginBottom: 1,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: typography.cardTitle.size, fontWeight: typography.cardTitle.weight,
          color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}
