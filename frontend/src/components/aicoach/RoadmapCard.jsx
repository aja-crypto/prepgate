import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CoachCard from './CoachCard';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, divider } = coachTokens;

const SUBJECT_ICONS = {
  'Engineering Mathematics': '📐',
  'Digital Logic': '💻',
  'Computer Organization & Architecture': '🖥️',
  'Programming & DS': '🐍',
  'Algorithms': '⚡',
  'Operating Systems': '⚙️',
  'DBMS': '🗄️',
  'Computer Networks': '🌐',
  'Theory of Computation': '🤖',
  'Compiler Design': '🔧',
  'General Aptitude': '🧮',
};

export default function RoadmapCard({ roadmap = null, profile = null }) {
  const [expanded, setExpanded] = useState(false);

  if (!roadmap || !roadmap.subjects) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <CoachCard>
          <div style={{ padding: `${spacing[6]}px ${spacing[4]}px`, textAlign: 'center' }}>
            <p style={{ fontSize: typography.body.size, color: colors.textSoft }}>Complete your onboarding to generate your AI roadmap.</p>
          </div>
        </CoachCard>
      </motion.div>
    );
  }

  const { narrative, subjects = [], timeline = [], milestones = [], nextMilestone, nextMilestoneReward, probability, onTrack, behindBy, dailyHoursNeeded, daysToExam, currentMonth, currentPhase } = roadmap;
  const hoursPerDay = profile?.dailyStudyHours || 4;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 18 }}>🗺️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>Your GATE Roadmap</h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>Generated from your live progress — {daysToExam} days to GATE {new Date(roadmap.examDate || '2027-02-07').getFullYear()}</p>
          </div>
          <span style={{ fontSize: typography.small.size, fontWeight: 600, color: onTrack ? colors.success : colors.warning, padding: '2px 10px', borderRadius: 6, background: onTrack ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${onTrack ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, whiteSpace: 'nowrap' }}>
            {onTrack ? '✓ On Track' : '⚠ Behind'}
          </span>
        </div>
        <div style={divider} />

        {/* AI narrative */}
        {narrative && (
          <div style={{ padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 10, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`, marginBottom: spacing[3] }}>
            <p style={{ fontSize: typography.body.size, color: colors.text, margin: 0, lineHeight: 1.6 }}>🤖 {narrative}</p>
          </div>
        )}

        {/* On-track stats row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
          {probability != null && (
            <StatChip label="Schedule probability" value={`${probability}%`} />
          )}
          {dailyHoursNeeded != null && (
            <StatChip label="Hours/day to catch up" value={`${dailyHoursNeeded}h`} />
          )}
          {currentPhase && (
            <StatChip label="Current phase" value={currentPhase} />
          )}
          {currentMonth && (
            <StatChip label="Month" value={currentMonth} />
          )}
        </div>

        {/* Timeline strip */}
        {timeline.length > 0 && (
          <div style={{ marginBottom: spacing[4] }}>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6 }}>
              {timeline.map((t, i) => (
                <div key={i} style={{
                  flex: '0 0 auto', minWidth: 58, textAlign: 'center', padding: `${spacing[1]}px ${spacing[2]}px`,
                  borderRadius: 8,
                  background: t.status === 'current' ? colors.accentSoft : t.status === 'completed' ? 'rgba(34,197,94,0.08)' : colors.surface,
                  border: `1px solid ${t.status === 'current' ? colors.borderHover : t.status === 'completed' ? 'rgba(34,197,94,0.2)' : colors.border}`,
                }}>
                  <div style={{ fontSize: typography.cardTitle.size, fontWeight: t.status === 'current' ? 700 : 500, color: t.status === 'completed' ? colors.success : t.status === 'current' ? colors.accent : colors.textSoft }}>
                    {t.isExam ? '🎯' : ''}{t.month}
                  </div>
                  <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 2, whiteSpace: 'nowrap' }}>{t.phase}</div>
                  {t.status === 'current' && <div style={{ fontSize: 9, fontWeight: 700, color: colors.accent, marginTop: 2 }}>● Now</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject-level progression */}
        <div style={{ marginBottom: spacing[3] }}>
          <h3 style={{ fontSize: typography.cardTitle.size, fontWeight: 600, color: colors.text, margin: `0 0 ${spacing[2]}px` }}>
            📚 Subject Progression
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {subjects.slice(0, expanded ? subjects.length : 6).map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: typography.caption.size, color: colors.textSoft }}>
                    {SUBJECT_ICONS[s.name] || '📘'} {s.name}
                    {s.status === 'mastered' && <span style={{ color: colors.success, marginLeft: 6 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: typography.caption.size, fontWeight: 600, color: s.progress >= 80 ? colors.success : s.progress >= 40 ? colors.accent : colors.textMuted }}>
                    {s.progress}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: colors.surface, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 * i }}
                    style={{ height: '100%', borderRadius: 3, background: s.progress >= 80 ? `linear-gradient(90deg, ${colors.success}, #34d399)` : s.progress >= 40 ? `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})` : `linear-gradient(90deg, ${colors.warning}, #fbbf24)` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {subjects.length > 6 && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: colors.accent, fontSize: typography.caption.size, cursor: 'pointer', marginTop: spacing[2] }}>
              {expanded ? 'Show fewer ▲' : `Show all ${subjects.length} subjects ▼`}
            </button>
          )}
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ marginBottom: spacing[3] }}>
            <h3 style={{ fontSize: typography.cardTitle.size, fontWeight: 600, color: colors.text, margin: `0 0 ${spacing[2]}px` }}>🎖 Milestones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {milestones.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: spacing[2], padding: `${spacing[2]}px ${spacing[3]}px`, borderRadius: 8,
                  background: m.unlocked ? 'rgba(34,197,94,0.08)' : colors.surface,
                  border: `1px solid ${m.unlocked ? 'rgba(34,197,94,0.2)' : colors.border}`,
                  opacity: m.unlocked ? 1 : 0.6,
                }}>
                  <span style={{ fontSize: 16 }}>{m.unlocked ? '🏅' : '🔒'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: typography.caption.size, fontWeight: 600, color: m.unlocked ? colors.success : colors.textSoft }}>{m.title}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{m.reward || `+${m.xp || 0} XP`}</div>
                  </div>
                  {m.unlocked && <span style={{ fontSize: 10, color: colors.success, fontWeight: 700 }}>DONE</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next milestone banner */}
        {nextMilestone && (
          <div style={{ padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 10, background: colors.surface, border: `1px dashed ${colors.borderHover}` }}>
            <div style={{ fontSize: typography.caption.size, color: colors.textMuted, marginBottom: 2 }}>🎯 Next milestone</div>
            <div style={{ fontSize: typography.cardTitle.size, fontWeight: 600, color: colors.text }}>{nextMilestone}</div>
            {nextMilestoneReward && <div style={{ fontSize: typography.caption.size, color: colors.accent, marginTop: 2 }}>Reward: {nextMilestoneReward}</div>}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden', marginTop: spacing[3] }}>
              <div style={{ padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 10, background: colors.accentSoft, border: `1px solid ${colors.borderHover}` }}>
                <p style={{ fontSize: typography.caption.size, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: colors.accent }}>Pacing:</span> You're {behindBy > 0 ? `${behindBy}% behind expected` : 'on/above expected'} pace. At {hoursPerDay}h/day, {dailyHoursNeeded}h/day is needed to finish on time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CoachCard>
    </motion.div>
  );
}

function StatChip({ label, value }) {
  const { colors, spacing, typography } = coachTokens;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], padding: `${spacing[1]}px ${spacing[3]}px`, borderRadius: 8, background: colors.surface, border: `1px solid ${colors.border}` }}>
      <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>{label}</span>
      <span style={{ fontSize: typography.caption.size, fontWeight: 700, color: colors.accent }}>{value}</span>
    </div>
  );
}
