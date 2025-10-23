# S3 Alert History - Quick Reference

## 📊 Storage Size Summary

| Metric | Value |
|--------|-------|
| **Per Alert** | ~900 bytes |
| **Typical Active Alerts** | 130 |
| **Per Snapshot (30 sec)** | 117 KB |
| **Per Hour** | 14 MB |
| **Per Day** | 336 MB |
| **Per Week** | 2.35 GB |
| **Per Month** | 10.08 GB |

---

## 💰 Cost Summary

| Duration | Storage | Monthly Cost |
|----------|---------|--------------|
| **1 week** | 2.35 GB | $0.05 |
| **2 weeks** | 4.7 GB | $0.11 |
| **1 month** | 10.08 GB | $0.23 |
| **3 months** | 30.24 GB | $0.70 |

**Recommendation: 2-4 weeks = $0.11-0.23/month**

---

## 🎯 Recommended Architecture

```
Current Data (Real-time API)
    ↓
Local NodeCache (30-second updates)
    ↓
S3 Archive (Hourly snapshots)
    ↓
Historical Query Endpoint
```

---

## 🚀 Implementation Checklist

### Phase 1: Setup (30 minutes)
- [ ] Create AWS S3 bucket
- [ ] Generate AWS credentials
- [ ] Add to .env file
- [ ] Install aws-sdk: `npm install aws-sdk`

### Phase 2: Archive Module (45 minutes)
- [ ] Create `src/util/jobs/archiveAlertsToS3.js`
- [ ] Create `src/routes/alertHistory.js`
- [ ] Add schedule job to `schedule.js`
- [ ] Register route in `server.js`

### Phase 3: Testing (30 minutes)
- [ ] Test archive job manually
- [ ] Test history endpoint
- [ ] Verify S3 uploads
- [ ] Monitor costs

---

## 📝 Environment Variables

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=nexlab-alerts
AWS_S3_REGION=us-east-1
ARCHIVE_INTERVAL=3600000      # 1 hour
RETENTION_DAYS=28             # 4 weeks
ENABLE_S3_ARCHIVE=true
```

---

## 🔧 Key Files to Create

### 1. `src/util/jobs/archiveAlertsToS3.js`
- Extracts alerts from cache
- Uploads to S3 with timestamp
- Handles errors gracefully

### 2. `src/routes/alertHistory.js`
- GET /api/alerts/history endpoint
- Supports filtering by date, region, hazard type
- Returns time-series data

### 3. Modifications to existing files
- `schedule.js` - Add archive job
- `server.js` - Register history route
- `package.json` - Add aws-sdk dependency

---

## 📊 S3 File Structure

```
s3://nexlab-alerts/
├── alerts/
│   ├── 2024/
│   │   ├── 10/
│   │   │   ├── 23/
│   │   │   │   ├── 00-00.json (midnight)
│   │   │   │   ├── 01-00.json (1 AM)
│   │   │   │   ├── 02-00.json (2 AM)
│   │   │   │   └── ...
│   │   │   ├── 24/
│   │   │   │   └── ...
```

---

## 🔐 Security Best Practices

✅ **DO:**
- Use environment variables for credentials
- Enable S3 versioning
- Set lifecycle policies (auto-delete after 28 days)
- Block public access
- Use server-side encryption
- Use IAM roles (if on AWS)

❌ **DON'T:**
- Commit credentials to git
- Use root AWS account
- Make bucket public
- Store credentials in code

---

## 📈 Query Examples

### Get All Alerts for a Date
```bash
curl "http://localhost:3000/api/alerts/history?date=2024-10-23"
```

### Get CONUS Alerts
```bash
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&region=CONUS"
```

### Get Winter Warnings
```bash
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&hazardType=WINTER"
```

### Get Winter Warnings in CONUS
```bash
curl "http://localhost:3000/api/alerts/history?date=2024-10-23&region=CONUS&hazardType=WINTER"
```

---

## 💡 Key Benefits

✅ **Hybrid Approach**
- Fast local cache for real-time API
- S3 for long-term history
- Best of both worlds

✅ **Cost Effective**
- ~$0.23/month for 1 month of data
- Minimal S3 requests (24/day)
- Auto-cleanup with lifecycle policies

✅ **Scalable**
- Easy to add more regions
- No database maintenance
- Serverless architecture

✅ **Queryable**
- Time-series analysis
- Trend detection
- Historical comparisons

---

## 🎯 Snapshot Frequency Options

| Frequency | Snapshots/Day | Storage/Week | Cost/Month | Use Case |
|-----------|---------------|--------------|-----------|----------|
| **Real-time** | 2,880 | 20 GB | $2.00 | Overkill |
| **6-hour** | 4 | 210 MB | $0.05 | Minimal |
| **Hourly** | 24 | 2.35 GB | $0.23 | **RECOMMENDED** |
| **6-hour** | 4 | 840 MB | $0.20 | Good balance |

**Recommendation: Hourly snapshots** - Best balance of granularity and cost

---

## 🚨 Potential Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Access Denied | Bad credentials | Check .env file |
| Bucket not found | Wrong bucket name | Verify bucket exists |
| No data returned | Archive hasn't run | Wait for next hour or run manually |
| High costs | Too frequent snapshots | Reduce frequency to hourly |
| Storage full | Lifecycle policy not set | Set 28-day expiration |

---

## 📞 AWS CLI Commands

### Create Bucket
```bash
aws s3 mb s3://nexlab-alerts --region us-east-1
```

### Set Lifecycle Policy
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket nexlab-alerts \
  --lifecycle-configuration file://lifecycle.json
```

### List Contents
```bash
aws s3 ls s3://nexlab-alerts --recursive --summarize
```

### Check Costs
```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-10-01,End=2024-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 🎓 Learning Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)

---

## ✅ Implementation Status

- [ ] Phase 1: AWS Setup
- [ ] Phase 2: Code Implementation
- [ ] Phase 3: Testing & Verification
- [ ] Phase 4: Production Deployment
- [ ] Phase 5: Monitoring & Optimization

---

## 📋 Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `S3_ALERT_HISTORY_ANALYSIS.md` | Detailed analysis & recommendations | ✅ Created |
| `S3_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation | ✅ Created |
| `S3_QUICK_REFERENCE.md` | This file - quick reference | ✅ Created |

---

## 🎉 Summary

**What You Get:**
- ✅ 2-4 weeks of alert history
- ✅ Time-series data for analysis
- ✅ Minimal cost (~$0.23/month)
- ✅ Fast local cache + S3 archive
- ✅ Historical query endpoint

**Implementation Time:** 1-2 hours
**Ongoing Maintenance:** Minimal (auto-cleanup)
**Cost:** ~$0.23/month

---

**Ready to implement? Start with `S3_IMPLEMENTATION_GUIDE.md`**

