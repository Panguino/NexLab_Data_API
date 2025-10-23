# S3 Alert History Storage - Complete Summary

## 🎯 Executive Summary

You can store **2-4 weeks of alert history** in AWS S3 for approximately **$0.23/month** using a hybrid approach that keeps real-time data in local cache and archives hourly snapshots to S3.

---

## 📊 Storage Analysis

### Data Size Breakdown

```
Per Alert:           ~900 bytes
Active Alerts:       ~130 (average)
Per Snapshot:        117 KB (every 30 seconds)
Per Hour:            14 MB (120 snapshots)
Per Day:             336 MB
Per Week:            2.35 GB
Per Month:           10.08 GB
```

### Cost Breakdown

```
1 Week:              $0.05/month
2 Weeks:             $0.11/month
1 Month:             $0.23/month  ← RECOMMENDED
3 Months:            $0.70/month
```

---

## 🏗️ Recommended Architecture

### Hybrid Approach: Local Cache + S3 Archive

```
┌─────────────────────────────────────────────────────┐
│           Weather Data Pipeline                      │
└─────────────────────────────────────────────────────┘

1. FETCH (every 30 seconds)
   └─→ weather.cod.edu API

2. PROCESS & FORMAT
   └─→ Extract alerts, calculate colors, organize by region

3. LOCAL CACHE (Real-time)
   ├─→ NodeCache (in-memory)
   ├─→ Fast API responses
   └─→ GET /api/hazards endpoints

4. S3 ARCHIVE (Historical)
   ├─→ Hourly snapshots
   ├─→ 2-4 weeks retention
   └─→ GET /api/alerts/history endpoint

5. QUERY OPTIONS
   ├─→ Real-time: /api/hazards
   └─→ Historical: /api/alerts/history?date=2024-10-23
```

---

## ✨ Key Benefits

### Local Cache (Current Data)
✅ **Fast** - In-memory, no I/O
✅ **Real-time** - Updated every 30 seconds
✅ **Efficient** - Minimal CPU/memory overhead
✅ **Reliable** - No external dependencies

### S3 Archive (Historical Data)
✅ **Cheap** - $0.23/month for 1 month
✅ **Scalable** - Unlimited storage
✅ **Durable** - 99.999999999% durability
✅ **Queryable** - Time-series analysis
✅ **Compliant** - Audit trail of alerts

---

## 🔧 Implementation Overview

### What You'll Create

**2 New Files:**
1. `src/util/jobs/archiveAlertsToS3.js` - Archive module
2. `src/routes/alertHistory.js` - Historical query endpoint

**3 Modified Files:**
1. `schedule.js` - Add archive job
2. `server.js` - Register history route
3. `package.json` - Add aws-sdk

**Environment Variables:**
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

## 📈 New Endpoints

### Real-time Hazards (Existing)
```
GET /api/hazards
GET /api/hazards?region=CONUS&hazardType=TORNADO
GET /api/hazards/county/:fips
GET /api/hazards/state/:state
GET /api/hazards/region/:region
```

### Historical Hazards (New)
```
GET /api/alerts/history?date=2024-10-23
GET /api/alerts/history?date=2024-10-23&region=CONUS
GET /api/alerts/history?date=2024-10-23&hazardType=WINTER
GET /api/alerts/history?date=2024-10-23&region=CONUS&hazardType=TORNADO
```

---

## 💾 S3 File Organization

```
s3://nexlab-alerts/
├── alerts/
│   ├── 2024/
│   │   ├── 10/
│   │   │   ├── 23/
│   │   │   │   ├── 00-00.json (midnight)
│   │   │   │   ├── 01-00.json (1 AM)
│   │   │   │   ├── 02-00.json (2 AM)
│   │   │   │   └── ... (24 files per day)
│   │   │   ├── 24/
│   │   │   │   └── ...
```

**Auto-cleanup:** Files older than 28 days are automatically deleted

---

## 🚀 Implementation Steps

### Phase 1: AWS Setup (30 min)
1. Create S3 bucket: `nexlab-alerts`
2. Generate AWS credentials
3. Set lifecycle policy (28-day expiration)
4. Add credentials to `.env`

### Phase 2: Code Implementation (45 min)
1. Install aws-sdk: `npm install aws-sdk`
2. Create archive module
3. Create history endpoint
4. Add schedule job
5. Register route

### Phase 3: Testing (30 min)
1. Test archive job manually
2. Test history endpoint
3. Verify S3 uploads
4. Monitor costs

**Total Time: 1-2 hours**

---

## 🔐 Security Considerations

### Credentials Management
✅ Use environment variables (.env)
✅ Never commit credentials to git
✅ Use IAM roles if on AWS EC2
✅ Rotate credentials regularly

### S3 Bucket Security
✅ Block public access
✅ Enable versioning
✅ Enable server-side encryption
✅ Set lifecycle policies
✅ Use bucket policies for access control

