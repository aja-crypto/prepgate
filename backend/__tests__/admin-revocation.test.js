const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'admin-test-secret';

const admin = {
  _id: 'admin-1',
  name: 'Test Admin',
  email: 'admin@example.com',
  passwordHash: null,
  role: 'admin',
  permissions: ['settings.manage'],
  isActive: true,
  tokenVersion: 0,
};

const mockLocalAdminStore = {
  findAdminByEmail: jest.fn(() => admin),
  findAdminById: jest.fn(() => admin),
  comparePassword: jest.fn((record, password) => bcrypt.compare(password, record.passwordHash)),
  updateAdminLastLogin: jest.fn(),
  save: jest.fn(),
  sanitize: jest.fn((record) => {
    const { passwordHash, ...safe } = record;
    return safe;
  }),
};

jest.mock('../src/config/db', () => ({ isMongoConnected: () => false }));
jest.mock('../src/store/localAdminStore', () => mockLocalAdminStore);

describe('admin token-version revocation', () => {
  let app;

  beforeAll(async () => {
    admin.passwordHash = await bcrypt.hash('old-password', 4);
    const router = require('../src/routes/adminAuth');
    app = express();
    app.use(express.json());
    app.use('/api/admin/auth', router);
  });

  beforeEach(() => {
    admin.passwordHash = bcrypt.hashSync('old-password', 4);
    admin.tokenVersion = 0;
    jest.clearAllMocks();
  });

  async function login(password = 'old-password') {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: admin.email, password });
    expect(response.status).toBe(200);
    return response.body.data.token;
  }

  test('login authenticates, logout revokes the current token, and revoke-all invalidates sessions', async () => {
    const firstToken = await login();
    const secondToken = await login();

    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${firstToken}`)).status).toBe(200);

    const logout = await request(app)
      .post('/api/admin/auth/logout')
      .set('Authorization', `Bearer ${firstToken}`);
    expect(logout.status).toBe(200);
    expect(admin.tokenVersion).toBe(1);
    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${firstToken}`)).status).toBe(401);
    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${secondToken}`)).status).toBe(401);

    const replacementToken = await login();
    const revokeAll = await request(app)
      .post('/api/admin/auth/revoke-all')
      .set('Authorization', `Bearer ${replacementToken}`);
    expect(revokeAll.status).toBe(200);
    expect(admin.tokenVersion).toBe(2);
    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${replacementToken}`)).status).toBe(401);
  });

  test('password changes invalidate old tokens and require the new password', async () => {
    const token = await login();
    const response = await request(app)
      .post('/api/admin/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'old-password', newPassword: 'new-password' });

    expect(response.status).toBe(200);
    expect(admin.tokenVersion).toBe(1);
    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect((await request(app).post('/api/admin/auth/login').send({
      email: admin.email,
      password: 'old-password',
    })).status).toBe(401);
    expect((await request(app).post('/api/admin/auth/login').send({
      email: admin.email,
      password: 'new-password',
    })).status).toBe(200);
  });

  test('incorrect current password does not mutate password or token version', async () => {
    const token = await login();
    const beforeHash = admin.passwordHash;
    const response = await request(app)
      .post('/api/admin/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'new-password' });

    expect(response.status).toBe(401);
    expect(admin.passwordHash).toBe(beforeHash);
    expect(admin.tokenVersion).toBe(0);
    expect((await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
  });
});
