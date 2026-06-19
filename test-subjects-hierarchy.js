// Quick API test
const http = require('http');

const testAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects?hierarchy=true',
      method: 'GET',
      headers: { 'X-Demo-User': 'true' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            data: parsed,
            statusCode: res.statusCode
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

testAPI()
  .then(result => {
    console.log('=== SUBJECTS API TEST (with hierarchy=true) ===');
    console.log('Success:', result.success);
    console.log('Status Code:', result.statusCode);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data?.data?.length) {
      console.log('\n✅ Found', result.data.data.length, 'subjects with hierarchy');
      console.log('Sample subject:', result.data.data[0].name);
      console.log('Topics count:', result.data.overall?.totalTopics || 0);
    } else {
      console.log('\n❌ No data returned');
    }
  })
  .catch(err => {
    console.log('❌ API test failed:', err.message);
  });
