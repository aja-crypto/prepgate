import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import NeuralBackground from '../components/common/NeuralBackground';

const SUGGESTIONS = [
  "What should I study today?",
  "Am I on track for GATE 2027?",
  "Which subject should I prioritize?",
  "Show my weak topics and how to fix them",
  "Create a weekly study plan for me",
  "How should I revise effectively?",
];

function buildContext(user) {
  if (!user) return {};
  return {
    weakSubjects: user.weakSubjects || [],
    strongSubjects: user.strongSubjects || [],
    weakTopics: (user.progressBackup?.weakTopics || user.weakTopics || []).slice(0, 5),
    overallProgress: user.progressBackup?.overallProgress || user.overallProgress || 0,
    mockAvg: user.progressBackup?.mockAvg || user.mockAvg || 0,
    streak: user.streak || 0,
    overdueTopics: user.overdueTopics || 0,
    recentAccuracy: user.recentAccuracy || 0,
  };
}

const DAILY_TIPS = [
  { icon: '📘', title: 'Start with your weakest subject', desc: 'Tackle the hardest topic first when your mind is fresh.' },
  { icon: '🔄', title: 'Revise before you learn', desc: 'Spend 15 min reviewing yesterday before starting new material.' },
  { icon: '🧪', title: 'Test yourself daily', desc: 'Solve 5 PYQs at the end of every study session.' },
  { icon: '📝', title: 'Write to remember', desc: 'Jot down one formula or key concept per topic on a sticky note.' },
  { icon: '⏰', title: 'Use the Pomodoro method', desc: '50 min focused study + 10 min break. Repeat 4 times.' },
  { icon: '🎯', title: 'Set a daily target', desc: "Decide 3 things you'll accomplish today before you start." },
];

export default function DailyCoachPage() {
  const { user } = useAuth();
  const { refreshUser } = useProgress();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const welcomeSent = useRef(false);

  useEffect(() => {
    if (welcomeSent.current) return;
    welcomeSent.current = true;
    const timer = setTimeout(async () => {
      const ctx = buildContext(user);
      const result = await aiService.askCoach("hello", ctx).catch(() => null);
      const text = result?.data?.data?.text || `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || 'there'}! 👋\n\nI'm your Daily Coach. Ask me anything about your GATE preparation — study plans, weak topics, PYQs, or revision.`;
      setMessages([{ role: 'coach', text }]);
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    await refreshUser?.();

    const ctx = buildContext(user);
    const result = await aiService.askCoach(userMsg, ctx).catch(() => null);
    const text = result?.data?.data?.text || "I'm here to help! Based on your preparation data, focus on completing your weak subjects and solving PYQs daily. What specific topic would you like advice on?";
    setMessages((m) => [...m, { role: 'coach', text }]);
    setLoading(false);
  }, [input, loading, user]);

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] relative">
      <NeuralBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22D3EE' }}>
            🤖 AI Daily Coach
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-[500px] sm:h-[580px] overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20' : 'bg-cyan-500/20'}`}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-white/5">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your AI Coach..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/30 transition-colors" />
                <button type="submit" disabled={!input.trim() || loading} className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', color: 'white', opacity: !input.trim() || loading ? 0.5 : 1 }}>
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Suggestions */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-xs font-semibold text-white mb-3">💡 Try Asking</h3>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} className="w-full text-left text-[10px] px-3 py-2 rounded-lg transition-colors hover:bg-white/[0.03]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Tips */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-xs font-semibold text-white mb-3">📌 Daily Tips</h3>
              <div className="space-y-3">
                {DAILY_TIPS.map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-sm">{t.icon}</span>
                    <div>
                      <div className="text-[10px] font-semibold text-white">{t.title}</div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}