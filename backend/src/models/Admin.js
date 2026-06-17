const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['super_admin', 'admin', 'content_manager', 'support'];
const PERMISSIONS = [
  'users.manage',
  'content.manage',
  'mocks.manage',
  'analytics.view',
  'settings.manage',
];

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ROLES, default: 'admin' },
  permissions: [{ type: String, enum: PERMISSIONS }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

adminSchema.methods.hasPermission = function (permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions.includes(permission);
};

adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;
