// src/utils/email.js – Nodemailer Email Utility
const nodemailer = require('nodemailer');

const SMTP_PLACEHOLDERS = new Set([
  '',
  'your_sendgrid_api_key',
  'your_smtp_password',
  'changeme',
]);

const isSmtpConfigured = () => {
  const pass = process.env.SMTP_PASS?.trim();
  const user = process.env.SMTP_USER?.trim();
  return Boolean(pass && user && !SMTP_PLACEHOLDERS.has(pass));
};

const logDevEmail = ({ to, subject, html }) => {
  console.log('\n📧 [DEV] SMTP not configured — email logged instead of sent');
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  const link = html?.match(/href="([^"]+)"/)?.[1];
  if (link) console.log(`   Link: ${link}`);
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.sendgrid.net';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const startedAt = Date.now();
  let stage = 'transport_start';

  const diagnostic = (nextStage, elapsedMs = Date.now() - startedAt) => {
    stage = nextStage;
    console.log(
      `[email-diagnostic] stage=${nextStage} host=${host} port=${port} ` +
      `secure=false requireTLS=true elapsedMs=${elapsedMs}`
    );
  };

  const logger = {
    trace: () => {},
    debug: (data, message) => {
      if (data?.tnx === 'dns') diagnostic('dns_resolved');
      if (data?.tnx === 'smtp' && /handshake finished/i.test(String(message || ''))) {
        diagnostic('greeting');
      }
    },
    info: (data, message) => {
      if (data?.tnx === 'network' && /established/i.test(String(message || ''))) {
        diagnostic('connection');
      } else if (data?.tnx === 'smtp' && data.action === 'authenticated') {
        diagnostic('authenticated');
      } else if (data?.tnx === 'smtp' && /STARTTLS|upgraded with STARTTLS/i.test(String(message || ''))) {
        diagnostic('tls');
      }
    },
    warn: () => {},
    error: () => {},
    fatal: () => {},
  };

  diagnostic('transport_start');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    logger,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  transporter.__diagnosticStage = () => stage;
  return transporter;
};

exports.isSmtpConfigured = isSmtpConfigured;

function maskEmail(to) {
  const addr = String(to || '');
  const at = addr.indexOf('@');
  if (at <= 1) return '***';
  return `${addr[0]}***${addr.slice(at)}`;
}

exports.sendEmail = async ({ to, subject, html, text, type, eventId }) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      logDevEmail({ to, subject, html });
      return { messageId: 'dev-console-log' };
    }
    throw new Error('SMTP is not configured.');
  }

  const transporter = createTransporter();

  // Only use a Reply-To address that is explicitly configured and exists.
  const replyTo = (process.env.EMAIL_REPLY_TO || '').trim();

  const startedAt = Date.now();
  const host = process.env.SMTP_HOST || 'smtp.sendgrid.net';
  const port = parseInt(process.env.SMTP_PORT || '587');
  console.log(
    `[email] type=${type || 'unknown'} status=attempted to=${maskEmail(to)} ` +
    `host=${host} port=${port}`
  );
  console.log(`[email-diagnostic] stage=send_started host=${host} port=${port} elapsedMs=0`);
  try {
    const info = await transporter.sendMail({
      from: `"GateNexa" <${process.env.FROM_EMAIL || 'noreply@gatenexa.in'}>`,
      ...(replyTo ? { replyTo } : {}),
      to,
      subject,
      text,
      html,
    });

    // Delivery log: type + masked recipient + status + timestamp only.
    // Never: SMTP_PASS, passwords, raw tokens, app passwords.
    console.log(
      `[email] type=${type || 'unknown'} status=sent to=${maskEmail(to)} ` +
      `event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ` +
      `messageId=${info?.messageId || 'n/a'} ms=${Date.now() - startedAt}`
    );
    console.log(
      `[email-diagnostic] stage=send_completed host=${host} port=${port} ` +
      `elapsedMs=${Date.now() - startedAt}`
    );

    return info;
  } catch (err) {
    const failureStage = err?.code === 'EDNS'
      ? 'dns'
      : err?.code === 'ETLS'
        ? 'tls'
        : err?.code === 'EAUTH'
          ? 'authentication'
          : err?.command === 'MAIL'
            ? 'mail_from'
            : err?.command === 'RCPT'
              ? 'rcpt_to'
              : err?.command === 'DATA'
                ? 'data'
                : transporter.__diagnosticStage?.() || 'transport_or_smtp';
    console.error(
      `[email-diagnostic] stage=${failureStage} errorCode=${err?.code || 'send_failed'} ` +
      `errorName=${err?.name || 'Error'} host=${host} port=${port} elapsedMs=${Date.now() - startedAt}`
    );
    console.error(
      `[email] type=${type || 'unknown'} status=failed to=${maskEmail(to)} ` +
      `event=${eventId ? String(eventId).slice(0, 120) : 'n/a'} ` +
      `error=${err?.code || err?.name || 'send_failed'}`
    );
    throw err;
  }
};
