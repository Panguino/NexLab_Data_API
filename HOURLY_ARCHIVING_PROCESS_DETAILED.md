# 📊 Hourly Archiving Process - Detailed Breakdown

## Overview

The system has a **critical data loss issue**: Expired alerts are being tracked but their full data is NOT being retained in historical snapshots. This means when you query historical data, expired alerts are missing.

---

## 🔄 What Happens Every Hour

### Timeline

```
Every 30 seconds:
  └─ cacheRegionData() runs
     └─ Fetches fresh alerts from weather.cod.edu
     └─ Assigns alerts to counties/coasts/offshores
     └─ Updates cache with regionData

Every hour at :05:
  └─ archiveAlertsToS3Optimized() runs
     └─ Reads current alerts from cache
     └─ Compares with previous snapshot
     └─ Creates optimized snapshot
     └─ Uploads to S3
```

---

## 📥 Step 1: Alert Collection (Every 30 seconds)

### File: `src/util/jobs/cacheRegionData.js`

**What happens:**
1. Fetches alerts from: `https://climate.cod.edu/data/text/alerts.json`
2. For each alert, checks geocode (SAME codes for counties, UGC codes for coasts/offshores)
3. Assigns alert to matching locations
4. Stores in cache under `regionData`

**Data Structure:**
```javascript
REGIONS = {
  CONUS: {
    states: {
      CA: {
        counties: {
          "06001": {  // FIPS code
            properties: { FIPS, COUNTYNAME, LAT, LON },
            alerts: {
              "alert-id-1": { full alert object },
              "alert-id-2": { full alert object }
            }
          }
        }
      }
    },
    coasts: {
      "AMZ001": {
        properties: { ID, NAME, LAT, LON },
        alerts: { ... }
      }
    },
    offshores: {
      "ANZ001": {
        properties: { ID, Name, LAT, LON },
        alerts: { ... }
      }
    }
  }
}
```

**Key Point:** Alerts are stored directly in location objects. When an alert expires, it's simply removed from the location's alerts object.

---

## 💾 Step 2: Archiving (Every hour at :05)

### File: `src/util/jobs/archiveAlertsToS3Optimized.js`

#### Phase 1: Extract Current Alerts

**Function:** `extractAllAlerts(regionData)` (Lines 105-271)

**What it does:**
1. Iterates through all regions, states, counties, coasts, offshores
2. Extracts alerts into normalized structure:

```javascript
{
  locations: {
    "county-06001": { id, locationId, name, type, state, lat, lon },
    "coast-AMZ001": { id, locationId, name, type, lat, lon },
    "offshore-ANZ001": { id, locationId, name, type, lat, lon }
  },
  alerts: {
    "alert-id-1": { id, event, sent, effective, onset, expires, ... },
    "alert-id-2": { ... }
  },
  alertLocationMap: {
    "alert-id-1": ["county-06001", "coast-AMZ001"],
    "alert-id-2": ["county-06002"]
  }
}
```

**Key Point:** Only extracts alerts that currently exist in the cache. If an alert expired and was removed from the cache, it's NOT extracted.

---

#### Phase 2: Compare with Previous Snapshot

**Function:** `createOptimizedSnapshot(currentAlerts, previousAlerts)` (Lines 280-352)

**What it does:**

1. **For each current alert:**
   - If new: Mark as `status: 'new'`
   - If unchanged: Mark as `status: 'unchanged'`
   - If updated: Mark as `status: 'updated'`

2. **For each previous alert NOT in current:**
   - Mark as `status: 'expired'`
   - **PROBLEM:** Only stores status, not full data!

**Snapshot Structure:**
```javascript
{
  timestamp: "2025-10-28T12:05:00.000Z",
  snapshot_id: "uuid",
  alerts_count: 212,
  new_count: 5,
  unchanged_count: 200,
  expired_count: 7,
  
  // Full data for all current alerts
  locations: { ... },
  alert_data: { ... },
  alertLocationMap: { ... },
  
  // Status tracking
  alerts: {
    "alert-id-1": { id, status: "new" },
    "alert-id-2": { id, status: "unchanged" },
    "alert-id-3": { id, status: "expired" }  // ❌ NO FULL DATA!
  }
}
```

**The Problem (Lines 333-349):**
```javascript
// Process expired alerts (were in previous but not in current)
if (previousAlerts && previousAlerts.alerts) {
  for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
    if (!seenAlerts.has(alertId)) {
      // Store full data for expired alerts so they can be retrieved in historical queries
      if (previousAlerts.alert_data && previousAlerts.alert_data[alertId]) {
        snapshot.alert_data[alertId] = previousAlerts.alert_data[alertId];  // ✅ GOOD
      }

      snapshot.alerts[alertId] = {
        id: alertId,
        status: 'expired',  // ❌ ONLY STATUS, NO FULL DATA
      };
      snapshot.expired_count++;
    }
  }
}
```

**Issue:** The code tries to preserve expired alert data (line 339), but there's a critical flaw...

---

## 🔍 The Critical Data Loss Issue

### The Problem

When an alert expires:

1. **Hour N:** Alert exists in cache
   - Snapshot includes full alert data ✅
   - Status: `new` or `unchanged`

