import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion, computeWeakAreas } from '../../utils/gateUtils';
import GlassCard from '../ui/GlassCard';

const TABS = [
  { id: 'today', label: 'What Should I Study Today?' },
  { id: 'insights', label: 'Monthly GATE Insights' },
  { id: 'weak', label: 'Weak Topics' },
  { id: 'revision', label: 'Revision Plan' },
  { id: 'recommendations', label: 'AI Recommendations' },
];

export default function PrepGateAIWidget() {
  const [tab, setTab] = useState('today');
  const { studyStats, topics, pyqs, gateFeatures } = useProgress();
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    api.get('/cms/insights').then(r => {
      const data = r.data?.data;
      if (Array.isArray(data) && data.length) setInsights(data[0]);
      else if (data) setInsights(data);
    }).catch(() => {});
  }, []);

  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  const subjects = studyStats?.subjects || [];
  const weakAreas = computeWeakAreas(safeTopics, safePyqs);
  const completion = computeSubjectCompletion(subjects, safeTopics, safePyqs);

  const renderTab = () => {
    switch (tab) {
      case 'today':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Based on your progress, here's what you should focus on today:</p>
            <div className="space-y-2">
              {weakAreas.slice(0, 3).map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.08)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #A78BFA, #22D3EE)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{w.name}</p>
                    <p className="text-[11px] text-gray-400">{w.subject} · {w.pyqCount} PYQs unsolved</p>
                  </div>
                </div>
              ))}
              {weakAreas.length === 0 && (
                <p className="text-sm text-gray-400 italic">Great job! No weak topics detected.</p>
              )}
            </div>
            <Link to="/prepgate-ai" className="inline-block text-xs font-medium" style={{ color: '#A78BFA' }}>
              View full AI analysis →
            </Link>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">{insights?.title || 'Monthly Focus Areas'}</p>
            {insights?.description && (
              <p className="text-xs text-gray-300">{insights.description}</p>
            )}
            {insights?.relatedSubjects?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">This month focus on:</p>
                <div className="flex flex-wrap gap-2">
                  {insights.relatedSubjects.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full font-medium" style={{
                      background: 'rgba(167,139,250,0.1)',
                      border: '1px solid rgba(167,139,250,0.2)',
                      color: '#A78BFA',
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {insights?.topics?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Expected Weightage:</p>
                <div className="space-y-1.5">
                  {insights.topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{t.name}</span>
                      <span className="font-mono" style={{ color: '#22D3EE' }}>{t.weightage} marks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insights?.recommendations?.length > 0 && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <p className="text-xs font-semibold text-white mb-2">Recommendations</p>
                {insights.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300 mb-1">
                    <span style={{ color: '#22D3EE' }}>→</span> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'weak':
        return (
          <div className="space-y-2">
            {weakAreas.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No weak topics detected. Keep up the great work!</p>
            ) : (
              weakAreas.slice(0, 8).map((w, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.08)' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs" style={{ color: '#F87171' }}>⚠️</span>
                    <div>
                      <p className="text-xs font-medium text-white">{w.name}</p>
                      <p className="text-[10px] text-gray-400">{w.subject}</p>
                    </div>
                  </div>
                  <Link to={`/pyq?subject=${w.subject}`} className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>
                    Practice
                  </Link>
                </div>
              ))
            )}
            <Link to="/weak-topics" className="inline-block text-xs font-medium mt-2" style={{ color: '#F87171' }}>
              View all weak areas →
            </Link>
          </div>
        );

      case 'revision':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Your spaced repetition revision schedule:</p>
            <div className="space-y-2">
              {safeTopics.filter(t => t.revisionNeeded).slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs" style={{ color: '#22D3EE' }}>🔄</span>
                    <div>
                      <p className="text-xs font-medium text-white">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.subject}</p>
                    </div>
                  </div>
                  <Link to={`/topics`} className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}>
                    Revise
                  </Link>
                </div>
              ))}
              {(!safeTopics.filter(t => t.revisionNeeded).length) && (
                <p className="text-sm text-gray-400 italic">No topics due for revision.</p>
              )}
            </div>
            <Link to="/revision" className="inline-block text-xs font-medium" style={{ color: '#22D3EE' }}>
              Open revision calendar →
            </Link>
          </div>
        );

      case 'recommendations':
        const readiness = safeTopics.length > 0 ? Math.round(completion.reduce((s, x) => s + x.progress, 0) / completion.length) : 0;
        const recs = [];
        if (readiness < 30) recs.push('Focus on completing core subject topics first');
        if (readiness < 50) recs.push('Start solving PYQs alongside theory study');
        if (readiness >= 50) recs.push('Increase mock test frequency to 2 per week');
        if (readiness >= 70) recs.push('Focus on revision and time management in mocks');
        recs.push('Review your mistake notebook before each mock test');
        recs.push('Maintain your current study streak');

        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-3">Based on your {readiness}% overall readiness:</p>
            {recs.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.08)' }}>
                <span className="text-xs mt-0.5" style={{ color: '#34D399' }}>✓</span>
                <p className="text-xs text-gray-300">{r}</p>
              </div>
            ))}
            <Link to="/prepgate-ai" className="inline-block text-xs font-medium mt-2" style={{ color: '#34D399' }}>
              Get personalized AI recommendations →
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))',
        }}>
          🤖
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">PrepGate AI</h3>
          <p className="text-[10px] text-gray-400">Personalized GATE guidance</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
              tab === t.id
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={tab === t.id ? { background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(167,139,250,0.2)' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {renderTab()}
      </div>
    </GlassCard>
  );
}
