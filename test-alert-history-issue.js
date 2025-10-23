/**
 * Test to demonstrate the alert history data issue
 */

console.log('================================================================================');
console.log('ALERT HISTORY DATA ISSUE - DIAGNOSTIC TEST');
console.log('================================================================================\n');

// Simulate what the archive module stores
const snapshot1 = {
  timestamp: '2025-10-23T16:00:00Z',
  alerts: {
    'alert-1': {
      id: 'alert-1',
      event: 'Tornado Warning',
      headline: 'Tornado Warning issued',
      status: 'new'  // Full data included
    },
    'alert-2': {
      id: 'alert-2',
      event: 'Severe Thunderstorm',
      headline: 'Severe Thunderstorm Warning',
      status: 'new'  // Full data included
    }
  }
};

const snapshot2 = {
  timestamp: '2025-10-23T17:00:00Z',
  alerts: {
    'alert-1': {
      id: 'alert-1',
      status: 'unchanged'  // ‚ùå ONLY ID AND STATUS - NO FULL DATA!
    },
    'alert-2': {
      id: 'alert-2',
      status: 'unchanged'  // ‚ùå ONLY ID AND STATUS - NO FULL DATA!
    }
  }
};

console.log('Ì≥ä SNAPSHOT 1 (Hour 1):');
console.log(JSON.stringify(snapshot1, null, 2));

console.log('\nÌ≥ä SNAPSHOT 2 (Hour 2):');
console.log(JSON.stringify(snapshot2, null, 2));

console.log('\n================================================================================');
console.log('PROBLEM: Query Endpoint Logic');
console.log('================================================================================\n');

// Simulate what the query endpoint does
const deduplicatedAlerts = {};
const timeline = [];

// Process snapshot 1
console.log('Processing Snapshot 1...');
for (const [alertId, alertData] of Object.entries(snapshot1.alerts)) {
  if (alertData.status === 'new' || alertData.status === 'updated') {
    deduplicatedAlerts[alertId] = alertData;
    console.log(`  ‚úÖ Added ${alertId} to deduplicatedAlerts (status: ${alertData.status})`);
  }
}

// Process snapshot 2
console.log('\nProcessing Snapshot 2...');
for (const [alertId, alertData] of Object.entries(snapshot2.alerts)) {
  if (alertData.status === 'new' || alertData.status === 'updated') {
    deduplicatedAlerts[alertId] = alertData;
    console.log(`  ‚úÖ Added ${alertId} to deduplicatedAlerts (status: ${alertData.status})`);
  } else if (alertData.status === 'unchanged') {
    console.log(`  ‚ö†Ô∏è  Skipped ${alertId} - only has ID and status, no full data!`);
  }
}

console.log('\n================================================================================');
console.log('RESULT: Final Response');
console.log('================================================================================\n');

console.log('deduplicatedAlerts:', JSON.stringify(deduplicatedAlerts, null, 2));

console.log('\n================================================================================');
console.log('ISSUE IDENTIFIED:');
console.log('================================================================================');
console.log('‚ùå Alerts marked as "unchanged" are stored with ONLY id + status');
console.log('‚ùå Query endpoint skips these alerts when building response');
console.log('‚ùå Result: Empty alerts object even though alerts exist in timeline!');
console.log('\n‚úÖ SOLUTION: Keep full alert data in a separate "alert_data" section');
console.log('‚úÖ Or: Store full data for ALL alerts, not just new/updated');
console.log('================================================================================\n');

