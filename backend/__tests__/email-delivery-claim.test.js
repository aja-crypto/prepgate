jest.mock('../src/config/db', () => ({
  isMongoConnected: jest.fn(() => true),
}));

jest.mock('../src/models/EmailDelivery', () => ({
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn(),
}));

const EmailDelivery = require('../src/models/EmailDelivery');
const { sendEmail } = require('../src/utils/email');
const { sendTransactionalEmail } = require('../src/services/emailDeliveryService');

describe('EmailDelivery claim update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EmailDelivery.findOneAndUpdate.mockResolvedValue({
      _id: 'delivery-id',
      status: 'sending',
    });
    EmailDelivery.updateOne.mockResolvedValue({});
    sendEmail.mockResolvedValue({ messageId: 'provider-message-id' });
  });

  test('does not use conflicting status update operators when claiming an event', async () => {
    await sendTransactionalEmail({
      type: 'password-reset',
      eventId: 'event-id',
      to: 'user@example.com',
      subject: 'Reset password',
      html: '<p>Reset</p>',
      text: 'Reset',
      propagateError: true,
    });

    const [, update] = EmailDelivery.findOneAndUpdate.mock.calls[0];
    expect(update.$setOnInsert).not.toHaveProperty('status');
    expect(update.$set.status).toBe('sending');
  });
});
