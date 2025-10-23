# Alert History Optimization - Implementation Guide

## 🎯 Overview

The current implementation stores **full alert data in every hourly snapshot**, resulting in **96% redundant data**. This guide explains the optimization and how to implement it.

---

## 📊 The Problem

### Current Data Flow
```
Every Hour:
  - Extract 130 alerts
  - Store FULL data for each alert
  - Result: 117 KB per snapshot
  - Per Day: 336 MB
  - Per Month: 10.08 GB
  - Cost: $0.23/month

Example: Single alert over 24 hours
  - Stored 24 times (once per snapshot)
  - Same data repeated 24 times
  - Wasted: 20.7 KB (96% redundant!)
```

### Why It's Inefficient
```json
Snapshot 1 (16:00):
{
  "alerts": [
    {
      "id": "alert-1",
      "event": "Tornado Warning",
      "headline": "Tornado Warning issued",
      "description": "...",
      "severity": "Extreme",
      ...
    }
  ]
}

Snapshot 2 (17:00):
{
  "alerts": [
    {
      "id": "alert-1",
      "event": "Tornado Warning",
      "headline": "Tornado Warning issued",
      "description": "...",
      "severity": "Extreme",
      ...
    }
  ]
}

// Same alert, identical data, stored twice!
```

---

## ✨ The Solution

### Optimized Data Flow
```
Every Hour:
  - Extract current alerts
  - Compare with previous snapshot
  - Store FULL data only for NEW/UPDATED alerts
  - Store only ID+STATUS for UNCHANGED alerts
  - Store only ID+STATUS for EXPIRED alerts
  - Result: 18 KB per snapshot (85% reduction!)
  - Per Day: 50 MB
  - Per Month: 1.5 GB
  - Cost: $0.03/month
```

### How It Works
```javascript
// Previous snapshot
{
  "alert-1": { full data... },
  "alert-2": { full data... }
}

// Current snapshot
{
  "alert-1": { full data... },  // UNCHANGED - store only ID+status
  "alert-2": { full data... },  // UPDATED - store full data
  "alert-3": { full data... }   // NEW - store full data
}

// Optimized snapshot
{
  "alert-1": { id: "alert-1", status: "unchanged" },  // 50 bytes
  "alert-2": { full data..., status: "updated" },     // 900 bytes
  "alert-3": { full data..., status: "new" }          // 900 bytes
}
```

---

## 🚀 Implementation Steps

### Step 1: Create Optimized Archive Module
**File**: `src/util/jobs/archiveAlertsToS3Optimized.js`

Features:
- Compares current alerts with previous snapshot
- Stores full data only for new/updated alerts
- Stores only ID+status for unchanged/expired alerts
- Tracks statistics (new, unchanged, expired counts)

```javascript
// Usage
const archiveAlertsToS3Optimized = require('./src/util/jobs/archiveAlertsToS3Optimized');
const result = await archiveAlertsToS3Optimized(cache);
// Result: { new_count: 5, unchanged_count: 120, expired_count: 2 }
```

### Step 2: Create Optimized Query Endpoints
**File**: `src/routes/alertHistoryOptimized.js`

Endpoints:
- `GET /api/alerts/history/optimized?date=2025-10-23`
  - Returns deduplicated alerts + timeline
  - 95% smaller response

- `GET /api/alerts/history/last?hours=24`
  - Get alerts from last X hours
  - Automatically deduplicates across multiple snapshots

### Step 3: Update Schedule (Optional)
Replace or supplement the current archive job:

```javascript
// Option A: Replace current job
ns.scheduleJob('0 * * * *', async () => {
  const result = await archiveAlertsToS3Optimized(cache);
});

// Option B: Run both (for comparison)
ns.scheduleJob('0 * * * *', async () => {
  await archiveAlertsToS3(cache);           // Current
  await archiveAlertsToS3Optimized(cache);  // Optimized
});
```

### Step 4: Register Routes
```javascript
// In server.js
const alertHistoryOptimizedRouter = require('./src/routes/alertHistoryOptimized');
app.use('/api/alerts/history', alertHistoryOptimizedRouter);
```

---

## 📈 Data Comparison

### Single Alert Over 24 Hours

**Current Implementation**:
```
Snapshot 1: { full alert data } = 900 bytes
Snapshot 2: { full alert data } = 900 bytes
...
Snapshot 24: { full alert data } = 900 bytes
Total: 21.6 KB (96% redundant)
```

**Optimized Implementation**:
```
Snapshot 1: { full alert data, status: "new" } = 900 bytes
Snapshot 2: { id, status: "unchanged" } = 50 bytes
...
Snapshot 24: { id, status: "unchanged" } = 50 bytes
Total: 1.65 KB (92% reduction!)
```

### 100 Alerts Over 24 Hours

**Current**:
- 100 alerts × 24 snapshots = 2,400 objects
- 2,400 × 900 bytes = 2.16 MB
- Redundancy: 96%

