/**
 * Debug the extraction to see what's happening
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

function extractAllAlerts(regionData) {
  const alerts = {};
  let countyCount = 0;
  let coastCount = 0;
  let offshoreCount = 0;

  for (const [regionName, region] of Object.entries(regionData)) {
    console.log(`\nProcessing region: ${regionName}`);

    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            if (county.alerts) {
              const alertCount = Object.keys(county.alerts).length;
              countyCount += alertCount;
              console.log(`  County ${county.properties?.COUNTYNAME}: ${alertCount} alerts`);

              for (const [alertId, alert] of Object.entries(county.alerts)) {
                alerts[alert.id] = {
                  id: alert.id,
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
          const alertCount = Object.keys(coast.alerts).length;
          coastCount += alertCount;
          console.log(`  Coast ${coast.properties?.NAME}: ${alertCount} alerts`);

          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
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
          const alertCount = Object.keys(offshore.alerts).length;
          offshoreCount += alertCount;
          console.log(`  Offshore ${offshore.properties?.Name}: ${alertCount} alerts`);

          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
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

  console.log('\n' + '─'.repeat(50));
  console.log(`County alerts: ${countyCount}`);
  console.log(`Coast alerts: ${coastCount}`);
  console.log(`Offshore alerts: ${offshoreCount}`);
  console.log(`Total extracted: ${Object.keys(alerts).length}`);
  console.log('─'.repeat(50));

  return alerts;
}

async function debug() {
  try {
    console.log('🔍 Debugging alert extraction...\n');

    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    const extracted = extractAllAlerts(regionData);

    console.log(`\n✅ Extraction complete: ${Object.keys(extracted).length} alerts`);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debug();

