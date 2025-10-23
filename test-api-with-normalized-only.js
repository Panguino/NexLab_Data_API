/**
 * Test API with ONLY normalized snapshots (today's date)
 */

const http = require('http');

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

async function test() {
  try {
    console.log('═'.repeat(80));
    console.log('TEST: API with Normalized Snapshots');
    console.log('═'.repeat(80) + '\n');

    // Get today's date
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    console.log(`📅 Testing with today's date: ${date}\n`);

    // Query the optimized endpoint for today
    console.log('🔍 Querying /api/alerts/history/optimized?date=' + date + '\n');
    const response = await makeRequest(`/api/alerts/history/optimized?date=${date}`);

    console.log(`Status: ${response.success ? '✅' : '❌'}`);
    console.log(`Message: ${response.message}`);
    console.log(`Alerts found: ${Object.keys(response.data.alerts).length}\n`);

    if (Object.keys(response.data.alerts).length > 0) {
      // Get first alert
      const firstAlertId = Object.keys(response.data.alerts)[0];
      const firstAlert = response.data.alerts[firstAlertId];

      console.log('─'.repeat(80));
      console.log('First Alert Details:');
      console.log('─'.repeat(80) + '\n');

      console.log(JSON.stringify(firstAlert, null, 2));

      console.log('\n' + '─'.repeat(80));
      console.log('Structure Analysis:');
      console.log('─'.repeat(80) + '\n');

      if (firstAlert.locations && Array.isArray(firstAlert.locations)) {
        console.log('✅ Normalized structure detected!');
        console.log(`   - Alert has locations array: ${firstAlert.locations.length} locations`);
        console.log(`   - First location: ${JSON.stringify(firstAlert.locations[0])}`);
      } else if (firstAlert.locationId) {
        console.log('⚠️  Old format detected (single location per alert)');
        console.log(`   - locationId: ${firstAlert.locationId}`);
        console.log(`   - locationName: ${firstAlert.locationName}`);
      } else {
        console.log('❌ Unknown format');
      }

      // Count alerts with locations array
      let normalizedCount = 0;
      let oldFormatCount = 0;

      for (const alert of Object.values(response.data.alerts)) {
        if (alert.locations && Array.isArray(alert.locations)) {
          normalizedCount++;
        } else if (alert.locationId) {
          oldFormatCount++;
        }
      }

      console.log('\n' + '─'.repeat(80));
      console.log('Format Distribution:');
      console.log('─'.repeat(80) + '\n');
      console.log(`Normalized format (locations array): ${normalizedCount}`);
      console.log(`Old format (single location): ${oldFormatCount}`);

      console.log('\n' + '═'.repeat(80));
      if (normalizedCount > 0 && oldFormatCount === 0) {
        console.log('✅ ALL ALERTS IN NORMALIZED FORMAT!');
      } else if (normalizedCount > 0) {
        console.log('⚠️  MIXED FORMATS (old and new snapshots)');
      } else {
        console.log('❌ NO NORMALIZED FORMAT FOUND');
      }
      console.log('═'.repeat(80) + '\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

