import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resourceService } from '../../services/api';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Explain Deadlock',
  'Binary Search Trees',
  'DBMS Normalization',
  'CPU Scheduling',
  'AVL Trees',
];

const RECENT_SEARCHES_KEY = 'gatenexa_ai_notes_recent';

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(query) {
  try {
    const recent = loadRecent().filter(r => r !== query).slice(0, 5);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch {}
}

export default function AINotesAssistant({ onSelectNote }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(loadRecent);
  const [results, setResults] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || loading) return;
    setLoading(true);
    saveRecent(query);
    setRecentSearches(loadRecent());

    const userMsg = { role: 'user', content: query, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const res = await resourceService.aiSearch(query);
      const data = res.data?.data;
      const reply = data?.reply || "I couldn't find anything matching that query.";
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        id: Date.now() + 1,
        data: data,
      }]);
      setResults(data);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Search failed. Please try again.',
        id: Date.now() + 1,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ background: 'rgba(10,15,44,0.6)', border: '1px solid rgba(139,92,246,0.15)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]" style={{ background: 'rgba(139,92,246,0.04)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-white">AI Notes Assistant</div>
          <div className="text-[10px] text-slate-500">Ask anything about GATE topics</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-3xl mb-3">🤖</div>
              <p className="text-sm text-slate-400">Ask me about any GATE topic.</p>
              <p className="text-xs text-slate-600 mt-1">Try: "Explain Deadlock" or "Binary Search Trees"</p>
            </div>

            {recentSearches.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 px-1">Recent Searches</div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((r, i) => (
                    <button key={i} onClick={() => handleSearch(r)}
                      className="text-[11px] px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.12)' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 px-1">Try Asking</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSearch(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 px-1">Backend resources indexed and ready. Ask me anything about GATE!</div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                ? 'rounded-tr-md'
                : 'rounded-tl-md'}`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(139,92,246,0.15)' }
                  : msg.error
                    ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                }>
                {msg.role === 'user' ? (
                  <p className="text-sm text-white">{msg.content}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                    {msg.data && msg.data.total > 0 && (
                      <>
                        {/* Resource Categories */}
                        <div className="space-y-2 pt-1">
                          {msg.data.categorized?.notes?.length > 0 && (
                            <ResourceSection title="Notes" icon="note" notes={msg.data.categorized.notes} onSelect={onSelectNote} color="#8B5CF6" />
                          )}
                          {msg.data.categorized?.formulaSheets?.length > 0 && (
                            <ResourceSection title="Formula Sheets" icon="star" notes={msg.data.categorized.formulaSheets} onSelect={onSelectNote} color="#22C55E" />
                          )}
                          {msg.data.categorized?.pdfs?.length > 0 && (
                            <ResourceSection title="PDF Documents" icon="file" notes={msg.data.categorized.pdfs} onSelect={onSelectNote} color="#F97316" />
                          )}
                        </div>

                        {/* Suggested Next Topics */}
                        {msg.data.suggestions?.length > 0 && (
                          <div className="pt-1">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Related Topics</div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.data.suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSearch(s)}
                                  className="text-[10px] px-2 py-1 rounded-lg transition-all"
                                  style={{ background: 'rgba(34,211,238,0.08)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.15)' }}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {msg.data?.total === 0 && !msg.error && (
                      <div className="pt-2">
                        <p className="text-xs text-slate-500">Tip: Upload notes first, then search for topics.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0s' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#22D3EE', animationDelay: '0.15s' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.3s' }} />
              </div>
              <span className="text-[10px] text-slate-500 ml-2">Searching notes...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(input); }}
            placeholder="Ask anything about GATE..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
          />
          <button
            onClick={() => handleSearch(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.06)' }}
          >
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourceSection({ title, icon, notes, onSelect, color }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-1 h-4 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{title}</span>
        <span className="text-[9px] text-slate-600">({notes.length})</span>
      </div>
      <div className="space-y-1">
        {notes.slice(0, 4).map((note) => (
          <button
            key={note.id}
            onClick={() => window.open(resourceService.fileUrl(note.filePath), '_blank')}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all hover:scale-[1.01]"
            style={{ background: `${color}08`, border: `1px solid ${color}12` }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0" style={{ color }}>
              <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4z" />
            </svg>
            <span className="text-xs text-slate-300 truncate flex-1">{note.title}</span>
            <span className="text-[9px] text-slate-600 shrink-0">PDF</span>
          </button>
        ))}
      </div>
    </div>
  );
}