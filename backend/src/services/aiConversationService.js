const MAX_HISTORY_MESSAGES = 20;
const MAX_TOKEN_BUDGET = 3000;
const TOKENS_PER_MESSAGE = 150;

class ConversationService {
  constructor() {
    this.conversations = new Map();
  }

  _getKey(userId, sessionId = 'default') {
    return `${userId}:${sessionId}`;
  }

  _estimateTokens(messages) {
    return messages.reduce((sum, m) => sum + Math.ceil((m.content || '').length / 4), 0);
  }

  _trimToBudget(messages, budget = MAX_TOKEN_BUDGET) {
    if (messages.length <= MAX_HISTORY_MESSAGES && this._estimateTokens(messages) <= budget) {
      return messages;
    }

    let trimmed = [...messages].reverse();
    while (trimmed.length > 0 && (trimmed.length > MAX_HISTORY_MESSAGES || this._estimateTokens(trimmed) > budget)) {
      trimmed.shift();
    }
    return trimmed.reverse();
  }

  addMessage(userId, role, content, sessionId = 'default', metadata = {}) {
    const key = this._getKey(userId, sessionId);
    if (!this.conversations.has(key)) {
      this.conversations.set(key, []);
    }

    const messages = this.conversations.get(key);
    messages.push({
      role,
      content,
      timestamp: Date.now(),
      metadata,
    });

    this.conversations.set(key, this._trimToBudget(messages));
    return this.getHistory(userId, sessionId);
  }

  getHistory(userId, sessionId = 'default') {
    const key = this._getKey(userId, sessionId);
    return this.conversations.get(key) || [];
  }

  getRecentHistory(userId, count = 10, sessionId = 'default') {
    const history = this.getHistory(userId, sessionId);
    return history.slice(-count);
  }

  getContextForPrompt(userId, sessionId = 'default') {
    const history = this.getHistory(userId, sessionId);
    return history.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  clearHistory(userId, sessionId = 'default') {
    const key = this._getKey(userId, sessionId);
    this.conversations.delete(key);
  }

  getSessionInfo(userId, sessionId = 'default') {
    const key = this._getKey(userId, sessionId);
    const messages = this.conversations.get(key) || [];
    return {
      messageCount: messages.length,
      tokenEstimate: this._estimateTokens(messages),
      lastMessageAt: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
      topics: this._extractTopics(messages),
    };
  }

  _extractTopics(messages) {
    const subjects = [
      'Operating Systems', 'Computer Networks', 'DBMS', 'Data Structures',
      'Algorithms', 'Computer Organization', 'TOC', 'Compiler Design',
      'Digital Logic', 'Engineering Mathematics', 'Aptitude',
    ];
    const topics = new Set();
    for (const m of messages) {
      if (m.role === 'user') {
        const lower = m.content.toLowerCase();
        for (const s of subjects) {
          if (lower.includes(s.toLowerCase())) topics.add(s);
        }
      }
    }
    return Array.from(topics);
  }

  cleanupOldSessions(maxAge = 86400000) {
    const cutoff = Date.now() - maxAge;
    let removed = 0;
    for (const [key, messages] of this.conversations.entries()) {
      if (messages.length > 0 && messages[messages.length - 1].timestamp < cutoff) {
        this.conversations.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

const conversationService = new ConversationService();

setInterval(() => {
  const removed = conversationService.cleanupOldSessions(86400000);
  if (removed > 0) {
    console.log(`[ConversationService] Cleaned up ${removed} old sessions`);
  }
}, 3600000);

module.exports = conversationService;