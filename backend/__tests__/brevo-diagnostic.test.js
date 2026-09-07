describe('Brevo diagnostic endpoint', () => {
  const originalEnv = process.env;
  const express = require('express');
  const request = require('supertest');
  let router;
  let fetchMock;
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, CRON_SECRET: 'diagnostic-secret', BREVO_API_KEY: 'brevo-test-key' };
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    router = require('../src/routes/brevoDiagnostic');
    app = express().use('/api/diagnostics', router);
  });

  afterEach(() => {
    process.env = originalEnv;
    delete global.fetch;
  });

  test('validates the configured key without exposing it', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });
    const response = await request(app)
      .get('/api/diagnostics/brevo')
      .set('x-cron-secret', 'diagnostic-secret');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/account',
      expect.objectContaining({
        headers: { 'api-key': 'brevo-test-key', accept: 'application/json' },
      })
    );
    expect(JSON.stringify(response.body)).not.toContain('brevo-test-key');
    expect(response.body).toEqual(expect.objectContaining({
      brevoApiKeyConfigured: true,
      httpStatus: 200,
    }));
  });

  test('returns safe Brevo error details for an unauthorized key', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ code: 'unauthorized', message: 'Key not found' }),
    });
    const response = await request(app)
      .get('/api/diagnostics/brevo')
      .set('x-cron-secret', 'diagnostic-secret');

    expect(response.body).toEqual({
      success: false,
      brevoApiKeyConfigured: true,
      httpStatus: 401,
      brevoCode: 'unauthorized',
      brevoMessage: 'Key not found',
    });
  });
});
