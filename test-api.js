// Quick API connection test script
const https = require('http');

const testEndpoint = (url, name) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name,
          status: res.statusCode,
          success: res.statusCode === 200,
          dataLength: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });
  });
};

const runTests = async () => {
  console.log('🔄 Testing API connections...\n');
  
  const tests = [
    testEndpoint('http://localhost:8000/api/products/', 'Products'),
    testEndpoint('http://localhost:8000/api/customers/', 'Customers'),
    testEndpoint('http://localhost:8000/api/orders/', 'Orders'),
    testEndpoint('http://localhost:8000/api/dashboard-summary/', 'Dashboard')
  ];
  
  const results = await Promise.all(tests);
  
  console.log('📊 Connection Test Results:');
  console.log('================================');
  
  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.success) {
      console.log(`   Data received: ${result.dataLength} bytes`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Summary: ${successCount}/${results.length} endpoints working`);
  
  if (successCount === results.length) {
    console.log('🎉 All API endpoints are working correctly!');
    console.log('✅ Django backend is ready for React frontend integration');
  } else {
    console.log('⚠️  Some API endpoints have issues - needs investigation');
  }
};

runTests().catch(console.error);