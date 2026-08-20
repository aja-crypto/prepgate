const mongoose = require('mongoose');
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gate2027';

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  console.log('Connected');
  
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(process.env.OWNER_PASSWORD || 'change-me', 12);
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
