const router = require('express').Router();

const BREVO_ACCOUNT_URL = 'https://api.brevo.com/v3/account';

router.get('/brevo', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    return res.json({
      success: false,
      brevoApiKeyConfigured: false,
      httpStatus: null,
      brevoCode: null,
      brevoMessage: 'BREVO_API_KEY is not configured',
    });
  }

  try {
    const response = await fetch(BREVO_ACCOUNT_URL, {
      headers: {
        'api-key': apiKey,
        accept: 'application/json',
      },
    });
    const payload = await response.json().catch(() => ({}));
    return res.json({
      success: response.ok,
      brevoApiKeyConfigured: true,
      httpStatus: response.status,
      brevoCode: payload?.code || null,
      brevoMessage: payload?.message || null,
    });
  } catch {
    return res.status(502).json({
      success: false,
      brevoApiKeyConfigured: true,
      httpStatus: null,
      brevoCode: 'BREVO_REQUEST_FAILED',
      brevoMessage: 'Brevo account validation request failed',
    });
  }
});

module.exports = router;
