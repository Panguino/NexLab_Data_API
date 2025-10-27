/**
 * Test script to diagnose historical data retrieval issues
 * Checks if expired alerts are being stored and retrieved correctly
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

async function analyzeSnapshots() {
  try {
    console.log('🔍 HISTORICAL DATA ISSUE DIAGNOSTIC\n');
    console.log('=' .repeat(60));

    // Get today's date
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    
    const prefix = `alerts-optimized/${year}/${month}/${day}/`;
    
    console.log(`\n📋 Checking S3 snapshots for: ${year}-${month}-${day}`);
    console.log(`Prefix: ${prefix}\n`);
    
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
      MaxKeys: 10
    };
    
    const listResult = await s3.listObjectsV2(listParams).promise();
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('❌ No snapshots found for today');
      return;
    }
    
    console.log(`✅ Found ${listResult.Contents.length} snapshots\n`);
    
    // Get the last 3 snapshots
    const snapshots = listResult.Contents
      .sort((a, b) => b.LastModified - a.LastModified)
      .slice(0, 3);
    
    let totalExpiredNotStored = 0;
    let totalExpiredStored = 0;
    
    for (let i = 0; i < snapshots.length; i++) {
      const obj = snapshots[i];
      console.log(`\n📄 Snapshot ${i + 1}: ${obj.Key.split('/').pop()}`);
      console.log('-'.repeat(60));
      
      const getParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: obj.Key,
      };
      
      const data = await s3.getObject(getParams).promise();
      const snapshot = JSON.parse(data.Body.toString());
      
      console.log(`Timestamp: ${snapshot.timestamp}`);
      console.log(`Total alerts tracked: ${snapshot.alerts_count}`);
      console.log(`  New: ${snapshot.new_count}`);
      console.log(`  Unchanged: ${snapshot.unchanged_count}`);
      console.log(`  Expired: ${snapshot.expired_count}`);
      
      const alertDataCount = Object.keys(snapshot.alert_data || {}).length;
      const alertsCount = Object.keys(snapshot.alerts || {}).length;
      
      console.log(`\nData sections:`);
      console.log(`  alert_data keys: ${alertDataCount}`);
      console.log(`  alerts keys: ${alertsCount}`);
      
      // Check for expired alerts
      const expiredAlerts = Object.entries(snapshot.alerts || {})
        .filter(([id, data]) => data.status === 'expired')
        .map(([id]) => id);
      
      if (expiredAlerts.length > 0) {
        console.log(`\n⚠️  EXPIRED ALERTS FOUND: ${expiredAlerts.length}`);
        
        // Check if expired alerts are in alert_data
        const expiredInData = expiredAlerts.filter(id => 
          snapshot.alert_data && snapshot.alert_data[id]
        );
        const expiredNotInData = expiredAlerts.length - expiredInData.length;
        
        console.log(`  ✅ Expired alerts WITH full data: ${expiredInData.length}`);
        console.log(`  ❌ Expired alerts WITHOUT full data: ${expiredNotInData.length}`);
        
        totalExpiredStored += expiredInData.length;
        totalExpiredNotStored += expiredNotInData.length;
        
        if (expiredNotInData > 0) {
          console.log(`\n  🚨 ISSUE DETECTED: Expired alerts missing full data!`);
          console.log(`  Sample expired alert IDs (no data):`);
          expiredAlerts
            .filter(id => !snapshot.alert_data || !snapshot.alert_data[id])
            .slice(0, 3)
            .forEach(id => console.log(`    - ${id}`));
        }
      } else {
        console.log(`\n✅ No expired alerts in this snapshot`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(60));
    console.log(`Total expired alerts WITH full data: ${totalExpiredStored}`);
    console.log(`Total expired alerts WITHOUT full data: ${totalExpiredNotStored}`);
    
    if (totalExpiredNotStored > 0) {
      console.log(`\n🚨 CRITICAL ISSUE FOUND:`);
      console.log(`   ${totalExpiredNotStored} expired alerts are missing full data`);
      console.log(`   These alerts will NOT appear in historical queries`);
      console.log(`\n   FIX NEEDED: Store full alert data before expiry`);
    } else {
      console.log(`\n✅ All expired alerts have full data stored`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'NoCredentialsError') {
      console.error('   AWS credentials not configured');
    }
  }
}

analyzeSnapshots();

