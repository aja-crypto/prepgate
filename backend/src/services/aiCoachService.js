const aiProvider = require('./aiProvider');
const aiCache = require('./aiCache');
const aiPromptBuilder = require('./aiPromptBuilder');
const conversationService = require('./aiConversationService');
const logger = require('../utils/aiLogger');

const GENERIC_RESPONSES = [
  "i am an ai",
  "i cannot",
  "i don't have access",
  "as an ai",
  "i apologize",
  "i'm an ai assistant",
];

function isGenericResponse(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return GENERIC_RESPONSES.some(g => lower.includes(g));
}

class AICoachService {
  constructor() {
    this.provider = aiProvider;
    this.promptBuilder = aiPromptBuilder;
    this.cache = aiCache;
    this.conversations = conversationService;

    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      providerSuccess: 0,
      providerFailures: 0,
      avgResponseTimeMs: 0,
      lastReset: Date.now(),
    };

    aiCache.warmupCache();
  }

  _hashObject(obj) {
    return JSON.stringify({
      weak: obj.weakSubjects || [],
      strong: obj.strongSubjects || [],
      progress: obj.overallProgress || 0,
      topics: (obj.weakTopics || []).slice(0, 3),
      streak: obj.streak || 0,
    });
  }

  async processMessage({ message, context = {}, userId, sessionId = 'default', stream = false }) {
    const requestId = logger.generateRequestId();
    const start = Date.now();

    this.metrics.totalRequests++;
    logger.logChatStart(requestId, userId, message);

    try {
      const sanitizedContext = this._sanitizeContext(context);
      const contextHash = this._hashObject(sanitizedContext);

      const cached = this.cache.getCachedQuestion(message, { contextHash });
      if (cached) {
        this.metrics.cacheHits++;
        logger.logCacheHit(requestId, userId, message);

        await this.conversations.addMessage(userId, 'user', message, sessionId);
        await this.conversations.addMessage(userId, 'assistant', cached.text, sessionId);

        this._updateAvgResponseTime(Date.now() - start);
        return {
          ...cached,
          source: 'cache',
          cached: true,
          responseTime: Date.now() - start,
          requestId,
        };
      }

      logger.logCacheMiss(requestId, userId, message);

      const conversationHistory = this.conversations.getContextForPrompt(userId, sessionId);
      const result = await this._callProvider({
        message,
        context: sanitizedContext,
        history: conversationHistory,
        stream,
        requestId,
      });

      if (result.text && !isGenericResponse(result.text)) {
        await this.conversations.addMessage(userId, 'user', message, sessionId);
        await this.conversations.addMessage(userId, 'assistant', result.text, sessionId);

        if (!stream) {
          this.cache.setCachedQuestion(message, {
            text: result.text,
            suggestions: result.suggestions || this._defaultSuggestions(),
          }, { contextHash });
        }

        this.metrics.providerSuccess++;
        this._updateAvgResponseTime(Date.now() - start);

        logger.logChatSuccess(requestId, userId, Date.now() - start, result.usage, 'provider');

        return {
          text: result.text,
          suggestions: result.suggestions || this._defaultSuggestions(),
          source: 'provider',
          cached: false,
          responseTime: Date.now() - start,
          requestId,
          usage: result.usage,
        };
      }

      throw new Error('Provider returned generic or empty response');
    } catch (error) {
      this.metrics.providerFailures++;
      logger.logChatError(requestId, userId, error, Date.now() - start);

      const fallback = await this._getFallback(message, context);

      if (stream && !fallback.text) {
        throw error;
      }

      return {
        ...fallback,
        source: 'heuristic',
        cached: false,
        responseTime: Date.now() - start,
        error: error.message,
        requestId,
      };
    }
  }

  async _callProvider({ message, context, history, stream, requestId }) {
    const messages = this.promptBuilder.buildMessages(message, context, history);

    if (stream) {
      const provider = this.provider;
      if (!provider.isConfigured()) {
        throw new Error('AI provider not configured');
      }

      return {
        text: null,
        stream: provider.streamChat(messages, {
          temperature: 0.7,
          maxTokens: 800,
        }),
      };
    }

    const providerStart = Date.now();
    try {
      const response = await this.provider.chat(messages, {
        temperature: 0.7,
        maxTokens: 800,
      });

      logger.logProviderCall(requestId, this._providerName(), this.provider.model, Date.now() - providerStart, true);

      return {
        text: response.content,
        usage: response.usage,
        suggestions: null,
      };
    } catch (err) {
      logger.logProviderCall(requestId, this._providerName(), this.provider.model, Date.now() - providerStart, false);
      throw err;
    }
  }

  async _getFallback(message, context) {
    try {
      const { localCoachResponse } = require('./localCoachFallback');
      const result = localCoachResponse(message, context);
      return {
        text: result.text,
        suggestions: result.suggestions,
        isFallback: true,
      };
    } catch (err) {
      return {
        text: "I can help with your GATE preparation! Focus on core subjects: DSA, OS, DBMS, and CN. Solve PYQs daily and revise regularly. What would you like to know?",
        suggestions: this._defaultSuggestions(),
        isFallback: true,
        error: err.message,
      };
    }
  }

  _sanitizeContext(context) {
    if (!context || typeof context !== 'object') return {};
    return {
      weakSubjects: Array.isArray(context.weakSubjects) ? context.weakSubjects.slice(0, 5) : [],
      strongSubjects: Array.isArray(context.strongSubjects) ? context.strongSubjects.slice(0, 5) : [],
      weakTopics: Array.isArray(context.weakTopics) ? context.weakTopics.slice(0, 5) : [],
      overallProgress: Math.min(100, Math.max(0, context.overallProgress || 0)),
      streak: Math.max(0, context.streak || 0),
      mockAvg: Math.min(100, Math.max(0, context.mockAvg || 0)),
      recentAccuracy: Math.min(100, Math.max(0, context.recentAccuracy || 0)),
      overdueTopics: Math.max(0, context.overdueTopics || 0),
      daysRemaining: Math.max(0, context.daysRemaining || 220),
    };
  }

  _defaultSuggestions() {
    return [
      "What should I study today?",
      "Am I on track for GATE 2027?",
      "Show my weak topics",
      "How to improve my rank?"
    ];
  }

  _providerName() {
    if (this.provider.isOpenRouter) return 'openrouter';
    if (this.provider.isDashScope) return 'dashscope';
    return 'openai';
  }

  _updateAvgResponseTime(durationMs) {
    const n = this.metrics.totalRequests;
    this.metrics.avgResponseTimeMs = ((this.metrics.avgResponseTimeMs * (n - 1)) + durationMs) / n;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.lastReset,
      cacheStats: this.cache.getCacheStats(),
    };
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      providerSuccess: 0,
      providerFailures: 0,
      avgResponseTimeMs: 0,
      lastReset: Date.now(),
    };
  }

  clearUserConversation(userId, sessionId = 'default') {
    this.conversations.clearHistory(userId, sessionId);
  }

  getUserSessionInfo(userId, sessionId = 'default') {
    return this.conversations.getSessionInfo(userId, sessionId);
  }
}

module.exports = new AICoachService();