import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CoachCard from './CoachCard';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, divider } = coachTokens;

function computeMetrics(studyStats, pyqs, mocks, gateFeatures) {
  const weeklyHours = Array.isArray(studyStats?.weeklyHours) ? studyStats.weeklyHours.reduce((a, b) => a + b, 0) : studyStats?.totalHours || 0;
  const streak = gateFeatures?.streak?.current || 0;
  const pyqCount = Array.isArray(pyqs) ? pyqs.length : 0;
  const correct = Array.isArray(pyqs) ? pyqs.filter(p => p.status === 'correct' || p.solved).length : 0;
  const accuracy = pyqCount > 0 ? Math.round((correct / pyqCount) * 100) : null;
  const subjects = Array.isArray(studyStats?.subjects) ? studyStats.subjects : [];
  const sorted = [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const overall = sorted.length > 0 ? Math.round(sorted.reduce((s, x) => s + (x.progress || 0), 0) / sorted.length) : null;

  const metrics = [];
  if (streak > 0) metrics.push({ icon: '🔥', label: 'Study Streak', value: `${streak} days`, color: colors.warning });
  if (weeklyHours > 0) metrics.push({ icon: '📚', label: 'This Week', value: `${weeklyHours}h`, color: colors.accent });
  if (overall !== null) metrics.push({ icon: '📈', label: 'Overall Progress', value: `${overall}%`, color: colors.success });
  if (accuracy !== null) metrics.push({ icon: '🎯', label: 'PYQ Accuracy', value: `${accuracy}%`, color: accuracy >= 60 ? colors.success : colors.warning });
  if (pyqCount > 0) metrics.push({ icon: '📝', label: 'PYQs Solved', value: `${pyqCount}`, color: colors.info });
  if (sorted.length > 0) {
    const weakest = sorted[sorted.length - 1];
    metrics.push({ icon: '⚠️', label: 'Needs Focus', value: weakest?.name || '—', color: colors.danger, detail: weakest ? `${weakest.progress || 0}%` : '' });
  }

  return metrics;
}

export default function ProgressCard({ studyStats = null, pyqs = null, mocks = null, gateFeatures = null }) {
  const metrics = useMemo(() => computeMetrics(studyStats, pyqs, mocks, gateFeatures), [studyStats, pyqs, mocks, gateFeatures]);
  const hasData = metrics.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>Your Progress</h2>
        </div>
        <div style={divider} />

        {!hasData ? (
          <div style={{ textAlign: 'center', padding: `${spacing[6]}px ${spacing[4]}px` }}>
            <p style={{ fontSize: typography.body.size, color: colors.textSoft, lineHeight: 1.5, margin: 0 }}>
              Complete your first study session and I'll start tracking your progress here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ flex: '1 1 140px', padding: `${spacing[2]}px ${spacing[3]}px`, borderRadius: 10, background: colors.surface, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: 2 }}>
                  <span>{m.icon}</span>
                  <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>{m.label}</span>
                </div>
                <span style={{ fontSize: typography.miniStat.size, fontWeight: 700, color: m.color }}>{m.value}</span>
                {m.detail && <span style={{ fontSize: typography.small.size, color: colors.textMuted, marginLeft: spacing[1] }}>{m.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </CoachCard>
    </motion.div>
  );
}
