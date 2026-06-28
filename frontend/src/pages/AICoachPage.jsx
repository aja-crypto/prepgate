import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import { computeSubjectCompletion, computeReadinessScore } from '../utils/gateUtils';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';

const SUGGESTIONS = [
  "What should I study today?",
  "How many PYQs should I solve?",
  "Create a 7-day DBMS plan",
  "Explain deadlock with example",
  "Analyze my mock score",
  "Am I on track for GATE?",
  "Which subject should I prioritize?",
  "How should I revise effectively?",
];

const DAILY_TIPS = [
  { icon: '📘', title: 'Start with your weakest subject', desc: 'Tackle the hardest topic first when your mind is fresh.' },
  { icon: '🔄', title: 'Revise before you learn', desc: 'Spend 15 min reviewing yesterday before starting new material.' },
  { icon: '🧪', title: 'Test yourself daily', desc: 'Solve 5 PYQs at the end of every study session.' },
  { icon: '⏰', title: 'Use the Pomodoro method', desc: '50 min focused study + 10 min break. Repeat 4 times.' },
  { icon: '🎯', title: 'Set a daily target', desc: "Decide 3 things you'll accomplish today before you start." },
];

function buildContext(user) {
  return {
    weakSubjects: user?.weakSubjects || [],
    strongSubjects: user?.strongSubjects || [],
    weakTopics: (user?.progressBackup?.weakTopics || user?.weakTopics || []).slice(0, 5),
    overallProgress: user?.progressBackup?.overallProgress || user?.overallProgress || 0,
    mockAvg: user?.progressBackup?.mockAvg || user?.mockAvg || 0,
    streak: user?.streak || 0,
    overdueTopics: user?.overdueTopics || 0,
    recentAccuracy: user?.recentAccuracy || 0,
  };
}

