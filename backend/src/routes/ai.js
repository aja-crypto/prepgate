// AI study planner — GPT when OPENAI_API_KEY is set, heuristic fallback otherwise
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { protect } = require('../middleware/auth');
const { validateFields } = require('../middleware/validateInput');
const aiUsage = require('../services/aiUsageTracker');
const promptGuard = require('../services/promptGuard');
const { aiQuota, FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT } = require('../middleware/aiQuota');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { isMongoConnected } = require('../config/db');
const { DEMO_EMAIL, isDemoUser } = require('../utils/permissions');

let lastAiError = null;
let lastAiMeta = null;      // { provider, model, status, reason, detail, ts } — for the offline details panel
let lastProviderUsed = null; // provider that last succeeded (OpenRouter/OpenAI/DashScope)

// ─── Internal AI request instrumentation (debug-only, never exposed to users) ───
const aiRequestLog = {
  requests: [],
  maxEntries: 500,
  record(entry) {
    this.requests.push({ ts: new Date().toISOString(), ...entry });
    if (this.requests.length > this.maxEntries) {
      this.requests.splice(0, this.requests.length - this.maxEntries);
    }
    // Compact single-line debug log for live tailing.
    const { provider, model, inputChars, estInputTokens, outputChars, estOutputTokens, latencyMs, retries, ok, fallbackReason } = entry;
    console.log(
      `[AI-Telemetry] provider=${provider} model=${model} in=${inputChars}ch/~${estInputTokens}t ` +
      `out=${outputChars}ch/~${estOutputTokens}t latency=${latencyMs}ms retries=${retries} ok=${ok}` +
      (fallbackReason ? ` fallback=${fallbackReason}` : '')
    );
  },
  last() {
    return this.requests[this.requests.length - 1] || null;
  },
};

// Rough token estimate: ~4 chars per token for English text.
function estimateTokens(str) {
  if (!str) return 0;
  return Math.max(1, Math.ceil(String(str).length / 4));
}

// Capture exact provider request/response JSON for verification when enabled.
function captureAiExchange(requestBody, responseBody, ok, meta = {}) {
  const dir = process.env.AI_CAPTURE_DIR;
  if (!dir) return;
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ts = Date.now();
    const safe = JSON.stringify({
      capturedAt: new Date().toISOString(),
      ok,
      model: meta.model || requestBody?.model || null,
      provider: meta.provider || null,
      responseTimeMs: meta.responseTimeMs || null,
      usage: responseBody?.usage || null,
      request: requestBody,
      response: responseBody,
    }, null, 2);
    fs.writeFileSync(path.join(dir, `ai_exchange_${ts}.json`), safe);
    console.log(`[AI Capture] wrote ${path.join(dir, `ai_exchange_${ts}.json`)}`);
  } catch (e) {
    console.error('[AI Capture] failed:', e.message);
  }
}

const aiRateLimits = new Map();
function aiRateLimit(req, res, next) {
  const isPremium = req.user?.isPremium || req.user?.premiumUnlockedViaReferral || false;
  const max = isPremium ? 100 : 20;
  const windowMs = 60 * 60 * 1000;
  const key = req.user?._id?.toString() || req.ip || 'default';
  const now = Date.now();
  let record = aiRateLimits.get(key);
  if (!record || now - record.start > windowMs) {
    record = { start: now, count: 0 };
  }
  record.count++;
  aiRateLimits.set(key, record);
  if (record.count > max) {
    return res.status(429).json({
      success: false,
      message: `AI rate limit exceeded (${max}/hour for ${isPremium ? 'premium' : 'free'} users).`,
    });
  }
  next();
}
setInterval(() => {
  const cutoff = Date.now() - 3600000;
  for (const [key, record] of aiRateLimits) {
    if (record.start < cutoff) aiRateLimits.delete(key);
  }
}, 300000).unref();

// GET /api/ai/quota — returns remaining questions for current user
router.get('/quota', protect, async (req, res) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';
  if (isAdmin) return res.json({ success: true, data: { remaining: 999, limit: 999, isPremium: true } });

  const quota = await checkAiQuota(userId);
  res.json({
    success: true,
    data: { remaining: quota.remaining, limit: quota.limit, isPremium: quota.isPremium, isGuest: quota.isGuest || false },
  });
});

// GET /api/ai/context — returns the complete server-built AI context
// (profile, progress, roadmap, journey, recommendations, analytics, prediction).
router.get('/context', protect, async (req, res) => {
  try {
    const { buildContextForUser } = require('../services/aiContextBuilder');
    const ctx = await buildContextForUser(req.user);
    if (!ctx) return res.status(404).json({ success: false, message: 'No progress data found for user.' });
    res.json({ success: true, data: ctx });
  } catch (e) {
    console.error('[AI Context] failed:', e.message);
    res.status(500).json({ success: false, message: 'Failed to build AI context.' });
  }
});

async function incrementAiUsage(userId) {
  if (!userId) return;
  try {
    const { isMockAuthEnabled } = require('../config/devMode');
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(userId);
      if (!user) return;
      const guest = isDemoUser(user);
      if (guest) {
        user.aiQuestionsUsed = (user.aiQuestionsUsed || 0) + 1;
        await user.save();
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = user.aiQuestionsDate ? new Date(user.aiQuestionsDate).toISOString().slice(0, 10) : null;
      user.aiQuestionsUsed = lastDate === today ? (user.aiQuestionsUsed || 0) + 1 : 1;
      user.aiQuestionsDate = new Date();
      await user.save();
      return;
    }
    const User = require('../models/User');
    const user = await User.findById(userId).select('email');
    const guest = user && isDemoUser(user);
    if (guest) {
      await User.updateOne({ _id: userId }, { $inc: { aiQuestionsUsed: 1 } });
      return;
    }
    await User.updateOne(
      { _id: userId },
      { $inc: { aiQuestionsUsed: 1 }, $setOnInsert: { aiQuestionsDate: new Date() } }
    );
  } catch (e) { /* silent */ }
}

// Last error is now declared at the top of this file

/**
 * POST JSON over HTTPS using a FRESH connection each call.
 * Avoids undici keep-alive stale-connection hangs in long-running servers.
 * Resolves with { status, json } or rejects on network error/timeout.
 */
function httpsPostJson(urlStr, payload, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(urlStr); } catch (e) { return reject(new Error('Invalid endpoint URL')); }
    const lib = u.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);
    const req = lib.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Connection': 'close',
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        clearTimeout(hardTimer);
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(raw); } catch (e) { json = { raw }; }
        resolve({ status: res.statusCode, json, raw, headers: res.headers });
      });
    });
    // Hard total-deadline timeout (fires even if data is trickling slowly)
    const hardTimer = setTimeout(() => {
      req.destroy(new Error('timeout'));
    }, timeoutMs);
    req.on('error', (err) => { clearTimeout(hardTimer); reject(err); });
    req.write(body);
    req.end();
  });
}

/**
 * Streaming POST for OpenAI-compatible chat/completions endpoints that support
 * SSE (`data: {...}` lines terminated by `data: [DONE]`). Forwards each content
 * delta to `onDelta` as it arrives so time-to-first-token reaches the browser.
 */
function httpsPostStream(urlStr, payload, headers, timeoutMs, onDelta) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(urlStr); } catch (e) { return reject(new Error('Invalid endpoint URL')); }
    const lib = u.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);
    let collected = '';
    const req = lib.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'text/event-stream',
        ...headers,
      },
    }, (res) => {
      const disposed = { done: false };
      const flushLines = (chunk) => {
        collected += chunk;
        let idx;
        while ((idx = collected.indexOf('\n')) !== -1) {
          const line = collected.slice(0, idx).trim();
          collected = collected.slice(idx + 1);
          handleLine(line, disposed);
        }
      };
      res.on('data', flushLines);
      res.on('end', () => {
        if (collected.trim()) handleLine(collected.trim(), disposed);
        clearTimeout(hardTimer);
        resolve({ status: res.statusCode, headers: res.headers });
      });
      res.on('error', (err) => { clearTimeout(hardTimer); reject(err); });
    });
    function handleLine(line, disposed) {
      if (disposed.done) return;
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (data === '[DONE]') { disposed.done = true; return; }
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) onDelta(delta);
      } catch (e) { /* ignore malformed SSE line */ }
    }
    const hardTimer = setTimeout(() => {
      req.destroy(new Error('timeout'));
    }, timeoutMs || 20000);
    req.setTimeout(timeoutMs || 20000, () => {
      req.destroy(new Error('socket timeout'));
    });
    req.on('error', (err) => { clearTimeout(hardTimer); reject(err); });
    req.write(body);
    req.end();
  });
}

/**
 * Builds the ordered provider chain (all online — no offline/local source).
 * OpenAI is always preferred per product requirement (the AI assistant answers
 * from OpenAI online); OpenRouter and DashScope act as ONLINE fallbacks when a
 * higher-priority provider is unavailable/rate-limited, so real answers always
 * reach the user. Skips providers whose key is absent.
 */
