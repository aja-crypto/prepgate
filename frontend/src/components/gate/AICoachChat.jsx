import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useProgress } from '../../context/ProgressContext';
import { noteService } from '../../services/api';
import { buildAiContext } from '../../utils/aiContextBuilder';
import useAiStreaming from '../../hooks/useAiStreaming';
import useAiCache from '../../hooks/useAiCache';
import useConversation from '../../hooks/useConversation';
import useAiMode from '../../hooks/useAiMode';
import { buildModePrompt } from '../../utils/aiModePrompts';
import AiModeSelector from '../common/AiModeSelector';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';
import GateNexaAIIcon from '../ui/GateNexaAIIcon';
import BrandText from '../ui/BrandText';
import toast from 'react-hot-toast';

const SUGGESTION_PRESETS = [
  'Explain Deadlock',
  'Create a DBMS study plan',
  'Predict my GATE Rank',
  'Revision strategy',
  'Analyze my weaknesses',
];

const badgeConf = {
  provider: { label: 'AI', color: '#06d6a0' },
  cache: { label: 'Cached', color: '#4f8dff' },
  heuristic: { label: 'Fallback', color: '#ff9f43' },
  error: { label: 'Error', color: '#f87171' },
  thinking: { label: '...', color: '#a78bfa' },
  aborted: { label: 'Stopped', color: '#fbbf24' },
};

