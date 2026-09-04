import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useAuthData, useAuthActions } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { useFocus, useFocusTimer } from '../../context/FocusContext';
import useAiStreaming from '../../hooks/useAiStreaming';
import useAiCache from '../../hooks/useAiCache';
import useConversation from '../../hooks/useConversation';
import GateNexaAIIcon from '../ui/GateNexaAIIcon';
import Icon from '../ui/Icon';
import AiLimitBadge from '../referral/AiLimitBadge';
import AiModeSelector from './AiModeSelector';
import useAiMode from '../../hooks/useAiMode';
import { buildModePrompt } from '../../utils/aiModePrompts';

const STORAGE_KEY_POS = 'gatenexa_ai_pos';
const STORAGE_KEY_SIZE = 'gatenexa_ai_size';
const STORAGE_KEY_FAB_POS = 'gatenexa_ai_fab_pos';

const DEFAULT_W = 560;
const DEFAULT_H = 720;
const MIN_W = 520;
const MIN_H = 680;

const SUGGESTION_PRESETS = [
  'Explain Deadlock',
  'Create a DBMS study plan',
  'Predict my GATE Rank',
  'Generate a mock test',
  'Explain CPU Scheduling',
  'Revision strategy',
];

const STATUS_PHRASES = [
  { match: /think|analyze|consider|evaluat/i, text: 'Thinking' },
  { match: /search|lookup|find|retriev/i, text: 'Searching' },
  { match: /generat|creat|build|craft/i, text: 'Generating' },
  { match: /stream|respond|writ/i, text: 'Streaming' },
  { match: /./, text: 'Thinking' },
];

const badgeConf = {
  provider: { label: 'Live AI', color: '#06d6a0', dot: '#06d6a0' },
  cache: { label: 'Cached', color: '#4f8dff', dot: '#4f8dff' },
  heuristic: { label: 'Offline AI', color: '#ff9f43', dot: '#ff9f43' },
  offline: { label: 'Offline AI', color: '#ff9f43', dot: '#ff9f43' },
  error: { label: 'Error', color: '#f87171', dot: '#f87171' },
  thinking: { label: '...', color: '#a78bfa', dot: '#a78bfa' },
  aborted: { label: 'Stopped', color: '#fbbf24', dot: '#fbbf24' },
  quota: { label: 'Limit Reached', color: '#f87171', dot: '#f87171' },
  ollama: { label: 'Ollama', color: '#38bdf8', dot: '#38bdf8' },
  openai: { label: 'OpenAI', color: '#a78bfa', dot: '#a78bfa' },
  openrouter: { label: 'Nexa AI', color: '#f97316', dot: '#f97316' },
  dashscope: { label: 'DashScope', color: '#22d3ee', dot: '#22d3ee' },
  ai: { label: 'Live AI', color: '#06d6a0', dot: '#06d6a0' },
};

function sourceBadgeKey(source, provider) {
  if (source === 'heuristic') return 'heuristic';
  if (source === 'offline') return 'offline';
  if (source === 'ai' || source === 'provider') {
    if (provider === 'OpenRouter') return 'openrouter';
    if (provider === 'OpenAI') return 'openai';
    if (provider === 'Ollama') return 'ollama';
    if (provider === 'DashScope') return 'dashscope';
    return 'provider';
  }
  return source || 'provider';
}

