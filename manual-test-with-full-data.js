/**
 * Manual test: Create a test snapshot with full alert data and upload to S3
 * Then test the API endpoints to verify they return the full data
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

// Mock alert data with full information
const mockAlerts = {
  'alert-1': {
    id: 'alert-1',
    event: 'Tornado Warning',
    locationId: '12086',
    locationName: 'Miami-Dade',
    locationType: 'county',
    state: 'FL',
    lat: 25.7617,
    lon: -80.1918,
    sent: '2025-10-23T16:27:30.046Z',
    effective: '2025-10-23T16:27:30.047Z',
    onset: '2025-10-23T16:27:30.047Z',
    expires: '2025-10-23T17:27:30.047Z',
    ends: '2025-10-23T17:27:30.047Z',
    headline: 'Tornado Warning issued',
    description: 'A tornado warning has been issued',
    areaDesc: 'Miami-Dade County',
    severity: 'Extreme',
    certainty: 'Observed',
    urgency: 'Immediate',
  },
  'alert-2': {
    id: 'alert-2',
    event: 'Marine Warning',
    locationId: 'AMZ001',
    locationName: 'Atlantic Coast',
    locationType: 'coast',
    lat: 28.5,
    lon: -80,
    sent: '2025-10-23T16:27:30.047Z',
    effective: '2025-10-23T16:27:30.047Z',
    onset: '2025-10-23T16:27:30.047Z',
    expires: '2025-10-23T17:27:30.047Z',
    ends: '2025-10-23T17:27:30.047Z',
    headline: 'Marine Warning issued',
    description: 'A marine warning has been issued',
    areaDesc: 'Atlantic Waters',
    severity: 'Moderate',
    certainty: 'Likely',
    urgency: 'Expected',
  },
};

// Create optimized snapshot with full alert data
function createTestSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    snapshot_id: uuidv4(),
    alerts_count: Object.keys(mockAlerts).length,
    new_count: 2,
    unchanged_count: 0,
    expired_count: 0,
    // Full alert data section
    alert_data: mockAlerts,
    // Status tracking section
    alerts: {
      'alert-1': { id: 'alert-1', status: 'new' },
      'alert-2': { id: 'alert-2', status: 'new' },
    },
  };
}

// Upload snapshot to S3
async function uploadTestSnapshot() {
  try {
    console.log('📤 Uploading test snapshot to S3...\n');

    const snapshot = createTestSnapshot();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    const key = `alerts-optimized/${year}/${month}/${day}/${hours}-${minutes}-${seconds}.json`;

    console.log(`Key: ${key}`);
    console.log(`Snapshot ID: ${snapshot.snapshot_id}`);
    console.log(`Alerts: ${snapshot.alerts_count}`);
    console.log(`New: ${snapshot.new_count}, Unchanged: ${snapshot.unchanged_count}, Expired: ${snapshot.expired_count}`);
    console.log(`Has alert_data: ${!!snapshot.alert_data}`);
    console.log(`Has alerts: ${!!snapshot.alerts}\n`);

    await s3
      .putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: JSON.stringify(snapshot, null, 2),
        ContentType: 'application/json',
      })
      .promise();

    console.log('✅ Snapshot uploaded successfully!\n');
    return key;
  } catch (error) {
    console.error('❌ Error uploading snapshot:', error.message);
    throw error;
  }
}

// Test API endpoint
function testEndpoint(path) {
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

// Main test
async function runManualTest() {
  try {
    console.log('═'.repeat(80));
    console.log('MANUAL TEST: Full Alert Data');
    console.log('═'.repeat(80) + '\n');

    // Step 1: Upload test snapshot
    await uploadTestSnapshot();

    // Step 2: Wait a moment for S3 to be consistent
    console.log('⏳ Waiting for S3 consistency...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Test the endpoints
    console.log('\n🧪 Testing API Endpoints\n');
    console.log('─'.repeat(80));

    console.log('\n📍 Test 1: /api/alerts/history/last?hours=1');
    const test1 = await testEndpoint('/api/alerts/history/last?hours=1');
    console.log(`Status: ${test1.success ? '✅' : '❌'}`);
    console.log(`Message: ${test1.message}`);
    console.log(`Alerts Found: ${Object.keys(test1.data.alerts).length}`);

    if (Object.keys(test1.data.alerts).length > 0) {
      console.log('\n✅ ALERTS RETURNED:');
      for (const [id, alert] of Object.entries(test1.data.alerts)) {
        console.log(`\n  Alert ID: ${id}`);
        console.log(`  Event: ${alert.event}`);
        console.log(`  Headline: ${alert.headline}`);
        console.log(`  Area: ${alert.areaDesc}`);
        console.log(`  Severity: ${alert.severity}`);
        console.log(`  Urgency: ${alert.urgency}`);
      }
    } else {
      console.log('\n⚠️  No alerts in response');
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📍 Test 2: /api/alerts/history/optimized?date=2025-10-23');
    const test2 = await testEndpoint('/api/alerts/history/optimized?date=2025-10-23');
    console.log(`Status: ${test2.success ? '✅' : '❌'}`);
    console.log(`Message: ${test2.message}`);
    console.log(`Alerts Found: ${Object.keys(test2.data.alerts).length}`);
    console.log(`Timeline Snapshots: ${test2.data.timeline.length}`);

    if (Object.keys(test2.data.alerts).length > 0) {
      console.log('\n✅ ALERTS RETURNED:');
      for (const [id, alert] of Object.entries(test2.data.alerts)) {
        console.log(`  - ${id}: ${alert.event}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ MANUAL TEST COMPLETE');
    console.log('═'.repeat(80) + '\n');

    if (Object.keys(test1.data.alerts).length > 0) {
      console.log('🎉 SUCCESS! Full alert data is being returned correctly!\n');
    } else {
      console.log('⚠️  Alerts not yet in response (may need to wait for cache refresh)\n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runManualTest();

