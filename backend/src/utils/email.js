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
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

exports.isSmtpConfigured = isSmtpConfigured;

exports.sendEmail = async ({ to, subject, html, text }) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      logDevEmail({ to, subject, html });
      return { messageId: 'dev-console-log' };
    }
    throw new Error('SMTP is not configured.');
  }

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"GateNexa.in" <${process.env.FROM_EMAIL || 'noreply@gatenexa.in'}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};
