const {
  aiQuota,
  FREE_DAILY_LIMIT,
  PREMIUM_DAILY_LIMIT,
  getIstDateKey,
} = require('../src/middleware/aiQuota');

const mockUser = {
  _id: 'quota-user',
  email: 'student@example.com',
  isPremium: false,
  aiQuestionsUsed: 0,
  aiQuestionsDate: new Date(),
};

var mockUserModel;
let allowedAdmissions = 0;

jest.mock('../src/config/db', () => ({ isMongoConnected: () => true }));
jest.mock('../src/models/User', () => {
  mockUserModel = {
    findById: jest.fn(() => ({ select: jest.fn().mockResolvedValue(mockUser) })),
    findOneAndUpdate: jest.fn(),
  };
  return mockUserModel;
});

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function quotaRequest() {
  return { user: { _id: mockUser._id } };
}

describe('atomic AI quota admission', () => {
  beforeEach(() => {
    mockUser.isPremium = false;
    mockUser.aiQuestionsUsed = 0;
    mockUser.aiQuestionsDate = new Date();
    mockUserModel.findById.mockClear();
    mockUserModel.findOneAndUpdate.mockClear();
    allowedAdmissions = mockUser.isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
    mockUserModel.findOneAndUpdate.mockImplementation(() => {
      if (allowedAdmissions <= 0) return { lean: () => Promise.resolve(null) };
      allowedAdmissions -= 1;
      mockUser.aiQuestionsUsed += 1;
      return { lean: () => Promise.resolve({ aiQuestionsUsed: mockUser.aiQuestionsUsed }) };
    });
  });

  test('admits exactly the remaining free quota under simultaneous requests', async () => {
    mockUser.aiQuestionsUsed = FREE_DAILY_LIMIT - 2;
    allowedAdmissions = 2;
    const calls = Array.from({ length: 5 }, async () => {
      const res = response();
      let admitted = false;
      await aiQuota(quotaRequest(), res, () => { admitted = true; });
      return admitted;
    });

    const results = await Promise.all(calls);
    expect(results.filter(Boolean)).toHaveLength(2);
    expect(results.filter(Boolean)).not.toHaveLength(3);
    expect(mockUser.aiQuestionsUsed).toBe(FREE_DAILY_LIMIT);
    expect(mockUser.aiQuestionsUsed).toBeGreaterThanOrEqual(0);
  });

  test('uses the premium limit and still rejects the first request over the limit', async () => {
    mockUser.isPremium = true;
    mockUser.aiQuestionsUsed = PREMIUM_DAILY_LIMIT;
    allowedAdmissions = 0;
    const res = response();
    let admitted = false;
    await aiQuota(quotaRequest(), res, () => { admitted = true; });

    expect(admitted).toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.body.data.limit).toBe(PREMIUM_DAILY_LIMIT);
    expect(mockUser.aiQuestionsUsed).toBe(PREMIUM_DAILY_LIMIT);
  });

  test('a downstream AI failure does not create a second quota increment', async () => {
    const res = response();
    let admitted = false;
    await aiQuota(quotaRequest(), res, () => { admitted = true; });

    expect(admitted).toBe(true);
    expect(mockUser.aiQuestionsUsed).toBe(1);
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  test('daily reset key follows the configured IST boundary', () => {
    expect(getIstDateKey(new Date('2026-09-05T18:29:59.000Z'))).toBe('2026-09-05');
    expect(getIstDateKey(new Date('2026-09-05T18:30:00.000Z'))).toBe('2026-09-06');
  });
});
