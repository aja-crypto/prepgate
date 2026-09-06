const templates = require('../src/utils/emailTemplates');

describe('transactional email hardening', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('rejects unsafe email URL schemes', () => {
    expect(() => templates.verification('Asha', 'javascript:alert(1)')).toThrow(/http or https/);
    expect(() => templates.verification('Asha', 'data:text/html,hello')).toThrow(/http or https/);
    expect(() => templates.verification('Asha', 'https://gatenexa.in/verify/token')).not.toThrow();
  });

  test('requires a secure absolute frontend URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    expect(() => templates.welcome('Asha')).toThrow(/non-local HTTPS/);

    process.env.FRONTEND_URL = 'https://gatenexa.in';
    expect(templates.welcome('Asha').html).toContain('https://gatenexa.in/dashboard');
  });

  test('escapes feedback content and preserves actual premium claims', () => {
    const feedback = templates.feedbackReceived({
      category: 'ui_ux',
      rating: 4,
      message: '<script>alert(1)</script>',
      ticketId: 'ticket-1',
    });
    expect(feedback.html).not.toContain('<script>');
    expect(feedback.html).toContain('&lt;script&gt;');

    const premium = templates.premiumActivated('Asha');
    expect(premium.html).toContain('200/day instead of 30/day');
    expect(premium.html).toContain('AIR predictor');
    expect(premium.html).toContain('Gate Vault');
    expect(premium.html).not.toContain('Premium Learning Hub');
  });
});

describe('email delivery idempotency', () => {
  test('allows only one concurrent claim for the same event', async () => {
    jest.resetModules();
    const sendEmail = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ messageId: 'm1' }), 5)));
    const firstRecord = { _id: 'delivery-1', status: 'sending' };
    let claimCount = 0;

    jest.doMock('../src/config/db', () => ({ isMongoConnected: () => true }));
    jest.doMock('../src/models/EmailDelivery', () => ({
      findOneAndUpdate: jest.fn(async () => {
        claimCount += 1;
        if (claimCount > 1) {
          const error = new Error('duplicate key');
          error.code = 11000;
          throw error;
        }
        return firstRecord;
      }),
      findOne: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(firstRecord) })),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    }));
    jest.doMock('../src/utils/email', () => ({ sendEmail }));

    const { sendTransactionalEmail } = require('../src/services/emailDeliveryService');
    const args = {
      type: 'welcome',
      eventId: 'user-1',
      to: 'asha@example.com',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    };

    const results = await Promise.all([
      sendTransactionalEmail(args),
      sendTransactionalEmail(args),
    ]);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(results.filter(result => result.sent).length).toBe(1);
    expect(results.filter(result => result.duplicate).length).toBe(1);
  });
});
