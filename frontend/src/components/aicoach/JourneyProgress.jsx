import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

const MESSAGES = [
  "Let's begin today's journey.",
  'Great progress! Only two tasks left.',
  "You're almost there! One more to go.",
  'All done — excellent focus today!',
];

export default function JourneyProgress({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div style={{ marginBottom: spacing[5] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing[2] }}>
        <div>
          <div style={{ fontSize: typography.label.size, fontWeight: typography.label.weight, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: typography.label.ls, marginBottom: 2 }}>
            Progress
          </div>
          <div style={{ fontSize: typography.body.size, color: colors.textSoft, lineHeight: 1.3 }}>
            {MESSAGES[Math.min(current, MESSAGES.length - 1)]}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: typography.stat.size, fontWeight: typography.stat.weight, color: colors.accent, letterSpacing: typography.stat.ls }}>
            {Math.round(pct)}%
          </div>
          <div style={{ fontSize: typography.small.size, color: colors.textMuted }}>
            {current} / {total} done
          </div>
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: colors.surface, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${colors.accent}, #A78BFA)`,
          width: `${pct}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}
