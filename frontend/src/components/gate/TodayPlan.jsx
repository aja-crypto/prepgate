import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyPlanService } from '../../services/api';
import { silentCatch } from '../../utils/errorHandler';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import GlassCard from '../ui/GlassCard';
import ProgressRing from '../ui/ProgressRing';

const PLAN_ICONS = {
  revise: '\uD83D\uDCD6',
  practice: '\u270F\uFE0F',
  test: '\uD83E\uDDEA',
};

const PLAN_COLORS = {
  revise: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  practice: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  test: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

export default function TodayPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gateFeatures } = useProgress();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studyPlanService.get()
      .then(r => setPlan(r.data.data))
      .catch(silentCatch('Load today plan'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-pulse">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="h-5 bg-bg-3 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-bg-3 rounded-lg" />)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="h-5 bg-bg-3 rounded w-32 mb-4" />
          <div className="h-24 bg-bg-3 rounded-full w-24 mx-auto mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-bg-3 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-bg-3 rounded w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const userName = user?.name?.split(' ')[0] || 'GATE Aspirant';
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening';
  const gateDate = new Date(gateFeatures?.examDate || '2027-02-07');
  const daysLeft = Math.ceil((gateDate - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="lg:col-span-2 space-y-4">
        <GlassCard padding="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary mb-0.5">
                {greeting}, {userName}
              </p>
              <h2 className="text-lg font-bold text-text">Today's Study Plan</h2>
              <p className="text-xs text-text3 mt-0.5">
                GATE 2027 · {daysLeft} Days Left · ~{plan.totalMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
                {plan.readiness}% Ready
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {plan.planItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer hover:bg-bg-2/50 ${PLAN_COLORS[item.type] || 'bg-bg-2 border-border'}`}
                onClick={() => {
                  if (item.type === 'test' && item.testId) {
                    navigate(`/mock-tests/${item.testId}`);
                  }
                }}
              >
                <span className="text-base">{PLAN_ICONS[item.type] || '\u2728'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{item.label}</p>
                </div>
                <span className="text-[10px] text-text3 font-mono shrink-0">{item.minutes}m</span>
              </div>
            ))}
          </div>

          {plan.weakTopics.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                <span>&#9888;&#65039;</span> Focus Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {plan.weakTopics.map((w, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {w.topic ? `${w.subject} - ${w.topic}` : w.subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="space-y-3">
        <GlassCard padding="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text3">Readiness</p>
            <span className="text-xs font-bold font-mono text-primary">{plan.readiness}%</span>
          </div>
          <div className="flex justify-center mb-3">
            <ProgressRing value={plan.readiness} size={80} stroke={6} color="var(--color-primary)" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-sm font-bold font-mono text-green-400">{plan.mockStats.count}</div>
              <div className="text-[9px] text-text3">Tests</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-cyan-400">{plan.mockStats.avgAccuracy || '—'}%</div>
              <div className="text-[9px] text-text3">Avg Accuracy</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text3">Predicted Rank</p>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold">
              AIR
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-text text-center py-1">
            {plan.predictedRank?.label || '—'}
          </div>
          {plan.mockStats.count > 0 && (
            <p className="text-[10px] text-text3 text-center">
              Avg Score: {plan.mockStats.avgScore}% · Best: {plan.mockStats.bestScore}%
            </p>
          )}
          {plan.mistakeStats.total > 0 && (
            <div className="mt-2 pt-2 border-t border-border text-center">
              <span className="text-[10px] text-text3">
                {plan.mistakeStats.total} mistakes logged
                {plan.mistakeStats.topCategory ? ` · ${plan.mistakeStats.topCategory.replace(/_/g, ' ')}` : ''}
              </span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
