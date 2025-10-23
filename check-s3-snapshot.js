/**
 * Check S3 snapshot structure to diagnose the issue
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function checkS3Data() {
  try {
    console.log('================================================================================');
    console.log('CHECKING S3 SNAPSHOT STRUCTURE');
    console.log('================================================================================\n');

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: 'alerts-optimized/2025/10/23/',
      MaxKeys: 5
    };

    console.log(`Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`Prefix: alerts-optimized/2025/10/23/\n`);

    const data = await s3.listObjectsV2(params).promise();
    
    if (data.Contents && data.Contents.length > 0) {
      console.log(`✅ Found ${data.Contents.length} snapshots in S3\n`);
      
      // Get the first snapshot
      const firstKey = data.Contents[0].Key;
      console.log(`Fetching: ${firstKey}\n`);
      
      const snapshot = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: firstKey
      }).promise();
      
      const snapshotData = JSON.parse(snapshot.Body.toString());
      
      console.log('Snapshot structure:');
      console.log(`  - timestamp: ${snapshotData.timestamp}`);
      console.log(`  - snapshot_id: ${snapshotData.snapshot_id}`);
      console.log(`  - alerts_count: ${snapshotData.alerts_count}`);
      console.log(`  - new_count: ${snapshotData.new_count}`);
      console.log(`  - unchanged_count: ${snapshotData.unchanged_count}`);
      console.log(`  - expired_count: ${snapshotData.expired_count}`);
      
      console.log('\nData sections:');
      console.log(`  - Has alert_data: ${!!snapshotData.alert_data}`);
      console.log(`  - Has alerts: ${!!snapshotData.alerts}`);
      
      if (snapshotData.alert_data) {
        console.log(`  - alert_data keys: ${Object.keys(snapshotData.alert_data).length}`);
      }
      if (snapshotData.alerts) {
        console.log(`  - alerts keys: ${Object.keys(snapshotData.alerts).length}`);
      }
      
      console.log('\n================================================================================');
      
      if (snapshotData.alert_data) {
        console.log('✅ GOOD NEWS: alert_data section exists (NEW FIX IS DEPLOYED)');
        console.log('================================================================================\n');
        
        const firstAlert = Object.values(snapshotData.alert_data)[0];
        console.log('First alert in alert_data has:');
        console.log(`  ${Object.keys(firstAlert).join(', ')}`);
        
        console.log('\nSample alert:');
        console.log(JSON.stringify(firstAlert, null, 2).substring(0, 300) + '...');
      } else {
        console.log('❌ PROBLEM: alert_data section MISSING (OLD CODE IS RUNNING)');
        console.log('================================================================================\n');
        console.log('The staging server is running the OLD code WITHOUT the fix!');
        console.log('The fix needs to be deployed to Heroku.');
      }
      
      console.log('\n================================================================================');
      console.log('alerts section (status tracking):');
      console.log('================================================================================\n');
      
      let count = 0;
      for (const [id, alert] of Object.entries(snapshotData.alerts)) {
        console.log(`  ${id}: ${JSON.stringify(alert)}`);
        if (++count >= 3) break;
      }
      
    } else {
      console.log('❌ No snapshots found in S3');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'NoCredentialsError') {
      console.error('AWS credentials not configured. Check .env file.');
    }
  }
}

checkS3Data();

