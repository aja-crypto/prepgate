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

export default function GreetingMessage({ name = 'Ajay' }) {
  const { time, icon } = useMemo(getGreeting, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 style={{
        fontSize: typography.greeting.size, fontWeight: typography.greeting.weight,
        color: colors.text, margin: 0, letterSpacing: typography.greeting.ls,
        lineHeight: typography.greeting.lh,
      }}>
        Good {time}, {name}. {icon}
      </h1>
      <p style={{
        fontSize: typography.body.size, color: colors.textSoft, margin: `${spacing[2]}px 0 0`,
        lineHeight: typography.body.lh, fontStyle: 'italic', maxWidth: 480,
      }}>
        I've prepared today's plan based on your progress. Let's strengthen TOC —
        it's been 5 days since your last revision.
      </p>
    </motion.div>
  );
}
