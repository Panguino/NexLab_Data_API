/**
 * Create snapshot with alert-centric structure
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

// Alert-centric extraction
function extractAllAlerts(regionData) {
  const alerts = {};

  for (const [regionName, region] of Object.entries(regionData)) {
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                const alertBaseId = alert.id;
                
                if (!alerts[alertBaseId]) {
                  alerts[alertBaseId] = {
                    id: alert.id,
                    event: alert.properties.event,
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
                    locations: [],
                  };
                }
                
                alerts[alertBaseId].locations.push({
                  id: county.properties.FIPS,
                  name: county.properties.COUNTYNAME,
                  type: 'county',
                  state: state.properties.STATE,
                  lat: county.properties.LAT,
                  lon: county.properties.LON,
                });
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
            const alertBaseId = alert.id;
            
            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
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
                locations: [],
              };
            }
            
            alerts[alertBaseId].locations.push({
              id: coast.properties.ID,
              name: coast.properties.NAME,
              type: 'coast',
              lat: coast.properties.LAT,
              lon: coast.properties.LON,
            });
          }
        }
      }
    }

    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            const alertBaseId = alert.id;
            
            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
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
                locations: [],
              };
            }
            
            alerts[alertBaseId].locations.push({
              id: offshore.properties.ID,
              name: offshore.properties.Name,
              type: 'offshore',
              lat: offshore.properties.LAT,
              lon: offshore.properties.LON,
            });
          }
        }
      }
    }
  }

  return alerts;
}

async function createAndUpload() {
  try {
    console.log('📊 Creating alert-centric snapshot...\n');

    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    const allAlerts = extractAllAlerts(regionData);
    console.log(`✅ Extracted ${Object.keys(allAlerts).length} unique alerts\n`);

    const snapshot = {
      timestamp: new Date().toISOString(),
      snapshot_id: uuidv4(),
      alerts_count: Object.keys(allAlerts).length,
      new_count: Object.keys(allAlerts).length,
      unchanged_count: 0,
      expired_count: 0,
      alert_data: allAlerts,
      alerts: {},
    };

    for (const [id] of Object.entries(allAlerts)) {
      snapshot.alerts[id] = {
        id: id,
        status: 'new',
      };
    }

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
    console.log('✅ ALERT-CENTRIC SNAPSHOT CREATED');
    console.log('═'.repeat(80));
    console.log(`\nSnapshot Details:`);
    console.log(`  - Total Alerts: ${snapshot.alerts_count}`);
    console.log(`  - Snapshot ID: ${snapshot.snapshot_id}`);
    console.log(`  - Timestamp: ${snapshot.timestamp}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAndUpload();

