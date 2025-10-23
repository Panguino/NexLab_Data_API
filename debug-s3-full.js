/**
 * Debug S3 snapshot to see full alert data
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function debugS3() {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: 'alerts-optimized/2025/10/23/',
      MaxKeys: 5
    };

    const data = await s3.listObjectsV2(params).promise();
    
    if (data.Contents && data.Contents.length > 0) {
      const firstKey = data.Contents[0].Key;
      console.log(`Fetching: ${firstKey}\n`);
      
      const snapshot = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: firstKey
      }).promise();
      
      const snapshotData = JSON.parse(snapshot.Body.toString());
      
      console.log('Full Snapshot:');
      console.log(JSON.stringify(snapshotData, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugS3();

