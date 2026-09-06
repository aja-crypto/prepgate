// src/routes/emailPreview.js – DEVELOPMENT-ONLY template preview.
// Never mounted in production. Renders templates with sample data so their
// HTML can be inspected in a browser without sending any email.
const router = require('express').Router();
const t = require('../utils/emailTemplates');

const SAMPLES = {
  welcome: () => t.welcome('Asha'),
  verification: () => t.verification('Asha', 'https://gatenexa.vercel.app/verify-email/sample-token'),
  'password-reset': () => t.passwordReset('Asha', 'https://gatenexa.vercel.app/reset-password/sample-token'),
  'change-email': () => t.changeEmailConfirm('Asha', 'https://gatenexa.vercel.app/verify-new-email/sample-token'),
  'feedback-received': () => t.feedbackReceived({ title: 'Mobile AI feels congested', category: 'ui_ux', rating: 4, message: 'The assistant panel overlaps the input on small screens.', ticketId: 'sample123' }),
  'premium-activated': () => t.premiumActivated('Asha'),
};

router.get('/:template', (req, res) => {
  const build = SAMPLES[req.params.template];
  if (!build) {
    return res.status(404).json({ success: false, message: 'Unknown template.', templates: Object.keys(SAMPLES) });
  }
  const out = build();
  res.setHeader('Content-Type', 'text/html');
  res.send(out.html);
});

module.exports = router;
