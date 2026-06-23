import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useProgress } from '../../context/ProgressContext';
import GlassCard from '../ui/GlassCard';

const SUBJECTS = ['APT', 'MA', 'DL', 'CO', 'DS', 'AL', 'OS', 'DBMS', 'CN', 'TOC', 'CD'];

const CHALLENGE_TABS = [
  { id: 'top50', label: 'Top 50 Challenge', icon: '🏆' },
  { id: 'pyq100', label: '100 PYQ Challenge', icon: '📚' },
  { id: 'stats', label: 'My Stats', icon: '📊' },
  { id: 'badges', label: 'Achievement Badges', icon: '🎖️' },
];

const SUBJECT_NAMES = {
  APT: 'Aptitude', MA: 'Engg Math', DL: 'Digital Logic', CO: 'Comp Org',
  DS: 'Data Structures', AL: 'Algorithms', OS: 'OS', DBMS: 'DBMS',
  CN: 'Networks', TOC: 'TOC', CD: 'Compiler'
};

export default function GateVaultWidget() {
  const [tab, setTab] = useState('top50');
  const [challenges, setChallenges] = useState([]);
  const [flashcardProgress, setFlashcardProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { pyqs, gamification } = useProgress();

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled([
      api.get('/cms/challenges'),
      api.get('/gate-vault/progress'),
      api.get('/gate-vault/stats'),
      api.get('/gate-vault/monthly-set'),
    ]).then(([c, p, s, m]) => {
      if (c.value?.data?.data?.length) setChallenges(c.value.data.data);
      if (p.value?.data?.data) setFlashcardProgress(p.value.data.data);
      if (s.value?.data?.data) setStats(s.value.data.data);
      if (m.value?.data?.data?.questions) setTotalQuestions(m.value.data.data.questions.length);
    }).catch(e => console.warn('[GateVaultWidget] refreshAll failed', e?.message)).finally(() => setRefreshing(false));
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    const onShow = () => { if (!document.hidden) refreshAll(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [refreshAll]);

  const safePyqs = pyqs || [];
  const solvedPyqs = safePyqs.filter(p => p.solved).length;
  const badges = gamification?.badges || [];

  const renderTab = () => {
    switch (tab) {
      case 'top50': {
        const prog = flashcardProgress;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">June 2026 Top 50</p>
              <Link to="/gate-vault" className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>
                {prog ? 'Continue →' : 'Start Practice'}
              </Link>
            </div>
            {prog ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(167,139,250,0.1)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${prog.score || 0}%`,
                      background: 'linear-gradient(90deg, #A78BFA, #22D3EE)',
                    }} />
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: '#22D3EE' }}>{prog.score || 0}%</span>
                </div>
                <div className="flex gap-4 text-[10px] text-gray-400">
                  <span>Answered: {prog.answers?.length || 0}/{totalQuestions || '?'}</span>
                  <span>Correct: {prog.correctCount || 0}</span>
                  <span>Streak: {prog.streak || 0}🔥</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No progress yet. Start the Top 50 Challenge!</p>
            )}
          </div>
        );
      }

      case 'pyq100': {
        const progress = Math.min(100, (solvedPyqs / 100) * 100);
        return (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">100 PYQ Challenge</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(52,211,153,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #34D399, #22D3EE)',
                }} />
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: '#34D399' }}>{solvedPyqs}/100</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Solved: {solvedPyqs} PYQs</span>
              <Link to="/pyq" className="font-medium" style={{ color: '#34D399' }}>Solve more →</Link>
            </div>
          </div>
        );
      }

      case 'stats': {
        const s = stats || {};
        return (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">My Vault Stats</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#A78BFA' }}>{s.completedSets || 0}</p>
                <p className="text-[9px] text-gray-500">Sets Completed</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#34D399' }}>{s.avgAccuracy || 0}%</p>
                <p className="text-[9px] text-gray-500">Avg Accuracy</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.1)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#FBBF24' }}>{s.bestScore || 0}%</p>
                <p className="text-[9px] text-gray-500">Best Score</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#22D3EE' }}>{(flashcardProgress?.streak || 0) > 0 ? '🔥' : '—'}</p>
                <p className="text-[9px] text-gray-500">Streak</p>
              </div>
            </div>
            <Link to="/gate-vault" className="inline-block text-[10px] font-medium" style={{ color: '#A78BFA' }}>
              View detailed analytics →
            </Link>
          </div>
        );
      }

      case 'badges':
        return (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Achievement Badges</p>
            <div className="grid grid-cols-4 gap-2">
              {badges.length > 0 ? badges.slice(0, 8).map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.08)' }}>
                  <span className="text-lg">🏅</span>
                  <span className="text-[8px] text-gray-400 text-center truncate w-full">{b}</span>
                </div>
              )) : (
                <>
                  {['First PYQ Solved', '7-Day Streak', 'Mock Master', 'Topic Completed'].map((name, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg opacity-40" style={{ background: 'rgba(167,139,250,0.03)', border: '1px solid rgba(167,139,250,0.05)' }}>
                      <span className="text-lg">🔒</span>
                      <span className="text-[8px] text-gray-500 text-center">{name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            {badges.length > 0 && (
              <Link to="/gate-vault" className="inline-block text-xs font-medium" style={{ color: '#FBBF24' }}>
                View all badges →
              </Link>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(167,139,250,0.15))',
        }}>
          🏆
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Gate Vault</h3>
          <p className="text-[10px] text-gray-400">Challenges & achievements</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="ml-auto text-[10px] px-2 py-1 rounded-lg transition-all"
          style={{ background: 'rgba(167,139,250,0.1)', color: refreshing ? '#6B7280' : '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}
          title="Refresh data"
        >
          {refreshing ? '⟳' : '↻'} Update
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {CHALLENGE_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
              tab === t.id
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={tab === t.id ? { background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(251,191,36,0.2)' } : {}}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[100px]">
        {renderTab()}
      </div>
      <Link to="/gate-vault" className="block mt-3 text-center text-[10px] font-medium py-1.5 rounded-lg transition-all hover:scale-[1.02]" style={{ background: 'rgba(167,139,250,0.08)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.15)' }}>
        Open full Gate Vault →
      </Link>
    </GlassCard>
  );
}
