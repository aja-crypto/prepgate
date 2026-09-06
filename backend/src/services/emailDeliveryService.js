const crypto = require('crypto');
const { isMongoConnected } = require('../config/db');
const EmailDelivery = require('../models/EmailDelivery');
const { sendEmail } = require('../utils/email');

function maskRecipient(value) {
  const email = String(value || '');
  const at = email.indexOf('@');
  return at > 1 ? `${email[0]}***${email.slice(at)}` : '***';
}

function safeError(error) {
  return {
    code: String(error?.code || error?.name || 'send_failed').slice(0, 80),
    message: String(error?.message || 'Email delivery failed')
      .replace(/[\r\n]+/g, ' ')
      .slice(0, 240),
  };
}

function eventKey(type, eventId) {
  return `${type}:${eventId}`;
}

async function claimDelivery({ type, eventId, to }) {
  if (!isMongoConnected()) return { claimed: true, record: null };

  const key = eventKey(type, eventId);
  try {
    const record = await EmailDelivery.findOneAndUpdate(
      {
        eventKey: key,
        $or: [{ status: 'failed' }, { status: { $exists: false } }],
      },
      {
        $setOnInsert: {
          eventKey: key,
          type,
          eventId: String(eventId),
          recipient: maskRecipient(to),
          status: 'sending',
        },
        $set: { status: 'sending', errorCode: null, errorMessage: null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (record?.status !== 'sending') return { claimed: false, record };
    return { claimed: true, record };
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await EmailDelivery.findOne({ eventKey: key }).lean();
      return { claimed: false, record: existing };
    }
    throw error;
  }
}

async function sendTransactionalEmail({
  type,
  eventId,
  to,
  subject,
  html,
  text,
  propagateError = false,
}) {
  if (!type || !eventId || !to) {
    throw new Error('Email delivery requires a type, eventId, and recipient.');
  }

  let claim;
  try {
    claim = await claimDelivery({ type, eventId, to });
  } catch (error) {
    const safe = safeError(error);
    console.error(`[email] type=${type} status=claim_failed recipient=${maskRecipient(to)} event=${String(eventId).slice(0, 120)} error=${safe.code}`);
    if (propagateError) throw error;
    return { sent: false, error: safe.code };
  }
  if (!claim.claimed) {
    console.log(`[email] type=${type} status=duplicate recipient=${maskRecipient(to)} event=${String(eventId).slice(0, 120)}`);
    return { sent: false, duplicate: true, record: claim.record };
  }

  try {
    const info = await sendEmail({ to, subject, html, text, type, eventId });
    if (claim.record) {
      try {
        await EmailDelivery.updateOne(
          { _id: claim.record._id },
          { $set: { status: 'sent', providerMessageId: String(info?.messageId || '').slice(0, 240), sentAt: new Date() } }
        );
      } catch (recordError) {
        const safe = safeError(recordError);
        console.error(`[email] type=${type} status=record_update_failed recipient=${maskRecipient(to)} event=${String(eventId).slice(0, 120)} error=${safe.code}`);
      }
    }
    return { sent: true, info };
  } catch (error) {
    const safe = safeError(error);
    if (claim.record) {
      try {
        await EmailDelivery.updateOne(
          { _id: claim.record._id },
          { $set: { status: 'failed', errorCode: safe.code, errorMessage: safe.message } }
        );
      } catch (recordError) {
        const recordSafe = safeError(recordError);
        console.error(`[email] type=${type} status=record_update_failed recipient=${maskRecipient(to)} event=${String(eventId).slice(0, 120)} error=${recordSafe.code}`);
      }
    }
    console.error(`[email] type=${type} status=failed recipient=${maskRecipient(to)} event=${String(eventId).slice(0, 120)} error=${safe.code}`);
    if (propagateError) throw error;
    return { sent: false, error: safe.code };
  }
}

function tokenEventId(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { sendTransactionalEmail, tokenEventId, maskRecipient };