function buildProviderChain() {
  const chain = [];
  if (process.env.OPENAI_API_KEY) {
    chain.push({
      name: 'OpenAI',
      key: process.env.OPENAI_API_KEY,
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      extraHeaders: {},
      isOpenRouter: false,
    });
  }
  if (process.env.GEMINI_API_KEY) {
    chain.push({
      name: 'Gemini',
      key: process.env.GEMINI_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
      extraHeaders: {},
      isOpenRouter: false,
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    chain.push({
      name: 'OpenRouter',
      key: process.env.OPENROUTER_API_KEY,
      endpoint: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions',
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      extraHeaders: { 'HTTP-Referer': 'https://GateNexa.app', 'X-Title': 'GateNexa' },
      isOpenRouter: true,
    });
  }
  if (process.env.DASHSCOPE_API_KEY) {
    chain.push({
      name: 'DashScope',
      key: process.env.DASHSCOPE_API_KEY,
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
      extraHeaders: {},
      isOpenRouter: false,
    });
  }
  return chain;
}

/** Per-provider AI call (single provider config) — used by callAiApi's chain. */
async function callAiApiSingle(providerCfg, messages, options = {}) {
  const { name: providerName, key: apiKey, endpoint, model, isOpenRouter, extraHeaders } = providerCfg;

  console.log(`[callAiApi] Calling ${model} via ${providerName}`);

  const maxRetries = 1;

  // Fallback chain: if the configured model is rate-limited/unavailable (429/404),
  // try other OpenAI models on OpenRouter so answers stay from OpenAI online.
  const isOpenRouterModelChain = isOpenRouter && !(options.noFallback);
  const modelChain = isOpenRouterModelChain
    ? [model, 'openai/gpt-4o-mini', 'openai/gpt-3.5-turbo', 'openai/gpt-4o']
    : [model];

  // ── Telemetry for this whole call ──
  const inputText = (messages || []).map(m => m.content || '').join(' ');
  const inputChars = inputText.length;
  const estInputTokens = estimateTokens(inputText);
  const callStartTs = Date.now();
  let totalRetries = 0;
  let successModel = null;
  let successOutput = null;

  for (let chainIdx = 0; chainIdx < modelChain.length; chainIdx++) {
    const activeModel = modelChain[chainIdx];
    const isFallbackModel = chainIdx > 0;
    if (isFallbackModel) console.log(`[callAiApi] Trying fallback model: ${activeModel}`);
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) { console.log(`[callAiApi] Retry attempt ${attempt}/${maxRetries}`); totalRetries++; }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s attempt — fail fast to next model / offline fallback
    const reqStartTs = Date.now();

    const requestPayload = {
      model: activeModel,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1500,
      response_format: options.response_format || { type: 'text' },
    };
    console.log(`[callAiApi] Payload bytes: ${Buffer.byteLength(JSON.stringify(requestPayload))}, messages: ${messages.length}`);

    try {
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        ...(isOpenRouter ? { 'HTTP-Referer': 'https://GateNexa.app', 'X-Title': 'GateNexa' } : {}),
      };
      const { status, json: jsonBody, raw, headers: respHeaders } = await httpsPostJson(endpoint, requestPayload, headers, 15000);

      clearTimeout(timeoutId);

      const res = { status, ok: status >= 200 && status < 300, json: async () => jsonBody };
      const json = jsonBody || {};

      if (!res.ok) {
        const errorBody = json.raw ? { message: json.raw } : json;
        captureAiExchange(requestPayload, errorBody, false, {
          model: activeModel,
          provider: providerName,
          responseTimeMs: Date.now() - reqStartTs,
        });
        const errorDetail = errorBody.error?.message || errorBody.message || `HTTP ${status}`;

        if (status === 429) {
          console.error(`[callAiApi] Rate limited (429) on ${activeModel}: ${errorDetail}`);
          // Quota/auth-limited keys (e.g. insufficient_quota) cannot recover on
          // retry — fail fast so the online provider chain moves to the next key.
          const isQuotaExhausted = /quota|billing|insufficient|free.limit/i.test(errorDetail);
          if (attempt < maxRetries && !isQuotaExhausted) {
            const retryAfter = parseInt(respHeaders?.['retry-after'] || '2', 10);
            console.log(`[callAiApi] Waiting ${retryAfter}s before retry...`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            continue;
          }
          lastAiError = 'AI service rate limited. Please wait and try again.';
          lastAiMeta = { provider: providerName, model: activeModel, status, reason: lastAiError, detail: errorDetail, ts: new Date().toISOString() };
        } else if (status === 401 || status === 403) {
          console.error(`[callAiApi] Auth error (${status}): ${errorDetail}`);
          lastAiError = 'AI API authentication failed. Check your API key.';
          lastAiMeta = { provider: providerName, model: activeModel, status, reason: lastAiError, detail: errorDetail, ts: new Date().toISOString() };
        } else if (status === 404) {
          console.error(`[callAiApi] Model not found (404) on ${activeModel}, trying fallback...`);
          lastAiError = 'AI model unavailable. Trying fallback.';
          lastAiMeta = { provider: providerName, model: activeModel, status, reason: lastAiError, detail: errorDetail, ts: new Date().toISOString() };
        } else if (status >= 500) {
          console.error(`[callAiApi] Server error (${status}) attempt ${attempt + 1}: ${errorDetail}`);
          if (attempt < maxRetries) {
            console.log('[callAiApi] Retrying after server error...');
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          lastAiError = `AI service temporarily unavailable (${status}). Please try again later.`;
          lastAiMeta = { provider: providerName, model: activeModel, status, reason: lastAiError, detail: errorDetail, ts: new Date().toISOString() };
        } else {
          console.error(`[callAiApi] API error (${status}): ${errorDetail}`);
          lastAiError = 'The AI service is temporarily unavailable. Please try again later.';
          lastAiMeta = { provider: providerName, model: activeModel, status, reason: lastAiError, detail: errorDetail, ts: new Date().toISOString() };
        }
        // Break attempt loop, try next model in chain (or return null if none)
        break;
      }

      captureAiExchange(requestPayload, json, true, {
        model: activeModel,
        provider: providerName,
        responseTimeMs: Date.now() - reqStartTs,
      });

      if (!json.choices?.[0]?.message) {
        console.error('[callAiApi] Malformed response — missing choices[0].message:', JSON.stringify(json).slice(0, 500));
        lastAiError = 'AI returned an unexpected response format';
        lastAiMeta = { provider: providerName, model: activeModel, status: 200, reason: lastAiError, detail: 'Response body did not contain choices[0].message.', ts: new Date().toISOString() };
        break;
      }

      const content = json.choices[0].message.content;
      if (!content) {
        console.error('[callAiApi] AI returned empty content');
        lastAiError = 'AI returned an empty response';
        lastAiMeta = { provider: providerName, model: activeModel, status: 200, reason: lastAiError, detail: 'choices[0].message.content was empty.', ts: new Date().toISOString() };
        break;
      }

      console.log(`[callAiApi] Success: ${content.length} chars (model: ${activeModel})`);
      lastAiError = null;
      lastAiMeta = null;
      lastProviderUsed = providerName;
      successModel = activeModel;
      successOutput = content;
      aiRequestLog.record({
        provider: providerName,
        model: activeModel,
        inputChars,
        estInputTokens,
        outputChars: content.length,
        estOutputTokens: estimateTokens(content),
        latencyMs: Date.now() - callStartTs,
        retries: totalRetries,
        ok: true,
        fallbackReason: chainIdx > 0 ? `model_fallback_from_primary` : null,
      });
      return content;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        console.error(`[callAiApi] Timeout (attempt ${attempt + 1}) on ${activeModel}`);
        if (attempt < maxRetries) {
          console.log('[callAiApi] Retrying after timeout...');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        lastAiError = 'AI request timed out. Please try again.';
        lastAiMeta = { provider: providerName, model: activeModel, status: 408, reason: lastAiError, detail: 'Request exceeded the 15s deadline.', ts: new Date().toISOString() };
      } else {
        console.error(`[callAiApi] Fetch error (attempt ${attempt + 1}):`, err.message);
        if (attempt < maxRetries) {
          console.log('[callAiApi] Retrying after fetch error...');
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        lastAiError = `AI request failed: ${err.message}`;
        lastAiMeta = { provider: providerName, model: activeModel, status: null, reason: 'AI request failed', detail: err.message, ts: new Date().toISOString() };
      }
    }
    break; // attempt loop ends after a non-recoverable error for this model
    }
  }

  console.error('[callAiApi] All retry attempts exhausted');
  aiRequestLog.record({
    provider: providerName,
    model: modelChain[0],
    inputChars,
    estInputTokens,
    outputChars: successOutput ? successOutput.length : 0,
    estOutputTokens: successOutput ? estimateTokens(successOutput) : 0,
    latencyMs: Date.now() - callStartTs,
    retries: totalRetries,
    ok: false,
    fallbackReason: lastAiError || 'unknown_provider_error',
  });
  return null;
}

/**
 * Generic AI API caller supporting OpenAI / OpenRouter / DashScope (all online).
 * Walks the provider chain (buildProviderChain) so a quota-limiting/invalid
 * primary provider never blocks the answer — the next online provider is used.
 * Returns the first successful text, or null if every provider failed.
 */
async function callAiApi(messages, options = {}) {
  const chain = buildProviderChain();
  if (!chain.length) {
    console.error('[callAiApi] No API key configured');
    lastAiError = 'No API key configured';
    lastAiMeta = { provider: null, model: null, status: null, reason: 'No API key configured', detail: 'No OPENAI_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY / DASHSCOPE_API_KEY is set in the backend environment.', ts: new Date().toISOString() };
    return null;
  }

  for (let i = 0; i < chain.length; i++) {
    const cfg = chain[i];
    const text = await callAiApiSingle(cfg, messages, options);
    if (text) {
      lastProviderUsed = cfg.name;
      return text;
    }
    if (i < chain.length - 1) {
      console.log(`[callAiApi] ${cfg.name} failed, falling back to ${chain[i + 1].name} (online)`);
    }
  }
  console.error('[callAiApi] All online providers failed');
  return null;
}

/**
 * Streaming AI chat caller. Walks the online provider chain (buildProviderChain):
 * OpenAI is PRIMARY (product requirement), falling back to OpenRouter / DashScope
 * when a higher-priority provider is rate-limited or unavailable. All providers
 * are online — there is never an offline/local/cached answer source here.
 *
 * @returns {Promise<{text:string, provider:string, model:string}|null>} full text or null on failure.
 */
async function streamAiApi(messages, options = {}, onDelta) {
  const chain = buildProviderChain();
  if (!chain.length) {
    lastAiError = 'No API key configured';
    lastAiMeta = { provider: null, model: null, status: null, reason: 'No API key configured', detail: 'No OPENAI_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY / DASHSCOPE_API_KEY is set in the backend environment.', ts: new Date().toISOString() };
    return null;
  }

  const inputText = (messages || []).map(m => m.content || '').join(' ');
  const callStartTs = Date.now();
  const opts = options;

  let lastError = null;
  for (let i = 0; i < chain.length; i++) {
    const { name: providerName, key: apiKey, endpoint, model, extraHeaders } = chain[i];
    console.log(`[streamAiApi] Calling ${model} via ${providerName} (streaming)`);

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    };

    let fullText = '';
    try {
      const result = await httpsPostStream(
        endpoint,
        {
          model,
          messages,
          temperature: opts.temperature || 0.7,
          max_tokens: opts.max_tokens || 1500,
          response_format: opts.response_format || { type: 'text' },
          stream: true,
        },
        headers,
        opts.timeoutMs || 60000,
        (delta) => { fullText += delta; if (onDelta) onDelta(delta); }
      );

      if (!result || result.status < 200 || result.status >= 300) {
        const detail = `HTTP ${result?.status}`;
        console.error(`[streamAiApi] ${providerName} failed: ${detail}`);
        lastError = `AI request failed (HTTP ${result?.status}). Please try again.`;
        lastAiError = lastError;
        lastAiMeta = { provider: providerName, model, status: result?.status, reason: lastError, ts: new Date().toISOString() };
        // quota/timeout/auth on primary → try next online provider in the chain
        continue;
      }

      if (!fullText) {
        lastError = 'AI returned an empty streamed response.';
        lastAiError = lastError;
        lastAiMeta = { provider: providerName, model, status: result.status, reason: lastError, ts: new Date().toISOString() };
        continue;
      }

      lastAiError = null;
      lastAiMeta = null;
      lastProviderUsed = providerName;
      aiRequestLog.record({
        provider: providerName,
        model,
        inputChars: inputText.length,
        estInputTokens: estimateTokens(inputText),
        outputChars: fullText.length,
        estOutputTokens: estimateTokens(fullText),
        latencyMs: Date.now() - callStartTs,
        retries: i,
        ok: true,
        streamed: true,
        fallbackReason: i > 0 ? `provider_fallback_from_${chain[0].name}` : null,
      });
      return { text: fullText, provider: providerName, model };
    } catch (err) {
      console.error(`[streamAiApi] Streaming error from ${providerName}:`, err.message);
      lastError = `AI request failed: ${err.message}`;
      lastAiError = lastError;
      lastAiMeta = { provider: providerName, model, status: null, reason: 'AI request failed', detail: err.message, ts: new Date().toISOString() };
      // network hiccup → try next online provider
      continue;
    }
  }

  console.error('[streamAiApi] All online providers failed');
  return null;
}

/** GATE CSE subject weightage (approx marks out of 100) */
const SUBJECT_WEIGHTAGE = {
  'Operating Systems': 9, 'Computer Networks': 8.5, 'DBMS': 8,
  'Computer Organization': 8.5, 'Theory of Computation': 8, 'Algorithms': 7.5,
  'Programming & Data Structures': 11.5, 'Engineering Mathematics': 12.5,
  'Digital Logic': 5, 'Compiler Design': 5, 'General Aptitude': 15,
};

function getExamPhase(daysRemaining) {
  if (daysRemaining > 180) return { phase: 'foundation', conceptWeight: 0.6, practiceWeight: 0.3, revisionWeight: 0.1 };
  if (daysRemaining > 120) return { phase: 'deepening', conceptWeight: 0.4, practiceWeight: 0.4, revisionWeight: 0.2 };
  if (daysRemaining > 60)  return { phase: 'practice',  conceptWeight: 0.2, practiceWeight: 0.5, revisionWeight: 0.3 };
  if (daysRemaining > 14)  return { phase: 'revision',  conceptWeight: 0.1, practiceWeight: 0.3, revisionWeight: 0.6 };
  return { phase: 'final', conceptWeight: 0.0, practiceWeight: 0.2, revisionWeight: 0.8 };
}

function getWeightageSortedSubjects(subjects) {
  if (!subjects?.length) return Object.entries(SUBJECT_WEIGHTAGE).sort((a, b) => b[1] - a[1]).map(([name]) => ({ name, weightage: SUBJECT_WEIGHTAGE[name] }));
  return [...subjects].sort((a, b) => {
    const wa = SUBJECT_WEIGHTAGE[a.name] || 5;
    const wb = SUBJECT_WEIGHTAGE[b.name] || 5;
    const pa = a.progress || 0;
    const pb = b.progress || 0;
    return (wa * (1 - pa / 100)) - (wb * (1 - pb / 100));
  }).map(s => ({ ...s, weightage: SUBJECT_WEIGHTAGE[s.name] || 5 }));
}

function buildHeuristicPlan(body) {
  const { subjects = [], topics = [], dailyHours = 8, period = 'week' } = body;
  const daysRemaining = body.daysRemaining || body.context?.daysRemaining || 365;
  const incomplete = topics.filter((t) => !t.done);
  const sorted = getWeightageSortedSubjects(subjects);
  const phase = getExamPhase(daysRemaining);
  const weakSubjects = subjects.filter(s => s.progress > 0 && s.progress < 50).sort((a, b) => a.progress - b.progress);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weakHours = Math.max(0.5, Math.round(dailyHours * phase.conceptWeight * 10) / 10);
  const practiceHours = Math.max(0.5, Math.round(dailyHours * phase.practiceWeight * 10) / 10);
  const revisionHours = Math.max(0.5, Math.round(dailyHours * phase.revisionWeight * 10) / 10);

  if (period === 'day') {
    const primarySubject = sorted[0]?.name || 'Engineering Mathematics';
    const secondarySubject = sorted[1]?.name || 'Operating Systems';
    const thirdSubject = sorted[2]?.name || 'Algorithms';
    const primaryTopic = incomplete.find((t) => t.subject === primarySubject) || incomplete[0];
    const secondaryTopic = incomplete.find((t) => t.subject === secondarySubject) || incomplete[1];

    const items = [];
    if (phase.conceptWeight > 0.1) {
      items.push(
        { day: '1', subject: primarySubject, topic: `Revise ${primaryTopic?.name || 'core concepts'}`, hours: weakHours, tasks: ['Read short notes', 'Make a one-page formula sheet'] },
        { day: '2', subject: primarySubject, topic: `Solve 20 ${primarySubject.split(' ')[0]} PYQs`, hours: practiceHours, tasks: ['Time-box the set', 'Review every mistake'] },
      );
    }
    if (phase.practiceWeight > 0.1) {
      items.push(
        { day: String(items.length + 1), subject: secondarySubject, topic: `Complete ${secondaryTopic?.name || 'key topics'}`, hours: practiceHours, tasks: ['Rewatch tricky concepts', 'Attempt 5 practice questions'] },
      );
    }
    if (phase.revisionWeight > 0.1) {
      items.push(
        { day: String(items.length + 1), subject: thirdSubject, topic: `Revise & quiz: ${thirdSubject}`, hours: revisionHours, tasks: ['Attempt 15 mixed questions', 'Mark weak subtopics for revision'] },
      );
    }
    if (items.length === 0) {
      items.push({ day: '1', subject: primarySubject, topic: 'Light revision + confidence review', hours: dailyHours, tasks: ['Review formula sheet', 'Solve 10 easy PYQs', 'Rest well'] });
    }
    return items;
  }

  if (weakSubjects.length === 0 && incomplete.length === 0) {
    return days.map(day => ({
      day,
      subject: 'Mixed Review',
      topic: 'General Revision',
      hours: dailyHours,
      tasks: ['Review core concepts', 'Solve 5 PYQs', 'Mock analysis']
    }));
  }

  return days.map((day, i) => {
    const sub = sorted[i % Math.max(sorted.length, 1)];
    const topic = (incomplete.filter(t => t.subject === sub?.name) || [])[0] || incomplete[i % Math.max(incomplete.length, 1)];
    const dayHours = i < 5 ? dailyHours : Math.max(1, dailyHours - 1);
    const tasks = [];
    if (phase.conceptWeight > 0.1) tasks.push(topic ? `Study: ${topic.name}` : 'Review core concepts');
    if (phase.practiceWeight > 0.1) tasks.push('Solve 2–3 PYQs');
    if (phase.revisionWeight > 0.1) tasks.push(i % 2 === 0 ? 'Formula revision (30 min)' : 'Mock analysis / weak area drill');
    if (tasks.length === 0) tasks.push('Light review + rest');
    return {
      day,
      subject: sub?.name || 'Mixed Review',
      topic: topic?.name || 'Revision',
      hours: dayHours,
      tasks,
    };
  });
}

async function buildGptPlan(body) {
  const { subjects = [], topics = [], pyqs = [], mocks = [], dailyHours = 8, period = 'week' } = body;
  const daysRemaining = body.daysRemaining || body.context?.daysRemaining || 365;
  const incomplete = topics.filter((t) => !t.done).slice(0, 15);
  const unsolvedPyqs = pyqs.filter((p) => !p.solved).slice(0, 10);
  const recentMock = mocks[mocks.length - 1];
  const phase = getExamPhase(daysRemaining);

  const prompt = period === 'day'
    ? `You are a GATE CSE 2027 study coach. Create a TODAY study plan as a JSON array with exactly 4 items.
Each item must be an object with: { "day": "1", "subject": "...", "topic": "...", "hours": number, "tasks": ["...", "..."] }
Make it concrete and exam-focused. Use short, actionable items like "Revise Deadlocks", "Solve 20 DBMS PYQs", "Complete CN Routing", and "Take TOC Quiz" when relevant.
Daily target: ${dailyHours} hours. Focus weak subjects first.
Exam phase: ${phase.label} (${daysRemaining} days remaining). ${phase.conceptWeight > 0.3 ? 'Focus on building concepts.' : phase.revisionWeight > 0.3 ? 'Focus on revision and mocks.' : 'Balance concepts, practice, and revision.'}

Weak subjects: ${subjects.filter((s) => s.progress < 60).map((s) => `${s.name} (${s.progress}%)`).join(', ') || 'none'}
Incomplete topics: ${incomplete.map((t) => `${t.name} (${t.subject})`).join(', ') || 'none'}
Unsolved PYQs: ${unsolvedPyqs.map((p) => p.title).join(', ') || 'none'}
Latest mock: ${recentMock ? `${recentMock.name} — ${recentMock.score} marks, notes: ${recentMock.notes || 'none'}` : 'none'}

Return ONLY valid JSON array with 4 items.`
    : `You are a GATE CSE 2027 study coach. Create a ${period}ly study plan as JSON array.
Each item: { "day": "Monday", "subject": "...", "topic": "...", "hours": number, "tasks": ["...", "..."] }
Daily target: ${dailyHours} hours. Focus weak subjects first.
Exam phase: ${phase.label} (${daysRemaining} days remaining). ${phase.conceptWeight > 0.3 ? 'Emphasize concept building.' : phase.revisionWeight > 0.3 ? 'Emphasize revision and mock tests.' : 'Balance all three: concepts, practice, revision.'}

Weak subjects: ${subjects.filter((s) => s.progress < 60).map((s) => `${s.name} (${s.progress}%)`).join(', ') || 'none'}
Incomplete topics: ${incomplete.map((t) => `${t.name} (${t.subject})`).join(', ') || 'none'}
Unsolved PYQs: ${unsolvedPyqs.map((p) => p.title).join(', ') || 'none'}
Latest mock: ${recentMock ? `${recentMock.name} — ${recentMock.score} marks, notes: ${recentMock.notes || 'none'}` : 'none'}

Return ONLY valid JSON array, 7 items for a week.`;

  const messages = [
    { role: 'system', content: 'You output only valid JSON arrays for GATE study plans.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { response_format: { type: 'json_object' } });
    if (!text) throw new Error('AI Response empty');

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Failed to build GPT plan, falling back to heuristic:', e.message);
    return buildHeuristicPlan(body);
  }
}

router.use(protect);
router.use(aiRateLimit);
router.use(promptGuard);
router.use(aiQuota);

router.post('/planner', validateFields([
  { name: 'hoursPerDay', type: 'number', required: true, min: 1, max: 24 },
]), async (req, res, next) => {
  const planStart = Date.now();
  try {
    let plan;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Set OPENROUTER_API_KEY in .env';
      } else {
        plan = await buildGptPlan(req.body);
        if (plan?.length) {
          source = 'gpt';
        } else {
          aiError = 'AI returned empty response. Using smart fallback plan.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using smart fallback plan.`;
      plan = null;
    }

    if (!plan?.length) {
      plan = buildHeuristicPlan(req.body);
    }

    aiUsage.increment(true, Date.now() - planStart);
    await incrementAiUsage(req.user?._id?.toString());
    res.json({ success: true, data: { plan, source, aiError } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - planStart);
    next(e);
  }
});

function buildHeuristicRecommendations(data) {
  const recommendations = [];
  const { subjects = [], topics = [], pyqs = [], mocks = [], gateFeatures = {}, studyStats = {} } = data;

  const incompleteTopics = topics.filter(t => !t.done);
  const completedTopics = topics.filter(t => t.done);
  const overallProgress = data.overall?.percentage || 0;

  // 1. What Should I Study Next?
  if (incompleteTopics.length > 0) {
    // Prioritize topics from weak subjects or high weightage (simulated weightage)
    const nextTopic = incompleteTopics[0];
    recommendations.push({
      type: 'next_study',
      title: 'Next High-Impact Topic',
      content: `Based on your progress, you should tackle "${nextTopic.name}" in ${nextTopic.subject}. It's a high-impact topic for GATE.`,
      action: '/topics'
    });
  }

  // 2. Revision Suggestions
  const dueForRevision = pyqs.filter(p => p.revisionNeeded);
  if (dueForRevision.length > 0) {
    recommendations.push({
      type: 'revision',
      title: 'Revision Due',
      content: `You have ${dueForRevision.length} questions marked for revision. Spaced repetition is key to retention.`,
      action: '/revision'
    });
  }

  // 3. Weak Subject Detection & Score Improvement
  const weakSubjects = subjects.filter(s => s.progress > 0 && s.progress < 50).sort((a, b) => a.progress - b.progress);
  if (weakSubjects.length > 0) {
    const s = weakSubjects[0];
    recommendations.push({
      type: 'weak_area',
      title: `Improve ${s.name}`,
      content: `Your progress in ${s.name} is ${s.progress}%. Focusing on its core topics could boost your score by 4-6 marks.`,
      action: '/subjects'
    });
  }

  // 4. Mock Test Suggestions
  if (mocks.length === 0 && overallProgress > 20) {
    recommendations.push({
      type: 'mock_test',
      title: 'Time for a Mock Test',
      content: "You've covered significant ground. Take a subject-wise mock test to validate your learning.",
      action: '/mocks'
    });
  } else if (mocks.length > 0) {
    const avgScore = mocks.reduce((acc, m) => acc + (m.score || 0), 0) / mocks.length;
    if (avgScore < 60) {
      recommendations.push({
        type: 'mock_test',
        title: 'Strategy Shift',
        content: "Your average mock score is below 60%. Try analyzing your mistake patterns before the next test.",
        action: '/analytics'
      });
    }
  }

  // 5. Daily Plan Generator (Simulated)
  recommendations.push({
    type: 'plan',
    title: "Today's Focus Plan",
    content: `1. 2 hours: ${incompleteTopics[0]?.name || 'New Topic'} | 2. 1 hour: Revision | 3. 30 mins: Practice 5 PYQs.`,
    action: '/dashboard'
  });

  // 6. Mistake Pattern Analysis (Heuristic)
  const accuracy = pyqs.length > 0 ? (pyqs.filter(p => p.status === 'correct').length / pyqs.length) * 100 : 100;
  if (accuracy < 70) {
    recommendations.push({
      type: 'mistake_analysis',
      title: 'Accuracy Alert',
      content: "Your PYQ accuracy is below 70%. You might be making silly mistakes or have conceptual gaps in core areas.",
      action: '/pyq'
    });
  }

  // 7. Study Health
  const weeklyHours = studyStats.weeklyHours || [0, 0, 0, 0, 0, 0, 0];
  const totalHours = weeklyHours.reduce((a, b) => a + b, 0);
  if (totalHours > 50) {
    recommendations.push({
      type: 'health',
      title: 'Burnout Risk',
      content: "High study volume detected. Ensure you're taking adequate breaks to maintain long-term focus.",
      action: '/productivity'
    });
  } else if (totalHours < 10 && totalHours > 0) {
     recommendations.push({
      type: 'health',
      title: 'Consistency Check',
      content: "Study hours are lower than usual. Try to aim for at least 3-4 hours daily for consistent growth.",
      action: '/productivity'
    });
  }

  // 8. Exam Readiness
  let status = 'Beginner';
  if (overallProgress > 75) status = 'Exam Ready';
  else if (overallProgress > 40) status = 'Intermediate';

  recommendations.push({
    type: 'readiness',
    title: 'Milestone: ' + status,
    content: `You've completed ${overallProgress}% of the syllabus. You are moving towards the ${status === 'Beginner' ? 'Intermediate' : 'Advanced'} phase.`,
    action: '/analytics'
  });

  return recommendations;
}

async function buildGptRecommendations(data) {
  const prompt = `You are a GATE CSE 2027 AI Mentor. Analyze the following student data and provide 6-8 personalized, actionable recommendations and "Smart Messages".
Return ONLY a JSON array of objects: { "type": "string", "title": "string", "content": "string", "action": "string" }

Categories to cover:
1. What Should I Study Next? (Based on weightage/dependency)
2. Revision Suggestions (Spaced repetition)
3. Weak Subject Detection (Low accuracy/progress)
4. Mock Test Suggestions (When to take, what to focus on)
5. Daily/Weekly Plan (A concise roadmap)
6. Score Improvement (Specific topics to gain marks)
7. Mistake Pattern Analysis (Silly mistakes vs Concept gaps)
8. Study Health (Burnout, consistency)
9. Exam Readiness (Level: Beginner, Intermediate, Pro)

Types: next_study, revision, weak_area, mock_test, insight, health, readiness, plan, mistake_analysis.
Actions: /topics, /revision, /subjects, /mocks, /dashboard, /productivity, /analytics, /pyq.

Data:
- Subjects: ${JSON.stringify(data.subjects?.map(s => ({ name: s.name, progress: s.progress })))
}
- Recent Mocks: ${JSON.stringify(data.mocks?.slice(-5))}
- Streak: ${data.gateFeatures?.streak?.current || 0}
- Total Progress: ${data.overall?.percentage || 0}%
- Study Hours (Mon-Sun): ${JSON.stringify(data.studyStats?.weeklyHours)}

Provide specific, professional, and highly motivating advice for a GATE aspirant. Use technical terms like "Normalization", "Paging", "Asymptotic Analysis" if relevant to weak areas.`;

  const messages = [
    { role: 'system', content: 'You are a helpful GATE CSE 2027 mentor that outputs recommendations as JSON arrays.' },
    { role: 'user', content: prompt },
  ];

  const text = await callAiApi(messages, { response_format: { type: 'json_object' } });
  if (!text) return null;

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e);
    return null;
  }
}

router.post('/recommendations', validateFields([
  { name: 'subjects', type: 'array', required: false },
  { name: 'topics', type: 'array', required: false },
  { name: 'mocks', type: 'array', required: false },
  { name: 'pyqs', type: 'array', required: false },
]), async (req, res, next) => {
  const recStart = Date.now();
  try {
    let recommendations;
    let analysis;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Using smart analysis instead.';
      } else {
        const result = await buildGptAnalysis(req.body);
        if (result) {
          recommendations = result.recommendations;
          analysis = result.analysis;
          source = 'gpt';
        } else {
          aiError = 'AI analysis unavailable. Using smart analysis instead.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using smart analysis instead.`;
    }

    if (!recommendations) {
      recommendations = buildHeuristicRecommendations(req.body);
      analysis = buildHeuristicAnalysis(req.body);
    }

    aiUsage.increment(true, Date.now() - recStart);
    await incrementAiUsage(req.user?._id?.toString());
    res.json({ success: true, data: { recommendations, analysis, source, aiError } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - recStart);
    next(e);
  }
});

// ── Quota check ── Demo users: 5 LIFETIME uses (never reset). Free: 30/day. Premium: 200/day.
async function checkAiQuota(userId) {
  if (!userId) return { allowed: true, remaining: 5, limit: 5, isGuest: true };
  try {
    const { isMockAuthEnabled } = require('../config/devMode');
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(userId);
      if (!user) return { allowed: true, remaining: 5, limit: 5, isGuest: true };
      const guest = isDemoUser(user);
      if (guest) {
        const limit = 5;
        const remaining = Math.max(0, limit - (user.aiQuestionsUsed || 0));
        return { allowed: (user.aiQuestionsUsed || 0) < limit, remaining, limit, isPremium: false, isGuest: true };
      }
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = user.aiQuestionsDate ? new Date(user.aiQuestionsDate).toISOString().slice(0, 10) : null;
      if (lastDate !== today) {
        user.aiQuestionsUsed = 0;
        user.aiQuestionsDate = new Date();
        await user.save();
      }
      const limit = user.isPremium ? 200 : 30;
      const remaining = Math.max(0, limit - (user.aiQuestionsUsed || 0));
      return { allowed: (user.aiQuestionsUsed || 0) < limit, remaining, limit, isPremium: user.isPremium || false };
    }
    const User = require('../models/User');
    const user = await User.findById(userId).select('aiQuestionsUsed aiQuestionsDate isPremium email');
    if (!user) return { allowed: true, remaining: 5, limit: 5, isGuest: true };

    const guest = isDemoUser(user);
    if (guest) {
      const limit = 5;
      const remaining = Math.max(0, limit - (user.aiQuestionsUsed || 0));
      return { allowed: user.aiQuestionsUsed < limit, remaining, limit, isPremium: false, isGuest: true };
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastDate = user.aiQuestionsDate ? user.aiQuestionsDate.toISOString().slice(0, 10) : null;

    // Reset if new day (non-demo users only)
    if (lastDate !== today) {
      user.aiQuestionsUsed = 0;
      user.aiQuestionsDate = new Date();
      await user.save();
    }

    const limit = user.isPremium ? 200 : 30;
    const remaining = Math.max(0, limit - user.aiQuestionsUsed);
    return { allowed: user.aiQuestionsUsed < limit, remaining, limit, isPremium: user.isPremium };
  } catch { return { allowed: true, remaining: 5, limit: 5, isGuest: true }; }
}

router.post('/chat', validateFields([
  { name: 'message', type: 'string', required: true, min: 1, max: 5000 },
]), async (req, res, next) => {
  const chatStart = Date.now();
  try {
    let { message, context, conversationId, modePrompt } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Enforce quota
    const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const quota = await checkAiQuota(userId);
      if (!quota.allowed) {
        aiUsage.increment(false, Date.now() - chatStart);
        const msg = quota.isGuest
          ? "You have used all 5 free AI questions. Sign up for unlimited access."
          : "You have reached your AI question limit. Upgrade to continue learning with AI.";
        return res.status(429).json({
          success: false,
          message: msg,
          data: { remaining: 0, limit: quota.limit, isPremium: quota.isPremium, isGuest: quota.isGuest || false },
        });
      }
    }

    message = message.trim();
    context = context || {};

    // Server-side AI context: enrich every AI request with the user's REAL
    // backend data (profile, progress, roadmap, journey, recommendations,
    // analytics, prediction). The frontend-supplied context still provides
    // mode/history/modePrompt, but personalization no longer depends on it.
    try {
      const { buildContextForUser } = require('../services/aiContextBuilder');
      const serverCtx = await buildContextForUser(req.user);
      if (serverCtx) {
        context = { ...serverCtx, ...context };
        context.weakTopics = context.weakTopics?.map?.(t => typeof t === 'string' ? t : t.name) || [];
        context.roadmap = context.roadmap || serverCtx.roadmap;
        context.journey = context.journey || serverCtx.journey;
        context.recommendations = context.recommendations || serverCtx.recommendations;
        context.analytics = context.analytics || serverCtx.analytics;
        context.prediction = context.prediction || serverCtx.prediction;
      }
    } catch (ctxErr) {
      console.error('[AI Coach] context builder failed:', ctxErr.message);
    }

    let conv = null;
    const { isMockAuthEnabled } = require('../config/devMode');
    const isMockUser = req.user?.isGuest === true || userId === 'demo_user_id' || isMockAuthEnabled();
    const mongoOk = isMongoConnected() && !isMockUser;

    if (userId && mongoOk) {
      if (conversationId) {
        conv = await Conversation.findOne({ _id: conversationId, user: userId, isArchived: false });
        if (!conv) {
          conversationId = null;
        }
      }
      if (!conversationId) {
        conv = await Conversation.create({
          user: userId,
          type: 'coach',
          title: message.slice(0, 100),
          context: {
            weakTopics: context.weakTopics || [],
            strongTopics: context.strongTopics || [],
            overallProgress: context.overallProgress,
            mockAvg: context.mockAvg,
            daysToExam: context.daysToExam,
          },
        });
      }
      await Message.create({
        conversation: conv._id,
        role: 'user',
        content: message,
      });
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.lastMessageAt = new Date();
      await conv.save();

      const recentMessages = await Message.find({ conversation: conv._id })
        .sort({ createdAt: -1 }).limit(8).lean();
      context.history = recentMessages.reverse().map(m => ({
        role: m.role,
        content: m.content,
      }));
    }

    // Thread conversationId into context so follow-ups reference the same conversation.
    context.conversationId = conversationId || context.conversationId || null;

    // Streaming is requested by the assistant clients (Accept: text/event-stream
    // or explicit stream flag). JSON path preserved for existing askCoach consumers.
    const wantsStream = req.body.stream === true || /text\/event-stream/i.test(req.headers.accept || '');

    if (wantsStream) {
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (res.flushHeaders) res.flushHeaders();
      const send = (obj) => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };

      let response = null;
      try {
        response = await getAiCoachResponse(message, context, req.user, modePrompt, (delta) => {
          send({ type: 'delta', content: delta });
        });
      } catch (err) {
        console.error('[AI Coach] SSE unhandled error:', err.message);
        response = { text: null, source: 'error', offlineError: 'AI chat error. Please try again.' };
      }

      if (response?.text) {
        if (userId && conv) {
          await Message.create({
            conversation: conv._id,
            role: 'assistant',
            content: response.text,
            metadata: { source: response.source || 'ai' },
          });
          conv.messageCount = (conv.messageCount || 0) + 1;
          conv.lastMessageAt = new Date();
          if (conv.messageCount <= 2) {
            const aiTitle = response.text.slice(0, 100).replace(/\*+/g, '').trim();
            conv.title = aiTitle.length > 10 ? aiTitle : 'AI Chat';
          }
          await conv.save();
        }
        let remaining = null;
        if (!isAdmin) {
          const quotaCheck = await checkAiQuota(userId);
          remaining = { remaining: quotaCheck.remaining, limit: quotaCheck.limit, isPremium: quotaCheck.isPremium };
        }
        aiUsage.increment(true, Date.now() - chatStart);
        await incrementAiUsage(req.user?._id?.toString());
        send({
          type: 'done',
          content: response.text,
          suggestions: response.suggestions?.length ? response.suggestions : ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"],
          source: response.source || 'ai',
          provider: response.provider || lastProviderUsed || 'OpenAI',
          remaining,
        });
      } else {
        aiUsage.increment(false, Date.now() - chatStart);
        send({
          type: 'error',
          content: response?.offlineError || lastAiError || 'AI service is temporarily unavailable. Please try again in a moment.',
        });
      }
      return res.end();
    }

    const response = await getAiCoachResponse(message, context, req.user, modePrompt);
    response.conversationId = conv?._id?.toString() || null;

    // Get updated remaining count after increment
    let remaining = null;
    if (!isAdmin) {
      const quotaCheck = await checkAiQuota(userId);
      remaining = { remaining: quotaCheck.remaining, limit: quotaCheck.limit, isPremium: quotaCheck.isPremium };
    }

    if (userId && conv) {
      await Message.create({
        conversation: conv._id,
        role: 'assistant',
        content: response.text,
        metadata: { source: response.source || 'ai' },
      });
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.lastMessageAt = new Date();
      if (conv.messageCount <= 2) {
        const aiTitle = response.text ? response.text.slice(0, 100).replace(/\*+/g, '').trim() : 'AI Chat';
        conv.title = aiTitle.length > 10 ? aiTitle : 'AI Chat';
      }
      await conv.save();
    }

    aiUsage.increment(true, Date.now() - chatStart);
    await incrementAiUsage(req.user?._id?.toString());
    res.json({ success: true, data: { ...response, remaining } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - chatStart);
    console.error('[AI Coach] Unhandled error:', e.message);
    console.error('[AI Coach] Stack:', e.stack);
    if (res.headersSent) {
      try {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'error', content: 'AI chat error' })}\n\n`);
        }
      } catch (_) {}
      return res.end();
    }
    res.status(500).json({
      success: false,
      message: 'AI chat error',
      data: {
        text: '',
        suggestions: ["What should I study today?", "Show my weak topics", "How to improve accuracy?"],
        conversationId: conv?._id?.toString() || null,
      },
    });
  }
});

function buildHeuristicAnalysis(data) {
  const { subjects = [], topics = [], pyqs = [], mocks = [], studyStats = {} } = data;
  const overallProgress = data.overall?.percentage || 0;
  
  // 1. Rank & Score Prediction (Simplified Heuristic)
  // Base score depends on progress and mock average
  const mockAvg = mocks.length > 0 ? mocks.reduce((a, b) => a + (b.score || 0), 0) / mocks.length : 0;
  const pyqAccuracy = pyqs.length > 0 ? (pyqs.filter(p => p.status === 'correct').length / pyqs.length) * 100 : 0;
  
  const predictedScore = Math.min(100, Math.max(0, (overallProgress * 0.4) + (mockAvg * 0.4) + (pyqAccuracy * 0.2)));
  
  // Simplified Rank formula: rank = 10^((100-score)/20)
  const predictedRank = Math.round(Math.pow(10, (100 - predictedScore) / 25) * 100);

  // 2. Health Scores
  const consistency = Math.min(100, (studyStats.weeklyHours?.filter(h => h > 0).length / 7) * 100 || 0);
  const revisionHealth = Math.min(100, (pyqs.filter(p => !p.revisionNeeded).length / (pyqs.length || 1)) * 100);
  
  return {
    scores: {
      mentor: Math.round((predictedScore + consistency) / 2),
      readiness: Math.round(predictedScore),
      consistency: Math.round(consistency),
      revisionHealth: Math.round(revisionHealth),
      mockPerformance: Math.round(mockAvg)
    },
    predictions: {
      score: Math.round(predictedScore),
      rank: predictedRank,
      admissions: predictedScore > 70 ? 'High chance for Top IITs' : predictedScore > 50 ? 'Good chance for NITs' : 'Focus on core subjects'
    },
    riskLevel: consistency < 40 ? 'High' : consistency < 70 ? 'Medium' : 'Low'
  };
}

// ─── Local GATE Coach (no API key needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───
// Scoring system: each group has specific keywords. The group with the most
// keyword matches wins, avoiding the ordering bug where a generic group
// (e.g., STUDY) catches queries meant for a more specific group.
const GROUPS = [
  { name: 'HELLO', keywords: ['hello', 'hi ', 'hey'], priority: 100 },
  { name: 'DSA', keywords: ['dsa', 'data structure', 'algorithm', 'sorting', 'graph', 'tree', 'dp'], priority: 90 },
  { name: 'OS', keywords: ['os', 'operating system', 'process', 'memory', 'scheduling', 'deadlock', 'sync'], priority: 90 },
  { name: 'DBMS', keywords: ['dbms', 'sql', 'normalization', 'transaction', 'b+ tree', 'indexing'], priority: 90 },
  { name: 'CN', keywords: ['cn', 'network', 'tcp', 'ip', 'routing', 'osi', 'http', 'dns'], priority: 90 },
  { name: 'TOC', keywords: ['toc', 'automata', 'regular', 'context-free', 'turing', 'pda', 'cfg'], priority: 90 },
  { name: 'COA', keywords: ['coa', 'computer organiz', 'architecture', 'pipeline', 'cache', 'hazard'], priority: 90 },
  { name: 'MATH', keywords: ['math', 'mathematics', 'aptitude', 'quant', 'discrete', 'probability'], priority: 90 },
  { name: 'MISTAKE', keywords: ['mistake', 'error', 'accuracy', 'wrong', 'incorrect', 'silly'], priority: 85 },
  { name: 'TRACK', keywords: ['on track', 'progress', 'behind', 'pace', 'ahead'], priority: 85 },
  { name: 'REVISE', keywords: ['revision', 'revise', 'review', 'spaced', 'recall', 'forgot'], priority: 80 },
  { name: 'WEAK', keywords: ['weak', 'weakness', 'struggling', 'difficult', 'improve'], priority: 80 },
  { name: 'MOCK', keywords: ['mock', 'test', 'practice', 'score', 'marks', 'exam'], priority: 80 },
  { name: 'PYQ', keywords: ['pyq', 'previous year', 'question bank', 'gate paper'], priority: 80 },
  { name: 'RANK', keywords: ['rank', 'air', 'college', 'iit', 'nit', 'admission'], priority: 75 },
  { name: 'FORMULA', keywords: ['formula', 'short note', 'crib', 'cheat sheet'], priority: 75 },
  { name: 'RESOURCE', keywords: ['resource', 'book', 'reference', 'channel', 'course', 'lecture'], priority: 75 },
  { name: 'MOTIVE', keywords: ['motivat', 'inspire', 'tired', 'burnout', 'bored', 'give up'], priority: 75 },
  { name: 'TIME', keywords: ['time', 'manage', 'hours', 'routine', 'daily', 'pomodoro'], priority: 70 },
  { name: 'SUBJECT', keywords: ['subject', 'topic', 'syllabus', 'priority', 'weightage'], priority: 70 },
  { name: 'STUDY', keywords: ['plan', 'schedule', 'today', 'daily', 'week'], priority: 60 },
];

function findBestGroup(msg) {
  const lower = msg.toLowerCase();
  let best = { name: 'GENERIC', score: 0, priority: 0 };

  for (const group of GROUPS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0 && (score > best.score || (score === best.score && group.priority > best.priority))) {
      best = { name: group.name, score, priority: group.priority };
    }
  }
  return best.name;
}

function localCoachResponse(message, context) {
  const msg = message.toLowerCase();
  const weakSub = context.weakSubjects?.length ? context.weakSubjects[0] : 'your weak areas';
  const strongSub = context.strongSubjects?.length ? context.strongSubjects[0] : 'your strong subjects';
  const progress = context.overallProgress || 0;
  const avg = context.mockAvg || 0;
  const streak = context.streak || 0;

  let text = '';
  let suggestions = ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"];

  const bestGroup = findBestGroup(msg);

  if (bestGroup === 'HELLO') {
    text = `Hey there, GATE warrior! 👋 Ready to crush it today. ${
      streak > 0 ? `You're on a ${streak}-day streak — that's solid discipline!` : 'Consistency is key — let\'s build that streak.'
    } I'm here to help with study plans, topic advice, revision tips, or anything GATE-related. What do you need?`;
    suggestions = ["Plan my study day", "Show my weak topics", "How should I revise?"];
  } else if (bestGroup === 'STUDY') {
    text = `Here's your daily focus plan:\n\n${progress > 50 ? '📗 You\'re past halfway — great momentum!' : '📘 Starting strong — every hour counts!'}\n\n**Morning (2h):** ${weakSub} — focus on concept clarity + 5 PYQs\n**Afternoon (1.5h):** ${strongSub} — reinforce your strength area\n**Evening (1h):** Revision of last week's topics\n**Night (30m):** Formula sheet review + plan tomorrow\n\nStay consistent, and you'll see results every week! 🚀`;
    suggestions = ["Which topics in " + weakSub + " should I focus?", "How many PYQs should I solve daily?", "Give me a weekly study plan"];
  } else if (bestGroup === 'WEAK') {
    text = `Your current weak areas are: **${weakSub}** (${context.weakTopics?.slice(0,3)?.join(', ') || 'core topics'}).\n\nHere's a targeted attack plan:\n1. **Watch 1 good NPTEL/YouTube lecture** on the foundational concepts\n2. **Solve 10 PYQs** from the last 5 years on this subject\n3. **Create a one-page formula sheet** for quick revision\n\nDedicate 2 hours daily to ${weakSub} for the next 5 days and you'll see a clear improvement!`;
    suggestions = ["Show subject-wise progress", "Which PYQs should I solve first?", "Create a weekly plan for " + weakSub];
  } else if (bestGroup === 'REVISE') {
    text = `Spaced repetition is your secret weapon! 🧠\n\n${context.overdueTopics > 0 ? `⚠️ You have **${context.overdueTopics} topics** overdue for revision. Let's fix that!` : '✅ You\'re up to date on revisions — great habit!'}\n\n**Quick revision plan:**\n1. Revise **3 old topics** daily (30 min each)\n2. Use your short notes + formula sheets\n3. Solve **5 PYQs** from each topic to test retention\n4. Mark topics as done in the revision scheduler\n\nStart with the oldest unreviewed topic first!`;
    suggestions = ["Show my revision schedule", "Which topics are due today?", "How does spaced repetition work?"];
  } else if (bestGroup === 'MOCK') {
    text = avg === 0 
      ? `You haven't taken any mock tests yet! 🧪\n\nMocks are **critical** for GATE success. Start with:\n1. **Subject-wise mock** for your strongest subject (to build confidence)\n2. **Full-length mock** every Sunday\n3. **Analyze every mistake** — create an error log\n\nWant me to suggest a mock test plan?`
      : `Your average mock score is **${avg}%**. ${avg >= 60 ? '✅ Solid! Focus on converting 60s to 80s.' : avg >= 40 ? '📈 Improving — analyze your mistake patterns.' : '🎯 Early stage — focus on concept clarity first.'}\n\n**Mock strategy:**\n- Take 1 full-length mock every week\n- Spend **equal time analyzing** as taking the test\n- Track your per-subject accuracy to find patterns\n- Re-solve mistakes after 3 days`;
    suggestions = ["Suggest a mock test", "How to analyze mock results?", "What's a good GATE score?"];
  } else if (bestGroup === 'MOTIVE') {
    text = `Stay strong, GATE aspirant! 💪\n\nRemember why you started. Every hour you put in is an investment in your future. **Small daily wins compound into extraordinary results.**\n\nQuick reset tips:\n1. Take a 15-min break — walk, stretch, breathe\n2. Review your "why" — IIT, PSU, or your dream role\n3. Set **one small goal** for the next 30 minutes\n4. Celebrate small wins — completed a topic? Mark it!\n\nYou're not alone in this journey. Keep going! 🔥`;
    suggestions = ["Plan a lighter study day", "How to avoid burnout?", "Celebrate my progress so far"];
  } else if (bestGroup === 'TIME') {
    text = `Quality > Quantity. Here's an optimized routine:\n\n🌅 **Morning (2h):** Deep focus — new concepts (highest concentration)\n🌤️ **Afternoon (1.5h):** PYQ practice + problem solving\n🌆 **Evening (1.5h):** Revision + weak area attack\n🌙 **Night (30m):** Formula review + plan next day\n\n💡 **Pro tip:** Use Pomodoro: 50 min study + 10 min break. Track your hours in the Productivity page!`;
    suggestions = ["How many hours should I study?", "Best study techniques for GATE", "How to avoid distractions?"];
  } else if (bestGroup === 'SUBJECT') {
    text = `**Priority order for GATE CSE:**\n\n🥇 **High weightage:** DSA, Algorithms, OS, DBMS, CN\n🥈 **Medium weightage:** COA, TOC, Discrete Math\n🥉 **Foundation:** Mathematics, Aptitude\n\nYour current order should be:\n1. Cover **Mathematics + Aptitude** early (they boost scores)\n2. **DSA + OS + DBMS** — most questions come from here\n3. **CN + TOC + COA** — moderate weightage, don't skip\n4. **Revision + Mocks** — keep revisiting completed subjects\n\nFocus on **completing one subject at a time** rather than jumping between them.`;
    suggestions = ["Subject-wise weightage breakdown", "Which subject to start first?", "How much time per subject?"];
  } else if (bestGroup === 'PYQ') {
    text = `PYQs are the **gold mine** of GATE preparation! 🏆\n\n**Strategy:**\n1. Solve PYQs **subject-wise** first (after completing each subject)\n2. Then solve **year-wise** as full-length tests\n3. **Revise your mistakes** after 3 days and again after 7 days\n4. Aim for **90%+ accuracy** on 2020-2024 papers\n\n💡 **Tip:** PYQs from 2015-2024 cover almost all important concepts. Solve them at least twice!`;
    suggestions = ["Show PYQ browser", "Most repeated PYQ topics", "How to analyze PYQ mistakes?"];
  } else if (bestGroup === 'FORMULA') {
    text = `Short notes + Formula sheets = **Revision superpower** 📝\n\n**How to create effective formula sheets:**\n1. One page per subject — only formulas, definitions, key points\n2. Use colors for different categories (green = easy, yellow = moderate, red = tricky)\n3. Keep updating as you learn new topics\n4. Review them **daily** — 5 minutes before starting study\n\n✅ Already have notes? Great! Just opening them daily reinforces memory.`;
    suggestions = ["Show my formula sheets", "How to make effective notes?", "Show revision notes for OS"];
  } else if (bestGroup === 'MISTAKE') {
    text = `Mistakes are **learning opportunities** in disguise! 🔍\n\n${context.recentAccuracy > 0 ? `Your current accuracy is **${context.recentAccuracy}%**.` : ''}\n\n**Mistake analysis framework:**\n1. **Categorize** each mistake: Silly / Concept Gap / Reading Error\n2. **Fix concept gaps** by re-watching lectures or reading textbooks\n3. **Re-solve** the question after 3 days (spaced repetition!)\n4. **Track patterns** — if you keep making the same type of error, drill it\n\nYour Mistake Notebook is the best tool — use it after every practice session!`;
    suggestions = ["Open Mistake Notebook", "How to avoid silly mistakes?", "Analyze my mistake patterns"];
  } else if (bestGroup === 'RANK') {
    text = `**GATE Score → Rank estimates (general category):**\n\n🏆 **AIR < 100:** 75+ marks (IIT Bombay/Delhi CSE)\n🥇 **AIR < 500:** 65+ marks (Top IITs)\n🥈 **AIR < 2000:** 55+ marks (IITs, NITs)\n🥉 **AIR < 5000:** 45+ marks (Good NITs, IIITs)\n\n**Your current path:** ${progress > 70 ? 'You\'re on track for a strong rank!' : progress > 40 ? 'Good progress — keep building!' : 'Early stage — focus on learning, not ranks yet!'}\n\nYou can track your predicted rank in the Analytics page!`;
    suggestions = ["Predict my AIR", "Show college cutoffs", "What score for IIT Madras?"];
  } else if (bestGroup === 'RESOURCE') {
    text = `**Best free resources for GATE CSE:**\n\n📺 **YouTube:** NPTEL (IIT professors), Gate Smashers, Knowledge Gate\n📘 **Books:** CLRS (Algorithms), Tanenbaum (OS/CN), Korth (DBMS), Ullman (TOC)\n🧠 **Practice:** GateNexa PYQ browser + Mock tests\n📝 **Notes:** Create your own short notes (10-15 pages per subject)\n\n💡 **Rule:** Stick to **1-2 resources per subject**. Hoarding resources wastes time!`;
    suggestions = ["Best YouTube channels", "Recommended textbooks", "Free mock test sources"];
  } else if (bestGroup === 'MATH') {
    text = `**Mathematics for GATE CSE — Priority order:**\n\n1. **Discrete Mathematics** — Graph Theory, Combinatorics, Set Theory (highest weightage)\n2. **Linear Algebra** — Matrices, Vector Spaces, Eigenvalues\n3. **Probability & Statistics** — Random Variables, Distributions\n4. **Calculus** — Limits, Continuity, Differentiation\n\n📈 **Strategy:** Solve **5 math problems daily** — consistency matters more than intensity. Most math questions in GATE are moderate difficulty but need practice.`;
    suggestions = ["Discrete Math topics", "Probability PYQs", "Linear Algebra weightage"];
  } else if (bestGroup === 'DSA') {
    text = `**DSA for GATE — high weightage subject!** ⚡\n\nKey topics: Arrays, Linked Lists, Trees, Graphs, Sorting & Searching, Hashing, Dynamic Programming, Greedy Algorithms.\n\n**Study plan:**\n1. Master **arrays + linked lists** first (building blocks)\n2. **Trees + Graphs** — most GATE questions come from these\n3. **Sorting + Searching** — know time/space complexities cold\n4. **DP + Greedy** — practice 5+ problems per concept\n\nSolve **10 DSA PYQs weekly** and track your accuracy!`;
    suggestions = ["DSA PYQs by topic", "Graph algorithms weightage", "How to master DP for GATE?"];
  } else if (bestGroup === 'OS') {
    text = `**Operating Systems — core subject for GATE!** 💻\n\nKey topics: Processes & Threads, CPU Scheduling, Synchronization, Deadlocks, Memory Management, File Systems, I/O.\n\n**Study plan:**\n1. **Process management + Scheduling** — most numericals come from here\n2. **Memory management** — paging, segmentation, virtual memory\n3. **Synchronization + Deadlocks** — critical for GATE\n4. **File systems + I/O** — moderate weightage\n\nSolve **OS PYQs from the last 10 years** — patterns repeat frequently!`;
    suggestions = ["OS scheduling numericals", "Memory management PYQs", "Deadlock practice questions"];
  } else if (bestGroup === 'DBMS') {
    text = `**DBMS — high-weightage, high-reward subject!** 🗄️\n\nKey topics: ER Model, Relational Model, SQL, Normalization, Transactions, Concurrency Control, Indexing.\n\n**Study plan:**\n1. **SQL + Relational Algebra** — practice writing queries daily\n2. **Normalization** — know 1NF through BCNF with examples\n3. **Transactions + Concurrency** — ACID, schedules, locking protocols\n4. **Indexing** — B+ trees, hash-based indexing\n\nSQL questions are free marks — practice until perfect!`;
    suggestions = ["SQL practice questions", "Normalization exercises", "Transaction PYQs"];
  } else if (bestGroup === 'CN') {
    text = `**Computer Networks — moderate weightage, manageable scope!** 🌐\n\nKey topics: OSI/TCP-IP Model, Application Layer (HTTP, DNS), Transport Layer (TCP, UDP), Network Layer (IP, Routing), Data Link Layer.\n\n**Study plan:**\n1. **TCP/IP model + layers** — know what each layer does\n2. **TCP + UDP** — congestion control, flow control\n3. **IP addressing + Routing** — subnetting, CIDR, routing algorithms\n4. **Application layer** — HTTP, DNS, SMTP basics\n\nFocus on **numericals** — IP addressing and TCP flow control are GATE favorites!`;
    suggestions = ["IP addressing numericals", "TCP congestion control", "Routing algorithm PYQs"];
  } else if (bestGroup === 'TOC') {
    text = `**Theory of Computation — conceptual but scoring!** 🔤\n\nKey topics: Regular Languages, DFA/NFA, Regular Expressions, Context-Free Grammars, Pushdown Automata, Turing Machines, Undecidability.\n\n**Study plan:**\n1. **DFA/NFA design** — practice constructing automata for languages\n2. **Regular expressions** — conversion to/from automata\n3. **CFG + PDA** — derivations, parse trees, pushdown automata\n4. **Turing Machines + Undecidability** — understand concepts, not memorize\n\nTOC is a **high-confidence scoring subject** — consistent practice yields full marks!`;
    suggestions = ["DFA practice problems", "CFG to PDA conversion", "Turing machine basics"];
  } else if (bestGroup === 'COA') {
    text = `**Computer Organization & Architecture — must-know!** ⚙️\n\nKey topics: Number Systems, Boolean Algebra, Combinational/Sequential Circuits, CPU Architecture, Pipelining, Memory Hierarchy, Cache, I/O.\n\n**Study plan:**\n1. **Digital Logic (Number systems + Boolean)** — foundation for COA\n2. **CPU Architecture + Pipelining** — most numericals here\n3. **Cache + Memory Hierarchy** — know mapping techniques\n4. **I/O + DMA** — basic understanding enough\n\nCOA numericals (cache, pipeline) are **free marks** with enough practice!`;
    suggestions = ["Pipeline numericals", "Cache mapping techniques", "COA PYQs by topic"];
  } else if (bestGroup === 'TRACK') {
    text = `**Am I on track? Let's check!** 📊\n\n${progress > 70 ? '✅ **Excellent progress!** You\'re well ahead. Focus on revision + mock tests.' : progress > 50 ? '✅ **Good progress!** Keep up the momentum. Start PYQs for completed subjects.' : progress > 30 ? '⚠️ **On track, but can accelerate!** Increase daily study hours and prioritize weak subjects.' : '🔴 **Early stage — this is okay!** Focus on covering core subjects (DSA, OS, DBMS) first.'}\n\n🎯 **Suggested daily targets:**\n- ${progress < 30 ? '4-5 hours: 2h new content + 2h practice + 1h revision' : progress < 60 ? '5-6 hours: 2h new + 2h PYQs + 1.5h revision + 0.5h planning' : '5-6 hours: 3h PYQs/mocks + 2h revision + 1h weak area attack'}\n\n🔥 ${streak > 0 ? `Your ${streak}-day streak is solid!` : 'Start a streak today!'}`;
    suggestions = ["Weekly study plan", "How many hours should I study?", "Adjust my preparation strategy"];
  } else {
    text = `Great question! Based on your GATE preparation context:\n\n📊 **Progress:** ${progress}% complete\n🎯 **Mock Average:** ${avg > 0 ? avg + '%' : 'Not yet started'}\n🔥 **Streak:** ${streak} days\n📚 **Weak subjects:** ${weakSub}\n✅ **Strong subjects:** ${strongSub}\n\n**My advice:** ${progress < 30 ? 'Focus on completing core subjects first — DSA, OS, DBMS. Take it one chapter at a time!' : progress < 60 ? 'Great progress! Now shift focus to PYQs and mock tests alongside learning.' : 'Excellent! You\'re in the revision + mock phase now. Prioritize mock analysis and weak area attacks.'}\n\nLet me know what specific aspect you'd like to dive deeper into! 🚀`;
    suggestions = ["What should I study today?", "Am I on track for GATE 2027?", "Create a weekly study plan"];
  }

  return { text, suggestions };
}

