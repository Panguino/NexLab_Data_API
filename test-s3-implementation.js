/**
 * Test script to verify S3 alert history implementation
 * This script tests the archiveAlertsToS3 module with mock data
 */

require('dotenv').config();
const NodeCache = require('node-cache');
const archiveAlertsToS3 = require('./src/util/jobs/archiveAlertsToS3');

// Create mock cache with sample data
const cache = new NodeCache({ useClones: false });

// Create mock region data
const mockRegionData = {
  CONUS: {
    name: 'Continental United States',
    states: {
      FL: {
        properties: { STATE: 'FL' },
        counties: {
          '12086': {
            properties: {
              FIPS: '12086',
              COUNTYNAME: 'Miami-Dade',
              LAT: 25.7617,
              LON: -80.1918,
            },
            alerts: {
              'alert-1': {
                id: 'alert-1',
                properties: {
                  event: 'Tornado Warning',
                  sent: new Date().toISOString(),
                  effective: new Date().toISOString(),
                  onset: new Date().toISOString(),
                  expires: new Date(Date.now() + 3600000).toISOString(),
                  ends: new Date(Date.now() + 3600000).toISOString(),
                  headline: 'Tornado Warning issued',
                  description: 'A tornado warning has been issued',
                  areaDesc: 'Miami-Dade County',
                  severity: 'Extreme',
                  certainty: 'Observed',
                  urgency: 'Immediate',
                },
              },
            },
          },
        },
      },
    },
    coasts: {
      'coast-1': {
        properties: {
          ID: 'AMZ001',
          NAME: 'Atlantic Coast',
          LAT: 28.5,
          LON: -80.0,
        },
        alerts: {
          'alert-2': {
            id: 'alert-2',
            properties: {
              event: 'Marine Warning',
              sent: new Date().toISOString(),
              effective: new Date().toISOString(),
              onset: new Date().toISOString(),
              expires: new Date(Date.now() + 3600000).toISOString(),
              ends: new Date(Date.now() + 3600000).toISOString(),
              headline: 'Marine Warning issued',
              description: 'A marine warning has been issued',
              areaDesc: 'Atlantic Waters',
              severity: 'Moderate',
              certainty: 'Likely',
              urgency: 'Expected',
            },
          },
        },
      },
    },
    offshores: {},
  },
  ALASKA: {
    name: 'Alaska',
    states: {},
    coasts: {},
    offshores: {},
  },
};

async function runTests() {
  console.log('🧪 Testing S3 Alert History Implementation\n');

  // Test 1: Check environment variables
  console.log('📋 Test 1: Checking environment variables...');
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_S3_REGION',
    'ENABLE_S3_ARCHIVE',
  ];

  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`  ✅ ${envVar}: ${envVar === 'AWS_SECRET_ACCESS_KEY' ? '***' : value}`);
    } else {
      console.log(`  ❌ ${envVar}: NOT SET`);
      envVarsOk = false;
    }
  }

  if (!envVarsOk) {
    console.log('\n⚠️  Some environment variables are missing. Please check your .env file.\n');
    return;
  }

  // Test 2: Set up mock cache
  console.log('\n📋 Test 2: Setting up mock cache...');
  cache.set('regionData', mockRegionData);
  const cachedData = cache.get('regionData');
  if (cachedData) {
    console.log('  ✅ Mock data cached successfully');
  } else {
    console.log('  ❌ Failed to cache mock data');
    return;
  }

  // Test 3: Test archiveAlertsToS3 function
  console.log('\n📋 Test 3: Testing archiveAlertsToS3 function...');
  try {
    const result = await archiveAlertsToS3(cache);
    if (result.success) {
      console.log(`  ✅ Archive successful`);
      console.log(`     - S3 Key: ${result.s3Key}`);
      console.log(`     - Alerts Count: ${result.alertsCount}`);
      console.log(`     - Timestamp: ${result.timestamp}`);
    } else {
      console.log(`  ⚠️  Archive warning: ${result.message}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error during archive: ${error.message}`);
  }

  // Test 4: Verify module exports
  console.log('\n📋 Test 4: Verifying module exports...');
  try {
    const alertHistoryRouter = require('./src/routes/alertHistory');
    if (alertHistoryRouter) {
      console.log('  ✅ alertHistory router loaded successfully');
    }
  } catch (error) {
    console.log(`  ❌ Failed to load alertHistory router: ${error.message}`);
  }

  try {
    const schedule = require('./schedule');
    if (schedule && schedule.setup) {
      console.log('  ✅ schedule module loaded successfully');
    }
  } catch (error) {
    console.log(`  ❌ Failed to load schedule module: ${error.message}`);
  }

  console.log('\n✅ All tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

