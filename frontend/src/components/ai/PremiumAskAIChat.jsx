import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const colors = {
  bg: '#070B14', bg2: '#0C1220',
  card: 'rgba(18,23,36,0.78)', glass: 'blur(24px)',
  accent: '#8B5CF6', accent2: '#7C3AED', accentHover: '#A78BFA',
  glow: 'rgba(139,92,246,0.35)',
  success: '#22C55E', warning: '#F59E0B', error: '#EF4444',
  text: '#F8FAFC', text2: '#CBD5E1', text3: '#94A3B8', text4: '#64748B',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(139,92,246,0.25)',
  borderFocus: 'rgba(139,92,246,0.40)',
};

const STORAGE_KEY = 'premium_ask_ai_chat_history';

const SUGGESTED_PROMPTS = [
  'What should I study today?',
  'Create a weekly study plan',
  'Which topics are high-weightage?',
  'How do I improve PYQ accuracy?',
  'Analyze my mock test performance',
  'Suggest revision strategy',
];

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: 8, padding: '12px 20px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: colors.accent, opacity: 0.6 }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: colors.text3 }}>Nexa AI is thinking...</span>
    </motion.div>
  );
}

export default function PremiumAskAIChat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const streamResponse = async (userMsg) => {
    setIsStreaming(true);
    setStreamingText('');
    const text = 'This is a simulated AI response. In production, this would stream from the backend.';
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setStreamingText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsStreaming(false);
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        setStreamingText('');
      }
    }, 20);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    await streamResponse(userMsg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 250px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ask Nexa AI</h2>
          <p style={{ fontSize: 13, color: colors.text3, margin: '4px 0 0' }}>Get personalized GATE guidance</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat}
            style={{ fontSize: 11, color: colors.text4, background: 'none', border: '1px solid ' + colors.border, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, paddingRight: 8 }}>
        {messages.length === 0 && !isStreaming ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Ask Nexa AI</h3>
              <p style={{ fontSize: 13, color: colors.text3, maxWidth: 400, margin: '0 auto 24px' }}>
                Your AI GATE coach. Ask anything about your preparation, study plan, or strategy.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTED_PROMPTS.map(prompt => (
                  <motion.button key={prompt} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                    style={{ padding: '8px 16px', borderRadius: 12, fontSize: 12, background: colors.card, border: '1px solid ' + colors.border, color: colors.text2, cursor: 'pointer' }}>
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '12px 18px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, ' + colors.accent + ', ' + colors.accent2 + ')'
                      : colors.card,
                    border: msg.role === 'user' ? 'none' : '1px solid ' + colors.border,
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 1.6,
                    backdropFilter: colors.glass,
                  }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </motion.div>
              ))}
            </AnimatePresence>
            {isStreaming && streamingText && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ alignSelf: 'flex-start', maxWidth: '80%', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', background: colors.card, border: '1px solid ' + colors.border, color: colors.text, fontSize: 14, lineHeight: 1.6, backdropFilter: colors.glass }}>
                <ReactMarkdown>{streamingText}</ReactMarkdown>
              </motion.div>
            )}
            {isStreaming && !streamingText && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderTop: '1px solid ' + colors.border, paddingTop: 16 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask Nexa AI anything..."
          disabled={isStreaming}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14,
            background: colors.bg2, border: '1px solid ' + colors.border, color: colors.text,
            outline: 'none', resize: 'none',
          }} />
        <motion.button onClick={handleSend} disabled={!input.trim() || isStreaming}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, ' + colors.accent + ', ' + colors.accent2 + ')',
            border: 'none', color: '#fff', cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            opacity: input.trim() && !isStreaming ? 1 : 0.5,
          }}>
          Send
        </motion.button>
      </div>
    </div>
  );
}
