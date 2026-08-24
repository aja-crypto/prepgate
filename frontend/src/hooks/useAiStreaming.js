import { useState, useRef, useCallback } from 'react';
import { aiService } from '../services/api';

export default function useAiStreaming() {
  const [streaming, setStreaming] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const partialRef = useRef('');

  const startStream = useCallback(async (message, context = {}, sessionId = 'default') => {
    setStreaming(true);
    setPartialText('');
    setError(null);
    partialRef.current = '';

    const controller = new AbortController();
    abortRef.current = controller;

    // Two safety nets so a request can NEVER hang the UI: a hard total cap and
    // an idle watchdog that aborts a stream that stops producing data.
    const totalTimer = setTimeout(() => controller.abort(), 150000);
    let idleTimer = null;
    const clearTimers = () => {
      clearTimeout(totalTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(), 90000);
    };

    try {
      const modePrompt = context?.modePrompt || null;
      const res = await aiService.streamCoach(message, context, sessionId, controller.signal, modePrompt);
      if (!res.ok) {
        clearTimers();
        if (res.status === 429) {
          const errorData = await res.json().catch(() => null);
          setStreaming(false);
          abortRef.current = null;
          return { text: null, suggestions: null, source: 'quota', quotaExceeded: true, limit: errorData?.data?.limit, resetAt: errorData?.data?.resetAt };
        }
        if (res.status === 401) throw new Error('auth');
        if (res.status >= 500) throw new Error('server');
        throw new Error(`http_${res.status}`);
      }

      // Handle non-streaming response (heuristic fallback when AI not configured)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const data = await res.json();
        const raw = data?.data?.text ?? data?.data?.message ?? '';
        const text = typeof raw === 'string' ? raw : '';
        const suggestions = data?.data?.suggestions || null;
        const source = data?.data?.source || 'heuristic';
        const provider = data?.data?.provider || null;
        const offlineInfo = data?.data?.offlineInfo || null;
        clearTimers();
        setStreaming(false);
        abortRef.current = null;
        return { text, suggestions, source, provider, offlineInfo };
      }

      if (!res.body) {
        clearTimers();
        setStreaming(false);
        abortRef.current = null;
        return null;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let suggestions = null;
      let source = 'provider';
      let provider = null;
      let offlineInfo = null;
      let remaining = null;
      let streamError = null;
      let returnedConversationId = null;

      armIdle();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        armIdle();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'delta') {
              fullText += parsed.content;
              partialRef.current = fullText;
              setPartialText(fullText);
            } else if (parsed.type === 'done') {
              fullText = parsed.content || fullText;
              setPartialText(fullText);
              suggestions = parsed.suggestions || null;
              source = parsed.source || 'provider';
              provider = parsed.provider || null;
              offlineInfo = parsed.offlineInfo || null;
              remaining = parsed.remaining;
              returnedConversationId = parsed.conversationId || null;
            } else if (parsed.type === 'fallback') {
              fullText = parsed.content || '';
              setPartialText(fullText);
              suggestions = parsed.suggestions || null;
              source = parsed.source || 'heuristic';
              provider = parsed.provider || null;
              offlineInfo = parsed.offlineInfo || null;
              remaining = parsed.remaining;
            } else if (parsed.type === 'error') {
              streamError = parsed.content || 'AI service is temporarily unavailable. Please try again.';
            }
          } catch {}
        }
      }

      clearTimers();
      setStreaming(false);
      abortRef.current = null;
      if (streamError && !fullText) {
        return { text: null, suggestions: null, source: 'error', error: streamError };
      }
      return { text: fullText, suggestions, source, provider, offlineInfo, remaining, conversationId: returnedConversationId };
    } catch (err) {
      clearTimers();
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setStreaming(false);
        const pt = partialRef.current;
        return pt ? { text: pt, suggestions: null, source: 'aborted' } : null;
      }
      setError(err.message);
      setStreaming(false);
      abortRef.current = null;
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, []);

  return { startStream, stopStream, streaming, partialText, error, setPartialText };
}
