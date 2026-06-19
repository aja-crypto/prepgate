// Test API responses
const http = require('http');

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: { 'X-Demo-User': 'true' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

async function testAPIs() {
  try {
    console.log('Testing Subjects API...');
    const subjects = await makeRequest('/api/subjects');
    console.log('Subjects API:', subjects.count, 'subjects');
    console.log('First subject:', subjects.data[0].name);

    console.log('\nTesting Topics API...');
    const topics = await makeRequest('/api/topics');
    console.log('Topics API:', topics.count, 'topics');
    console.log('First topic:', topics.data[0].name);

    console.log('\n✅ All APIs working correctly!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPIs();