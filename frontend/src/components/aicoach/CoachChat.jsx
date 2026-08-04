import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import CoachCard from './CoachCard';
import { buildCoachContext } from './coachPromptBuilder';
import { coachTokens } from './coachTokens';

const { colors, typography } = coachTokens;

const THINKING_PHASES = [
  'Reviewing your progress...',
  'Checking your weak topics...',
  'Building today\'s study strategy...',
];

const MODE_CONFIG = {
  coach: { actionHeading: 'Next Best Action', actionEmoji: '📌', emojis: ['🧠', '🎯', '📚', '💡', '📌'] },
  learning: { actionHeading: 'Practice Question', actionEmoji: '▶', emojis: ['📖', '🧠', '📍', '⚠', '🎯', '▶'] },
  review: { actionHeading: 'Next Review', actionEmoji: '📅', emojis: ['📊', '✅', '⚠', '🎯', '📅'] },
};

function detectMode(text) {
  const m = text.trim().match(/^\s*\[\s*(COACH|LEARNING|REVIEW)\s*\]/i);
  return m ? m[1].toLowerCase() : 'coach';
}

function stripModeMarker(text) {
  return text.replace(/^\s*\[\s*(COACH|LEARNING|REVIEW)\s*\]\s*\n*/i, '').trim();
}

function parseActionItems(text, mode) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.coach;
  const lines = text.split('\n');
  const idx = lines.findIndex(l => l.includes(cfg.actionEmoji) && l.includes(cfg.actionHeading));
  if (idx === -1) return [];
  return lines.slice(idx + 1)
    .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'))
    .map(l => l.replace(/^[•\-*\s]+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

function stripActionSection(text, mode) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.coach;
  const lines = text.split('\n');
  const idx = lines.findIndex(l => l.includes(cfg.actionEmoji) && l.includes(cfg.actionHeading));
  if (idx === -1) return text;
  return lines.slice(0, idx).join('\n').trim();
}

function extractText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && node.props?.children) return extractText(node.props.children);
  return '';
}

function buildComponents(emojis) {
  return {
    h3: ({ children }) => {
      const str = extractText(children);
      const emoji = emojis.find(e => str.includes(e)) || '';
      const title = str.replace(emoji, '').trim();
      if (emoji) {
        return (
          <>
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(139,92,246,0.15), transparent)', margin: '14px 0 8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{title}</span>
            </div>
          </>
        );
      }
      return <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, margin: '12px 0 4px' }}>{children}</h3>;
    },
    p: ({ children }) => (
      <p style={{ margin: '0 0 8px 0', fontSize: 13, lineHeight: 1.6, color: colors.textSoft }}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul style={{ margin: '0 0 10px 0', padding: 0, listStyle: 'none' }}>{children}</ul>
    ),
    li: ({ children }) => (
      <li style={{ marginBottom: 5, fontSize: 13, lineHeight: 1.5, color: colors.textSoft, paddingLeft: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, color: colors.accent }}>•</span>
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong style={{ color: colors.text, fontWeight: 600 }}>{children}</strong>
    ),
  };
}

function MentorTypewriter({ text, mode = 'coach', speed = 18, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const components = useMemo(() => buildComponents(MODE_CONFIG[mode]?.emojis || MODE_CONFIG.coach.emojis), [mode]);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    if (!text) return;
    timerRef.current = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(timerRef.current);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  return <ReactMarkdown components={components}>{displayed}</ReactMarkdown>;
}

function MentorMessage({ text, mode = 'coach', completed, onAction }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.coach;
  const components = useMemo(() => buildComponents(cfg.emojis), [cfg.emojis]);
  const actionItems = useMemo(() => {
    if (!completed) return [];
    return parseActionItems(text, mode);
  }, [text, mode, completed]);
  const bodyText = useMemo(() => {
    if (actionItems.length === 0) return text;
    return stripActionSection(text, mode);
  }, [text, mode, actionItems.length]);

  return (
    <div>
      <ReactMarkdown components={components}>{bodyText}</ReactMarkdown>
      {actionItems.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {actionItems.map((action, i) => (
            <button
              key={i}
              onClick={() => onAction(action)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.accentLight,
                background: colors.accentSoft, border: `1px solid ${colors.borderHover}`,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>▶</span>
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator({ phases = THINKING_PHASES }) {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (phase >= phases.length) return;
    const t1 = setTimeout(() => setPhase(p => Math.min(p + 1, phases.length)), 2000);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    const t2 = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t2);
  }, []);

  if (phase >= phases.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{
      alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 12,
      background: colors.surface, border: `1px solid ${colors.border}`,
      marginBottom: 8,
    }}>
      <span style={{ fontSize: typography.caption.size, color: colors.textMuted }}>
        🧠 {phases[phase]}{dots}
      </span>
    </motion.div>
  );
}

const suggestedPrompts = [
  'What should I study today?',
  'How do I improve PYQ accuracy?',
  'Create a revision plan',
  'Show my weak topics',
];

export default function CoachChat({ coachState = null, onboardingComplete = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [completedSet, setCompletedSet] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(0);
  const onboardingHandled = useRef(false);

  const coachContext = useMemo(() => coachState ? buildCoachContext(coachState) : null, [coachState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Send welcome message when transitioning from onboarding
  useEffect(() => {
    if (onboardingComplete && !onboardingHandled.current) {
      onboardingHandled.current = true;
      setShowWelcome(false);
      const id = msgIdRef.current++;
      setMessages([{ role: 'coach', content: '', mode: 'coach', id }]);
      setIsThinking(true);
      const timer = setTimeout(async () => {
        try {
          const { aiService } = await import('../../services/api');
          const res = await aiService.askCoach('I just completed onboarding. What do you think about my preparation? Give me a personalised greeting and tell me what to study first.', coachContext);
          const rawText = res?.data?.data?.text || res?.data?.reply || res?.data?.message || '';
          setIsThinking(false);
          if (rawText) {
            const mode = detectMode(rawText);
            const cleanText = stripModeMarker(rawText);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, content: cleanText, mode } : m));
          }
        } catch {
          setIsThinking(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, coachContext]);

  const handleSend = useCallback(async (overrideText) => {
    const msgText = typeof overrideText === 'string' ? overrideText : input.trim();
    if (!msgText || isThinking) return;
    setInput('');
    setShowWelcome(false);
    const userId = msgIdRef.current++;
    setMessages(prev => [...prev, { role: 'user', content: msgText, id: userId }]);
    setIsThinking(true);

    try {
      const { aiService } = await import('../../services/api');
      const res = await aiService.askCoach(msgText, coachContext);
      const rawText = res?.data?.data?.text || res?.data?.reply || res?.data?.message || '';
      setIsThinking(false);
      if (rawText) {
        const mode = detectMode(rawText);
        const cleanText = stripModeMarker(rawText);
        const coachId = msgIdRef.current++;
        setMessages(prev => [...prev, { role: 'coach', content: cleanText, mode, id: coachId }]);
      } else {
        const coachId = msgIdRef.current++;
        setMessages(prev => [...prev, { role: 'coach', content: "I'm here to help. What would you like to work on?", mode: 'coach', id: coachId }]);
      }
    } catch {
      setIsThinking(false);
      const coachId = msgIdRef.current++;
      setMessages(prev => [...prev, { role: 'coach', content: "I couldn't reach the server. Feel free to ask again.", mode: 'coach', id: coachId }]);
    }
  }, [input, isThinking, coachContext]);

  const handleTypewriterComplete = useCallback((msgId) => {
    setCompletedSet(prev => new Set([...prev, msgId]));
  }, []);

  const handleQuickAction = useCallback((action) => {
    setInput(action);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
      <CoachCard hoverable={false} style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 320 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
          {showWelcome && messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ alignSelf: 'flex-start', maxWidth: '88%', padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: colors.surface, border: `1px solid ${colors.border}`, fontSize: typography.body.size, lineHeight: 1.6, color: colors.text }}>
              <span style={{ fontWeight: 600, color: colors.accentLight }}>👋 Welcome.</span> I've reviewed your preparation data. I'm here to guide you through your GATE journey. What do you want to focus on today?
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}
              style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})` : colors.surface, border: msg.role === 'user' ? 'none' : `1px solid ${colors.border}`, fontSize: typography.body.size, lineHeight: 1.6, color: msg.role === 'user' ? '#fff' : colors.text }}>
              {msg.role === 'coach' ? (
                !completedSet.has(msg.id) ? (
                  <MentorTypewriter text={msg.content} mode={msg.mode || 'coach'} speed={18} onComplete={() => handleTypewriterComplete(msg.id)} />
                ) : (
                  <MentorMessage text={msg.content} mode={msg.mode || 'coach'} completed={true} onAction={handleQuickAction} />
                )
              ) : (
                msg.content
              )}
            </motion.div>
          ))}

          {isThinking && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {showWelcome && messages.length === 0 && (
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestedPrompts.map((p, i) => (
              <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{ padding: '5px 12px', borderRadius: 8, background: colors.accentSoft, border: `1px solid ${colors.borderHover}`, fontSize: typography.caption.size, color: colors.textSoft, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {p}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 8 }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask your mentor anything..."
            aria-label="Ask your mentor"
            disabled={isThinking}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: typography.body.size, background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} />
          <button onClick={handleSend} disabled={!input.trim() || isThinking}
            style={{ padding: '10px 20px', borderRadius: 10, fontSize: typography.caption.size, fontWeight: 600, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, color: '#fff', border: 'none', cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed', opacity: input.trim() && !isThinking ? 1 : 0.4 }}>
            Send
          </button>
        </div>
      </CoachCard>
    </motion.div>
  );
}
