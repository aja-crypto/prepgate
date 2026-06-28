import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { aiService, noteService } from '../../services/api';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';
import GateNexaAIIcon from '../ui/GateNexaAIIcon';
import BrandText from '../ui/BrandText';
import toast from 'react-hot-toast';

const WELCOME_SUGGESTIONS = [
  "Make Study Plan",
  "Analyze My Weaknesses",
  "Predict Rank",
  "Generate Revision Schedule",
  "Explain PYQ",
];

const generateSmartSuggestions = (userMessage, aiReply) => {
  const lower = (userMessage + ' ' + (aiReply || '')).toLowerCase();
  if (lower.includes('operating system') || lower.includes('os') || lower.includes('deadlock') || lower.includes('cpu') || lower.includes('scheduling') || lower.includes('memory')) {
    return ['What are the most important OS topics for GATE?', 'Which OS PYQs should I solve first?', 'How many days should I spend on OS?', 'Create a revision plan for OS.'];
  }
  if (lower.includes('topper') || lower.includes('study plan') || lower.includes('prepare') || lower.includes('strategy') || lower.includes('hours')) {
    return ['What is a realistic study plan for GATE 2027?', 'How many hours should I study daily?', 'Which subjects should I complete first?', 'What should I do in the last 3 months?'];
  }
  if (lower.includes('subject') || lower.includes('priority') || lower.includes('weak') || lower.includes('topic')) {
    return ['Build a weekly schedule for me', 'Create a subject order for GATE', 'Plan revision cycles', 'Analyze my weak subjects'];
  }
  return ['What should I study today?', 'Create a weekly study plan', 'Analyze my mock performance', 'Which PYQs should I solve?'];
};

const AI_COACH_STORAGE = 'gatenexa_ai_coach_chat';

function loadCoachHistory() {
  try {
    const raw = localStorage.getItem(AI_COACH_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const dayAgo = Date.now() - 86400000;
    return parsed.filter((m) => m.timestamp > dayAgo);
  } catch { return []; }
}

function saveCoachHistory(messages) {
  try {
    const recent = messages.slice(-50).map((m) => ({ ...m, timestamp: m.timestamp || Date.now() }));
    localStorage.setItem(AI_COACH_STORAGE, JSON.stringify(recent));
  } catch {}
}

function deriveLastTopic(messages) {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) return null;
  const content = lastAssistant.content.toLowerCase();
  const subjects = ['Operating Systems', 'Computer Networks', 'DBMS', 'Data Structures', 'Algorithms',
    'Computer Organization', 'TOC', 'Compiler Design', 'Digital Logic', 'Engineering Mathematics', 'Aptitude'];
  for (const s of subjects) {
    if (content.includes(s.toLowerCase())) return s;
  }
  if (content.includes('plan') || content.includes('schedule')) return 'study planning';
  if (content.includes('mock') || content.includes('test')) return 'mock tests';
  if (content.includes('pyq') || content.includes('previous year')) return 'PYQs';
  if (content.includes('weak') || content.includes('improve')) return 'weak subjects';
  return null;
}

