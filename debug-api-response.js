/**
 * Debug API response to see what's being returned
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

async function debug() {
  try {
    console.log('Fetching API response...\n');
    const response = await makeRequest('/api/alerts/history/last?hours=24');

    console.log('Response structure:');
    console.log(`  - success: ${response.success}`);
    console.log(`  - message: ${response.message}`);
    console.log(`  - alerts count: ${Object.keys(response.data.alerts).length}\n`);

    // Get first alert
    const firstAlertId = Object.keys(response.data.alerts)[0];
    const firstAlert = response.data.alerts[firstAlertId];

    console.log('First alert details:');
    console.log(JSON.stringify(firstAlert, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debug();

