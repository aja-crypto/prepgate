import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../../context/ProgressContext';
import { useAiMentor } from '../../context/AiMentorContext';
import { useAuth } from '../../context/AuthContext';
import NeuralBackground from '../common/NeuralBackground';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function WelcomeCard({ profile, studyStats, gateFeatures, roadmap }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || profile?.name || 'Aspirant';
  const targetAIR = profile.targetAIR;
  const airLabel = targetAIR === 999999 ? 'Qualify' : `AIR ${targetAIR}`;
  const phase = roadmap?.currentPhase || 'Foundation';

  return (
    <motion.div variants={item} className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-white/[0.08]"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))' }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
        <div className="w-full h-full rounded-full bg-primary blur-3xl" />
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text3 font-medium uppercase tracking-wider mb-1">🧠 GateNexa AI Mentor</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-text3 mt-1">
              <span className="text-cyan-400 font-medium">{phase}</span>
              {targetAIR && <> · <span className="text-primary font-semibold">{airLabel}</span></>}
              {profile.dreamCollege && (
                <> · <span className="text-cyan-400 font-semibold">{profile.dreamCollege}</span></>
              )}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <span className="text-lg font-bold text-primary font-mono">
              {studyStats?.weeklyHours?.length ? Math.round(studyStats.weeklyHours.reduce((a, b) => a + b, 0)) : 0}
            </span>
            <span className="text-[10px] text-text3">hrs/week</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TodaysMission({ profile, gateFeatures }) {
  const todayPlan = gateFeatures?.studyPlans?.[new Date().toISOString().slice(0, 10)];
  const todayHours = gateFeatures?.todayProgress?.hours || 0;
  const targetHours = gateFeatures?.dailyTarget?.hours || 8;
  const progress = targetHours > 0 ? Math.min(100, Math.round((todayHours / targetHours) * 100)) : 0;

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎯</span>
        <h2 className="text-sm font-bold text-text">Today's Mission</h2>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-text3 mb-1.5">
            <span>Study Progress</span>
            <span className="font-mono text-primary">{todayHours}h / {targetHours}h</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {(todayPlan?.slice(0, 3) || []).map((task, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-text2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span>{task.subject}: {task.topic}</span>
          </div>
        ))}
        {(!todayPlan || todayPlan.length === 0) && (
          <p className="text-xs text-text3 italic">No study plan for today. Ask AI Mentor to create one!</p>
        )}
      </div>
    </motion.div>
  );
}

function CurrentRoadmap({ profile, roadmap }) {
  const stages = roadmap?.stages || [];
  const currentIdx = stages.findIndex((s) => s.status === 'current');
  const nextName = roadmap?.nextPhase;
  const smartOrder = roadmap?.suggestedPath || [];

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗺️</span>
        <h2 className="text-sm font-bold text-text">Current Roadmap</h2>
      </div>
      <div className="space-y-1">
        {stages.map((s, i) => {
          const isActive = s.status === 'current';
          const isDone = s.status === 'completed';
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isDone ? 'bg-primary border-primary' : isActive ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'bg-transparent border-white/[0.2]'
                }`} />
                {i < stages.length - 1 && <div className={`w-0.5 h-5 ${isDone ? 'bg-primary/40' : 'bg-white/[0.06]'}`} />}
              </div>
              <div className={`text-xs ${isActive ? 'text-text font-semibold' : isDone ? 'text-text3' : 'text-text4'}`}>
                <span className="mr-1.5">{s.icon}</span>
                {s.label}
                {isActive && <span className="ml-1.5 text-[10px] text-primary">← Current</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1">
        <p className="text-[10px] text-text3">
          {roadmap?.remainingSubjects > 0 ? (
            <>{roadmap.remainingSubjects} subjects remaining{nextName ? <> · Next: <span className="text-primary">{nextName}</span></> : ''}</>
          ) : (
            <>All subjects completed</>
          )}
        </p>
        {roadmap?.estimatedDays && (
          <p className="text-[10px] text-text3">
            Est. completion: <span className="text-cyan-400">{roadmap.estimatedDays} days</span>
            {roadmap.estimatedDate && <> ({roadmap.estimatedDate})</>}
          </p>
        )}
        {roadmap?.nextRecommendedSubject && (
          <div className="mt-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[10px] font-medium text-cyan-400 mb-0.5">Next: {roadmap.nextRecommendedSubject.subject}</p>
            <p className="text-[10px] text-text3 leading-relaxed">{roadmap.nextRecommendedSubject.reason}</p>
            {roadmap.nextRecommendedSubject.pairedContinuity && (
              <p className="text-[10px] text-text4 mt-0.5">{roadmap.nextRecommendedSubject.pairedContinuity.reason}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MentorMessage({ profile, recommendations }) {
  const topRec = recommendations?.[0];
  const [showReason, setShowReason] = useState(false);
  const messages = useMemo(() => {
    if (!profile.onboardingCompleted) return { text: "Let's set up your profile to get started!", emoji: '👋' };
    if (topRec) return { text: topRec.text, emoji: topRec.icon || '💡' };
    if (profile.weakestSubject) return {
      text: `Focus on ${profile.weakestSubject} today — it's your weakest area. Even 30 minutes makes a difference.`,
      emoji: '💡',
    };
    return {
      text: "Great to see you! Consistency is key — keep up the momentum.",
      emoji: '🔥',
    };
  }, [profile, topRec]);

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08]"
      style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.06))' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-lg flex-shrink-0">
          {messages.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cyan-400 font-medium mb-1">Mentor Message</p>
          <p className="text-sm text-text leading-relaxed">{messages.text}</p>
          {topRec?.action && (
            <Link to={topRec.action.link} className="inline-block mt-2 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors">
              {topRec.action.label} →
            </Link>
          )}
          {topRec?.reason && (
            <button onClick={() => setShowReason(!showReason)} className="block mt-1.5 text-[10px] text-text3 hover:text-text2 transition-colors">
              {showReason ? '▲ Hide reasoning' : '▼ Why this?'}
            </button>
          )}
          {showReason && topRec && (
            <div className="mt-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] space-y-1">
              {topRec.reason && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-cyan-400">Why:</span> {topRec.reason}</p>}
              {topRec.expectedBenefit && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-green-400">Benefit:</span> {topRec.expectedBenefit}</p>}
              {topRec.estimatedTime && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-yellow-400">Time:</span> {topRec.estimatedTime}</p>}
              {topRec.confidence && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-purple-400">Confidence:</span> {topRec.confidence}%</p>}
              {topRec.source && <p className="text-[10px] text-text4 italic">{topRec.source}</p>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TodayRecommended({ profile, topics, recommendations }) {
  const weakSubject = profile.weakestSubject;
  const weakTopics = useMemo(
    () => topics.filter((t) => {
      if (!weakSubject) return false;
      const sub = t.subject?.name || t.subject || '';
      return sub === weakSubject && !t.progress?.lecture;
    }).slice(0, 3),
    [topics, weakSubject]
  );
  const subjectRec = recommendations?.find(r => r.type === 'weak_subject');

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📚</span>
        <h2 className="text-sm font-bold text-text">Today's Recommended</h2>
      </div>
      {weakTopics.length > 0 ? (
        <div className="space-y-2">
          {weakTopics.map((t, i) => (
            <div key={t._id || i} className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
              <Link to={`/learn/topic/${t._id || t.id}`} className="text-text2 hover:text-primary transition-colors">{t.name}</Link>
            </div>
          ))}
          {subjectRec?.action && (
            <Link to={subjectRec.action.link} className="block text-[10px] text-primary mt-1 hover:underline">
              {subjectRec.action.label} →
            </Link>
          )}
        </div>
      ) : (
        <p className="text-xs text-text3 italic">
          {weakSubject
            ? `Great progress on ${weakSubject}!`
            : 'Complete onboarding to get recommendations.'}
        </p>
      )}
    </motion.div>
  );
}

function TodayRevision({ revisionSchedule }) {
  const due = useMemo(
    () => (revisionSchedule || []).filter((r) => r.status === 'pending' || new Date(r.dueDate) <= new Date()),
    [revisionSchedule]
  );

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔄</span>
        <h2 className="text-sm font-bold text-text">Revision Due</h2>
      </div>
      {due.length > 0 ? (
        <div className="space-y-1.5">
          {due.slice(0, 4).map((r, i) => (
            <div key={r.id || i} className="flex items-center gap-2 text-xs">
              <span className="text-yellow-400">↻</span>
              <span className="text-text2">{r.topicName || r.topic}</span>
            </div>
          ))}
          {due.length > 4 && <p className="text-[10px] text-text3">+{due.length - 4} more</p>}
        </div>
      ) : (
        <p className="text-xs text-text3 italic">No pending revisions. Great job!</p>
      )}
    </motion.div>
  );
}

function ProgressTimeline({ profile, studyStats, gateFeatures, topics, roadmap, studentState }) {
  const readiness = roadmap?.readinessScore || studyStats?.overallProgress || 0;
  const insight = studentState?.analytics?.coachingInsight?.[0];
  const hoursTrend = studentState?.analytics?.hoursTrend;
  const accuracyTrend = studentState?.analytics?.accuracyTrend;
  const topicProgress = topics.length > 0 ? Math.round((topics.filter(t => t.progress?.lecture).length / topics.length) * 100) : 0;
  const stats = [
    { label: 'Readiness', value: readiness, color: '#8b5cf6' },
    { label: 'Streak', value: gateFeatures?.streak?.current || 0, suffix: 'd', color: '#f59e0b' },
    { label: 'Topics', value: topics.filter((t) => t.progress?.lecture).length, total: topics.length, color: '#06b6d4' },
  ];
  const mockStatus = roadmap?.mockReadiness;
  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span>
        <h2 className="text-sm font-bold text-text">Progress Timeline</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const pct = s.total ? Math.round((s.value / s.total) * 100) : Math.min(s.value, 100);
          return (
            <div key={s.label} className="text-center">
              <div className="relative w-full aspect-square max-w-[80px] mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                  <motion.circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={s.color} strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${pct * 0.976} 100`}
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: `${pct * 0.976} 100` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-text font-mono">{s.value}{s.suffix || '%'}</span>
                </div>
              </div>
              <p className="text-[10px] text-text3">{s.label}</p>
            </div>
          );
        })}
      </div>
      {mockStatus && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-text3">Mock Readiness</span>
          <span className={`text-[10px] font-semibold ${mockStatus.color}`}>{mockStatus.label}</span>
        </div>
      )}
      {insight && (
        <div className="mt-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-[10px] text-text3 leading-relaxed">💡 {insight}</p>
        </div>
      )}
      {(hoursTrend || accuracyTrend) && (
        <div className="mt-2 flex gap-3 text-[10px] text-text3">
          {hoursTrend && (
            <span className={hoursTrend.trend === 'increasing' ? 'text-green-400' : hoursTrend.trend === 'decreasing' ? 'text-red-400' : ''}>
              Hours: {hoursTrend.trend === 'increasing' ? '↑' : hoursTrend.trend === 'decreasing' ? '↓' : '→'} {Math.abs(hoursTrend.change || 0)}%
            </span>
          )}
          {accuracyTrend && (
            <span className={accuracyTrend.trend === 'improving' ? 'text-green-400' : accuracyTrend.trend === 'declining' ? 'text-red-400' : ''}>
              Accuracy: {accuracyTrend.trend === 'improving' ? '↑' : accuracyTrend.trend === 'declining' ? '↓' : '→'} {Math.abs(accuracyTrend.change || 0)}%
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function QuickActions({ onOpenChat }) {
  const actions = [
    { label: 'Ask AI Mentor', icon: '🤖', action: 'chat', primary: true },
    { label: 'Study Planner', icon: '📅', action: 'planner' },
    { label: 'Create Plan', icon: '✨', action: 'create-plan' },
    { label: 'Weak Topics', icon: '🎯', action: 'weak-topics' },
  ];

  const handleAction = (a) => {
    if (a.action === 'chat' && typeof onOpenChat === 'function') onOpenChat();
  };

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <h2 className="text-sm font-bold text-text">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.action}
            onClick={() => handleAction(a)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              a.primary
                ? 'bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25'
                : 'bg-white/[0.04] border border-white/[0.08] text-text2 hover:bg-white/[0.08]'
            }`}
          >
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function UpcomingGoal({ profile }) {
  const targetAIR = profile.targetAIR;
  const confidence = profile.confidenceLevel || 5;

  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏆</span>
        <h2 className="text-sm font-bold text-text">Upcoming Goal</h2>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text3">Target AIR</span>
          <span className="text-text font-semibold font-mono">
            {targetAIR === 999999 ? 'Qualify' : `${targetAIR}`}
          </span>
        </div>
        {profile.dreamCollege && (
          <div className="flex justify-between text-xs">
            <span className="text-text3">Dream College</span>
            <span className="text-cyan-400 font-medium">{profile.dreamCollege}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-text3">Confidence</span>
          <span className="text-text font-mono">{confidence}/10</span>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationsCard({ recommendations }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  if (!recommendations?.length) return null;
  return (
    <motion.div variants={item} className="rounded-2xl p-5 border border-white/[0.08] bg-surface/40 backdrop-blur-sm col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h2 className="text-sm font-bold text-text">AI Recommendations</h2>
      </div>
      <div className="space-y-2">
        {recommendations.slice(0, 4).map((rec, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-sm mt-0.5">{rec.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text2 leading-relaxed">{rec.text}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {rec.action && (
                  <Link to={rec.action.link} className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors">
                    {rec.action.label} →
                  </Link>
                )}
                {rec.reason && (
                  <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)} className="text-[10px] text-text3 hover:text-text2 transition-colors">
                    {expandedIdx === i ? '▲ Hide reasoning' : '▼ Why?'}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {expandedIdx === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1.5 space-y-0.5">
                    {rec.reason && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-cyan-400">Why:</span> {rec.reason}</p>}
                    {rec.expectedBenefit && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-green-400">Benefit:</span> {rec.expectedBenefit}</p>}
                    {rec.estimatedTime && <p className="text-[10px] text-text3 leading-relaxed"><span className="text-yellow-400">Time:</span> {rec.estimatedTime}</p>}
                    {rec.confidence && <p className="text-[10px] text-text3"><span className="text-purple-400">Confidence:</span> {rec.confidence}%</p>}
                    {rec.source && <p className="text-[10px] text-text4 italic mt-0.5">{rec.source}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function AiMentorHomepage({ onOpenChat }) {
  const { topics, studyStats, gateFeatures, revisionSchedule } = useProgress();
  const { profile, recommendations, roadmap, notifications, unifiedState } = useAiMentor();
  const topNotif = notifications?.filter(n => !n.read)?.[0];

  return (
    <div className="min-h-screen bg-bg relative">
      <NeuralBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <WelcomeCard profile={profile} studyStats={studyStats} gateFeatures={gateFeatures} roadmap={roadmap} />

          {topNotif && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-3 border border-primary/20 flex items-center gap-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <span className="text-sm">{topNotif.data?.icon || '💡'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text font-medium">{topNotif.data?.title || ''}</p>
                <p className="text-[10px] text-text3">{topNotif.data?.message || ''}</p>
              </div>
              {topNotif.data?.action && (
                <Link to={topNotif.data.action.link} className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-all whitespace-nowrap">
                  {topNotif.data.action.label}
                </Link>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TodaysMission profile={profile} gateFeatures={gateFeatures} />
            <CurrentRoadmap profile={profile} roadmap={roadmap} />
            <MentorMessage profile={profile} recommendations={recommendations} />
            <TodayRecommended profile={profile} topics={topics || []} recommendations={recommendations} />
            <TodayRevision revisionSchedule={revisionSchedule} />
            <QuickActions onOpenChat={onOpenChat} />
            <UpcomingGoal profile={profile} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProgressTimeline profile={profile} studyStats={studyStats} gateFeatures={gateFeatures} topics={topics || []} roadmap={roadmap} studentState={unifiedState} />
            {recommendations?.length > 0 && <RecommendationsCard recommendations={recommendations} />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