function MarkdownContent({ text }) {
  if (!text || typeof text !== 'string') return null;
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre({ children }) {
          return <pre className="overflow-x-auto rounded-xl text-[12px] leading-relaxed my-2 p-3" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>{children}</pre>;
        },
        code({ inline, className, children, ...props }) {
          if (inline) return <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd' }} {...props}>{children}</code>;
          return <code className={className} {...props}>{children}</code>;
        },
        table({ children }) {
          return <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>{children}</table></div>;
        },
        th({ children }) {
          return <th className="px-3 py-2 text-left font-bold text-text" style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{children}</th>;
        },
        td({ children }) {
          return <td className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>{children}</td>;
        },
        a({ href, children }) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#22d3ee' }}>{children}</a>;
        },
        ul({ children }) {
          return <ul className="list-disc ml-4 space-y-1 my-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal ml-4 space-y-1 my-1">{children}</ol>;
        },
        blockquote({ children }) {
          return <blockquote className="border-l-2 my-2 pl-3 italic" style={{ borderColor: 'rgba(139,92,246,0.3)', color: 'rgba(255,255,255,0.5)' }}>{children}</blockquote>;
        },
        h1({ children }) { return <h1 className="text-base font-bold mt-3 mb-1 text-text">{children}</h1>; },
        h2({ children }) { return <h2 className="text-sm font-bold mt-3 mb-1 text-text">{children}</h2>; },
        h3({ children }) { return <h3 className="text-xs font-bold mt-2 mb-1 text-text">{children}</h3>; },
        p({ children }) { return <p className="my-1 leading-relaxed">{children}</p>; },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function StatusBadge({ source, provider }) {
  const key = sourceBadgeKey(source, provider);
  const cfg = badgeConf[key] || badgeConf.provider;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ background: cfg.color + '20', color: cfg.color, border: '1px solid ' + cfg.color + '30' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function OfflineDetails({ offlineInfo, onClose }) {
  const [show, setShow] = useState(false);
  if (!offlineInfo) return null;
  const ts = offlineInfo.ts ? new Date(offlineInfo.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const status = offlineInfo.status != null ? offlineInfo.status : '—';
  const statusLabel = offlineInfo.status === 429 ? 'Rate limited' : '—';
  const reason = offlineInfo.reason || 'Live AI is temporarily unavailable.';
  const shortReason = reason.length > 60 ? reason.slice(0, 57) + '…' : reason;
  return (
    <div className="mt-1.5 rounded-lg px-2 py-1.5 text-[10px]" style={{ background: 'rgba(255,159,67,0.06)', border: '1px solid rgba(255,159,67,0.18)' }}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff9f43' }} />
        <span className="font-semibold" style={{ color: '#ff9f43' }}>Offline AI</span>
        <span className="flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{shortReason}</span>
        <button
          onClick={() => setShow(v => !v)}
          className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {show ? 'Hide' : 'Details'}
        </button>
      </div>
      {show && (
        <div className="mt-1.5 pt-1.5 border-t space-y-0.5" style={{ borderColor: 'rgba(255,159,67,0.15)' }}>
          <div className="flex justify-between gap-3"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Provider</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{offlineInfo.provider || '—'}</span></div>
          <div className="flex justify-between gap-3"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Model</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{offlineInfo.model || '—'}</span></div>
          <div className="flex justify-between gap-3"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Status</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{status}{statusLabel !== '—' ? ` (${statusLabel})` : ''}</span></div>
          <div className="flex justify-between gap-3"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Fallback reason</span><span style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>{reason}</span></div>
          <div className="flex justify-between gap-3"><span style={{ color: 'rgba(255,255,255,0.4)' }}>Time</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{ts}</span></div>
          {offlineInfo.detail && (
            <div className="mt-1 pt-1 border-t" style={{ borderColor: 'rgba(255,159,67,0.12)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)' }}>Detail</div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }} className="break-words">{offlineInfo.detail}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypingIndicator({ statusText }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0s' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.15s' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.3s' }} />
      </div>
      <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{statusText}</span>
    </div>
  );
}

function ResizeHandle({ direction, onResizeStart }) {
  const dirStyles = {
    n: { top: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
    s: { bottom: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
    e: { right: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
    w: { left: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
    ne: { top: -3, right: -3, width: 16, height: 16, cursor: 'nesw-resize' },
    nw: { top: -3, left: -3, width: 16, height: 16, cursor: 'nwse-resize' },
    se: { bottom: -3, right: -3, width: 16, height: 16, cursor: 'nwse-resize' },
    sw: { bottom: -3, left: -3, width: 16, height: 16, cursor: 'nesw-resize' },
  };
  const s = dirStyles[direction] || dirStyles.se;
  return (
    <div
      className="absolute z-50"
      style={s}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onResizeStart(direction, e); }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onResizeStart(direction, e); }}
    />
  );
}

function ChatMessage({ msg, isLast, streaming, partialText, responseTime, onSend, onThumbs }) {
  const isUser = msg.role === 'user';
  const isLastAssistant = msg.role === 'assistant' && isLast;
  const displayText = isLastAssistant && streaming ? partialText || msg.text : msg.text;
  const source = msg.source || 'provider';
  const cached = msg.cached;
  const isOffline = source === 'heuristic' || source === 'offline';
  const showCaret = streaming && isLastAssistant && !isOffline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mb-3"
    >
      <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={isUser ? { background: 'rgba(139,92,246,0.15)' } : { background: 'rgba(139,92,246,0.1)' }}
        >
          {isUser ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-primary"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
          ) : (
            <GateNexaAIIcon size={20} thinking={streaming && isLastAssistant} />
          )}
        </div>
        <div
          className={`max-w-[85%] rounded-2xl text-[13px] leading-relaxed ${
            isUser ? 'rounded-tr-none' : 'rounded-tl-none'
          }`}
          style={isUser ? {
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            padding: '8px 14px',
            color: '#fff',
          } : {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '8px 12px',
            color: 'var(--color-text2)',
          }}
        >
          {!isUser && !streaming && source !== 'thinking' && (
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge source={source} provider={msg.provider} />
              {cached && <span className="text-[8px] text-text3 uppercase tracking-wider">Cached</span>}
              {responseTime != null && (
                <span className="text-[8px] text-text3">{responseTime}s</span>
              )}
            </div>
          )}
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownContent text={displayText} />
            </div>
          )}
          {showCaret && (
            <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse align-middle" style={{ background: '#A78BFA' }} />
          )}
          {!isUser && !streaming && source !== 'thinking' && displayText && (
            <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <button onClick={() => navigator.clipboard.writeText(displayText)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4 2a2 2 0 012-2h4a2 2 0 012 2v1H4V2z"/><path fillRule="evenodd" d="M2 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0h8v10H4V4z"/></svg>
                Copy
              </button>
              {source === 'error' && (
                <button onClick={() => onSend(msg.text)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-red-500/10" style={{ color: '#f87171' }}>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 100 10A5 5 0 008 3zM4 8a4 4 0 118 0 4 4 0 01-8 0z"/><path d="M8 4.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zM8 9a.5.5 0 100 1 .5.5 0 000-1z"/></svg>
                  Retry
                </button>
              )}
              {source !== 'error' && source !== 'thinking' && isLast && (
                <button onClick={() => onSend(msg.text)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                  Regenerate
                </button>
              )}
              <button onClick={() => onThumbs(msg.id, 'up')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: msg.thumbs === 'up' ? '#22d3ee' : 'rgba(255,255,255,0.25)' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
              </button>
              <button onClick={() => onThumbs(msg.id, 'down')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: msg.thumbs === 'down' ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" style={{ transform: 'scaleY(-1)' }}><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
              </button>
            </div>
          )}
          {!isUser && !streaming && source !== 'thinking' && isOffline && (
            <OfflineDetails offlineInfo={msg.offlineInfo} />
          )}
        </div>
      </div>
    </motion.div>
  );
}



export default function FloatingAIAssistant({ open, setOpen, inline = false }) {
  const navigate = useNavigate();
  const { user, aiQuestionsRemaining, aiQuestionLimit, isPremium } = useAuthData();
  const { setAiQuestionsRemaining, setAiQuestionLimit: setLimit, setShowReferralModal, refreshReferralStatus, refreshAiQuota, decrementAiQuestions } = useAuthActions();
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const { isActive, isPaused, mode, startSession, pauseSession, resumeSession, stopSession, selectDuration, formatTime, DURATIONS } = useFocus();
  const { timeRemaining } = useFocusTimer();
  const { startStream, stopStream, streaming, partialText, error: streamError } = useAiStreaming();
  const cache = useAiCache();
  const { messages: conversationMessages, addUserMessage, addAssistantMessage, clearHistory, getHistoryForContext, lastTopic, isFollowUpQuery, sessionId: conversationSessionId, updateSessionId } = useConversation('floating');
  const { mode: aiMode, setMode: setAiMode, current: currentAiMode } = useAiMode();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [statusText, setStatusText] = useState('Thinking');
  const [responseTime, setResponseTime] = useState(null);
  const [hover, setHover] = useState(false);

  const popupRef = useRef(null);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const streamStartRef = useRef(null);
  const msgIdCounter = useRef(0);
  const statusIntervalRef = useRef(null);
  const lastUserMsgRef = useRef('');
  const activeAssistantIdRef = useRef(null);
  const placeholderFinalizedRef = useRef(false);

  const [popupPos, setPopupPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [popupSize, setPopupSize] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIZE);
      return saved ? JSON.parse(saved) : { w: DEFAULT_W, h: DEFAULT_H };
    } catch { return { w: DEFAULT_W, h: DEFAULT_H }; }
  });
  const [fabPos, setFabPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAB_POS);
      if (!saved) return null;
      const pos = JSON.parse(saved);
      if (typeof pos.left !== 'number' || typeof pos.top !== 'number') return null;
      if (pos.left < 0 || pos.top < 0 || pos.left > window.innerWidth || pos.top > window.innerHeight) {
        localStorage.removeItem(STORAGE_KEY_FAB_POS);
        return null;
      }
      return pos;
    } catch { return null; }
  });
  const fabRef = useRef(null);
  const fabControls = useAnimationControls();

  const w = Math.max(MIN_W, popupSize.w);
  const h = Math.max(MIN_H, popupSize.h);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify({ w, h }));
  }, [w, h]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const weakSubjects = useMemo(() => {
    if (!pyqs?.length) return [];
    const acc = {};
    pyqs.forEach(p => {
      if (!acc[p.subject]) acc[p.subject] = { correct: 0, total: 0 };
      acc[p.subject].total++;
      if (p.isCorrect) acc[p.subject].correct++;
    });
    return Object.entries(acc).filter(([, d]) => d.total >= 3 && d.correct / d.total < 0.6).map(([s]) => s);
  }, [pyqs]);

  const strongSubjects = useMemo(() => {
    if (!pyqs?.length) return [];
    const acc = {};
    pyqs.forEach(p => {
      if (!acc[p.subject]) acc[p.subject] = { correct: 0, total: 0 };
      acc[p.subject].total++;
      if (p.isCorrect) acc[p.subject].correct++;
    });
    return Object.entries(acc).filter(([, d]) => d.total >= 3 && d.correct / d.total >= 0.75).map(([s]) => s);
  }, [pyqs]);

  const overallProgress = useMemo(() => topics?.length ? Math.round(topics.reduce((s, t) => s + (t.completed ? 100 : 0), 0) / topics.length) : 0, [topics]);
  const avgMock = useMemo(() => mocks?.length ? Math.round(mocks.reduce((s, m) => s + (m.score || 0), 0) / mocks.length) : 0, [mocks]);
  const streak = gateFeatures?.streak?.current || studyStats?.streak?.current || 0;

  // Real weak topics: derived from PYQ accuracy, falling back to flagged topics
  const weakTopics = useMemo(() => {
    if (!pyqs?.length) {
      return (topics || []).filter(t => t.markedDifficult || t.revisionNeeded).slice(0, 5).map(t => t.name)
        || (topics || []).slice(0, 5).map(t => t.name);
    }
    const acc = {};
    pyqs.forEach(p => {
      const key = p.topic || p.name;
      if (!key) return;
      acc[key] = acc[key] || { correct: 0, total: 0 };
      acc[key].total++;
      if (p.isCorrect) acc[key].correct++;
    });
    return Object.entries(acc)
      .filter(([, d]) => d.total >= 2 && d.correct / d.total < 0.6)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 5)
      .map(([name]) => name);
  }, [pyqs, topics]);

  const recentAccuracy = useMemo(() => {
    if (!pyqs?.length) return 0;
    const correct = pyqs.filter(p => p.isCorrect).length;
    return Math.round((correct / pyqs.length) * 100);
  }, [pyqs]);

  const buildContext = useCallback((userMessage) => {
    const base = {
      weakSubjects,
      strongSubjects,
      weakTopics,
      overallProgress,
      mockAvg: avgMock,
      streak,
      overdueTopics: (pyqs || []).filter(p => p.revisionNeeded).length || (topics || []).filter(t => t.revisionNeeded).length,
      recentAccuracy,
      studyStats,
      dailyTargetHours: gateFeatures?.dailyTarget?.hours || 8,
      studyHoursToday: studyStats?.todayHours || 0,
      studyHoursWeek: studyStats?.weekHours || 0,
      history: getHistoryForContext(),
    };
    const ctx = {
      ...base,
      mode: aiMode,
      lastTopic: isFollowUpQuery(userMessage) ? lastTopic() : null,
    };
    return ctx;
  }, [weakSubjects, strongSubjects, weakTopics, avgMock, streak, pyqs, topics, studyStats, gateFeatures, recentAccuracy, conversationSessionId, aiMode]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partialText]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setResponseTime(null);
      setStatusText('Thinking');
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    const onCloseAI = () => setOpen(false);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('close-ai', onCloseAI);
    return () => {
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('close-ai', onCloseAI);
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      const el = popupRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const trap = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      };
      el.addEventListener('keydown', trap);
      return () => el.removeEventListener('keydown', trap);
    }
  }, [open]);

  const generateSmartSuggestions = useCallback((userMessage, aiReply) => {
    const lower = (userMessage + ' ' + (aiReply || '')).toLowerCase();
    const map = [
      { match: /operating system|os|deadlock|cpu|scheduling|memory/, suggestions: ['Important OS topics for GATE?', 'Which OS PYQs first?', 'Days needed for OS?', 'OS prep mistakes?'] },
      { match: /topper|study plan|prepare|strategy|hours/, suggestions: ['Realistic study plan?', 'Daily hours target?', 'Subject completion order?', 'Last 3 months plan?'] },
      { match: /subject|priority|weak|topic/, suggestions: ['Weekly schedule', 'Subject order', 'Revision cycles', 'Weak subject analysis'] },
      { match: /joke|fun|tell me|kohli/, suggestions: ['Tell me another joke', 'GATE strategy', 'Motivation tips', 'GATE topic explain'] },
    ];
    for (const { match, suggestions: s } of map) {
      if (match.test(lower)) return s;
    }
    return ['What should I study today?', 'Weekly study plan', 'Mock performance analysis', 'Which PYQs?', 'Improve rank?'];
  }, []);

  const handleThumbs = useCallback((msgId, type) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, thumbs: m.thumbs === type ? null : type } : m));
  }, []);

  const handleSend = useCallback(async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim() || streaming) return;

    if (user?.role !== 'admin' && !isPremium && aiQuestionsRemaining !== null && aiQuestionsRemaining <= 0) {
      setShowReferralModal(true);
      setInput('');
      const id = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `u-${id}`, role: 'user', text: userMsg }]);
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', text: "You have reached today's AI question limit. Upgrade to continue learning with AI.", source: 'quota', cached: false, thumbs: null }]);
      return;
    }
    lastUserMsgRef.current = userMsg;
    setInput('');
    setSuggestions(null);
    setResponseTime(null);
    streamStartRef.current = performance.now();

    const id = ++msgIdCounter.current;
    addUserMessage(userMsg);
    setMessages(prev => [...prev, { id: `u-${id}`, role: 'user', text: userMsg }]);

    const ctx = buildContext(userMsg);
    ctx.modePrompt = buildModePrompt(aiMode, ctx);
    setStatusText('Thinking');

    let phaseIdx = 0;
    statusIntervalRef.current = setInterval(() => {
      const phases = ['Thinking', 'Searching', 'Generating', 'Streaming'];
      phaseIdx = (phaseIdx + 1) % phases.length;
      setStatusText(phases[phaseIdx]);
    }, 2000);

    const cached = cache.getCached(userMsg, aiMode);
    if (cached) {
      clearInterval(statusIntervalRef.current);
      addAssistantMessage(cached.text);
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', text: cached.text, source: 'cache', cached: true, thumbs: null }]);
      if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));
      setSuggestions(cached.suggestions?.length > 0 ? cached.suggestions : generateSmartSuggestions(userMsg, cached.text));
      setStatusText('Thinking');
      return;
    }

    // ── Add placeholder assistant message immediately so streaming UI has something to render ──
    const aid = ++msgIdCounter.current;
    const placeholderId = `a-${aid}`;
    activeAssistantIdRef.current = placeholderId;
    placeholderFinalizedRef.current = false;
    setMessages(prev => [...prev, { id: placeholderId, role: 'assistant', text: '', source: 'thinking', cached: false, thumbs: null }]);

    const result = await startStream(userMsg, ctx, conversationSessionId);

    if (result?.conversationId) updateSessionId(result.conversationId);

    clearInterval(statusIntervalRef.current);
    if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));

    if (placeholderFinalizedRef.current) {
      activeAssistantIdRef.current = null;
      setStatusText('Thinking');
      return;
    }

    if (result?.quotaExceeded) {
      const quotaText = !isPremium ? "You have reached today's AI question limit. Upgrade to continue learning with AI." : "You have reached today's AI question limit. Your limit resets tomorrow.";
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: quotaText, source: 'quota', cached: false, thumbs: null }
        : m
      ));
      setSuggestions(null);
      if (!isPremium) setShowReferralModal(true);
      activeAssistantIdRef.current = null;
      setStatusText('Thinking');
      return;
    }

    if (result?.authRequired) {
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: result.error || 'Please sign in to use AI Mentor.', source: 'auth-required', provider: null, offlineInfo: null, cached: false, thumbs: null }
        : m
      ));
      setSuggestions(null);
      activeAssistantIdRef.current = null;
      setStatusText('Thinking');
      return;
    }

    if (result?.remaining != null) {
      setAiQuestionsRemaining(result.remaining.remaining);
      if (result.remaining.limit != null) setLimit(result.remaining.limit);
    } else if (result?.text) {
      decrementAiQuestions();
    }

    if (result?.text) {
      const source = result.source || 'provider';
      addAssistantMessage(result.text);
      cache.setCached(userMsg, { text: result.text, suggestions: result.suggestions }, undefined, aiMode);
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: result.text, source, provider: result.provider, offlineInfo: result.offlineInfo, cached: false, thumbs: null }
        : m
      ));
      setSuggestions(result.suggestions?.length > 0 ? result.suggestions : generateSmartSuggestions(userMsg, result.text));
    } else if (result?.error) {
      const errText = typeof result.error === 'string' && result.error.trim() ? result.error : "AI service is temporarily unavailable. Please try again.";
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: errText, source: 'error', provider: null, offlineInfo: null, cached: false, thumbs: null }
        : m
      ));
      setSuggestions(null);
      refreshAiQuota();
    } else if (result === null) {
      // startStream returned null (auth error, abort, or network failure)
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: "AI service is temporarily unavailable. Please try again.", source: 'error', provider: null, offlineInfo: null, cached: false, thumbs: null }
        : m
      ));
      setSuggestions(null);
    } else if (!result?.text) {
      const fallbackText = "Live AI could not be reached, so I'm replying from the offline knowledge base. Ask me to explain any core GATE topic (CPU scheduling, deadlock, DBMS normalization, Dijkstra, TCP, binary search…) and I'll go deep.";
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: fallbackText, source: 'heuristic', provider: null, offlineInfo: { provider: null, model: null, status: null, reason: 'Live AI could not be reached.', detail: null, ts: new Date().toISOString() }, cached: false, thumbs: null }
        : m
      ));
      setSuggestions(["What should I study today?", "Am I on track?", "Which subject should I prioritize?"]);
      refreshAiQuota();
    }
    activeAssistantIdRef.current = null;
    setStatusText('Thinking');
  }, [input, streaming, conversationSessionId, buildContext, cache, startStream, generateSmartSuggestions, aiQuestionsRemaining, setShowReferralModal, isPremium, refreshAiQuota, decrementAiQuestions, setAiQuestionsRemaining, setLimit, aiMode]);

  const handleStop = useCallback(() => {
    stopStream();
    clearInterval(statusIntervalRef.current);
    setStatusText('Thinking');
    const placeholderId = activeAssistantIdRef.current;
    if (partialText && placeholderId && !placeholderFinalizedRef.current) {
      addAssistantMessage(partialText);
      cache.setCached(lastUserMsgRef.current, { text: partialText, suggestions: null }, undefined, aiMode);
      placeholderFinalizedRef.current = true;
      setMessages(prev => prev.map(m => m.id === placeholderId
        ? { ...m, text: partialText, source: 'aborted', cached: false, thumbs: null }
        : m
      ));
      activeAssistantIdRef.current = null;
    } else if (partialText && !placeholderId) {
      addAssistantMessage(partialText);
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', text: partialText, source: 'aborted', thumbs: null }]);
      cache.setCached(lastUserMsgRef.current, { text: partialText, suggestions: null }, undefined, aiMode);
    }
  }, [stopStream, partialText, conversationSessionId, cache, aiMode]);

  const handleSuggestion = useCallback((text) => {
    if (streaming) return;
    handleSend(text);
  }, [handleSend, streaming]);

  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    streaming ? handleStop() : handleSend();
  }, [streaming, handleStop, handleSend]);

  const resizeRef = useRef(null);
  const handleResizeStart = useCallback((direction, e) => {
    e.preventDefault();
    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const startW = w;
    const startH = h;
    const startL = popupPos?.left ?? window.innerWidth - w - 20;

    const onMove = (ev) => {
      const cx = ev.clientX ?? ev.touches?.[0]?.clientX ?? startX;
      const cy = ev.clientY ?? ev.touches?.[0]?.clientY ?? startY;
      const dx = cx - startX;
      const dy = cy - startY;
      let nw = startW;
      let nh = startH;
      let nl = startL;

      if (direction.includes('e')) nw = Math.max(MIN_W, startW + dx);
      if (direction.includes('w')) { nw = Math.max(MIN_W, startW - dx); nl = startL + (startW - nw); }
      if (direction.includes('s')) nh = Math.max(MIN_H, startH + dy);
      if (direction.includes('n')) nh = Math.max(MIN_H, startH - dy);

      setPopupSize({ w: nw, h: nh });
      if (direction.includes('w')) setPopupPos(prev => ({ ...prev, left: nl }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = getComputedStyle(e.target).cursor;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [w, h, popupPos]);

  const handleDragEnd = useCallback((_, info) => {
    const el = popupRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const newPos = { left: r.left, top: r.top };
    setPopupPos(newPos);
    try { localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(newPos)); } catch {}
  }, []);

  const handleExpand = useCallback(() => {
    setOpen(false);
    navigate('/ai-coach');
  }, [setOpen, navigate]);

  const style = isMobile ? {} : {
    width: w,
    height: h,
    ...(popupPos ? { left: popupPos.left, top: popupPos.top, right: 'auto', bottom: 'auto' } : { right: 20, bottom: 100 }),
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="assistant-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:bg-transparent md:pointer-events-none"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popupRef}
            role="dialog"
            aria-label="GateNexa AI Assistant"
            aria-modal="true"
            initial={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.92, opacity: 0, y: 10 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            drag={!isMobile}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            dragHandle=".ai-drag-handle"
            className={`fixed z-[9999] overflow-hidden shadow-2xl flex flex-col ${
              isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl rounded-b-none max-h-[80vh]' : 'rounded-2xl'
            }`}
            style={isMobile ? {
              background: 'rgba(5,8,22,0.98)',
              border: 'none',
              top: 'auto',
            } : {
              ...style,
              background: 'rgba(5,8,22,0.97)',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 0 80px rgba(139,92,246,0.12), 0 20px 60px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(24px)',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            {!isMobile && (
              <>
                <ResizeHandle direction="n" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="s" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="e" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="w" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="ne" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="nw" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="se" onResizeStart={handleResizeStart} />
                <ResizeHandle direction="sw" onResizeStart={handleResizeStart} />
              </>
            )}

            {/* Header - drag handle */}
            <div
              className={`ai-drag-handle flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                isMobile ? '' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{ borderColor: 'rgba(139,92,246,0.12)' }}
            >
              <div className="flex items-center gap-3">
                <GateNexaAIIcon size={32} thinking={streaming} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white leading-tight">GateNexa AI</span>
                    <AiModeSelector mode={aiMode} setMode={setAiMode} current={currentAiMode} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: streaming ? '#22d3ee' : '#22C55E' }} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: streaming ? '#22d3ee' : '#22C55E' }}>
                      {streaming ? 'Generating' : 'Online'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex mr-2"><AiLimitBadge /></div>
              <div className="flex items-center gap-1" role="toolbar" aria-label="Chat controls">
                {streaming && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={handleStop}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5"
                    style={{ color: '#F87171', background: 'rgba(248,113,113,0.1)' }}
                    aria-label="Stop generation"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
                    Stop
                  </motion.button>
                )}
                <button onClick={handleExpand}
                  className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.4)' }}
                  aria-label="Open full page"
                  title="Open full page">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 012 0v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}
                  aria-label="Close chat">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            {!isMobile && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'rgba(139,92,246,0.06)' }}>
                {!isActive ? (
                  <button onClick={() => { setOpen(false); navigate('/focus-session'); }}
                    className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 2a6 6 0 100 12A6 6 0 008 2zM7 5a1 1 0 112 0v3a1 1 0 11-2 0V5zm0 5a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" /></svg>
                    Start Focus
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-white">{formatTime(timeRemaining)}</span>
                    {isPaused ? (
                      <button onClick={resumeSession}
                        className="text-[10px] px-2 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Resume</button>
                    ) : (
                      <button onClick={pauseSession}
                        className="text-[10px] px-2 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>Pause</button>
                    )}
                    <button onClick={stopSession}
                      className="text-[10px] px-2 py-1 rounded-lg font-medium"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}>Stop</button>
                  </div>
                )}
                <div className="flex-1" />
                <button onClick={() => navigate('/predictor')}
                  className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Predict</button>
                <button onClick={() => navigate('/planner')}
                  className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Planner</button>
              </div>
            )}
            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
              {messages.length === 0 && !streaming ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center py-6"
                >
                  <GateNexaAIIcon size={48} className="mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-bold text-white mb-1">GateNexa AI</p>
                  <p className="text-[11px] text-text3 mb-4 leading-relaxed max-w-[90%] mx-auto">
                    Your personal GATE assistant<br />
                    Ask about study plans, PYQs, subjects, or strategies
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-[90%] mx-auto">
                    {SUGGESTION_PRESETS.map((s) => (
                      <button key={s} onClick={() => handleSuggestion(s)}
                        className="text-[11px] font-medium px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.12)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={msg.id || i}
                      msg={msg}
                      isLast={i === messages.length - 1}
                      streaming={streaming}
                      partialText={partialText}
                      responseTime={responseTime}
                      onSend={handleSend}
                      onThumbs={handleThumbs}
                    />
                  ))}
                  {streaming && !partialText && (messages[messages.length - 1]?.role === 'user' || messages[messages.length - 1]?.source === 'thinking') && (
                    <div className="flex justify-start">
                      <TypingIndicator statusText={statusText} />
                    </div>
                  )}
                </>
              )}
              <div ref={chatEnd} className="h-2" />
            </div>

            {/* Suggestion Chips - below conversation, NOT in history */}
            {suggestions && !streaming && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 pb-1 shrink-0"
              >
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s)}
                      className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ background: 'rgba(139,92,246,0.04)', color: '#9CA3AF', border: '1px solid rgba(139,92,246,0.08)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 shrink-0 border-t" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
              <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        streaming ? handleStop() : handleSend();
                      }
                    }}
                    placeholder="Ask anything about GATE 2027..."
                    rows={1}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                    style={{ minHeight: 36, maxHeight: 120 }}
                    aria-label="Chat input"
                    disabled={streaming}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  className="p-2.5 rounded-xl transition-all shrink-0 disabled:opacity-40"
                  disabled={!input.trim() && !streaming}
                  aria-label={streaming ? 'Stop generation' : 'Send message'}
                  style={streaming ? { background: 'rgba(248,113,113,0.2)', color: '#F87171' } : { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
                >
                  {streaming ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><rect x="5" y="5" width="10" height="10" rx="1.5" /></svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  )}
                </motion.button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[8px] text-text3">Enter to send · Shift+Enter new line</span>
                <span className="text-[8px] text-text3">GateNexa AI v2.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Symbol — draggable */}
      <motion.button
        ref={fabRef}
        onClick={() => setOpen(o => !o)}
        className="ai-fab-btn"
        drag
        dragMomentum={false}
        animate={fabControls}
        onDragEnd={async (_, info) => {
          const el = fabRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const width = r.width || 56;
          const height = r.height || 56;
          // Clamp within viewport so the FAB can never be dragged off-screen
          const left = Math.max(0, Math.min(r.left, window.innerWidth - width));
          const top = Math.max(0, Math.min(r.top, window.innerHeight - height));
          const newPos = { left, top };
          setFabPos(newPos);
          try { localStorage.setItem(STORAGE_KEY_FAB_POS, JSON.stringify(newPos)); } catch {}
          // Reset the framer-motion drag transform so it doesn't stack with left/top
          fabControls.start({ x: 0, y: 0 });
        }}
        style={{
          position: 'fixed',
          zIndex: 9999,
          bottom: fabPos ? 'auto' : 'max(18px, env(safe-area-inset-bottom, 0px))',
          right: fabPos ? 'auto' : 18,
          top: fabPos?.top ?? 'auto',
          left: fabPos?.left ?? 'auto',
          width: 56,
          height: 56,
          background: 'none',
          border: 'none',
          outline: 'none',
          padding: 0,
          cursor: 'grab',
          borderRadius: '50%',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        whileHover={{
          scale: 1.08,
          filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.5))',
          transition: { duration: 0.3, ease: 'easeOut' },
        }}
        whileTap={{ scale: 0.95, cursor: 'grabbing' }}
      >
        <span className="ai-fab-bob" style={{ display: 'block', width: '100%', height: '100%' }}>
          <img
            src="/images/ai symbol.png"
            alt="AI NEXA Assistant"
            width={56}
            height={56}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%',
            }}
            loading="lazy"
            draggable="false"
          />
        </span>
        {(() => {
          const tooltipEnabled = typeof window !== 'undefined' && localStorage.getItem('gatenexa_ai_tooltip') !== 'false';
          if (hover && !open && tooltipEnabled) {
            return (
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl whitespace-nowrap pointer-events-none"
                style={{ background: 'rgba(5,8,22,0.95)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <div className="text-xs font-bold text-white">AI NEXA Assistant</div>
                <div className="text-[10px] font-medium" style={{ color: '#A78BFA' }}>Need help with GATE?</div>
              </motion.div>
            );
          }
          return null;
        })()}
      </motion.button>
      <style>{`
        .ai-fab-btn { border-radius: 50% !important; overflow: hidden !important; }
        .ai-fab-btn img { border-radius: 50% !important; }
        @media (min-width: 768px) { .ai-fab-btn { width: 72px !important; height: 72px !important; } }
        @media (max-width: 767px) { .ai-fab-btn { width: 56px !important; height: 56px !important; } }
        @keyframes ai-fab-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .ai-fab-bob { animation: ai-fab-bob 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ai-fab-bob { animation: none; } }
      `}</style>
    </>
  );
}
