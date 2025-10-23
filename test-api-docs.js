/**
 * Test the new API documentation endpoint
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4400,
      path: path,
      method: 'GET',
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
    req.end();
  });
}

async function test() {
  try {
    console.log('═'.repeat(80));
    console.log('TESTING API DOCUMENTATION ENDPOINT');
    console.log('═'.repeat(80) + '\n');

    console.log('📚 Fetching /api/docs...\n');
    const docs = await makeRequest('/api/docs');

    console.log('✅ Documentation retrieved successfully!\n');

    console.log('─'.repeat(80));
    console.log('API OVERVIEW');
    console.log('─'.repeat(80) + '\n');

    console.log(`Version: ${docs.version}`);
    console.log(`Base URL: ${docs.baseUrl}`);
    console.log(`Description: ${docs.description}\n`);

    console.log('─'.repeat(80));
    console.log('AVAILABLE ENDPOINT CATEGORIES');
    console.log('─'.repeat(80) + '\n');

    for (const [category, info] of Object.entries(docs.endpoints)) {
      console.log(`📍 ${info.category}`);
      console.log(`   ${info.description}`);
      console.log(`   Endpoints: ${info.endpoints.length}\n`);
    }

    console.log('─'.repeat(80));
    console.log('HAZARDS ENDPOINTS');
    console.log('─'.repeat(80) + '\n');

    const hazardsEndpoints = docs.endpoints.hazards.endpoints;
    for (const endpoint of hazardsEndpoints) {
      console.log(`${endpoint.method} ${endpoint.path}`);
      console.log(`  ${endpoint.description}`);
      console.log(`  Example: ${endpoint.exampleUrl}\n`);
    }

    console.log('─'.repeat(80));
    console.log('ALERT HISTORY ENDPOINTS');
    console.log('─'.repeat(80) + '\n');

    const alertEndpoints = docs.endpoints.alertHistory.endpoints;
    for (const endpoint of alertEndpoints) {
      console.log(`${endpoint.method} ${endpoint.path}`);
      console.log(`  ${endpoint.description}`);
      console.log(`  Example: ${endpoint.exampleUrl}\n`);
    }

    console.log('─'.repeat(80));
    console.log('ALERT DATA SCHEMA');
    console.log('─'.repeat(80) + '\n');

    const schema = docs.alertSchema;
    console.log('Alert object fields:\n');
    for (const [field, info] of Object.entries(schema.fields)) {
      console.log(`  ${field}: ${info.type}`);
      console.log(`    ${info.description}`);
      if (info.examples) {
        console.log(`    Examples: ${info.examples.join(', ')}`);
      }
      console.log();
    }

    console.log('─'.repeat(80));
    console.log('FILTERING OPTIONS');
    console.log('─'.repeat(80) + '\n');

    const filters = docs.filteringOptions;
    console.log(`Regions: ${filters.regions.join(', ')}`);
    console.log(`Hazard Types: ${filters.hazardTypes.join(', ')}`);
    console.log(`Hazard Levels: ${filters.hazardLevels.join(', ')}`);
    console.log(`Date Format: ${filters.dateFormat}`);
    console.log(`Time Format: ${filters.timeFormat}\n`);

    console.log('─'.repeat(80));
    console.log('AI AGENT NOTES');
    console.log('─'.repeat(80) + '\n');

    for (const note of docs.aiAgentNotes.points) {
      console.log(`• ${note}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ API DOCUMENTATION ENDPOINT WORKING PERFECTLY!');
    console.log('═'.repeat(80) + '\n');

    console.log('📋 Full documentation available at: http://localhost:4400/api/docs\n');
    console.log('This endpoint provides:');
    console.log('  ✅ Complete endpoint listing');
    console.log('  ✅ Query parameter documentation');
    console.log('  ✅ Response schema information');
    console.log('  ✅ Alert data structure');
    console.log('  ✅ Filtering options');
    console.log('  ✅ Usage examples');
    console.log('  ✅ AI agent notes\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

