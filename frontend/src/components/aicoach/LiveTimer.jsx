import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFocus, useFocusTimer } from '../../context/FocusContext';
import CoachCard from './CoachCard';
import { coachTokens } from './coachTokens';

const { colors, spacing, typography } = coachTokens;

export default function LiveTimer({ weakTopic = null, weakSubject = null }) {
  const navigate = useNavigate();
  const focus = useFocus();
  const timer = useFocusTimer();
  const sessionSubject = weakTopic?.subject || weakSubject || 'Theory of Computation';
  const sessionTopic = weakTopic?.name || 'Core concepts';
  const sessionLabel = `${sessionTopic}`;

  const todayHistory = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (focus.history || []).filter(h => {
      const hDate = new Date(h.date);
      return hDate.toISOString().split('T')[0] === today;
    });
  }, [focus.history]);

  const totalTodayMin = todayHistory.reduce((s, h) => s + (h.duration || 0), 0) / 60;
  const todaySessions = todayHistory.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
      <CoachCard>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
          <span style={{ fontSize: 16 }}>⏱️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: typography.sectionTitle.size, fontWeight: typography.sectionTitle.weight, color: colors.text, margin: 0, letterSpacing: typography.sectionTitle.ls }}>Today's Session</h2>
            <p style={{ fontSize: typography.caption.size, color: colors.textMuted, margin: 0, fontStyle: 'italic' }}>{focus.isActive ? 'Session in progress' : 'Ready to start'}</p>
          </div>
          {focus.isActive && (
            <>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: colors.success }} />
              <span style={{ fontSize: typography.small.size, color: colors.success, fontWeight: 500 }}>Live</span>
            </>
          )}
        </div>

        {/* Active session or start prompt */}
        {focus.isActive ? (
          <>
            {/* Timer display */}
            <div style={{ textAlign: 'center', marginBottom: spacing[3] }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', monospace", marginBottom: spacing[1] }}>
                {timer.formatTime(timer.timeRemaining)}
              </div>
              <div style={{ height: 5, borderRadius: 3, background: colors.surface, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
                <motion.div animate={{ width: `${timer.progress}%` }} transition={{ duration: 0.5 }}
                  style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})` }} />
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
              {focus.isPaused ? (
                <button onClick={focus.resumeSession} tabIndex={0} aria-label="Resume session"
                  style={{ padding: `${spacing[1]}px ${spacing[4]}px`, borderRadius: 8, fontSize: typography.caption.size, fontWeight: 600, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', cursor: 'pointer' }}
                  onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
                  onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                >▶ Resume</button>
              ) : (
                <button onClick={focus.pauseSession} tabIndex={0} aria-label="Pause session"
                  style={{ padding: `${spacing[1]}px ${spacing[4]}px`, borderRadius: 8, fontSize: typography.caption.size, fontWeight: 600, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', cursor: 'pointer' }}
                  onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
                  onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                >⏸ Pause</button>
              )}
              <button onClick={() => { focus.stopSession(); navigate('/focus-session'); }} tabIndex={0} aria-label="Open focus workspace"
                style={{ padding: `${spacing[1]}px ${spacing[4]}px`, borderRadius: 8, fontSize: typography.caption.size, fontWeight: 600, background: 'transparent', color: colors.textSoft, border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = colors.borderHover}
                onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
              >Open Focus</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
            <button onClick={() => { sessionStorage.setItem('focus_subject', sessionSubject); sessionStorage.setItem('focus_topic', sessionTopic); navigate('/focus-session'); }} tabIndex={0} aria-label="Start a study session"
              style={{ padding: `${spacing[2]}px ${spacing[6]}px`, borderRadius: 12, fontSize: typography.caption.size, fontWeight: 600, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${colors.accentGlow}` }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              onFocus={e => { e.currentTarget.style.outline = `2px solid ${colors.borderFocus}`; e.currentTarget.style.outlineOffset = 2; }}
              onBlur={e => { e.currentTarget.style.outline = 'none'; }}
            >🚀 Start Today's Session</button>
          </div>
        )}

        {/* Subject context */}
        <div style={{ padding: `${spacing[2]}px ${spacing[3]}px`, borderRadius: 8, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`, marginBottom: spacing[3] }}>
          <div style={{ fontSize: typography.caption.size, fontWeight: 600, color: colors.text }}>{sessionSubject} <span style={{ color: colors.textMuted, fontWeight: 400 }}>— {sessionLabel}</span></div>
        </div>

        {/* Today's sessions */}
        <div style={{ padding: spacing[2], borderRadius: 8, background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] }}>
            <span style={{ fontSize: typography.small.size, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</span>
            <span style={{ fontSize: typography.small.size, color: colors.textSoft }}>{Math.round(totalTodayMin)} min · {todaySessions} sessions</span>
          </div>
          {todayHistory.length === 0 ? (
            <div style={{ padding: `${spacing[2]}px 0`, textAlign: 'center' }}>
              <span style={{ fontSize: typography.caption.size, color: colors.textMuted, fontStyle: 'italic' }}>No sessions yet today</span>
            </div>
          ) : (
            todayHistory.slice(-4).reverse().map((h, i) => (
              <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', gap: spacing[2], padding: `${spacing[1]}px 0`, borderBottom: i < Math.min(todayHistory.length, 4) - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <span style={{ fontSize: typography.small.size, color: colors.textMuted, width: 40 }}>{new Date(h.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: typography.caption.size, fontWeight: 600, color: colors.text }}>{h.subject || 'Study'}</span>
                </div>
                <span style={{ fontSize: typography.caption.size, color: colors.textSoft }}>{Math.round((h.duration || 0) / 60)}m</span>
                {h.completed !== false && <span style={{ fontSize: 11, color: colors.success }}>✓</span>}
              </div>
            ))
          )}
        </div>
      </CoachCard>
    </motion.div>
  );
}
