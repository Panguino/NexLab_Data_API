/**
 * Test the new alert-centric structure
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

// New alert-centric extraction function
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
                    headline: alert.properties.headline,
                    severity: alert.properties.severity,
                    urgency: alert.properties.urgency,
                    locations: [],
                  };
                }
                
                alerts[alertBaseId].locations.push({
                  id: county.properties.FIPS,
                  name: county.properties.COUNTYNAME,
                  type: 'county',
                  state: state.properties.STATE,
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
                headline: alert.properties.headline,
                severity: alert.properties.severity,
                urgency: alert.properties.urgency,
                locations: [],
              };
            }
            
            alerts[alertBaseId].locations.push({
              id: coast.properties.ID,
              name: coast.properties.NAME,
              type: 'coast',
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
                headline: alert.properties.headline,
                severity: alert.properties.severity,
                urgency: alert.properties.urgency,
                locations: [],
              };
            }
            
            alerts[alertBaseId].locations.push({
              id: offshore.properties.ID,
              name: offshore.properties.Name,
              type: 'offshore',
            });
          }
        }
      }
    }
  }

  return alerts;
}

async function testStructure() {
  try {
    console.log('📊 Testing alert-centric structure...\n');

    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    const alerts = extractAllAlerts(regionData);
    const totalAlerts = Object.keys(alerts).length;

    console.log(`✅ Total unique alerts: ${totalAlerts}\n`);

    // Find alerts with multiple locations
    const multiLocationAlerts = Object.values(alerts).filter((a) => a.locations.length > 1);

    console.log(`Alerts with multiple locations: ${multiLocationAlerts.length}\n`);

    // Show example
    if (multiLocationAlerts.length > 0) {
      const example = multiLocationAlerts[0];
      console.log(`Example: ${example.event}`);
      console.log(`  Locations: ${example.locations.length}`);
      for (const loc of example.locations.slice(0, 5)) {
        console.log(`    - ${loc.name} (${loc.type})`);
      }
      if (example.locations.length > 5) {
        console.log(`    ... and ${example.locations.length - 5} more`);
      }

      // Calculate storage savings
      const oldSize = example.locations.length * 500; // ~500 bytes per duplicate
      const newSize = JSON.stringify(example).length;
      const savings = oldSize - newSize;

      console.log(`\n  Storage comparison for this alert:`);
      console.log(`    Old (duplicated): ~${oldSize} bytes`);
      console.log(`    New (alert-centric): ~${newSize} bytes`);
      console.log(`    Savings: ~${savings} bytes (${Math.round((savings / oldSize) * 100)}%)`);
    }

    // Calculate total storage savings
    let totalOldSize = 0;
    let totalNewSize = 0;

    for (const alert of Object.values(alerts)) {
      totalOldSize += alert.locations.length * 500;
      totalNewSize += JSON.stringify(alert).length;
    }

    const totalSavings = totalOldSize - totalNewSize;

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`Total storage comparison:`);
    console.log(`  Old (duplicated): ~${totalOldSize} bytes`);
    console.log(`  New (alert-centric): ~${totalNewSize} bytes`);
    console.log(`  Total savings: ~${totalSavings} bytes (${Math.round((totalSavings / totalOldSize) * 100)}%)`);
    console.log(`${'═'.repeat(80)}\n`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStructure();

