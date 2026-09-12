// Focused unit tests for the demo-authentication default-deny gate (Batch 1A)
// Target: backend/src/middleware/auth.js — protect()
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
  isMongoConnected: jest.fn(() => true),
}));

jest.mock('../src/config/devMode', () => ({
  isMockAuthEnabled: jest.fn(() => false),
  enableMockAuth: jest.fn(),
  isAutoModeEnabled: jest.fn(() => false),
  isPlaceholderUri: jest.fn(() => false),
}));

jest.mock('../src/middleware/tokenBlacklist', () => ({
  hasSync: () => false,
  has: () => Promise.resolve(false),
}));

jest.mock('../src/store/mockStore', () => ({ findById: jest.fn(() => null) }));

jest.mock('../src/models/User', () => {
  const User = {};
  const mockUser = {
    _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    name: 'Test User',
    email: 'test@test.com',
    role: 'user',
    tokenVersion: 0,
  };
  // Real middleware calls User.findById(id).select('-password'), so the mock must be chainable.
  User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
  return User;
});

const { protect } = require('../src/middleware/auth');

const buildApp = () => {
  const app = express();
  app.get('/x', protect, (req, res) => res.json({ success: true, user: req.user?.id || req.user?._id }));
  return app;
};

let originalNodeEnv;
let originalEnableDemo;

beforeAll(() => {
  originalNodeEnv = process.env.NODE_ENV;
  originalEnableDemo = process.env.ENABLE_DEMO;
  process.env.JWT_SECRET = 'test_secret_for_batch_1a';
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalEnableDemo === undefined) delete process.env.ENABLE_DEMO;
  else process.env.ENABLE_DEMO = originalEnableDemo;
});

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalEnableDemo === undefined) delete process.env.ENABLE_DEMO;
  else process.env.ENABLE_DEMO = originalEnableDemo;
  delete process.env.JWT_SECRET;
});

describe('Batch 1A — demo authentication default-deny gate', () => {
  test('NODE_ENV=production + X-Demo-User: true → 401, even with ENABLE_DEMO=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEMO = 'true';
    const res = await request(buildApp()).get('/x').set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('no ENABLE_DEMO + X-Demo-User: true → 401 (default-deny)', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENABLE_DEMO;
    const res = await request(buildApp()).get('/x').set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('ENABLE_DEMO=false + X-Demo-User: true → 401', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEMO = 'false';
    const res = await request(buildApp()).get('/x').set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('ENABLE_DEMO=TRUE (uppercase, malformed) + X-Demo-User: true → 401 (exact value required)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEMO = 'TRUE';
    const res = await request(buildApp()).get('/x').set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('ENABLE_DEMO=true + non-production + X-Demo-User: true → demo user (intended behavior preserved)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEMO = 'true';
    const res = await request(buildApp()).get('/x').set('X-Demo-User', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBe('demo_user_id');
  });

  test('normal valid JWT → unchanged (200)', async () => {
    process.env.NODE_ENV = 'test';
    const token = jwt.sign(
      { id: 'aaaaaaaaaaaaaaaaaaaaaaaa', v: 0 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' }
    );
    const res = await request(buildApp()).get('/x').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('missing authentication → unchanged (401)', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(buildApp()).get('/x');
    expect(res.statusCode).toBe(401);
  });
});
