import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { aiService } from '../../services/api';
import GateNexaAIIcon from '../ui/GateNexaAIIcon';
import Icon from '../ui/Icon';


function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-3 mb-1">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-purple-500/30 pl-3 italic my-1">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n{2,}/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (m) => {
    const tag = m.match(/class="ml-4 list-disc"/) ? 'ul' : 'ol';
    return `<${tag} class="my-1">${m}</${tag}>`;
  });
  return html;
}

const QUICK_ACTIONS = [
  { label: 'Make Study Plan', prompt: 'Create a personalized 30-day GATE study plan based on my weak subjects', icon: 'calendar' },
  { label: 'Analyze Weaknesses', prompt: 'Analyze my weak subjects and topics, suggest improvement strategy', icon: 'alert-triangle' },
  { label: 'Predict Rank', prompt: 'Predict my expected GATE rank based on current progress and mock scores', icon: 'trophy' },
  { label: 'Generate Revision Schedule', prompt: 'Create a weekly revision schedule covering all subjects with priority weighting', icon: 'rotate-cw' },
  { label: 'Explain PYQ', prompt: 'Explain a PYQ concept - I will provide the question', icon: 'file-text' },
];

const WELCOME_SUGGESTIONS = [
  "What should I study today?",
  "Create a 30-day GATE plan",
  "How to prepare for GATE 2027?",
  "Which subjects should I prioritize?",
  "How are GATE toppers studying?",
];

const TOPIC_BASED_SUGGESTIONS = {
  default: [
    "Tell me a joke",
    "Who is Virat Kohli?",
    "Explain CPU scheduling",
    "What is deadlock in OS?",
    "Best resources for GATE CS?",
  ],
};