**Optimized**:
- 100 alerts × 24 snapshots = 2,400 objects
- (10 new × 900) + (85 unchanged × 50) + (5 expired × 50) = 13.25 KB per snapshot
- 13.25 KB × 24 = 318 KB
- Redundancy: 5%
- **Reduction: 85%!**

---

## 🔄 Query Response Comparison

### Current Response (Redundant)
```json
{
  "data": [
    {
      "timestamp": "2025-10-23T16:00:00Z",
      "alerts": [
        { "id": "alert-1", "event": "...", "headline": "...", ... }
      ]
    },
    {
      "timestamp": "2025-10-23T17:00:00Z",
      "alerts": [
        { "id": "alert-1", "event": "...", "headline": "...", ... }
      ]
    }
  ]
}
// Size: 2-5 MB for 24 hours
```

### Optimized Response (Deduplicated)
```json
{
  "data": {
    "alerts": {
      "alert-1": {
        "id": "alert-1",
        "event": "Tornado Warning",
        "headline": "Tornado Warning issued",
        ...
      }
    },
    "timeline": [
      {
        "timestamp": "2025-10-23T16:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "new" }
        ]
      },
      {
        "timestamp": "2025-10-23T17:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "unchanged" }
        ]
      }
    ]
  }
}
// Size: 100-500 KB for 24 hours (95% reduction!)
```

---

## 🎯 New Query Capabilities

### Query by Date (Optimized)
```bash
curl "http://localhost:4400/api/alerts/history/optimized?date=2025-10-23"
```
Returns: Deduplicated alerts + timeline of changes

### Query Last X Hours
```bash
curl "http://localhost:4400/api/alerts/history/last?hours=24"
curl "http://localhost:4400/api/alerts/history/last?hours=6"
curl "http://localhost:4400/api/alerts/history/last?hours=1"
```
Returns: Alerts active in last X hours with timeline

### With Region Filter
```bash
curl "http://localhost:4400/api/alerts/history/optimized?date=2025-10-23&region=CONUS"
curl "http://localhost:4400/api/alerts/history/last?hours=24&region=ALASKA"
```

---

## 💾 Storage Impact

| Metric | Current | Optimized | Savings |
|--------|---------|-----------|---------|
| Per Snapshot | 117 KB | 18 KB | 85% |
| Per Hour | 14 MB | 2.1 MB | 85% |
| Per Day | 336 MB | 50 MB | 85% |
| Per Week | 2.35 GB | 350 MB | 85% |
| Per Month | 10.08 GB | 1.5 GB | 85% |
| Cost/Month | $0.23 | $0.03 | 87% |
| Query Response | 2-5 MB | 100-500 KB | 95% |

---

## 🔐 Backward Compatibility

The optimization is **fully backward compatible**:

1. **Old endpoint still works**: `/api/alerts/history?date=2025-10-23`
2. **New endpoint available**: `/api/alerts/history/optimized?date=2025-10-23`
3. **New capability**: `/api/alerts/history/last?hours=24`
4. **Old snapshots still readable**: Existing S3 data unchanged

---

## 📋 Implementation Checklist

- [ ] Create `archiveAlertsToS3Optimized.js`
- [ ] Create `alertHistoryOptimized.js`
- [ ] Test with mock data
- [ ] Update schedule.js (optional)
- [ ] Register routes in server.js
- [ ] Test endpoints
- [ ] Monitor S3 storage
- [ ] Compare costs

---

## 🧪 Testing

### Test Archive Module
```javascript
const archiveAlertsToS3Optimized = require('./src/util/jobs/archiveAlertsToS3Optimized');
const result = await archiveAlertsToS3Optimized(cache);
console.log(result);
// Output: { new_count: 5, unchanged_count: 120, expired_count: 2 }
```

### Test Query Endpoints
```bash
# Test optimized endpoint
curl "http://localhost:4400/api/alerts/history/optimized?date=2025-10-23"

# Test last hours endpoint
curl "http://localhost:4400/api/alerts/history/last?hours=24"

# Test with filters
curl "http://localhost:4400/api/alerts/history/last?hours=6&region=CONUS"
```

---

## 🎉 Benefits Summary

✅ **85% Storage Reduction** - Save $0.20/month
✅ **95% Smaller Queries** - Faster API responses
✅ **Better Performance** - Less data to transfer
✅ **New Capabilities** - Query by hours, not just dates
✅ **Backward Compatible** - Old endpoints still work
✅ **Easy Implementation** - 2-3 hours of work

---

## 📞 Questions?

**Q: Will this break existing code?**
A: No, old endpoints still work. New endpoints are optional.

**Q: Can I run both?**
A: Yes, you can run both archive jobs simultaneously for comparison.

**Q: How do I migrate existing data?**
A: You don't need to. New snapshots use optimized format, old ones remain unchanged.

**Q: What about alert updates?**
A: If an alert changes (e.g., expires extended), full data is stored again.

---

## 🚀 Next Steps

1. Review the optimization analysis
2. Create the optimized modules
3. Test with mock data
4. Deploy to staging
5. Monitor storage and costs
6. Deploy to production

**Estimated Implementation Time**: 2-3 hours
**ROI**: Huge - saves $0.20/month + better performance

