import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { aiService } from '../../services/api';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

export default function AICoachChat() {
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your GATE 2027 AI Mentor. How can I help you with your preparation today?' }
  ]);
  const [input, setFormInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(["What should I study today?", "Am I on track?", "How to improve my rank?"]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setFormInput('');
    setLoading(true);

    try {
      const overallProgress = Math.round((topics || []).filter(t => t.done).length / ((topics || []).length || 1) * 100);
      const mockAvg = (mocks || []).length > 0 ? Math.round((mocks || []).reduce((a, b) => a + (b.score || 0), 0) / (mocks || []).length) : 0;
      const weakSubjects = (studyStats?.subjects || []).filter(s => s.progress < 40).map(s => s.name);

      const res = await aiService.askCoach(messageText, {
        overallProgress,
        mockAvg,
        weakSubjects,
        streak: gateFeatures?.streak?.current || 0,
        weeklyHours: studyStats?.weeklyHours?.reduce((a, b) => a + b, 0) || 0
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.text }]);
        setSuggestions(res.data.data.suggestions || []);
      } else {
        throw new Error(res.data.message || 'API Error');
      }
    } catch (error) {
      console.error('AI Coach Error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      let displayMsg = "I'm having trouble connecting right now. Please try again later.";
      
      if (errorMsg?.includes('rate limit')) {
        displayMsg = "You're asking questions too fast! Please wait a moment.";
      } else if (error.code === 'ECONNABORTED') {
        displayMsg = "The request timed out. My brain is a bit slow today, please try again.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: displayMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-[500px]" padding="p-0">
      <div className="p-4 border-b border-border flex items-center gap-3 bg-primary/5">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Icon name="zap" className="w-5 h-5 text-white fill-current" />
        </div>
        <div>
          <div className="text-sm font-bold text-text">AI Study Coach</div>
          <div className="text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Online 24/7
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-bg-3 text-text2 border border-border rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-3 border border-border p-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(s)}
              className="text-[10px] bg-bg-2 hover:bg-bg-3 border border-border px-2 py-1 rounded-lg text-text3 hover:text-text transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setFormInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your mentor anything..."
            className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Icon name="chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
