import { motion } from 'framer-motion';
import AiSymbol from '../ui/AiSymbol';

var TOPICS = [
  'GATE Preparation',
  'Subjects',
  'PYQs',
  'Revision',
  'Mock Tests',
  'Strategy',
];

export default function AiPromptCards({ colors, onNavigate }) {
  return (
    <div style={{ padding: '32px 16px', maxWidth: 560 }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ marginBottom: 20 }}><AiSymbol size={42} glow={true} /></div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: colors.text,
          margin: '0 0 8px 0', letterSpacing: '-0.02em',
        }}>
          Nexa AI
        </h1>
        <p style={{ fontSize: 14, color: colors.text3, margin: 0, lineHeight: 1.6 }}>
          Your Personal GATE Mentor
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 36 }}
      >
        <p style={{ fontSize: 13, color: colors.text3, margin: '0 0 12px 0', lineHeight: 1.5 }}>
          Ask anything about
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TOPICS.map(function(t) {
            return (
              <span key={t} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12,
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                color: colors.accentHover, fontWeight: 500,
              }}>
                {t}
              </span>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          padding: '20px 0', borderTop: '1px solid ' + colors.border,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.text2, margin: '0 0 12px 0' }}>
          Recent Conversations
        </h3>
        <p style={{ fontSize: 12, color: colors.text4, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          Your conversation with Nexa AI will appear here.
        </p>
      </motion.div>
    </div>
  );
}
