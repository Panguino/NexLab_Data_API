/**
 * Check the structure of the snapshot
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

async function checkStructure() {
  try {
    console.log('📋 Checking snapshot structure...\n');

    // Get the latest snapshot
    const key = 'alerts-optimized/2025/10/23/19-30-20.json';

    const data = await s3
      .getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
      .promise();

    const snapshot = JSON.parse(data.Body.toString());

    console.log('Snapshot Structure:');
    console.log('─'.repeat(80));
    console.log(`Total alerts: ${snapshot.alerts_count}`);
    console.log(`New: ${snapshot.new_count}, Unchanged: ${snapshot.unchanged_count}, Expired: ${snapshot.expired_count}`);
    console.log(`Timestamp: ${snapshot.timestamp}\n`);

    // Check alert_data structure
    console.log('alert_data section:');
    const firstAlertKey = Object.keys(snapshot.alert_data)[0];
    const firstAlert = snapshot.alert_data[firstAlertKey];

    console.log(`  Key format: "${firstAlertKey}"`);
    console.log(`  Alert structure:`);
    console.log(`    - id: ${firstAlert.id}`);
    console.log(`    - compositeKey: ${firstAlert.compositeKey}`);
    console.log(`    - event: ${firstAlert.event}`);
    console.log(`    - locationId: ${firstAlert.locationId}`);
    console.log(`    - locationName: ${firstAlert.locationName}`);
    console.log(`    - locationType: ${firstAlert.locationType}`);
    console.log(`    - state: ${firstAlert.state || 'N/A'}`);

    // Check alerts section
    console.log('\nalerts section (status tracking):');
    const firstStatusKey = Object.keys(snapshot.alerts)[0];
    const firstStatus = snapshot.alerts[firstStatusKey];

    console.log(`  Key format: "${firstStatusKey}"`);
    console.log(`  Status structure:`);
    console.log(`    - id: ${firstStatus.id}`);
    console.log(`    - compositeKey: ${firstStatus.compositeKey}`);
    console.log(`    - status: ${firstStatus.status}`);

    // Find an alert that appears in multiple locations
    console.log('\n' + '─'.repeat(80));
    console.log('Finding alerts with multiple locations...\n');

    const alertsByBaseId = {};
    for (const [key, alert] of Object.entries(snapshot.alert_data)) {
      const baseId = alert.id;
      if (!alertsByBaseId[baseId]) {
        alertsByBaseId[baseId] = [];
      }
      alertsByBaseId[baseId].push({
        key: key,
        location: alert.locationName,
        locationType: alert.locationType,
      });
    }

    const multiLocationAlerts = Object.entries(alertsByBaseId).filter(([id, locations]) => locations.length > 1);

    console.log(`Alerts appearing in multiple locations: ${multiLocationAlerts.length}\n`);

    if (multiLocationAlerts.length > 0) {
      const [alertId, locations] = multiLocationAlerts[0];
      console.log(`Example: "${alertId}"`);
      console.log(`  Appears in ${locations.length} locations:`);
      for (const loc of locations.slice(0, 5)) {
        console.log(`    - ${loc.location} (${loc.locationType})`);
      }
      if (locations.length > 5) {
        console.log(`    ... and ${locations.length - 5} more`);
      }

      console.log(`\n  Current storage: ${locations.length} separate entries in alert_data`);
      console.log(`  Size per entry: ~${JSON.stringify(locations[0]).length} bytes`);
      console.log(`  Total size: ~${locations.length * JSON.stringify(locations[0]).length} bytes`);

      console.log(`\n  ✅ CURRENT STRUCTURE (composite keys):`);
      console.log(`     - Stores full alert data for each location`);
      console.log(`     - Key: alertId|locationId`);
      console.log(`     - Deduplicates by location, not by alert`);

      console.log(`\n  💡 PROPOSED STRUCTURE (alert-centric):`);
      console.log(`     - Store alert once with array of locations`);
      console.log(`     - Key: alertId`);
      console.log(`     - Value: { ...alertData, locations: [{id, name, type}, ...] }`);
      console.log(`     - Would save ~${(locations.length - 1) * 500} bytes per multi-location alert`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStructure();

