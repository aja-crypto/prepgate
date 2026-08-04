import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Session tracking ─── */
var SESSION_KEY = 'gatenexa_ai_workspace_session';
function trackSession(profile) {
  var now = new Date().toISOString();
  var sess = { lastOpened: now, visits: 1, streak: 0 };
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (raw) sess = JSON.parse(raw);
    var lastDate = sess.lastOpened ? new Date(sess.lastOpened).toDateString() : '';
    var today = new Date().toDateString();
    if (lastDate === today) { /* same day */ }
    else if (lastDate && (new Date().getTime() - new Date(sess.lastOpened).getTime()) < 172800000) {
      sess.streak = (sess.streak || 0) + 1;
      sess.visits = (sess.visits || 1) + 1;
      sess.daysSinceLast = Math.round((Date.now() - new Date(sess.lastOpened).getTime()) / 86400000);
    } else {
      sess.streak = 0;
      sess.visits = (sess.visits || 1) + 1;
      sess.daysSinceLast = Math.round((Date.now() - new Date(sess.lastOpened).getTime()) / 86400000);
    }
    sess.lastOpened = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } catch {}
  return sess;
}

function getContextualGreeting(name, profile, session, recommendations) {
  var hour = new Date().getHours();
  var time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  var lines = [];

  // First-time greeting
  if (!session || session.visits <= 1) {
    lines.push('Welcome, ' + name + '! 👋');
    lines.push('I have set up your personalized workspace. Let us begin your GATE journey.');
    return lines;
  }

  // Returning user — contextual greeting
  if (session.daysSinceLast >= 2) {
    lines.push('Welcome back, ' + name + '! 🎉');
    lines.push('It has been ' + session.daysSinceLast + ' days since your last session. Let us get back on track.');
  } else if (session.daysSinceLast >= 1) {
    lines.push('Welcome back, ' + name + '.');
    lines.push('You missed yesterday. No worries — one focused session gets you back in rhythm.');
  } else if (session.streak > 6) {
    lines.push('Good ' + time + ', ' + name + '! 🔥');
    lines.push(session.streak + '-day streak! Consistency is becoming your biggest strength.');
  } else if (session.streak > 2) {
    lines.push('Good ' + time + ', ' + name + '!');
    lines.push('Day ' + session.streak + ' — momentum is building.');
  } else {
    lines.push('Good ' + time + ', ' + name + '!');
    var rec = recommendations?.[0];
    if (rec) lines.push(rec.text || 'Let us pick up where we left off.');
    else lines.push('Ready for today\'s session?');
  }

  return lines;
}

