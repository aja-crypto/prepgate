import { useAuth } from '../../context/AuthContext';

export default function AiLimitBadge({ className }) {
  const { aiQuestionsRemaining, aiQuestionLimit, isPremium } = useAuth();
  if (isPremium) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${className || ''}`} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Premium AI Access - 200/day
      </div>
    );
  }
  const remaining = aiQuestionsRemaining !== null ? aiQuestionsRemaining : 0;
  const limit = aiQuestionLimit || 5;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${className || ''}`} style={{ background: remaining <= 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)', color: remaining <= 1 ? '#EF4444' : '#A78BFA', border: `1px solid ${remaining <= 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.2)'}` }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Questions Remaining: {remaining}/{limit}
    </div>
  );
}
