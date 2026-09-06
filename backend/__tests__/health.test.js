const request = require('supertest');
const express = require('express');

// Mock DB config before requiring server
const mockConnectDB = jest.fn().mockResolvedValue(undefined);
mockConnectDB.isMongoConnected = jest.fn(() => false);
jest.mock('../src/config/db', () => mockConnectDB);

// Mock devMode
jest.mock('../src/config/devMode', () => ({
  isMockAuthEnabled: jest.fn(() => true),
  enableMockAuth: jest.fn(),
  isAutoModeEnabled: jest.fn(() => false),
  isPlaceholderUri: jest.fn(() => false),
}));

// Mock User model
jest.mock('../src/models/User', () => {
  const mockUser = {
    _id: 'test-user-id',
    name: 'Test User',
    email: 'test@test.com',
    role: 'user',
    streak: { current: 0, longest: 0, lastStudyDate: null, activityLog: {} },
  };
  const User = jest.fn().mockImplementation(() => mockUser);
  User.findById = jest.fn().mockResolvedValue(mockUser);
  return User;
});

describe('Health endpoint', () => {
  let app;
  beforeAll(() => {
    app = require('../server');
  });

  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('server', 'ok');
  });
});

describe('Auth endpoints', () => {
  let app;
  beforeAll(() => {
    app = require('../server');
  });

  test('POST /api/auth/register rejects empty body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/login rejects empty body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});

describe('Protected routes (X-Demo-User)', () => {
  let app;
  beforeAll(() => {
    app = require('../server');
  });

  test('GET /api/progress/streak returns data for demo user', async () => {
    const res = await request(app)
      .get('/api/progress/streak')
      .set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /api/subjects returns 401 without auth', async () => {
    const res = await request(app).get('/api/subjects');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/subjects does not accept access tokens in query strings', async () => {
    const res = await request(app).get('/api/subjects?token=not-a-bearer-token');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/subjects returns data with demo auth', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('Referral endpoint', () => {
  let app;
  beforeAll(() => {
    app = require('../server');
  });

  test('GET /api/referral/status returns data for demo user', async () => {
    const res = await request(app)
      .get('/api/referral/status')
      .set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('referralCode');
  });
});
