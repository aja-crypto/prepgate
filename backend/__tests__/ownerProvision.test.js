// Focused unit tests for Batch 1B — owner provisioning must never mutate an
// existing owner's password/role at startup, while fresh-DB provisioning remains.
// Target: backend/src/services/ownerProvision.js
const { provisionOwner } = require('../src/services/ownerProvision');

const OWNER_PASSWORD = 'S3cr3t!OwnerPass';
const OWNER_EMAIL = 'purruajaykumar@gmail.com';

// Mock model factories
const makeAdminModel = ({ existing = null } = {}) => ({
  findOne: jest.fn().mockResolvedValue(existing),
  create: jest.fn(async (d) => d),
});

const makeUserModel = ({ existing = null } = {}) => ({
  findOne: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(existing) }),
  create: jest.fn(async (d) => d),
});

describe('Batch 1B — owner provisioning (no boot-time password mutation)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('existing owner + OWNER_PASSWORD → password/role unchanged (Admin & User never written)', async () => {
    const existingAdmin = { email: OWNER_EMAIL };
    const existingUser = { email: OWNER_EMAIL };
    const Admin = makeAdminModel({ existing: existingAdmin });
    const User = makeUserModel({ existing: existingUser });

    const res = await provisionOwner({ Admin, User, ownerPassword: OWNER_PASSWORD });

    expect(Admin.create).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(res).toEqual({ adminCreated: false, userCreated: false });
    // Existing docs must not be touched (no save on the found doc).
    expect(existingAdmin).toEqual({ email: OWNER_EMAIL });
    expect(existingUser).toEqual({ email: OWNER_EMAIL });
  });

  test('existing owner without OWNER_PASSWORD → unchanged', async () => {
    const Admin = makeAdminModel({ existing: { email: OWNER_EMAIL } });
    const User = makeUserModel({ existing: { email: OWNER_EMAIL } });

    const res = await provisionOwner({ Admin, User, ownerPassword: undefined });

    expect(Admin.create).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(res).toEqual({ adminCreated: false, userCreated: false });
  });

  test('fresh DB → provisions owner ONCE in Admin and User models', async () => {
    const Admin = makeAdminModel({ existing: null });
    const User = makeUserModel({ existing: null });

    const res = await provisionOwner({ Admin, User, ownerPassword: OWNER_PASSWORD });

    expect(res).toEqual({ adminCreated: true, userCreated: true });
    expect(Admin.create).toHaveBeenCalledTimes(1);
    expect(User.create).toHaveBeenCalledTimes(1);
    expect(Admin.findOne).toHaveBeenCalledWith({ email: OWNER_EMAIL });
  });

  test('fresh DB → owner created with correct role/permissions fields', async () => {
    const Admin = makeAdminModel();
    const User = makeUserModel();

    await provisionOwner({ Admin, User, ownerPassword: OWNER_PASSWORD });

    expect(Admin.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Owner', email: OWNER_EMAIL, role: 'super_admin', isActive: true,
    }));
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Owner', email: OWNER_EMAIL, role: 'owner', isPremium: true,
    }));
  });

  test('fresh DB → provisioned User payload still supports normal login (email+password+role present)', async () => {
    const User = makeUserModel();
    await provisionOwner({ Admin: makeAdminModel(), User, ownerPassword: OWNER_PASSWORD });
    const created = User.create.mock.calls[0][0];
    expect(created).toHaveProperty('email', OWNER_EMAIL);
    expect(created).toHaveProperty('password', OWNER_PASSWORD);
    expect(created).toHaveProperty('role', 'owner');
  });

  test('no owner password/secret appears in any console output during provisioning', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Admin = makeAdminModel();
    const User = makeUserModel();
    await provisionOwner({ Admin, User, ownerPassword: OWNER_PASSWORD });

    const allOutput = [
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errSpy.mock.calls,
    ].flat().join(' ');
    expect(allOutput).not.toContain(OWNER_PASSWORD);
  });
});