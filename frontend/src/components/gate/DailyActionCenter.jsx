import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { aiService } from '../../services/api';
import { buildDailyActions, computeReadinessScore, predictRankRange } from '../../utils/gateUtils';
import ProgressRing from '../ui/ProgressRing';
import toast from 'react-hot-toast';

function planLine(item) {
  if (typeof item === 'string') return item;
  return item?.topic || item?.title || item?.task || 'Focused study block';
}

export default function DailyActionCenter() {
  const navigate = useNavigate();
  const { topics, pyqs, mocks, revisionSchedule, studyStats, gateFeatures } = useProgress();
  const [dailyPlan, setDailyPlan] = useState([]);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);

  const fallback = useMemo(
    () => buildDailyActions({ topics, pyqs, mocks, revisionSchedule, studyStats }),
    [topics, pyqs, mocks, revisionSchedule, studyStats]
  );

  const weakestTopic = useMemo(() => {
    const notStarted = topics.filter((t) => {
      const p = t.progress || {};
      return !p.lecture && !p.notes;
    });
    if (notStarted.length) {
      const highWeight = notStarted.sort((a, b) => (b.weightage || 0) - (a.weightage || 0));
      return highWeight[0];
    }
    const inProgress = topics.filter((t) => {
      const p = t.progress || {};
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      return done > 0 && done < tasks.length;
    });
    return inProgress.sort((a, b) => {
      const pa = a.progress || {}; const pb = b.progress || {};
      const ta = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].filter((k) => pa[k]).length;
      const tb = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].filter((k) => pb[k]).length;
      return ta - tb;
    })[0] || null;
  }, [topics]);

  const weakSubject = useMemo(() => {
    const subs = studyStats?.subjects || [];
    return [...subs].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0];
  }, [studyStats]);

  const readinessScore = computeReadinessScore(topics, pyqs, mocks, gateFeatures?.streak);
  const rankRange = predictRankRange(readinessScore);

  const revisionDue = useMemo(() => {
    return topics.filter((t) => {
      const p = t.progress || {};
      const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
      const done = tasks.filter((k) => p[k]).length;
      if (done < tasks.length) return false;
      if (!t.lastRevised) return true;
      const days = Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000);
      const schedule = t.revisionSchedule || [3, 7, 15, 30];
      return schedule.some((d) => days >= d);
    });
  }, [topics]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await aiService.generatePlan({
        subjects: studyStats.subjects || [],
        topics: topics || [],
        pyqs: pyqs || [],
        mocks: mocks || [],
        revisionSchedule: revisionSchedule || [],
        dailyHours: gateFeatures.dailyTarget?.hours || 8,
        period: 'day',
      });
      const data = res.data?.data || {};
      const plan = Array.isArray(data.plan) ? data.plan.slice(0, 5) : [];
      setDailyPlan(plan.length ? plan : [fallback.revision, fallback.pyq, fallback.task, fallback.mock]);
      setSource(data.source || 'heuristic');
      if (data.aiError) toast(data.aiError, { icon: '🤖' });
    } catch (err) {
      setDailyPlan([fallback.revision, fallback.pyq, fallback.task, fallback.mock]);
      setSource('local');
      toast.error(err.response?.data?.message || 'Using smart local day plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-1">Decision Assistant</p>
          <h2 className="text-xl sm:text-2xl font-bold text-text">Am I Ready for GATE?</h2>
          <p className="text-sm text-text3 mt-1">Readiness: {readinessScore}% · Predicted Rank: {rankRange.label}</p>
        </div>
        <button
          type="button"
          onClick={generatePlan}
          disabled={loading}
          className="btn-primary shrink-0 text-sm disabled:opacity-60"
        >
          {loading ? 'Planning...' : '🎯 Plan My Day'}
        </button>
      </div>

      <div className="relative grid sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-bg-2/80 border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary">What to Study Today</div>
          <p className="text-sm text-text mt-2">
            {weakestTopic
              ? `${weakestTopic.name} (${weakestTopic.subject?.name || weakestTopic.subject})`
              : fallback.task}
          </p>
          {weakestTopic && (
            <button
              onClick={() => navigate(`/learn/topic/${weakestTopic._id || weakestTopic.id}`)}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Start studying →
            </button>
          )}
        </div>
        <div className="bg-bg-2/80 border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">What to Revise Today</div>
          <p className="text-sm text-text mt-2">
            {revisionDue.length > 0
              ? `${revisionDue[0].name} + ${revisionDue.length - 1} more topic(s)`
              : fallback.revision}
          </p>
          {revisionDue.length > 0 && (
            <span className="text-[10px] text-orange-400 mt-1 block">
              ↻ {revisionDue.length} topic(s) due — overdue by {Math.floor((Date.now() - new Date(revisionDue[0].lastRevised || Date.now()).getTime()) / 86400000)}d
            </span>
          )}
        </div>
        <div className="bg-bg-2/80 border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">Weakest Area</div>
          <p className="text-sm text-text mt-2">
            {weakSubject
              ? `${weakSubject.name} (${Math.round(weakSubject.progress || 0)}% complete)`
              : 'No data yet'}
          </p>
          {weakSubject && (
            <button
              onClick={() => navigate(`/subjects?focus=${weakSubject.name}`)}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Focus on this →
            </button>
          )}
        </div>
        <div className="bg-bg-2/80 border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="flex-shrink-0">
            <ProgressRing value={readinessScore} size={64} stroke={5} color="var(--color-primary)" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-400">GATE Readiness</div>
            <div className="text-lg font-bold font-mono text-text">{readinessScore}%</div>
            <div className="text-[10px] text-text3 mt-0.5">Rank range: {rankRange.label}</div>
          </div>
        </div>
      </div>

      {dailyPlan.length > 0 && (
        <div className="relative bg-bg-2 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-xs font-bold uppercase tracking-widest text-text3">AI Day Plan</div>
            {source && <span className="text-[10px] text-primary uppercase">{source}</span>}
          </div>
          <div className="space-y-2">
            {dailyPlan.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-text2">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <span>{planLine(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
