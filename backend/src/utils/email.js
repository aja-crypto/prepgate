const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_TIMEOUT_MS = 15000;
const RESEND_PLACEHOLDERS = new Set([
  '',
  'your_resend_api_key',
  're_your_api_key',
  'changeme',
]);

const isEmailConfigured = () => {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const fromEmail = String(process.env.FROM_EMAIL || '').trim();
  return Boolean(
    apiKey &&
    fromEmail &&
    !RESEND_PLACEHOLDERS.has(apiKey) &&
    !RESEND_PLACEHOLDERS.has(fromEmail)
  );
};

const logDevEmail = ({ to, subject }) => {
  console.log('\n[DEV] Resend is not configured - email logged instead of sent');
  console.log(`To: ${maskEmail(to)}`);
  console.log(`Subject: ${subject}`);
};

function maskEmail(to) {
  const addr = String(to || '');
  const at = addr.indexOf('@');
  if (at <= 1) return '***';
  return `${addr[0]}***${addr.slice(at)}`;
}

function safeProviderText(value, secrets = []) {
  let text = String(value || 'Email provider request failed')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 240);
  secrets.filter(Boolean).forEach(secret => {
    text = text.split(secret).join('[redacted]');
  });
  return text;
}

function providerError(code, message, details = {}) {
  const error = new Error(message || 'Email provider request failed');
  error.code = code;
  error.httpStatus = details.httpStatus;
  error.providerCode = details.providerCode;
  error.providerMessage = details.providerMessage;
  return error;
}

exports.isEmailConfigured = isEmailConfigured;
exports.isSmtpConfigured = isEmailConfigured;

exports.sendEmail = async ({ to, subject, html, text, type, eventId }) => {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      logDevEmail({ to, subject });
      return { messageId: 'dev-console-log' };
    }
    throw providerError('EMAIL_NOT_CONFIGURED', 'Email provider is not configured.');
  }

  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const fromEmail = String(process.env.FROM_EMAIL || '').trim();
  const replyTo = String(process.env.EMAIL_REPLY_TO || '').trim();
  const maskedRecipient = maskEmail(to);
  const startedAt = Date.now();
  console.log(
    `[email] type=${type || 'unknown'} status=attempted to=${maskedRecipient} ` +
    `provider=resend apiKeyConfigured=${Boolean(apiKey)} fromConfigured=${Boolean(fromEmail)} ` +
    `replyToConfigured=${Boolean(replyTo)} url=${RESEND_API_URL}`
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(eventId ? { 'Idempotency-Key': String(eventId).slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: `GateNexa <${fromEmail}>`,
        to: [to],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerCode = payload?.name || payload?.code || payload?.statusCode;
      const providerMessage = safeProviderText(
        payload?.message || payload?.error || 'Email provider rejected the request',
        [apiKey, fromEmail, replyTo]
      );
      throw providerError(
        `RESEND_HTTP_${response.status}`,
        providerMessage,
        {
          httpStatus: response.status,
          providerCode: safeProviderText(providerCode, [apiKey]),
          providerMessage,
        }
      );
    }

    const messageId = payload?.id;
    if (!messageId) {
      throw providerError('RESEND_INVALID_RESPONSE', 'Email provider returned no message ID');
    }

    console.log(
      `[email] type=${type || 'unknown'} status=sent to=${maskedRecipient} ` +
      `event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ms=${Date.now() - startedAt}`
    );
    return { messageId };
  } catch (err) {
    const error = err?.name === 'AbortError'
      ? providerError('RESEND_TIMEOUT', 'Email provider request timed out')
      : err;
    console.error(
      `[email] provider=resend status=failed type=${type || 'unknown'} ` +
      `to=${maskedRecipient} event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ` +
      `httpStatus=${error?.httpStatus || 'n/a'} ` +
      `providerCode=${safeProviderText(error?.providerCode || error?.code || error?.name || 'send_failed', [apiKey])} ` +
      `providerMessage=${safeProviderText(error?.providerMessage || error?.message, [apiKey, fromEmail, replyTo])}`
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
