class LRUCache {
  constructor(maxSize = 500, defaultTTL = 3600000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.accessTimes = new Map();
  }

  _generateKey(question, context = {}) {
    const relevantContext = {
      subject: context.subject,
      topic: context.topic,
      difficulty: context.difficulty,
    };
    return JSON.stringify({ question: question.trim().toLowerCase(), context: relevantContext });
  }

  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  _evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }

  _evictLRU() {
    if (this.cache.size >= this.maxSize) {
      let oldestKey = null;
      let oldestTime = Infinity;
      for (const [key, time] of this.accessTimes.entries()) {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessTimes.delete(oldestKey);
      }
    }
  }

  set(question, answer, context = {}, ttl = this.defaultTTL) {
    this._evictExpired();
    this._evictLRU();

    const key = this._generateKey(question, context);
    const entry = {
      answer,
      context,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
    };
    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());
    return key;
  }

  get(question, context = {}) {
    this._evictExpired();

    const key = this._generateKey(question, context);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    entry.hits++;
    this.accessTimes.set(key, Date.now());
    return entry.answer;
  }

  has(question, context = {}) {
    return this.get(question, context) !== null;
  }

  delete(question, context = {}) {
    const key = this._generateKey(question, context);
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  getStats() {
    this._evictExpired();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this._calculateHitRate(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key: key.slice(0, 100),
        hits: entry.hits,
        age: Date.now() - entry.createdAt,
        ttl: entry.expiresAt - Date.now(),
      })),
    };
  }

  _calculateHitRate() {
    let totalHits = 0;
    let totalRequests = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1;
    }
    return totalRequests > 0 ? (totalHits / totalRequests).toFixed(2) : 0;
  }

  pruneOlderThan(maxAge) {
    const cutoff = Date.now() - maxAge;
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < cutoff) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

const questionCache = new LRUCache(500, 3600000);
const formulaCache = new LRUCache(200, 86400000);
const summaryCache = new LRUCache(100, 86400000);

function getCachedQuestion(question, context = {}) {
  return questionCache.get(question, context);
}

function setCachedQuestion(question, answer, context = {}, ttl) {
  return questionCache.set(question, answer, context, ttl);
}

function getCachedFormula(formula, subject) {
  return formulaCache.get(formula, { subject });
}

function setCachedFormula(formula, explanation, subject, ttl) {
  return formulaCache.set(formula, explanation, { subject }, ttl);
}

function getCachedSummary(topic, subject) {
  return summaryCache.get(topic, { subject });
}

function setCachedSummary(topic, summary, subject, ttl) {
  return summaryCache.set(topic, summary, { subject }, ttl);
}

function getCacheStats() {
  return {
    questions: questionCache.getStats(),
    formulas: formulaCache.getStats(),
    summaries: summaryCache.getStats(),
  };
}

function clearAllCaches() {
  questionCache.clear();
  formulaCache.clear();
  summaryCache.clear();
}

function warmupCache() {
  const commonQuestions = [
    { q: 'What is deadlock?', a: 'Deadlock is a situation where two or more processes are unable to proceed because each is waiting for the other to release a resource.', context: { subject: 'Operating Systems', topic: 'Deadlock' } },
    { q: 'Explain CPU scheduling algorithms', a: 'CPU scheduling algorithms: FCFS, SJF, Round Robin, Priority. Each has different avg waiting time, turnaround time.', context: { subject: 'Operating Systems', topic: 'CPU Scheduling' } },
    { q: 'What is normalization?', a: 'Normalization is organizing data to reduce redundancy and improve integrity. 1NF, 2NF, 3NF, BCNF.', context: { subject: 'DBMS', topic: 'Normalization' } },
    { q: 'Difference between TCP and UDP', a: 'TCP: connection-oriented, reliable, ordered. UDP: connectionless, fast, no guarantee.', context: { subject: 'Computer Networks', topic: 'Transport Layer' } },
  ];

  for (const item of commonQuestions) {
    if (!questionCache.has(item.q, item.context)) {
      questionCache.set(item.q, item.a, item.context);
    }
  }
}

module.exports = {
  LRUCache,
  questionCache,
  formulaCache,
  summaryCache,
  getCachedQuestion,
  setCachedQuestion,
  getCachedFormula,
  setCachedFormula,
  getCachedSummary,
  setCachedSummary,
  getCacheStats,
  clearAllCaches,
  warmupCache,
};