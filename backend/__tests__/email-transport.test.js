describe('Resend email transport', () => {
  const originalEnv = process.env;
  let fetchMock;
  let sendEmail;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_test_key',
      FROM_EMAIL: 'noreply@gatenexa.in',
      EMAIL_REPLY_TO: 'support@gatenexa.in',
    };
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: 'resend-message-id' }),
    });
    global.fetch = fetchMock;
    ({ sendEmail } = require('../src/utils/email'));
  });

  afterEach(() => {
    process.env = originalEnv;
    delete global.fetch;
  });

  test.each([
    'verification',
    'password-reset',
    'change-email',
    'welcome',
    'premium-activation',
    'feedback-received',
  ])('sends %s through the HTTPS provider', async type => {
    const result = await sendEmail({
      type,
      eventId: `${type}:event-1`,
      to: 'asha@example.com',
      subject: 'GateNexa',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result).toEqual({ messageId: 'resend-message-id' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer re_test_key');
    expect(options.headers['Idempotency-Key']).toBe(`${type}:event-1`);
    expect(JSON.parse(options.body)).toEqual({
      from: 'GateNexa <noreply@gatenexa.in>',
      to: ['asha@example.com'],
      subject: 'GateNexa',
      html: '<p>Hello</p>',
      text: 'Hello',
      reply_to: 'support@gatenexa.in',
    });
  });

  test('marks provider rejection with a safe error code', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ message: 'invalid from address' }),
    });

    await expect(sendEmail({
      type: 'welcome',
      eventId: 'welcome:event-1',
      to: 'asha@example.com',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    })).rejects.toMatchObject({ code: 'RESEND_HTTP_422' });
    const log = errorLog.mock.calls.flat().join(' ');
    expect(log).toContain('provider=resend status=failed');
    expect(log).toContain('httpStatus=422');
    expect(log).toContain('providerMessage=invalid from address');
    expect(log).not.toContain('re_test_key');
    errorLog.mockRestore();
  });

  test('does not attempt HTTPS when the provider is not configured', async () => {
    delete process.env.RESEND_API_KEY;

    await expect(sendEmail({
      type: 'welcome',
      eventId: 'welcome:event-2',
      to: 'asha@example.com',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    })).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('converts an HTTPS timeout into a safe provider error', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }));

    const sendPromise = sendEmail({
      type: 'feedback-received',
      eventId: 'feedback:event-timeout',
      to: 'asha@example.com',
      subject: 'Feedback',
      html: '<p>Feedback</p>',
      text: 'Feedback',
    });
    const rejection = expect(sendPromise).rejects.toMatchObject({
      code: 'RESEND_TIMEOUT',
      message: 'Email provider request timed out',
    });
    await jest.advanceTimersByTimeAsync(15000);
    await rejection;
    jest.useRealTimers();
  });
});
