import { useMemo } from 'react';
import { motion } from 'framer-motion';
import CoachCard from './CoachCard';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, divider } = coachTokens;

const DIFFICULTY = {
  easy: { label: 'Easy', color: colors.success, bg: 'rgba(34,197,94,0.08)' },
  medium: { label: 'Medium', color: colors.warning, bg: 'rgba(245,158,11,0.08)' },
  hard: { label: 'Hard', color: colors.danger, bg: 'rgba(239,68,68,0.08)' },
};

const FALLBACK_RECS = [
  {
    icon: '📖', title: 'Review TOC — Pumping Lemma', priority: 'high',
    evidence: [{ label: 'Status', value: 'Accuracy needs improvement' }],
    expectedGain: '+5 to +8 Marks', time: '35 min', difficulty: 'medium', confidence: 94, color: colors.danger,
  },
  {
    icon: '⚡', title: 'Complete DBMS Normalization', priority: 'medium',
    evidence: [{ label: 'GATE weightage', value: 'High (8-10 marks)' }],
    expectedGain: '+3 to +5 Marks', time: '25 min', difficulty: 'easy', confidence: 96, color: colors.warning,
  },
  {
    icon: '📊', title: 'Take a Mock Test', priority: 'medium',
    evidence: [{ label: 'Days since last mock', value: '7 days' }],
    expectedGain: '+4 to +6 Marks', time: '45 min', difficulty: 'medium', confidence: 88, color: colors.info,
  },
  {
    icon: '🔄', title: 'Revise PYQ Mistake Patterns', priority: 'low',
    evidence: [{ label: 'Similar mistakes', value: 'Review past errors' }],
    expectedGain: '+2 to +4 Marks', time: '30 min', difficulty: 'easy', confidence: 91, color: colors.success,
  },
];

function buildRecs(apiRecs) {
  if (!apiRecs || !apiRecs.length) return FALLBACK_RECS;
  return apiRecs.map(r => ({
    icon: r.icon || '📌',
    title: r.title || r.name || 'Recommendation',
    priority: r.priority || 'medium',
    evidence: r.evidence
      || (r.why?.map(re => ({ label: '•', value: typeof re === 'string' ? re : re.value })))
      || r.reasons?.map(re => ({ label: re, value: '' }))
      || (r.content ? [{ label: 'Why', value: r.content }] : [{ label: 'Reason', value: 'Personalized for you' }]),
    expectedGain: r.expectedImpact || r.expectedGain || r.gain || r.impact || '+2 to +4 Marks',
    time: r.time || r.estimatedTime || r.duration || '30 min',
    difficulty: r.difficulty || 'medium',
    confidence: r.confidence ?? r.score ?? null,
    color: r.color || colors.accent,
  }));
}

export default function RecommendationsCard({ recommendations = null }) {
  const recs = useMemo(() => buildRecs(recommendations), [recommendations]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>Recommendations</h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>Based on your progress, here's what I recommend.</p>
          </div>
        </div>
        <div style={divider} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {recs.map((rec, i) => {
            const diff = DIFFICULTY[rec.difficulty] || DIFFICULTY.medium;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.06 * i }} tabIndex={0} role="button" aria-label={`${rec.title}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
                style={{ padding: `${spacing[4]}px`, borderRadius: 12, background: colors.surface, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${rec.color}`, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.surface; e.currentTarget.style.transform = 'translateX(0)'; }}
                onFocus={e => { e.currentTarget.style.borderColor = colors.borderFocus; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[2], marginBottom: spacing[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span style={{ fontSize: 18 }}>{rec.icon}</span>
                    <span style={{ fontSize: typography.cardTitle.size, fontWeight: typography.cardTitle.weight, color: colors.text }}>{rec.title}</span>
                  </div>
                    <span style={{ fontSize: typography.small.size, color: diff.color, fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 10px', borderRadius: 6, background: diff.bg, border: `1px solid ${diff.color}30` }}>{diff.label}</span>
                    {rec.priority === 'high' && <span style={{ fontSize: 9, fontWeight: 700, color: colors.danger, padding: '2px 8px', borderRadius: 6, background: colors.dangerSoft, border: `1px solid rgba(239,68,68,0.2)` }}>🔴 Priority</span>}
                  </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
                  {rec.evidence.map((e, j) => (
                    <div key={j} style={{ flex: '1 1 160px', padding: `${spacing[2]}px ${spacing[3]}px`, borderRadius: 8, background: colors.surface, border: `1px solid ${colors.border}` }}>
                      <div style={{ fontSize: typography.caption.size, color: colors.textMuted, marginBottom: 2 }}>{e.label}</div>
                      <div style={{ fontSize: typography.cardTitle.size, fontWeight: 600, color: colors.text }}>{e.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
                    <span style={{ fontSize: typography.caption.size, color: colors.textSoft }}>🎯 {rec.expectedGain}</span>
                    <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>⏱ {rec.time}</span>
                    <span style={{ fontSize: typography.caption.size, color: colors.accent, fontWeight: 500 }}>
                      ● {rec.confidence != null ? `${rec.confidence}% confident` : 'Confidence unavailable'}
                    </span>
                  </div>
                  <button tabIndex={-1} aria-hidden="true" style={{ padding: `${spacing[1]}px ${spacing[4]}px`, borderRadius: 8, fontSize: typography.caption.size, fontWeight: 600, cursor: 'pointer', background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >Start</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CoachCard>
    </motion.div>
  );
}
