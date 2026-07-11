const localAdminStore = require('../store/localAdminStore');

async function createTestAdmin() {
  try {
    const admin = await localAdminStore.createAdmin({
      name: 'QA Admin',
      email: 'qaadmin@test.com',
      password: 'QaAdmin123!',
      role: 'super_admin',
    });
    console.log('Admin created:', admin.email, admin.role);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
createTestAdmin();
