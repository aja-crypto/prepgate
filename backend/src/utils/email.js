// src/utils/email.js – Brevo HTTPS transactional email transport
// Public contract is intentionally kept stable:
//   exports.isSmtpConfigured() – boolean (name preserved for callers)
//   exports.sendEmail({ to, subject, html, text, type, eventId }) -> { messageId }
// Replaces the old Nodemailer SMTP transport. Does not touch templates,
// EmailDelivery idempotency, or any business caller.

const BREVO_PLACEHOLDERS = new Set([
  '',
  'your_brevo_api_key',
  'your_sendgrid_api_key',
  'your_smtp_password',
  'changeme',
]);

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'GateNexa';

const isSmtpConfigured = () => {
  const key = process.env.BREVO_API_KEY?.trim();
  const from = process.env.FROM_EMAIL?.trim();
  return Boolean(key && from && !BREVO_PLACEHOLDERS.has(key));
};

const logDevEmail = ({ to, subject, html }) => {
  console.log('\n📧 [DEV] Brevo not configured — email logged instead of sent');
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  const link = html?.match(/href="([^"]+)"/)?.[1];
  if (link) console.log(`   Link: ${link}`);
};

function maskEmail(to) {
  const addr = String(to || '');
  const at = addr.indexOf('@');
  if (at <= 1) return '***';
  return `${addr[0]}***${addr.slice(at)}`;
}

function parseEmailAddress(address) {
  const raw = String(address || '').trim();
  const m = raw.match(/<([^>]+)>\s*$/);
  const email = (m ? m[1] : raw).trim();
  const name = m ? raw.replace(/<[^>]+>\s*$/, '').trim().replace(/^["']|["']$/g, '') : SENDER_NAME;
  return { email, name: name || SENDER_NAME };
}

exports.isSmtpConfigured = isSmtpConfigured;

exports.sendEmail = async ({ to, subject, html, text, type, eventId }) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      logDevEmail({ to, subject, html });
      return { messageId: 'dev-console-log' };
    }
    throw new Error('Brevo email transport is not configured (missing BREVO_API_KEY or FROM_EMAIL).');
  }

  const apiKey = process.env.BREVO_API_KEY.trim();
  const fromRaw = process.env.FROM_EMAIL.trim();
  const { email: fromEmail, name: fromName } = parseEmailAddress(fromRaw);
  const replyToRaw = (process.env.EMAIL_REPLY_TO || '').trim();

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: String(to).trim() }],
    subject: String(subject || '(no subject)'),
  };
  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;
  if (replyToRaw) {
    const r = parseEmailAddress(replyToRaw);
    payload.replyTo = { name: r.name, email: r.email };
  }

  const startedAt = Date.now();
  let httpStatus = null;
  let brevoCode = null;
  let brevoMessage = null;
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    httpStatus = res.status;

    let body = null;
    const textResp = await res.text();
    try { body = textResp ? JSON.parse(textResp) : null; } catch { /* ignore non-JSON */ }

    if (!res.ok) {
      brevoCode = String(body?.code || body?.error?.code || '').slice(0, 80) || null;
      brevoMessage = String(body?.message || body?.error?.message || textResp || res.statusText)
        .replace(/[\r\n]+/g, ' ')
        .slice(0, 240);
      const err = new Error(`Brevo request failed (HTTP ${httpStatus})`);
      err.code = brevoCode || `brevo_http_${httpStatus}`;
      err.httpStatus = httpStatus;
      throw err;
    }

    const providerMessageId = String(body?.messageId || '').slice(0, 240);

    console.log(
      `[email] provider=brevo type=${type || 'unknown'} status=sent to=${maskEmail(to)} ` +
      `event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ` +
      `apiKeyConfigured=${Boolean(apiKey)} fromConfigured=${Boolean(fromEmail)} ` +
      `httpStatus=${httpStatus} messageId=${providerMessageId || 'n/a'} ms=${Date.now() - startedAt}`
    );

    return { messageId: providerMessageId };
  } catch (err) {
    const safeHttp = httpStatus != null ? String(httpStatus) : 'n/a';
    const safeCode = brevoCode || (err?.code ? String(err.code).slice(0, 80) : 'send_failed');
    const safeMsg = brevoMessage
      ? brevoMessage
      : (err?.message ? String(err.message).replace(/[\r\n]+/g, ' ').slice(0, 240) : 'Email delivery failed');

    console.error(
      `[email] provider=brevo type=${type || 'unknown'} status=failed to=${maskEmail(to)} ` +
      `event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ` +
      `apiKeyConfigured=${Boolean(apiKey)} fromConfigured=${Boolean(fromEmail)} ` +
      `httpStatus=${safeHttp} error=${safeCode}`
    );
    // Preserve a concise error message for callers; never attach raw body or keys.
    err.code = safeCode;
    err.message = `Brevo delivery failed: ${safeMsg}`.slice(0, 240);
    err.httpStatus = httpStatus;
    throw err;
  }
};