export default function AICoachChat({ initialPrompt }) {
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const [messages, setMessages] = useState(() => {
    const saved = loadCoachHistory();
    return saved.length > 0 ? saved : [];
  });
  const [input, setFormInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [welcomeBack, setWelcomeBack] = useState(null);
  const scrollRef = useRef(null);
  const weeklyHours = Array.isArray(studyStats?.weeklyHours) ? studyStats.weeklyHours : [];
  const promptRef = useRef(initialPrompt);
  const loadedFromHistory = useRef(messages.length > 0);

  useEffect(() => {
    if (loadedFromHistory.current && messages.length > 0) {
      const lastTopic = deriveLastTopic(messages);
      const greeting = lastTopic
        ? `Welcome back! You were discussing **${lastTopic}** — want to continue or switch topics?`
        : 'Welcome back! Ready to continue your GATE preparation?';
      setWelcomeBack(greeting);
    }
  }, []);

  useEffect(() => {
    if (promptRef.current && messages.length === 0) {
      const prompt = promptRef.current;
      promptRef.current = null;
      handleSend(prompt);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) saveCoachHistory(messages);
  }, [messages]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setFormInput('');
    setLoading(true);
    setSuggestions(null);

    try {
      const overallProgress = Math.round((topics || []).filter(t => t.done).length / ((topics || []).length || 1) * 100);
      const mockAvg = (mocks || []).length > 0 ? Math.round((mocks || []).reduce((a, b) => a + (b.score || 0), 0) / (mocks || []).length) : 0;
      const weakSubjects = (studyStats?.subjects || []).filter(s => s.progress < 40).map(s => s.name);
      const strongSubjects = (studyStats?.subjects || []).filter(s => s.progress >= 70).map(s => s.name);
      const weakTopics = (topics || []).filter(t => !t.done).slice(0, 8).map(t => t.name);
      const overdueTopics = (pyqs || []).filter(p => p.revisionNeeded).length;
      const recentAccuracy = (pyqs || []).length
        ? Math.round(((pyqs || []).filter(p => p.status === 'correct' || p.solved).length / (pyqs || []).length) * 100)
        : 0;

      const res = await aiService.askCoach(messageText, {
        overallProgress,
        mockAvg,
        weakSubjects,
        strongSubjects,
        weakTopics,
        mockHistory: (mocks || []).slice(-5),
        overdueTopics,
        recentAccuracy,
        streak: gateFeatures?.streak?.current || 0,
        weeklyHours: weeklyHours.reduce((a, b) => a + b, 0)
      });

      if (res.data.success) {
        const reply = res.data.data.text;
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setSuggestions(res.data.data.suggestions?.length > 0 ? res.data.data.suggestions : generateSmartSuggestions(messageText, reply));
      } else {
        throw new Error(res.data.message || 'API Error');
      }
    } catch (error) {
      console.error('AI Coach Error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      let displayMsg = "Unable to connect to GateNexa AI. Please try again in a moment.";

      if (errorMsg?.includes('rate limit')) {
        displayMsg = "You're asking questions too fast! Please wait a moment.";
      } else if (error.code === 'ECONNABORTED') {
        displayMsg = "The request timed out. Please try again.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: displayMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-[400px] sm:h-[500px]" padding="p-0">
      <div className="p-4 border-b border-border flex items-center gap-3 bg-primary/5">
        <GateNexaAIIcon size={32} thinking={loading} />
        <div>
          <div className="text-sm font-bold text-text"><BrandText /> AI</div>
          <div className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Your Personal GATE Assistant
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <GateNexaAIIcon size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-white mb-1">Welcome to <BrandText /> AI</p>
            <p className="text-xs text-gray-400 mb-4">Your Personal GATE Assistant</p>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed max-w-[85%] mx-auto">
              I can help with:<br />
              • Subject Planning<br />
              • PYQ Strategy<br />
              • Revision Schedules<br />
              • Mock Test Analysis<br />
              • GATE Preparation Guidance
            </p>
            <p className="text-[11px] text-gray-500 mb-3">Ask me anything about GATE 2027.</p>
            <div className="grid grid-cols-2 gap-2 max-w-[90%] mx-auto">
              {WELCOME_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-center text-xs font-medium px-3 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.06))', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 0 15px rgba(139,92,246,0.1)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {welcomeBack && (
              <div className="flex justify-center mb-3 animate-fade-in">
                <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-text2 text-center max-w-[90%]">
                  {welcomeBack.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
                  )}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-bg-3 text-text2 border border-border rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={async () => {
                      try {
                        await noteService.create({ title: `AI: ${msg.content.slice(0, 50)}...`, content: msg.content, type: 'ai-response' });
                        toast.success('Saved to Notes');
                      } catch { toast.error('Failed to save'); }
                    }}
                    className="ml-2 mt-1 text-[9px] text-text3 hover:text-primary transition-colors"
                  >
                    Save to Notes
                  </button>
                )}
                {msg.role === 'assistant' && suggestions && i === messages.length - 1 && (
                  <div className="mt-2 ml-2">
                    <p className="text-[10px] font-medium text-gray-500 mb-1.5">Suggested Questions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s, si) => (
                        <button key={si} onClick={() => handleSend(s)}
                          className="text-[10px] bg-bg-2 hover:bg-bg-3 border border-border px-2 py-1 rounded-lg text-text3 hover:text-text transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-bg-3 border border-border p-3 rounded-2xl rounded-tl-none">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#A78BFA' }} />
                    <span className="text-[8px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>AI Thinking</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setFormInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about GATE 2027..."
            className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Icon name="chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

