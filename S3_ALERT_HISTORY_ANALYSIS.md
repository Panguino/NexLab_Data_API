# S3 Alert History Storage - Analysis & Recommendations

## 📊 Storage Size Estimation

### Current Alert Data Structure

Based on the codebase analysis, each alert contains:
```javascript
{
  id: "uuid",                    // ~36 bytes
  properties: {
    event: "string",             // ~30 bytes
    sent: "ISO timestamp",       // ~24 bytes
    effective: "ISO timestamp",  // ~24 bytes
    onset: "ISO timestamp",      // ~24 bytes
    expires: "ISO timestamp",    // ~24 bytes
    ends: "ISO timestamp",       // ~24 bytes
    headline: "string",          // ~100 bytes
    description: "string",       // ~500 bytes
    areaDesc: "string",          // ~50 bytes
    severity: "string",          // ~10 bytes
    certainty: "string",         // ~10 bytes
    urgency: "string",           // ~10 bytes
    geocode: {
      SAME: ["codes"],           // ~50 bytes
      UGC: ["codes"]             // ~50 bytes
    }
  }
}
```

**Per Alert Average: ~900 bytes**

### Typical Alert Volume

- **CONUS**: 50-200 active alerts (average: 100)
- **Alaska**: 5-20 alerts (average: 10)
- **Hawaii**: 2-10 alerts (average: 5)
- **Other Regions**: 5-30 alerts (average: 15)
- **Total Average: ~130 alerts at any given time**

### Storage Calculation

**Per Snapshot (every 30 seconds):**
- 130 alerts × 900 bytes = **117 KB**

**Per Hour:**
- 120 snapshots × 117 KB = **14 MB**

**Per Day:**
- 24 hours × 14 MB = **336 MB**

**Per Week:**
- 7 days × 336 MB = **2.35 GB**

**Per Month:**
- 30 days × 336 MB = **10.08 GB**

---

## 💰 AWS S3 Cost Analysis

### Storage Costs (US Standard)
- **1 week**: 2.35 GB × $0.023/GB = **$0.05/week**
- **1 month**: 10.08 GB × $0.023/GB = **$0.23/month**
- **1 year**: 120.96 GB × $0.023/GB = **$2.78/year**

### Request Costs
- **Writes**: 288/day × 30 days = 8,640 writes/month × $0.005/1000 = **$0.04/month**
- **Reads**: Minimal if only for historical queries

### Total Monthly Cost: **~$0.27/month** (extremely cheap!)

---

## 🎯 Recommendations

### Storage Duration
**Recommendation: Store 2-4 weeks of data**

**Why:**
- ✅ Captures most weather event lifecycles (typically 1-2 weeks)
- ✅ Allows trend analysis and pattern recognition
- ✅ Minimal cost (~$0.50/month for 4 weeks)
- ✅ Sufficient for most use cases
- ✅ Easy to manage and query

**Alternative Options:**
- **1 week**: Minimal cost, limited history
- **1 month**: Good balance, captures full event cycles
- **3 months**: More expensive, diminishing returns
- **1 year**: Overkill for most use cases

---

## 🏗️ Architecture Recommendation

### Hybrid Approach: Local Cache + S3 Archive

```
┌─────────────────────────────────────────────────────────┐
│                    Alert Data Flow                       │
└─────────────────────────────────────────────────────────┘

1. Fetch from weather.cod.edu (every 30 seconds)
   ↓
2. Process & Format Alerts
   ↓
3. Store in Local NodeCache (current data)
   ├─→ Used for real-time API responses
   └─→ Fast access, no I/O
   ↓
4. Archive to S3 (every 1-6 hours)
   ├─→ Historical data storage
   ├─→ Backup & disaster recovery
   └─→ Long-term analysis
   ↓
5. Optional: Query S3 for historical data
   └─→ Separate endpoint for historical queries
```

---

## 💻 Implementation Strategy

### Option 1: Hourly Snapshots (RECOMMENDED)

**Pros:**
- ✅ Minimal S3 requests (24/day)
- ✅ Manageable file sizes (~840 MB/week)
- ✅ Easy to query by date/time
- ✅ Good balance of granularity and cost

**Cons:**
- ❌ Misses some alert changes within the hour

**File Structure:**
```
s3://nexlab-alerts/
├── 2024/10/23/
│   ├── 00-00.json (midnight snapshot)
│   ├── 01-00.json (1 AM snapshot)
│   ├── 02-00.json (2 AM snapshot)
│   └── ...
├── 2024/10/24/
│   └── ...
```

### Option 2: 6-Hour Snapshots

**Pros:**
- ✅ Minimal storage (210 MB/week)
- ✅ Minimal S3 requests (4/day)
- ✅ Lowest cost

**Cons:**
- ❌ Less granular data
- ❌ May miss important changes

### Option 3: Real-Time Streaming

**Pros:**
- ✅ Complete history of every change
- ✅ Most detailed data

**Cons:**
- ❌ High S3 costs (4,320 writes/day)
- ❌ Complex implementation
- ❌ Overkill for most use cases

