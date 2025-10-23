/**
 * Check the structure of regionData
 */

const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ useClones: false });
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

async function checkStructure() {
  try {
    console.log('📊 Checking regionData structure...\n');

    // Cache region data
    await cacheRegionData(cache);

    const regionData = cache.get('regionData');

    console.log('Regions in cache:');
    console.log('─'.repeat(50));

    let totalAlerts = 0;

    for (const [regionName, region] of Object.entries(regionData)) {
      let regionAlerts = 0;

      // Count county alerts
      if (region.states) {
        for (const state of Object.values(region.states)) {
          if (state.counties) {
            for (const county of Object.values(state.counties)) {
              if (county.alerts) {
                regionAlerts += Object.keys(county.alerts).length;
              }
            }
          }
        }
      }

      // Count coast alerts
      if (region.coasts) {
        for (const coast of Object.values(region.coasts)) {
          if (coast.alerts) {
            regionAlerts += Object.keys(coast.alerts).length;
          }
        }
      }

      // Count offshore alerts
      if (region.offshores) {
        for (const offshore of Object.values(region.offshores)) {
          if (offshore.alerts) {
            regionAlerts += Object.keys(offshore.alerts).length;
          }
        }
      }

      console.log(`  ${regionName.padEnd(20)} : ${regionAlerts} alerts`);
      totalAlerts += regionAlerts;
    }

    console.log('─'.repeat(50));
    console.log(`  ${'TOTAL'.padEnd(20)} : ${totalAlerts} alerts\n`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStructure();

