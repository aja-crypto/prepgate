describe('SMTP diagnostic logging', () => {
  const originalEnv = process.env;
  let createTransport;
  let sendEmail;
  let logs;
  let errors;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@example.com',
      SMTP_PASS: 'secret-not-logged',
      FROM_EMAIL: 'noreply@example.com',
    };
    logs = [];
    errors = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
    jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));

    createTransport = jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'message-id' }),
    }));
    jest.doMock('nodemailer', () => ({ createTransport }));
    ({ sendEmail } = require('../src/utils/email'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  test('logs safe start and completion diagnostics without credentials', async () => {
    await sendEmail({
      type: 'password-reset',
      eventId: 'event-id',
      to: 'user@example.com',
      subject: 'Reset',
      html: '<p>Reset</p>',
      text: 'Reset',
    });

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      logger: expect.objectContaining({ debug: expect.any(Function), info: expect.any(Function) }),
    }));
    expect(logs.join('\n')).toContain('stage=transport_start host=smtp.gmail.com port=587');
    expect(logs.join('\n')).toContain('stage=send_started host=smtp.gmail.com port=587');
    expect(logs.join('\n')).toContain('stage=send_completed host=smtp.gmail.com port=587');
    expect(logs.join('\n')).not.toContain('secret-not-logged');
  });

  test('maps SMTP authentication failures to a safe stage', async () => {
    createTransport.mockImplementation(() => ({
      sendMail: jest.fn().mockRejectedValue(Object.assign(new Error('authentication failed'), {
        code: 'EAUTH',
      })),
    }));
    jest.resetModules();
    jest.doMock('nodemailer', () => ({ createTransport }));
    ({ sendEmail } = require('../src/utils/email'));

    await expect(sendEmail({
      type: 'verification',
      eventId: 'event-id',
      to: 'user@example.com',
      subject: 'Verify',
      html: '<p>Verify</p>',
      text: 'Verify',
    })).rejects.toMatchObject({ code: 'EAUTH' });

    expect(errors.join('\n')).toContain('stage=authentication errorCode=EAUTH');
    expect(errors.join('\n')).not.toContain('secret-not-logged');
  });
});
