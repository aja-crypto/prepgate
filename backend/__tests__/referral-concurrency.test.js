const mongoose = require('mongoose');

const childId = new mongoose.Types.ObjectId();
const referrerId = new mongoose.Types.ObjectId();
const currentUser = { _id: childId, referredBy: referrerId };
const referrer = {
  _id: referrerId,
  name: 'Referrer',
  email: 'referrer@example.com',
  referralCount: 2,
  isPremium: false,
};

const mockUserModel = {
  findById: jest.fn().mockResolvedValue(currentUser),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
};
const mockSendTransactionalEmail = jest.fn().mockResolvedValue({ sent: true });

jest.mock('../src/config/db', () => ({ isMongoConnected: () => true }));
jest.mock('../src/models/User', () => mockUserModel);
jest.mock('../src/services/emailDeliveryService', () => ({
  sendTransactionalEmail: mockSendTransactionalEmail,
}));
jest.mock('../src/store/localReferralStore', () => ({
  getOrCreateReferral: jest.fn(),
}));

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

describe('referral completion concurrency', () => {
  let complete;

  beforeAll(() => {
    const router = require('../src/routes/referral');
    const route = router.stack.find(layer => layer.route?.path === '/complete').route;
    complete = route.stack[route.stack.length - 1].handle;
  });

  beforeEach(() => {
    mockUserModel.findById.mockClear();
    mockUserModel.updateOne.mockReset();
    mockUserModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mockSendTransactionalEmail.mockClear();
    let claims = 0;
    mockUserModel.findOneAndUpdate.mockReset();
    mockUserModel.findOneAndUpdate.mockImplementation(async () => {
      claims += 1;
      return claims === 1 ? { ...referrer } : null;
    });
  });

  test('only one simultaneous completion claims the referral and sends Premium email once', async () => {
    const requests = Array.from({ length: 3 }, async () => {
      const res = response();
      await complete({ user: { _id: childId } }, res, jest.fn());
      return res;
    });

    const results = await Promise.all(requests);
    const successfulClaims = results.filter(result => result.body?.referralCount === 2);

    expect(successfulClaims).toHaveLength(1);
    expect(mockUserModel.findOneAndUpdate.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(mockUserModel.updateOne).toHaveBeenCalledTimes(1);
    expect(mockSendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(mockSendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({
      type: 'premium-activation',
      eventId: String(referrerId),
    }));
  });
});
