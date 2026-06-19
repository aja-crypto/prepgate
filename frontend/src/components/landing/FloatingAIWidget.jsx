import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

export function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your AI prep assistant. Ask me anything about GATE 2027 preparation!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: input, type: 'general' });
      const aiMsg = { role: 'assistant', content: res.data.response || 'I\'m here to help with your GATE prep!' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m having trouble connecting. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Study plan for next week',
    'Best books for GATE 2027',
    'How to improve speed?',
  ];

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(168, 85, 247, 0.4)',
            '0 0 40px rgba(168, 85, 247, 0.6)',
            '0 0 20px rgba(168, 85, 247, 0.4)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🤖
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-6 z-50 w-80 md:w-96 max-h-[500px] backdrop-blur-xl bg-bg-2/95 border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="font-bold text-text">AI Prep Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-text3 hover:text-text">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-bg-3 text-text'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-bg-3 text-text3 text-sm animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); }}
                    className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about GATE prep..."
                  className="flex-1 px-3 py-2 bg-bg-3 border border-border rounded-lg text-sm text-text placeholder:text-text3 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function FeaturedResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/landing/featured?limit=6');
        if (res.data.success) setResources(res.data.data);
      } catch (e) {
        console.error('Resources error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-bg-2/50 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!resources.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {resources.map((res, i) => (
        <motion.a
          key={res._id || i}
          href={res.url || '#'}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="block p-5 rounded-2xl border border-border hover:border-purple-500/50 transition-colors"
          style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1))' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h4 className="font-medium text-text mb-1">{res.title}</h4>
              <p className="text-xs text-text2 line-clamp-2">{res.description}</p>
              {res.category && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                  {res.category}
                </span>
              )}
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}