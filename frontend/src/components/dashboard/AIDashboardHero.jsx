import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { aiService } from '../../services/api';
import GlassCard from '../ui/GlassCard';

// Unified dashboard hero: greeting + AI Daily Brief + key stats.
// Pulls the server-built AI context so every number is real backend data.
export default function AIDashboardHero({ userName = 'aspirant', isPremium = false }) {
  const [ctx, setCtx] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    aiService.getContext()
      .then(res => { if (!cancelled) { setCtx(res.data?.data || null); setStatus('ok'); } })
      .catch(() => { if (!cancelled) { setCtx(null); setStatus('empty'); } });
    return () => { cancelled = true; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const brief = ctx?.dailyBrief;
  const roadmap = ctx?.roadmap;
  const analytics = ctx?.analytics;
  const prediction = ctx?.prediction;
  const journey = ctx?.journey;
  const weakTopics = ctx?.weakTopics || [];

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.06))',
      border: '1px solid rgba(139,92,246,0.2)',
      boxShadow: '0 0 60px rgba(139,92,246,0.08)',
    }}>
      {/* ambient glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)' }} />
      <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)' }} />

      <div className="relative z-10">
        {/* Greeting row */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(34,211,238,0.15))', boxShadow: '0 0 24px rgba(167,139,250,0.2)' }}>
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">{greeting}, {userName}</h1>
                {isPremium ? (
                  <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">⭐ PREMIUM</span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">BASIC</span>
                )}
              </div>
              <p className="text-xs text-text3/80 mt-0.5">Nexa AI — your GATE 2027 co-pilot</p>
            </div>
          </div>
          {roadmap?.daysToExam != null && (
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-primary">{roadmap.daysToExam}</div>
              <div className="text-[10px] text-text3">days to GATE 2027</div>
            </div>
          )}
        </div>

        {/* AI Brief */}
        {status === 'ok' && brief && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="mb-4 p-3.5 rounded-xl" style={{ background: 'rgba(5,8,22,0.5)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p className="text-xs sm:text-sm text-text leading-relaxed">{brief.summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {weakTopics.slice(0, 3).map((t, i) => (
                <span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.12)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.2)' }}>
                  🎯 {t.name || t}{t.accuracy != null ? ` (${t.accuracy}%)` : ''}
                </span>
              ))}
              {brief.estimatedTime && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(34,211,238,0.1)', color: '#67E8F9', border: '1px solid rgba(34,211,238,0.2)' }}>
                  ⏱ {brief.estimatedTime}
                </span>
              )}
              {brief.predictedImprovement && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)' }}>
                  📈 {brief.predictedImprovement}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <Stat label="Overall Progress" value={`${roadmap?.completion ?? ctx?.overallProgress ?? 0}%`} icon="📊" />
          <Stat label="PYQ Accuracy" value={`${analytics?.accuracy ?? 0}%`} icon="🎯" />
          <Stat label="Study Today" value={`${analytics?.studyHours?.today ?? 0}h`} icon="⏱️" />
          <Stat label="Predicted AIR" value={prediction?.air ? `#${prediction.air}` : '—'} icon="🎖️" />
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/mentor" className="btn-primary text-xs px-4 py-2 rounded-xl font-semibold">Ask Nexa AI</Link>
          <Link to="/roadmap" className="text-xs px-4 py-2 rounded-xl font-semibold border transition-all hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'var(--color-text2)' }}>View Roadmap</Link>
          {journey?.goal && (
            <span className="text-[11px] px-3 py-2 rounded-xl font-medium text-text2/80" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              🎯 Mission: {journey.goal}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(5,8,22,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-1.5 text-[10px] text-text3 mb-1">
        <span>{icon}</span>
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono text-text">{value}</div>
    </div>
  );
}
