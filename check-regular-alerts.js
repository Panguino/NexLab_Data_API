/**
 * Check regular alerts archive (non-optimized)
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function checkRegularAlerts() {
  try {
    console.log('Checking regular alerts archive...\n');

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: 'alerts/',
      MaxKeys: 10,
    };

    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents && data.Contents.length > 0) {
      console.log(`Found ${data.Contents.length} items in alerts/ folder\n`);

      // Sort by date
      const sorted = data.Contents.sort((a, b) => a.Key.localeCompare(b.Key));

      for (const obj of sorted.slice(0, 5)) {
        console.log(`  ${obj.Key}`);
      }

      // Get the first one
      const firstKey = sorted[0].Key;
      console.log(`\nFetching: ${firstKey}`);

      const snapshot = await s3
        .getObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: firstKey,
        })
        .promise();

      const snapshotData = JSON.parse(snapshot.Body.toString());

      console.log('\nSnapshot Structure:');
      console.log(`  - timestamp: ${snapshotData.timestamp}`);
      console.log(`  - alerts_count: ${snapshotData.alerts_count}`);

      if (snapshotData.alerts) {
        const firstAlert = Object.values(snapshotData.alerts)[0];
        console.log(`\nFirst alert:`);
        console.log(JSON.stringify(firstAlert, null, 2));
      }
    } else {
      console.log('No items found in alerts/ folder');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRegularAlerts();
