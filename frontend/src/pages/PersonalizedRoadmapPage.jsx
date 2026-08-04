// src/pages/PersonalizedRoadmapPage.jsx
// Intelligent, data-driven GATE roadmap generated from the server AI context.
// Loads /api/ai/context (real backend data) and renders timeline, subjects,
// milestones, pacing, and Nexa AI guidance — no placeholders.
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import { PageLoading } from '../components/common/GateLoadingScreen';

const SUBJECT_ICONS = {
  'Engineering Mathematics': '📐', 'Digital Logic': '💻', 'Computer Organization & Architecture': '🖥️',
  'Programming & DS': '🐍', 'Algorithms': '⚡', 'Operating Systems': '⚙️', 'DBMS': '🗄️',
  'Computer Networks': '🌐', 'Theory of Computation': '🤖', 'Compiler Design': '🔧', 'General Aptitude': '🧮',
};

function subjectColor(name) {
  const map = {
    'Engineering Mathematics': '#10B981', 'Algorithms': '#3B82F6', 'DBMS': '#F59E0B',
    'Operating Systems': '#22C55E', 'Computer Networks': '#06B6D4', 'Theory of Computation': '#A855F7',
    'Compiler Design': '#EC4899', 'Computer Organization & Architecture': '#EF4444', 'Digital Logic': '#84CC16',
    'Programming & DS': '#38BDF8', 'General Aptitude': '#F97316',
  };
  return map[name] || '#8B5CF6';
}

export default function PersonalizedRoadmapPage() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    aiService.getContext()
      .then(res => { if (!cancelled) setCtx(res.data?.data || null); })
      .catch(() => { if (!cancelled) setCtx(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PageLoading title="Generating your intelligent roadmap" />;

  if (!ctx?.roadmap) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GlassCard hover={false} padding="p-8" className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <h2 className="text-lg font-bold text-text mb-2">No roadmap data yet</h2>
          <p className="text-sm text-text3">Complete some topics and solve PYQs to generate your AI roadmap.</p>
        </GlassCard>
      </div>
    );
  }

  const rm = ctx.roadmap;
  const narrative = rm.narrative;
  const onTrack = rm.onTrack;
  const timeline = rm.timeline || [];
  const subjects = rm.subjects || [];
  const milestones = rm.milestones || [];
  const prediction = ctx.prediction;

  return (
    <div className="min-h-[calc(100vh-80px)] max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">🗺️ Your GATE 2027 Roadmap</h1>
          <p className="text-sm text-text3 mt-0.5">
            {rm.daysToExam} days to exam · generated from your live progress
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-xl font-semibold" style={{
          background: onTrack ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          color: onTrack ? '#4ADE80' : '#FBBF24',
          border: `1px solid ${onTrack ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}>
          {onTrack ? '✓ On Track' : '⚠ Behind Schedule'}
        </span>
      </div>

      {/* Nexa AI narrative */}
      {narrative && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(34,211,238,0.15))' }}>🤖</span>
            <span className="text-sm font-semibold text-text">Nexa AI Roadmap Guidance</span>
          </div>
          <p className="text-sm text-text leading-relaxed">{narrative}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {rm.probability != null && <Chip label="Schedule probability" value={`${rm.probability}%`} />}
            {rm.dailyHoursNeeded != null && <Chip label="Hours/day to catch up" value={`${rm.dailyHoursNeeded}h`} />}
            {rm.currentMonth && <Chip label="Current month" value={rm.currentMonth} />}
            {prediction?.air && <Chip label="Predicted AIR" value={`#${prediction.air}`} />}
          </div>
        </motion.div>
      )}

      {/* Month timeline */}
      {timeline.length > 0 && (
        <GlassCard hover={false} padding="p-5" className="mb-6">
          <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">📅 Timeline to Exam</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timeline.map((t, i) => (
              <div key={i} className="flex-1 min-w-[72px] text-center p-2 rounded-xl" style={{
                background: t.status === 'current' ? 'rgba(139,92,246,0.12)' : t.status === 'completed' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${t.status === 'current' ? 'rgba(139,92,246,0.3)' : t.status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div className="text-sm font-bold" style={{ color: t.status === 'completed' ? '#4ADE80' : t.status === 'current' ? '#C4B5FD' : 'var(--color-text2)' }}>
                  {t.isExam ? '🎯 ' : ''}{t.month}
                </div>
                <div className="text-[9px] text-text3 mt-0.5 truncate">{t.phase}</div>
                {t.status === 'current' && <div className="text-[9px] font-bold text-primary mt-1">● Now</div>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Subject progression */}
      <GlassCard hover={false} padding="p-5" className="mb-6">
        <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">📚 Subject Progression</h3>
        <div className="space-y-2.5">
          {subjects.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
              <div className="flex items-center gap-3">
                <span className="text-base shrink-0">{SUBJECT_ICONS[s.name] || '📘'}</span>
                <button
                  onClick={() => setExpandedSubject(expandedSubject === s.name ? null : s.name)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text truncate">
                      {s.name}
                      {s.status === 'mastered' && <span className="ml-1.5 text-success">✓</span>}
                    </span>
                    <span className="text-xs font-bold font-mono" style={{ color: s.progress >= 80 ? '#4ADE80' : s.progress >= 40 ? '#C4B5FD' : 'var(--color-text3)' }}>
                      {s.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.progress}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 * i }}
                      className="h-full rounded-full"
                      style={{ background: subjectColor(s.name) }}
                    />
                  </div>
                </button>
              </div>
              {expandedSubject === s.name && (
                <div className="ml-7 mt-1.5 text-[10px] text-text3">
                  {s.topicsTotal ? `${s.topicsDone}/${s.topicsTotal} topics` : 'Topics not tracked'} · PYQ accuracy {s.pyqAccuracy != null ? `${s.pyqAccuracy}%` : 'n/a'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Milestones */}
      {milestones.length > 0 && (
        <GlassCard hover={false} padding="p-5" className="mb-6">
          <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">🎖 Milestones & Rewards</h3>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
                background: m.unlocked ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${m.unlocked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                opacity: m.unlocked ? 1 : 0.6,
              }}>
                <span className="text-lg">{m.unlocked ? '🏅' : '🔒'}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold" style={{ color: m.unlocked ? '#4ADE80' : 'var(--color-text2)' }}>{m.title}</div>
                  {m.reward && <div className="text-[10px] text-text3">{m.reward}</div>}
                </div>
                {m.unlocked && <span className="text-[10px] font-bold text-success">DONE</span>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Next milestone banner */}
      {rm.nextMilestone && (
        <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)' }}>
          <div className="text-[10px] text-text3 mb-1">🎯 Next milestone</div>
          <div className="text-sm font-bold text-text">{rm.nextMilestone}</div>
          {rm.nextMilestoneReward && <div className="text-xs text-primary mt-1">Reward: {rm.nextMilestoneReward}</div>}
        </div>
      )}
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.2)' }}>
      {label}: <span className="font-bold">{value}</span>
    </span>
  );
}
