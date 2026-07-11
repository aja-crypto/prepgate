import { useState, useRef, useCallback } from 'react';
import { aiService } from '../services/api';

export default function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const send = useCallback(async (message, context = {}, sessionId = 'default') => {
    if (!message?.trim()) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await aiService.askCoach(message, context, sessionId);
      if (res.data?.success) {
        const data = res.data.data;
        return {
          text: data.text,
          suggestions: data.suggestions || [],
          source: data.source || 'provider',
          cached: data.cached || false,
          isFallback: data.isFallback || false,
          responseTime: data.responseTime,
        };
      }
      throw new Error(res.data?.message || 'AI request failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 429) {
        setError('Rate limited — please wait a moment.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Try again.');
      } else {
        setError(msg || 'Unable to reach AI service.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  }, []);

  return { send, cancel, loading, error, setError };
}
