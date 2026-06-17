const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, '../../data/local_admins.json');

let admins = [];

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      admins = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    admins = [];
  }
}

function save() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(admins, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save local admins:', e.message);
  }
}

load();

function findAdminByEmail(email) {
  const lower = email.toLowerCase().trim();
  return admins.find(a => a.email === lower);
}

function findAdminById(id) {
  return admins.find(a => a._id === id);
}

async function createAdmin({ name, email, password, role, permissions }) {
  const lower = email.toLowerCase().trim();
  if (admins.find(a => a.email === lower)) {
    throw new Error('Admin with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = {
    _id: crypto.randomBytes(12).toString('hex'),
    name,
    email: lower,
    passwordHash,
    role: role || 'super_admin',
    permissions: permissions || ['users.manage', 'content.manage', 'mocks.manage', 'analytics.view', 'settings.manage'],
    isActive: true,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  admins.push(admin);
  save();
  return { ...admin, passwordHash: undefined };
}

async function updateAdminLastLogin(id) {
  const admin = admins.find(a => a._id === id);
  if (admin) {
    admin.lastLogin = new Date().toISOString();
    save();
  }
}

async function comparePassword(admin, candidate) {
  return bcrypt.compare(candidate, admin.passwordHash);
}

function sanitize(admin) {
  if (!admin) return null;
  const { passwordHash, ...rest } = admin;
  return rest;
}

module.exports = {
  load, save,
  findAdminByEmail,
  findAdminById,
  createAdmin,
  updateAdminLastLogin,
  comparePassword,
  sanitize,
  get admins() { return admins; },
};