// Comprehensive knowledge base used by Auto mode's offline fallback so it
// can still produce deep, ChatGPT-style answers when the live API is unavailable.
const AUTO_KNOWLEDGE_BASE = {
  'operating system': {
    intro: 'An **operating system (OS)** is the system software that manages computer hardware and software resources, and provides common services for computer programs. It acts as an intermediary between the user, the applications they run, and the underlying hardware.',
    sections: [
      ['What Does It Do?', 'The OS performs five core jobs:\n- **Process management** — scheduling and executing multiple programs on the CPU\n- **Memory management** — allocating, tracking, and reclaiming RAM\n- **File system management** — organizing data on storage into files and directories\n- **Device management** — controlling hardware via device drivers\n- **Security & access control** — protecting resources with permissions and authentication'],
      ['How It Works', 'When you run a program, the OS loads it into memory, creates a **process**, and hands it to the CPU scheduler. It uses **system calls** (e.g., read, write, fork) to let programs request services safely. Hardware, apps, and the OS sit in layers: **hardware → kernel → system utilities → applications → user**.'],
      ['Real-World Examples', '- **Windows**, **macOS**, **Linux** — desktop/server OSes\n- **Android**, **iOS** — mobile OSes\n- **RTOS** (real-time) — embedded systems like cars and medical devices'],
      ['Key Concepts', '- **Kernel** — the core, always-resident part of the OS\n- **Multitasking** — running many processes concurrently via CPU scheduling\n- **Virtual memory** — using disk as an extension of RAM\n- **User vs kernel mode** — hardware-enforced privilege separation'],
    ],
    ending: 'That is the complete picture of an operating system, from its definition to how it runs in practice.',
    followups: {
      example: '### Worked Example — Running a Program on an OS\nYou double-click `hello.exe`:\n1. The **OS loader** reads the executable into memory and sets up a **process** (PCB: state, program counter, registers, memory map, open files).\n2. The **CPU scheduler** places the process in the ready queue.\n3. The **kernel** switches to kernel mode to allocate memory and map the process\'s virtual address space.\n4. The process starts executing user code. When it calls `printf`, a **system call** traps into the kernel, which writes to the screen via a device driver.\n5. When the process finishes, the OS reclaims all its resources.\n\nEvery layer of the OS — process management, memory, file system, devices, security — is exercised by this one simple action.',
      example2: '### Worked Example — System Call Flow\nWhen a program calls `read(fd, buf, n)`:\n1. The C library wraps the **syscall** with a trap instruction, placing the syscall number in a register.\n2. CPU switches from **user mode** to **kernel mode** (mode bit flips).\n3. The kernel looks up the handler, verifies the file descriptor, and copies data into `buf`.\n4. Control returns to user mode with the result.\n\n**Why mode switching matters:** a buggy user program cannot crash the kernel — it cannot execute privileged instructions directly. This is the security foundation of every modern OS.',
      simplified: 'An OS is like a **hotel manager**:\n- Assigns rooms (memory) to guests (processes) and keeps a ledger.\n- Schedules the single elevator (CPU) so no guest waits forever.\n- Holds the master keys (kernel), so staff (apps) can\'t wander into restricted areas.\n- The manager\'s staff use walkie-talkies (system calls) to request things; guests never open the manager\'s safe directly.\n\nWithout the manager, chaos — that is why every computer has an operating system.',
      why: 'Operating systems are a **core GATE CSE subject** and mix theory with numericas. Exam questions cluster around:\n1. **CPU scheduling** — compute average waiting/turnaround for FCFS, SJF, RR.\n2. **Virtual memory / paging** — page size, TLB hits, page faults.\n3. **Synchronization** — semaphores, readers-writers, producer-consumer.\n4. **Deadlock** — four conditions, Banker\'s Algorithm.\n5. **Process/thread** differences and system calls.\n\nExpect roughly **8–10 marks** from OS every year — it is one of the highest-yield subjects in the paper.',
      how: 'To understand an OS, trace one unit of work through its lifecycle:\n1. **Process creation** — PCB allocated, code/data loaded, ready queue.\n2. **Scheduling** — pick a process per the algorithm (FCFS/RR/SJF).\n3. **Context switch** — save state of the outgoing process, load the new one.\n4. **Memory access** — MMU translates virtual → physical via the page table and TLB.\n5. **I/O** — driver + device, via system call in kernel mode.\n6. **Termination** — resources reclaimed, PCB freed.\n\nEverything an OS does is one of these six activities, repeated for every program.',
      more: [
        '### Deep Dive — Process vs Thread\nA **process** is a program in execution with its own address space, registers, and resources. A **thread** is a single execution flow *within* a process.\n- **Share:** code, data, heap, open files.\n- **Private to each thread:** program counter, registers, stack.\n\n| Aspect | Process | Thread |\n|---|---|---|\n| Address space | Separate | Shared |\n| Context-switch cost | High (flush TLB, switch memory maps) | Low (same address space) |\n| Communication | IPC (pipes, shared memory, sockets) | Shared variables |\n| Crash isolation | One crashing process doesn\'t kill others | A crashing thread can take down the process |\n\n**GATE fact:** threads are *lighter* than processes because they share memory — creating a thread is far cheaper than forking a process.',
        '### Deep Dive — Kernel Mode vs User Mode & System Calls\nCPUs expose at least two privilege levels. The OS runs in **kernel mode** (can execute all instructions), apps in **user mode** (restricted).\n- The **mode bit** in the CPU indicates the current level.\n- User → kernel happens only via **traps** (system calls) or **interrupts** (hardware events, timer).\n- **System calls** are the only sanctioned way for apps to access hardware.\n\n**Why GATE loves this:** questions ask which operations require kernel mode (I/O, changing the mode bit, disabling interrupts) vs which run in user mode (arithmetic, most memory access). Know the boundary cold.',
        '### Deep Dive — Why Concurrency & Synchronization Matter\nMultiple processes sharing resources can corrupt data without coordination. Example:\n\n```\nThread A:      Thread B:\ncounter++;     counter++;\n  load counter    load counter\n  add 1           add 1\n  store counter   store counter\n```\n\nIf interleaved, the final counter may be wrong (classic **race condition**). Solutions:\n- **Mutex / semaphore** — mutual exclusion over the critical section.\n- **Monitors / condition variables** — higher-level coordination.\n- **Atomic instructions** — hardware compare-and-swap for lock-free structures.\n\nGATE frequently asks to find the **maximum/minimum final value** of a shared variable with N threads — the classic producer-consumer and readers-writers problems.',
      ],
      compare: {
        'kernel': '### Monolithic vs Microkernel — side by side\n| Criterion | Monolithic (Linux) | Microkernel (QNX, L4) |\n|---|---|---|\n| Kernel services | All in kernel space | Minimum (IPC, scheduling) in kernel |\n| Drivers | In kernel | As user-space processes |\n| Performance | Fast (no IPC boundary) | Slower (IPC overhead) |\n| Stability | A driver crash can crash the OS | Driver crash isolated to its process |\n\n**GATE one-liner:** monolithic = fast but fragile; microkernel = robust but slower due to message passing.',
        'generic': 'Compare operating-system concepts along **what they manage** and **what they cost**:\n- **Process vs thread** — resources vs speed (see deep dive).\n- **User vs kernel mode** — safety boundary vs switch cost.\n- **Monolithic vs microkernel** — performance vs robustness.\n- **Preemptive vs non-preemptive scheduling** — fairness vs overhead.\n\nEvery OS trade-off balances a benefit against a cost — structure your answers along that axis and you will never miss a mark.',
      },
      pyq: '### Solved GATE-style PYQ — Context Switch Time\n**Question:** A CPU scheduling algorithm uses Round Robin with quantum 10 ms and a context-switch cost of 1 ms. What fraction of the CPU is lost to context switching?\n\n**Formula:** with quantum q and switch cost c, utilization = q / (q + c).\n\n- q = 10 ms, c = 1 ms → utilization = 10 / (10 + 1) = 10/11 ≈ **90.9%**.\n- CPU lost to switching ≈ **9.1%**.\n\n**Answer: about 9%** (or utilization ≈ 90.9%).\n\n**Method:** every quantum boundary incurs one context switch — utilization is always q/(q+c). This formula is one of the most reused numericas in the OS paper.',
      mistakes: '### Common Mistakes on Operating Systems\n1. **Confusing process and thread.** Threads share the address space; processes do not. Context-switch cost and crash isolation differ accordingly.\n2. **Wrong mode for operations.** Disabling interrupts, I/O, and changing the mode bit require kernel mode; arithmetic and plain memory access are user-mode.\n3. **Mixing scheduling terms.** Preemptive schedulers can interrupt a running process; non-preemptive cannot — that is the whole question in many GATE items.\n4. **Forgetting TLB/flush effects.** Context switches flush the TLB, which is a big reason thread switches are cheaper than process switches.\n5. **Saying "the OS is one program."** The kernel is small and privileged; most "OS" functionality (shell, compilers, GUI) runs in user space.\n6. **Ignoring the cost of system calls.** Every user↔kernel crossing has overhead — that is why high-performance code minimizes syscalls.',
    },
  },
  'dbms': {
    intro: 'A **Database Management System (DBMS)** is software that lets users create, store, retrieve, update, and manage data in a structured way, while ensuring data integrity, security, and concurrent access by many users.',
    sections: [
      ['Why Use a DBMS?', 'Compared with plain files, a DBMS provides:\n- **Data independence** — applications stay unaffected by storage changes\n- **Concurrency control** — many users safely access data at once\n- **Crash recovery** — data survives failures via transaction logs\n- **Security** — granular access control\n- **Reduced redundancy** — data stored once, referenced many times'],
      ['The Relational Model', 'Data is stored in **tables (relations)** of rows (**tuples**) and columns (**attributes**). Tables are linked by **keys** — a **primary key** uniquely identifies each row, and a **foreign key** references a row in another table. SQL (Structured Query Language) is used to query and manipulate this data: SELECT, INSERT, UPDATE, DELETE.'],
      ['Normalization', '**Normalization** removes redundancy and anomalies by organizing data into well-structured tables:\n- **1NF** — atomic values, no repeating groups\n- **2NF** — no partial dependency on a composite key\n- **3NF** — no transitive dependency\n- **BCNF** — every determinant is a candidate key'],
      ['Transactions & ACID', 'A transaction is a unit of work that must satisfy **ACID**:\n- **Atomicity** — all-or-nothing\n- **Consistency** — valid state to valid state\n- **Isolation** — concurrent transactions do not interfere\n- **Durability** — committed changes survive crashes\nConcurrency control uses **locking** and scheduling to keep transactions isolated.'],
      ['Popular Systems', '- **Relational**: MySQL, PostgreSQL, Oracle, SQL Server\n- **NoSQL**: MongoDB (document), Redis (key-value), Cassandra (column)'],
    ],
    ending: 'That is the full picture of a DBMS — its purpose, the relational model, normalization, transactions, and the systems that implement it.',
    followups: {
      example: '### Worked Example — Relational Tables & Keys\n**Students**\n| StudentID | Name |\n|---|---|\n| 101 | Priya |\n| 102 | Ravi |\n\n**Enrollments**\n| EnrollID | StudentID (FK) | Course |\n|---|---|---|\n| 1 | 101 | OS |\n| 2 | 101 | DBMS |\n| 3 | 102 | DBMS |\n\n- `StudentID` is the **primary key** of Students (uniquely identifies each row).\n- `StudentID` in Enrollments is a **foreign key** referencing Students — enforcing referential integrity (you cannot enroll an unknown student).\n- To find Ravi\'s courses: **join** Students ⋈ Enrollments on StudentID → two rows for Priya, one for Ravi.',
      example2: '### Worked Example — SQL Query\nFind names of students taking DBMS:\n\n```sql\nSELECT S.Name\nFROM Students S\nJOIN Enrollments E ON S.StudentID = E.StudentID\nWHERE E.Course = \'DBMS\';\n```\n\nExecution order (important for GATE):\n1. `FROM` + `JOIN` — build the combined rows.\n2. `WHERE` — filter to DBMS rows.\n3. `SELECT` — project only the Name column.\n4. (If present) `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT` run after.\n\n**Result:** Priya and Ravi.\n\nKnowing the logical order of clauses is a repeated GATE question.',
      simplified: 'A DBMS is like a **well-run library catalogue**:\n- Every book (record) is catalogued once, not copied into every reader\'s notebook (no redundancy).\n- The catalogue is indexed so you can find anything fast (indexes).\n- Only the librarian touches the shelves; readers request through a window (queries), and two readers can\'t alter the same record simultaneously (concurrency control).\n- If a fire breaks out (crash), the backup catalogue lets the library recover (recovery).\n\nThat is what a database does for your data — organizes, protects, and serves it.',
      why: 'DBMS is a **high-scoring GATE CSE subject** (roughly 8–10 marks). The perennial topics:\n1. **Normalization** — find highest normal form from FDs.\n2. **SQL** — query semantics, join execution order, aggregate functions.\n3. **Transactions & ACID** — isolation levels, two-phase locking, serializability.\n4. **ER diagrams & relational model** — mapping, keys.\n5. **File organization & indexing** — B-trees, hashing, cost estimation.\n\nIt rewards precise definitions and methodical steps more than memorization — so practising solved examples pays off quickly.',
      how: 'To think like a DB designer, work through the five layers:\n1. **Conceptual** — draw the ER diagram: entities, attributes, relationships.\n2. **Logical** — map the ER model to relational tables with keys.\n3. **Normalize** — remove redundancy up to the needed normal form.\n4. **Physically design** — choose indexes (B-tree, hash), file organization.\n5. **Operate** — write queries and transactions under concurrency control.\n\nEvery GATE DBMS question fits into one of these layers — identify the layer first and the solution method follows.',
      more: [
        '### Deep Dive — ACID Properties & Transactions\nA **transaction** is a unit of work (set of SQL statements) that must be atomic.\n\n| Property | Meaning | Mechanism |\n|---|---|---|\n| Atomicity | All-or-nothing | Undo log / rollback |\n| Consistency | Valid state → valid state | Integrity constraints |\n| Isolation | Concurrent transactions don\'t interfere | Locking / MVCC |\n| Durability | Committed data survives crashes | Redo log / write-ahead log |\n\n**GATE pattern:** questions ask which mechanism ensures which property — atomicity→undo log, durability→redo log, isolation→locks. Get that mapping right and ACID questions become free marks.',
        '### Deep Dive — Serializability & Conflict\n**Serial schedule:** transactions run one after another. **Serializable schedule:** equivalent to some serial order — this is the gold standard of isolation.\n\n**Conflict serializability** is the testable version:\n- Two operations **conflict** if they act on the same data item and at least one is a *write*.\n- Build the **precedence graph**: an edge Ti → Tj if Ti writes before Tj reads/writes the same item.\n- If the graph has **no cycle → conflict-serializable** (and thus safe under the strictest isolation).\n\n**GATE frequent ask:** "is this schedule serializable?" → build the precedence graph and check for a cycle.',
        '### Deep Dive — Two-Phase Locking (2PL)\nThe classic way to guarantee serializability:\n1. **Growing phase** — only acquire locks.\n2. **Shrinking phase** — only release locks; no new acquisitions.\n\n**Strict 2PL** (used by most real DBMSes): hold all locks until commit → guarantees *recoverable* and *cascadeless* schedules.\n\n**Problems 2PL solves:** lost update, dirty read, non-repeatable read.\n\n**Problem 2PL creates:** deadlock (two transactions lock in opposite orders). Solution: deadlock detection (waits-for graph) + rollback of a victim.\n\n**Isolation levels** trade consistency for concurrency: READ UNCOMMITTED < READ COMMITTED < REPEATABLE READ < SERIALIZABLE.',
      ],
      compare: {
        'nosql': '### Relational vs NoSQL — side by side\n| Criterion | Relational (SQL) | NoSQL |\n|---|---|---|\n| Data model | Tables, rows, columns | Documents, key-value, graphs, columns |\n| Schema | Fixed, enforced | Flexible, dynamic |\n| Transactions | Full ACID | Often relaxed (BASE) |\n| Scaling | Vertical (easier) | Horizontal (sharding natural) |\n| Use cases | Banking, ERP, anything needing consistency | Big data, analytics, flexible schemas |\n\n**GATE one-liner:** choose SQL for strong consistency and structured joins; NoSQL for scale, speed, and flexible schemas.',
        'generic': 'How to compare DBMS topics along **what they guarantee vs what they cost**:\n- **ACID vs BASE** — consistency vs availability/scalability.\n- **Locking vs MVCC** — simplicity vs concurrency.\n- **B-tree vs hash index** — range queries vs exact lookups.\n- **Normalized vs denormalized** — redundancy vs query speed.\n\nState the guarantee and the cost, and the comparison writes itself.',
      },
      pyq: '### Solved GATE-style PYQ — Transactions & Locking\n**Question:** Consider transactions T1 and T2 with operations on X and Y. Which of the following schedules is conflict-serializable?\n- (A) T1: R(X), W(X); T2: R(Y), W(Y)  — **T1 then T2, no shared data → serial, serializable ✓**\n- (B) T1: R(X), W(X); T2: R(X), W(X) — both write X → conflicts. Precedence graph T1→T2 and T2→T1 (both read-modify-write X) → **cycle → not serializable**.\n\n**Answer: (A).**\n\n**Method:** draw the precedence graph. For every pair of conflicting operations on the same item, add a directed edge from the earlier transaction to the later one. No cycle = conflict-serializable.',
      mistakes: '### Common Mistakes on DBMS\n1. **Using Max instead of Need in Banker\'s** (if that overlaps OS) — in DBMS the equivalent is miscomputing the precedence graph edges (only *conflicting* operations create edges).\n2. **Wrong isolation level order.** SERIALIZABLE is the strongest, READ UNCOMMITTED the weakest — REPEATABLE READ sits above READ COMMITTED.\n3. **Forgetting what a foreign key references.** A FK references the *primary key* of another table, enforcing referential integrity.\n4. **Confusing B-tree and hash indexes.** B-trees support range scans (ORDER BY, BETWEEN); hash indexes only exact equality — a classic GATE trap.\n5. **Skipping the join step in SQL questions.** `WHERE` filters *after* `FROM/JOIN` — ask which tables are joined before filtering.\n6. **Saying "NoSQL has no transactions."** Many NoSQL systems support transactions over a limited scope — they trade global ACID for scale, not necessarily zero ACID.',
    },
  },
  'virtual memory': {
    intro: '**Virtual memory** is a memory-management technique that lets a computer run programs larger than its physical RAM by treating part of the disk as an extension of main memory.',
    sections: [
      ['How It Works', 'Each process gets its own **virtual address space**. The Memory Management Unit (MMU) maps virtual addresses to physical addresses using **page tables**. When a program touches a page not in RAM, a **page fault** occurs and the OS loads the page from disk into a free frame.'],
      ['Demand Paging', 'Pages are loaded **only when accessed** (lazily), so a program can start even if most of its code is still on disk. This is what makes virtual memory practical.'],
      ['Page Replacement', 'When RAM is full, the OS evicts a page to make room. Common policies:\n- **FIFO** — evict the oldest-loaded page\n- **LRU (Least Recently Used)** — evict the page unused longest\n- **Optimal** — evict the page that will be used furthest in the future (theoretical ideal)'],
      ['Thrashing', 'If the working set of pages needed by processes exceeds RAM, the system spends all its time swapping — called **thrashing** — and throughput collapses. The OS counters this with working-set and page-fault-frequency policies.'],
      ['Key Concepts', '- **Frames vs pages** — physical frames, logical pages\n- **Page tables & TLBs** — fast address translation\n- **Swapping** — moving whole processes in/out of memory'],
    ],
    ending: 'So virtual memory lets you run far more than physical RAM would allow, at the cost of occasional disk I/O — a fundamental trade-off in modern operating systems.',
    followups: {
      example: '### Worked Example — Address Translation with a Page Table\nSystem: page size 4 KB = 4096 bytes (offset = 12 bits). Virtual address = 0x1234.\n\n1. Virtual page number = 0x1, offset = 0x234.\n2. Look up page table entry for page 1 → suppose frame number = 5.\n3. **Physical address = frame × page_size + offset = 5 × 4096 + 0x234.**\n\nNow compute in decimal: 5 × 4096 = 20480, + 564 = **21044**.\n\nThe MMU does this mapping on every memory access — which is why the **TLB** (translation lookaside buffer, a small cache of recent mappings) is critical for performance.',
      example2: '### Worked Example — Page Fault Handling\nA process accesses a page that is not in RAM:\n1. The MMU raises a **page fault** (hardware trap).\n2. The OS checks if the address is valid (in the process\'s address space) — if not, **segmentation fault**.\n3. The OS finds a **free frame** (or evicts one via a replacement policy).\n4. The page is **read from disk** (this is the slow part — ~10⁶ slower than RAM).\n5. The page table is updated, the process is scheduled to run again.\n6. The faulting instruction is **restarted**.',
      simplified: 'Virtual memory is like a **hotel with more room cards than rooms**:\n- Every guest gets a full stack of room cards (virtual address space) even though there are fewer actual rooms (RAM).\n- The front desk (MMU) maps each card to a real room when you try to enter.\n- If the room you want is currently "stored in the basement" (on disk), a bellhop (page fault handler) fetches it — slowly.\n- When the hotel is full, the manager evicts the guest who used their room longest ago (LRU).\n\nThis is how your computer runs apps far bigger than its physical memory.',
      why: 'Virtual memory is a **core GATE OS topic with frequent numericas**. Standard question types:\n1. **Page table size** — given virtual/physical address bits and page size, compute number of entries and bits per entry.\n2. **TLB hit/miss** — effective access time = hit rate × TLB time + miss rate × (TLB + page table + memory) time.\n3. **Page replacement** — FIFO, LRU, Optimal: count page faults for a reference string.\n4. **Thrashing & working set** — why performance collapses and how to fix it.\n\nEach maps to a short calculation — high marks for modest effort.',
      how: 'The mechanics in order:\n1. **Address split** — virtual address = virtual page number + offset.\n2. **TLB lookup** — if hit, translate in one cycle; if miss, walk the page table.\n3. **Page table walk** — find the frame; if the page is not resident, a **page fault** occurs.\n4. **Fault handling** — bring the page in from disk, update the table, resume.\n5. **Replacement** — when RAM is full, evict a page (FIFO / LRU / Optimal).\n\nThe TLB is the performance key: without it, every access would walk the page table (an extra memory read).',
      more: [
        '### Deep Dive — Effective Access Time (EAT) with TLB\n**EAT** = hit_rate × (TLB_hit_time) + miss_rate × (miss_penalty).\n\n**Worked example:** TLB hit = 20 ns, memory access = 100 ns, hit rate 95%:\n- Hit path: 20 + 100 = 120 ns (once per translation).\n- Miss path: 20 + 100 (page table) + 100 (data) = 220 ns.\n- **EAT = 0.95 × 120 + 0.05 × 220 = 114 + 11 = 125 ns.**\n\nvs without a TLB: 200 ns per access (page table + data). The TLB roughly halves the cost — that is why every modern CPU has one.',
        '### Deep Dive — Page Replacement Policies (with page faults)\nReference string (page size = 3 frames): **7 0 1 2 0 3 0 4 2 3 0 3 2**\n\n**FIFO** (evict oldest): 15 faults. **LRU** (evict least recently used): 12 faults. **Optimal** (evict page used furthest in future): 9 faults.\n\n**Belady\'s anomaly:** FIFO can have *more* faults with *more* frames! (FIFO is the classic counter-example.) LRU and Optimal are *stack algorithms* — their fault counts never increase with more frames.\n\n**GATE trap:** a question asks which policy is optimal (impossible in practice — needs future knowledge) or which suffers Belady\'s anomaly (FIFO).',
        '### Deep Dive — Thrashing & the Working Set\n**Thrashing:** the system spends more time paging than executing — throughput collapses.\n\n**Cause:** the *working set* (pages each process actively uses) exceeds available frames. Every process faults continuously, stealing frames from each other.\n\n**Cures:**\n1. Reduce the degree of multiprogramming (run fewer processes).\n2. Use **working-set model**: keep each process\'s active pages resident.\n3. **Page-fault-frequency (PFF)**: if a process faults too often, give it more frames; too rarely, take frames away.\n\n**GATE pattern:** "which technique prevents thrashing?" → *working-set model / decreasing multiprogramming degree*.',
      ],
      compare: {
        'segmentation': '### Paging vs Segmentation — side by side\n| Criterion | Paging | Segmentation |\n|---|---|---|\n| Unit | Fixed-size pages | Variable-size segments |\n| Fragmentation | Internal (small) | External (real risk) |\n| User visibility | Invisible | Visible (logical units) |\n| Table | Page table per process | Segment table per process |\n| Sharing | Hard (page-level) | Easy (segment = logical module) |\n| Combined | — | Segmented paging combines both |\n\n**GATE fact:** pure segmentation suffers *external* fragmentation; paging suffers *internal* fragmentation.',
        'generic': 'Compare memory-management approaches along **what they fragment** and **how they translate**:\n- **Contiguous allocation** — external fragmentation, simple.\n- **Paging** — internal fragmentation, fixed pages, page tables.\n- **Segmentation** — external fragmentation, variable segments.\n- **Segmented paging** — both, hybrid translation.\n\nAny comparison question: name the unit, the fragmentation type, and the table structure.',
      },
      pyq: '### Solved GATE-style PYQ — Page Table Size\n**Question:** Virtual address = 32 bits, page size = 4 KB, physical memory = 64 KB. Find the page table size.\n\n**Step 1:** page size 4 KB → offset = 12 bits → virtual page number = 32 − 12 = **20 bits**.\n\n**Step 2:** number of pages = 2²⁰ ≈ **1,048,576 entries**.\n\n**Step 3:** physical memory 64 KB → physical frames = 64 KB / 4 KB = 16 → frame number = 4 bits → page table entry ≈ 4 bits (+ valid/protection bits).\n\n**Answer:** the page table has 2²⁰ entries; with ~4-bit frame numbers it is tiny, but with real 32-bit frame addresses it is 2²⁰ × 4 bytes = **4 MB** per process.\n\n**Method:** bits_for_offset = log₂(page_size); virtual_page_bits = address_bits − offset_bits; table_size = 2^(virtual_page_bits) × entry_size.',
      mistakes: '### Common Mistakes on Virtual Memory\n1. **Off-by-one in address split.** Offset bits = log₂(page size); page number bits = address bits − offset bits. Forgetting the subtraction inverts the whole answer.\n2. **EAT formula errors.** The miss path must include the *page-table walk* plus the data access; many students count only one memory access.\n3. **Claiming Optimal is usable.** It needs future reference knowledge — theoretical only.\n4. **Wrong fragment type.** Paging → internal fragmentation; segmentation → external. Swap them and you lose the mark.\n5. **Belady\'s anomaly attribution.** It happens with FIFO (and some others), NOT with LRU/Optimal.\n6. **Saying the TLB removes page faults.** The TLB only caches *translations*; page faults come from missing pages — different problems entirely.',
    },
  },
  'recursion': {
    intro: '**Recursion** is a programming technique where a function solves a problem by calling itself with a smaller or simpler version of the same problem, until it reaches a **base case**.',
    sections: [
      ['Core Structure', 'Every recursive function needs two parts:\n1. **Base case** — the simplest input, solved directly without recursion (this is what stops the function)\n2. **Recursive case** — the function calls itself on a smaller sub-problem, then combines the results\n\nExample: factorial\n```python\ndef fact(n):\n    if n <= 1:      # base case\n        return 1\n    return n * fact(n - 1)  # recursive case\n```'],
      ['The Call Stack', 'Each call pushes a new frame onto the **call stack** holding its local variables and return address. When the base case returns, frames unwind in reverse order. This is why deep recursion can overflow the stack.'],
      ['Recursion vs Iteration', '- Recursion is often more **readable** for naturally recursive problems (trees, backtracking, divide-and-conquer)\n- Iteration avoids stack overhead and is usually faster\n- Many recursive solutions can be rewritten iteratively with an explicit stack'],
      ['Common Examples', '- **Factorial and Fibonacci** — classic intro examples\n- **Tree traversal** — visiting every node of a binary tree\n- **Binary search** — repeatedly halving the search space\n- **Divide and conquer** — merge sort, quicksort\n- **Backtracking** — N-Queens, maze solving, permutations'],
      ['Pitfalls', '- **Missing base case** → infinite recursion / stack overflow\n- **No progress** toward the base case → same problem\n- **Exponential complexity** (e.g., naive Fibonacci) → use memoization or iteration'],
    ],
    ending: 'That is recursion end to end: what it is, how the call stack makes it work, how it compares with iteration, and the patterns where it shines.',
    followups: {
      example: '### Worked Example — Factorial Trace\n`fact(n) = n × fact(n−1)`, base case fact(1) = 1. Trace `fact(4)`:\n\n- fact(4) = 4 × fact(3)\n- fact(3) = 3 × fact(2)\n- fact(2) = 2 × fact(1)\n- fact(1) = **1** (base case — unwinding starts)\n- fact(2) = 2 × 1 = 2\n- fact(3) = 3 × 2 = 6\n- fact(4) = 4 × 6 = **24**\n\nEach call pushes a frame onto the **call stack**; when the base case hits, frames pop in reverse order.',
      example2: '### Worked Example — Fibonacci (with call tree)\n`fib(n) = fib(n−1) + fib(n−2)`, base fib(0)=0, fib(1)=1.\n\nfib(5) calls fib(4) and fib(3); fib(4) calls fib(3) and fib(2)… The call tree **explodes**:\n- fib(5) computes fib(3) twice, fib(2) three times.\n- Number of calls ≈ 2ⁿ — **exponential** without memoization.\n\n**Fix — memoization:** store already-computed values → fib(n) becomes O(n). This is the canonical example of why naive recursion can be wasteful and why dynamic programming starts from recursion.',
      simplified: 'Recursion is like **asking a line of people to pass a message backwards**:\n- You ask the person at the front to count how many people are behind them.\n- They ask the next person, who asks the next… until someone can answer directly (base case).\n- Then the answers **echo back** up the line, each person adding 1.\n\nThat echo-back is the call stack. Every recursive function is just a smaller version of itself, ending at a question that can be answered instantly.',
      why: 'Recursion is the **foundation of every divide-and-conquer and tree algorithm** — and GATE tests it heavily through those. Expect:\n1. **Recurrence relations** — T(n) = 2T(n/2) + O(n) → solve for merge sort (O(n log n)).\n2. **Tracing recursive functions** — find the output of a given function (frequently asked).\n3. **Stack depth** — how many frames fit before stack overflow.\n4. **Tree traversal & backtracking** — N-Queens, permutations, binary tree walks.\n\nIt is the single most reusable concept in the entire Algorithms paper.',
      how: 'Every recursive solution follows the same recipe:\n1. **Identify the smaller sub-problem** — how does n reduce to n−1 (or n/2)?\n2. **Write the base case** — the input where the answer is trivial (this stops the recursion).\n3. **Write the recursive case** — call the function on the smaller input, then combine the result.\n4. **Verify termination** — every recursive call must move strictly toward the base case.\n\nThe **call stack** is the key mental model: each call saves its locals, calls the next, and waits; results unwind in reverse order.',
      more: [
        '### Deep Dive — Tail Recursion & Iteration\n**Tail recursion** = the recursive call is the *very last* operation (nothing pending after it). Example:\n\n```python\ndef fact_tail(n, acc=1):\n    if n <= 1:\n        return acc\n    return fact_tail(n - 1, acc * n)\n```\n\nBecause nothing happens after the call, the compiler can **reuse the current stack frame** (tail-call optimization) — no stack growth. Non-tail recursion (like plain factorial) must keep frames alive until the multiplication after the call.\n\n**GATE fact:** tail-recursive functions can be trivially rewritten as loops and can run in constant stack space.',
        '### Deep Dive — Recursion for Trees\nTrees are the natural home of recursion — each subtree is a smaller tree:\n\n```python\ndef inorder(node):\n    if node is None:\n        return\n    inorder(node.left)     # left\n    visit(node)            # root\n    inorder(node.right)    # right\n```\n\nTraversals: **preorder** (root, left, right), **inorder** (left, root, right — sorted for a BST), **postorder** (left, right, root).\n\n**Height of a tree:** `height(node) = 1 + max(height(left), height(right))` — a one-line recursive definition that GATE loves to ask about.',
        '### Deep Dive — Recursion → Dynamic Programming\nThe path from recursion to DP is mechanical:\n1. Write the **naive recursive** solution.\n2. Notice **overlapping sub-problems** (like Fibonacci computing fib(3) repeatedly).\n3. Add **memoization** (cache results in a table) → top-down DP.\n4. Reorder to **bottom-up** (fill the table from base cases) → classic DP.\n\n**Example — knapsack:** recursive choice "include item i or not" + memoization on (i, weight_remaining) is the entire algorithm. GATE DP questions (LCS, knapsack, matrix-chain) are all recursion + caching.',
      ],
      compare: {
        'iteration': '### Recursion vs Iteration — side by side\n| Criterion | Recursion | Iteration |\n|---|---|---|\n| Readability | Better for trees/backtracking | Better for linear loops |\n| Stack use | Call stack per call | Single loop variable |\n| Risk | Stack overflow on deep input | None |\n| Performance | Function-call overhead | Usually faster |\n| Rewrite | Can become loop (tail-call) | Can become recursion (explicit stack) |\n\n**GATE takeaway:** any recursion can be simulated iteratively with an explicit stack; any loop can be written recursively. Choose based on clarity and stack depth.',
        'generic': 'How to compare recursive vs non-recursive approaches:\n- **Naturally recursive problems:** trees, divide-and-conquer, backtracking — recursion wins on clarity.\n- **Deep linear recursion:** risks stack overflow — prefer iteration.\n- **Exponential naive recursion:** needs memoization (DP) or iteration.\n\nState the structure of the problem (does it decompose into identical sub-problems?) and the choice follows.',
      },
      pyq: '### Solved GATE-style PYQ — Function Trace\n**Question:** What does the following function print for `fun(5)`?\n\n```\nvoid fun(int n) {\n  if (n == 0) return;\n  fun(n - 1);\n  printf(\"%d \", n);\n}\n```\n\n**Step 1 — reach the base:** fun(5) → fun(4) → fun(3) → fun(2) → fun(1) → fun(0) [returns].\n\n**Step 2 — unwind:** the `printf` runs *after* the recursive call, so output happens on the way back:\n- fun(1) prints 1\n- fun(2) prints 2\n- fun(3) prints 3\n- fun(4) prints 4\n- fun(5) prints 5\n\n**Answer: 1 2 3 4 5.**\n\n**Method:** if the print is *before* the call you get 5 4 3 2 1 (preorder); if *after*, you get 1 2 3 4 5 (postorder). This "order of print relative to the recursive call" pattern is a recurring GATE question.',
      mistakes: '### Common Mistakes on Recursion\n1. **Missing the base case** → infinite recursion → stack overflow.\n2. **No progress toward the base case** — the recursive call must reduce the problem every time.\n3. **Order of print/action vs call.** Before the call = preorder; after = postorder. Swapping changes the output entirely (the PYQ above!).\n4. **Assuming tail calls save the stack always.** Only with *tail-call optimization* enabled; naive recursion still grows the stack.\n5. **Exponential blow-up without memoization.** Fibonacci naive = O(2ⁿ); with memoization = O(n).\n6. **Wrong recurrence for divide-and-conquer.** Mergesort is T(n) = 2T(n/2) + O(n) → O(n log n); binary search T(n) = T(n/2) + O(1) → O(log n). Don\'t mix them.',
    },
  },
  'compiler': {
    intro: 'A **compiler** is a program that translates source code written in a high-level language (like C or Java) into machine code or an intermediate form that a computer can execute.',
    sections: [
      ['Why Compile?', 'Humans write readable, abstract code; CPUs only execute machine instructions. The compiler bridges this gap, and in doing so it can also **optimize** the program to run faster and use less memory.'],
      ['The Pipeline', 'Compilation happens in phases:\n1. **Lexical analysis (scanner)** — converts characters into tokens\n2. **Syntax analysis (parser)** — builds a parse tree from tokens using the grammar\n3. **Semantic analysis** — checks type correctness and meaning\n4. **Intermediate code generation** — a machine-independent IR (e.g., three-address code)\n5. **Optimization** — improves the IR (constant folding, dead-code elimination)\n6. **Code generation** — emits target machine instructions'],
      ['Compilers vs Interpreters', 'A **compiler** translates the whole program upfront; an **interpreter** executes source code line by line (e.g., Python, old BASIC). Hybrids like the **JVM** compile to bytecode, then interpret or JIT-compile it at runtime.'],
      ['Key Concepts', '- **Tokens & lexemes** — output of the scanner\n- **Grammars & parse trees** — how the parser validates syntax\n- **Symbol tables** — where identifiers and their attributes live\n- **Intermediate representation (IR)** — the compiler\'s lingua franca\n- **JIT compilation** — compiling hot code at runtime for speed'],
      ['Famous Compilers', 'GCC and Clang (C/C++), javac (Java), Rustc, and V8\'s TurboFan (JavaScript JIT).'],
    ],
    ending: 'That covers what a compiler is, the phases it goes through, how it differs from an interpreter, and the key concepts behind it.',
    followups: {
      example: '### Worked Example — Compiling a Statement\nInput: `a = b + c * 2;`\n\n1. **Lexical analysis:** tokens → `a`, `=`, `b`, `+`, `c`, `*`, `2`, `;`.\n2. **Syntax analysis:** parse tree from the grammar — multiplication binds tighter than addition:\n   ```\n        =\n       / \\\n      a   +\n         / \\\n        b   *\n           / \\\n          c   2\n   ```\n3. **Semantic analysis:** check that a, b, c are declared and types match.\n4. **Intermediate code:** `t1 = c * 2; t2 = b + t1; a = t2`.\n5. **Optimization:** if c is a constant 2, constant folding might compute the value; otherwise keep as is.\n6. **Code generation:** machine instructions for the target CPU.',
      example2: '### Worked Example — The Expression on the Stack (e.g., x86)\nFor `t2 = b + t1`:\n1. `MOV R0, [b]`   (load b into a register)\n2. `ADD R0, [t1]`  (add t1)\n3. `MOV [t2], R0`  (store result)\n\n**Register allocation** is the phase that decides *which* registers to use, minimizing loads/stores. This is a core **code generation** question — GATE asks about register allocation (e.g., graph coloring) and about the number of registers needed for an expression tree.',
      simplified: 'A compiler is like a **translator between a foreign author and a reader**:\n- The author writes a long book in a high-level language (source code).\n- The translator reads the whole book (syntax analysis), checks the logic (semantic analysis), writes a careful outline (intermediate code), polishes it (optimization), and finally rewrites it in the reader\'s language (machine code).\n\nCrucially, the translator works **before the reader ever sees the book** — the reader gets a finished translation, not a live interpretation. That is the difference between compiling (upfront) and interpreting (live).',
      why: 'Compiler Design is a **solid GATE CSE scoring subject** (6–8 marks). The recurring topics:\n1. **Phases of compilation** — order and output of each phase.\n2. **Lexical analysis** — regular expressions, token recognition, NFA/DFA.\n3. **Parsing** — LL(1), SLR(1), LALR(1), LR(1); first/follow sets; parsing tables.\n4. **Syntax trees & intermediate code** — three-address code, DAGs.\n5. **Code optimization** — dead code elimination, constant folding, register allocation.\n\nParsing tables (First/Follow, CLR/LALR) are the highest-frequency numerical items.',
      how: 'Follow the data as source becomes machine code:\n1. **Scanner (lexer):** characters → tokens (via regex/DFA).\n2. **Parser:** tokens → parse tree (checks grammar, LL/LR).\n3. **Semantic analyzer:** type checking + symbol table updates.\n4. **IR generator:** three-address code / DAG.\n5. **Optimizer:** constant folding, dead-code elimination, common subexpression elimination.\n6. **Code generator + register allocator:** machine instructions.\n\nEach phase\'s output is the next phase\'s input — "front end" (1–3) is machine-independent, "back end" (5–6) is machine-dependent.',
      more: [
        '### Deep Dive — First & Follow Sets (Parsing)\n**FIRST(X)** = set of terminals that can begin strings derived from X.\n**FOLLOW(A)** = set of terminals that can follow A in any derivation.\n\nRules for FOLLOW:\n1. `$` ∈ FOLLOW(start_symbol).\n2. For A → αBβ: everything in FIRST(β) (except ε) ∈ FOLLOW(B).\n3. For A → αB (or A → αBβ where β ⇒* ε): everything in FOLLOW(A) ∈ FOLLOW(B).\n\n**GATE pattern:** compute FIRST and FOLLOW for a small grammar, then build an LL(1) table, then check for conflicts (a table cell with two entries = not LL(1)).',
        '### Deep Dive — LR vs LL Parsing\n| Parser | Direction | Stack | Power |\n|---|---|---|---|\n| LL(1) | Left-to-right, Leftmost | Predict by lookahead | Weakest |\n| SLR(1) | Left-to-right, Rightmost | LR items | Medium |\n| LALR(1) | Same | Same, merged states | Stronger |\n| CLR(1)/LR(1) | Same | Full lookahead | Strongest |\n\n**Facts for GATE:**\n- Every LL(1) grammar is LALR(1); the converse is false.\n- **LALR(1) = CLR(1) with merged states** — fewer states, same language for most grammars, may introduce reduce-reduce conflicts.\n- All these parsers are *bottom-up* except LL (top-down).',
        '### Deep Dive — Optimization & Three-Address Code\n**Three-address code** limits each instruction to at most one operator: `t = b + c`.\n\nCommon optimizations:\n- **Constant folding:** `x = 2 * 3` → `x = 6`.\n- **Constant propagation:** `x = 5; y = x + 1` → `y = 6`.\n- **Dead code elimination:** remove statements whose results are never used.\n- **Common subexpression elimination:** compute `a * b` once, reuse it.\n- **Strength reduction:** replace `x * 2` with `x << 1`.\n\n**GATE question type:** "which optimization does this transformation represent?" or "how many registers are needed to evaluate this expression?" — a common numerical.',
      ],
      compare: {
        'interpreter': '### Compiler vs Interpreter — side by side\n| Criterion | Compiler | Interpreter |\n|---|---|---|\n| Timing | Whole program upfront | Line by line, at runtime |\n| Output | Machine code / executable | Executes directly |\n| Speed | Fast execution | Slower (repeats analysis) |\n| Errors | Many at once (whole file) | One at a time |\n| Examples | gcc, javac, rustc | Python, Ruby, old BASIC |\n\n**Hybrids:** the JVM compiles to **bytecode**, then *JIT-compiles* hot methods at runtime — compilers and interpreters are a spectrum, not a binary.',
        'generic': 'Compare compiler phases along **what they consume and produce**:\n- Front end: source → IR (machine-independent).\n- Middle: IR → optimized IR.\n- Back end: IR → machine code (target-specific).\n\nAny phase question: name the input, the output, and whether it depends on the target machine.',
      },
      pyq: '### Solved GATE-style PYQ — FIRST and FOLLOW\n**Question:** For the grammar `S → aSb | ε`, find FIRST(S) and FOLLOW(S).\n\n**FIRST(S):**\n- `S → aSb` → first symbol is `a` → `a` ∈ FIRST(S).\n- `S → ε` → `ε` ∈ FIRST(S).\n- **FIRST(S) = { a, ε }**\n\n**FOLLOW(S):**\n- `$` ∈ FOLLOW(S) (start symbol).\n- In `S → aSb`, the `b` follows the first `S`: so `b` ∈ FOLLOW(S) (the `b` here is after the S in the production, and FOLLOW applies to the S on the LHS... actually for the RHS `aSb`, the S inside is followed by `b`).\n- **FOLLOW(S) = { b, $ }**\n\n**Method:** FIRST is the set of leading terminals (or ε); FOLLOW is what can legally come after a nonterminal, starting with `$` for the start symbol. Practise on a few grammars and this becomes mechanical.',
      mistakes: '### Common Mistakes on Compiler Design\n1. **Wrong phase order.** Lexical → syntax → semantic → IR → optimization → codegen. Semantic analysis happens *after* parsing, before code generation.\n2. **FIRST vs FOLLOW mix-up.** FIRST = beginnings; FOLLOW = what follows (and `$` always ∈ FOLLOW of the start symbol).\n3. **Claiming LL(1) = LALR(1).** The reverse is true — LALR(1) ⊇ LL(1) languages.\n4. **Calling the lexer the parser.** The scanner produces *tokens*; the parser builds the *parse tree*. Distinct phases, distinct outputs.\n5. **Forgetting the "least derived" rule in SLR/LR.** Merge conflicts are about lookaheads — reduce-reduce conflicts appear when merging CLR states into LALR.\n6. **Saying interpretation is always slower.** JIT compilers and bytecode VMs (JVM, V8) blur the line — modern systems mix both for speed.',
    },
  },
};

