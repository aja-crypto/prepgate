// Premium customizable dashboard with drag-and-drop widgets
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { useDashboard } from '../context/DashboardContext';
import { useLiveData } from '../hooks/useLiveData';
import { computeSubjectCompletion, getDailyTargetProgress, computeReadinessScore } from '../utils/gateUtils';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import DashboardCustomizer from '../components/dashboard/DashboardCustomizer';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
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
import GateApexAIWidget from '../components/gate/GateApexAIWidget';
import GateVaultWidget from '../components/gate/GateVaultWidget';
import NotesHubWidget from '../components/gate/NotesHubWidget';
import RecommendationEngine from '../components/gate/RecommendationEngine';
import ExamTimeline from '../components/gate/ExamTimeline';
import FocusStatsCard from '../components/gate/FocusStatsCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const { studyStats, topics, pyqs, mocks, gateFeatures, gamification, isEmptyProgress, mongoAvailable } = useProgress();
  const { data: liveData, loading: liveLoading, refresh: refreshLive } = useLiveData();
  const { visibleWidgets, editMode, setEditMode } = useDashboard();
  const [customizerOpen, setCustomizerOpen] = useState(false);

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

  const widgetContent = {
    welcome: isEmptyProgress ? <EmptyDashboard userName={user?.name?.split(' ')[0]} /> : null,
    motivation: <DashboardMotivation />,
    announcements: <AnnouncementBar />,
    "gateapex-ai": <GateApexAIWidget />,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Readiness', value: readiness, sub: `${overall}% overall`, color: 'var(--color-primary)' },
          { label: 'Study Today', value: Math.min(100, (dailyProgress.hours / (safeGF.dailyTarget?.hours || 8)) * 100), sub: `${dailyProgress.hours}h / ${safeGF.dailyTarget?.hours || 8}h`, color: 'var(--color-success)', display: `${dailyProgress.hours}h` },
          { label: 'Daily Target', value: dailyProgress.overall, sub: `${dailyProgress.topicsCompleted} topics`, color: 'var(--color-accent)' },
          { label: 'Streak', value: Math.min(100, streakCurrent * 5), sub: `Best ${(safeGF.streak?.longest || 0)}d`, color: 'var(--color-secondary)', display: streakCurrent },
        ].map((s) => (
          <GlassCard key={s.label} className="flex items-center gap-4" glow>
            <ProgressRing value={s.value} size={72} stroke={5} color={s.color} />
            <div>
              <div className="text-2xl font-bold font-mono text-text">{s.display ?? Math.round(s.value)}</div>
              <div className="text-[10px] text-text3 uppercase tracking-wider font-medium">{s.label}</div>
              <div className="text-[11px] text-text2 mt-0.5">{s.sub}</div>
            </div>
          </GlassCard>
        ))}
      </div>
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
    goals: (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DailyTargetCard />
        <StreakTracker />
        <GoalTrackerCard period="weekly" />
        <GoalTrackerCard period="monthly" />
      </div>
    ),
    'weekly-hours': (
      <GlassCard>
        <div className="text-sm font-semibold text-text mb-1">Weekly Study Hours</div>
        <div className="text-[11px] text-text3 mb-4">Daily distribution this week</div>
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
                <span className="text-[9px] text-text3 uppercase font-medium">{d}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    ),
    'pinned-notes': <PinnedNotesWidget />,
    subjects: <SubjectCompletionRings />,
    'ai-mentor': <AIMentorWidget />,
    recommendations: (
      <div className="grid md:grid-cols-2 gap-4">
        <SmartRecommendations />
        <WeakTopicsPanel limit={5} />
      </div>
    ),
    predictions: (
      <div className="grid md:grid-cols-3 gap-4">
        <ScorePredictor />
        <AirPredictor />
        <GamificationPanel gamification={gamification} />
      </div>
    ),
    'focus-stats': <FocusStatsCard />,
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
                {c.met ? '✓' : '×'}
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
  };

  const spanMap = {
    welcome: 'col-span-full',
    motivation: 'col-span-full',
    announcements: 'col-span-full',
    'GateApex-ai': 'col-span-full',
    'gate-vault': 'col-span-full',
    'notes-hub': 'col-span-full',
    'recommendation-engine': 'col-span-full',
    countdown: 'col-span-full',
    stats: 'col-span-full',
    'daily-content': 'col-span-full',
    goals: 'col-span-full',
    'weekly-hours': 'col-span-full',
    'pinned-notes': 'col-span-full',
    'ai-mentor': 'col-span-full',
    subjects: 'col-span-full',
    recommendations: 'col-span-full',
    predictions: 'col-span-full',
    'focus-stats': 'col-span-1',
    'action-center': 'col-span-1',
    'today-plan': 'col-span-1',
    'success-hub': 'col-span-1',
    'revision-schedule': 'col-span-1',
    'progress-heatmap': 'col-span-1',
    'live-news': 'col-span-1',
    'exam-schedule': 'col-span-1',
    'exam-timeline': 'col-span-1',
    recruitment: 'col-span-1',
    trending: 'col-span-1',
    analysis: 'col-span-1',
    resources: 'col-span-1',
  };

  const pairedRow = ['live-news', 'exam-schedule', 'exam-timeline', 'recruitment', 'trending', 'analysis', 'resources'];

  const rendered = [];
  let i = 0;
  const widgets = visibleWidgets.filter((w) => {
    if (w.id === 'welcome' && !isEmptyProgress) return false;
    return widgetContent[w.id] != null;
  });

  while (i < widgets.length) {
    const w = widgets[i];
    const next = widgets[i + 1];
    if (pairedRow.includes(w.id) && next && pairedRow.includes(next.id)) {
      rendered.push(
        <div key={`row-${w.id}`} className="grid md:grid-cols-2 gap-4 col-span-full">
          <DashboardWidget id={w.id}>{widgetContent[w.id]}</DashboardWidget>
          <DashboardWidget id={next.id}>{widgetContent[next.id]}</DashboardWidget>
        </div>
      );
      i += 2;
    } else {
      rendered.push(
        <DashboardWidget key={w.id} id={w.id} span={spanMap[w.id] || 'col-span-full'}>
          {widgetContent[w.id]}
        </DashboardWidget>
      );
      i += 1;
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Overview</p>
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
          <p className="text-sm text-text3 mt-1">Your preparation command center</p>
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

      {editMode && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary animate-fade-in">
          Edit mode — drag widgets to reorder. Use &quot;Widgets&quot; to show or hide sections.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rendered}
      </div>

      {liveData?.lastUpdated && (
        <p className="text-center text-[10px] text-text3 mt-8">
          Live data · {new Date(liveData.lastUpdated).toLocaleString('en-IN')}
          {liveLoading && ' · Updating...'}
        </p>
      )}

      <DashboardCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
    </div>
  );
}

