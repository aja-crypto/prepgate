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
    let existing = null;
    try {
      if (typeof EmailDelivery.findOne === 'function') {
        const q1 = EmailDelivery.findOne({ eventKey: key });
        existing = await (q1?.lean ? q1.lean() : q1);
      }
    } catch {}

    // Already being sent by another process — don't claim.
    if (existing?.status === 'sending') {
      return { claimed: false, record: existing };
    }
    // Already delivered — don't re-send.
    if (existing?.status === 'sent') {
      return { claimed: false, record: existing };
    }

    // Step 2: Upsert — insert if new, or update if failed.
    // No $or in the filter — avoids MongoDB WriteConflict (error 40) with
    // the unique index on eventKey. The pre-check above already filtered out
    // 'sending' and 'sent' statuses, so we can safely set status='sending'.
    const record = await EmailDelivery.findOneAndUpdate(
      { eventKey: key },
      {
        $setOnInsert: {
          eventKey: key,
          type,
          eventId: String(eventId),
          recipient: maskRecipient(to),
        },
        $set: { status: 'sending', errorCode: null, errorMessage: null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (record?.status !== 'sending') return { claimed: false, record };
    return { claimed: true, record };
  } catch (error) {
    // 11000 = duplicate key (concurrent upsert raced and lost)
    // 40    = WriteConflict from WiredTiger (upsert + unique index conflict)
    if (error?.code === 11000 || error?.code === 40) {
      try {
        if (typeof EmailDelivery.findOne === 'function') {
          const qf = EmailDelivery.findOne({ eventKey: key });
          const fallback = await (qf?.lean ? qf.lean() : qf);
          return { claimed: false, record: fallback };
        }
      } catch {}
      return { claimed: false, record: null };
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

module.exports = { sendTransactionalEmail, claimDelivery, tokenEventId, maskRecipient };
