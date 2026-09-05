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
  }
}

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      data.forEach(u => {
        // Re-attach comparePassword and save methods
        u.comparePassword = async (entered) => bcrypt.compare(entered, u.password);
        u.save = async function () { return this; };
        usersByEmail.set(u.email, u);
        usersById.set(u._id, u);
      });
      console.log(`--- Mock Store: Loaded ${usersById.size} users from disk ---`);
    }
  } catch (err) {
    console.error('Failed to load mock users:', err.message);
  }
}

loadUsersFromDisk();

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  streak: user.streak,
  preferences: user.preferences,
  targetYear: user.targetYear,
  studyGoalHours: user.studyGoalHours,
  isVerified: user.isVerified ?? false,
  authProvider: user.authProvider || 'local',
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

const seedDemoUser = async () => {
  const existing = usersByEmail.get('demo@gate2027.in');
  if (existing) {
    existing.isVerified = true;
    return;
  }
  await createMockUser({
    name: 'Demo Student',
    email: 'demo@gate2027.in',
    password: 'password123',
  });
  console.log('🔑 Mock auth: demo user ready (demo@gate2027.in / password123)');
};

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
