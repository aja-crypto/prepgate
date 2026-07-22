import { memo, useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';

const StatCard = memo(function StatCard({ label, value, sub, color, display }) {
  return (
    <GlassCard className="flex items-center gap-4" glow>
      <ProgressRing value={value} size={72} stroke={5} color={color} />
      <div>
        <div className="text-2xl font-bold font-mono text-text">{display ?? Math.round(value)}</div>
        <div className="text-[10px] text-text3 uppercase tracking-wider font-medium">{label}</div>
        <div className="text-[11px] text-text2 mt-0.5">{sub}</div>
      </div>
    </GlassCard>
  );
});

const StatsGrid = memo(function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => <StatCard key={s.label} {...s} />)}
    </div>
  );
});

const GoalsRow = memo(function GoalsRow() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DailyTargetCard />
      <StreakTracker />
      <GoalTrackerCard period="weekly" />
      <GoalTrackerCard period="monthly" />
    </div>
  );
});

const RecommendationsRow = memo(function RecommendationsRow({ limit = 5 }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SmartRecommendations />
      <WeakTopicsPanel limit={limit} />
    </div>
  );
});

const PredictionsRow = memo(function PredictionsRow({ gamification }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <ScorePredictor />
      <AirPredictor />
      <GamificationPanel gamification={gamification} />
    </div>
  );
});
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { useDashboard } from '../context/DashboardContext';
import { useLiveData } from '../hooks/useLiveData';
import StartGuide from '../components/dashboard/StartGuide';
import { computeSubjectCompletion, getDailyTargetProgress, computeReadinessScore, predictRankRange } from '../utils/gateUtils';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import DashboardCustomizer from '../components/dashboard/DashboardCustomizer';
import OfficialCountdown from '../components/gate/OfficialCountdown';
import LiveNewsFeed from '../components/gate/LiveNewsFeed';
import ExamScheduleCard from '../components/gate/ExamScheduleCard';
import DailyContentCards from '../components/gate/DailyContentCards';
import RecruitmentFeed from '../components/gate/RecruitmentFeed';
import TopicAnalysisPanel from '../components/gate/TopicAnalysisPanel';
import TrendingPanel from '../components/gate/TrendingPanel';
import ResourcesFeed from '../components/gate/ResourcesFeed';
import DailyTargetCard from '../components/gate/DailyTargetCard';
import SubjectCompletionRings from '../components/gate/SubjectCompletionRings';
import StreakTracker from '../components/gate/StreakTracker';
import WeakTopicsPanel from '../components/gate/WeakTopicsPanel';
import AirPredictor from '../components/gate/AirPredictor';
import GamificationPanel from '../components/gate/GamificationPanel';
import GoalTrackerCard from '../components/gate/GoalTrackerCard';
import ScorePredictor from '../components/gate/ScorePredictor';
import SmartRecommendations from '../components/gate/SmartRecommendations';
import AIMentorWidget from '../components/gate/AIMentorWidget';
import PinnedNotesWidget from '../components/gate/PinnedNotesWidget';
import EmptyDashboard from '../components/gate/EmptyDashboard';
import DashboardMotivation from '../components/gate/DashboardMotivation';
import AnnouncementBar from '../components/gate/AnnouncementBar';
import GateNexaAIWidget from '../components/gate/GateNexaAIWidget';
import GateVaultWidget from '../components/gate/GateVaultWidget';
import NotesHubWidget from '../components/gate/NotesHubWidget';
import RecommendationEngine from '../components/gate/RecommendationEngine';
import ExamTimeline from '../components/gate/ExamTimeline';
import FocusStatsCard from '../components/gate/FocusStatsCard';
import DailyMissions from '../components/gamification/DailyMissions';
import DailyInspiration from '../components/common/DailyInspiration';
import ReferralCard from '../components/referral/ReferralCard';

const FOCUS_STORAGE_KEY = 'gatenexa_focus_session';

