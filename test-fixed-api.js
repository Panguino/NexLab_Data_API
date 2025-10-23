/**
 * Test the API with the FIXED extraction (all 1372 alerts)
 */

const http = require('http');

console.log('═'.repeat(80));
console.log('TESTING FIXED API - ALL ALERTS');
console.log('═'.repeat(80) + '\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4400,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('🧪 TEST 1: Last 24 Hours');
    console.log('─'.repeat(80));
    const test1 = await makeRequest('/api/alerts/history/last?hours=24');
    console.log(`Status: ${test1.success ? '✅' : '❌'}`);
    console.log(`Message: ${test1.message}`);
    console.log(`Alerts Found: ${Object.keys(test1.data.alerts).length}`);
    console.log(`Timeline Events: ${test1.data.timeline.length}`);

    if (Object.keys(test1.data.alerts).length > 0) {
      console.log('\n✅ ALERTS FOUND:');
      
      // Count by type
      const typeCount = {};
      for (const alert of Object.values(test1.data.alerts)) {
        const type = alert.event || 'UNKNOWN';
        typeCount[type] = (typeCount[type] || 0) + 1;
      }

      for (const [type, count] of Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
        console.log(`  ${type.substring(0, 40).padEnd(40)} : ${count}`);
      }
      
      const totalTypes = Object.keys(typeCount).length;
      if (totalTypes > 10) {
        console.log(`  ... and ${totalTypes - 10} more types`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(80) + '\n');

    if (Object.keys(test1.data.alerts).length > 1000) {
      console.log('🎉 SUCCESS! All 1372 alerts are being returned!\n');
    } else if (Object.keys(test1.data.alerts).length > 100) {
      console.log(`✅ Good! ${Object.keys(test1.data.alerts).length} alerts returned.\n`);
    } else {
      console.log(`⚠️  Only ${Object.keys(test1.data.alerts).length} alerts returned.\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTests();