export default function FloatingAIAssistant({ open, setOpen, inline = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const chatEnd = useRef(null);
  const elRef = useRef(null);
  const navigate = useNavigate();

  const ds = useRef({ x: 0, y: 0, ox: 0, oy: 0, moved: false, dragging: false });
  const { user } = useAuth();
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();

  const weakSubjects = (() => {
    if (!topics?.length || !pyqs?.length) return [];
    const subjectAccuracy = {};
    pyqs.forEach(p => {
      if (!subjectAccuracy[p.subject]) subjectAccuracy[p.subject] = { correct: 0, total: 0 };
      subjectAccuracy[p.subject].total++;
      if (p.isCorrect) subjectAccuracy[p.subject].correct++;
    });
    return Object.entries(subjectAccuracy)
      .filter(([, d]) => d.total >= 3 && (d.correct / d.total) < 0.6)
      .map(([s]) => s);
  })();

  const strongSubjects = (() => {
    if (!topics?.length || !pyqs?.length) return [];
    const subjectAccuracy = {};
    pyqs.forEach(p => {
      if (!subjectAccuracy[p.subject]) subjectAccuracy[p.subject] = { correct: 0, total: 0 };
      subjectAccuracy[p.subject].total++;
      if (p.isCorrect) subjectAccuracy[p.subject].correct++;
    });
    return Object.entries(subjectAccuracy)
      .filter(([, d]) => d.total >= 3 && (d.correct / d.total) >= 0.75)
      .map(([s]) => s);
  })();

  const overallProgress = topics?.length
    ? Math.round(topics.reduce((s, t) => s + (t.completed ? 100 : 0), 0) / topics.length)
    : 0;
  const avgMock = mocks?.length ? Math.round(mocks.reduce((s, m) => s + (m.score || 0), 0) / mocks.length) : 0;
  const streak = gateFeatures?.streak?.current || 0;

  useEffect(() => {
    const saved = localStorage.getItem('gatenexa_ai_pos');
    if (!saved) return;
    const el = elRef.current;
    if (!el) return;
    const p = JSON.parse(saved);
    el.style.left = p.left + 'px';
    el.style.top = p.top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateSmartSuggestions = (userMessage, aiReply) => {
    const lower = (userMessage + ' ' + (aiReply || '')).toLowerCase();
    if (lower.includes('operating system') || lower.includes('os') || lower.includes('deadlock') || lower.includes('cpu') || lower.includes('scheduling') || lower.includes('memory')) {
      return [
        'What are the most important OS topics for GATE?',
        'Which OS PYQs should I solve first?',
        'How many days should I spend on OS?',
        'What mistakes do students make in OS prep?',
        'Create a revision plan for OS.',
      ];
    }
    if (lower.includes('topper') || lower.includes('study plan') || lower.includes('prepare') || lower.includes('strategy') || lower.includes('hours')) {
      return [
        'What is a realistic study plan for GATE 2027?',
        'How many hours should I study daily?',
        'Which subjects should I complete first?',
        'How do toppers revise effectively?',
        'What should I do in the last 3 months?',
      ];
    }
    if (lower.includes('subject') || lower.includes('priority') || lower.includes('weak') || lower.includes('topic')) {
      return [
        'Build a weekly schedule for me',
        'Create a subject order for GATE',
        'Plan revision cycles',
        'Analyze my weak subjects',
        'Generate a PYQ strategy',
      ];
    }
    if (lower.includes('joke') || lower.includes('kohli') || lower.includes('fun') || lower.includes('tell me')) {
      return [
        'Tell me another joke',
        'What is the best GATE strategy?',
        'How to stay motivated?',
        'Explain a GATE topic',
        'Give me a study tip',
      ];
    }
    return [
      'What should I study today?',
      'Create a weekly study plan',
      'Analyze my mock performance',
      'Which PYQs should I solve?',
      'How to improve my rank?',
    ];
  };

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput('');
    setLoading(true);
    setSuggestions(null);

const ctx = {
      weakSubjects,
      strongSubjects,
      weakTopics: (topics || []).slice(0, 5).map(t => t.name),
      overallProgress,
      mockAvg,
      streak,
      overdueTopics: (pyqs || []).filter(p => p.revisionNeeded).length,
      recentAccuracy: avgMock,
    };

    setMessages(prev => [...prev, { role: 'user', text: msg }]);

    const result = await aiService.askCoach(msg, ctx).catch(() => null);
    const reply = result?.data?.data?.text || null;

    if (!reply) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Unable to connect to GateNexa AI. Please try again in a moment." }]);
      setLoading(false);
      return;
    }

    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setSuggestions(generateSmartSuggestions(msg, reply));
    setLoading(false);
  };

  const snap = () => {
    const el = elRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const left = r.left + r.width / 2 < vw / 2;
    const nx = left ? 20 : vw - r.width - 20;
    const ny = Math.max(20, Math.min(r.top, window.innerHeight - r.height - 20));
    localStorage.setItem('gatenexa_ai_pos', JSON.stringify({ left: nx, top: ny }));
    el.style.transition = 'left 0.3s ease, top 0.3s ease';
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    setTimeout(() => { el.style.transition = ''; }, 300);
  };

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const getCoords = (e) => {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onDown = (e) => {
      const r = el.getBoundingClientRect();
      const coords = getCoords(e);
      ds.current.x = coords.x;
      ds.current.y = coords.y;
      ds.current.ox = r.left;
      ds.current.oy = r.top;
      ds.current.moved = false;
      ds.current.dragging = true;
      el.style.cursor = 'grabbing';
      el.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!ds.current.dragging) return;
      const coords = getCoords(e);
      const dx = coords.x - ds.current.x;
      const dy = coords.y - ds.current.y;
      if (!ds.current.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        ds.current.moved = true;
      }
      if (!ds.current.moved) return;
      el.style.left = (ds.current.ox + dx) + 'px';
      el.style.top = (ds.current.oy + dy) + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = 'none';
    };

    const onUp = () => {
      if (!ds.current.dragging) return;
      el.style.cursor = 'grab';
      if (ds.current.moved) snap();
      ds.current.dragging = false;
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('touchstart', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleClick = () => {
    if (ds.current.moved) return;
    setOpen((o) => !o);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-transparent md:pointer-events-none" onClick={() => setOpen(false)} />
      )}

      {/* Chat panel */}
      <div className={`chat-panel fixed z-50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`} style={{
        width: 'clamp(340px, 32vw, 480px)',
        maxWidth: 'calc(100vw - 32px)',
        right: '20px',
        bottom: 'calc(110px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(5,8,22,0.96)',
        border: '1px solid rgba(139,92,246,0.25)',
        boxShadow: '0 0 60px rgba(139,92,246,0.15)',
        backdropFilter: 'blur(24px)',
        maxHeight: 'min(680px, 85vh)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-3">
            <GateNexaAIIcon size={32} thinking={loading} />
            <div>
              <div className="text-sm font-bold text-white leading-tight">GateNexa AI</div>
              <div className="text-[9px] font-semibold" style={{ color: '#A855F7', letterSpacing: '0.5px' }}>
                Your Personal GATE Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setOpen(false); navigate('/ai-coach'); }} className="text-[10px] px-2 py-1 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}>
              Full Page
            </button>
            <button onClick={() => setOpen(false)} className="p-2.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: '400px' }}>
          {messages.length === 0 ? (
            <div className="text-center py-4">
              <GateNexaAIIcon size={48} className="mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold text-white mb-1">Welcome to GateNexa AI</p>
              <p className="text-xs text-gray-400 mb-4">Your Personal GATE Assistant</p>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed max-w-[90%] mx-auto">
                I can help with:<br />
                • Subject Planning<br />
                • PYQ Strategy<br />
                • Revision Schedules<br />
                • Mock Test Analysis<br />
                • GATE Preparation Guidance<br />
                • Resource Recommendations<br />
                • Study Plans
              </p>
              <p className="text-[11px] text-gray-500 mb-3">Quick actions:</p>
              <div className="flex flex-col gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} onClick={() => handleSend(action.prompt)}
                    className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    style={{ background: 'rgba(139,92,246,0.06)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.12)' }}>
                    <Icon name={action.icon} className="w-4 h-4" />
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3">Or ask me anything about GATE 2027.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : ''}`} style={msg.role === 'assistant' ? { background: 'rgba(139,92,246,0.12)' } : {}}>
                      {msg.role === 'user' ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary"><path fillRule="evenodd" d="M10 9a3 3 0 100-6a3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                      ) : (
                        <GateNexaAIIcon size={20} thinking={loading && i === messages.length - 1} />
                      )}
                    </div>
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' ? 'rounded-tr-none text-white' : 'rounded-tl-none text-gray-200'
                    }`} style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'rgba(255,255,255,0.04)',
                      border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? renderMarkdown(msg.text) : msg.text.replace(/\n/g, '<br>') }} />
                    </div>
                  </div>
                  {msg.role === 'assistant' && suggestions && i === messages.length - 1 && (
                    <div className="mt-3 ml-11">
                      <p className="text-[10px] font-medium text-gray-500 mb-2">Suggested Questions</p>
                      <div className="flex flex-col gap-1.5">
                        {suggestions.map((s, si) => (
                          <button key={si} onClick={() => handleSend(s)}
                            className="text-left text-[11px] px-3 py-2 rounded-lg transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(139,92,246,0.04)', color: '#9CA3AF', border: '1px solid rgba(139,92,246,0.08)' }}>
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
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: '#A78BFA', animation: 'aiLoadPulse 1s ease-in-out infinite' }} />
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>AI Thinking</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatEnd} />
        </div>

        {/* Input */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about GATE 2027..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/30 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H7a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          </form>
        </div>
      </div>

      {/* Draggable AI button */}
      <div className="ai-assistant-wrapper"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      >
        <div className="ai-shortcut">Ask GateNexa AI</div>
        <div ref={elRef} className="ai-assistant" onClick={handleClick}>
          <GateNexaAIIcon size={46} thinking={hover} />
        </div>
        {hover && (
          <div className="ai-tooltip">
            <div className="ai-tooltip-title">GateNexa AI</div>
            <div className="ai-tooltip-sub">Ask anything about GATE 2027</div>
          </div>
        )}
      </div>

      <style>{`
        .ai-assistant-wrapper {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
        }
        .ai-assistant {
          position: fixed;
          bottom: calc(30px + env(safe-area-inset-bottom, 0px));
          right: 30px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A855F7, #6366F1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          user-select: none;
          z-index: 99999;
          box-shadow: 0 0 20px rgba(168,85,247,0.35);
          transition: box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          touch-action: none;
          pointer-events: auto;
        }
        .ai-assistant:hover {
          box-shadow: 0 0 30px rgba(168,85,247,0.5), 0 0 50px rgba(168,85,247,0.2);
          transform: scale(1.08);
        }
        .ai-shortcut { display: none; }
        .ai-tooltip {
          position: absolute;
          right: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(5,8,22,0.95);
          border: 1px solid rgba(168,85,247,0.25);
          border-radius: 12px;
          padding: 10px 16px;
          white-space: nowrap;
          pointer-events: none;
          animation: tooltip-in 0.2s ease;
        }
        .ai-tooltip-title { color: #F8FAFC; font-size: 13px; font-weight: 700; line-height: 1.3; }
        .ai-tooltip-sub { color: #A78BFA; font-size: 11px; font-weight: 500; line-height: 1.3; margin-top: 1px; }
        @keyframes tooltip-in {
          from { opacity: 0; transform: translateY(-50%) translateX(6px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes aiLoadPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @media (max-width: 1024px) {
          .chat-panel { width: clamp(340px, 38vw, 420px); }
        }
        @media (max-width: 768px) {
          .chat-panel { width: 100%; right: 0; left: 0; bottom: 0; max-height: 80vh; border-radius: 20px 20px 0 0; }
        }
        @media (max-width: 639px) {
          .ai-assistant { width: 60px; height: 60px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); right: 20px; }
          .ai-tooltip { right: calc(100% + 10px); padding: 8px 12px; }
          .ai-tooltip-title { font-size: 12px; }
          .ai-tooltip-sub { font-size: 10px; }
        }
      `}</style>
    </>
  );
}