---

## 🔧 Implementation Plan

### Step 1: Add AWS SDK
```bash
npm install aws-sdk
```

### Step 2: Create S3 Archive Module
```javascript
// src/util/jobs/archiveAlertsToS3.js
- Connect to S3
- Serialize current cache
- Upload with timestamp
- Implement retention policy
```

### Step 3: Create Historical Query Endpoint
```javascript
// GET /api/alerts/history?date=2024-10-23&region=CONUS
- Query S3 for historical snapshots
- Return time-series data
- Support filtering by date range
```

### Step 4: Environment Configuration
```
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=nexlab-alerts
AWS_S3_REGION=us-east-1
ARCHIVE_INTERVAL=3600000  // 1 hour in milliseconds
RETENTION_DAYS=28         // Keep 4 weeks
```

---

## 📋 Data Structure for S3

### Snapshot Format
```json
{
  "timestamp": "2024-10-23T14:00:00Z",
  "snapshot_id": "uuid",
  "alerts_count": 127,
  "regions": {
    "CONUS": {
      "alerts_count": 95,
      "alerts": [
        {
          "id": "alert-uuid",
          "event": "Tornado Warning",
          "hazardType": "TORNADO",
          "hazardLevel": "WARNING",
          "locationId": "12086",
          "locationName": "Miami-Dade",
          "state": "FL",
          "sent": "2024-10-23T13:30:00Z",
          "expires": "2024-10-23T14:30:00Z",
          "headline": "...",
          "description": "..."
        }
      ]
    }
  }
}
```

---

## 🔐 Security Considerations

### Credentials Management
**DO NOT commit credentials to repo!**

**Instead:**
1. Use AWS IAM roles (if on EC2)
2. Use environment variables (.env file)
3. Use AWS Secrets Manager
4. Use AWS Systems Manager Parameter Store

### S3 Bucket Configuration
```json
{
  "Versioning": "Enabled",
  "ServerSideEncryption": "AES256",
  "PublicAccessBlockConfiguration": {
    "BlockPublicAcls": true,
    "BlockPublicPolicy": true,
    "IgnorePublicAcls": true,
    "RestrictPublicBuckets": true
  },
  "LifecycleConfiguration": {
    "Rules": [
      {
        "Id": "DeleteOldSnapshots",
        "Status": "Enabled",
        "ExpirationInDays": 28
      }
    ]
  }
}
```

---

## 📈 Historical Query Endpoint

### New Endpoint: Get Alert History
```
GET /api/alerts/history?date=2024-10-23&region=CONUS&hazardType=TORNADO
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-10-23T00:00:00Z",
      "alerts_count": 95,
      "alerts": [...]
    },
    {
      "timestamp": "2024-10-23T01:00:00Z",
      "alerts_count": 98,
      "alerts": [...]
    }
  ]
}
```

---

## 🎯 Benefits of This Approach

✅ **Local Cache**: Fast real-time API responses
✅ **S3 Archive**: Long-term historical data
✅ **Separation of Concerns**: Current vs. historical
✅ **Cost Effective**: ~$0.27/month for 4 weeks
✅ **Scalable**: Easy to add more regions
✅ **Queryable**: Time-series analysis possible
✅ **Backup**: Disaster recovery capability
✅ **Compliance**: Audit trail of alerts

---

## 📊 Recommended Configuration

```javascript
// .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=nexlab-alerts
AWS_S3_REGION=us-east-1
ARCHIVE_INTERVAL=3600000      // 1 hour
RETENTION_DAYS=28             // 4 weeks
ENABLE_S3_ARCHIVE=true
```

---

## 🚀 Next Steps

1. **Create AWS S3 bucket** with lifecycle policies
2. **Add AWS SDK** to package.json
3. **Create S3 archive module** (src/util/jobs/archiveAlertsToS3.js)
4. **Create historical query endpoint** (GET /api/alerts/history)
5. **Add environment variables** to .env
6. **Test** with sample data
7. **Monitor** S3 costs and storage

---

## 💡 Alternative: Database Instead of S3

If you prefer a database approach:

**PostgreSQL/MySQL:**
- ✅ Better for complex queries
- ✅ Easier to implement
- ❌ Higher cost (~$10-50/month)
- ❌ More maintenance

**DynamoDB:**
- ✅ Serverless
- ✅ Auto-scaling
- ❌ More expensive for this use case
- ❌ Complex pricing model

**Recommendation: S3 is best for this use case** (simple snapshots, low cost, easy to manage)

---

## 📞 Questions to Consider

1. Do you need real-time historical queries or batch analysis?
2. How far back do you need to query (1 week, 1 month, 1 year)?
3. Do you need to track alert changes or just snapshots?
4. What's your budget for storage?
5. Do you need compliance/audit trails?

---

**Recommendation Summary:**
- **Storage Duration**: 2-4 weeks
- **Snapshot Frequency**: Hourly
- **Estimated Cost**: $0.27/month
- **Storage Size**: 840 MB - 2.35 GB
- **Implementation**: Hybrid (Local Cache + S3 Archive)

