// GateNexa email templates. All templates share one Gmail-safe visual system.

const FONT_STACK = 'Arial, Helvetica, sans-serif';
const BRAND_BACKGROUND = '#070B1A';
const CARD_BACKGROUND = '#0D1226';
const PURPLE = '#8B5CF6';
const CYAN = '#22D3EE';

function appUrl(path = '') {
  const configured = String(process.env.FRONTEND_URL || '').trim();
  const base = configured || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');
  if (!base) throw new Error('FRONTEND_URL is required in production.');
  let parsed;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error('FRONTEND_URL must be an absolute URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('FRONTEND_URL must use http or https.');
  }
  if (process.env.NODE_ENV === 'production' && (parsed.protocol !== 'https:' || /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname))) {
    throw new Error('FRONTEND_URL must be a non-local HTTPS URL in production.');
  }
  const normalizedBase = base.replace(/\/+$/, '');
  return `${normalizedBase}${path}`;
}

function logoUrl() {
  return appUrl('/images/logo-email.png');
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|tr|td)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(url) {
  const value = String(url || '').trim();
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Email links must be absolute URLs.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Email links must use http or https.');
  }
  return escapeHtml(value);
}

function paragraph(content, style = '') {
  return `<p style="margin:0 0 16px;${style}">${content}</p>`;
}

