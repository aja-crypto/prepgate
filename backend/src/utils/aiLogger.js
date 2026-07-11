const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('[AI Logger] Failed to create log dir:', err.message);
  }
}

const LOG_FILE = path.join(LOG_DIR, 'ai.log');

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG;

function formatTimestamp() {
  return new Date().toISOString();
}

function format(level, message, meta = {}) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

function write(level, message, meta = {}) {
  const levelNum = LEVELS[level] || LEVELS.INFO;
  if (levelNum < CURRENT_LEVEL) return;

  const formatted = format(level, message, meta);

  const colorCodes = {
    DEBUG: '\x1b[36m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  const color = colorCodes[level] || '';

  console.log(`${color}[${level}]\x1b[0m ${message}`, meta.requestId ? `[${meta.requestId}]` : '');

  try {
    fs.appendFileSync(LOG_FILE, formatted + '\n');
  } catch (err) {
    console.error('[AI Logger] Failed to write log:', err.message);
  }
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function logChatStart(requestId, userId, message) {
  write('INFO', 'AI Chat Request Started', {
    requestId,
    userId,
    messageLength: message?.length || 0,
  });
}

function logChatSuccess(requestId, userId, duration, tokens, source) {
  write('INFO', 'AI Chat Success', {
    requestId,
    userId,
    durationMs: duration,
    tokens,
    source,
  });
}

function logChatError(requestId, userId, error, duration) {
  write('ERROR', 'AI Chat Error', {
    requestId,
    userId,
    error: error.message || String(error),
    durationMs: duration,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'),
  });
}

function logCacheHit(requestId, userId, key) {
  write('DEBUG', 'Cache Hit', { requestId, userId, key: key?.slice(0, 50) });
}

function logCacheMiss(requestId, userId, key) {
  write('DEBUG', 'Cache Miss', { requestId, userId, key: key?.slice(0, 50) });
}

function logProviderCall(requestId, provider, model, duration, success) {
  write(success ? 'INFO' : 'ERROR', 'AI Provider Call', {
    requestId,
    provider,
    model,
    durationMs: duration,
    success,
  });
}

function logStreamingDelta(requestId, byteCount) {
  write('DEBUG', 'Streaming Delta', { requestId, byteCount });
}

function logStreamingEnd(requestId, totalBytes, duration) {
  write('INFO', 'Streaming Complete', { requestId, totalBytes, durationMs: duration });
}

function logRateLimit(userId, limit) {
  write('WARN', 'Rate Limit Triggered', { userId, limit });
}

function getRecentLogs(lines = 100) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const allLines = content.trim().split('\n');
    return allLines
      .slice(-lines)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { timestamp: 'unknown', raw: line };
        }
      });
  } catch (err) {
    return [];
  }
}

function getLogStats() {
  try {
    if (!fs.existsSync(LOG_FILE)) return { total: 0, byLevel: {} };
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const allLines = content.trim().split('\n');
    const byLevel = {};
    for (const line of allLines) {
      try {
        const entry = JSON.parse(line);
        byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
      } catch {
        // ignore
      }
    }
    return { total: allLines.length, byLevel };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = {
  generateRequestId,
  logChatStart,
  logChatSuccess,
  logChatError,
  logCacheHit,
  logCacheMiss,
  logProviderCall,
  logStreamingDelta,
  logStreamingEnd,
  logRateLimit,
  getRecentLogs,
  getLogStats,
  debug: (msg, meta) => write('DEBUG', msg, meta),
  info: (msg, meta) => write('INFO', msg, meta),
  warn: (msg, meta) => write('WARN', msg, meta),
  error: (msg, meta) => write('ERROR', msg, meta),
};