function MarkdownContent({ text }) {
  if (!text) return null;
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
        ul({ children }) { return <ul className="list-disc ml-4 space-y-1 my-1">{children}</ul>; },
        ol({ children }) { return <ol className="list-decimal ml-4 space-y-1 my-1">{children}</ol>; },
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

function StatusBadge({ source }) {
  const cfg = badgeConf[source] || badgeConf.provider;
  return (
    <span
      className="inline-flex text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ background: cfg.color + '20', color: cfg.color, border: '1px solid ' + cfg.color + '30' }}
    >
      {cfg.label}
    </span>
  );
}

function generateSmartSuggestions(userMessage, aiReply) {
  const lower = (userMessage + ' ' + (aiReply || '')).toLowerCase();
  
  // OS topics
  if (/deadlock|banker|semaphore|mutex|critical section|process sync/.test(lower))
    return ['Deadlock prevention techniques?', 'Bankers Algorithm explained', 'Difference: deadlock vs starvation', 'GATE PYQs on deadlock', 'Real-life deadlock example'];

  if (/cpu scheduling|sjf|fcfs|round robin|priority scheduling/.test(lower))
    return ['Which scheduling algo is best?', 'CPU scheduling GATE PYQs', 'Difference: preemptive vs non-preemptive', 'SRTF vs SJF comparison', 'Calculate average waiting time'];

  if (/page|segmentation|virtual memory|tlb|paging/.test(lower))
    return ['Paging vs segmentation', 'TLB miss handling', 'Page replacement algorithms', 'GATE PYQs on memory', 'Calculate page fault rate'];

  // DSA topics
  if (/binary tree|bst|avl|traversal|inorder|preorder|postorder/.test(lower))
    return ['BST vs AVL comparison', 'Tree traversals explained', 'GATE PYQs on trees', 'Construct tree from traversals', 'Coding: implement BST'];

  if (/binary search|two pointer|sliding window|sorting/.test(lower))
    return ['Binary Search time complexity', 'Binary Search vs Linear Search', 'GATE PYQs on searching', 'Coding: binary search in C++', 'Common binary search problems'];

  if (/linked list|stack|queue|heap|hashing/.test(lower))
    return ['Array vs Linked List', 'Stack applications in GATE', 'Heap sort explained', 'Hashing collision resolution', 'GATE PYQs on DS'];

  if (/graph|bfs|dfs|dijkstra|bellman|shortest path|mst/.test(lower))
    return ['BFS vs DFS comparison', 'Dijkstra vs Bellman-Ford', 'Minimum Spanning Tree algorithms', 'GATE PYQs on graphs', 'Graph coding problems'];

  if (/dp|dynamic programming|memoization|knapsack|lcs/.test(lower))
    return ['Top-down vs bottom-up DP', 'DP GATE PYQs', 'Classic DP problems list', 'Memoization technique explained', 'Coding: LCS in C++'];

  // DBMS
  if (/normalization|bcnf|3nf|functional dependency|decomposition/.test(lower))
    return ['BCNF vs 3NF differences', 'How to find candidate keys?', 'Lossless vs lossy decomposition', 'GATE PYQs on normalization', 'Practice normalization exercises'];

  if (/sql|join|query|select|aggregate|group by|having/.test(lower))
    return ['SQL joins explained with examples', 'Correlated vs nested queries', 'GATE PYQs on SQL', 'Practice complex SQL queries', 'Indexing for query optimization'];

  if (/transaction|acid|serializability|conflict|view|locking/.test(lower))
    return ['ACID properties explained', 'Conflict vs view serializability', '2PL and timestamp protocols', 'GATE PYQs on transactions', 'Recoverability in DBMS'];

  // Computer Networks
  if (/tcp|udp|three.?way|handshake|flow control|congestion/.test(lower))
    return ['TCP vs UDP comparison', 'TCP 3-way handshake explained', 'Flow vs congestion control', 'GATE PYQs on transport layer', 'TCP header format'];

  if (/ip|subnet|cidr|routing|nat|arp/.test(lower))
    return ['IP addressing numericals', 'Subnetting practice problems', 'Routing algorithm comparison', 'GATE PYQs on network layer', 'Difference: IPv4 vs IPv6'];

  // TOC
  if (/dfa|nfa|regex|regular expression|finite automata/.test(lower))
    return ['Convert NFA to DFA', 'Regular expression to DFA', 'GATE PYQs on automata', 'DFA minimization explained', 'Examples of DFA design'];

  if (/turing|undecidable|halting|pda|cfg|context free/.test(lower))
    return ['Turing machine explained', 'Halting problem proof', 'CFG to PDA conversion', 'GATE PYQs on TOC', 'Decidable vs undecidable problems'];

  // COA
  if (/pipeline|hazard|speedup|cache|memory hierarchy/.test(lower))
    return ['Pipeline hazard types', 'Calculate speedup factor', 'Cache mapping techniques', 'GATE PYQs on COA', 'Memory hierarchy explained'];

  // Digital Logic
  if (/boolean|kmap|karnaugh|flip flop|sequential|combinational/.test(lower))
    return ['Boolean algebra simplification', 'K-Map minimization steps', 'Flip flop conversions', 'GATE PYQs on digital logic', 'Combinational circuit design'];

  // Mathematics
  if (/probability|random variable|distribution|bayes|expectation/.test(lower))
    return ['Probability GATE PYQs', 'Conditional probability examples', 'Random variable distributions', 'Bayes theorem explained', 'Expected value problems'];

  if (/graph theory|combinatorics|set theory|permutation|counting/.test(lower))
    return ['Graph theory GATE PYQs', 'Combinatorics counting problems', 'Set theory basics for GATE', 'Pigeonhole principle examples', 'Inclusion-exclusion explained'];

  if (/linear algebra|matrix|eigenvalue|determinant|vector/.test(lower))
    return ['Matrix operations GATE PYQs', 'Eigenvalues and eigenvectors', 'System of linear equations', 'Vector space explained', 'Linear algebra for GATE'];

  // Aptitude
  if (/aptitude|percentage|profit|loss|ratio|time work/.test(lower))
    return ['Aptitude GATE preparation', 'Time and work problems', 'Profit loss percentage tricks', 'Ratio and proportion PYQs', 'Data interpretation tips'];

  // GATE Strategy / College Prediction
  if (/score|marks|predict|rank|air|college|iit|nit|cutoff/.test(lower))
    return ['Expected rank for your score', 'Target IIT/NIT cutoffs', 'Create a study plan for your target', 'Subject-wise improvement tips', 'Previous year cutoff trends'];

  if (/study plan|daily|routine|schedule|topper/.test(lower))
    return ['Generate a weekly study plan', 'Pomodoro time management', 'How to revise effectively?', 'Mock test frequency advice', 'Track your daily progress'];

  if (/mock|test series|practice|performance|score/.test(lower))
    return ['How to analyze mock tests?', 'Recommended test series', 'Improve mock test accuracy', 'Time management during mocks', 'Section-wise mock strategy'];

  // General GATE concepts catch-all
  if (/explain|what is|difference|compare|define|meaning/.test(lower))
    return ['Related GATE PYQs on this topic', 'Deep dive into subtopics', 'Common interview questions', 'Visualize with examples', 'Recommended resources for this'];

  // Default: generate from reply content
  const replyLower = (aiReply || '').toLowerCase();
  if (replyLower.includes('operating') || replyLower.includes('os ')) 
    return ['Important OS topics for GATE?', 'OS scheduling PYQs', 'Memory management concepts', 'Deadlock practice questions', 'OS revision plan'];
  if (replyLower.includes('dbms') || replyLower.includes('database') || replyLower.includes('sql'))
    return ['Normalization practice', 'SQL query exercises', 'Transaction concepts', 'DBMS GATE PYQs', 'Indexing and optimization'];
  if (replyLower.includes('network') || replyLower.includes('tcp') || replyLower.includes('ip'))
    return ['CN GATE PYQs', 'TCP/IP protocol stack', 'Subnetting practice', 'Network security basics', 'Application layer protocols'];
  if (replyLower.includes('tree') || replyLower.includes('graph') || replyLower.includes('array'))
    return ['DS GATE PYQs', 'Algorithm analysis', 'Coding implementation', 'Time complexity practice', 'Common interview problems'];
  if (replyLower.includes('math') || replyLower.includes('probability') || replyLower.includes('algebra'))
    return ['Engineering math PYQs', 'Discrete math topics', 'Probability practice', 'Linear algebra problems', 'Calculus for GATE'];

  return ['What to study today?', 'Weekly study planner', 'Subject completion order', 'Mock test strategy', 'Previous year analysis'];
}

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
  const loadingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [welcomeBack, setWelcomeBack] = useState(null);
  const [statusText, setStatusText] = useState('Thinking');
  const [responseTime, setResponseTime] = useState(null);
  const scrollRef = useRef(null);
  const promptRef = useRef(initialPrompt);
  const loadedFromHistory = useRef(messages.length > 0);
  const streamStartRef = useRef(null);
  const statusIntervalRef = useRef(null);
  const msgIdCounter = useRef(0);
  const lastUserMsgRef = useRef('');

  const { startStream, stopStream, streaming, partialText } = useAiStreaming();
  const { mode, setMode, current: currentMode } = useAiMode();
  const cache = useAiCache();
  const conversation = useConversation('coach');

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
    if (initialPrompt && (!promptRef.current || promptRef.current !== initialPrompt)) {
      promptRef.current = initialPrompt;
    }
    if (promptRef.current) {
      const prompt = promptRef.current;
      promptRef.current = null;
      handleSend(prompt);
    }
  }, [initialPrompt, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partialText]);

  useEffect(() => {
    if (messages.length > 0) saveCoachHistory(messages);
  }, [messages]);

  const handleThumbs = useCallback((msgId, type) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, thumbs: m.thumbs === type ? null : type } : m));
  }, []);

  const handleSend = useCallback(async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || loadingRef.current || streaming) return;

    lastUserMsgRef.current = messageText;
    loadingRef.current = true;

    const id = ++msgIdCounter.current;
    setMessages(prev => [...prev, { id: `u-${id}`, role: 'user', content: messageText }]);
    setFormInput('');
    setLoading(true);
    setSuggestions(null);
    setResponseTime(null);
    streamStartRef.current = performance.now();

    conversation.addUserMessage(messageText);
    setStatusText('Thinking');

    let phaseIdx = 0;
    statusIntervalRef.current = setInterval(() => {
      const phases = ['Thinking', 'Searching', 'Generating', 'Streaming'];
      phaseIdx = (phaseIdx + 1) % phases.length;
      setStatusText(phases[phaseIdx]);
    }, 2000);

    const progressKey = `${topics?.length || 0}-${pyqs?.length || 0}-${mocks?.length || 0}-${gateFeatures?.streak || 0}`;
    const cacheKey = `${messageText}::${progressKey}`;
    const cached = cache.getCached(cacheKey);
    if (cached) {
      clearInterval(statusIntervalRef.current);
      const reply = cached.text;
      conversation.addAssistantMessage(reply);
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', content: reply, source: 'cache', thumbs: null }]);
      setSuggestions(cached.suggestions?.length > 0 ? cached.suggestions : generateSmartSuggestions(messageText, reply));
      if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));
      loadingRef.current = false;
      setLoading(false);
      setStatusText('Thinking');
      return;
    }

    try {
      const ctx = buildAiContext({ topics, pyqs, mocks, gateFeatures, studyStats });
      ctx.history = conversation.getHistoryForContext();
      ctx.mode = mode;
      ctx.modePrompt = buildModePrompt(mode, ctx);

      const result = await startStream(messageText, ctx, conversation.sessionId);
      clearInterval(statusIntervalRef.current);
      if (streamStartRef.current) setResponseTime(((performance.now() - streamStartRef.current) / 1000).toFixed(1));

      if (result?.text) {
        const reply = result.text;
        conversation.addAssistantMessage(reply);
        cache.setCached(cacheKey, { text: reply, suggestions: result.suggestions });
        const aid = ++msgIdCounter.current;
        setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', content: reply, source: result.source || 'provider', thumbs: null }]);
        setSuggestions(result.suggestions?.length > 0 ? result.suggestions : generateSmartSuggestions(messageText, reply));
      } else if (!streaming) {
        const aid = ++msgIdCounter.current;
        setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', content: "Live AI could not be reached. Here's a general reply while it's unavailable:\n\nI'm here to help! Focus on completing your weak subjects and solving PYQs daily. What specific topic would you like advice on?", source: 'heuristic', thumbs: null }]);
      }
    } catch (error) {
      clearInterval(statusIntervalRef.current);
      console.error('AI Coach Error:', error);
      let displayMsg = "Live AI could not be reached. Here's a general reply while it's unavailable:\n\nI'm here to help! Focus on completing your weak subjects and solving PYQs daily. What specific topic would you like advice on?";
      if (error.message?.includes('rate limit')) {
        displayMsg = "You're asking questions too fast! Live AI is temporarily rate-limited. Please wait a moment and try again.";
      } else if (error.message?.includes('timed out')) {
        displayMsg = "Live AI took too long to respond and timed out. Please try again.";
      }
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', content: displayMsg, source: 'heuristic', thumbs: null }]);
    } finally {
      clearInterval(statusIntervalRef.current);
      loadingRef.current = false;
      setLoading(false);
      setStatusText('Thinking');
    }
  }, [input, streaming, topics, pyqs, mocks, gateFeatures, studyStats, conversation, startStream, cache]);

  const handleStop = useCallback(() => {
    stopStream();
    clearInterval(statusIntervalRef.current);
    setStatusText('Thinking');
    if (partialText) {
      conversation.addAssistantMessage(partialText);
      const aid = ++msgIdCounter.current;
      setMessages(prev => [...prev, { id: `a-${aid}`, role: 'assistant', content: partialText, source: 'aborted', thumbs: null }]);
    }
    loadingRef.current = false;
    setLoading(false);
  }, [stopStream, partialText, conversation]);

  const handleSuggestion = useCallback((text) => {
    if (streaming || loading) return;
    handleSend(text);
  }, [handleSend, streaming, loading]);

  const currentPartial = streaming ? partialText : '';

  return (
    <GlassCard className="flex flex-col h-[520px] sm:h-[600px]" padding="p-0">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-primary/5 shrink-0">
        <GateNexaAIIcon size={32} thinking={streaming || loading} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text"><BrandText /> AI</span>
            <AiModeSelector mode={mode} setMode={setMode} current={currentMode} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: streaming ? '#22d3ee' : '#22C55E' }} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: streaming ? '#22d3ee' : '#22C55E' }}>
              {streaming ? 'Generating' : 'Online'}
            </span>
          </div>
        </div>
        {streaming && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleStop}
            className="text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
            style={{ color: '#F87171', background: 'rgba(248,113,113,0.1)' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><rect x="3" y="3" width="10" height="10" rx="1.5" /></svg>
            Stop
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <GateNexaAIIcon size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-white mb-1">Welcome to <BrandText /> AI</p>
            <p className="text-xs text-text3 mb-4">Your Personal GATE Assistant</p>
            <p className="text-[11px] text-text3 mb-4 leading-relaxed max-w-[85%] mx-auto">
              I can help with: Subject Planning, PYQ Strategy, Revision Schedules, Mock Test Analysis, GATE Preparation Guidance
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
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
              const displayContent = isLastAssistant && streaming ? currentPartial || msg.content : msg.content;
              const source = msg.source || 'provider';
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-bg-3 text-text2 border border-border rounded-tl-none'
                    }`} style={msg.role === 'user' ? { padding: '10px 16px' } : { padding: '10px 14px' }}>
                      {msg.role === 'assistant' && !streaming && source !== 'thinking' && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <StatusBadge source={source} />
                          {responseTime != null && isLastAssistant && (
                            <span className="text-[8px] text-text3">{responseTime}s</span>
                          )}
                        </div>
                      )}
                      {msg.role === 'user' ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <MarkdownContent text={displayContent} />
                        </div>
                      )}
                      {streaming && isLastAssistant && (
                        <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse align-middle" style={{ background: '#A78BFA' }} />
                      )}
                      {msg.role === 'assistant' && !streaming && source !== 'thinking' && displayContent && (
                        <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t border-border/30">
                          <button onClick={async () => {
                            try { await navigator.clipboard.writeText(displayContent); toast.success('Copied!'); }
                            catch { const ta = document.createElement('textarea'); ta.value = displayContent; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('Copied!'); }
                          }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-text3 hover:text-text hover:bg-white/5 transition-colors">
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4 2a2 2 0 012-2h4a2 2 0 012 2v1H4V2z"/><path fillRule="evenodd" d="M2 4a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0h8v10H4V4z"/></svg>
                            Copy
                          </button>
                          {source === 'error' && (
                            <button onClick={() => handleSend(messages[i-1]?.content || input)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-red-400 hover:bg-red-500/10 transition-colors">
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 100 10A5 5 0 008 3zM4 8a4 4 0 118 0 4 4 0 01-8 0z"/><path d="M8 4.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zM8 9a.5.5 0 100 1 .5.5 0 000-1z"/></svg>
                              Retry
                            </button>
                          )}
                          {source !== 'error' && source !== 'thinking' && isLastAssistant && (
                            <button onClick={() => handleSend(messages[i-1]?.content || input)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-text3 hover:text-text hover:bg-white/5 transition-colors">
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                              Regenerate
                            </button>
                          )}
                          <button onClick={() => handleThumbs(msg.id, 'up')}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5"
                            style={{ color: msg.thumbs === 'up' ? '#22d3ee' : 'rgba(255,255,255,0.25)' }}>
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
                          </button>
                          <button onClick={() => handleThumbs(msg.id, 'down')}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5"
                            style={{ color: msg.thumbs === 'down' ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" style={{ transform: 'scaleY(-1)' }}><path d="M4.3 6.1c.4-.4.7-.8.8-1.5l.7-2.6c.18-.69.67-1.2 1.3-1.5.63-.28 1.3-.23 1.9.1.6.35.9.88 1.3 1.4.5.7.66 1.6.7 2.4v2.2l5.2.1c0 0 .9 0 .9.8 0 .6-.6 1.1-.6 1.1l.6 1.3s.5.8 0 1.3c-.4.4-1 .3-1 .3l.4 1.3s.3.8-.2 1.2c-.5.4-1 .2-1 .2l.1.9s0 .7-.6.8c-.6.2-1 0-1 0H6.8c-1.2 0-2.1-.7-2.5-1.8-.2-.5-.3-1-.5-1.5-.2-.5-.4-1-.7-1.4l-.7-.7c-.5-.4-.8-1-.8-1.7V8c0-1 .6-1.7 1.3-1.9h.4z"/></svg>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await noteService.create({ title: `AI: ${msg.content.slice(0, 50)}...`, content: msg.content, type: 'ai-response' });
                                toast.success('Saved to Notes');
                              } catch { toast.error('Failed to save'); }
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-text3 hover:text-text hover:bg-white/5 transition-colors">
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M11 1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V3a2 2 0 012-2h1v1h4V1h1z"/><path d="M6 1a1 1 0 011-1h2a1 1 0 011 1v1H6V1z"/></svg>
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {streaming && !partialText && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.15s' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#A78BFA', animationDelay: '0.3s' }} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{statusText}</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips - below messages, before input */}
      {suggestions && !streaming && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-2 shrink-0"
        >
          <div className="text-[10px] text-slate-500 mb-2 font-medium">You may also want to ask</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestion(s)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.06))',
                  color: '#C4B5FD',
                  border: '1px solid rgba(139,92,246,0.15)',
                  boxShadow: '0 0 12px rgba(139,92,246,0.08)',
                }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setFormInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                streaming ? handleStop() : handleSend();
              }
            }}
            placeholder="Ask anything about GATE 2027..."
            rows={1}
            className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            style={{ minHeight: 40, maxHeight: 120 }}
            disabled={streaming}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => streaming ? handleStop() : handleSend()}
            disabled={!input.trim() && !streaming}
            className={`p-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shrink-0 ${streaming ? 'bg-red-500/20 text-red-400' : 'bg-primary text-white'}`}
          >
            {streaming ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><rect x="5" y="5" width="10" height="10" rx="1.5" /></svg>
            ) : (
              <Icon name="chevron-right" className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
