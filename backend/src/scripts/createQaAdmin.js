const localAdminStore = require('../store/localAdminStore');

async function createTestAdmin() {
  try {
    if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is required');
    const admin = await localAdminStore.createAdmin({
      name: 'QA Admin',
      email: 'qaadmin@test.com',
      password: process.env.ADMIN_PASSWORD,
      role: 'super_admin',
    });
    console.log('Admin created:', admin.email, admin.role);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
createTestAdmin();
