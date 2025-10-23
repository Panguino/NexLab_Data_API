/**
 * Check for duplicate alert IDs
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate alert IDs...\n');

    await cacheRegionData(cache);
    const regionData = cache.get('regionData');

    const alertIds = {};
    let totalAlerts = 0;

    for (const [regionName, region] of Object.entries(regionData)) {
      // Count county alerts
      if (region.states) {
        for (const state of Object.values(region.states)) {
          if (state.counties) {
            for (const county of Object.values(state.counties)) {
              if (county.alerts) {
                for (const alert of Object.values(county.alerts)) {
                  const id = alert.id;
                  if (!alertIds[id]) {
                    alertIds[id] = [];
                  }
                  alertIds[id].push({
                    region: regionName,
                    location: county.properties?.COUNTYNAME,
                    type: 'county',
                  });
                  totalAlerts++;
                }
              }
            }
          }
        }
      }

      // Count coast alerts
      if (region.coasts) {
        for (const coast of Object.values(region.coasts)) {
          if (coast.alerts) {
            for (const alert of Object.values(coast.alerts)) {
              const id = alert.id;
              if (!alertIds[id]) {
                alertIds[id] = [];
              }
              alertIds[id].push({
                region: regionName,
                location: coast.properties?.NAME,
                type: 'coast',
              });
              totalAlerts++;
            }
          }
        }
      }

      // Count offshore alerts
      if (region.offshores) {
        for (const offshore of Object.values(region.offshores)) {
          if (offshore.alerts) {
            for (const alert of Object.values(offshore.alerts)) {
              const id = alert.id;
              if (!alertIds[id]) {
                alertIds[id] = [];
              }
              alertIds[id].push({
                region: regionName,
                location: offshore.properties?.Name,
                type: 'offshore',
              });
              totalAlerts++;
            }
          }
        }
      }
    }

    const uniqueIds = Object.keys(alertIds).length;
    const duplicates = Object.entries(alertIds).filter(([id, locations]) => locations.length > 1);

    console.log(`Total alerts: ${totalAlerts}`);
    console.log(`Unique IDs: ${uniqueIds}`);
    console.log(`Duplicates: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICATE IDs FOUND:\n');
      for (const [id, locations] of duplicates.slice(0, 10)) {
        console.log(`ID: ${id}`);
        console.log(`  Appears in ${locations.length} locations:`);
        for (const loc of locations) {
          console.log(`    - ${loc.region} / ${loc.location} (${loc.type})`);
        }
        console.log();
      }
      console.log(`... and ${duplicates.length - 10} more duplicates\n`);
    }

    console.log('💡 SOLUTION:');
    console.log('Use a composite key like: `${region}-${location}-${alertId}`');
    console.log('Or use: `${alertId}-${location}`');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDuplicates();

