const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getEmptyProgressData } = require('../utils/emptyProgress');

const USERS_FILE = path.join(__dirname, '../../data/mock_users.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(USERS_FILE))) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
}

let usersByEmail = new Map();
let usersById = new Map();

function saveUsersToDisk() {
  try {
    const data = Array.from(usersById.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save mock users:', err.message);
    throw err;
  }
}

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      data.forEach(u => {
        u.comparePassword = async (entered) => bcrypt.compare(entered, u.password);
        u.updateStreak = function () {
          const today = new Date().setHours(0, 0, 0, 0);
          const lastDate = this.streak.lastStudyDate
            ? new Date(this.streak.lastStudyDate).setHours(0, 0, 0, 0)
            : null;
          if (lastDate === today) return;
          const yesterday = today - 86400000;
          this.streak.current = lastDate === yesterday ? this.streak.current + 1 : 1;
          if (this.streak.current > this.streak.longest) this.streak.longest = this.streak.current;
          this.streak.lastStudyDate = new Date();
        };
        u.save = async function () { saveUsersToDisk(); return this; };
        if (u.nexaPredictorTestUses === undefined) u.nexaPredictorTestUses = 0;
        usersByEmail.set(u.email, u);
        usersById.set(u._id, u);
      });
    }
  } catch (err) {
    console.error('Failed to load mock users:', err.message);
  }
}

loadUsersFromDisk();

(async () => { await seedDemoUser(); })();

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isPremium: user.isPremium ?? false,
  streak: user.streak,
  preferences: user.preferences,
  targetYear: user.targetYear,
  studyGoalHours: user.studyGoalHours,
  isVerified: user.isVerified ?? false,
  authProvider: user.authProvider || 'local',
  nexaPredictorTestUses: user.nexaPredictorTestUses || 0,
});

const createMockUser = async ({ name, email, password, role = 'user' }) => {
  const _id = crypto.randomUUID();
  const hashed = await bcrypt.hash(password, 12);
  const emptyData = getEmptyProgressData();
  const user = {
    _id,
    name,
    email: email.toLowerCase(),
    password: hashed,
    role,
    authProvider: 'local',
    isVerified: true,
    googleId: null,
    streak: { current: 0, longest: 0, lastStudyDate: null },
    preferences: { theme: 'dark', notifications: true },
    targetYear: 2027,
    studyGoalHours: 8,
    progressBackup: { data: emptyData, updatedAt: new Date() },
    fcmToken: null,
    nexaPredictorTestUses: 0,
    comparePassword: async (entered) => bcrypt.compare(entered, hashed),
    updateStreak() {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastDate = this.streak.lastStudyDate
        ? new Date(this.streak.lastStudyDate).setHours(0, 0, 0, 0)
        : null;
      if (lastDate === today) return;
      const yesterday = today - 86400000;
      this.streak.current = lastDate === yesterday ? this.streak.current + 1 : 1;
      if (this.streak.current > this.streak.longest) this.streak.longest = this.streak.current;
      this.streak.lastStudyDate = new Date();
    },
    save: async function () { 
      saveUsersToDisk();
      return this; 
    },
  };
  usersByEmail.set(user.email, user);
  usersById.set(_id, user);
  saveUsersToDisk();
  return user;
};

const deleteUser = (id) => {
  const user = usersById.get(id);
  if (user) {
    usersByEmail.delete(user.email);
    usersById.delete(id);
  }
};

async function seedDemoUser() {
  const pwHash = await bcrypt.hash('demo1234', 10);
  function demoUser(id, name, email, role, isPremium = false) {
    const d = getEmptyProgressData();
    return {
      _id: id, name, email, password: pwHash, role, isPremium,
      authProvider: 'local', isVerified: true, googleId: null,
      streak: { current: 0, longest: 0, lastStudyDate: null }, preferences: { theme: 'dark', notifications: true },
      targetYear: 2027, studyGoalHours: 8, progressBackup: { data: d, updatedAt: new Date() }, fcmToken: null,
      nexaPredictorTestUses: 0,
      comparePassword: async (entered) => bcrypt.compare(entered, pwHash),
      updateStreak() { this.streak.current++; this.streak.lastStudyDate = new Date(); return this; },
      save: async function () { saveUsersToDisk(); return this; },
    };
  }
  // Seed accounts: preserve existing roles/premium from disk, create if missing
  const OWNER_EMAIL = 'purruajaykumar@gmail.com';
  const DEMO_EMAIL = 'demo@gate2027.in';
  const ADMIN_EMAIL = 'owner@test.com';
  const PREMIUM_EMAIL = 'premium@test.com';
  const BASIC_EMAIL = 'basic@test.com';

  // Ensure owner and demo always have correct access
  for (const [email, user] of usersByEmail) {
    if (email === OWNER_EMAIL) {
      if (user.role !== 'owner' || user.isPremium !== true) {
        user.role = 'owner';
        user.isPremium = true;
      }
    } else if (email === DEMO_EMAIL) {
      user.isPremium = false;
      user.role = 'user';
    }
    if (user.nexaPredictorTestUses === undefined) user.nexaPredictorTestUses = 0;
  }

  // Create seed accounts if missing
  if (!usersByEmail.get(DEMO_EMAIL)) {
    const u = demoUser(crypto.randomUUID(), 'Demo Student', DEMO_EMAIL, 'user', false);
    usersByEmail.set(u.email, u); usersById.set(u._id, u);
  }
  if (!usersByEmail.get(OWNER_EMAIL)) {
    const u = demoUser(crypto.randomUUID(), 'Puru Ajay Kumar', OWNER_EMAIL, 'owner', true);
    usersByEmail.set(u.email, u); usersById.set(u._id, u);
  }
  if (!usersByEmail.get(ADMIN_EMAIL)) {
    const u = demoUser(crypto.randomUUID(), 'Owner Admin', ADMIN_EMAIL, 'admin', true);
    usersByEmail.set(u.email, u); usersById.set(u._id, u);
  }
  if (!usersByEmail.get(PREMIUM_EMAIL)) {
    const u = demoUser(crypto.randomUUID(), 'Premium Student', PREMIUM_EMAIL, 'user', true);
    usersByEmail.set(u.email, u); usersById.set(u._id, u);
  }
  if (!usersByEmail.get(BASIC_EMAIL)) {
    const u = demoUser(crypto.randomUUID(), 'Basic Student', BASIC_EMAIL, 'user', false);
    usersByEmail.set(u.email, u); usersById.set(u._id, u);
  }
  saveUsersToDisk();
}

const findByEmail = (email) => usersByEmail.get(email.toLowerCase()) || null;
const findById = (id) => usersById.get(id) || null;
const emailExists = (email) => usersByEmail.has(email.toLowerCase());

module.exports = {
  seedDemoUser,
  createMockUser,
  findByEmail,
  findById,
  emailExists,
  formatUser,
  deleteUser,
};
