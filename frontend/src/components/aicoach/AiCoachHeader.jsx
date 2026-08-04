import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { coachTokens } from './coachTokens';

const { colors, typography, spacing } = coachTokens;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { time: 'morning', icon: '🌅' };
  if (h < 17) return { time: 'afternoon', icon: '☀️' };
  return { time: 'evening', icon: '🌆' };
}

export default function AiCoachHeader({ name = 'there', streak = 0 }) {
  const { time, icon } = useMemo(getGreeting, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing[3], flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: 2 }}>
            <h1 style={{ fontSize: typography.hero.size, fontWeight: typography.hero.weight, color: colors.text, margin: 0, letterSpacing: typography.hero.ls, lineHeight: typography.hero.lh }}>
              Good {time}, {name}. {icon}
            </h1>
          </div>
          <p style={{ fontSize: typography.body.size, color: colors.textSoft, margin: '2px 0 0', lineHeight: 1.4 }}>
            {streak > 0 ? `You're on a ${streak}-day streak. I've reviewed your progress — let's make today count.` : 'I\'ve prepared today\'s plan based on your recent progress.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
