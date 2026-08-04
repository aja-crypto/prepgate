import { useNavigate } from 'react-router-dom';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography, shadow } = coachTokens;

const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: spacing[1] + 2,
  padding: `${spacing[2]}px ${spacing[5]}px`, borderRadius: 12,
  fontSize: typography.caption.size, fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.2s',
  border: 'none', textDecoration: 'none',
};

export default function CoachActionButtons({ subject = '' }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[5], flexWrap: 'wrap' }}>
      <button
        style={{
          ...btnBase,
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
          color: '#fff', boxShadow: shadow.glow,
        }}
        tabIndex={0}
        aria-label="Open focus workspace to begin today's study session"
        onClick={() => { sessionStorage.setItem('focus_subject', subject || 'Theory of Computation'); navigate('/focus-session'); }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = shadow.glow; }}
        onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
        onBlur={e => { e.currentTarget.style.outline = 'none'; }}
      >
        🎯 Continue Today's Journey
      </button>

      <button
        style={{
          ...btnBase,
          background: 'transparent', color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
        tabIndex={0}
        aria-label="Ask the AI Coach a question"
        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.borderHover; e.currentTarget.style.background = colors.accentSoft; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = 'transparent'; }}
        onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; e.currentTarget.style.borderColor = colors.borderHover; }}
        onBlur={e => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = colors.border; }}
      >
        💬 Ask My Coach
      </button>
    </div>
  );
}
