const mongoose = require('mongoose');
const uri = 'mongodb://gate2027:l2M2shH2nRfQVLFA@ac-pmpdzxm-shard-00-00.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-01.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-02.sa6kujd.mongodb.net:27017/gate2027?ssl=true&replicaSet=atlas-l9vk3z-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  console.log('Connected');
  
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('GateNexa@Owner2026', 12);
  console.log('Hash:', hash.substring(0, 30) + '...');
  
  const coll = mongoose.connection.collection('admins');
  const existing = await coll.findOne({ email: 'purruajaykumar@gmail.com' });
  
  if (existing) {
    await coll.updateOne(
      { email: 'purruajaykumar@gmail.com' },
      { '$set': { passwordHash: hash, role: 'owner' } }
    );
    console.log('Updated owner password');
    
    const verify = await coll.findOne({ email: 'purruajaykumar@gmail.com' });
    const match = await bcrypt.compare('GateNexa@Owner2026', verify.passwordHash);
    console.log('Verify bcrypt match:', match ? 'YES' : 'NO');
  } else {
    await coll.insertOne({
      email: 'purruajaykumar@gmail.com',
      name: 'Owner',
      passwordHash: hash,
      role: 'owner',
      isActive: true
    });
    console.log('Created owner');
  }
  
  await mongoose.disconnect();
}

main().catch(e => { console.log('ERR:', e.message); process.exit(1); });
