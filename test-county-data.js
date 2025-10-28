const NodeCache = require('node-cache');
const cacheRegionData = require('./src/util/jobs/cacheRegionData');

async function testExtraction() {
  try {
    const cache = new NodeCache({ useClones: false });
    
    console.log('Loading region data...');
    const result = await cacheRegionData(cache);
    
    if (!result.success) {
      console.error('Failed to load region data:', result.message);
      return;
    }
    
    const regionData = cache.get('regionData');
    
    // Count counties with alerts
    let totalCounties = 0;
    let countiesWithAlerts = 0;
    let totalCountyAlerts = 0;
    
    for (const [regionName, region] of Object.entries(regionData)) {
      if (region.states) {
        for (const [stateName, state] of Object.entries(region.states)) {
          if (state.counties) {
            for (const [countyFIPS, county] of Object.entries(state.counties)) {
              totalCounties++;
              if (county.alerts && Object.keys(county.alerts).length > 0) {
                countiesWithAlerts++;
                totalCountyAlerts += Object.keys(county.alerts).length;
              }
            }
          }
        }
      }
    }
    
    console.log('Total counties:', totalCounties);
    console.log('Counties with alerts:', countiesWithAlerts);
    console.log('Total county alerts:', totalCountyAlerts);
    
    // Count coasts with alerts
    let totalCoasts = 0;
    let coastsWithAlerts = 0;
    let totalCoastAlerts = 0;
    
    for (const [regionName, region] of Object.entries(regionData)) {
      if (region.coasts) {
        for (const [coastId, coast] of Object.entries(region.coasts)) {
          totalCoasts++;
          if (coast.alerts && Object.keys(coast.alerts).length > 0) {
            coastsWithAlerts++;
            totalCoastAlerts += Object.keys(coast.alerts).length;
          }
        }
      }
    }
    
    console.log('\nTotal coasts:', totalCoasts);
    console.log('Coasts with alerts:', coastsWithAlerts);
    console.log('Total coast alerts:', totalCoastAlerts);
    
    // Count offshores with alerts
    let totalOffshores = 0;
    let offshoresToWithAlerts = 0;
    let totalOffshoreAlerts = 0;
    
    for (const [regionName, region] of Object.entries(regionData)) {
      if (region.offshores) {
        for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
          totalOffshores++;
          if (offshore.alerts && Object.keys(offshore.alerts).length > 0) {
            offshoresToWithAlerts++;
            totalOffshoreAlerts += Object.keys(offshore.alerts).length;
          }
        }
      }
    }
    
    console.log('\nTotal offshores:', totalOffshores);
    console.log('Offshores with alerts:', offshoresToWithAlerts);
    console.log('Total offshore alerts:', totalOffshoreAlerts);
    
    console.log('\n=== SUMMARY ===');
    console.log('Total alerts:', totalCountyAlerts + totalCoastAlerts + totalOffshoreAlerts);
    console.log('  - County alerts:', totalCountyAlerts);
    console.log('  - Coast alerts:', totalCoastAlerts);
    console.log('  - Offshore alerts:', totalOffshoreAlerts);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testExtraction();

