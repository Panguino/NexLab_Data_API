/**
 * Get all alerts from GraphQL endpoint and count them
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

async function getAllAlerts() {
  try {
    console.log('📊 Fetching all alerts from GraphQL...\n');

    // Query to get all alerts from CONUS region
    const query = `{
      getRegion(region: CONUS) {
        name
        states {
          name
          counties {
            name
            alerts {
              id
              event
              severity
              hazardInfo {
                type {
                  name
                }
              }
            }
          }
        }
        coasts {
          name
          alerts {
            id
            event
            severity
            hazardInfo {
              type {
                name
              }
            }
          }
        }
        offshores {
          name
          alerts {
            id
            event
            severity
            hazardInfo {
              type {
                name
              }
            }
          }
        }
      }
    }`;

    const result = await queryGraphQL(query);

    if (result.errors) {
      console.error('GraphQL Error:', result.errors);
      return;
    }

    const region = result.data.getRegion;
    console.log(`Region: ${region.name}\n`);

    // Count alerts by type
    const alertsByType = {};
    let totalAlerts = 0;

    // Count county alerts
    for (const state of region.states) {
      for (const county of state.counties) {
        for (const alert of county.alerts) {
          const type = alert.hazardInfo?.type?.name || 'UNKNOWN';
          alertsByType[type] = (alertsByType[type] || 0) + 1;
          totalAlerts++;
        }
      }
    }

    // Count coast alerts
    for (const coast of region.coasts) {
      for (const alert of coast.alerts) {
        const type = alert.hazardInfo?.type?.name || 'UNKNOWN';
        alertsByType[type] = (alertsByType[type] || 0) + 1;
        totalAlerts++;
      }
    }

    // Count offshore alerts
    for (const offshore of region.offshores) {
      for (const alert of offshore.alerts) {
        const type = alert.hazardInfo?.type?.name || 'UNKNOWN';
        alertsByType[type] = (alertsByType[type] || 0) + 1;
        totalAlerts++;
      }
    }

    console.log('📋 Alerts by Type:');
    console.log('─'.repeat(40));
    for (const [type, count] of Object.entries(alertsByType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type.padEnd(20)} : ${count}`);
    }
    console.log('─'.repeat(40));
    console.log(`  ${'TOTAL'.padEnd(20)} : ${totalAlerts}\n`);

    return { alertsByType, totalAlerts };
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getAllAlerts();