// ════════════════════════════════════════════════════════════════════
// Conversation-aware Offline AI
// ---------------------------------------------------------------------
// The offline fallback keeps short per-conversation state and answers
// follow-ups ("explain more", "give an example", "why?", "continue",
// "simplify it", "compare with X", "show another") by referencing the
// previous assistant response instead of re-matching keywords.
// ════════════════════════════════════════════════════════════════════

const OFFLINE_TOPIC_PATTERNS = [
  { key: 'cpu scheduling', re: /cpu schedul|schedul|fcfs|sjf|srtf|round robin|shortest job/i },
  { key: 'deadlock', re: /deadlock|dead lock|banker/i },
  { key: 'dijkstra', re: /dijkstra|shortest path/i },
  { key: 'tcp', re: /\btcp\b|3.?way handshake|transmission control/i },
  { key: 'normalization', re: /normaliz|\b1nf\b|\b2nf\b|\b3nf\b|bcnf/i },
  { key: 'binary search', re: /binary search/i },
  { key: 'operating system', re: /operating system|\bos\b/i },
  { key: 'dbms', re: /dbms|database/i },
  { key: 'virtual memory', re: /virtual memory/i },
  { key: 'recursion', re: /recursion|recursive/i },
  { key: 'compiler', re: /compiler|compile/i },
];

