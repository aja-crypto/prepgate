import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CoachCard from './CoachCard';
import MemoryItem from './MemoryItem';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, divider } = coachTokens;

function buildMemoryItems(profile) {
  if (!profile) return [];
  const items = [
    { icon: '📅', label: 'Exam Year', value: profile.gateExamYear || 'Not learned yet' },
    { icon: '💻', label: 'Branch', value: profile.branch || profile.stream || 'Not learned yet' },
    { icon: '🎯', label: 'Target AIR', value: profile.targetAIR ? `#${profile.targetAIR}` : 'Not set', highlight: true },
    { icon: '🏫', label: 'Dream Institute', value: profile.dreamCollege || 'Not set' },
    { icon: '💪', label: 'Strongest Topic', value: profile.strongestSubject || 'Not learned yet' },
    { icon: '⚠️', label: 'Weakest Topic', value: profile.weakestSubject || 'Not learned yet', highlight: true },
    { icon: '🌙', label: 'Preferred Study Time', value: profile.studyTime || profile.studyPattern || 'Not learned yet' },
    { icon: '🔄', label: 'Revision Pattern', value: profile.revisionPattern || 'Every 3 days' },
    { icon: '📊', label: 'Average Session', value: profile.averageSession || '1h 45m' },
    { icon: '📅', label: 'Most Active Day', value: profile.mostActiveDay || 'Sunday' },
    { icon: '🎯', label: 'Current Focus', value: profile.currentSubject || 'Not set' },
    { icon: '🧑‍💻', label: 'Preparation Style', value: profile.preparationStage ? profile.preparationStage.charAt(0).toUpperCase() + profile.preparationStage.slice(1) : 'Not learned yet' },
  ];
  return items;
}

export default function WhatIKnowCard({ profile = null }) {
  const [showEmpty, setShowEmpty] = useState(false);
  const memoryItems = useMemo(() => buildMemoryItems(profile), [profile]);
  const isEmpty = !profile || Object.values(profile).filter(v => v && v !== '' && v !== false).length < 3;

  if (isEmpty || showEmpty) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <CoachCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>What I Know About You</h2>
          </div>
          <div style={divider} />
          <div style={{ textAlign: 'center', padding: `${spacing[10]}px ${spacing[6]}px` }}>
            <div style={{ fontSize: 40, marginBottom: spacing[4], opacity: 0.5 }}>🤔</div>
            <h3 style={{ fontSize: typography.cardTitle.size, fontWeight: typography.cardTitle.weight, color: colors.text, margin: `0 0 ${spacing[2]}px` }}>I don't know enough about you yet.</h3>
            <p style={{ fontSize: typography.body.size, color: colors.textSoft, lineHeight: typography.body.lh, maxWidth: 360, margin: `0 auto ${spacing[6]}px` }}>Complete onboarding so I can personalize your coaching.</p>
            <button tabIndex={0} aria-label="Start setup" style={{ padding: `${spacing[2]}px ${spacing[6]}px`, borderRadius: 12, fontSize: typography.caption.size, fontWeight: 600, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
              onBlur={e => { e.currentTarget.style.outline = 'none'; }}
            >🚀 Start Setup</button>
          </div>
        </CoachCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
      <CoachCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>What I Know About You</h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>I use this to personalize your entire coaching experience.</p>
          </div>
        </div>
        <div style={divider} />
        <div style={{ padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 12, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`, marginBottom: spacing[4], textAlign: 'center' }}>
          <span style={{ fontSize: typography.cardTitle.size, fontWeight: 600, color: colors.text, letterSpacing: '0.02em' }}>GATE {profile.gateExamYear || '2027'} <span style={{ color: colors.textMuted }}>•</span> {profile.branch || profile.stream || 'Computer Science'}</span>
        </div>
        <div className="coach-memory-grid" style={{ display: 'grid', gap: spacing[2] }} role="list" aria-label="Information the AI coach knows about you">
          {memoryItems.map((item, i) => (
            <MemoryItem key={i} icon={item.icon} label={item.label} value={item.value} highlight={item.highlight} />
          ))}
        </div>
        <div style={{ marginTop: spacing[4], padding: `${spacing[3]}px ${spacing[4]}px`, borderRadius: 10, background: colors.surface, border: `1px dashed ${colors.border}` }}>
          <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>💡 I'll use this information to personalize your roadmap, recommendations, and daily study plan.</p>
        </div>
      </CoachCard>
    </motion.div>
  );
}