const DASHBOARD_SECTIONS = [
  {
    id: 'hero',
    label: null,
    desc: null,
    gridCols: 'grid-cols-1 lg:grid-cols-3',
    widgets: ['motivation', 'countdown', 'today-plan', 'stats', 'referral'],
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    desc: 'Your daily preparation command center',
    gridCols: 'grid-cols-2 md:grid-cols-4',
    widgets: ['gatenexa-ai', 'recommendation-engine', 'focus-stats', 'daily-missions', 'revision-schedule'],
  },
  {
    id: 'command-center',
    label: 'Study Command Center',
    desc: 'Subject mastery, goals, and study patterns',
    gridCols: 'grid-cols-1 lg:grid-cols-2',
    widgets: ['subjects', 'goals', 'weekly-hours', 'progress-heatmap', 'recommendations'],
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    desc: 'Score predictions, topic analysis, and readiness',
    gridCols: 'grid-cols-1 lg:grid-cols-3',
    widgets: ['predictions', 'analysis', 'success-hub', 'action-center'],
  },
  {
    id: 'resources',
    label: 'Resources',
    desc: 'Your notes, vault, and daily study materials',
    gridCols: 'grid-cols-1 lg:grid-cols-2',
    widgets: ['notes-hub', 'gate-vault', 'pinned-notes', 'daily-content'],
  },
  {
    id: 'live',
    label: 'Live Information',
    desc: 'GATE news, PSU recruitment & exam updates',
    gridCols: 'grid-cols-1 lg:grid-cols-2',
    widgets: ['live-news', 'recruitment', 'trending', 'exam-schedule', 'exam-timeline'],
  },
  {
    id: 'system',
    label: 'System',
    desc: 'Platform updates and resources',
    gridCols: 'grid-cols-1',
    widgets: ['announcements', 'resources'],
  },
];

const SECTION_ICONS = {
  'quick-actions': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>,
  'command-center': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 12.87z"/><path d="M3.196 8.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 8.87z"/><path d="M10.38 1.103a.75.75 0 00-.76 0l-7.25 4.25a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.76 0l7.25-4.25a.75.75 0 000-1.294l-7.25-4.25z"/></svg>,
  'ai-insights': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 1a4.5 4.5 0 00-4.5 4.5v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 6V5.5a3 3 0 10-6 0V7h6z"/></svg>,
  'resources': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>,
  'live': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.43 2.524A10.004 10.004 0 0110 0c2.955 0 5.62 1.278 7.432 3.31a.75.75 0 11-1.119.998A8.504 8.504 0 0010 1.5a8.5 8.5 0 00-6.313 2.808.75.75 0 01-1.119-.998.754.754 0 01-.138-.786zM5.55 5.359a.75.75 0 01.94-.218A5.48 5.48 0 0110 4.5c1.46 0 2.788.57 3.77 1.5a.75.75 0 01-1.04 1.082A3.98 3.98 0 0010 6a3.99 3.99 0 00-2.73 1.082.75.75 0 01-1.041-1.082.748.748 0 01-.679-.641zM6.5 9.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75zm3.5 0a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 9.5zm3.5 0a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75z"/></svg>,
  'system': <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
};

