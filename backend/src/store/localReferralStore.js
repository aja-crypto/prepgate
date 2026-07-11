const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '../../data/local_referrals.json');

let referrals = [];

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      referrals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    referrals = [];
  }
}

function save() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(referrals, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save local referrals:', e.message);
  }
}

load();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (referrals.find(r => r.referralCode === code));
  return code;
}

function getOrCreateReferral(userId, email) {
  let ref = referrals.find(r => r.userId === userId);
  if (!ref) {
    ref = {
      userId,
      email,
      referralCode: generateCode(),
      referralCount: 0,
      isPremium: false,
      premiumUnlockedViaReferral: false,
      referredUsers: [],
      pendingReferrals: [],
      createdAt: new Date().toISOString(),
    };
    referrals.push(ref);
    save();
  }
  return { ...ref };
}

function getReferralByCode(code) {
  return referrals.find(r => r.referralCode === code);
}

function getReferralByUserId(userId) {
  return referrals.find(r => r.userId === userId);
}

function claimReferral(code, newUserId, newUserEmail) {
  const ref = referrals.find(r => r.referralCode === code);
  if (!ref) return { error: 'Invalid referral code.' };
  if (ref.userId === newUserId) return { error: 'You cannot refer yourself.' };
  if (ref.pendingReferrals.includes(newUserId) || ref.referredUsers.includes(newUserId)) {
    return { error: 'Already referred this user.' };
  }
  ref.pendingReferrals.push(newUserId);
  save();
  return { success: true };
}

function completeReferral(referrerUserId, newUserId) {
  // If referrerUserId is null, find referrer by scanning pendingReferrals
  if (!referrerUserId) {
    const found = referrals.find(r => r.pendingReferrals.includes(newUserId));
    if (found) return completeReferral(found.userId, newUserId);
    return { error: 'Referrer not found.' };
  }
  const ref = referrals.find(r => r.userId === referrerUserId);
  if (!ref) {
    // Try scanning all referrals for this newUserId in pending
    const found = referrals.find(r => r.pendingReferrals.includes(newUserId));
    if (found) return completeReferral(found.userId, newUserId);
    return { error: 'Referrer not found.' };
  }
  const idx = ref.pendingReferrals.indexOf(newUserId);
  if (idx === -1) return { error: 'No pending referral found.' };
  ref.pendingReferrals.splice(idx, 1);
  if (!ref.referredUsers.includes(newUserId)) {
    ref.referredUsers.push(newUserId);
    ref.referralCount += 1;
  }
  // Auto-unlock premium at 2 referrals
  if (ref.referralCount >= 2 && !ref.isPremium) {
    ref.isPremium = true;
    ref.premiumUnlockedViaReferral = true;
  }
  save();
  return { success: true, referralCount: ref.referralCount, isPremium: ref.isPremium };
}

function getReferralStatus(userId) {
  const ref = referrals.find(r => r.userId === userId);
  if (!ref) {
    return { referralCode: null, referralCount: 0, isPremium: false, pendingCount: 0, progress: 0 };
  }
  return {
    referralCode: ref.referralCode,
    referralCount: ref.referralCount,
    isPremium: ref.isPremium,
    premiumUnlockedViaReferral: ref.premiumUnlockedViaReferral,
    pendingCount: ref.pendingReferrals.length,
    progress: Math.min(100, (ref.referralCount / 2) * 100),
    targetReferrals: 2,
  };
}

function getReferralHistory(userId) {
  const ref = referrals.find(r => r.userId === userId);
  if (!ref) return [];
  const history = [];
  for (const uid of ref.referredUsers) {
    history.push({ userId: uid, status: 'successful', date: new Date().toISOString() });
  }
  for (const uid of ref.pendingReferrals) {
    history.push({ userId: uid, status: 'pending', date: new Date().toISOString() });
  }
  return history;
}

module.exports = {
  load, save,
  getOrCreateReferral,
  getReferralByCode,
  getReferralByUserId,
  claimReferral,
  completeReferral,
  getReferralStatus,
  getReferralHistory,
};