export default function AiWorkspace({ colors, onboarding, profile, recommendations, roadmap, studentState, onNavigate }) {
  var name = onboarding?.name || profile?.name || 'Aspirant';
  var year = onboarding?.year || profile?.gateExamYear || '2027';
  var branch = onboarding?.branch || profile?.branch || 'CSE';
  var hours = onboarding?.hours || profile?.dailyStudyHours || '2-4';
  var target = onboarding?.target || (profile?.targetAIR ? String(profile.targetAIR) : 'qualify');
  var institute = onboarding?.institute || profile?.dreamCollege || 'good-rank';
  var challenge = onboarding?.challenge || 'consistency';
  var subjects = onboarding?.subjects || profile?.completedSubjects || [];

  var branchLabel = { cse: 'CSE', ece: 'ECE', ee: 'EE', da: 'DA', me: 'ME', ce: 'CE' };
  var targetLabel = { qualify: 'Qualify', '50': '50+ Marks', '65': '65+ Marks', '80': '80+ Marks', '90': '90+ Marks' };

  var [session, setSession] = useState(null);
  useEffect(function() {
    setSession(trackSession(profile));
  }, []);

  var greetingLines = getContextualGreeting(name, profile, session, recommendations);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

      {/* Contextual Greeting */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>👋</span>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
            {greetingLines[0]}
          </h2>
        </div>
        {greetingLines.slice(1).map(function(line, i) {
          return <p key={i} style={{ fontSize: 12, color: colors.text3, margin: '0 0 4px 0', lineHeight: 1.5 }}>{line}</p>;
        })}
        {session?.streak > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: colors.accent, fontWeight: 500 }}>
            🔥 {session.streak}-day streak
          </div>
        )}
      </motion.div>

      {/* Today's Focus + Daily Briefing */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{
          padding: 16, borderRadius: 16, marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(124,58,237,0.06))',
          border: '1px solid rgba(139,92,246,0.2)',
        }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.accentHover, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Daily Briefing
        </div>
        {/* Roadmap status */}
        {roadmap?.paceLabel && (
          <div style={{ fontSize: 11, color: roadmap.paceStatus === 'behind' ? colors.warning : colors.success, marginBottom: 8, fontWeight: 500 }}>
            {roadmap.paceStatus === 'ahead' ? '⚡ ' : roadmap.paceStatus === 'behind' ? '⏳ ' : '✅ '}
            {roadmap.paceLabel}
          </div>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 4px 0' }}>
          {recommendations?.[0]?.text || 'Build Strong Foundations'}
        </h3>
        <p style={{ fontSize: 12, color: colors.text3, margin: 0, lineHeight: 1.5 }}>
          {recommendations?.[0]?.reason || 'Start with Engineering Mathematics and Digital Logic — high-weightage, low-difficulty subjects.'}
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: colors.text4 }}>
          <span>⏱ ~{hours}h today</span>
          <span>📚 {roadmap?.remainingSubjects > 0 ? roadmap.remainingSubjects + ' remaining' : 'All subjects completed'}</span>
        </div>
      </motion.div>

      {/* Daily Missions — top 4 recommendations with priority */}
      {recommendations?.length > 0 && (
        <motion.div variants={sectionVariants} initial="hidden" animate="show"
          style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.text, margin: '0 0 10px 0' }}>Today's Missions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recommendations.slice(0, 4).map(function(rec, i) {
              var priorityColors = {
                critical: { bg: 'rgba(239,68,68,0.08)', color: colors.error, border: 'rgba(239,68,68,0.2)' },
                high: { bg: 'rgba(239,68,68,0.06)', color: colors.error, border: 'rgba(239,68,68,0.15)' },
                medium: { bg: 'rgba(245,158,11,0.06)', color: colors.warning, border: 'rgba(245,158,11,0.15)' },
                low: { bg: 'rgba(139,92,246,0.05)', color: colors.accent, border: 'rgba(139,92,246,0.12)' },
              };
              var p = priorityColors[rec.priority] || priorityColors.low;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12,
                  background: p.bg, border: '1px solid ' + p.border,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{rec.icon || '📋'}</span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.text2, lineHeight: 1.4 }}>{rec.text}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: p.color, padding: '2px 6px', borderRadius: 999, background: p.bg, border: '1px solid ' + p.border, textTransform: 'uppercase' }}>
                    {rec.priority === 'critical' ? '!' : rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MED' : 'LOW'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Predictions + Study Balance */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Predictions */}
        <div style={{
          padding: 12, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid ' + colors.border,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.text4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Predictions
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: colors.accent, lineHeight: 1 }}>
            {roadmap?.readinessScore || '—'}%
          </div>
          <div style={{ fontSize: 10, color: colors.text4, marginTop: 2 }}>Readiness Score</div>
          <div style={{ marginTop: 8, fontSize: 11, color: colors.text2 }}>
            Phase: {roadmap?.currentPhase || 'Foundation'}
          </div>
        </div>
        {/* Study Balance */}
        <div style={{
          padding: 12, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid ' + colors.border,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.text4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Study Balance
          </div>
          <div style={{ fontSize: 12, color: colors.text2, lineHeight: 1.5 }}>
            {profile?.weakestSubject ? <><span style={{ color: colors.warning }}>⚠</span> <strong>{profile.weakestSubject}</strong> needs focus.</> : <><span style={{ color: colors.success }}>✅</span> All subjects balanced.</>}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: colors.text3 }}>
            {roadmap?.remainingSubjects > 8 ? roadmap.remainingSubjects + ' subjects remaining — steady pace needed.' :
             roadmap?.remainingSubjects > 4 ? roadmap.remainingSubjects + ' subjects left — you are making progress.' :
             roadmap?.remainingSubjects > 0 ? roadmap.remainingSubjects + ' subjects left — almost there!' :
             'All subjects completed!'}
          </div>
        </div>
      </motion.div>

      {/* AI Insights — dynamic observations */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.text, margin: '0 0 10px 0' }}>AI Insights</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '💪', label: 'Strongest Subject', value: profile?.strongestSubject || 'Getting Started' },
            { icon: '⚠️', label: 'Needs Focus', value: profile?.weakestSubject || 'Not enough data yet' },
            { icon: '📊', label: 'Readiness', value: (roadmap?.readinessScore || 0) + '% — ' + (roadmap?.readinessScore < 30 ? 'Building foundations' : roadmap?.readinessScore < 60 ? 'Making progress' : roadmap?.readinessScore < 80 ? 'Getting ready' : 'Almost there') },
            { icon: '🏁', label: 'Roadmap Phase', value: roadmap?.currentPhase + (roadmap?.nextPhase ? ' → ' + roadmap.nextPhase : '') || 'Foundation' },
          ].map(function(item) {
            return (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px solid ' + colors.border,
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: colors.text4, marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: colors.text2, fontWeight: 500 }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* AI Memory — comprehensive */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.text, margin: 0 }}>What I Remember</h4>
          <span style={{ fontSize: 10, color: colors.text4 }}>{'\u26A1'} Live</span>
        </div>
        <div style={{
          padding: 12, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid ' + colors.border,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
        }}>
          {[
            { label: 'Preparing for', value: 'GATE ' + year },
            { label: 'Branch', value: branchLabel[branch] || branch },
            { label: 'Daily Goal', value: hours + 'h/day' },
            { label: 'Dream Institute', value: institute?.replace(/-/g, ' ') || '—' },
            { label: 'Weakest Subject', value: profile?.weakestSubject || subjects[0] || '—' },
            { label: 'Strongest Subject', value: profile?.strongestSubject || subjects[subjects.length - 1] || '—' },
            { label: 'Current Phase', value: roadmap?.currentPhase || 'Foundation' },
            { label: 'Last Session', value: session?.daysSinceLast > 1 ? session.daysSinceLast + ' days ago' : session?.daysSinceLast ? 'Yesterday' : 'Today' },
          ].map(function(item) {
            return (
              <div key={item.label}>
                <div style={{ fontSize: 9, color: colors.text4, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: colors.text2, fontWeight: 500 }}>{item.value}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.text, margin: '0 0 10px 0' }}>Quick Actions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: '💬', label: 'Ask a Doubt', route: '/mentor' },
            { icon: '📝', label: 'Generate Quiz', route: '/mock-tests' },
            { icon: '📅', label: 'Study Plan', route: '/planner' },
            { icon: '🎯', label: 'Weak Topics', route: '/weak-topics' },
          ].map(function(action) {
            return (
              <motion.button key={action.label}
                onClick={function() { onNavigate?.(action.route); }}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: '12px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                  border: '1px solid ' + colors.border, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)', color: colors.text2,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Motivation — contextual based on state */}
      <motion.div variants={sectionVariants} initial="hidden" animate="show"
        style={{
          padding: 16, borderRadius: 16, marginBottom: 8,
          background: 'rgba(255,255,255,0.02)', border: '1px solid ' + colors.border,
          textAlign: 'center',
        }}>
        <p style={{ fontSize: 12, color: colors.text3, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          {roadmap?.paceStatus === 'behind'
            ? 'Progress pauses. Success does not. One focused session today gets you back on track.'
            : roadmap?.paceStatus === 'ahead'
              ? 'Excellent momentum. You are ahead of schedule — keep this rhythm going.'
              : session?.streak > 5
                ? 'Day ' + session.streak + '. Consistency is quietly building your rank. Keep showing up.'
                : session?.daysSinceLast > 1
                  ? 'Missed time is not lost time. Every session you return to moves you forward.'
                  : 'You are closer than you think. Every hour of focused study compounds.'
          }
        </p>
        <p style={{ fontSize: 11, color: colors.accent, margin: '8px 0 0 0', fontWeight: 500 }}>
          Let's begin today's session.
        </p>
      </motion.div>

    </div>
  );
}
