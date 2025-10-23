/**
 * Test the alert extraction function
 */

const NodeCache = require('node-cache');
require('dotenv').config();

// Create cache and load region data
const cache = new NodeCache({ useClones: false });

// Load the cacheRegionData function
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

// Copy the extraction function from archiveAlertsToS3Optimized
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
                alerts[alert.id] = {
                  id: alert.id,
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

    // Extract from coasts
    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
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

    // Extract from offshores
    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
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

async function testExtraction() {
  try {
    console.log('📊 Testing alert extraction...\n');

    // Cache region data
    console.log('Loading region data into cache...');
    const result = await cacheRegionData(cache);
    console.log(`Cache result: ${result.success ? '✅' : '❌'}\n`);

    // Get region data
    const regionData = cache.get('regionData');
    console.log(`Region data loaded: ${!!regionData ? '✅' : '❌'}`);

    if (!regionData) {
      console.error('No region data in cache');
      return;
    }

    // Extract alerts
    console.log('Extracting alerts...\n');
    const extractedAlerts = extractAllAlerts(regionData);

    console.log(`Total alerts extracted: ${Object.keys(extractedAlerts).length}\n`);

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

    // Show sample alert
    const firstAlert = Object.values(extractedAlerts)[0];
    if (firstAlert) {
      console.log('Sample Alert:');
      console.log(JSON.stringify(firstAlert, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testExtraction();