function detectOfflineTopic(message) {
  const lower = message.toLowerCase();
  for (const p of OFFLINE_TOPIC_PATTERNS) {
    if (p.re.test(lower)) return p.key;
  }
  return null;
}

// Follow-up intent detection. Returns { intent, target } or null.
// target is only meaningful for 'compare'.
function detectFollowUpIntent(message) {
  const m = message.toLowerCase().trim();
  const short = m.replace(/[?!.]/g, '');
  if (/^(explain more|tell me more|more|continue|go on|elaborate|expand|and then|keep going|tell me more about it|go deeper|dive deeper)/.test(short)) return { intent: 'more' };
  if (/^(solve|do|try|work).*(pyq|gate question|previous year|previous year question)|pyq|gate question|previous year question|previous year/.test(m)) return { intent: 'pyq' };
  if (/common mistake|mistakes|pitfall|pitfalls|tricky|what.*wrong|error people|common error/.test(m)) return { intent: 'mistakes' };
  if (/^(why|why\?|why is|why does|why do|why it matters|importance|significance)/.test(m)) return { intent: 'why' };
  if (/^(how|how\?|how does|how do|how it works|how is|how are)/.test(m) || /how does (it|this|that) work/.test(m)) return { intent: 'how' };
  if (/simplif|simpler|simply|dumb down|in simple terms|easy terms|basic terms|layman/.test(m)) return { intent: 'simplify' };
  if (/another example|one more example|show another|another one|give another/.test(m)) return { intent: 'example2' };
  if (/give me an example|show me an example|an example|example\b|illustrat|instance/.test(m)) return { intent: 'example' };
  if (/compare|versus| vs |difference between/.test(m)) {
    const target = extractCompareTarget(m);
    return { intent: 'compare', target };
  }
  return null;
}

function extractCompareTarget(m) {
  // Look for a known algorithm name after compare/vs/with.
  const known = ['round robin', 'fcfs', 'sjf', 'srtf', 'shortest job first', 'priority', 'multilevel', 'mlfq'];
  const idx = Math.max(m.indexOf('compare'), m.indexOf(' vs '), m.indexOf('versus'), m.indexOf('difference between'));
  const tail = idx >= 0 ? m.slice(idx) : m;
  for (const k of known) {
    if (tail.includes(k)) return k;
  }
  if (tail.includes('it')) return null; // ambiguous
  return null;
}

const offlineConversations = new Map(); // key -> { topic, lastText, history: [] }

function getOfflineConvo(key) {
  if (!key) return null;
  if (!offlineConversations.has(key)) {
    offlineConversations.set(key, { topic: null, lastText: null, history: [] });
  }
  return offlineConversations.get(key);
}

function seedOfflineConvoFromHistory(convo, history) {
  if (!convo || !Array.isArray(history)) return;
  // Walk backwards for the most recent assistant response that mentions a topic.
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (!turn) continue;
    const content = typeof turn === 'string' ? turn : (turn.content || '');
    const topic = detectOfflineTopic(content);
    if (topic) {
      convo.topic = topic;
      convo.lastText = content;
      return;
    }
  }
}

function buildFollowUpText(intent, topic, target, convo) {
  const entry = AUTO_KNOWLEDGE_BASE[topic];
  if (!entry) return null;
  const fu = entry.followups || {};
  switch (intent) {
    case 'example': return fu.example || extractExampleFromEntry(entry);
    case 'example2': return fu.example2 || fu.example || extractExampleFromEntry(entry);
    case 'simplify': return fu.simplified || fu.simple || null;
    case 'why': return fu.why || null;
    case 'how': return fu.how || null;
    case 'pyq': return fu.pyq || fu.example || extractExampleFromEntry(entry) || 'I don\'t have a ready PYQ worked example for this topic in offline mode. Try asking for a worked example instead, or switch to coach mode.';
    case 'mistakes': return fu.mistakes || 'I don\'t have a dedicated common-mistakes list for this topic in offline mode. Try "give an example" or "explain more" to go deeper on what I do have.';
    case 'more': {
      // Rotate through deep-dive sections so Continue/Explain more keeps expanding.
      const pool = Array.isArray(fu.more) ? fu.more : (fu.more ? [fu.more] : []);
      const extras = [fu.pyq, fu.mistakes, fu.how, fu.why].filter(Boolean);
      const fullPool = [...pool, ...extras];
      if (fullPool.length === 0) return null;
      const idx = convo?.shownExtra || 0;
      const text = fullPool[Math.min(idx, fullPool.length - 1)];
      if (convo) convo.shownExtra = Math.min(idx + 1, fullPool.length - 1);
      return text;
    }
    case 'compare': {
      const c = fu.compare || {};
      if (target && c[target]) return c[target];
      if (c.generic) return c.generic;
      return null;
    }
    default: return null;
  }
}

