/**
 * Test the FIXED alert extraction function
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

// Copy the FIXED extraction function
function extractAllAlerts(regionData) {
  const alerts = {};

  for (const [regionName, region] of Object.entries(regionData)) {
    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                // Use composite key to preserve all alert instances
                const compositeKey = `${alert.id}|${county.properties.FIPS}`;
                alerts[compositeKey] = {
                  id: alert.id,
                  compositeKey: compositeKey,
                  event: alert.properties.event,
                  locationId: county.properties.FIPS,
                  locationName: county.properties.COUNTYNAME,
                  locationType: 'county',
                  state: state.properties.STATE,
                };
              }
            }
          }
        }
      }
    }

    // Extract from coasts
    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            // Use composite key to preserve all alert instances
            const compositeKey = `${alert.id}|${coast.properties.ID}`;
            alerts[compositeKey] = {
              id: alert.id,
              compositeKey: compositeKey,
              event: alert.properties.event,
              locationId: coast.properties.ID,
              locationName: coast.properties.NAME,
              locationType: 'coast',
            };
          }
        }
      }
    }

    // Extract from offshores
    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            // Use composite key to preserve all alert instances
            const compositeKey = `${alert.id}|${offshore.properties.ID}`;
            alerts[compositeKey] = {
              id: alert.id,
              compositeKey: compositeKey,
              event: alert.properties.event,
              locationId: offshore.properties.ID,
              locationName: offshore.properties.Name,
              locationType: 'offshore',
            };
          }
        }
      }
    }
  }

  return alerts;
}

async function testExtraction() {
  try {
    console.log('📊 Testing FIXED alert extraction...\n');

    // Cache region data
    console.log('Loading region data into cache...');
    const result = await cacheRegionData(cache);
    console.log(`Cache result: ${result.success ? '✅' : '❌'}\n`);

    // Get region data
    const regionData = cache.get('regionData');

    if (!regionData) {
      console.error('No region data in cache');
      return;
    }

    // Extract alerts
    console.log('Extracting alerts with FIXED function...\n');
    const extractedAlerts = extractAllAlerts(regionData);

    console.log(`✅ Total alerts extracted: ${Object.keys(extractedAlerts).length}\n`);

    // Count by type
    const alertsByType = {};
    for (const alert of Object.values(extractedAlerts)) {
      const type = alert.event || 'UNKNOWN';
      alertsByType[type] = (alertsByType[type] || 0) + 1;
    }

    console.log('Alerts by Type:');
    console.log('─'.repeat(50));
    for (const [type, count] of Object.entries(alertsByType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type.substring(0, 40).padEnd(40)} : ${count}`);
    }
    console.log('─'.repeat(50) + '\n');

    // Show sample alerts
    const samples = Object.values(extractedAlerts).slice(0, 3);
    console.log('Sample Alerts:');
    for (const alert of samples) {
      console.log(`  - ${alert.event} (${alert.locationName})`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testExtraction();