2. **Hour N+1:** Alert expires and is removed from cache
   - `extractAllAlerts()` doesn't find it (it's gone from cache)
   - `previousAlerts` has the alert data ✅
   - Code tries to preserve it (line 339) ✅

3. **Hour N+2:** Alert is gone from both current and previous
   - `previousSnapshot` is overwritten (line 44)
   - Alert data is lost ❌
   - Can't retrieve it anymore

### Why Data is Lost

**Line 44 in archiveAlertsToS3Optimized.js:**
```javascript
// Store current for next comparison
previousSnapshot = currentAlerts;  // ❌ OVERWRITES PREVIOUS!
```

This line overwrites `previousSnapshot` with only the **current** alerts. When an alert expires:

1. **Snapshot 1 (Hour 1):** Alert exists
   - `previousSnapshot` = alerts from Hour 0
   - Current snapshot includes alert ✅

2. **Snapshot 2 (Hour 2):** Alert expires
   - `previousSnapshot` = alerts from Hour 1 (includes expired alert) ✅
   - Code preserves it in snapshot ✅
   - `previousSnapshot` is overwritten with Hour 2 data (no expired alert) ❌

3. **Snapshot 3 (Hour 3):** Alert is gone
   - `previousSnapshot` = alerts from Hour 2 (no expired alert) ❌
   - Can't find expired alert anymore ❌

### Example Timeline

```
Hour 1 (12:05):
  Current alerts: [A, B, C]
  Previous: [X, Y, Z]
  Snapshot: A(new), B(new), C(new), X(expired), Y(expired), Z(expired)
  previousSnapshot = [A, B, C]

Hour 2 (13:05):
  Current alerts: [A, B]  (C expired)
  Previous: [A, B, C]
  Snapshot: A(unchanged), B(unchanged), C(expired) ✅ PRESERVED
  previousSnapshot = [A, B]  ❌ C IS LOST

Hour 3 (14:05):
  Current alerts: [A]  (B expired)
  Previous: [A, B]
  Snapshot: A(unchanged), B(expired) ✅ PRESERVED
  previousSnapshot = [A]  ❌ C IS STILL LOST

Hour 4 (15:05):
  Current alerts: [A]
  Previous: [A]
  Snapshot: A(unchanged)
  previousSnapshot = [A]  ❌ C IS PERMANENTLY LOST
```

---

## 📊 Historical Retrieval

### File: `src/routes/alertHistoryOptimized.js`

**How it retrieves data:**

1. Lists all snapshots for date range
2. For each snapshot:
   - Reads `alert_data` section (full alert data)
   - Reads `alerts` section (status tracking)
   - Deduplicates by alert ID
3. Returns all unique alerts found

**The Problem:**
- If an alert's full data was never preserved in `alert_data`, it can't be retrieved
- Expired alerts that were lost in the archiving process are gone forever

---

## 🎯 Why Expired Alerts Are Missing

### The Root Cause

1. **Alerts are stored in cache** (in location objects)
2. **When alert expires**, it's removed from cache
3. **Next snapshot**, the archiving code tries to preserve it
4. **But `previousSnapshot` is overwritten** with only current alerts
5. **After 2 hours**, the expired alert is completely lost
6. **Historical queries** can't find it

### Why County Data Seems Missing

County data isn't actually missing from real-time:
- Real-time API shows all current alerts ✅
- But historical API shows nothing for expired alerts ❌
- User sees: "County data missing from history"

---

## ✅ What Should Happen

### Correct Process

```
Hour 1: Alert A exists
  Snapshot 1: A(new) + full data ✅

Hour 2: Alert A expires
  Snapshot 2: A(expired) + full data ✅

Hour 3: Alert A is gone
  Snapshot 3: (no A, but it's in previous snapshots) ✅

Query "last 3 days":
  Finds A in Snapshot 1 ✅
  Finds A in Snapshot 2 ✅
  Returns A with full history ✅
```

### Current (Broken) Process

```
Hour 1: Alert A exists
  Snapshot 1: A(new) + full data ✅

Hour 2: Alert A expires
  Snapshot 2: A(expired) + full data ✅

Hour 3: Alert A is gone
  Snapshot 3: (A is lost) ❌

Query "last 3 days":
  Finds A in Snapshot 1 ✅
  Finds A in Snapshot 2 ✅
  But A is gone from cache, so new alerts won't include it ❌
  Returns A with partial history ⚠️
```

---

## 📋 Summary

| Aspect | Status | Issue |
|--------|--------|-------|
| **Alert collection** | ✅ Working | None |
| **Real-time API** | ✅ Working | None |
| **Archiving job** | ⚠️ Partial | Loses expired alerts after 2 hours |
| **Historical API** | ❌ Broken | Missing expired alerts |
| **Data retention** | ❌ Broken | Expired alerts lost permanently |

---

## 🔧 The Fix Needed

The `previousSnapshot` variable needs to be persistent across archiving cycles, not just for one comparison. It should:

1. Store ALL alerts ever seen (not just current)
2. Track when each alert expires
3. Preserve full data for expired alerts indefinitely
4. Only delete after retention period (28 days)

**Current approach:** Compares only current vs previous (loses data)
**Needed approach:** Maintains complete history of all alerts