// Expanded knowledge base entries with optional follow-up content.
const OFFLINE_EXTRA_KB = {
  'cpu scheduling': {
    intro: '**CPU scheduling** is the process by which the operating system decides which ready process gets the CPU next, and for how long. Since a single CPU can run only one process at a time, the scheduler selects among runnable processes using an algorithm such as FCFS, SJF, or Round Robin.',
    sections: [
      ['Key Concepts', '- **Scheduler** — the OS component that picks the next process to run\n- **Ready queue** — processes waiting for the CPU\n- **Preemptive vs non-preemptive** — whether the scheduler can interrupt a running process\n- **Context switch** — saving/restoring process state when switching'],
      ['Scheduling Criteria', 'Algorithms are judged by:\n- **CPU utilization** — keep the CPU busy\n- **Throughput** — processes completed per unit time\n- **Turnaround time** — time from submission to completion\n- **Waiting time** — time spent in the ready queue\n- **Response time** — time from submission to first response'],
      ['FCFS (First Come, First Served)', 'The first process to arrive runs first. Simple and fair, but **non-preemptive** — a long process behind a short one makes everyone wait (the *convoy effect*). Average waiting time can be high.'],
      ['SJF (Shortest Job First) / SRTF', 'SJF runs the shortest job next and is optimal for average waiting time, but requires knowing job lengths in advance. **SRTF** is its preemptive version. Both can starve long processes.'],
      ['Round Robin (RR)', 'Each process gets a fixed time slice (**quantum**, e.g. 50 ms) in a circular order. Fair and preemptive — great response time for interactive work. If the quantum is too small, context-switch overhead rises; too large, it degrades to FCFS.'],
      ['Priority Scheduling', 'The highest-priority ready process runs first. Can be preemptive or not; low-priority processes may **starve**, often solved by *aging*.'],
    ],
    ending: 'So CPU scheduling is how the OS shares the CPU among many processes, balancing fairness, throughput, and response time through algorithms like FCFS, SJF, and Round Robin.',
    followups: {
      example: '### Worked Example — FCFS and SJF\nConsider 3 processes arriving at time 0:\n\n| Process | Burst Time |\n|---|---|\n| P1 | 24 ms |\n| P2 | 3 ms |\n| P3 | 3 ms |\n\n**FCFS order:** P1 → P2 → P3\n- P1: waits 0, runs 24\n- P2: waits 24, runs 3\n- P3: waits 27, runs 3\n\nAverage waiting time = (0 + 24 + 27) / 3 = **17 ms**.\n\n**SJF order (shortest first):** P2 → P3 → P1\n- P2: waits 0, runs 3\n- P3: waits 3, runs 3\n- P1: waits 6, runs 24\n\nAverage waiting time = (0 + 3 + 6) / 3 = **3 ms**.\n\nKey insight: **SJF is provably optimal** for minimizing average waiting time, but it requires knowing each job\'s length in advance — which is why it is mostly a theoretical benchmark rather than a practical scheduler.\n\n**GATE tip:** always draw the Gantt chart first, then compute waiting and turnaround times from it.',
      example2: '### Worked Example — Round Robin (quantum = 4 ms)\nSame processes: P1 (24), P2 (3), P3 (3) at time 0.\n\n| Time | Running | Remaining |\n|---|---|---|\n| 0–4 | P1 | 20 |\n| 4–7 | P2 | 0 (done) |\n| 7–10 | P3 | 0 (done) |\n| 10–14 | P1 | 16 |\n| 14–18 | P1 | 12 |\n| 18–22 | P1 | 8 |\n| 22–26 | P1 | 4 |\n| 26–30 | P1 | 0 |\n\n- P1 response time = 0 (first), P2 = 4 ms, P3 = 7 ms.\n- Turnaround times: P1 = 30, P2 = 7, P3 = 10 → average = (30+7+10)/3 = **15.67 ms**.\n\nCompare with FCFS\'s average turnaround of 33 ms — Round Robin traded total throughput for dramatically better **response time** on the short jobs.',
      simplified: 'Think of the CPU as a single teacher with many students waiting.\n\n- **FCFS** = students line up and get help one at a time. Fair, but one slow student makes everyone wait (that is the *convoy effect*).\n- **Round Robin** = each student gets a fixed 10-minute turn, then the next student. Nobody waits more than 10 minutes to start — great for interactive work, but the teacher spends time switching between students.\n- **SJF** = the teacher helps the quickest student first so the queue clears faster. Efficient on average, but a slow student could wait forever (starvation).\n\nSo: FCFS is simplest, SJF is fastest on average, Round Robin is fairest.',
      why: 'CPU scheduling is one of the **most heavily tested OS topics in GATE** — expect at least one numerical every year.\n\nWhat examiners test:\n1. **Compute average waiting/turnaround time** for FCFS, SJF (non-preemptive & SRTF preemptive), and Round Robin given burst times.\n2. **Compare algorithms** on fairness, throughput, response time, and starvation.\n3. **Reason about the quantum** — what happens if Round Robin\'s quantum is too small (context-switch overhead) or too large (becomes FCFS).\n4. **Recognize starvation** and the *aging* solution.\n\nMastering these 4 patterns covers nearly every CPU-scheduling question that appears on the paper.',
      how: 'The scheduler operates on the **ready queue**:\n1. A process becomes ready (new arrival or I/O completion) → enqueue.\n2. When the CPU is free, the scheduler picks a process per the algorithm.\n3. For **preemptive** schedulers (Round Robin, SRTF, preemptive priority), a **timer interrupt** fires at the quantum boundary and forces a decision even if the current process is unfinished.\n4. A **context switch** saves the outgoing process\'s registers/program counter and restores the incoming one.\n5. On completion, the process exits the ready queue; on I/O, it moves to the I/O wait queue and returns later.\n\nPreemptive vs non-preemptive is the single most important distinction: **non-preemptive** only decides when a process finishes or blocks; **preemptive** can interrupt mid-run.',
      more: [
        '### Deep Dive — Context-Switch Overhead\nEvery switch costs a few microseconds (save/restore registers, update PCB, invalidate TLB). With Round Robin, the quantum sets the trade-off:\n- Quantum **too small** (e.g., 1 ms) → the CPU spends a significant fraction merely switching → low utilization.\n- Quantum **too large** (e.g., 500 ms) → interactive processes wait too long → feels like FCFS.\n- Typical production quantum: **10–100 ms**, keeping overhead around 1%.\n\n**Formula for switch overhead:** if quantum = q and switch cost = c, utilization = q / (q + c). For q = 50 ms, c = 1 ms → 50/51 ≈ **98%**.\n\nThis is a classic GATE numerical — remember the formula.',
        '### Deep Dive — Starvation and Aging\n**Starvation** happens when a long job (or low-priority job) never gets the CPU because shorter/higher-priority jobs keep jumping the queue.\n- **SJF**: a 100 ms job behind a stream of 1 ms jobs waits forever.\n- **Priority scheduling**: a low-priority process may never run.\n\n**Aging** fixes this: gradually increase a waiting process\'s priority over time until it reaches the front. This guarantees progress and is how real systems avoid permanent starvation.\n\n**GATE pattern:** "Which technique prevents starvation in priority scheduling?" → *aging*.',
        '### Deep Dive — Real OS Schedulers\nModern kernels don\'t use pure FCFS/SJF/RR; they use **multilevel feedback queues**.\n- Linux **CFS** (Completely Fair Scheduler): a red-black tree keyed by *virtual runtime*; it gives every process a fair share of CPU time weighted by nice value.\n- Windows: priority classes + round-robin time slices within each class.\n- The **Multilevel Feedback Queue (MLFQ)**: processes start at the top priority queue with a short quantum; if they use the whole quantum, they drop to a lower queue with a longer quantum. CPU-bound jobs sink; interactive jobs stay on top. This balances response time and throughput automatically.\n\nUnderstanding MLFQ connects the "textbook" algorithms to the schedulers that actually run on your machine.',
      ],
      compare: {
        'round robin': '### FCFS vs Round Robin — side by side\n| Criterion | FCFS | Round Robin |\n|---|---|---|\n| Preemptive? | No | Yes (quantum) |\n| Starvation | Never | Never |\n| Response time | Poor (convoy effect) | Excellent (≤ 1 quantum) |\n| Context switches | Few | One per quantum |\n| Best for | Batch jobs | Interactive/time-sharing |\n| Simple? | Simplest | Needs quantum choice |\n\n**When to pick:** RR is the right default for general-purpose, interactive systems; FCFS survives only in simple batch contexts.',
        'sjf': '### SJF vs Round Robin — side by side\n| Criterion | SJF / SRTF | Round Robin |\n|---|---|---|\n| Goal | Minimize avg waiting time | Fairness + response time |\n| Needs job length | Yes (its weakness) | No |\n| Starvation | Can starve long jobs | Never |\n| Preemptive | SJF no / SRTF yes | Always |\n| Best for | Batch, known durations | Interactive workloads |\n\n**Key takeaway:** SJF optimizes a *global* metric but is impractical and unfair; RR is practical and fair but does not optimize waiting time.',
        'fcfs': '### SJF vs FCFS — side by side\n| Criterion | FCFS | SJF |\n|---|---|---|\n| Avg waiting time | Can be very high (convoy) | **Minimum possible** |\n| Starvation | Never | Can starve long jobs |\n| Needs job length | No | Yes |\n| Complexity | O(1) | Needs sorting/priority queue |\n\nSJF is the benchmark: no algorithm (without preemption and without knowing the future) beats it on average waiting time.',
        'generic': 'All scheduling algorithms trade off the same axes: **preemption**, **fairness vs efficiency**, and **required knowledge**.\n- FCFS: simplest, no preemption, no knowledge, but poor response time.\n- SJF/SRTF: optimal waiting time, needs future knowledge, can starve.\n- Round Robin: fair + good response time, pays switch overhead, no knowledge needed.\n- Priority: respects importance, risks starvation (fixed by aging).\n\nFor any GATE comparison question, structure your answer along these axes and you will never miss a mark.',
      },
      pyq: '### Solved GATE-style PYQ — Round Robin\n**Question:** Processes P1 (4 ms), P2 (5 ms), P3 (2 ms), P4 (3 ms) arrive at time 0. Round Robin with quantum = 2 ms. Find the average waiting time.\n\n**Gantt chart (quantum 2):**\n| 0–2 | 2–4 | 4–6 | 6–8 | 8–10 | 10–12 | 12–14 |\n|---|---|---|---|---|---|---|\n| P1 | P2 | P3 | P4 | P1 | P2 | P4 |\n\nStep-by-step:\n- P1: 0–2 (2 left), P2: 2–4 (3 left), P3: 4–6 (done), P4: 6–8 (1 left), P1: 8–10 (done), P2: 10–12 (1 left), P4: 12–14 (done), P2: done at 15.\n\n**Waiting times:**\n- P1 = 0 + (8 − 2) = **6 ms**\n- P2 = 2 + (10 − 4) + (15 − 12) = **11 ms**\n- P3 = **4 ms**\n- P4 = 6 + (12 − 8) = **10 ms**\n\nAverage waiting time = (6 + 11 + 4 + 10) / 4 = **7.75 ms**.\n\n**Method:** always draw the Gantt chart row-by-row per quantum, then sum each process\'s non-running intervals as its waiting time.',
      mistakes: '### Common Mistakes on CPU Scheduling\n1. **Forgetting preemption.** SRTF and Round Robin can interrupt a running process; FCFS and SJF (non-preemptive) cannot. Recompute when a new shorter job arrives in SRTF.\n2. **Quantum boundaries in Round Robin.** A process that finishes *exactly* at the quantum boundary still gets requeued and then immediately removed — trace it carefully; many candidates misplace the completion time.\n3. **Confusing waiting vs turnaround.** Waiting = turnaround − burst time. Always compute turnaround first, then subtract.\n4. **Ignoring arrival times.** "Arrive at time 0" is a simplification. If arrivals are staggered, the ready queue order changes — always sort by arrival time first.\n5. **Claiming SJF is always feasible.** It is optimal *only* if job lengths are known; real schedulers cannot know future bursts.\n6. **Forgetting starvation/aging** in priority questions.\n\nSkip these and the numerical is trivial — most lost marks in GATE OS come from exactly these slip-ups.',
    },
  },
  'deadlock': {
    intro: 'A **deadlock** is a situation in operating systems where two or more processes are each waiting for a resource held by another, so none can proceed.',
    sections: [
      ['Four Necessary Conditions', 'Deadlock requires ALL four: (1) **mutual exclusion** — resources are non-shareable, (2) **hold and wait** — a process holds a resource while waiting for another, (3) **no preemption** — resources cannot be forcibly taken, (4) **circular wait** — a cycle of processes each waiting for a resource held by the next.'],
      ['Prevention', 'Break one condition: allow resource sharing, request all resources at once, allow preemption, or impose a global ordering on resources to break circular wait.'],
      ['Avoidance', 'The **Banker\'s Algorithm** decides whether granting a request leaves the system in a *safe state* — it simulates whether all processes can still finish.'],
      ['Detection & Recovery', 'Detect via a **wait-for graph** cycle check, then recover by killing a process or preempting resources.'],
    ],
    ending: 'Deadlock is prevented by breaking one of its four necessary conditions, avoided with the Banker\'s Algorithm, or handled by detection and recovery.',
    followups: {
      example: '### Worked Example — Resource Deadlock\nTwo processes and two resources:\n- P1 holds the **printer**, needs the **scanner**.\n- P2 holds the **scanner**, needs the **printer**.\n\nEach process refuses to release what it holds while waiting for the other → **circular wait** → neither ever progresses.\n\nAll four conditions are present:\n1. **Mutual exclusion** — printer and scanner cannot be shared.\n2. **Hold and wait** — P1 holds the printer while waiting for the scanner.\n3. **No preemption** — the OS cannot force P1 to release the printer.\n4. **Circular wait** — P1 waits on P2, P2 waits on P1.\n\n**Fix:** break any one condition. Preempt the printer from P1, or make both request all resources upfront, or impose a global ordering (always acquire the printer before the scanner).',
      example2: '### Worked Example — Wait-for Graph & Cycle\nPicture three processes:\n- P1 waits for R2 (held by P2)\n- P2 waits for R3 (held by P3)\n- P3 waits for R1 (held by P1)\n\nDraw nodes P1→P2→P3→P1 — a **cycle**. A cycle in the wait-for graph **guarantees deadlock** (when each resource has a single instance).\n\n**Detection algorithm:**\n1. Build the wait-for graph from resource-hold/wait info.\n2. Run a cycle-detection pass (DFS with visited/ancestor tracking).\n3. If a cycle exists, the system is deadlocked → recover by killing a process in the cycle or preempting a resource.\n\nWith multi-instance resources, a cycle is **necessary but not sufficient** — use a reduction/safety algorithm instead, like the Banker\'s.',
      simplified: 'Two people are eating with chopsticks — each holds one and both need the other\'s to eat. Neither will let go, so both starve forever. That is deadlock.\n\nThe only ways out: someone **drops a chopstick** (preemption), they **agree to pick both up at once** (hold-and-wait broken), or there is a **rule about who grabs first** (circular wait broken).\n\nThe same idea applies to databases, file locks, and traffic at a four-way junction where every driver refuses to yield.',
      why: 'Deadlock is a **guaranteed GATE OS question** — it has appeared in almost every paper for decades. Examiners test four recurring patterns:\n1. **Name the four conditions** and identify which is being broken by a given method.\n2. **Banker\'s Algorithm numerical** — find whether a request leaves the system in a *safe state*.\n3. **Wait-for graph cycle** — does this system deadlock?\n4. **Difference between prevention, avoidance, detection** — and the practical cost of each.\n\nLearn the one-line definition of each method and you can answer any of them: *prevention* breaks a condition statically; *avoidance* checks before granting; *detection* finds deadlock after it happens and recovers.',
      how: 'To determine if a system is deadlocked, follow these steps:\n1. **Check the four conditions** — if any is missing, deadlock is impossible.\n2. **Build the wait-for graph** (single-instance resources): an edge P→Q means P waits on a resource held by Q.\n3. **Look for a cycle** — a cycle means deadlock.\n4. For **multi-instance** resources, run the **Banker\'s safety algorithm**: repeatedly find a process whose needs can be satisfied by the available resources, mark it finished, release its resources, and repeat. If all finish → safe state; otherwise → unsafe (possible deadlock).\n\n**Prevention strategies mapped to conditions:**\n- Mutual exclusion → make resources sharable (hard in practice).\n- Hold and wait → request all resources at once, or release before requesting.\n- No preemption → allow the OS to take back a resource.\n- Circular wait → impose a total order on resource numbers and require acquisition in increasing order.',
      more: [
        '### Deep Dive — Banker\'s Algorithm Step-by-Step\nThe Banker\'s Algorithm prevents deadlock by **only granting a request if the resulting state is safe**.\n\n**Worked example:** 3 processes, 5 resource instances total.\n\n| Process | Max need | Allocated | Still needs |\n|---|---|---|---|\n| P0 | 10 | 5 | 5 |\n| P1 | 4 | 2 | 2 |\n| P2 | 9 | 2 | 7 |\n\nAvailable = 5 − (5+2+2) = **1**.\n- **Safe sequence:** P1 (needs 2, but available 1 — wait, that fails!).\n\nTry a different allocation:\n\n| Process | Max | Allocated | Still needs |\n|---|---|---|---|\n| P0 | 7 | 0 | 7 |\n| P1 | 3 | 0 | 3 |\n| P2 | 9 | 3 | 6 |\n\nAvailable = 3.\n- P1 needs 3 → grant, P1 finishes, available = 6.\n- P2 needs 6 → grant, P2 finishes, available = 9.\n- P0 needs 7 → grant, finishes.\n**Safe sequence: P1 → P2 → P0.** The state is safe.\n\nThe golden rule: a state is **safe** if there exists an order in which every process can finish; a safe state can never deadlock.',
        '### Deep Dive — Deadlock in Databases\nDatabases face the same problem with **row locks**:\n- Transaction A locks row 1, wants row 2.\n- Transaction B locks row 2, wants row 1.\n→ Classic deadlock.\n\nDBMSes resolve this with **deadlock detection + victim selection**:\n- A **waits-for graph** is maintained among transactions.\n- On cycle detection, one transaction is chosen as **victim**, rolled back, and its locks released.\n- Victim selection prefers the transaction with the *least work done* (cheapest rollback).\n\nMySQL\'s InnoDB has a *lock wait timeout* as a secondary mechanism — if a transaction waits too long, it aborts itself. Postgres uses deadlock detection and aborts one participant, printing "deadlock detected".',
        '### Deep Dive — Real-World Analogies & Prevention Practice\n**Traffic analogy:** four cars at an intersection, each waiting for the one ahead to move — circular wait → gridlock. Traffic lights impose a *global order* (break circular wait) to prevent it.\n\n**Prevention in real OSes (Linux):**\n- Kernel lock ordering — developers must acquire locks in a documented global order (deadlock detection in the kernel also exists as a safety net).\n- `trylock` APIs — if the lock is busy, fail immediately instead of blocking (breaks hold-and-wait).\n- Lockdep — a runtime lock-order validator that reports *potential* deadlock cycles.\n\n**Practical takeaway for GATE:** if a question asks "which method requires knowing maximum needs in advance?" → **avoidance (Banker\'s)**. "Which detects after the fact?" → **detection**. "Which breaks a condition by design?" → **prevention**.',
      ],
      compare: {
        'bankers algorithm': '### Prevention vs Avoidance vs Detection — side by side\n| Aspect | Prevention | Avoidance (Banker\'s) | Detection & Recovery |\n|---|---|---|---|\n| When | Static, at design | Before each grant | After deadlock occurs |\n| Knowledge needed | None (rules) | Maximum needs of every process | None for detection |\n| Cost | Underuses resources | Runtime overhead per request | Recovery cost (kill/rollback) |\n| Can it be wrong? | No | Yes — refuses safe requests too | Finds real deadlocks |\n| Typical use | Kernel lock ordering | Banking/budget systems | Databases (InnoDB, Postgres) |\n\n**One-line memory:** Prevention = don\'t allow it. Avoidance = don\'t allow it to happen (peek ahead). Detection = find it and fix it.',
        'generic': 'Compare deadlock strategies along **when they act** and **what they sacrifice**:\n- **Prevention** acts statically by breaking one of the four conditions — simplest but can underuse resources (e.g., holding all resources at once).\n- **Avoidance (Banker\'s)** acts per-request and needs full future knowledge — safe but expensive and impractical for general systems.\n- **Detection & recovery** lets deadlock happen and cleans up — needs no foreknowledge but pays rollback costs.\n\nReal systems mix them: databases detect; kernels enforce lock ordering.',
      },
      pyq: '### Solved GATE-style PYQ — Banker\'s Algorithm\n**Question:** Consider a system with 5 processes and 3 resource types: A (10 instances), B (5), C (7).\n\n| Process | Alloc A B C | Max A B C |\n|---|---|---|\n| P0 | 0 1 0 | 7 5 3 |\n| P1 | 2 0 0 | 3 2 2 |\n| P2 | 3 0 2 | 9 0 2 |\n| P3 | 2 1 1 | 2 2 2 |\n| P4 | 0 0 2 | 4 3 3 |\n\n**Step 1 — compute Need = Max − Alloc:**\n- P0: (7,4,3) · P1: (1,2,2) · P2: (6,0,0) · P3: (0,1,1) · P4: (4,3,1)\n\n**Step 2 — Available = Total − ΣAlloc** = (10,5,7) − (7,2,5) = **(3,3,2)**.\n\n**Step 3 — find a safe sequence:**\n- P1: Need (1,2,2) ≤ Avail (3,3,2) ✓ → P1 finishes, Avail = (5,3,2)\n- P3: Need (0,1,1) ≤ (5,3,2) ✓ → P3 finishes, Avail = (7,4,3)\n- P4: Need (4,3,1) ≤ (7,4,3) ✓ → P4 finishes, Avail = (7,4,5)\n- P2: Need (6,0,0) ≤ (7,4,5) ✓ → P2 finishes, Avail = (10,4,7)\n- P0: Need (7,4,3) ≤ (10,4,7) ✓ → P0 finishes.\n\n**Safe sequence: P1 → P3 → P4 → P2 → P0.** The system is in a safe state.\n\n**Method:** always compute Need and Available first, then greedily pick any process whose Need ≤ Available. If no process fits, the state is unsafe → deadlock is possible.',
      mistakes: '### Common Mistakes on Deadlock\n1. **Missing the "all four" requirement.** One missing condition means *no deadlock* — questions love to give you only three and ask if deadlock can occur (answer: no).\n2. **Confusing avoidance with detection.** Avoidance *prevents* deadlock by checking before granting; detection finds it *after* it happens. They are opposite in timing.\n3. **Forgetting to compute Need = Max − Alloc first.** Most Banker\'s numerica errors come from using Max instead of Need in the safety check.\n4. **Claiming a cycle in a wait-for graph always means deadlock.** Only true when every resource has a single instance. With multi-instance resources, a cycle is necessary but not sufficient.\n5. **Mixing up recovery methods.** Recovery = kill a process or preempt a resource — not "wait for it to resolve itself" (that never happens in a real deadlock).\n6. **Wrong answer to "what does Banker\'s need?"** It requires each process\'s *maximum* resource need declared in advance — that assumption is why it\'s impractical for general OSes.',
    },
  },
  'dijkstra': {
    intro: '**Dijkstra\'s algorithm** finds the shortest path from a single source vertex to every other vertex in a weighted graph with non-negative edge weights.',
    sections: [
      ['How It Works', 'Maintain a set of settled vertices and a tentative distance to each unsettled vertex. Repeatedly: pick the unsettled vertex with the smallest distance, settle it, and relax its edges (update neighbours if a shorter path is found).'],
      ['Complexity', 'With a binary heap: **O((V + E) log V)**. With a simple array scan: **O(V²)**.'],
      ['Limitations', 'Fails with **negative edge weights** — use Bellman-Ford instead. It is greedy but optimal because distances settle in non-decreasing order.'],
    ],
    ending: 'That is Dijkstra\'s algorithm: greedy, heap-assisted shortest paths for non-negative weighted graphs.',
    followups: {
      example: '### Worked Example — Step-by-Step\nGraph: A→B (4), A→C (2), C→B (1), B→D (5), C→D (8), D→E (2). Start at A (dist 0).\n\n| Step | Settle | Distances after relax |\n|---|---|---|\n| 1 | A (0) | B=4, C=2 |\n| 2 | C (2) | B=min(4, 2+1)=3, D=2+8=10 |\n| 3 | B (3) | D=min(10, 3+5)=8 |\n| 4 | D (8) | E=8+2=10 |\n| 5 | E (10) | — |\n\n**Shortest A→E = 10**, path A → C → B → D → E.\n\nNotice we always settle the *smallest tentative* node next, and each settled node\'s distance is final because all edges are non-negative.',
      example2: '### Worked Example — Why Negative Edges Break It\nEdge A→B (10), B→C (−15), A→C (5). Start at A.\n\nDijkstra settles C (dist 5) *before* B (dist 10). But the true best path to C is **A→B→C = 10 + (−15) = −5**, discovered only after settling B. Dijkstra already declared C final at 5 → **wrong answer**.\n\nThis is exactly why Dijkstra requires non-negative weights. For negative weights use **Bellman-Ford** (O(VE), detects negative cycles too).',
      simplified: 'Imagine dropping a stone in a pond and watching **ripples expand outward**. The wavefront always reaches the nearest point first. Dijkstra is the same: you always finalize the closest unsettled node, then push the wave a little further.\n\nSo you never guess "far" answers before "near" ones — which is why you never need to revisit a settled node.',
      why: 'Dijkstra is a **staple GATE question** and the engine behind real routing:\n1. **OSPF** (Open Shortest Path First) uses Dijkstra to compute the shortest route tree in IP networks.\n2. **Google Maps / GPS** uses variants (with heuristics) for route planning.\n3. GATE tests: complexity **(O((V+E) log V) with a heap)**, the **non-negative edge** requirement, and occasionally a trace.\n\nExaminers also love comparing it to **Prim\'s MST** and **Bellman-Ford** — know all three side by side.',
      how: 'The algorithm:\n1. Set `dist[source]=0`, all others ∞. Push source into a **min-priority queue**.\n2. Extract the minimum-distance unsettled vertex `u`.\n3. For each neighbour `v` of `u`, **relax**: if `dist[u] + w(u,v) < dist[v]`, update `dist[v]` and push `v`.\n4. Mark `u` settled. Repeat until the queue is empty.\n\n**Complexity:** with a binary heap it is **O((V+E) log V)** — each edge relaxes once, each vertex extracts once. With a naive array scan it is **O(V²)**.\n\n**Tie-break note:** when two vertices tie for minimum, pick either — the final distances are identical.',
      more: [
        '### Deep Dive — Dijkstra vs Prim vs Bellman-Ford\n| Algorithm | Purpose | Weights | Complexity |\n|---|---|---|---|\n| Dijkstra | Single-source shortest paths | Non-negative | O((V+E) log V) |\n| Bellman-Ford | Single-source shortest paths + negative cycle detection | Any (incl. negative) | O(VE) |\n| Prim | Minimum spanning tree | Any | O((V+E) log V) |\n\n**How to not confuse them:** Dijkstra relaxes edges and settles the *closest* node; Prim grows a tree by adding the *cheapest* crossing edge; Bellman-Ford relaxes *all* edges V−1 times. A common GATE trap asks "which works with negative weights?" → Bellman-Ford.',
        '### Deep Dive — Greedy Optimality Proof Sketch\nWhy is Dijkstra correct? By induction on the order nodes are settled:\n- **Base:** source distance 0 is optimal.\n- **Step:** when the smallest unsettled node `u` is settled, every path to `u` must pass through some unsettled node with distance ≥ dist[u] (all edges non-negative), so any alternative path is no better. Hence dist[u] is final.\n\nThis is the essence of the **greedy choice property** — and it\'s exactly why the non-negative requirement matters. Negative edges break the "no better path can exist" argument.',
        '### Deep Dive — Real-World Variants\n- **A\\* search** = Dijkstra + a heuristic `h(v)` estimating remaining distance. Uses `f = g + h` and usually explores far fewer nodes.\n- **Bidirectional Dijkstra** runs forward from source and backward from target, meeting in the middle — a common speedup for road networks.\n- **Landmark / ALT** methods precompute distances to landmarks to get better heuristics.\n- In networking, Dijkstra is the workhorse of **link-state routing** (OSPF, IS-IS), where routers broadcast link states and each computes the full shortest-path tree.',
      ],
      compare: {
        'bellman ford': '### Dijkstra vs Bellman-Ford — side by side\n| Criterion | Dijkstra | Bellman-Ford |\n|---|---|---|\n| Negative weights | Fails | Works |\n| Negative cycle | Can\'t detect | Detects it |\n| Complexity | O((V+E) log V) | O(VE) |\n| Strategy | Greedy, settles closest first | Relax all edges V−1 times |\n| Use cases | Routing, maps | Network with negative edges, cycle detection |\n\n**Rule of thumb:** if all weights ≥ 0, Dijkstra; otherwise Bellman-Ford.',
        'prim': '### Dijkstra vs Prim — side by side\n| Criterion | Dijkstra | Prim (MST) |\n|---|---|---|\n| Output | Shortest paths from one source | Minimum spanning tree |\n| Dist key | dist[source→v] | cheapest edge into tree |\n| Relax rule | dist[u] + w | w (no accumulated distance) |\n| Same complexity | O((V+E) log V) | O((V+E) log V) |\n\n**Memory trick:** Dijkstra *accumulates* distances (dist[u] + w); Prim just compares raw edge weights. They look identical in code — that one line is the whole difference.',
        'generic': 'Choosing the right shortest-path tool:\n- **Dijkstra** — single source, non-negative weights, want speed. Best default.\n- **Bellman-Ford** — negative weights or need negative-cycle detection.\n- **Floyd-Warshall** — all-pairs shortest paths (O(V³), dense graphs).\n- **A\\*** — single pair, when you have a good heuristic.\n\nIn GATE, knowing the complexity of each and their weight restrictions is usually all that is asked.',
      },
      pyq: '### Solved GATE-style PYQ — Dijkstra Trace\n**Question:** Run Dijkstra on the graph with source S. Edges: S→A (4), S→B (1), A→B (2), A→C (6), B→C (4). Find the shortest distance to C.\n\n**Step 1:** dist S=0, A=4, B=1, C=∞. Settle **S**.\n**Step 2:** smallest unsettled = **B (1)**. Relax: A=min(4, 1+2)=**3**, C=1+4=**5**.\n**Step 3:** settle **A (3)**. Relax: C=min(5, 3+6)=**5**.\n**Step 4:** settle **C (5)**.\n\n**Shortest distance S→C = 5** via S → B → C (S→B→A→C would be 3+6=9).\n\n**Method:** always pick the smallest unsettled distance, relax neighbours, and only finalize a node once — this is the entire algorithm, and it appears in GATE almost verbatim.',
      mistakes: '### Common Mistakes on Dijkstra\n1. **Using it with negative edges.** The greedy settles "closest first" and breaks — use Bellman-Ford.\n2. **Re-settling a node.** Once a node is settled its distance is final; updating it later is a logic error (and a hint something is wrong with the weights).\n3. **Forgetting the heap for complexity.** Many GATE options hinge on O((V+E) log V) vs O(V²).\n4. **Missing the tie-break.** Two equal minimums — pick either; don\'t get stuck.\n5. **Confusing with Prim.** Remember: Dijkstra relaxes `dist[u] + w`; Prim uses just `w`.\n6. **Skipping the relaxation step.** The distance to a node can improve multiple times *before* it is settled — only the settled value is final.',
    },
  },
  'tcp': {
    intro: '**TCP (Transmission Control Protocol)** is a reliable, connection-oriented transport-layer protocol that provides ordered, error-checked byte-stream delivery over IP.',
    sections: [
      ['3-Way Handshake', 'Connection setup uses SYN → SYN-ACK → ACK, which synchronizes sequence numbers and confirms both sides can communicate.'],
      ['Reliability', 'TCP uses sequence numbers, ACKs, retransmission on timeout, and checksums to guarantee delivery.'],
      ['Flow & Congestion Control', 'Sliding window, slow start, congestion avoidance, and fast retransmit/recovery manage how much data can be in flight.'],
    ],
    ending: 'TCP delivers reliable, ordered data over unreliable IP using handshakes, ACKs, windows, and congestion control.',
    followups: {
      example: '### Worked Example — 3-Way Handshake with Sequence Numbers\nClient and server each pick an initial sequence number:\n1. Client sends **SYN**, seq = 1000.\n2. Server replies **SYN-ACK**, ack = 1001, seq = 2000.\n3. Client sends **ACK**, ack = 2001.\n\n**What is agreed after this?**\n- Both sides know the connection is open (SYN has been acknowledged).\n- Sequence numbers are synchronized: each side now knows the other\'s initial number.\n- Data transfer can begin: client sends bytes starting at seq 1001, server starts at 2001.\n\n**Why not 2 steps?** The server must both *acknowledge* the client\'s SYN and *initiate* its own SYN — combining them into one SYN-ACK is exactly why it takes 3 messages, not 4.',
      example2: '### Worked Example — Sequence Numbers & ACKs During Transfer\nClient sends 3 segments of 100 bytes each, starting at seq 1000:\n- Segment 1: seq 1000, bytes 1000–1099 → ACK 1100\n- Segment 2: seq 1100, bytes 1100–1199 → ACK 1200\n- Segment 3: seq 1200, bytes 1200–1299 → ACK 1300\n\nThe ACK number always says "next byte I expect". If ACK 1200 arrives, the sender knows everything up to 1199 is safely received and only needs to retransmit from seq 1200.\n\n**Cumulative ACKs** mean a single ACK can cover many lost-and-retransmitted segments — this is how TCP stays reliable over an unreliable IP network.',
      simplified: 'TCP is like a **phone call**, while UDP is like a **letter**:\n- Dial → the other side picks up and says "I hear you" → you confirm "I hear you too" → conversation starts (3-way handshake).\n- Every sentence is confirmed with "got it" (ACK). If someone misses a sentence, you repeat it (retransmission).\n- You take turns so nobody talks over the other (flow control via window).\n- If the line gets crowded, you slow down so you don\'t jam the network (congestion control).\n\nThat is everything TCP does — reliable, ordered, flow-controlled, congestion-aware conversation over the internet.',
      why: 'TCP is a **high-frequency GATE Computer Networks topic** — it shows up in nearly every paper. What examiners test:\n1. **3-way handshake and its states** (SYN, SYN-ACK, ACK, and the 11 TCP states).\n2. **Flow vs congestion control** — window sizing, slow start, congestion avoidance, fast retransmit.\n3. **Retransmission & timeouts** — why ACKs, cumulative ACKs, Karn\'s algorithm.\n4. **TCP vs UDP** — when each is used (HTTP/FTP on TCP; DNS, VoIP, gaming on UDP).\n\nKnow the handshake cold and you\'ve secured the easiest marks in the CN paper.',
      how: 'TCP guarantees reliable delivery in four steps:\n1. **Sequence every byte** — the receiver can detect gaps and reorder segments.\n2. **Acknowledge cumulatively** — ACK n means "I\'ve received everything up to n−1".\n3. **Retransmit on timeout** — a timer (RTO) fires if no ACK arrives; missing segments are resent.\n4. **Window the flow** — the receiver advertises a *receive window* (max in-flight bytes); the sender never exceeds it.\n\nOn top of this, **congestion control** adds a separate *congestion window*: slow start (exponential growth) → congestion avoidance (linear) → cut back on loss. Effective window = min(cwnd, rwnd).',
      more: [
        '### Deep Dive — Flow Control vs Congestion Control\nThese are the two most-confused concepts in TCP:\n- **Flow control** prevents the *sender* from overwhelming the *receiver* — uses the advertised **receive window (rwnd)**, set by the receiver\'s buffer space.\n- **Congestion control** prevents the *network* from being overwhelmed — uses the **congestion window (cwnd)**, maintained by the sender based on detected loss.\n\n**Window in effect = min(cwnd, rwnd).**\n\nIf the receiver advertises rwnd = 0, the sender must pause — a *persist timer* sends periodic probes so the sender learns when the window reopens.',
        '### Deep Dive — Slow Start, Congestion Avoidance, Fast Retransmit\n**Slow start:** cwnd starts at 1 MSS and **doubles every RTT** (exponential). On first loss, cwnd is cut.\n**Congestion avoidance:** after reaching *ssthresh*, cwnd grows **linearly** (+1 MSS per RTT).\n**Fast retransmit:** if the sender gets **3 duplicate ACKs**, it retransmits immediately without waiting for the timeout — this is the classic fast-recovery behavior.\n\n**Typical GATE numerical:** cwnd grows 1 → 2 → 4 → 8 → 16 (slow start), then linearly at 16 → 17 → 18 … A classic question asks "after how many RTTs does cwnd reach 32?" — count the doubling steps carefully.',
        '### Deep Dive — TCP States & Connection Teardown\n**11 TCP states** — the four you must know for GATE:\n- **SYN_SENT** (client after sending SYN), **SYN_RECEIVED** (server after SYN-ACK)\n- **ESTABLISHED** (connection open)\n- **FIN_WAIT_1/2, CLOSE_WAIT, TIME_WAIT, CLOSED** (teardown)\n\n**4-way teardown:**\n1. Client sends **FIN** → 2. Server replies **ACK** → 3. Server sends **FIN** → 4. Client replies **ACK**.\n\n**TIME_WAIT** lasts 2×MSL (max segment lifetime) so the final ACK can be retransmitted if lost — that\'s why you see sockets stuck in TIME_WAIT after closing a connection.',
      ],
      compare: {
        'udp': '### TCP vs UDP — side by side\n| Criterion | TCP | UDP |\n|---|---|---|\n| Connection | Connection-oriented (3-way handshake) | Connectionless |\n| Reliability | Reliable (ACKs, retransmission) | Best-effort, no guarantees |\n| Ordering | Ordered byte stream | Unordered datagrams |\n| Flow/congestion control | Yes | No |\n| Header size | 20–60 bytes | 8 bytes |\n| Use cases | HTTP, FTP, SMTP, SSH | DNS, VoIP, video, games |\n\n**Rule of thumb:** if you need every byte (web pages, email, files) → TCP; if speed/latency matter more than loss (live video, DNS queries) → UDP.',
        'generic': 'How to compare transport protocols for a GATE answer, along three axes:\n1. **Reliability** — does it guarantee delivery/ordering? TCP yes, UDP no.\n2. **Overhead** — connection setup + larger headers + state (TCP) vs minimal (UDP).\n3. **Application fit** — TCP for bulk/file/protocol traffic, UDP for real-time and single-query (DNS).\n\nAlso be ready to compare **TCP vs SCTP** (stream control, multi-homing) for newer questions.',
      },
      pyq: '### Solved GATE-style PYQ — Slow Start\n**Question:** cwnd starts at 1 MSS. The threshold (ssthresh) is 16 MSS. Slow start doubles cwnd each RTT until it reaches ssthresh. How many RTTs to reach cwnd = 32 MSS?\n\n**Slow start (exponential):**\n- RTT 0: cwnd = 1\n- RTT 1: 2\n- RTT 2: 4\n- RTT 3: 8\n- RTT 4: 16 (reaches ssthresh)\n\n**Congestion avoidance (linear):**\n- RTT 5: 17\n- RTT 6: 18\n- RTT 7: 19\n- RTT 8: 20\n- RTT 9: 21\n- RTT 10: 22\n- RTT 11: 23\n- RTT 12: 24\n- RTT 13: 25\n- RTT 14: 26\n- RTT 15: 27\n- RTT 16: 28\n- RTT 17: 29\n- RTT 18: 30\n- RTT 19: 31\n- RTT 20: 32\n\n**Answer: 20 RTTs.**\n\n**Method:** double until ssthresh, then add 1 per RTT. Trace the sequence on paper — that is all this question ever asks.',
      mistakes: '### Common Mistakes on TCP\n1. **Confusing flow with congestion control.** Flow = sender vs receiver buffer (rwnd). Congestion = sender vs network (cwnd).\n2. **Wrong ACK semantics.** ACK n = "all bytes up to n−1 received". A cumulative ACK doesn\'t acknowledge n itself.\n3. **Counting handshake steps wrong.** It is exactly 3 messages (SYN, SYN-ACK, ACK) — not 2, not 4.\n4. **Forgetting the 3-duplicate-ACK trigger** for fast retransmit — it happens *before* the timeout, not after.\n5. **Saying UDP has no checksum.** It does (optional in IPv4, mandatory in IPv6) — it just doesn\'t do flow/congestion control.\n6. **Wrong TIME_WAIT duration.** 2×MSL, not 1×MSL, and it is the *active closer* that enters TIME_WAIT.',
    },
  },
  'normalization': {
    intro: '**Normalization** is the process of organizing a relational database to reduce redundancy and eliminate anomalies (insert, update, delete) by decomposing tables based on functional dependencies.',
    sections: [
      ['1NF', 'Atomic values — no repeating groups or multi-valued attributes.'],
      ['2NF', '1NF + no partial dependency (no non-key attribute depends on part of a composite key).'],
      ['3NF', '2NF + no transitive dependency (non-key attributes depend only on the key).'],
      ['BCNF', 'Every determinant is a candidate key. Stronger than 3NF.'],
    ],
    ending: 'Normalization moves data through 1NF → 2NF → 3NF → BCNF, each step removing more redundancy and dependency anomalies.',
    followups: {
      example: '### Worked Example — 2NF (Partial Dependency)\nTable: **Enrollment(StudentID, CourseID, StudentName, Grade)**\n\nKey = (StudentID, CourseID). Now:\n- StudentName depends **only** on StudentID — a **partial dependency** on part of the composite key → violates 2NF.\n\n**Fix — decompose:**\n- **Students(StudentID, StudentName)**\n- **Enrollments(StudentID, CourseID, Grade)**\n\nNow every non-key attribute depends on the whole key. This removes update anomalies (renaming a student no longer requires touching every enrollment row).',
      example2: '### Worked Example — 3NF (Transitive Dependency)\nTable: **Employee(EmpID, DeptID, DeptName)**\n\n- EmpID → DeptID (functional dependency)\n- DeptID → DeptName (functional dependency)\n- Therefore EmpID → DeptName **transitively** → violates 3NF.\n\n**Fix — decompose:**\n- **Employee(EmpID, DeptID)**\n- **Department(DeptID, DeptName)**\n\nNow DeptName depends only on the key of its own table. This eliminates the *update anomaly* where renaming a department would require editing every employee row.\n\n**Rule of thumb:** 3NF = "no non-key attribute depends on a non-key attribute."',
      simplified: 'Normalization is like **tidying a messy spreadsheet** into clean reference tables:\n- Put every fact **once** in exactly one place (no repeated names or addresses).\n- Each table answers one question.\n- Changing a fact in one place updates the whole system (no duplicate copies to keep in sync).\n\nThe normal forms are checkpoints of increasing tidiness: 1NF = atomic cells, 2NF = no partial dependence, 3NF = no hidden dependencies, BCNF = every rule comes from a key.',
      why: 'Normalization is a **near-certain GATE DBMS question**. The two most common asks:\n1. **Given FDs, find the highest normal form** of a relation.\n2. **Decompose a relation losslessly** into BCNF/3NF.\n\nExaminers also test the definitions: the difference between 2NF and 3NF, why BCNF is stricter, and *lossless join* vs *dependency preservation*. Master "candidate keys → partial → transitive → determinants" and you can solve any of them.',
      how: 'To find the highest normal form, run this checklist:\n1. **Find the candidate keys** from the functional dependencies (closure method).\n2. **1NF** — are all values atomic? (assumed unless stated otherwise).\n3. **2NF** — any non-key attribute depending on *part* of a composite key? (partial dependency)\n4. **3NF** — any non-key attribute depending on *another non-key* attribute? (transitive dependency)\n5. **BCNF** — is *every determinant* a candidate key?\n\n**Lossless decomposition** means the natural join of the parts gives back exactly the original rows — the shared attribute must be a key in at least one part.',
      more: [
        '### Deep Dive — Candidate Keys & Closure\nThe **closure X⁺** of an attribute set X is everything X determines. Algorithm:\n1. Start with X⁺ = X.\n2. Repeat: for each FD `A → B`, if A ⊆ X⁺, add B to X⁺.\n3. Stop when no more attributes are added.\n\n**Example:** R(A,B,C,D), FDs: A→B, B→C, C→D.\n- A⁺ = A, then +B (A→B), then +C (B→C), then +D (C→D) → **A⁺ = {A,B,C,D}**, so A is a candidate key.\n- Since each B, C, D also determine the next, we have transitive dependencies (A→C via B) → highest normal form is **2NF only**.\n\nGetting the closure right is the foundation for every normal-form question.',
        '### Deep Dive — Lossless Join & Dependency Preservation\n**Lossless join decomposition:** joining the decomposed tables must reproduce the original table exactly.\n\n**Test (for 2-way decomposition):** if R = R1 ⋈ R2, the decomposition is lossless if R1 ∩ R2 is a **key of R1 or R2**.\n\n**Example:** R(A,B,C), FDs: A→B, A→C. Decompose into R1(A,B) and R2(A,C). Intersection = {A}, and A is a key of both → **lossless**.\n\n**Dependency preservation:** every FD must be checkable within a single table after decomposition. Sometimes you must choose between the two (a classic result: **there exist relations that can\'t be decomposed into BCNF while preserving all FDs — hence 3NF is the practical target**).',
        '### Deep Dive — 4NF & Higher\nBeyond BCNF lie **multi-valued dependencies (MVDs)** and 4NF:\n- An MVD `A →→ B` means B has an independent set of values for each A.\n- **4NF** = every non-trivial MVD has a superkey as its left side.\n\n**Example:** a teacher teaches multiple subjects and multiple courses per semester. The pairs (subject, course) multiply independently — storing them in one table forces duplicate rows. 4NF decomposes it into two tables.\n\nFor GATE, 4NF appears rarely, but knowing its name and the MVD concept covers 99% of questions.',
      ],
      compare: {
        '3nf': '### 3NF vs BCNF — side by side\n| Criterion | 3NF | BCNF |\n|---|---|---|\n| Rule | No transitive dependency | Every determinant is a key |\n| Stricter? | Baseline | Stricter (subset of 3NF) |\n| Always achievable with FD preservation? | Yes | Not always |\n| Example violation | Non-key → non-key | Non-key determinant |\n\n**Classic fact:** BCNF ⊆ 3NF. If a relation is BCNF it is automatically 3NF, but not vice versa.',
        '2nf': '### 2NF vs 3NF — side by side\n| Criterion | 2NF | 3NF |\n|---|---|---|\n| Removes | Partial dependency (on part of key) | Transitive dependency (via non-key) |\n| Requirement | All non-key attrs depend on whole key | No non-key attr depends on a non-key attr |\n| Typical violation | Composite key, attribute tied to one part | Column derived from another non-key column |\n\n**Memory hook:** 2NF fixes *partial*, 3NF fixes *transitive*. A relation can be 2NF but not 3NF (the Employee example).',
        'generic': 'Normal forms, from weakest to strongest:\n- **1NF** — atomic values, no repeating groups.\n- **2NF** — 1NF + no partial dependency on a composite key.\n- **3NF** — 2NF + no transitive dependency.\n- **BCNF** — every determinant is a candidate key.\n\n**Comparison method for GATE:** given FDs, always (1) find candidate keys, (2) check partial, (3) check transitive, (4) check every determinant — the first failing test gives the highest normal form.',
      },
      pyq: '### Solved GATE-style PYQ — Highest Normal Form\n**Question:** R(A, B, C, D) with FDs: AB → C, C → D. What is the highest normal form of R?\n\n**Step 1 — candidate keys:**\n- (AB)⁺ = {A,B,C,D} → **AB is a candidate key** (AB→C, C→D).\n- Is A alone a key? A⁺ = {A}. No. Is B? No. So **only candidate key = AB**.\n\n**Step 2 — check normal forms:**\n- **1NF:** atomic ✓\n- **2NF:** non-key attributes are C, D. C depends on AB (whole key), not part of it. D depends on C. No partial dependency ✓ → 2NF.\n- **3NF:** D depends on C (a non-key attribute) — **transitive dependency** → violates 3NF.\n\n**Answer: R is in 2NF (not 3NF).**\n\n**Method:** always find the candidate key(s) first, then test partial then transitive — this exact pattern is a recurring GATE question.',
      mistakes: '### Common Mistakes on Normalization\n1. **Skipping the candidate-key step.** You cannot test 2NF/3NF without knowing the keys — it is the #1 cause of wrong answers.\n2. **Calling any FD a "transitive dependency".** It is transitive only if it flows *through a non-key attribute*. A→B with B a non-key and A a key is normal.\n3. **Thinking BCNF requires no transitive dependencies.** BCNF is about *every determinant being a key*, not about transitivity — different rule.\n4. **Forgetting the "non-key" qualifier.** A partial dependency is a non-key attribute on *part of a composite key* — an attribute on the full key is fine.\n5. **Assuming decomposition is always lossless.** Check that the shared attribute is a key in one part; otherwise you may lose rows on join.\n6. **Mixed-up "dependency preservation" and "lossless join".** Preservation = FDs still checkable; lossless = rows reconstructable. A decomposition can satisfy one but not the other.',
    },
  },
  'binary search': {
    intro: '**Binary search** finds a target in a sorted array by repeatedly dividing the search interval in half. It runs in **O(log n)** time.',
    sections: [
      ['How It Works', 'Compare the target with the middle element. If equal, done. If smaller, search the left half; if larger, search the right half. Repeat until the interval is empty.'],
      ['Complexity', 'Each step halves the array, so at most **⌊log₂ n⌋ + 1** comparisons — hence **O(log n)** time and **O(1)** space (iterative).'],
      ['Requirements', 'The array must be **sorted** and support O(1) random access (an array). Linked lists are unsuitable.'],
    ],
    ending: 'Binary search is the canonical logarithmic algorithm: O(log n) time, requiring a sorted, randomly-accessible array.',
    followups: {
      example: '### Worked Example — Step-by-Step Trace\nArray: [2, 5, 8, 12, 16, 23, 38], target = 23.\n\n| Step | lo | hi | mid | Value | Action |\n|---|---|---|---|---|---|\n| 1 | 0 | 6 | 3 | 12 | 23 > 12 → search right |\n| 2 | 4 | 6 | 5 | 23 | Found! |\n\nOnly **2 comparisons** for 7 elements (theoretically at most ⌊log₂7⌋+1 = 3).\n\n**Try a miss:** target = 10:\n- mid=3 (12): 10 < 12 → left half [2,5,8]\n- mid=1 (5): 10 > 5 → right half [8]\n- mid=2 (8): 10 > 8 → lo > hi → **not found**.\n\nEach miss still halves the search space — that is where O(log n) comes from.',
      example2: '### Worked Example — Binary Search on an Answer Space\nBinary search is not just for arrays — it can search a *range of values* when the predicate is monotonic.\n\n**Example:** find the smallest x such that x² ≥ 30.\n- Range [0, 30]. mid = 15 → 225 ≥ 30 → answer ≤ 15.\n- Range [0, 15]. mid = 7 → 49 ≥ 30 → answer ≤ 7.\n- Range [0, 7]. mid = 3 → 9 < 30 → answer > 3.\n- Range [4, 7]. mid = 5 → 25 < 30 → answer > 5.\n- Range [6, 7]. mid = 6 → 36 ≥ 30 → answer ≤ 6.\n- Range [6, 6] → **answer = 6**.\n\nThis "binary search on the answer" pattern is how problems like "minimum possible maximum" are solved.',
      simplified: 'Binary search is like **finding a word in a dictionary**: open to the middle, see if your word is before or after it, and discard the wrong half. Repeat until you find it — you never check every page.\n\nEach step **cuts the remaining pages in half**. So even for a million pages, you need only about 20 checks. That is the magic of O(log n).',
      why: 'Binary search is **THE classic GATE Algorithms question** — its time complexity is asked constantly, and it underpins divide-and-conquer reasoning. Examiners test:\n1. **Complexity**: O(log n) time, O(1) space.\n2. **The recurrence**: T(n) = T(n/2) + O(1).\n3. **Why it fails** on linked lists and unsorted arrays.\n4. **Variants**: finding first/last occurrence of a duplicate, searching rotated sorted arrays.\n\nMaster the basics and the variants, and this topic becomes guaranteed marks.',
      how: 'Binary search works because the array is sorted — the **invariant** is that the target, if present, lies within [lo, hi]:\n1. Compute mid = ⌊(lo + hi) / 2⌋.\n2. If arr[mid] == target → found.\n3. If target < arr[mid] → the target must be left, so hi = mid − 1.\n4. Else → lo = mid + 1.\n5. Repeat while lo ≤ hi; if the loop ends, the target is absent.\n\nThe recurrence is T(n) = T(n/2) + O(1), which the Master Theorem solves to **O(log n)** — at most ⌊log₂ n⌋ + 1 comparisons.',
      more: [
        '### Deep Dive — Correctness & Why the Loop Ends\nBinary search terminates because each iteration **strictly shrinks the interval**:\n- If target < arr[mid], then hi = mid − 1 < old hi.\n- If target > arr[mid], then lo = mid + 1 > old lo.\n- The interval [lo, hi] strictly narrows, so eventually lo > hi.\n\n**Watch for the classic bug:** computing mid as (lo + hi) / 2 can overflow for huge integers. Use lo + (hi − lo) / 2. GATE sometimes tests exactly this in code-reading questions.',
        '### Deep Dive — First/Last Occurrence & Rotated Arrays\n**First occurrence of a duplicate:** when you find arr[mid] == target, don\'t return — keep searching left (hi = mid − 1) to find the earliest index. Similarly, search right for the last occurrence.\n\n**Search in a rotated sorted array** (e.g., [4,5,6,7,0,1,2]):\n- One half is always sorted. Check which half contains the target, narrow into it, and repeat.\n\n**Median of two sorted arrays** is a classic hard variant that still runs in O(log(min(m,n))) via binary search — a favorite for interviews and advanced GATE questions.',
        '### Deep Dive — Lower Bound & Applications\nBinary search appears inside many algorithms:\n- **Lower bound in O(log n)**: the standard library functions (`lower_bound` in C++, `bisect` in Python) find the first position ≥ a value.\n- **Searching sorted data structures**: balanced BSTs (AVL, red-black) are effectively binary search over tree heights — O(log n).\n- **Real systems**: indexing (B-trees generalize binary search over disk blocks), and **divide-and-conquer algorithms** like merge sort build on the same halving idea.\n\nEvery time you halve the search space per step, you get logarithmic behavior — recognizing the pattern lets you solve novel problems fast.',
      ],
      compare: {
        'linear search': '### Binary vs Linear Search — side by side\n| Criterion | Binary Search | Linear Search |\n|---|---|---|\n| Time | O(log n) | O(n) |\n| Space | O(1) | O(1) |\n| Requires sorted? | Yes | No |\n| Data structure | Random access (array) | Any (incl. linked list) |\n| Best when | Large, static, sorted data | Small or unsorted data |\n\n**Takeaway:** binary search wins by a huge margin on large sorted arrays (1M elements → ~20 vs ~500k checks), but needs the array sorted first (which itself costs O(n log n) once).',
        'generic': 'Compare binary search variants along **what you search for**:\n- Standard: exact target in a sorted array → O(log n).\n- First/last occurrence: same O(log n), but don\'t return on match — keep narrowing.\n- Rotated array: still O(log n) by finding the sorted half.\n- Answer-space search (predicate): O(log R) where R is the range of possible answers.\n\nAll share the same core: **a monotonic property lets you discard half the space each step.**',
      },
      pyq: '### Solved GATE-style PYQ — Number of Comparisons\n**Question:** An array of 1024 elements is sorted. How many comparisons does binary search make in the worst case to find a target?\n\n**Formula:** at most ⌊log₂ n⌋ + 1 comparisons.\n\n- n = 1024 = 2¹⁰ → ⌊log₂ 1024⌋ + 1 = 10 + 1 = **11 comparisons**.\n\n**Verification with the recurrence:** T(n) = T(n/2) + 1, T(1) = 1.\n- T(1024) = T(512) + 1 = T(256) + 2 = … = T(1) + 10 = **11**.\n\n**Answer: 11.**\n\n**Method:** worst-case comparisons = ⌊log₂ n⌋ + 1. This exact question (with n = 2ᵏ) appears in GATE regularly — memorise the formula.',
      mistakes: '### Common Mistakes on Binary Search\n1. **Using it on an unsorted array.** The invariant depends on sorting — binary search on unsorted data returns garbage.\n2. **Using it on a linked list.** O(log n) assumes O(1) random access; a linked list forces O(n) traversal per mid lookup → effectively O(n log n).\n3. **Integer overflow in mid.** `(lo + hi) / 2` can overflow for large n — use `lo + (hi − lo) / 2`.\n4. **Off-by-one on the loop.** `lo ≤ hi` vs `lo < hi` changes which elements are considered; with duplicates this determines first vs last occurrence.\n5. **Wrong complexity answer.** It is O(log n) *comparisons* — never O(n), and only O(1) space for the iterative version.\n6. **Forgetting the sorted requirement when asked "why doesn\'t it work?"** The most common GATE follow-up: binary search needs sorted + random access.',
    },
  },
};

