/**
 * List all snapshots to find where full alert data is
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function listSnapshots() {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: 'alerts-optimized/',
      MaxKeys: 100
    };

    const data = await s3.listObjectsV2(params).promise();
    
    console.log('All Snapshots in S3:\n');
    
    if (data.Contents && data.Contents.length > 0) {
      // Sort by date
      const sorted = data.Contents.sort((a, b) => a.Key.localeCompare(b.Key));
      
      for (const obj of sorted) {
        console.log(`  ${obj.Key}`);
      }
      
      console.log(`\nTotal: ${sorted.length} snapshots`);
      
      // Get the first one
      console.log(`\nFetching first snapshot: ${sorted[0].Key}`);
      
      const snapshot = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: sorted[0].Key
      }).promise();
      
      const snapshotData = JSON.parse(snapshot.Body.toString());
      
      console.log('\nFirst Snapshot Structure:');
      console.log(`  - timestamp: ${snapshotData.timestamp}`);
      console.log(`  - new_count: ${snapshotData.new_count}`);
      console.log(`  - unchanged_count: ${snapshotData.unchanged_count}`);
      console.log(`  - Has alert_data: ${!!snapshotData.alert_data}`);
      console.log(`  - Has alerts: ${!!snapshotData.alerts}`);
      
      if (snapshotData.alerts) {
        const firstAlert = Object.values(snapshotData.alerts)[0];
        console.log(`\nFirst alert in alerts section:`);
        console.log(JSON.stringify(firstAlert, null, 2));
      }
    } else {
      console.log('No snapshots found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listSnapshots();

