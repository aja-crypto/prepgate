// Analytics: weekly/monthly graphs, accuracy, mock trends, completion forecast
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useProgress } from '../context/ProgressContext';
import {
  buildFinalModePlans,
  buildWeakRecoveryPlans,
  computeConsistencyScore,
  computeRevisionHealth,
  computeStudyPace,
  computeSubjectCompletion,
  computeReadinessScore,
  computeCompletionForecast,
  getSubjectPriorities,
  getSubjectAccuracy,
  predictRankRange,
} from '../utils/gateUtils';
import SubjectCompletionBars from '../components/gate/SubjectCompletionBars';
import StreakTracker from '../components/gate/StreakTracker';
import WeakTopicsPanel from '../components/gate/WeakTopicsPanel';
import AirPredictor from '../components/gate/AirPredictor';

Chart.register(...registerables);

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.05, rootMargin: '200px', ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function ChartContainer({ title, children, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      <div className="text-sm font-semibold text-text mb-3">{title}</div>
      {inView ? children : <div className="relative h-48 bg-bg-2 rounded-lg animate-pulse" />}
    </div>
  );
}

export default function AnalyticsPage() {
  const { studyStats, topics, pyqs, mocks, gateFeatures, revisionSchedule } = useProgress();
  const radarRef = useRef(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);
  const weeklyRef = useRef(null);
  const monthlyRef = useRef(null);
  const accuracyRef = useRef(null);
  const subAccuracyRef = useRef(null);
  const mockTrendRef = useRef(null);
  const charts = useRef({});

  const hasData = (studyStats.subjects || []).length > 0 || topics.length > 0 || pyqs.length > 0 || mocks.length > 0;

  const subjects = useMemo(
    () => computeSubjectCompletion(studyStats.subjects, topics, pyqs),
    [studyStats.subjects, topics, pyqs]
  );

  if (!hasData) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text">Analytics</h1>
          <p className="text-sm text-text3 mt-0.5">Deep insights into your preparation</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10 border border-primary/20">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="text-lg font-bold text-text mb-2">No Analytics Yet</h2>
          <p className="text-sm text-text3 max-w-md mx-auto mb-6 leading-relaxed">
            Complete focus sessions, solve PYQs, and take mock tests to see your progress analytics here. Your data will appear as you study.
          </p>
          <div className="flex justify-center gap-3">
            <a href="/focus" className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-5 py-2.5 rounded-xl border border-primary/20 transition-colors">
              Start Focus Session
            </a>
            <a href="/pyq" className="text-xs font-medium text-text2 bg-bg-2 hover:bg-bg-3 px-5 py-2.5 rounded-xl border border-border transition-colors">
              Practice PYQs
            </a>
            <a href="/mocks" className="text-xs font-medium text-text2 bg-bg-2 hover:bg-bg-3 px-5 py-2.5 rounded-xl border border-border transition-colors">
              Take a Mock
            </a>
          </div>
        </div>
      </div>
    );
  }
  const labels = subjects.map((s) => s?.name?.split(' ')[0] || '');
  const scores = subjects.map((s) => s?.progress ?? 0);
  const readiness = computeReadinessScore(topics, pyqs, mocks, gateFeatures?.streak);
  const forecast = computeCompletionForecast(topics, gateFeatures);
  const priorities = getSubjectPriorities(studyStats.subjects, topics, pyqs);
  const recentScore = mocks.length ? mocks.slice(-3).reduce((sum, m) => sum + (m.score || 0), 0) / Math.min(3, mocks.length) : 0;
  const rankRange = predictRankRange(recentScore || readiness);
  const revisionHealth = computeRevisionHealth(revisionSchedule);
  const consistencyScore = computeConsistencyScore(studyStats, gateFeatures);
  const pace = computeStudyPace(studyStats, topics, gateFeatures);
  const recoveryPlans = buildWeakRecoveryPlans(subjects, topics, pyqs);
  const finalPlans = buildFinalModePlans();

  useEffect(() => {
    const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    const destroy = (key) => { charts.current[key]?.destroy(); };

    if (radarRef.current) {
      destroy('radar');
      charts.current.radar = new Chart(radarRef.current, {
        type: 'radar',
        data: { labels, datasets: [{ label: 'Completion %', data: scores, borderColor: '#4f8dff', backgroundColor: '#4f8dff20', pointBackgroundColor: '#4f8dff', borderWidth: 2 }] },
        options: { ...chartOpts, scales: { r: { min: 0, max: 100, grid: { color: '#ffffff10' }, angleLines: { color: '#ffffff10' }, ticks: { color: '#636b82', font: { size: 9 }, backdropColor: 'transparent' }, pointLabels: { color: '#9ba3b8', font: { size: 8 } } } } },
      });
    }

    if (pieRef.current) {
      destroy('pie');
      charts.current.pie = new Chart(pieRef.current, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: (studyStats.weeklyHours || []), backgroundColor: subjects.map((s) => s.color), borderWidth: 0 }] },
        options: { ...chartOpts, cutout: '65%' },
      });
    }

    if (barRef.current) {
      destroy('bar');
      charts.current.bar = new Chart(barRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ data: scores, backgroundColor: subjects.map((s) => s.color + 'cc'), borderRadius: 4 }] },
        options: { ...chartOpts, scales: { y: { min: 0, max: 100, grid: { color: '#ffffff08' }, ticks: { color: '#636b82', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#636b82', font: { size: 8 } } } } },
      });
    }

    if (weeklyRef.current) {
      destroy('weekly');
      charts.current.weekly = new Chart(weeklyRef.current, {
        type: 'line',
        data: {
          labels: DAY_LABELS,
          datasets: [{ data: (studyStats.weeklyHours || []), borderColor: '#4f8dff', backgroundColor: '#4f8dff20', fill: true, tension: 0.4, pointRadius: 4 }],
        },
        options: { ...chartOpts, scales: { y: { grid: { color: '#ffffff08' }, ticks: { color: '#636b82' } }, x: { grid: { display: false }, ticks: { color: '#636b82' } } } },
      });
    }

    if (monthlyRef.current) {
      destroy('monthly');
      charts.current.monthly = new Chart(monthlyRef.current, {
        type: 'bar',
        data: {
          labels: MONTH_LABELS,
          datasets: [{ data: gateFeatures?.monthlyHours || [38, 42, 45, 40, 48, 42], backgroundColor: '#06d6a0cc', borderRadius: 4 }],
        },
        options: { ...chartOpts, scales: { y: { grid: { color: '#ffffff08' }, ticks: { color: '#636b82' } }, x: { grid: { display: false }, ticks: { color: '#636b82' } } } },
      });
    }

    if (accuracyRef.current) {
      destroy('accuracy');
      charts.current.accuracy = new Chart(accuracyRef.current, {
        type: 'line',
        data: {
          labels: DAY_LABELS,
          datasets: [{ data: gateFeatures?.weeklyAccuracy || [72, 75, 78, 74, 80, 82, 79], borderColor: '#a855f7', backgroundColor: '#a855f720', fill: true, tension: 0.4, pointRadius: 3 }],
        },
        options: { ...chartOpts, scales: { y: { min: 0, max: 100, grid: { color: '#ffffff08' }, ticks: { color: '#636b82' } }, x: { grid: { display: false }, ticks: { color: '#636b82' } } } },
      });
    }

    if (subAccuracyRef.current) {
      destroy('subAccuracy');
      charts.current.subAccuracy = new Chart(subAccuracyRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ data: getSubjectAccuracy(studyStats.subjects, pyqs), backgroundColor: subjects.map(s => s.color + 'aa'), borderRadius: 4 }] },
        options: { ...chartOpts, indexAxis: 'y', scales: { x: { min: 0, max: 100, grid: { color: '#ffffff08' }, ticks: { color: '#636b82' } }, y: { grid: { display: false }, ticks: { color: '#636b82' } } } },
      });
    }

    if (mockTrendRef.current && mocks.length) {
      destroy('mockTrend');
      charts.current.mockTrend = new Chart(mockTrendRef.current, {
        type: 'line',
        data: {
          labels: mocks.map((m) => m.date),
          datasets: [{ data: mocks.map((m) => m.score), borderColor: '#ff9f43', backgroundColor: '#ff9f4320', fill: true, tension: 0.3, pointRadius: 5 }],
        },
        options: { ...chartOpts, scales: { y: { grid: { color: '#ffffff08' }, ticks: { color: '#636b82' } }, x: { grid: { display: false }, ticks: { color: '#636b82', font: { size: 8 } } } } },
      });
    }

    return () => Object.values(charts.current).forEach((c) => c?.destroy());
  }, [subjects, labels, scores, studyStats.weeklyHours, gateFeatures, mocks]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Analytics</h1>
        <p className="text-sm text-text3 mt-0.5">Deep insights into your preparation</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Readiness Score', value: `${readiness}/100`, color: '#4f8dff', tip: readiness >= 70 ? 'Strong preparation' : readiness >= 40 ? 'Needs improvement' : 'Start studying' },
          { label: 'Expected Score', value: Math.round(recentScore || readiness), color: '#06d6a0', tip: 'Based on recent mock tests' },
          { label: 'Expected Rank', value: rankRange.label, color: '#ff9f43', tip: 'Approximate GATE rank range' },
          { label: 'Consistency', value: `${consistencyScore}/100`, color: '#a855f7', tip: consistencyScore >= 70 ? 'Very consistent' : 'Study more regularly' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 group relative">
            <div className="text-lg font-bold font-mono truncate" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{s.label}</div>
            {s.tip && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-[10px] text-text2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{s.tip}</div>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Subject Strength Chart</div>
          <div className="space-y-2">
            {subjects.slice().sort((a, b) => b.progress - a.progress).map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text2">{s.name}</span>
                  <span className="font-mono text-primary">{s.progress}%</span>
                </div>
                <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Revision Health</div>
          <div className="text-3xl font-bold text-primary mb-1">{revisionHealth.label}</div>
          <div className="text-xs text-text3 mb-4">Score: {revisionHealth.score}/100</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-bg-2 rounded-lg p-2"><div className="text-red-400 font-mono">{revisionHealth.missed}</div><div className="text-[9px] text-text3">Missed</div></div>
            <div className="bg-bg-2 rounded-lg p-2"><div className="text-orange-400 font-mono">{revisionHealth.today}</div><div className="text-[9px] text-text3">Today</div></div>
            <div className="bg-bg-2 rounded-lg p-2"><div className="text-blue-400 font-mono">{revisionHealth.upcoming}</div><div className="text-[9px] text-text3">Upcoming</div></div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Study Pace Predictor</div>
          <div className="text-3xl font-bold text-primary mb-1">{pace.hoursPerDay} hrs/day</div>
          <div className="text-xs text-text3">Syllabus completion: <span className="text-text">{pace.completionDate}</span></div>
          <div className="text-xs text-text3 mt-1">Topics left: {forecast.remaining}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Weak Topic Recovery Plan</div>
          <div className="space-y-3">
            {recoveryPlans.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <p className="text-sm text-text3">Complete more topics and PYQs to get personalized recovery plans.</p>
              </div>
            ) : recoveryPlans.map((item) => (
              <div key={`${item.subject}-${item.topic}`} className="bg-bg-2 border border-border rounded-lg p-3">
                <div className="flex justify-between gap-3">
                  <div className="text-sm font-medium text-text">{item.topic}</div>
                  <div className="text-xs font-mono text-orange-400">Accuracy {item.accuracy}%</div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.plan.map((step) => <span key={step} className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">{step}</span>)}
                </div>
                <a href={`/topics`} className="mt-2 inline-block text-[10px] text-primary hover:underline">Study this topic →</a>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Final 100-Day Mode</div>
          <div className="space-y-2">
            {finalPlans.map((plan) => (
              <div key={plan.label} className="bg-bg-2 border border-border rounded-lg p-3">
                <div className="text-sm font-medium text-text">{plan.label}</div>
                <div className="text-xs text-text3 mt-1">{plan.focus}</div>
                <div className="text-[10px] text-primary mt-1">{plan.split}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Weekly Study Graph">
          <div className="relative h-48"><canvas ref={weeklyRef} /></div>
        </ChartContainer>
        <ChartContainer title="Monthly Study Graph">
          <div className="relative h-48"><canvas ref={monthlyRef} /></div>
        </ChartContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Subject Comparison">
          <div className="relative h-48"><canvas ref={barRef} /></div>
        </ChartContainer>
        <ChartContainer title="Accuracy Graph">
          <div className="relative h-48"><canvas ref={accuracyRef} /></div>
        </ChartContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Mock Test Trend">
          <div className="relative h-48"><canvas ref={mockTrendRef} /></div>
        </ChartContainer>
        <ChartContainer title="Time Spent Per Subject">
          <div className="relative h-48"><canvas ref={pieRef} /></div>
        </ChartContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Subject Accuracy" className="">
          <div className="text-[10px] text-text3 uppercase mb-2">PYQ performance by subject</div>
          <div className="h-64">
            <canvas ref={subAccuracyRef} />
          </div>
        </ChartContainer>

        <ChartContainer title="Topic Analysis" className="">
          <div className="text-[10px] text-text3 uppercase mb-2">Mastery across categories</div>
          <div className="h-64">
            <canvas ref={radarRef} />
          </div>
        </ChartContainer>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Subject Priority Suggestions</div>
          <div className="space-y-2">
            {priorities.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary"><path d="M3 12h4l2 3 4-9 3 6h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p className="text-sm text-text3">Start tracking subjects to see priority suggestions.</p>
              </div>
            ) : priorities.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-primary w-4">#{p.priority}</span>
                  <span>{p.icon} {p.name.split(' ').slice(-1)[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] capitalize text-text3">{p.urgency}</span>
                  <span className="font-mono text-text2">{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <StreakTracker days={28} />
        <SubjectCompletionBars showChart />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <WeakTopicsPanel limit={8} />
        <AirPredictor />
      </div>
    </div>
  );
}
