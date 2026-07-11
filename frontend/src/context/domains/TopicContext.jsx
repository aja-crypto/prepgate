import { createContext, useContext, useState, useCallback } from 'react';

const TopicContext = createContext(null);
export const useTopicContext = () => { const c = useContext(TopicContext); if (!c) throw new Error('useTopicContext must be within TopicProvider'); return c; };

export function TopicProvider({ data, setData, children }) {
  const [topicFilter, setTopicFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const topics = data?.topics || [];

  const updateTopic = useCallback((topicId, updates) => {
    setData(prev => ({ ...prev, topics: (prev.topics || []).map(t => t._id === topicId ? { ...t, ...updates } : t) }));
  }, [setData]);

  const addTopic = useCallback((topic) => {
    setData(prev => ({ ...prev, topics: [...(prev.topics || []), topic] }));
  }, [setData]);

  const removeTopic = useCallback((topicId) => {
    setData(prev => ({ ...prev, topics: (prev.topics || []).filter(t => t._id !== topicId) }));
  }, [setData]);

  return (
    <TopicContext.Provider value={{ topics, topicFilter, setTopicFilter, statusFilter, setStatusFilter, updateTopic, addTopic, removeTopic }}>
      {children}
    </TopicContext.Provider>
  );
}