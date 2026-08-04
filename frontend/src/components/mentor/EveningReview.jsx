import { useMemo } from 'react';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';

function getTodaySummary(topics, pyqs, studyStats) {
  const weekHours = studyStats?.weeklyHours || [];
  const todayHours = weekHours.length > 0 ? weekHours[weekHours.length - 1] : 0;
  const allHours = weekHours.reduce((a, b) => a + b, 0);

  const topicsStarted = topics.filter(t => t.progress?.lecture).length;
  const topicsCompleted = topics.filter(t => {
    const p = t.progress || {};
    return ['lecture', 'notes', 'revision1', 'pyqs', 'topicTest'].every(k => p[k]);
  }).length;

  const pyqsSolved = (pyqs || []).filter(p => p.solved).length;
  const pyqsCorrect = (pyqs || []).filter(p => p.status === 'correct').length;
  const accuracy = pyqsSolved > 0 ? Math.round((pyqsCorrect / pyqsSolved) * 100) : 0;

  const overdue = (pyqs || []).filter(p => p.revisionNeeded).length;

  return { todayHours, allHours, topicsStarted, topicsCompleted, pyqsSolved, accuracy, overdue };
}

export default function EveningReview({ topics = [], pyqs = [], mocks = [], studyStats = {}, subjects = [] }) {
  const summary = useMemo(() => getTodaySummary(topics, pyqs, studyStats), [topics, pyqs, studyStats]);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const missedTasks = useMemo(() => {
    const missed = [];
    if (summary.todayHours < 1) missed.push('Study session');
    if (summary.pyqsSolved === 0) missed.push('PYQ practice');
    return missed;
  }, [summary]);

  const tomorrowPlan = useMemo(() => {
    const plan = [];
    const weakSub = [...subjects].sort((a, b) => a.progress - b.progress)[0];
    if (weakSub && weakSub.progress < 50) plan.push(`Continue ${weakSub.name} — ${weakSub.progress}% done`);
    if (summary.overdue > 0) plan.push(`Revise ${summary.overdue} overdue topic(s)`);
    plan.push('Solve 5+ PYQs');
    if (summary.todayHours < 2) plan.push('Increase study time to 2+ hours');
    return plan;
  }, [subjects, summary]);

  return (
    <GlassCard className="border-l-4 border-l-indigo-500 bg-indigo-500/5" padding="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-xl">
          <Icon name="moon" className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-text">Evening Review</h2>
              <p className="text-xs text-text3">{dateStr}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-text3 uppercase tracking-wider">Today's Focus</p>
              <p className="text-lg font-bold text-indigo-400">{summary.todayHours.toFixed(1)}h</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400" />
                Today's Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-text2">
                  <span>Study hours</span>
                  <span className="font-semibold">{summary.todayHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-sm text-text2">
                  <span>Topics completed</span>
                  <span className="font-semibold">{summary.topicsCompleted}</span>
                </div>
                <div className="flex justify-between text-sm text-text2">
                  <span>PYQs solved</span>
                  <span className="font-semibold">{summary.pyqsSolved}</span>
                </div>
                {summary.accuracy > 0 && (
                  <div className="flex justify-between text-sm text-text2">
                    <span>PYQ accuracy</span>
                    <span className={`font-semibold ${summary.accuracy > 70 ? 'text-success' : 'text-orange-400'}`}>{summary.accuracy}%</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-amber-400" />
                Missed Tasks
              </h3>
              {missedTasks.length > 0 ? (
                <ul className="space-y-1.5">
                  {missedTasks.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text2">
                      <span className="text-red-400 mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-success">No missed tasks. Great focus today!</p>
              )}

              <div className="mt-4">
                <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Tomorrow's Plan
                </h3>
                <ul className="space-y-1.5">
                  {tomorrowPlan.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text2">
                      <Icon name="chevron-right" className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">AI Reflection</p>
            <p className="text-xs text-text2 italic">
              {summary.todayHours > 2
                ? 'Good effort today. Rest well and come back stronger tomorrow.'
                : summary.todayHours > 0
                  ? 'Every hour counts. Try to push a bit more tomorrow.'
                  : 'A new day starts tomorrow. Set one clear goal to begin with.'}
            </p>
            <div className="mt-2 text-[10px] text-text3">
              Roadmap impact: {summary.topicsCompleted > 0 ? `${summary.topicsCompleted} topic(s) completed → ${Math.round(summary.topicsCompleted * 2.5)}% progress contribution` : 'No measurable impact yet. Start with one topic tomorrow.'}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
