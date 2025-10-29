# 📋 Incremental Archive Strategy - Implementation Plan

## The New Approach

Instead of tracking expired alerts, we'll use an **incremental archive** strategy:

1. **Every hour:** Only archive NEW alerts (alerts that weren't in the previous snapshot)
2. **Compare:** Current alerts vs previous alerts
3. **Store:** Only alerts that are new or updated
4. **Result:** Archive becomes a running list of all alerts ever seen

---

## 🎯 Benefits

✅ **Simpler logic** - No need to track expired alerts
✅ **Complete history** - All alerts ever seen are in the archive
✅ **Easy recovery** - Just read all snapshots and deduplicate
✅ **No data loss** - Alerts are never removed from archive
✅ **Efficient** - Only stores new/updated alerts each hour

---

## 📊 How It Works

### Current (Broken) Approach
```
Hour 1: Alerts [A, B, C, D]
  Snapshot: A(new), B(new), C(new), D(new)
  previousSnapshot = [A, B, C, D]

Hour 2: Alerts [A, B, C] (D expired)
  Snapshot: A(unchanged), B(unchanged), C(unchanged), D(expired)
  previousSnapshot = [A, B, C] ❌ D LOST

Hour 3: Alerts [A, B] (C expired)
  Snapshot: A(unchanged), B(unchanged), C(expired)
  previousSnapshot = [A, B] ❌ C LOST
```

### New (Incremental) Approach
```
Hour 1: Alerts [A, B, C, D]
  Snapshot: A(new), B(new), C(new), D(new)
  previousSnapshot = [A, B, C, D]

Hour 2: Alerts [A, B, C] (D expired)
  Snapshot: (nothing - all are unchanged)
  previousSnapshot = [A, B, C]

Hour 3: Alerts [A, B] (C expired)
  Snapshot: (nothing - all are unchanged)
  previousSnapshot = [A, B]

Hour 4: Alerts [A, E] (B expired, E is new)
  Snapshot: E(new)
  previousSnapshot = [A, E]

Query "last 4 hours":
  Snapshot 1: A, B, C, D ✅
  Snapshot 2: (empty)
  Snapshot 3: (empty)
  Snapshot 4: E ✅
  Result: A, B, C, D, E ✅ COMPLETE HISTORY
```

---

## 🔧 Implementation Changes

### Change 1: Modify createOptimizedSnapshot

**Current behavior:**
- Stores all current alerts
- Tracks status (new, unchanged, expired)
- Tries to preserve expired alert data

**New behavior:**
- Only stores NEW and UPDATED alerts
- Ignores unchanged alerts
- Ignores expired alerts
- Result: Incremental snapshots

### Change 2: Simplify snapshot structure

**Current:**
```javascript
{
  timestamp,
  snapshot_id,
  alerts_count,
  new_count,
  unchanged_count,
  expired_count,
  locations,
  alert_data,
  alertLocationMap,
  alerts: { status tracking }
}
```

**New:**
```javascript
{
  timestamp,
  snapshot_id,
  new_alerts_count,
  locations,
  alert_data,
  alertLocationMap,
  alerts: { only new/updated alerts }
}
```

### Change 3: Update retrieval logic

**Current:**
- Reads all snapshots
- Deduplicates by alert ID
- Filters by status

**New:**
- Reads all snapshots
- Deduplicates by alert ID
- All alerts in snapshots are valid (no status filtering needed)

---

## 📈 Snapshot Structure Comparison

### Current Snapshot
```json
{
  "timestamp": "2025-10-28T12:05:00.000Z",
  "snapshot_id": "uuid",
  "alerts_count": 212,
  "new_count": 5,
  "unchanged_count": 200,
  "expired_count": 7,
  "locations": { ... },
  "alert_data": { ... },
  "alertLocationMap": { ... },
  "alerts": {
    "alert-1": { "id": "alert-1", "status": "new" },
    "alert-2": { "id": "alert-2", "status": "unchanged" },
    "alert-3": { "id": "alert-3", "status": "expired" }
  }
}
```

### New Snapshot (Incremental)
```json
{
  "timestamp": "2025-10-28T12:05:00.000Z",
  "snapshot_id": "uuid",
  "new_alerts_count": 5,
  "locations": { ... },
  "alert_data": { ... },
  "alertLocationMap": { ... },
  "alerts": {
    "alert-1": { "id": "alert-1" },
    "alert-2": { "id": "alert-2" }
  }
}
```

---

## 🔄 Retrieval Logic

### Current (Complex)
```javascript
for each snapshot:
  for each alert in alert_data:
    if not already seen:
      add to result
  for each alert in alerts:
    if status === 'expired' and not already seen:
      try to get from alert_data
      add to result
```

### New (Simple)
```javascript
for each snapshot:
  for each alert in alert_data:
    if not already seen:
      add to result
```

---

## 📋 Files to Modify

1. **src/util/jobs/archiveAlertsToS3Optimized.js**
   - Modify `createOptimizedSnapshot()` function
   - Only store new/updated alerts
   - Simplify snapshot structure

2. **src/routes/alertHistoryOptimized.js**
   - Simplify retrieval logic
   - Remove expired alert handling
   - Remove status filtering

---

## ✅ Benefits of This Approach

1. **No data loss** - All alerts ever seen are preserved
2. **Simpler code** - Less complex logic
3. **Better performance** - Smaller snapshots (only new alerts)
4. **Easier debugging** - Clear incremental history
5. **Backward compatible** - Old snapshots still work

---

## 🚀 Implementation Steps

1. Modify `createOptimizedSnapshot()` to only store new/updated alerts
2. Update snapshot metadata (remove expired_count, unchanged_count)
3. Simplify retrieval logic in alertHistoryOptimized.js
4. Test with existing data
5. Deploy and monitor

---

## 📊 Expected Results

### Before (Current)
- Snapshots contain all current alerts
- Expired alerts lost after 2 hours
- Historical queries miss recent expirations
- Complex comparison logic

### After (Incremental)
- Snapshots contain only new/updated alerts
- All alerts preserved in archive
- Historical queries complete and accurate
- Simple incremental logic


