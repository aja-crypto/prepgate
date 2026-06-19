import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion, computeWeakAreas, getDailyTargetProgress } from '../../utils/gateUtils';

export default function RecommendationEngine() {
  const { studyStats, topics, pyqs, mocks, gateFeatures } = useProgress();

  const tasks = useMemo(() => {
    const result = [];
    const safeTopics = topics || [];
    const safePyqs = pyqs || [];
    const safeMocks = mocks || [];
    const subjects = studyStats?.subjects || [];
    const weakAreas = computeWeakAreas(safeTopics, safePyqs);
    const dailyProgress = getDailyTargetProgress(gateFeatures?.dailyTarget, gateFeatures?.todayProgress);
    const completion = computeSubjectCompletion(subjects, safeTopics, safePyqs);
    const overall = Math.round(completion.reduce((s, x) => s + x.progress, 0) / (completion.length || 1));

    const unsolvedPyqs = safePyqs.filter(p => !p.solved).length;

    if (weakAreas.length > 0) {
      const w = weakAreas[0];
      result.push({
        id: 'weak-revision',
        label: `Revise ${w.name}`,
        sub: `${w.subject}`,
        impact: '+12 marks',
        priority: 'high',
        link: `/pyq?subject=${w.subject}`,
        icon: '📖',
      });
    }

    if (unsolvedPyqs > 0) {
      result.push({
        id: 'solve-pyqs',
        label: `Solve ${Math.min(20, unsolvedPyqs)} PYQs`,
        sub: `${unsolvedPyqs} unsolved questions remaining`,
        impact: '+8 marks',
        priority: 'high',
        link: '/pyq',
        icon: '📝',
      });
    }

    if (safeMocks.length > 0) {
      result.push({
        id: 'mock-analysis',
        label: 'Review Mistake Notebook',
        sub: `Analyze your last ${safeMocks.length} mock test(s)`,
        impact: '+5 marks',
        priority: 'medium',
        link: '/mistakes',
        icon: '🎯',
      });
    }

    if (dailyProgress.hours < (gateFeatures?.dailyTarget?.hours || 8)) {
      result.push({
        id: 'study-hours',
        label: `Study ${Math.round((gateFeatures?.dailyTarget?.hours || 8) - dailyProgress.hours)} more hours today`,
        sub: `${dailyProgress.hours}h / ${gateFeatures?.dailyTarget?.hours || 8}h completed`,
        impact: '+3 marks',
        priority: 'medium',
        link: '/productivity',
        icon: '⏰',
      });
    }

    result.push({
      id: 'quiz',
      label: 'Quick Topic Quiz',
      sub: 'Test your knowledge with 5 random questions',
      impact: '+2 marks',
      priority: 'low',
      link: '/mock-tests',
      icon: '⚡',
    });

    return result;
  }, [studyStats, topics, pyqs, mocks, gateFeatures]);

  const predictedImprovement = useMemo(() => {
    let total = 0;
    tasks.filter(t => t.priority === 'high').forEach(t => {
      total += parseInt(t.impact.replace('+', ''));
    });
    tasks.filter(t => t.priority === 'medium').forEach(t => {
      total += parseInt(t.impact.replace('+', ''));
    });
    return total;
  }, [tasks]);

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(34,211,238,0.03))',
      border: '1px solid rgba(139,92,246,0.1)',
    }}>
      {/* AI pulse animation */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#A78BFA' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#A78BFA' }} />
        </span>
        <span className="text-[9px] font-medium tracking-wider uppercase" style={{ color: '#A78BFA' }}>AI Powered</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))',
          boxShadow: '0 0 16px rgba(167,139,250,0.12)',
        }}>
          🧠
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Today's Highest Impact Tasks</h3>
          <p className="text-xs text-gray-400">Prioritized by expected score improvement</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {tasks.map(t => (
          <Link key={t.id} to={t.link}
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0" style={{
              background: t.priority === 'high'
                ? 'rgba(167,139,250,0.15)'
                : t.priority === 'medium'
                ? 'rgba(34,211,238,0.12)'
                : 'rgba(155,155,155,0.1)',
            }}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text transition-all" style={{ '--tw-gradient-from': '#A78BFA', '--tw-gradient-to': '#22D3EE' }}>
                {t.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold font-mono" style={{ color: '#34D399' }}>{t.impact}</div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500">{t.priority}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(34,211,238,0.04))',
        border: '1px solid rgba(16,185,129,0.1)',
      }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">📈</span>
          <span className="text-xs text-gray-300">Expected Improvement:</span>
        </div>
        <span className="text-lg font-bold font-mono" style={{ color: '#34D399' }}>+{predictedImprovement} marks</span>
      </div>
    </div>
  );
}
