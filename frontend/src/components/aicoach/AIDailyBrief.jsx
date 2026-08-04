import { motion } from 'framer-motion';
import CoachCard from './CoachCard';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

export default function AIDailyBrief({ brief, name }) {
  if (!brief) return null;
  const { summary, greeting, focusAreas = [], estimatedTime, predictedImprovement, linkedStats = {} } = brief;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
          <span style={{ fontSize: 20 }}>🌅</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>
              {greeting || 'Daily Brief'}, {name || 'aspirant'}
            </h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>Your AI coach's live read of your preparation.</p>
          </div>
          {linkedStats.roadmapCompletion != null && (
            <span style={{ fontSize: typography.small.size, fontWeight: 600, color: colors.accent, padding: '2px 10px', borderRadius: 6, background: colors.accentSoft }}>
              Roadmap {linkedStats.roadmapCompletion}%
            </span>
          )}
        </div>

        <div style={{ padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 10, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`, marginBottom: spacing[3] }}>
          <p style={{ fontSize: typography.body.size, color: colors.text, margin: 0, lineHeight: 1.6 }}>{summary}</p>
        </div>

        {(focusAreas?.length || estimatedTime || predictedImprovement) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] }}>
            {focusAreas?.map((f, i) => (
              <span key={i} style={{ fontSize: typography.caption.size, color: colors.textSoft, padding: '2px 10px', borderRadius: 6, background: colors.surface, border: `1px solid ${colors.border}` }}>
                🎯 {f.topic}{f.accuracy != null ? ` (${f.accuracy}%)` : ''}
              </span>
            ))}
            {estimatedTime && (
              <span style={{ fontSize: typography.caption.size, color: colors.textSoft, padding: '2px 10px', borderRadius: 6, background: colors.surface, border: `1px solid ${colors.border}` }}>
                ⏱ {estimatedTime}
              </span>
            )}
            {predictedImprovement && (
              <span style={{ fontSize: typography.caption.size, color: colors.success, padding: '2px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                📈 {predictedImprovement}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[1] }}>
          {linkedStats.studyHoursToTarget != null && (
            <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>
              🕐 {linkedStats.studyHoursToTarget}h to daily target
            </span>
          )}
          {linkedStats.weeklyHours != null && (
            <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>
              📅 {linkedStats.weeklyHours}h this week
            </span>
          )}
          {linkedStats.predictionAir != null && (
            <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>
              🎯 Predicted AIR #{linkedStats.predictionAir}
            </span>
          )}
        </div>
      </CoachCard>
    </motion.div>
  );
}
