import { useState, useCallback, useRef } from 'react';

const MAX_MESSAGES = 30;

export default function useConversation(sessionId = 'default') {
  const [messages, setMessages] = useState([]);
  const sessionIdRef = useRef(sessionId);

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

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    addMessage,
    clearHistory,
    getHistoryForContext,
    lastTopic,
    sessionId: sessionIdRef.current,
  };
}