function getInterruptedSession() {
  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.isActive && !data.isPaused) return null;
    if (data.mode !== 'work') return null;
    if (data.endTime && Date.now() > data.endTime) return null;
    return data;
  } catch { return null; }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { studyStats, topics, pyqs, mocks, gateFeatures, gamification, isEmptyProgress, mongoAvailable } = useProgress();
  const { data: liveData, loading: liveLoading, refresh: refreshLive } = useLiveData();
  const { visibleWidgets, editMode, setEditMode } = useDashboard();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [interruptedSession, setInterruptedSession] = useState(null);

  useEffect(() => {
    setInterruptedSession(getInterruptedSession());
  }, []);

  const safeSS = studyStats || {};
  const safeGF = gateFeatures || {};
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  const safeMocks = mocks || [];

  const subjects = useMemo(
    () => computeSubjectCompletion(safeSS.subjects || [], safeTopics, safePyqs),
    [safeSS.subjects, safeTopics, safePyqs]
  );
  const overall = Math.round(subjects.reduce((s, x) => s + x.progress, 0) / (subjects.length || 1));
  const dailyProgress = getDailyTargetProgress(safeGF.dailyTarget, safeGF.todayProgress);
  const { current: streakCurrent = 0 } = safeGF.streak || {};
  const readiness = computeReadinessScore(safeTopics, safePyqs, safeMocks, safeGF.streak);
  const avgMock = useMemo(() => { if (!safeMocks?.length) return 0; return Math.round(safeMocks.reduce((a, m) => a + (m.score || 0), 0) / safeMocks.length); }, [safeMocks]);
  const weakestSubject = useMemo(() => [...subjects].sort((a, b) => a.progress - b.progress)[0], [subjects]);

  const widgetContent = useMemo(() => ({
    welcome: isEmptyProgress ? <EmptyDashboard userName={user?.name?.split(' ')[0]} /> : null,
    referral: <ReferralCard />,
    motivation: <DashboardMotivation />,
    announcements: <AnnouncementBar />,
    "gatenexa-ai": <GateNexaAIWidget />,
    "gate-vault": <GateVaultWidget />,
    "notes-hub": <NotesHubWidget />,
    "recommendation-engine": <RecommendationEngine />,
    "exam-timeline": <ExamTimeline />,
    "daily-ai": (
      <GlassCard className="p-4 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => {
        const target = document.getElementById('topic-practice');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              💡
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text mb-0.5">What should I study today</h3>
              <p className="text-xs text-text2">Get personalized AI recommendation based on your progress</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text3" />
          </div>
      </GlassCard>
    ),
    countdown: (
      <OfficialCountdown
        examDate={liveData?.examDate || safeGF.examDate}
        schedule={liveData?.schedule || []}
      />
    ),
    stats: (
      <StatsGrid stats={
        isEmptyProgress ? [
          { label: 'Readiness', value: 0, sub: 'No study data yet', color: 'var(--color-primary)', display: '—' },
          { label: 'Study Today', value: 0, sub: 'No study activity yet', color: 'var(--color-success)', display: '0h' },
          { label: 'Daily Target', value: 0, sub: 'Set your first goal', color: 'var(--color-accent)', display: '—' },
          { label: 'Streak', value: 0, sub: 'Begin your journey', color: 'var(--color-secondary)', display: '0' },
        ] : [
          { label: 'Readiness', value: readiness, sub: `${overall}% overall`, color: 'var(--color-primary)' },
          { label: 'Study Today', value: Math.min(100, (dailyProgress.hours / (safeGF.dailyTarget?.hours || 8)) * 100), sub: `${dailyProgress.hours}h / ${safeGF.dailyTarget?.hours || 8}h`, color: 'var(--color-success)', display: `${dailyProgress.hours}h` },
          { label: 'Daily Target', value: dailyProgress.overall, sub: `${dailyProgress.topicsCompleted} topics`, color: 'var(--color-accent)' },
          { label: 'Streak', value: Math.min(100, streakCurrent * 5), sub: `Best ${(safeGF.streak?.longest || 0)}d`, color: 'var(--color-secondary)', display: streakCurrent },
        ]
      } />
    ),
    'live-news': (
      <LiveNewsFeed 
        announcements={liveData?.announcements || []} 
        rssFeed={liveData?.rssFeed || []} 
        lastUpdated={liveData?.lastUpdated}
        onRefresh={refreshLive}
        loading={liveLoading}
      />
    ),
    'exam-schedule': <ExamScheduleCard schedule={liveData?.schedule || []} examDate={liveData?.examDate} />,
    'daily-content': <DailyContentCards dailyContent={liveData?.dailyContent || []} />,
    recruitment: (
      <RecruitmentFeed
        psuRecruitments={liveData?.psuRecruitments || []}
        mtechAdmissions={liveData?.mtechAdmissions || []}
        internships={liveData?.internships || []}
      />
    ),
    trending: <TrendingPanel trending={liveData?.trending || {}} />,
    analysis: <TopicAnalysisPanel analyses={liveData?.analyses || {}} />,
    resources: (
      <ResourcesFeed
        studyMaterials={liveData?.studyMaterials || []}
        placementResources={liveData?.placementResources || []}
      />
    ),
    goals: (<GoalsRow />),
    'weekly-hours': (
      <GlassCard>
        <div className="text-sm font-semibold text-text mb-1">Weekly Study Hours</div>
        <div className="text-[11px] text-text3 mb-4">Daily distribution this week</div>
        {isEmptyProgress || !safeSS.weeklyHours?.some(h => h > 0) ? (
          <div className="flex flex-col items-center justify-center h-32 text-text3">
            <p className="text-xs">No study history yet.</p>
            <p className="text-[10px] mt-1">Complete your first study session to see progress.</p>
          </div>
        ) : (
        <div className="flex items-end gap-2 h-32">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
            const weeklyHours = safeSS.weeklyHours || [];
            const h = weeklyHours[i] || 0;
            const maxH = Math.max(...weeklyHours, 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono text-text2">{h}h</span>
                <div
                  className="w-full rounded-lg transition-all duration-500"
                  style={{
                    height: `${Math.max(8, (h / maxH) * 100)}%`,
                    background: `linear-gradient(180deg, var(--color-primary), var(--color-secondary))`,
                    opacity: h > 0 ? 1 : 0.2,
                  }}
                />
                <span className="text-[10px] sm:text-[11px] text-text3 uppercase font-medium">{d}</span>
              </div>
            );
          })}
        </div>
        )}
      </GlassCard>
    ),
    'pinned-notes': <PinnedNotesWidget />,
    subjects: <SubjectCompletionRings />,
    'ai-mentor': <AIMentorWidget />,
    recommendations: (<RecommendationsRow limit={5} />),
    predictions: (<PredictionsRow gamification={gamification} />),
    'focus-stats': <FocusStatsCard />,
    'daily-missions': <DailyMissions
      todayHours={dailyProgress.hours}
      pyqsSolved={safePyqs.filter(p => p.solved).length}
      mocksTaken={safeMocks.length}
      topicsRevised={dailyProgress.topicsCompleted}
      focusSessions={[]}
    />,
    'action-center': (
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))' }}>🎯</div>
          <div>
            <h3 className="text-sm font-bold text-text">Am I Ready for GATE?</h3>
            <p className="text-[10px] text-text3">Based on {overall}% overall progress</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Subject Coverage', met: overall >= 60 },
            { label: 'Mock Tests Attempted', met: safeMocks.length >= 5 },
            { label: 'PYQs Solved', met: safePyqs.filter(p => p.solved).length >= 100 },
            { label: 'Study Streak', met: streakCurrent >= 7 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${c.met ? 'bg-success/20 text-success' : 'bg-bg-3 text-text3'}`}>
                {c.met ? '\u2713' : '\u00d7'}
              </span>
              <span className="text-text2">{c.label}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    ),
    'today-plan': (
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, rgba(79,143,255,0.2), rgba(6,214,160,0.15))' }}>📋</div>
          <div>
            <h3 className="text-sm font-bold text-text">Today&apos;s Plan</h3>
            <p className="text-[10px] text-text3">{dailyProgress.hours}h studied · {dailyProgress.topicsCompleted} topics done</p>
          </div>
        </div>
        <Link to="/topics" className="text-xs text-primary hover:underline">Open study planner →</Link>
      </GlassCard>
    ),
    'success-hub': (
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))' }}>🏆</div>
          <div>
            <h3 className="text-sm font-bold text-text">Success Hub</h3>
            <p className="text-[10px] text-text3">Roadmaps, topper advice & more</p>
          </div>
        </div>
        <Link to="/success-hub" className="text-xs text-primary hover:underline">Explore resources →</Link>
      </GlassCard>
    ),
    'revision-schedule': (
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.15))' }}>🔄</div>
          <div>
            <h3 className="text-sm font-bold text-text">Revision Schedule</h3>
            <p className="text-[10px] text-text3">Topics due for revision</p>
          </div>
        </div>
        <Link to="/revision" className="text-xs text-primary hover:underline">View revision plan →</Link>
      </GlassCard>
    ),
    'progress-heatmap': (
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))' }}>📊</div>
          <div>
            <h3 className="text-sm font-bold text-text">Progress Heatmap</h3>
            <p className="text-[10px] text-text3">Study activity over time</p>
          </div>
        </div>
        <Link to="/analytics" className="text-xs text-primary hover:underline">View full analytics →</Link>
      </GlassCard>
    ),
  }), [isEmptyProgress, user, liveData, safeGF, readiness, overall, dailyProgress, streakCurrent, safeSS, safeTopics, safeGF.dailyTarget, safeGF.streak, safeGF.examDate, safePyqs, safeMocks, gamification]);

  const spanMap = {
    'motivation': 'col-span-full',
    'countdown': 'col-span-full lg:col-span-2',
    'today-plan': 'col-span-full lg:col-span-1',
    'stats': 'col-span-full',

    'gatenexa-ai': '',
    'recommendation-engine': '',
    'focus-stats': '',
    'daily-missions': '',
    'revision-schedule': '',

    'subjects': 'col-span-full',
    'goals': 'col-span-full',
    'weekly-hours': 'col-span-1',
    'progress-heatmap': 'col-span-1',
    'recommendations': 'col-span-full',

    'predictions': 'col-span-full',
    'analysis': 'col-span-1',
    'success-hub': 'col-span-1',
    'action-center': 'col-span-1',

    'notes-hub': 'col-span-full',
    'gate-vault': 'col-span-full',
    'pinned-notes': 'col-span-1',
    'daily-content': 'col-span-1',

    'live-news': 'col-span-full',
    'recruitment': 'col-span-1',
    'trending': 'col-span-1',
    'exam-schedule': 'col-span-1',
    'exam-timeline': 'col-span-1',

    'announcements': '',
    'resources': '',
  };

  const renderedSections = useMemo(() => {
    const visibleIds = new Set(
      visibleWidgets
        .filter((w) => {
          if (w.id === 'welcome' && !isEmptyProgress) return false;
          return widgetContent[w.id] != null;
        })
        .map((w) => w.id)
    );

    const hasWelcome = visibleIds.has('welcome') && widgetContent.welcome != null;

    const sections = DASHBOARD_SECTIONS.map((section, sIdx) => {
      const sectionWidgetIds = section.widgets.filter((id) => visibleIds.has(id));
      if (sectionWidgetIds.length === 0) return null;

      return (
        <motion.section
          key={section.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: sIdx * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {section.label && (
            <div className="flex items-center gap-3 mb-3 group">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))' }}
              >
                <span className="text-primary">{SECTION_ICONS[section.id]}</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-text tracking-tight">{section.label}</h2>
                <p className="text-[11px] text-text3/70 mt-0.5">{section.desc}</p>
              </div>
            </div>
          )}
          <div className={`grid ${section.gridCols} gap-3`}>
            {sectionWidgetIds.map((id) => (
              <DashboardWidget key={id} id={id} span={spanMap[id] || ''}>
                {widgetContent[id]}
              </DashboardWidget>
            ))}
          </div>
        </motion.section>
      );
    }).filter(Boolean);

    if (hasWelcome) {
      sections.unshift(
        <motion.section key="welcome-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="grid grid-cols-1 gap-4">
            <DashboardWidget id="welcome" span="col-span-full">
              {widgetContent.welcome}
            </DashboardWidget>
          </div>
        </motion.section>
      );
    }

    return sections;
  }, [visibleWidgets, widgetContent, isEmptyProgress]);

  return (
    <div className="relative min-h-screen">
      {/* Background glow — premium AI command center atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(139,92,246,0.04) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(34,211,238,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.02) 0%, transparent 60%)
          `,
        }}
      />

      {/* ═══ MOBILE DASHBOARD ═══ */}
      <div className="sm:hidden space-y-3 px-3 pb-24">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
              {isPremium ? '⭐ PREMIUM' : 'BASIC'}
            </p>
            <h1 className="text-lg font-bold text-text">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings" className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text2"><circle cx="10" cy="10" r="5" /><path d="M10 1v2M10 17v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 10h2M17 10h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" /></svg>
            </Link>
          </div>
        </div>

        {/* Streak + Study Hours + Next Test */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/analytics" className="mobile-card-glass flex items-center gap-2 p-3">
            <span className="text-xl">{streakCurrent > 0 ? '🔥' : '✨'}</span>
            <div>
              <div className="text-sm font-bold text-text">{streakCurrent > 0 ? `Day ${streakCurrent}` : 'Start Today'}</div>
              <div className="text-[9px] text-text3">{streakCurrent > 0 ? `${streakCurrent}d streak` : 'Begin your streak'}</div>
            </div>
          </Link>
          <Link to="/focus" className="mobile-card-glass flex items-center gap-2 p-3">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="text-sm font-bold text-text">{(safeSS.weeklyHours || []).reduce((a,b)=>a+b, 0)}h</div>
              <div className="text-[9px] text-text3">This week</div>
            </div>
          </Link>
        </div>

        {/* Weak Subjects */}
        <div>
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.12em] mb-1.5 px-0.5">📚 Weak Subjects</div>
          <div className="mobile-carousel">
            {subjects.filter(s => s.progress < 60).slice(0, 5).map(s => (
              <Link key={s.id || s.name} to="/subjects" className="mobile-carousel-card" style={{ width: 140 }}>
                <div className="text-[11px] font-semibold text-text">{s.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.progress || 0}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                  </div>
                  <span className="text-[9px] text-text3">{Math.round(s.progress || 0)}%</span>
                </div>
              </Link>
            ))}
            {subjects.filter(s => s.progress < 60).length === 0 && (
              <div className="mobile-carousel-card" style={{ width: 140 }}>
                <div className="text-[11px] text-text3">All subjects on track! 🎉</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.12em] mb-1.5 px-0.5">⚡ Quick Actions</div>
          <div className="mobile-quick-actions">
            {[
              { icon: '📝', label: 'PYQs', to: '/pyq' },
              { icon: '📚', label: 'Study', to: '/study-hub' },
              { icon: '🤖', label: 'AI Mentor', to: '/mentor' },
              { icon: '📊', label: 'Analytics', to: '/analytics' },
            ].map(a => (
              <Link key={a.label} to={a.to} className="mobile-quick-action">
                <span className="text-lg">{a.icon}</span>
                <span className="text-[8px] font-semibold text-text2">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity / Continue */}
        <div className="mobile-card-glass p-3">
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.12em] mb-2">📈 Continue Studying</div>
          <div className="space-y-1.5">
            {safePyqs.filter(p => !p.solved).slice(0, 3).map(p => (
              <Link key={p._id} to="/pyq" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px]">📝</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-text truncate">{p.title || p.question?.substring(0, 40)}</div>
                  <div className="text-[8px] text-text3">{p.subject} · {p.year || 'PYQ'}</div>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-text3"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </Link>
            ))}
            {(!safePyqs || safePyqs.length === 0) && (
              <div className="text-[11px] text-text3 text-center py-3">No pending PYQs. Great job! 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DESKTOP DASHBOARD (unchanged) ═══ */}
      <div className="hidden sm:block relative">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">AI Command Center</p>
              {isPremium ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 ml-1">
                  ⭐ PREMIUM
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 ml-1">
                  BASIC
                </span>
              )}
              {!mongoAvailable && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-widest">
                  Local Mode
                </span>
              )}
              {mongoAvailable && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase tracking-widest">
                  Cloud Synced
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-text tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-text3/70 mt-1">Your preparation command center</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={refreshLive} className="btn-ghost text-xs">↻ Refresh</button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`text-xs px-4 py-2 rounded-xl border transition-all ${editMode ? 'bg-primary/15 border-primary/30 text-primary' : 'btn-ghost'}`}
            >
              {editMode ? 'Done editing' : 'Customize'}
            </button>
            <button onClick={() => setCustomizerOpen(true)} className="btn-ghost text-xs">Widgets</button>
            <Link to="/planner" className="btn-primary text-xs">Planner</Link>
          </div>
        </div>

        {/* ── Start Guide — for first-time / confused aspirants ── */}
        <StartGuide isEmptyProgress={isEmptyProgress} />

        {editMode && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary animate-fade-in">
            Edit mode — drag widgets to reorder. Use &quot;Widgets&quot; to show or hide sections.
          </div>
        )}

        {/* ── Interrupted Session Reminder ── */}
        {interruptedSession && (
          <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/8 p-3 sm:p-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-2xl">⏳</div>
                <div>
                  <div className="text-sm font-bold text-text">Unfinished Focus Session</div>
                  <div className="text-[11px] text-text3">
                    {interruptedSession.currentSubject
                      ? `You were studying ${interruptedSession.currentSubject}`
                      : 'You have an interrupted session'}
                  </div>
                </div>
              </div>
              <div className="sm:ml-auto flex gap-2">
                <button
                  onClick={() => { navigate('/focus'); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
                >
                  Continue Session
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(FOCUS_STORAGE_KEY);
                    setInterruptedSession(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text3 border border-border hover:bg-bg-2 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── COMEBACK SECTION — The reason to return tomorrow ── */}
        <div className="mb-4 relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.03))', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Subtle glow */}
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent)' }} />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent)' }} />

          <div className="relative p-4 space-y-4">
            {/* Row 1: Streak + Today's Goal + AIR Snapshot + Weekly Trend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 🔥 Streak */}
              <Link to="/analytics" className="rounded-xl p-3 flex items-center gap-3 transition-all hover:scale-[1.02]" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="text-2xl">{streakCurrent > 0 ? '🔥' : '✨'}</div>
                <div>
                  <div className="text-lg font-bold text-text">{streakCurrent > 0 ? `Day ${streakCurrent}` : 'Start Today'}</div>
                  <div className="text-[9px] text-text3 uppercase tracking-wider">
                    {streakCurrent > 0 ? `${streakCurrent}d streak · Best ${safeGF.streak?.longest || 0}d` : 'Begin your streak'}
                  </div>
                  <div className="text-[9px] text-primary mt-0.5">
                    {streakCurrent > 0
                      ? streakCurrent < 7 ? `${7 - streakCurrent} more days to 1 week!` : streakCurrent < 30 ? `${30 - streakCurrent} more days to 1 month!` : 'Unstoppable!'
                      : 'Tomorrow is day 1 →'}
                  </div>
                </div>
              </Link>

              {/* 📊 Today's Goal */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-text2">Today's Goal</span>
                  <span className="text-xs font-bold text-text">
                    {dailyProgress?.hours || 0}h / {gateFeatures?.dailyTarget?.hours || 2}h
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${Math.min(100, ((dailyProgress?.hours || 0) / (gateFeatures?.dailyTarget?.hours || 2)) * 100)}%`,
                    background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                  }} />
                </div>
                <div className="flex justify-between text-[9px] text-text3">
                  <span>{dailyProgress.topicsCompleted || 0} topics done</span>
                  <span>{overall}% overall</span>
                </div>
              </div>

              {/* 🏆 AIR Snapshot */}
              <Link to="/opportunity-predictor" className="rounded-xl p-3 transition-all hover:scale-[1.02]" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <div className="text-sm font-bold text-text font-mono">
                      {avgMock > 0 ? `AIR ~${predictRankRange ? predictRankRange(avgMock)?.label || '—' : '—'}` : '—'}
                    </div>
                    <div className="text-[9px] text-text3 uppercase tracking-wider">Est. AIR from mocks</div>
                    <div className="text-[9px] text-green-400 mt-0.5">
                      {safeMocks.length > 0 ? `Avg ${avgMock}% · ${safeMocks.length} mocks` : 'Take a mock to predict'}
                    </div>
                  </div>
                </div>
              </Link>

              {/* 📈 Weekly Progress */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <div>
                    <div className="text-sm font-bold text-text">{readiness}%</div>
                    <div className="text-[9px] text-text3 uppercase tracking-wider">Readiness Score</div>
                    <div className="text-[9px] text-orange-400 mt-0.5">
                      {readiness < 30 ? 'Building foundation' : readiness < 60 ? 'Gaining momentum' : readiness < 80 ? 'Strong progress' : 'Almost ready!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: AI Suggestion of the Day */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}>
                  💡
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Suggestion</span>
                  <p className="text-xs text-text2 mt-0.5">
                    {weakestSubject
                      ? `Focus on ${weakestSubject.name} (${Math.round(weakestSubject.progress)}%). Improve this and see your readiness jump.`
                      : subjects.length > 0
                        ? `Great start! Complete PYQs to build momentum.`
                        : `Start exploring subjects to build your study plan.`}
                  </p>
                </div>
                <Link to="/mentor" className="text-[10px] text-primary hover:underline whitespace-nowrap">Ask AI →</Link>
              </div>
            </div>

            {/* Row 3: Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link to={subjects.some(s => s.progress < 50) ? '/subjects' : '/pyq'}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all hover:scale-[1.02] text-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                {subjects.some(s => s.progress < 50) ? '🎯 Review Weak Subjects' : '📝 Practice PYQs'}
              </Link>
              <Link to="/revision"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] text-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                🔄 Revision ({safePyqs.filter(p => p.revisionNeeded).length || 0})
              </Link>
              <Link to="/mocks"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] text-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                📝 Mock Tests ({safeMocks.length})
              </Link>
              <Link to="/opportunity-predictor"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] text-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                🏆 Predict AIR
              </Link>
            </div>
          </div>
        </div>

        {/* ── Message of the day — Why come back tomorrow ── */}
        <div className="text-center mb-6">
          <p className="text-[11px] text-text3/60 italic">
            {streakCurrent > 0
              ? `Day ${streakCurrent} — you're building something real. Come back tomorrow and make it ${streakCurrent + 1}.`
              : 'Every topper started with Day 1. Today is yours.'}
          </p>
        </div>

        {/* ── Widget Sections ── */}
        <div className="space-y-4 mt-6">
          {renderedSections}
        </div>

        {/* ── Meet the Creator ── */}
        <div className="glass-card p-4 sm:p-5 mt-6 flex flex-col sm:flex-row sm:items-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))' }}>
              {'\uD83D\uDC68\u200D\uD83D\uDCBB'}
            </div>
            <div className="sm:hidden">
              <div className="text-sm font-bold text-text">{'\uD83D\uDC68\u200D\uD83D\uDCBB'} Meet the Creator</div>
              <div className="text-[11px] text-text2/80 mt-0.5">Curious about who built GateNexa?</div>
            </div>
          </div>
          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="text-sm font-bold text-text">{'\uD83D\uDC68\u200D\uD83D\uDCBB'} Meet the Creator</div>
            <div className="text-[11px] text-text2/80 mt-0.5">Curious about who built GateNexa? Learn the story, vision, and mission behind the platform.</div>
          </div>
          <Link
            to="/about"
            className="relative group/shimmer w-full sm:w-auto text-center px-5 py-2.5 rounded-full text-xs font-bold text-[#1A1A2E] transition-all duration-250 hover:-translate-y-0.5 active:scale-[0.97] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFD54F, #F9A825)',
              boxShadow: '0 0 20px rgba(255,213,79,0.25), 0 0 40px rgba(249,168,37,0.1)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {'\uD83D\uDFE1'} Meet the Creator
              <span className="inline-block transition-transform duration-250 group-hover/shimmer:translate-x-1">{'\u2192'}</span>
            </span>
            <span
              className="absolute inset-0 pointer-events-none animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </Link>
        </div>

        {liveData?.lastUpdated && (
          <p className="text-center text-[10px] text-text3 mt-6">
            Live data · {new Date(liveData.lastUpdated).toLocaleString('en-IN')}
            {liveLoading && ' · Updating...'}
          </p>
        )}

        <DashboardCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
      </div>
    </div>
  );
}
