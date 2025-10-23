/**
 * Test the normalized database structure
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

// Normalized extraction function
function extractAllAlerts(regionData) {
  const locations = {};
  const alerts = {};
  const alertLocationMap = {};

  for (const [regionName, region] of Object.entries(regionData)) {
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            const locationId = `county-${county.properties.FIPS}`;
            if (!locations[locationId]) {
              locations[locationId] = {
                id: locationId,
                locationId: county.properties.FIPS,
                name: county.properties.COUNTYNAME,
                type: 'county',
                state: state.properties.STATE,
                lat: county.properties.LAT,
                lon: county.properties.LON,
              };
            }

            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                const alertBaseId = alert.id;

                if (!alerts[alertBaseId]) {
                  alerts[alertBaseId] = {
                    id: alert.id,
                    event: alert.properties.event,
                    headline: alert.properties.headline,
                    severity: alert.properties.severity,
                    urgency: alert.properties.urgency,
                  };
                }

                if (!alertLocationMap[alertBaseId]) {
                  alertLocationMap[alertBaseId] = [];
                }
                if (!alertLocationMap[alertBaseId].includes(locationId)) {
                  alertLocationMap[alertBaseId].push(locationId);
                }
              }
            }
          }
        }
      }
    }

    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        const locationId = `coast-${coast.properties.ID}`;
        if (!locations[locationId]) {
          locations[locationId] = {
            id: locationId,
            locationId: coast.properties.ID,
            name: coast.properties.NAME,
            type: 'coast',
            lat: coast.properties.LAT,
            lon: coast.properties.LON,
          };
        }

        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            const alertBaseId = alert.id;

            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
                headline: alert.properties.headline,
                severity: alert.properties.severity,
                urgency: alert.properties.urgency,
              };
            }

            if (!alertLocationMap[alertBaseId]) {
              alertLocationMap[alertBaseId] = [];
            }
            if (!alertLocationMap[alertBaseId].includes(locationId)) {
              alertLocationMap[alertBaseId].push(locationId);
            }
          }
        }
      }
    }

    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        const locationId = `offshore-${offshore.properties.ID}`;
        if (!locations[locationId]) {
          locations[locationId] = {
            id: locationId,
            locationId: offshore.properties.ID,
            name: offshore.properties.Name,
            type: 'offshore',
            lat: offshore.properties.LAT,
            lon: offshore.properties.LON,
          };
        }

        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            const alertBaseId = alert.id;

            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
                headline: alert.properties.headline,
                severity: alert.properties.severity,
                urgency: alert.properties.urgency,
              };
            }

            if (!alertLocationMap[alertBaseId]) {
              alertLocationMap[alertBaseId] = [];
            }
            if (!alertLocationMap[alertBaseId].includes(locationId)) {
              alertLocationMap[alertBaseId].push(locationId);
            }
          }
        }
      }
    }
  }

  return { locations, alerts, alertLocationMap };
}

async function testStructure() {
  try {
    console.log('📊 Testing normalized database structure...\n');

    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    const { locations, alerts, alertLocationMap } = extractAllAlerts(regionData);

    console.log('═'.repeat(80));
    console.log('NORMALIZED STRUCTURE BREAKDOWN');
    console.log('═'.repeat(80) + '\n');

    console.log(`📍 Locations: ${Object.keys(locations).length}`);
    console.log(`🚨 Alerts: ${Object.keys(alerts).length}`);
    console.log(`🔗 Alert-Location Mappings: ${Object.keys(alertLocationMap).length}\n`);

    // Show example
    const exampleAlertId = Object.keys(alerts)[0];
    const exampleAlert = alerts[exampleAlertId];
    const exampleLocations = alertLocationMap[exampleAlertId];

    console.log('Example Alert:');
    console.log(`  Alert ID: ${exampleAlertId.substring(0, 60)}...`);
    console.log(`  Event: ${exampleAlert.event}`);
    console.log(`  Severity: ${exampleAlert.severity}`);
    console.log(`  Locations: ${exampleLocations.length}`);

    for (const locId of exampleLocations.slice(0, 3)) {
      const loc = locations[locId];
      console.log(`    - ${loc.name} (${loc.type})`);
    }
    if (exampleLocations.length > 3) {
      console.log(`    ... and ${exampleLocations.length - 3} more`);
    }

    // Calculate storage
    const alertSize = JSON.stringify(alerts).length;
    const locationSize = JSON.stringify(locations).length;
    const mapSize = JSON.stringify(alertLocationMap).length;
    const totalSize = alertSize + locationSize + mapSize;

    console.log('\n' + '═'.repeat(80));
    console.log('STORAGE BREAKDOWN');
    console.log('═'.repeat(80) + '\n');

    console.log(`Alerts data: ${(alertSize / 1024).toFixed(2)} KB`);
    console.log(`Locations data: ${(locationSize / 1024).toFixed(2)} KB`);
    console.log(`Mappings data: ${(mapSize / 1024).toFixed(2)} KB`);
    console.log(`─`.repeat(40));
    console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB\n`);

    // Compare with previous structure
    const prevStructureSize = 685; // From previous test
    const savings = prevStructureSize - totalSize / 1024;
    const savingsPercent = (savings / prevStructureSize) * 100;

    console.log(`Previous structure: ~${prevStructureSize} KB`);
    console.log(`New normalized structure: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Savings: ${savings.toFixed(2)} KB (${savingsPercent.toFixed(1)}%)\n`);

    console.log('✨ Benefits of Normalized Structure:');
    console.log('  ✅ No duplicate location data');
    console.log('  ✅ No duplicate alert data');
    console.log('  ✅ Efficient mappings with just IDs');
    console.log('  ✅ Easy to query by alert or location');
    console.log('  ✅ Scales well with large datasets\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStructure();

