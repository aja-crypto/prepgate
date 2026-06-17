// Analytics: weekly/monthly graphs, accuracy, mock trends, completion forecast
import { useEffect, useRef, useMemo } from 'react';
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

  const subjects = useMemo(
    () => computeSubjectCompletion(studyStats.subjects, topics, pyqs),
    [studyStats.subjects, topics, pyqs]
  );
  const labels = subjects.map((s) => s.name.split(' ')[0]);
  const scores = subjects.map((s) => s.progress);
  const readiness = computeReadinessScore(topics, pyqs, mocks, gateFeatures.streak);
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
        data: { labels, datasets: [{ data: studyStats.weeklyHours, backgroundColor: subjects.map((s) => s.color), borderWidth: 0 }] },
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
          datasets: [{ data: studyStats.weeklyHours, borderColor: '#4f8dff', backgroundColor: '#4f8dff20', fill: true, tension: 0.4, pointRadius: 4 }],
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
          datasets: [{ data: gateFeatures.monthlyHours || [38, 42, 45, 40, 48, 42], backgroundColor: '#06d6a0cc', borderRadius: 4 }],
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
          datasets: [{ data: gateFeatures.weeklyAccuracy || [72, 75, 78, 74, 80, 82, 79], borderColor: '#a855f7', backgroundColor: '#a855f720', fill: true, tension: 0.4, pointRadius: 3 }],
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
          { label: 'Readiness Score', value: `${readiness}/100`, color: '#4f8dff' },
          { label: 'Expected Score', value: Math.round(recentScore || readiness), color: '#06d6a0' },
          { label: 'Expected Rank', value: rankRange.label, color: '#ff9f43' },
          { label: 'Consistency', value: `${consistencyScore}/100`, color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="text-lg font-bold font-mono truncate" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{s.label}</div>
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
            {recoveryPlans.map((item) => (
              <div key={`${item.subject}-${item.topic}`} className="bg-bg-2 border border-border rounded-lg p-3">
                <div className="flex justify-between gap-3">
                  <div className="text-sm font-medium text-text">{item.topic}</div>
                  <div className="text-xs font-mono text-orange-400">Accuracy {item.accuracy}%</div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.plan.map((step) => <span key={step} className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">{step}</span>)}
                </div>
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
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Weekly Study Graph</div>
          <div className="relative h-48"><canvas ref={weeklyRef} /></div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Monthly Study Graph</div>
          <div className="relative h-48"><canvas ref={monthlyRef} /></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Subject Comparison</div>
          <div className="relative h-48"><canvas ref={barRef} /></div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Accuracy Graph</div>
          <div className="relative h-48"><canvas ref={accuracyRef} /></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Mock Test Trend</div>
          <div className="relative h-48"><canvas ref={mockTrendRef} /></div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Time Spent Per Subject</div>
          <div className="relative h-48"><canvas ref={pieRef} /></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-1">Subject Accuracy</div>
          <div className="text-[10px] text-text3 uppercase mb-4">PYQ performance by subject</div>
          <div className="h-64">
            <canvas ref={subAccuracyRef} />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-1">Topic Analysis</div>
          <div className="text-[10px] text-text3 uppercase mb-4">Mastery across categories</div>
          <div className="h-64">
            <canvas ref={radarRef} />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Subject Priority Suggestions</div>
          <div className="space-y-2">
            {priorities.map((p) => (
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
