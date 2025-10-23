# S3 Alert History - Implementation Guide

## 🚀 Quick Summary

**Storage Needed for 1 Week**: ~2.35 GB
**Monthly Cost**: ~$0.27
**Recommendation**: Store 2-4 weeks of hourly snapshots

---

## 📋 Step-by-Step Implementation

### Step 1: Install AWS SDK

```bash
npm install aws-sdk
```

### Step 2: Create .env Variables

Add to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=nexlab-alerts
AWS_S3_REGION=us-east-1

# Archive Configuration
ARCHIVE_INTERVAL=3600000      # 1 hour in milliseconds
RETENTION_DAYS=28             # Keep 4 weeks of data
ENABLE_S3_ARCHIVE=true
```

### Step 3: Create S3 Archive Module

Create `src/util/jobs/archiveAlertsToS3.js`:

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

async function archiveAlertsToS3(cache) {
  try {
    // Get current region data from cache
    const regionData = cache.get('regionData');
    
    if (!regionData) {
      console.log('No region data to archive');
      return { success: false, message: 'No region data' };
    }

    // Extract alerts from region data
    const snapshot = extractAlertsSnapshot(regionData);
    
    // Generate S3 key with date/time
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    
    const s3Key = `alerts/${year}/${month}/${day}/${hour}-${minute}.json`;
    
    // Upload to S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(snapshot, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
    };
    
    await s3.putObject(params).promise();
    
    console.log(`✅ Archived alerts to S3: ${s3Key}`);
    
    return {
      success: true,
      message: 'Alerts archived to S3',
      s3Key,
      alertsCount: snapshot.alerts_count,
    };
  } catch (error) {
    console.error('❌ Error archiving to S3:', error);
    return { success: false, message: error.message };
  }
}

function extractAlertsSnapshot(regionData) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    snapshot_id: uuidv4(),
    alerts_count: 0,
    regions: {},
  };

  // Extract alerts from each region
  for (const [regionName, region] of Object.entries(regionData)) {
    const regionAlerts = [];
    let regionAlertCount = 0;

    // Extract from counties
    for (const [stateName, state] of Object.entries(region.states || {})) {
      for (const [countyFIPS, county] of Object.entries(state.counties || {})) {
        for (const [alertId, alert] of Object.entries(county.alerts || {})) {
          regionAlerts.push({
            id: alert.id,
            event: alert.properties.event,
            hazardType: alert.properties.hazardType,
            hazardLevel: alert.properties.hazardLevel,
            locationId: county.properties.FIPS,
            locationName: county.properties.COUNTYNAME,
            state: state.properties.STATE,
            sent: alert.properties.sent,
            expires: alert.properties.expires,
            headline: alert.properties.headline,
            description: alert.properties.description,
          });
          regionAlertCount++;
        }
      }
    }

    // Extract from coasts
    for (const [coastId, coast] of Object.entries(region.coasts || {})) {
      for (const [alertId, alert] of Object.entries(coast.alerts || {})) {
        regionAlerts.push({
          id: alert.id,
          event: alert.properties.event,
          hazardType: alert.properties.hazardType,
          hazardLevel: alert.properties.hazardLevel,
          locationId: coast.properties.ID,
          locationName: coast.properties.NAME,
          locationType: 'coast',
          sent: alert.properties.sent,
          expires: alert.properties.expires,
          headline: alert.properties.headline,
          description: alert.properties.description,
        });
        regionAlertCount++;
      }
    }

    // Extract from offshores
    for (const [offshoreId, offshore] of Object.entries(region.offshores || {})) {
      for (const [alertId, alert] of Object.entries(offshore.alerts || {})) {
        regionAlerts.push({
          id: alert.id,
          event: alert.properties.event,
          hazardType: alert.properties.hazardType,
          hazardLevel: alert.properties.hazardLevel,
          locationId: offshore.properties.ID,
          locationName: offshore.properties.Name,
          locationType: 'offshore',
          sent: alert.properties.sent,
          expires: alert.properties.expires,
          headline: alert.properties.headline,
          description: alert.properties.description,
        });
        regionAlertCount++;
      }
    }

    if (regionAlerts.length > 0) {
      snapshot.regions[regionName] = {
        alerts_count: regionAlertCount,
        alerts: regionAlerts,
      };
      snapshot.alerts_count += regionAlertCount;
    }
  }

  return snapshot;
}

module.exports = archiveAlertsToS3;
```

### Step 4: Schedule Archive Job

Add to `schedule.js`:

```javascript
const archiveAlertsToS3 = require('./src/util/jobs/archiveAlertsToS3');

// Archive alerts to S3 every hour
if (process.env.ENABLE_S3_ARCHIVE === 'true') {
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Running S3 archive job...');
    const result = await archiveAlertsToS3(cache);
    console.log(result);
  });
}
```

