const fetch = require('node-fetch');

class AIProvider {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    this.isOpenRouter = !!process.env.OPENROUTER_API_KEY;
    this.isDashScope = !this.isOpenRouter && this.apiKey?.startsWith('al-');
    this.endpoint = this.isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : this.isDashScope
        ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
    this.model = this.isOpenRouter
      ? process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
      : this.isDashScope
        ? process.env.DASHSCOPE_MODEL || 'qwen-plus'
        : process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxRetries = 1;
    this.timeoutMs = 60000;
  }

  isConfigured() {
    if (!this.apiKey) return false;
    if (this.apiKey.includes('your_') || this.apiKey === 'sk-or-v1-your_openrouter_key_here') return false;
    return true;
  }

  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('No AI API key configured');
    }

    const {
      temperature = 0.7,
      maxTokens = 1500,
      responseFormat = { type: 'text' },
      stream = false,
      signal,
    } = options;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...(this.isOpenRouter ? {
        'HTTP-Referer': 'https://GateNexa.app',
        'X-Title': 'GateNexa',
      } : {}),
    };

    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
      stream,
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this.sleep(attempt === 1 ? 2000 : 1000);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ message: 'Unknown error' }));
          const errorDetail = errorBody.error?.message || errorBody.message || 'Unknown error';

          if (res.status === 429) {
            if (attempt < this.maxRetries) {
              const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
              await this.sleep(retryAfter * 1000);
              continue;
            }
            throw new Error(`Rate limited: ${errorDetail}`);
          }

          if (res.status === 401 || res.status === 403) {
            throw new Error(`Auth failed: ${errorDetail}`);
          }

          if (res.status >= 500) {
            if (attempt < this.maxRetries) continue;
            throw new Error(`AI service unavailable (${res.status})`);
          }

          throw new Error(`AI API error: ${errorDetail}`);
        }

        if (stream) {
          return res.body;
        }

        const json = await res.json();

        if (!json.choices?.[0]?.message) {
          throw new Error('Malformed response: missing choices[0].message');
        }

        const content = json.choices[0].message.content;
        if (!content) {
          throw new Error('AI returned empty content');
        }

        return {
          content,
          usage: json.usage,
          model: json.model,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          if (attempt < this.maxRetries) continue;
          throw new Error('Request timed out');
        }

        if (attempt >= this.maxRetries) throw err;
      }
    }

    throw new Error('All retry attempts exhausted');
  }

  async *streamChat(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1500, signal } = options;

    if (!this.isConfigured()) {
      throw new Error('No AI API key configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...(this.isOpenRouter ? {
        'HTTP-Referer': 'https://GateNexa.app',
        'X-Title': 'GateNexa',
      } : {}),
    };

    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: 'Unknown error' }));
        const errorDetail = errorBody.error?.message || errorBody.message || 'Unknown error';
        throw new Error(`Stream error (${res.status}): ${errorDetail}`);
      }

      // node-fetch v2: res.body is a Node.js Readable stream (not Web ReadableStream)
      // Use async iteration on the Readable stream instead of getReader()
      let buffer = '';

      for await (const chunk of res.body) {
        const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
        buffer += str;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Stream timed out');
      throw err;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AIProvider();