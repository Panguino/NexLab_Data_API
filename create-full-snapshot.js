/**
 * Create a full snapshot with ALL 1372 alerts using the fixed extraction
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

// Fixed extraction function
function extractAllAlerts(regionData) {
  const alerts = {};

  for (const [regionName, region] of Object.entries(regionData)) {
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                const compositeKey = `${alert.id}|${county.properties.FIPS}`;
                alerts[compositeKey] = {
                  id: alert.id,
                  compositeKey: compositeKey,
                  event: alert.properties.event,
                  locationId: county.properties.FIPS,
                  locationName: county.properties.COUNTYNAME,
                  locationType: 'county',
                  state: state.properties.STATE,
                  lat: county.properties.LAT,
                  lon: county.properties.LON,
                  sent: alert.properties.sent,
                  effective: alert.properties.effective,
                  onset: alert.properties.onset,
                  expires: alert.properties.expires,
                  ends: alert.properties.ends,
                  headline: alert.properties.headline,
                  description: alert.properties.description,
                  areaDesc: alert.properties.areaDesc,
                  severity: alert.properties.severity,
                  certainty: alert.properties.certainty,
                  urgency: alert.properties.urgency,
                };
              }
            }
          }
        }
      }
    }

    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            const compositeKey = `${alert.id}|${coast.properties.ID}`;
            alerts[compositeKey] = {
              id: alert.id,
              compositeKey: compositeKey,
              event: alert.properties.event,
              locationId: coast.properties.ID,
              locationName: coast.properties.NAME,
              locationType: 'coast',
              lat: coast.properties.LAT,
              lon: coast.properties.LON,
              sent: alert.properties.sent,
              effective: alert.properties.effective,
              onset: alert.properties.onset,
              expires: alert.properties.expires,
              ends: alert.properties.ends,
              headline: alert.properties.headline,
              description: alert.properties.description,
              areaDesc: alert.properties.areaDesc,
              severity: alert.properties.severity,
              certainty: alert.properties.certainty,
              urgency: alert.properties.urgency,
            };
          }
        }
      }
    }

    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            const compositeKey = `${alert.id}|${offshore.properties.ID}`;
            alerts[compositeKey] = {
              id: alert.id,
              compositeKey: compositeKey,
              event: alert.properties.event,
              locationId: offshore.properties.ID,
              locationName: offshore.properties.Name,
              locationType: 'offshore',
              lat: offshore.properties.LAT,
              lon: offshore.properties.LON,
              sent: alert.properties.sent,
              effective: alert.properties.effective,
              onset: alert.properties.onset,
              expires: alert.properties.expires,
              ends: alert.properties.ends,
              headline: alert.properties.headline,
              description: alert.properties.description,
              areaDesc: alert.properties.areaDesc,
              severity: alert.properties.severity,
              certainty: alert.properties.certainty,
              urgency: alert.properties.urgency,
            };
          }
        }
      }
    }
  }

  return alerts;
}

function createSnapshot(currentAlerts) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    snapshot_id: uuidv4(),
    alerts_count: Object.keys(currentAlerts).length,
    new_count: Object.keys(currentAlerts).length,
    unchanged_count: 0,
    expired_count: 0,
    alert_data: currentAlerts,
    alerts: {},
  };

  // Create status entries for all alerts
  for (const [key, alert] of Object.entries(currentAlerts)) {
    snapshot.alerts[key] = {
      id: alert.id,
      compositeKey: key,
      status: 'new',
    };
  }

  return snapshot;
}

async function createAndUpload() {
  try {
    console.log('📊 Creating full snapshot with all 1372 alerts...\n');

    // Load region data
    console.log('Loading region data...');
    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    // Extract all alerts
    console.log('Extracting all alerts...');
    const allAlerts = extractAllAlerts(regionData);
    console.log(`✅ Extracted ${Object.keys(allAlerts).length} alerts\n`);

    // Create snapshot
    console.log('Creating snapshot...');
    const snapshot = createSnapshot(allAlerts);
    console.log(`✅ Snapshot created with ${snapshot.alerts_count} alerts\n`);

    // Upload to S3
    console.log('Uploading to S3...');
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    const key = `alerts-optimized/${year}/${month}/${day}/${hours}-${minutes}-${seconds}.json`;

    await s3
      .putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: JSON.stringify(snapshot, null, 2),
        ContentType: 'application/json',
      })
      .promise();

    console.log(`✅ Uploaded to: ${key}\n`);

    console.log('═'.repeat(80));
    console.log('✅ SNAPSHOT CREATED SUCCESSFULLY');
    console.log('═'.repeat(80));
    console.log(`\nSnapshot Details:`);
    console.log(`  - Total Alerts: ${snapshot.alerts_count}`);
    console.log(`  - New Alerts: ${snapshot.new_count}`);
    console.log(`  - Snapshot ID: ${snapshot.snapshot_id}`);
    console.log(`  - Timestamp: ${snapshot.timestamp}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAndUpload();

