const request = require('supertest');
const express = require('express');

// Mock DB config — mock auth enabled, Mongo disconnected
const mockConnectDB = jest.fn().mockResolvedValue(undefined);
mockConnectDB.isMongoConnected = jest.fn(() => false);
jest.mock('../src/config/db', () => mockConnectDB);

jest.mock('../src/config/devMode', () => ({
  isMockAuthEnabled: jest.fn(() => true),
  enableMockAuth: jest.fn(),
  isAutoModeEnabled: jest.fn(() => false),
  isPlaceholderUri: jest.fn(() => false),
}));

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

// Mock Cloudinary — prevent real uploads
jest.mock('../src/config/cloudinary', () => ({
  isCloudinaryConfigured: jest.fn(() => true),
  uploadImage: jest.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg' }),
  uploadPdf: jest.fn(),
  deletePdf: jest.fn(),
  getPdfPageCount: jest.fn(),
  generateSignedPdfPageUrls: jest.fn(),
}));

const DEMO_HEADERS = { 'X-Demo-User': 'true' };

describe('Mistake Entries', () => {
  let app;
  beforeAll(() => {
    process.env.ENABLE_DEMO = 'true';
    app = require('../server');
  });
  afterAll(() => {
    delete process.env.ENABLE_DEMO;
  });

  describe('POST /api/mistakes', () => {
    test('authenticated demo user can create mistake without image', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          subject: 'Operating Systems',
          topic: 'Process Scheduling',
          mistakeType: 'concept_mistake',
          mistake: 'Confused round-robin with FIFO',
          correctConcept: 'Round-robin uses time quantum, FIFO does not',
          questionText: 'OS — Process Scheduling',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.subject).toBe('Operating Systems');
      expect(res.body.data.mistakeType).toBe('concept_mistake');
      expect(res.body.data.learning).toBe('Confused round-robin with FIFO');
      expect(res.body.data.reason).toBe('Round-robin uses time quantum, FIFO does not');
      expect(res.body.data.resolved).toBe(false);
    });

    test('create without image works (JSON body, no FormData)', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          subject: 'DBMS',
          mistake: 'Index vs primary key confusion',
          questionText: 'DBMS — Indexing',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.questionImage || '').toBe('');
    });

    test('create returns valid server ID', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'CN', mistake: 'TCP vs UDP', questionText: 'CN — Transport' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data._id).toBeDefined();
      expect(typeof res.body.data._id).toBe('string');
      expect(res.body.data._id.length).toBeGreaterThan(0);
    });

    test('invalid payload rejected — missing subject', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ mistake: 'Some mistake without subject' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/subject/i);
    });

    test('invalid payload rejected — missing text', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'OS' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    test('unauthenticated create rejected', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .send({ subject: 'OS', mistake: 'test', questionText: 'test' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/mistakes/:id', () => {
    test('update resolved works', async () => {
      // First create
      const createRes = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'TOC', mistake: 'NFA vs DFA', questionText: 'TOC — Automata' });
      const id = createRes.body.data._id;

      // Then update
      const updateRes = await request(app)
        .put(`/api/mistakes/${id}`)
        .set(DEMO_HEADERS)
        .send({ resolved: true });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body).toHaveProperty('success', true);
    });
  });

  describe('PATCH /api/mistakes/:id/review', () => {
    test('review endpoint works', async () => {
      const createRes = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'Algo', mistake: 'DFS vs BFS', questionText: 'Algo — Graphs' });
      const id = createRes.body.data._id;

      const reviewRes = await request(app)
        .patch(`/api/mistakes/${id}/review`)
        .set(DEMO_HEADERS)
        .send({ reviewed: true });
      expect(reviewRes.statusCode).toBe(200);
      expect(reviewRes.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/mistakes/:id', () => {
    test('delete works', async () => {
      const createRes = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'DL', mistake: 'Perceptron limit', questionText: 'DL — Neural Nets' });
      const id = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/mistakes/${id}`)
        .set(DEMO_HEADERS);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/mistakes', () => {
    test('list returns data for authenticated user', async () => {
      const res = await request(app)
        .get('/api/mistakes')
        .set(DEMO_HEADERS);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/mistakes/aggregates', () => {
    test('aggregates returns correct shape', async () => {
      const res = await request(app)
        .get('/api/mistakes/aggregates')
        .set(DEMO_HEADERS);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('total');
      // Local store uses byCategory; MongoDB route uses byMistakeType — both expose aggregate data
      const hasAggregate = res.body.data.byMistakeType || res.body.data.byCategory;
      expect(hasAggregate).toBeDefined();
    });
  });

  describe('Field mapping — mock test auto-save fields', () => {
    test('userAnswer field is accepted (not dropped)', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          questionText: 'CN — TCP header',
          correctAnswer: '20',
          userAnswer: '15',
          mistakeType: 'concept_mistake',
          sourceTest: 'mock-test',
          subject: 'CN',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.userAnswer).toBe('15');
      expect(res.body.data.sourceTest).toBe('mock-test');
    });

    test('mistakeType field is accepted (not category)', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          questionText: 'OS — Scheduling',
          mistakeType: 'silly_mistake',
          subject: 'OS',
          mistake: 'Read the question wrong',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.mistakeType).toBe('silly_mistake');
    });

    test('mistake field maps to learning in DB', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          subject: 'CD',
          mistake: 'Lexical analysis confusion',
          questionText: 'CD — Compiler Design',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.learning).toBe('Lexical analysis confusion');
    });

    test('correctConcept field maps to reason in DB', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({
          subject: 'GA',
          mistake: 'Formula error',
          correctConcept: 'Use sum of AP series formula',
          questionText: 'GA — Arithmetic',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.reason).toBe('Use sum of AP series formula');
    });

    test('default mistakeType is concept_mistake when not provided', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'CO', mistake: 'Pipeline hazard', questionText: 'CO — Pipelining' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.mistakeType).toBe('concept_mistake');
    });
  });

  describe('User ownership', () => {
    test('demo user gets demo_user_id as owner', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'EngMath', mistake: 'Integration by parts', questionText: 'Math — Calculus' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user).toBe('demo_user_id');
    });
  });

  describe('No blob: URL persisted', () => {
    test('create without image has empty questionImage', async () => {
      const res = await request(app)
        .post('/api/mistakes')
        .set(DEMO_HEADERS)
        .send({ subject: 'CN', mistake: 'No image test', questionText: 'CN test' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.questionImage).toBe('');
    });
  });
});
