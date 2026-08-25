import { useState, useCallback, useRef } from 'react';

const MAX_MESSAGES = 30;
const SESSION_KEY = 'gatenexa_ai_session';

function getSessionId(base) {
  try {
    const key = `${SESSION_KEY}_${base || 'default'}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `${base || 'default'}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `${base || 'default'}_${Date.now()}`;
  }
}

export default function useConversation(sessionId = 'default') {
  const [messages, setMessages] = useState([]);
  const sessionIdRef = useRef(getSessionId(sessionId));

  const updateSessionId = useCallback((newId) => {
    if (newId && newId !== sessionIdRef.current) {
      sessionIdRef.current = newId;
      try {
        const key = `${SESSION_KEY}_${sessionId || 'default'}`;
        localStorage.setItem(key, newId);
      } catch {}
    }
  }, [sessionId]);

  const addMessage = useCallback((role, content, metadata = {}) => {
    setMessages(prev => {
      const updated = [...prev, { role, content, timestamp: Date.now(), ...metadata }];
      return updated.slice(-MAX_MESSAGES);
    });
  }, []);

  const addUserMessage = useCallback((content) => {
    addMessage('user', content);
  }, [addMessage]);

  const addAssistantMessage = useCallback((content, extra = {}) => {
    addMessage('assistant', content, extra);
  }, [addMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const getHistoryForContext = useCallback(() => {
    return messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const lastTopic = useCallback(() => {
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
    return null;
  }, [messages]);

  const isFollowUpQuery = useCallback((userMessage) => {
    const lower = userMessage.toLowerCase().trim();
    const followUpPatterns = [
      /^what about/i, /^how does/i, /^why does/i, /^why do/i,
      /^can you explain/i, /^tell me more/i, /^elaborate/i,
      /^can you elaborate/i, /^go deeper/i, /^expand on/i,
      /^continue/i, /^more on/i, /^and for/i, /^and about/i,
      /^what about that/i, /^how about/i, /^what else/i,
      /^what's the difference/i, /^compared to/i, /^vs\.?/i,
      /^versus/i, /^related to/i, /^in that case/i, /^then what/i,
      /^what do you mean/i, /^can you clarify/i, /^sorry,? ?(can you|i meant)/i,
    ];
    return followUpPatterns.some(p => p.test(lower));
  }, []);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    addMessage,
    clearHistory,
    getHistoryForContext,
    lastTopic,
    isFollowUpQuery,
    sessionId: sessionIdRef.current,
    updateSessionId,
  };
}
