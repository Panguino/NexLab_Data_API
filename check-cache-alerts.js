/**
 * Check what's in the cache to see actual alert count
 */

const http = require('http');

function queryGraphQL(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4400,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function countAlerts() {
  try {
    console.log('📊 Counting alerts from cache via GraphQL...\n');

    // Simple query to get all alerts
    const query = `{
      getRegion(region: CONUS) {
        states {
          counties {
            alerts {
              id
              properties {
                event
              }
            }
          }
        }
        coasts {
          alerts {
            id
            properties {
              event
            }
          }
        }
        offshores {
          alerts {
            id
            properties {
              event
            }
          }
        }
      }
    }`;

    const result = await queryGraphQL(query);

    if (result.errors) {
      console.error('GraphQL Error:', result.errors[0].message);
      return;
    }

    const region = result.data.getRegion;

    // Count alerts
    let countyAlerts = 0;
    let coastAlerts = 0;
    let offshoreAlerts = 0;

    for (const state of region.states) {
      for (const county of state.counties) {
        countyAlerts += county.alerts.length;
      }
    }

    for (const coast of region.coasts) {
      coastAlerts += coast.alerts.length;
    }

    for (const offshore of region.offshores) {
      offshoreAlerts += offshore.alerts.length;
    }

    const totalAlerts = countyAlerts + coastAlerts + offshoreAlerts;

    console.log('📋 Alert Counts:');
    console.log('─'.repeat(40));
    console.log(`  County Alerts    : ${countyAlerts}`);
    console.log(`  Coast Alerts     : ${coastAlerts}`);
    console.log(`  Offshore Alerts  : ${offshoreAlerts}`);
    console.log('─'.repeat(40));
    console.log(`  TOTAL            : ${totalAlerts}\n`);

    return totalAlerts;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

countAlerts();