export default function AICoachPage() {
  const { topics, pyqs, mocks, studyStats, gateFeatures, user } = useProgress();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chat');
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const welcomeSent = useRef(false);

  const subjects = useMemo(() => computeSubjectCompletion(studyStats?.subjects || [], topics || [], pyqs || []), [studyStats, topics, pyqs]);
  const overall = useMemo(() => { if (!subjects.length) return 0; return Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length); }, [subjects]);
  const readiness = useMemo(() => computeReadinessScore(topics, pyqs, mocks, gateFeatures?.streak), [topics, pyqs, mocks, gateFeatures]);
  const weakestSubject = useMemo(() => [...subjects].sort((a, b) => a.progress - b.progress)[0], [subjects]);
  const strongestSubject = useMemo(() => [...subjects].sort((a, b) => b.progress - a.progress)[0], [subjects]);
  const avgMock = useMemo(() => { if (!mocks?.length) return 0; return Math.round(mocks.reduce((a, m) => a + (m.score || 0), 0) / mocks.length); }, [mocks]);
  const totalWeeklyHours = useMemo(() => { const wh = studyStats?.weeklyHours || []; return wh.reduce((a, b) => a + b, 0); }, [studyStats]);
  const streak = gateFeatures?.streak?.current || 0;

  useEffect(() => {
    if (welcomeSent.current) return;
    welcomeSent.current = true;
    const timer = setTimeout(async () => {
      const ctx = buildContext(user);
      const result = await aiService.askCoach("hello", ctx).catch(() => null);
      const text = result?.data?.data?.text || `Hey! I'm your GateNexa AI Mentor. Ask me anything about your GATE prep — study plans, weak topics, PYQs, revision, or motivation.`;
      setMessages([{ role: 'assistant', text }]);
    }, 400);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    const ctx = buildContext(user);
    const result = await aiService.askCoach(msg, ctx).catch(() => null);
    const reply = result?.data?.data?.text || "Based on your preparation data, I recommend focusing on your weakest subject and solving at least 10 PYQs daily. Consistency is key for GATE success!";
    setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    setLoading(false);
  };

  const statsRow = [
    { label: 'Readiness', value: `${readiness}%`, color: '#8B5CF6' },
    { label: 'Progress', value: `${overall}%`, color: '#22D3EE' },
    { label: 'Mock Avg', value: `${avgMock}%`, color: '#34D399' },
    { label: 'Streak', value: `${streak}d`, color: '#FBBF24' },
  ];

  const morningBriefing = useMemo(() => {
    const items = [];
    if (weakestSubject) items.push(`Focus on ${weakestSubject.name} (${Math.round(weakestSubject.progress)}% done)`);
    if (strongestSubject) items.push(`Maintain ${strongestSubject.name}`);
    const overdue = pyqs?.filter(p => p.revisionNeeded).length || 0;
    if (overdue > 0) items.push(`Clear ${overdue} pending revisions`);
    items.push('Solve 5+ PYQs today');
    if (avgMock > 0) items.push(`Next mock target: ${Math.min(100, avgMock + 5)}%`);
    return items;
  }, [subjects, pyqs, avgMock]);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-1">GateNexa AI</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">AI Mentor</h1>
          <p className="text-sm text-text3 mt-1">Your personal GATE assistant — chat, analyze, plan, motivate</p>
        </div>
        <div className="flex gap-2">
          {statsRow.map(s => (
            <div key={s.label} className="bg-surface border border-border rounded-xl px-3 py-2 text-center min-w-[60px]">
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-text3 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'chat', label: '💬 Chat', desc: 'Ask anything' },
          { key: 'briefing', label: '📋 Briefing', desc: 'Daily overview' },
          { key: 'insights', label: '📊 Insights', desc: 'Smart analysis' },
          { key: 'tips', label: '💡 Tips', desc: 'Study advice' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-center transition-all ${tab === t.key ? 'bg-primary/15 text-primary' : 'text-text3 hover:text-text'}`}>
            <div className="text-xs font-bold">{t.label}</div>
            <div className="text-[8px] text-text3 hidden sm:block">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab: Chat */}
      {tab === 'chat' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-[500px] sm:h-[580px] overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 30px rgba(168,85,247,0.1)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-primary"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                    </div>
                    <h4 className="text-base font-semibold text-text mb-2">Start Your GATE Conversation</h4>
                    <p className="text-sm text-text3 mb-5 max-w-sm mx-auto leading-relaxed">Ask me anything — study plans, PYQ tips, subject advice, or daily motivation.</p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                      {SUGGESTIONS.slice(0, 5).map(s => (
                        <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 100); }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
                          style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : ''}`} style={msg.role === 'assistant' ? { background: 'rgba(139,92,246,0.12)' } : {}}>
                      {msg.role === 'user' ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                      ) : (
                        <Icon name="logo" className="w-5 h-5" />
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 rounded-tr-none' : 'bg-white/[0.03] border border-white/[0.06] rounded-tl-none'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-text">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-text3">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-white/5">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your AI Mentor..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-colors" />
                <button type="submit" disabled={!input.trim() || loading} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                  Send
                </button>
              </form>
            </div>
          </div>
          <div className="space-y-4">
            <GlassCard className="bg-primary/5 border-primary/20" padding="p-5">
              <h3 className="text-xs font-bold text-text mb-3 flex items-center gap-2">
                <Icon name="zap" className="text-primary w-4 h-4" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Weakest', value: weakestSubject?.name || 'N/A' },
                  { label: 'Strongest', value: strongestSubject?.name || 'N/A' },
                  { label: 'Weekly Hours', value: `${totalWeeklyHours}h` },
                  { label: 'PYQs Solved', value: `${pyqs?.length || 0}` },
                  { label: 'Mocks Taken', value: `${mocks?.length || 0}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center text-xs">
                    <span className="text-text3">{item.label}</span>
                    <span className="text-text font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard padding="p-5">
              <h3 className="text-xs font-bold text-text mb-3">💡 Try Asking</h3>
              <div className="space-y-1">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:bg-white/[0.03] text-text3 hover:text-text">
                    {s}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Tab: Briefing */}
      {tab === 'briefing' && (
        <div className="space-y-6">
          <GlassCard padding="p-6" className="border-l-4 border-l-primary bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Icon name="sun" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Morning Briefing</h2>
                <p className="text-xs text-text3">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3">Today's Targets</h3>
                <ul className="space-y-2">
                  {morningBriefing.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text2">
                      <Icon name="check-circle" className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3">Week Overview</h3>
                <div className="flex justify-center gap-1.5 mb-3">
                  {['M','T','W','T','F','S','S'].map((day, i) => {
                    const wh = studyStats?.weeklyHours || [];
                    return (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${(wh[i] || 0) > 0 ? 'bg-success text-white' : 'bg-bg border border-border text-text3'}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-text3">Total: {totalWeeklyHours}h this week</p>
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-[10px] font-bold text-primary uppercase mb-1">Coach's Tip</p>
                  <p className="text-xs text-text2 italic">"Consistency beats intensity. Even 2 hours daily is better than 8 hours once a week."</p>
                </div>
              </div>
            </div>
          </GlassCard>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statsRow.map(s => (
              <GlassCard key={s.label} className="text-center py-6" glow>
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-text3 uppercase tracking-wider font-bold">{s.label}</div>
              </GlassCard>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <GlassCard padding="p-5" glow>
              <h3 className="text-xs font-bold text-red-400 mb-2">🎯 Weakest Subject</h3>
              <p className="text-sm text-text">{weakestSubject?.name || 'N/A'} — {weakestSubject ? `${Math.round(weakestSubject.progress)}%` : ''}</p>
              <p className="text-xs text-text3 mt-1">{weakestSubject ? 'Dedicate extra time here. Focus on fundamentals first.' : 'No data yet.'}</p>
            </GlassCard>
            <GlassCard padding="p-5" glow>
              <h3 className="text-xs font-bold text-green-400 mb-2">🏆 Strongest Subject</h3>
              <p className="text-sm text-text">{strongestSubject?.name || 'N/A'} — {strongestSubject ? `${Math.round(strongestSubject.progress)}%` : ''}</p>
              <p className="text-xs text-text3 mt-1">Great work! Maintain this with weekly PYQs.</p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Tab: Insights */}
      {tab === 'insights' && (
        <div className="space-y-6">
          <GlassCard padding="p-6" glow>
            <h2 className="text-lg font-bold text-text mb-4">📊 Preparation Insights</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">{readiness}%</div>
                <div className="text-[10px] text-text3 uppercase tracking-wider">Readiness</div>
              </div>
              <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-success mb-1">{overall}%</div>
                <div className="text-[10px] text-text3 uppercase tracking-wider">Syllabus Done</div>
              </div>
              <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">{avgMock}%</div>
                <div className="text-[10px] text-text3 uppercase tracking-wider">Mock Avg</div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                overall < 40 ? '📚 Focus on completing core subjects first' : '✅ Good syllabus coverage — maintain momentum',
                avgMock < 50 ? '🎯 Take more mock tests to build exam temperament' : '📈 Mock performance looks solid — aim for 80%+',
                weakestSubject ? `⚡ Prioritize ${weakestSubject.name} — it needs the most attention` : '📊 Start tracking subjects to get recommendations',
                streak > 5 ? '🔥 Streak is strong! Add 30 min of revision daily' : '⏰ Start a study streak — consistency compounds',
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-text2 bg-bg-2/50 rounded-xl p-3 border border-border">
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: Tips */}
      {tab === 'tips' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAILY_TIPS.map((t, i) => (
            <GlassCard key={i} padding="p-5" glow>
              <div className="text-2xl mb-3">{t.icon}</div>
              <h3 className="text-sm font-bold text-text mb-1">{t.title}</h3>
              <p className="text-xs text-text3 leading-relaxed">{t.desc}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