---

## 📊 Snapshot Frequency Comparison

| Frequency | Snapshots/Day | Storage/Week | Cost/Month | Granularity |
|-----------|---------------|--------------|-----------|-------------|
| Real-time | 2,880 | 20 GB | $2.00 | Perfect |
| 15-min | 96 | 670 MB | $0.15 | Very Good |
| **Hourly** | **24** | **2.35 GB** | **$0.23** | **Good** |
| 6-hour | 4 | 840 MB | $0.20 | Fair |
| Daily | 1 | 117 MB | $0.03 | Poor |

**Recommendation: Hourly** - Best balance of cost and granularity

---

## 💡 Use Cases

### Real-time Monitoring
```
GET /api/hazards?region=CONUS&hazardType=TORNADO
```
- Current active tornado warnings
- DeckGL visualization
- Real-time alerts

### Historical Analysis
```
GET /api/alerts/history?date=2024-10-23&region=CONUS
```
- Trend analysis
- Pattern recognition
- Seasonal comparisons
- Alert lifecycle tracking

### Compliance & Audit
```
GET /api/alerts/history?date=2024-10-01
```
- Historical record of alerts
- Audit trail
- Compliance reporting
- Data retention

---

## 🎯 Recommended Configuration

```javascript
// .env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=nexlab-alerts
AWS_S3_REGION=us-east-1
ARCHIVE_INTERVAL=3600000      // 1 hour
RETENTION_DAYS=28             // 4 weeks
ENABLE_S3_ARCHIVE=true
```

---

## 📋 Comparison: S3 vs Alternatives

| Option | Cost/Month | Setup | Maintenance | Queries |
|--------|-----------|-------|-------------|---------|
| **S3** | $0.23 | Easy | Minimal | Good |
| PostgreSQL | $10-50 | Medium | Medium | Excellent |
| DynamoDB | $1-10 | Medium | Low | Good |
| File System | $0 | Easy | High | Poor |

**Recommendation: S3** - Best for this use case

---

## ✅ Implementation Checklist

### Pre-Implementation
- [ ] Review S3_ALERT_HISTORY_ANALYSIS.md
- [ ] Review S3_IMPLEMENTATION_GUIDE.md
- [ ] Create AWS account (if needed)
- [ ] Generate AWS credentials

### Implementation
- [ ] Create S3 bucket
- [ ] Set lifecycle policy
- [ ] Install aws-sdk
- [ ] Create archive module
- [ ] Create history endpoint
- [ ] Add schedule job
- [ ] Register route
- [ ] Add environment variables

### Testing
- [ ] Test archive job
- [ ] Test history endpoint
- [ ] Verify S3 uploads
- [ ] Check data format
- [ ] Monitor costs

### Production
- [ ] Deploy to staging
- [ ] Monitor for 24 hours
- [ ] Deploy to production
- [ ] Set up CloudWatch alerts
- [ ] Document for team

---

## 📞 Documentation Files

| File | Purpose |
|------|---------|
| `S3_ALERT_HISTORY_ANALYSIS.md` | Detailed analysis & recommendations |
| `S3_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation |
| `S3_QUICK_REFERENCE.md` | Quick reference guide |
| `S3_ALERT_HISTORY_SUMMARY.md` | This file - complete summary |

---

## 🎓 Next Steps

1. **Read** `S3_IMPLEMENTATION_GUIDE.md` for detailed steps
2. **Create** AWS S3 bucket
3. **Install** aws-sdk: `npm install aws-sdk`
4. **Implement** archive module and history endpoint
5. **Test** with sample data
6. **Deploy** to production
7. **Monitor** costs and performance

---

## 💬 Questions?

**Q: How much storage do I need?**
A: 2.35 GB for 1 week, 10.08 GB for 1 month

**Q: How much will it cost?**
A: ~$0.23/month for 1 month of data

**Q: How often are snapshots taken?**
A: Hourly (24 snapshots per day)

**Q: Can I query historical data?**
A: Yes, via GET /api/alerts/history endpoint

**Q: Will this affect real-time API?**
A: No, local cache remains unchanged

**Q: How long is data retained?**
A: 28 days (auto-deleted by lifecycle policy)

---

## 🎉 Summary

**What You Get:**
- ✅ 2-4 weeks of alert history
- ✅ Time-series data for analysis
- ✅ Minimal cost (~$0.23/month)
- ✅ Fast local cache + S3 archive
- ✅ Historical query endpoint
- ✅ Automatic cleanup

**Implementation Time:** 1-2 hours
**Ongoing Maintenance:** Minimal
**Cost:** ~$0.23/month

---

**Ready to implement? Start with `S3_IMPLEMENTATION_GUIDE.md`**

For questions or issues, refer to the detailed documentation files.