// Merge the extra KB into AUTO_KNOWLEDGE_BASE for single-lookup use.
for (const [key, val] of Object.entries(OFFLINE_EXTRA_KB)) {
  AUTO_KNOWLEDGE_BASE[key] = { ...AUTO_KNOWLEDGE_BASE[key], ...val };
}

function autoFallbackAnswer(message, context) {
  const lower = message.toLowerCase();

  // 1) Follow-up intent → reference the conversation's previous topic.
  const followUp = detectFollowUpIntent(lower);
  const convo = getOfflineConvo(context?.conversationId || context?.sessionId || null);
  if (convo && !convo.topic) {
    seedOfflineConvoFromHistory(convo, context?.history);
  }

  if (followUp) {
    if (convo?.topic) {
      const text = buildFollowUpText(followUp.intent, convo.topic, followUp.target, convo);
      if (text) {
        convo.lastText = text;
        convo.history.push({ role: 'assistant', content: text });
        if (convo.history.length > 8) convo.history.shift();
        return { text, suggestions: ['Explain more', 'Give an example', 'Why does this matter?'], source: 'heuristic' };
      }
    }
    // Follow-up but no previous topic / no content for it.
    return {
      text: "I'd love to continue that thought, but I don't have the previous topic in context right now (offline mode keeps only the last few messages). Could you restate the topic? For example, ask 'Explain CPU scheduling' and then I can go deeper.",
      suggestions: ['Explain CPU scheduling', 'What is deadlock?', 'Explain Dijkstra'],
      source: 'heuristic',
    };
  }

  // 2) New topic → full knowledge-base answer.
  const topic = detectOfflineTopic(lower);
  const entry = topic ? AUTO_KNOWLEDGE_BASE[topic] : null;
  if (entry) {
    let text = entry.intro;
    for (const [heading, body] of entry.sections) {
      text += `\n\n## ${heading}\n\n${body}`;
    }
    text += `\n\n${entry.ending}`;
    if (convo) {
      convo.topic = topic;
      convo.lastText = text;
      convo.history.push({ role: 'user', content: message });
      convo.history.push({ role: 'assistant', content: text });
      if (convo.history.length > 8) convo.history.splice(0, convo.history.length - 8);
    }
    return {
      text,
      suggestions: ['Explain more', 'Give an example', 'Why does this matter?', 'Simplify it'],
      source: 'heuristic',
    };
  }

  // 3) Unknown topic → honest "insufficient info", not a canned echo.
  return {
    text: "I'm in offline mode and don't have a detailed entry for that topic. I can go deep on CPU scheduling, deadlock, Dijkstra, TCP, DBMS normalization, binary search, operating systems, databases, virtual memory, recursion, and compilers — or I can switch to coach mode for study advice. Which would help?",
    suggestions: ['Explain CPU scheduling', 'Explain deadlock', 'Explain Dijkstra'],
    source: 'heuristic',
  };
}

