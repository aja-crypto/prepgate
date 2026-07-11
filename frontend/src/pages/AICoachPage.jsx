import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import { computeSubjectCompletion, computeReadinessScore } from '../utils/gateUtils';
import { buildAiContext } from '../utils/aiContextBuilder';
import useAiStreaming from '../hooks/useAiStreaming';
import useAiCache from '../hooks/useAiCache';
import useConversation from '../hooks/useConversation';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import GateNexaAIIcon from '../components/ui/GateNexaAIIcon';

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

export default function AICoachPage() {
  const { topics, pyqs, mocks, studyStats, gateFeatures, user } = useProgress();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState('chat');
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const welcomeSent = useRef(false);

  const { startStream, stopStream, streaming, partialText, error: streamErr } = useAiStreaming();
  const cache = useAiCache();
  const conversation = useConversation('mentor');
  const [statusText, setStatusText] = useState('Thinking');
  const [responseTime, setResponseTime] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const streamStartRef = useRef(null);
  const statusIntervalRef = useRef(null);

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
    const timer = setTimeout(() => {
      const name = user?.name?.split(' ')[0] || 'Aspirant';
      const wh = studyStats?.weeklyHours || [];
      const yesterday = wh[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || 0;
      const greet = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
      const weak = weakestSubject;
      const targets = [];
      if (weak) targets.push(`📚 **${weak.name}** — ${Math.round(weak.progress)}% complete`);
      if (avgMock > 0) targets.push(`🎯 Mock target: ${Math.min(100, avgMock + 5)}%`);
      targets.push(`📄 Solve 5+ PYQs today`);
      const estHrs = targets.length * 1.5;
      const now = new Date();
      now.setHours(now.getHours() + Math.ceil(estHrs));
      const estTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const text = `${greet}, ${name}! 👋
You studied **${yesterday}h** yesterday${yesterday >= 4 ? ' — 🔥 Great consistency!' : yesterday > 0 ? ' — good effort!' : ' — let\'s start strong!'}

**Today's Goals:**
${targets.map(t => `☐ ${t}`).join('\n')}

⏰ Estimated completion: **${estTime}**

I'm your study companion. Ask me about study plans, PYQs, subjects, or motivation!`;
      setMessages([{ role: 'assistant', text, companion: true }]);
    }, 400);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, partialText]);

  const handleSend = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!input.trim() || streaming) return;
    const msg = input.trim();
    setInput('');
    setResponseTime(null);
    streamStartRef.current = performance.now();
    conversation.addUserMessage(msg);
    setMessages((m) => [...m, { role: 'user', text: msg }]);

    let phaseIdx = 0;
    statusIntervalRef.current = setInterval(() => {
      const phases = ['Thinking', 'Searching', 'Generating', 'Streaming'];
      phaseIdx = (phaseIdx + 1) % phases.length;
      setStatusText(phases[phaseIdx]);
    }, 2000);

    const cached = cache.getCached(msg);
    if (cached) {
      clearInterval(statusIntervalRef.current);
      conversation.addAssistantMessage(cached.text);
      setMessages((m) => [...m, { role: 'assistant', text: cached.text, source: 'cache' }]);
      if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));
      return;
    }

    const ctx = buildAiContext({ topics, pyqs, mocks, gateFeatures, studyStats });
    ctx.history = conversation.getHistoryForContext();

    const result = await startStream(msg, ctx, conversation.sessionId);
    clearInterval(statusIntervalRef.current);
    if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));

    if (result?.text) {
      conversation.addAssistantMessage(result.text);
      cache.setCached(msg, { text: result.text, suggestions: result.suggestions });
      setMessages((m) => [...m, { role: 'assistant', text: result.text, source: result.source || 'provider' }]);
    } else if (!streaming) {
      const fallback = "Unable to connect to GateNexa AI. Please try again in a moment.";
      setMessages((m) => [...m, { role: 'assistant', text: fallback, source: 'error' }]);
    }
  }, [input, streaming, topics, pyqs, mocks, gateFeatures, studyStats, startStream, cache, conversation]);

  const handleStop = useCallback(() => {
    stopStream();
    if (partialText) {
      conversation.addAssistantMessage(partialText);
      cache.setCached(messages[messages.length - 1]?.text, { text: partialText, suggestions: null });
      setMessages((m) => [...m, { role: 'assistant', text: partialText }]);
    }
  }, [partialText, stopStream, cache, conversation, messages]);

  const loading = streaming;

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
                {messages.length === 0 && !loading && (
                  <div className="flex items-center justify-center h-full py-16">
                    <div className="text-center">
                      <div className="w-10 h-10 border-2 border-white/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-text3">Preparing your companion...</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
                  const displayText = isLastAssistant && streaming ? partialText || msg.text : msg.text;
                  return (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.companion ? (
                        <div className="w-full p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(139,92,246,0.15)' }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))' }}>👋</div>
                            <div>
                              <div className="text-sm font-bold text-text">Study Companion</div>
                              <div className="text-[10px] text-text3">Always here to help</div>
                            </div>
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-line text-text [&_strong]:text-primary">
                            {msg.text.split(/(\*\*.+?\*\*)/g).map((part, j) =>
                              part.startsWith('**') ? (
                                <strong key={j}>{part.slice(2, -2)}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : ''}`} style={msg.role === 'assistant' ? { background: 'rgba(139,92,246,0.12)' } : {}}>
                            {msg.role === 'user' ? (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                            ) : (
                              <GateNexaAIIcon size={20} thinking={streaming && isLastAssistant} />
                            )}
                          </div>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/[0.03] border border-white/[0.06] rounded-tl-none'}`}>
                            {msg.role === 'assistant' && !streaming && msg.source && msg.source !== 'thinking' && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{
                                  background: (msg.source === 'cache' ? '#4f8dff' : msg.source === 'error' ? '#f87171' : '#06d6a0') + '20',
                                  color: msg.source === 'cache' ? '#4f8dff' : msg.source === 'error' ? '#f87171' : '#06d6a0',
                                  border: '1px solid ' + (msg.source === 'cache' ? '#4f8dff' : msg.source === 'error' ? '#f87171' : '#06d6a0') + '30',
                                }}>
                                  {msg.source === 'cache' ? 'Cached' : msg.source === 'error' ? 'Error' : 'AI'}
                                </span>
                                {responseTime != null && isLastAssistant && (
                                  <span className="text-[8px] text-text3">{responseTime}s</span>
                                )}
                              </div>
                            )}
                            {msg.role === 'user' ? (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{displayText}</span>
                            ) : (
                              <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={{
                                pre({ children }) { return <pre className="overflow-x-auto rounded-xl text-[12px] leading-relaxed my-2 p-3" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>{children}</pre>; },
                                code({ inline, className, children, ...props }) {
                                  if (inline) return <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd' }} {...props}>{children}</code>;
                                  return <code className={className} {...props}>{children}</code>;
                                },
                                a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#22d3ee' }}>{children}</a>; },
                                ul({ children }) { return <ul className="list-disc ml-4 space-y-1 my-1">{children}</ul>; },
                                ol({ children }) { return <ol className="list-decimal ml-4 space-y-1 my-1">{children}</ol>; },
                                blockquote({ children }) { return <blockquote className="border-l-2 my-2 pl-3 italic" style={{ borderColor: 'rgba(139,92,246,0.3)', color: 'rgba(255,255,255,0.5)' }}>{children}</blockquote>; },
                                h1({ children }) { return <h1 className="text-base font-bold mt-3 mb-1 text-text">{children}</h1>; },
                                h2({ children }) { return <h2 className="text-sm font-bold mt-3 mb-1 text-text">{children}</h2>; },
                                h3({ children }) { return <h3 className="text-xs font-bold mt-2 mb-1 text-text">{children}</h3>; },
                                p({ children }) { return <p className="my-1 leading-relaxed">{children}</p>; },
                              }}>{displayText}</ReactMarkdown>
                            )}
                            {streaming && isLastAssistant && (
                              <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse align-middle" style={{ background: '#A78BFA' }} />
                            )}
                            {msg.role === 'assistant' && !streaming && msg.source && msg.source !== 'thinking' && displayText && (
                              <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                <button onClick={() => navigator.clipboard.writeText(displayText)}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4 2a2 2 0 012-2h4a2 2 0 012 2v1H4V2z"/><path fillRule="evenodd" d="M2 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0h8v10H4V4z"/></svg>
                                  Copy
                                </button>
                                {msg.source === 'error' && (
                                  <button onClick={() => handleSend(messages[i-1]?.text || '')}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-red-500/10" style={{ color: '#f87171' }}>
                                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 100 10A5 5 0 008 3zM4 8a4 4 0 118 0 4 4 0 01-8 0z"/><path d="M8 4.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zM8 9a.5.5 0 100 1 .5.5 0 000-1z"/></svg>
                                    Retry
                                  </button>
                                )}
                                {msg.source !== 'error' && msg.source !== 'thinking' && isLast && (
                                  <button onClick={() => handleSend(messages[i-1]?.text || input)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                                    Regenerate
                                  </button>
                                )}
                                <button onClick={() => setThumbs(prev => ({ ...prev, [i]: prev[i] === 'up' ? null : 'up' }))}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5"
                                  style={{ color: thumbs[i] === 'up' ? '#22d3ee' : 'rgba(255,255,255,0.25)' }}>
                                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
                                </button>
                                <button onClick={() => setThumbs(prev => ({ ...prev, [i]: prev[i] === 'down' ? null : 'down' }))}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5"
                                  style={{ color: thumbs[i] === 'down' ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" style={{ transform: 'scaleY(-1)' }}><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {streaming && !partialText && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{statusText}</span>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-white/5">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your AI Mentor..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-colors" />
                <button
                  type="submit"
                  disabled={!input.trim() && !streaming}
                  onClick={streaming ? (e) => { e.preventDefault(); handleStop(); } : undefined}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white"
                  style={streaming ? { background: 'rgba(248,113,113,0.2)' } : { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                >
                  {streaming ? 'Stop' : 'Send'}
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
