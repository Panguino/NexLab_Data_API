/**
 * Dump full snapshot
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function dumpSnapshot() {
  try {
    const snapshot = await s3.getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: 'alerts/2025/10/23/16-27-30.json'
    }).promise();
    
    const data = JSON.parse(snapshot.Body.toString());
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

dumpSnapshot();

