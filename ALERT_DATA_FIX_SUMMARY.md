# Alert History Data Fix - Summary

## 🐛 Problem Identified

The optimized alert history endpoints were returning empty `alerts` objects even though the timeline showed alert events. This was caused by a data architecture issue in the archive module.

### Root Cause

**Archive Module Behavior:**
- Stored full alert data only for NEW and UPDATED alerts
- Stored only `{id, status}` for UNCHANGED and EXPIRED alerts

**Query Endpoint Behavior:**
- Only added alerts to response if they had full data (NEW or UPDATED status)
- Skipped alerts with only ID+status (UNCHANGED or EXPIRED)

**Result:**
```
Timeline shows: alert-1 is unchanged, alert-2 is unchanged
Alerts object: {} (EMPTY!)
```

---

## ✅ Solution Implemented

### New Data Structure

**Before (Broken):**
```json
{
  "timestamp": "2025-10-23T17:00:00Z",
  "alerts": {
    "alert-1": { "id": "alert-1", "status": "unchanged" },
    "alert-2": { "id": "alert-2", "status": "unchanged" }
  }
}
```

**After (Fixed):**
```json
{
  "timestamp": "2025-10-23T17:00:00Z",
  "alert_data": {
    "alert-1": { "id": "alert-1", "event": "...", "headline": "...", ... },
    "alert-2": { "id": "alert-2", "event": "...", "headline": "...", ... }
  },
  "alerts": {
    "alert-1": { "id": "alert-1", "status": "unchanged" },
    "alert-2": { "id": "alert-2", "status": "unchanged" }
  }
}
```

### Key Changes

1. **Archive Module** (`archiveAlertsToS3Optimized.js`)
   - Added `alert_data` section to store full alert data for ALL current alerts
   - Kept `alerts` section for status tracking (timeline)
   - Full data is always available, regardless of status

2. **Query Endpoints** (`alertHistoryOptimized.js`)
   - Now reads from `alert_data` section to get full alert information
   - Uses `alerts` section to build timeline of status changes
   - Deduplicates across multiple snapshots

---

## 📊 Data Flow

### Archive Process (Every Hour)

```
Current Alerts (from cache)
    ↓
Compare with Previous Snapshot
    ↓
Determine Status (NEW/UNCHANGED/UPDATED/EXPIRED)
    ↓
Create Snapshot:
  - alert_data: Full data for ALL current alerts
  - alerts: Status changes for timeline
    ↓
Upload to S3
```

### Query Process

```
Request: GET /api/alerts/history/last?hours=24
    ↓
Fetch all snapshots from last 24 hours
    ↓
For each snapshot:
  - Extract full alert data from alert_data
  - Extract status changes from alerts
    ↓
Deduplicate alerts (keep first occurrence)
Build timeline of status changes
    ↓
Return Response:
  - alerts: Full alert data (deduplicated)
  - timeline: Status changes over time
```

---

## 🧪 Validation

Test results confirm the fix works correctly:

```
✅ Snapshot 1 (Hour 1):
   - 2 alerts marked as NEW
   - Full data stored in alert_data

✅ Snapshot 2 (Hour 2):
   - 2 alerts marked as UNCHANGED
   - Full data still stored in alert_data

✅ Query Result:
   - Found 2 unique alerts ✅
   - Full data available for both ✅
   - Timeline shows status changes ✅
```

---

## 📝 Response Format (Fixed)

### Example Response

```json
{
  "success": true,
  "message": "Found 2 unique alerts in last 1 hours",
  "hours": 1,
  "region": "all",
  "data": {
    "alerts": {
      "alert-1": {
        "id": "alert-1",
        "event": "Tornado Warning",
        "headline": "Tornado Warning issued for County A",
        "description": "A tornado warning has been issued...",
        "severity": "Extreme",
        "urgency": "Immediate",
        "areaDesc": "County A",
        "effective": "2025-10-23T16:00:00Z",
        "expires": "2025-10-23T18:00:00Z"
      },
      "alert-2": {
        "id": "alert-2",
        "event": "Severe Thunderstorm",
        "headline": "Severe Thunderstorm Warning for County B",
        "description": "A severe thunderstorm warning has been issued...",
        "severity": "Severe",
        "urgency": "Immediate",
        "areaDesc": "County B",
        "effective": "2025-10-23T16:00:00Z",
        "expires": "2025-10-23T17:00:00Z"
      }
    },
    "timeline": [
      {
        "timestamp": "2025-10-23T16:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "new" },
          { "alertId": "alert-2", "status": "new" }
        ]
      },
      {
        "timestamp": "2025-10-23T17:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "unchanged" },
          { "alertId": "alert-2", "status": "unchanged" }
        ]
      }
    ]
  }
}
```

---

## 🔄 Backward Compatibility

- ✅ Old endpoints still work
- ✅ New endpoints now return correct data
- ✅ No breaking changes to API

---

## 📋 Files Modified

1. **`src/util/jobs/archiveAlertsToS3Optimized.js`**
   - Added `alert_data` section to snapshot
   - Stores full alert data for all current alerts

2. **`src/routes/alertHistoryOptimized.js`**
   - Updated `/optimized` endpoint to read from `alert_data`
   - Updated `/last` endpoint to read from `alert_data`
   - Simplified logic to handle both new and old snapshot formats

---

## ✅ Status

**Fix Status**: ✅ COMPLETE AND TESTED

- [x] Root cause identified
- [x] Solution designed
- [x] Code implemented
- [x] Syntax validated
- [x] Logic tested
- [x] Ready for deployment

---

## 🚀 Next Steps

1. **Commit the fix** to the branch
2. **Test with real data** from staging
3. **Verify frontend** receives correct data
4. **Deploy to production**

---

## 💡 Key Takeaway

The fix separates concerns:
- **`alert_data`**: Stores full alert information (what the alert is)
- **`alerts`**: Tracks status changes (what happened to the alert)

This allows the query endpoint to reconstruct complete alert history while maintaining the storage optimization benefits.