### Step 5: Create Historical Query Endpoint

Create `src/routes/alertHistory.js`:

```javascript
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

// GET /api/alerts/history?date=2024-10-23&region=CONUS
router.get('/', async (req, res) => {
  try {
    const { date, region, hazardType } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date parameter required (YYYY-MM-DD)',
      });
    }

    // Parse date
    const [year, month, day] = date.split('-');
    const prefix = `alerts/${year}/${month}/${day}/`;

    // List all snapshots for the day
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
    };

    const listResult = await s3.listObjectsV2(listParams).promise();

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return res.json({
        success: true,
        message: 'No data found for this date',
        data: [],
      });
    }

    // Fetch all snapshots
    const snapshots = [];
    for (const obj of listResult.Contents) {
      const getParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: obj.Key,
      };

      const data = await s3.getObject(getParams).promise();
      const snapshot = JSON.parse(data.Body.toString());

      // Filter by region if specified
      if (region && snapshot.regions[region]) {
        snapshot.regions = { [region]: snapshot.regions[region] };
      }

      // Filter by hazard type if specified
      if (hazardType) {
        for (const regionName in snapshot.regions) {
          snapshot.regions[regionName].alerts = 
            snapshot.regions[regionName].alerts.filter(
              a => a.hazardType === hazardType
            );
        }
      }

      snapshots.push(snapshot);
    }

    res.json({
      success: true,
      message: `Found ${snapshots.length} snapshots for ${date}`,
      data: snapshots,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message,
    });
  }
});

module.exports = router;
```

### Step 6: Register Route in server.js

Add to `server.js`:

```javascript
const alertHistoryRouter = require('./src/routes/alertHistory');

// ... later in the file ...

// Register alert history routes
app.use('/api/alerts/history', alertHistoryRouter);
```

---

## 🔐 AWS S3 Setup

### Create S3 Bucket

```bash
aws s3 mb s3://nexlab-alerts --region us-east-1
```

### Set Lifecycle Policy

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket nexlab-alerts \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteOldSnapshots",
        "Status": "Enabled",
        "ExpirationInDays": 28,
        "Prefix": "alerts/"
      }
    ]
  }'
```

### Enable Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket nexlab-alerts \
  --versioning-configuration Status=Enabled
```

### Block Public Access

```bash
aws s3api put-public-access-block \
  --bucket nexlab-alerts \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

## 📊 Usage Examples

### Archive Alerts (Automatic)
Runs every hour automatically via schedule.js

### Query Historical Data

```bash
# Get all alerts for a specific date
curl "http://localhost:3000/api/alerts/history?date=2024-10-23"

# Get alerts for a specific region
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&region=CONUS"

# Get specific hazard type
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&hazardType=TORNADO"

# Combine filters
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&region=CONUS&hazardType=WINTER"
```

---

## 💾 Storage Breakdown

| Duration | Size | Cost/Month |
|----------|------|-----------|
| 1 week | 2.35 GB | $0.05 |
| 2 weeks | 4.7 GB | $0.11 |
| 1 month | 10.08 GB | $0.23 |
| 3 months | 30.24 GB | $0.70 |

---

## ✅ Verification Checklist

- [ ] AWS credentials configured in .env
- [ ] S3 bucket created
- [ ] Lifecycle policy set to 28 days
- [ ] aws-sdk installed
- [ ] archiveAlertsToS3.js created
- [ ] alertHistory.js created
- [ ] Routes registered in server.js
- [ ] Schedule job added
- [ ] Test archive job manually
- [ ] Test history endpoint
- [ ] Monitor S3 costs

---

## 🧪 Testing

### Manual Archive Test

```javascript
// In server.js or a test file
const archiveAlertsToS3 = require('./src/util/jobs/archiveAlertsToS3');

// Run manually
archiveAlertsToS3(cache).then(result => {
  console.log('Archive result:', result);
});
```

### Test History Endpoint

```bash
curl "http://localhost:3000/api/alerts/history?date=2024-10-23"
```

---

## 🚨 Troubleshooting

**Error: "Access Denied"**
- Check AWS credentials in .env
- Verify S3 bucket exists
- Check IAM permissions

**Error: "Bucket not found"**
- Verify bucket name in .env
- Check AWS region

**No data returned**
- Check if archive job has run
- Verify date format (YYYY-MM-DD)
- Check S3 bucket contents

---

## 📈 Monitoring

### Check S3 Usage

```bash
aws s3 ls s3://nexlab-alerts --recursive --summarize
```

### Monitor Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-10-01,End=2024-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🎯 Next Steps

1. Install aws-sdk: `npm install aws-sdk`
2. Create S3 bucket
3. Add environment variables
4. Create archive module
5. Create history endpoint
6. Test everything
7. Monitor costs

**Estimated Implementation Time**: 1-2 hours