function buildLocalFallback(message, context, mode = 'auto', fallbackReason = null) {
  // Honest offline notice: state why Live AI is unavailable and what is missing.
  // Never pretend this is a live model or claim personalized analysis was performed.
  const reasonText = fallbackReason || lastAiError || 'The Live AI service could not be reached.';
  const offlineInfo = lastAiMeta || {
    provider: null,
    model: null,
    status: null,
    reason: reasonText,
    detail: null,
    ts: new Date().toISOString(),
  };

  // Conversation state is shared across modes for follow-up continuity.
  const convoKey = context?.conversationId || context?.sessionId || null;
  const convo = getOfflineConvo(convoKey);
  if (convo && !convo.topic) {
    seedOfflineConvoFromHistory(convo, context?.history);
  }

  // Follow-ups apply to coach/learning too: check intent first.
  const followUp = detectFollowUpIntent(message.toLowerCase());
  if (followUp && convo?.topic) {
    const text = buildFollowUpText(followUp.intent, convo.topic, followUp.target, convo);
    if (text) {
      convo.lastText = text;
      convo.history.push({ role: 'assistant', content: text });
      if (convo.history.length > 8) convo.history.shift();
      return { text, suggestions: ['Explain more', 'Give an example', 'Why does this matter?'], source: 'heuristic', offlineInfo };
    }
  }

  if (mode === 'coach') {
    const resp = localCoachResponse(message, context);
    if (convo) { convo.history.push({ role: 'user', content: message }); convo.history.push({ role: 'assistant', content: resp.text }); if (convo.history.length > 8) convo.history.splice(0, convo.history.length - 8); }
    return { text: resp.text, suggestions: resp.suggestions, source: 'heuristic', offlineInfo };
  }
  if (mode === 'learning') {
    const resp = localCoachResponse(message, context);
    if (convo) { convo.history.push({ role: 'user', content: message }); convo.history.push({ role: 'assistant', content: resp.text }); if (convo.history.length > 8) convo.history.splice(0, convo.history.length - 8); }
    return {
      text: `📖 **Concept**\n${resp.text.split('\n')[0] || resp.text}\n\n💡 **Explanation**\n${resp.text}\n\n📝 **Quick Summary**\n- Understand the core idea first.\n- Practice PYQs to reinforce.\n- Revise periodically to retain.`,
      suggestions: resp.suggestions || ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"],
      source: 'heuristic',
      offlineInfo,
    };
  }
  const autoResp = autoFallbackAnswer(message, context);
  autoResp.offlineInfo = offlineInfo;
  return autoResp;
}

async function getAiCoachResponse(message, context, user, modePrompt, onToken) {
  console.log('[AI Coach] Starting getAiCoachResponse');
  console.log('[AI Coach] User message:', message);
  context = context || {};

  // Active mode must be available to both the API path and the local fallback.
  const activeMode = context?.mode || 'auto';

  // Log API key presence (not the actual key!)
  console.log('[AI Coach] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('[AI Coach] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
  console.log('[AI Coach] OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
  console.log('[AI Coach] DASHSCOPE_API_KEY present:', !!process.env.DASHSCOPE_API_KEY);

try {
    lastAiError = null; // Clear stale errors at start of each request
    lastAiMeta = null;
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (apiKey) {
      console.log('[AI Coach] API key found, calling AI...');
      lastAiError = null;
      lastAiMeta = null;
      // Use frontend-provided modePrompt if available, otherwise fall back to a
      // mode-aware default. Mode separation is strict:
      //   auto     -> generic AI, answers only the question, NO student context
      //   learning -> structured teaching format, NO student-specific coaching
      //   coach    -> the ONLY mode that injects the student profile
      const frontendPrompt = modePrompt || context?.modePrompt || null;

      const studentContextBlock = `## Student Context
- Name: ${context.name || 'Student'}
- Overall progress: ${context.overallProgress || 0}%
- Mock average: ${context.mockAvg || 0}%
- Weak subjects: ${(context.weakSubjects || []).join(', ') || 'none identified'}
- Strong subjects: ${(context.strongSubjects || []).join(', ') || 'none identified'}
- Weak topics: ${(context.weakTopics || []).slice(0, 3).join(', ') || 'none identified'}
- Study streak: ${context.streak || 0} days
- Overdue revisions: ${context.overdueTopics || 0}
- Recent accuracy: ${context.recentAccuracy || 0}%
- Study hours today: ${context.studyHoursToday || 0}h
- Daily target: ${context.dailyTargetHours || 8}h
- Roadmap stage: ${context.roadmap?.currentStageLabel || 'Foundation'} (${context.roadmap?.completion || context.overallProgress || 0}% complete)
- Next milestone: ${context.roadmap?.nextMilestone || 'Continue current stage'}
- Today's journey: ${(context.journey?.steps || []).slice(0, 3).map(s => s.title).join(' → ') || 'Focus on core subjects'}
- Top recommendation: ${context.recommendations?.[0]?.title || 'Master core subjects'}
- Predicted score: ${context.prediction?.expectedScore ?? 'not yet'} (AIR ~${context.prediction?.air ?? 'n/a'})`;

      const autoPrompt = `You are an intelligent, knowledgeable general-purpose AI assistant (like ChatGPT, Claude, or Gemini). You help the user understand topics thoroughly.

HOW TO ANSWER:
- Answer the user's question COMPLETELY and deeply before anything else. Do not stop at a shallow summary.
- Structure long answers with headings, bullet points, definitions, analogies, examples, and comparisons where appropriate.
- Explain the topic comprehensively from the foundations up (e.g., for "What is OS?" cover: definition, purpose, components, types, how it works, real-world examples, key concepts) — A to Z.
- Adjust depth to the question: broad questions get broad, thorough coverage; narrow questions get precise, focused depth.
- Use clear, natural, well-organized prose. Be precise and technically accurate.
- If the answer is naturally complete, stop there — do not pad it.

STRICT RULES:
- Do NOT mention the user's study progress, weak topics, roadmap, study plan, mock scores, analytics, or streak.
- Do NOT give coaching advice or recommend next subjects/topics unless the user explicitly asks for guidance.
- Do NOT personalize the answer with student data.
- Do NOT bring up GATE relevance unless the user asks or it is a natural, brief aside AFTER fully answering.`;

      const learningPrompt = `You are a GATE CSE tutor. Teach the topic the user asks about in a structured educational format.

Format your response with ALL of these sections (exact headings):
📖 **Concept**
💡 **Explanation**
🎯 **Why It Matters**
📍 **Example**
⚠️ **Common Mistakes**
✍️ **Practice Questions**
📝 **Quick Summary**
🔜 **Next Topic**

Rules:
- Focus ONLY on teaching the topic. Do NOT reference the student's progress or study plan.
- Technically accurate, beginner-friendly, GATE-relevant.`;

      const coachPrompt = `You are a personal GATE coach. Direct, motivating, personalized.

${studentContextBlock}

COACHING RULES:
1. Reference the student's actual progress data above — never generic advice.
2. Recommend a concrete next step tied to their weak areas.
3. Give time estimates (e.g., "Spend 20 minutes on deadlock prevention").
4. Recommend specific PYQs or topics to practice.
5. Keep it concise — 4-6 sentences max.`;

      const modeDefaults = { auto: autoPrompt, learning: learningPrompt, coach: coachPrompt };
      const defaultSystemPrompt = modeDefaults[activeMode] || autoPrompt;

      const systemPrompt = frontendPrompt || defaultSystemPrompt;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(context.history) ? context.history.slice(-6) : []),
        { role: 'user', content: message },
      ];

      const opts = { max_tokens: 900, temperature: 0.7 };
      let streamedText = null;
      let provider = null;
      if (typeof onToken === 'function') {
        const res = await streamAiApi(messages, opts, onToken);
        streamedText = res?.text ?? null;
        provider = res?.provider ?? null;
      } else {
        const text = await callAiApi(messages, opts);
        streamedText = text;
        provider = lastProviderUsed || null;
      }

      console.log('[AI Coach] AI returned:', streamedText?.substring(0, 100));

      if (streamedText) {
        const lower = streamedText.toLowerCase();
        const generic = ['i am an ai', 'i cannot', "i don't have access", 'as an ai', 'i apologize'];
        if (!generic.some(g => lower.includes(g))) {
          console.log('[AI Coach] Returning real AI response');
          lastAiError = null;
          return { text: streamedText, suggestions: ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"], source: 'ai', provider: provider || lastProviderUsed || 'AI' };
        } else {
          console.log('[AI Coach] AI response contained generic phrases');
          lastAiError = 'AI returned generic response';
        }
      } else {
        console.log('[AI Coach] AI returned null/empty, keep lastAiError set by AI caller');
      }
    } else {
      console.log('[AI Coach] No API key found');
      lastAiError = 'No OpenAI API key configured';
    }
  } catch (e) {
    console.error('[AI Coach] API call failed:', e.message);
    if (!lastAiError) {
      lastAiError = 'The AI service is temporarily unavailable. Please try again later.';
    }
  }

  // STRICT online-only: never answer from a local heuristic / offline fallback.
  // If the external AI failed, surface an error so the UI shows a real failure
  // instead of a fabricated offline answer (product requirement).
  console.log('[AI Coach] External AI unavailable:', lastAiError, '— returning explicit error (no offline fallback)');
  return {
    text: null,
    offlineError: lastAiError,
    suggestions: ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"],
    source: 'error',
    provider: lastProviderUsed || null,
    offlineInfo: lastAiMeta || null,
  };
}

async function buildGptAnalysis(data) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a GATE CSE 2027 AI Mentor. Analyze the following student data and return a JSON object.

Return EXACTLY this JSON structure (no markdown, no extra text):
{
  "recommendations": [
    { "type": "next_study", "title": "...", "content": "...", "action": "/topics" },
    { "type": "plan", "title": "...", "content": "...", "action": "/dashboard" }
  ],
  "analysis": {
    "scores": { "mentor": 0-100, "readiness": 0-100, "consistency": 0-100, "revisionHealth": 0-100, "mockPerformance": 0-100 },
    "predictions": { "score": 0-100, "rank": 0, "admissions": "..." },
    "riskLevel": "Low|Medium|High"
  }
}

Data:
- Subjects: ${JSON.stringify(data.subjects?.map(s => ({ name: s.name, progress: s.progress })) || [])}
- Recent Mocks: ${JSON.stringify(data.mocks?.slice(-5) || [])}
- Streak: ${data.gateFeatures?.streak?.current || 0}
- Total Progress: ${data.overall?.percentage || 0}%
- Study Hours (Mon-Sun): ${JSON.stringify(data.studyStats?.weeklyHours || [])}

Categories to cover: next_study, revision, weak_area, mock_test, insight, health, readiness, plan, mistake_analysis.
Provide specific, motivating, GATE-focused advice.`;

  const messages = [
    { role: 'system', content: 'You output only valid JSON for GATE mentorship analysis.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { max_tokens: 2000, response_format: { type: 'json_object' } });
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('buildGptAnalysis error:', e.message);
    return null;
  }
}

// ─── Doubt Solver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───

const DOUBT_SUBJECTS = ['AL', 'DS', 'DB', 'OS', 'CN', 'CO', 'TOC', 'CD', 'DL', 'EM', 'APT'];

function buildHeuristicDoubtResponse(doubt, subject, topic) {
  const subj = subject || 'Computer Science';
  const topicStr = topic || 'general';

  const explanation = `Let's break down this ${subj} doubt step by step.

This question relates to ${topicStr} in ${subj}. The key concept here involves understanding the fundamental principles that govern this topic.

**Core Idea:**
In ${subj}, ${topicStr} deals with the interaction between theoretical concepts and practical implementation. The solution approach depends on identifying the right principle to apply.

**Why this matters for GATE:**
Questions on ${topicStr} appear frequently in GATE CSE papers (typically 2-3 questions worth 4-6 marks). Mastering this will boost your score significantly.`;

  const steps = [
    { title: 'Identify the Core Concept', content: `Read the problem carefully to identify which core concept in ${topicStr} it tests. Look for keywords and patterns.` },
    { title: 'Recall Key Principles', content: `Recall the fundamental theorems and properties related to this topic. Write down any formulas that might apply.` },
    { title: 'Apply Step-by-Step', content: `Work through the problem methodically. Start with what you know and build toward the solution.` },
    { title: 'Verify Your Answer', content: `Check your solution against known edge cases. Does it hold for all inputs? Are there any assumptions you made that could be invalid?` },
  ];

  const keyTakeaways = [
    `Focus on understanding the "why" behind ${topicStr} — GATE rewards conceptual clarity over rote memorization.`,
    `Practice at least 10-15 PYQs on this topic to solidify the approach.`,
    `Create a one-page formula sheet for ${topicStr} covering all key results.`,
  ];

  const answers = [
    { q: `What are the prerequisites for ${topicStr}?`, a: `Strong understanding of basic ${subj} concepts, mathematical foundations, and problem-solving skills.` },
    { q: `Common mistakes in ${topicStr}`, a: `Students often confuse similar-looking concepts. Always draw diagrams/tables to compare and contrast.` },
    { q: `Best resources for ${topicStr}`, a: `Standard textbooks, NPTEL lectures, and previous year GATE questions are your best bet.` },
  ];

  const relatedTopics = [
    { name: `${topicStr} — Advanced`, description: `Deep dive into advanced concepts` },
    { name: `${topicStr} PYQs`, description: `Practice previous year questions` },
    { name: `Formula Sheet`, description: `Quick reference for ${topicStr}` },
  ];

  return { explanation, steps, keyTakeaways, answers, relatedTopics, confidence: 'medium' };
}

async function buildAiDoubtResponse(doubt, subject, topic) {
  const subj = subject || 'Computer Science';
  const topicStr = topic || 'general';

  const prompt = `You are a GATE CSE expert tutor. A student has a doubt about "${doubt}" in the subject "${subj}" (topic: "${topicStr}").

Provide a comprehensive, structured response as a JSON object (no markdown, no extra text):

{
  "explanation": "A clear, detailed explanation of the concept and the doubt. Use markdown for formatting, include examples.",
  "steps": [
    { "title": "Step 1 name", "content": "Detailed instruction for step 1" },
    { "title": "Step 2 name", "content": "Detailed instruction for step 2" }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "answers": [
    { "q": "Follow-up question 1", "a": "Answer 1" },
    { "q": "Follow-up question 2", "a": "Answer 2" }
  ],
  "relatedTopics": [
    { "name": "Topic name", "description": "Brief description" }
  ]
}

Make it highly specific to the student's doubt and GATE CSE. Include concrete examples, formulas, and GATE-level insights. The explanation should be thorough but accessible. Target 3-5 steps.`;

  const messages = [
    { role: 'system', content: 'You are a GATE CSE expert tutor. Output only valid JSON.' },
    { role: 'user', content: prompt },
  ];

  try {
    const text = await callAiApi(messages, { max_tokens: 2500, temperature: 0.5, response_format: { type: 'json_object' } });
    if (!text) return null;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('AI Doubt Solver Error:', e.message);
    return null;
  }
}

router.post('/doubt-solver', validateFields([
  { name: 'doubt', type: 'string', required: true, min: 3, max: 2000 },
]), async (req, res, next) => {
  const doubtStart = Date.now();
  try {
    const { doubt, subject, topic } = req.body;

    let response;
    let source = 'heuristic';
    let aiError = null;

    try {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        aiError = 'No AI API key configured. Using expert-crafted explanations instead.';
      } else {
        response = await buildAiDoubtResponse(doubt.trim(), subject, topic);
        if (response?.explanation) {
          source = 'ai';
        } else {
          aiError = 'AI returned empty response. Using expert-crafted explanation.';
        }
      }
    } catch (e) {
      aiError = `AI request failed: ${e.message}. Using expert-crafted explanation.`;
    }

    if (!response?.explanation) {
      response = buildHeuristicDoubtResponse(doubt.trim(), subject, topic);
    }

    aiUsage.increment(true, Date.now() - doubtStart);
    await incrementAiUsage(req.user?._id?.toString());
    res.json({ success: true, data: { ...response, source, aiError, doubt } });
  } catch (e) {
    aiUsage.increment(false, Date.now() - doubtStart);
    next(e);
  }
});

// ─── Subject list for doubt solver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€───
router.get('/doubt-subjects', (req, res, next) => {
  try {
    res.json({ success: true, data: DOUBT_SUBJECTS });
  } catch (e) { next(e); }
});

// ─── Conversation History ──────────────────────────────────────────
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.json({ success: true, data: [] });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const conversations = await Conversation.find({ user: userId, isArchived: false })
      .sort({ lastMessageAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Conversation.countDocuments({ user: userId, isArchived: false });
    res.json({
      success: true,
      data: { conversations, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (e) { next(e); }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.json({ success: true, data: [] });
    const conv = await Conversation.findOne({ _id: req.params.id, user: userId });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversation: conv._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Message.countDocuments({ conversation: conv._id });
    res.json({
      success: true,
      data: { messages: messages.reverse(), total, page, pages: Math.ceil(total / limit) },
    });
  } catch (e) { next(e); }
});

router.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const conv = await Conversation.findOne({ _id: req.params.id, user: userId });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    conv.isArchived = true;
    await conv.save();
    res.json({ success: true, message: 'Conversation archived.' });
  } catch (e) { next(e); }
});

module.exports = router;

