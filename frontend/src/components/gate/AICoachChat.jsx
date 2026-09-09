import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { aiService, getApiErrorMessage } from '../../services/api';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

const SAFETY_TIMEOUT_MS = 50000;

function getCoachErrorMessage(error) {
  const status = error.response?.status;
  const apiMsg = error.response?.data?.message;
  if (status === 429) return "You're asking questions too fast! Please wait a moment.";
  if (status === 403) return apiMsg || "You don't have permission for this request.";
  if (status === 401) return apiMsg || 'Your session expired. Please sign in again.';
  if (status >= 500) return 'The AI service is temporarily unavailable. Please try again.';
  if (error.code === 'ECONNABORTED' || error.message?.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return null;
  return getApiErrorMessage(error, "I'm having trouble connecting right now. Please try again.");
}

export default function AICoachChat() {
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your GATE 2027 AI Mentor. How can I help you with your preparation today?' }
  ]);
  const [input, setFormInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(['What should I study today?', 'Am I on track?', 'How to improve my rank?']);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const safetyTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearPendingRequest = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    abortRef.current = null;
    if (mountedRef.current) setLoading(false);
  }, []);

  const handleSend = async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    abortRef.current?.abort();
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setFormInput('');
    setLoading(true);

    safetyTimerRef.current = setTimeout(() => {
      if (requestIdRef.current !== requestId) return;
      controller.abort();
      if (!mountedRef.current) return;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The request took too long. Please try again.',
      }]);
      clearPendingRequest();
    }, SAFETY_TIMEOUT_MS);

    try {
      const overallProgress = Math.round((topics || []).filter(t => t.done).length / ((topics || []).length || 1) * 100);
      const mockAvg = (mocks || []).length > 0
        ? Math.round((mocks || []).reduce((a, b) => a + (b.score || 0), 0) / mocks.length)
        : 0;
      const weakSubjects = (studyStats?.subjects || []).filter(s => s.progress < 40).map(s => s.name);

      const res = await aiService.askCoach(messageText, {
        overallProgress,
        mockAvg,
        weakSubjects,
        streak: gateFeatures?.streak?.current || 0,
        weeklyHours: studyStats?.weeklyHours?.reduce((a, b) => a + b, 0) || 0,
      }, { signal: controller.signal });

      if (requestIdRef.current !== requestId || !mountedRef.current) return;

      if (res.data.success) {
        const reply = res.data.data?.text?.trim();
        if (!reply) throw new Error('Empty AI response');
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setSuggestions(res.data.data.suggestions || []);
      } else {
        throw new Error(res.data.message || 'API Error');
      }
    } catch (error) {
      if (requestIdRef.current !== requestId || !mountedRef.current) return;

      const displayMsg = getCoachErrorMessage(error);
      if (displayMsg) {
        console.error('AI Coach Error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: displayMsg }]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }
        if (mountedRef.current) setLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
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
          <div key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              type="button"
              disabled={loading}
              onClick={() => handleSend(s)}
              className="text-[10px] bg-bg-2 hover:bg-bg-3 border border-border px-2 py-1 rounded-lg text-text3 hover:text-text transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setFormInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask your mentor anything..."
            disabled={loading}
            className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
          />
          <button
            type="button"
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
