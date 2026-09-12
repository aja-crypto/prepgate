// Explicit, one-time owner provisioning (Batch 1B).
//
// Called once at boot on a FRESH database. It creates the owner account in the
// Admin model (admin-dashboard auth) and the User model (user-facing /api/auth/login)
// ONLY if the account does not already exist.
//
// An existing owner's password and role are NEVER modified at startup. This
// eliminates the prior production risk where OWNER_PASSWORD reset the owner's
// credentials on every server boot.
//
// This module intentionally performs NO logging, so no credential/secret state
// can be emitted to logs, errors, or tests.

const DEFAULT_OWNER_EMAIL = 'purruajaykumar@gmail.com';

/**
 * Provision the owner account if (and only if) it is missing.
 *
 * @param {object} deps
 * @param {object} [deps.Admin] Mongoose Admin model (exports adminProtect auth)
 * @param {object} [deps.User]  Mongoose User model (exports /api/auth/login auth)
 * @param {string} [deps.ownerEmail] Owner email; defaults to GateNexa owner
 * @param {string} [deps.ownerPassword] Owner password for a brand-new owner
 * @returns {Promise<{adminCreated: boolean, userCreated: boolean}>}
 */
async function provisionOwner({ Admin, User, ownerEmail = DEFAULT_OWNER_EMAIL, ownerPassword } = {}) {
  let adminCreated = false;
  let userCreated = false;

  // Admin model — admin-dashboard owner (super_admin).
  if (Admin && ownerPassword) {
    const existingAdmin = await Admin.findOne({ email: ownerEmail });
    if (!existingAdmin) {
      await Admin.create({
        name: 'Owner', email: ownerEmail,
        passwordHash: ownerPassword, role: 'super_admin', isActive: true,
      });
      adminCreated = true;
    }
  }

  // User model — user-facing owner account so they can log in via /api/auth/login.
  if (User && ownerPassword) {
    const ownerUser = await User.findOne({ email: ownerEmail }).select('+password');
    if (!ownerUser) {
      await User.create({
        name: 'Owner', email: ownerEmail,
        password: ownerPassword, role: 'owner', isPremium: true,
      });
      userCreated = true;
    }
  }

  return { adminCreated, userCreated };
}

module.exports = { provisionOwner, DEFAULT_OWNER_EMAIL };