function button(label, url) {
  if (!label || !url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:10px;background:${PURPLE};">
          <a href="${safeHref(url)}" style="display:inline-block;padding:14px 26px;border:1px solid ${PURPLE};border-radius:10px;color:#FFFFFF;text-decoration:none;font-family:${FONT_STACK};font-size:15px;line-height:1.2;font-weight:700;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function layout({ preheader, hero, bodyHtml, cta, supportingHtml, tone = 'default' }) {
  const accent = tone === 'security' ? '#94A3B8' : CYAN;
  const html = `
  <div style="margin:0;padding:0;width:100%;background:${BRAND_BACKGROUND};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || '')}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:${BRAND_BACKGROUND};">
      <tr>
        <td align="center" style="padding:28px 16px 32px;font-family:${FONT_STACK};color:#E2E8F0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">
            <tr>
              <td align="center" style="padding:0 0 24px;">
                <img src="${safeHref(logoUrl())}" alt="GateNexa logo" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 28px;background:${CARD_BACKGROUND};border:1px solid #2A2350;border-radius:16px;">
                <div style="height:3px;width:48px;margin:0 0 22px;background:${accent};border-radius:3px;font-size:0;line-height:0;">&nbsp;</div>
                <h1 style="margin:0 0 20px;color:#FFFFFF;font-family:${FONT_STACK};font-size:30px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;">${hero}</h1>
                <div style="color:#CBD5E1;font-family:${FONT_STACK};font-size:15px;line-height:1.65;">
                  ${bodyHtml}
                </div>
                ${cta ? button(cta.label, cta.url) : ''}
                ${supportingHtml ? `<div style="margin-top:20px;color:#94A3B8;font-family:${FONT_STACK};font-size:13px;line-height:1.6;">${supportingHtml}</div>` : ''}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 12px 0;color:#64748B;font-family:${FONT_STACK};font-size:12px;line-height:1.6;">
                <p style="margin:0;color:#CBD5E1;font-size:13px;font-weight:700;">GateNexa</p>
                <p style="margin:4px 0 0;">Your GATE preparation workspace.</p>
                <p style="margin:12px 0 0;">© 2026 GateNexa</p>
                <p style="margin:10px 0 0;">
                  <a href="${safeHref(appUrl('/feedback'))}" style="color:#A78BFA;text-decoration:none;">Support</a>
                  <span style="color:#475569;"> · </span>
                  <a href="${safeHref(appUrl('/legal/privacy-policy'))}" style="color:#A78BFA;text-decoration:none;">Privacy</a>
                  <span style="color:#475569;"> · </span>
                  <a href="${safeHref(appUrl('/legal/terms-of-service'))}" style="color:#A78BFA;text-decoration:none;">Terms</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  return {
    html,
    text: htmlToText(`${hero}\n\n${bodyHtml}\n\n${supportingHtml || ''}`),
  };
}

function stars(value) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`;
}

function quoteCard(title, rows) {
  const rowHtml = rows
    .filter(Boolean)
    .map(([key, value]) => `
      <tr>
        <td style="padding:10px 0;border-top:1px solid #26304A;color:#94A3B8;font-family:${FONT_STACK};font-size:11px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;width:30%;">${key}</td>
        <td style="padding:10px 0;border-top:1px solid #26304A;color:#E2E8F0;font-family:${FONT_STACK};font-size:14px;line-height:1.55;word-break:break-word;overflow-wrap:anywhere;">${value}</td>
      </tr>`)
    .join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:20px 0;padding:0 16px;background:#111A32;border:1px solid #26304A;border-radius:12px;">
      <tr><td colspan="2" style="padding:14px 0 4px;color:#C4B5FD;font-family:${FONT_STACK};font-size:13px;line-height:1.4;font-weight:700;">${title}</td></tr>
      ${rowHtml}
    </table>`;
}

module.exports = {
  appUrl,
  logoUrl,
  htmlToText,
  escapeHtml,
  stars,

  welcome(name) {
    const displayName = escapeHtml(name).trim() || 'there';
    const result = layout({
      preheader: 'Your preparation workspace is ready. Let’s make every study session count.',
      hero: "You're in. 🎉",
      bodyHtml: [
        paragraph('Your GATE preparation workspace is ready.'),
        paragraph(`Hey ${displayName},`),
        paragraph("GATE preparation isn't about studying everything at once. It's about knowing what to study, staying consistent, and improving one session at a time."),
        paragraph("That's what GateNexa is here for."),
      ].join(''),
      cta: { label: 'Start Preparing →', url: appUrl('/dashboard') },
      supportingHtml: 'Learn · Practice · Track · Improve<br><br>Your workspace. Your preparation. Your GATE journey.<br><br>— Team GateNexa',
      tone: 'celebration',
    });
    return { subject: 'Welcome to GateNexa — your GATE preparation starts here 🚀', ...result };
  },

  verification(name, url) {
    const result = layout({
      preheader: 'One quick step before you start preparing.',
      hero: 'One quick step.',
      bodyHtml: [
        paragraph("Before you start your preparation, let's make sure this email belongs to you."),
        paragraph('Click below to verify your email address and continue with GateNexa.'),
      ].join(''),
      cta: { label: 'Verify My Email →', url },
      supportingHtml: "This verification link expires in 24 hours.<br><br>If you didn't create a GateNexa account, you can safely ignore this email.",
      tone: 'security',
    });
    return { subject: 'Verify your GateNexa email', ...result };
  },

  passwordReset(name, url) {
    const result = layout({
      preheader: 'Use this secure link to choose a new password.',
      hero: "Let's get you back in.",
      bodyHtml: [
        paragraph('We received a request to reset your GateNexa password.'),
        paragraph('If you made this request, you can choose a new password using the button below.'),
      ].join(''),
      cta: { label: 'Reset My Password →', url },
      supportingHtml: "This link expires in 30 minutes.<br><br>If you didn't request a password reset, you can safely ignore this email. Your password won't change unless you use the reset link.",
      tone: 'security',
    });
    return { subject: 'Reset your GateNexa password', ...result };
  },

  changeEmailConfirm(name, url) {
    const result = layout({
      preheader: 'One quick step to finish updating your email address.',
      hero: 'Your email is almost updated.',
      bodyHtml: [
        paragraph('We received a request to change the email address associated with your GateNexa account.'),
        paragraph('Confirm your new email address below to complete the change.'),
      ].join(''),
      cta: { label: 'Confirm New Email →', url },
      supportingHtml: "This link expires in 24 hours.<br><br>If you didn't make this change, please secure your account immediately.",
      tone: 'security',
    });
    return { subject: 'Confirm your new GateNexa email', ...result };
  },

  feedbackReceived({ title, category, rating, message, ticketId }) {
    const rows = [
      ['Category', escapeHtml(String(category || '').replace(/_/g, ' '))],
      rating == null ? null : ['Rating', escapeHtml(stars(rating))],
      ['Your feedback', escapeHtml(String(message || ''))],
    ];
    const result = layout({
      preheader: 'Thanks for taking the time to help us improve GateNexa.',
      hero: 'Thanks for speaking up.',
      bodyHtml: [
        paragraph('Your feedback has reached the GateNexa team.'),
        quoteCard('Your feedback', rows),
        paragraph('Your feedback helps us improve GateNexa for everyone preparing for GATE.'),
      ].join(''),
      cta: ticketId
        ? { label: 'View My Feedback →', url: appUrl(`/feedback?ticketId=${encodeURIComponent(String(ticketId))}`) }
        : null,
    });
    return { subject: 'We received your GateNexa feedback 💜', ...result };
  },

  premiumActivated(name) {
    const displayName = escapeHtml(name).trim() || 'there';
    const result = layout({
      preheader: 'Your Premium access is now active.',
      hero: "You're Premium. Let's get to work.",
      bodyHtml: [
        paragraph(`Your GateNexa Premium access is now active, ${displayName}.`),
        quoteCard('Premium access includes', [
          ['AI questions', 'Higher daily AI question limits (200/day instead of 30/day)'],
          ['AIR Predictor', 'Access to the AIR predictor'],
          ['Gate Vault', 'Access to premium Gate Vault practice'],
        ]),
      ].join(''),
      cta: { label: 'Start Preparing →', url: appUrl('/dashboard') },
      tone: 'celebration',
    });
    return { subject: 'GateNexa Premium is ready for you ✨', ...result };
  },
};
