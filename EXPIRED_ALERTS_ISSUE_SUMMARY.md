# 🚨 Expired Alerts Issue - Complete Summary

## The Problem

**User Observation:** "We still don't have any historical data of alerts that expired."

**Root Cause:** Expired alerts are being lost from the archiving system after 2 hours.

**Impact:** Historical queries can't retrieve alerts that have expired, even though they should be in the data.

---

## 📊 How the System Works (Currently)

### Every 30 Seconds
```
cacheRegionData() runs
  ↓
Fetches fresh alerts from weather.cod.edu
  ↓
Assigns to counties/coasts/offshores
  ↓
Stores in cache: REGIONS[region].states[state].counties[fips].alerts[alertId]
```

### Every Hour at :05
```
archiveAlertsToS3Optimized() runs
  ↓
Phase 1: Extract current alerts from cache
  ↓
Phase 2: Compare with previous snapshot
  ↓
Phase 3: Create optimized snapshot
  ↓
Phase 4: Upload to S3
  ↓
Phase 5: ❌ OVERWRITE previousSnapshot with current alerts only
```

---

## 🔴 The Critical Issue

### Line 44 in archiveAlertsToS3Optimized.js

```javascript
// Store current for next comparison
previousSnapshot = currentAlerts;  // ❌ OVERWRITES PREVIOUS!
```

This line is the root cause of data loss.

### What Happens

**Hour 1:**
- Current alerts: [A, B, C, D]
- Snapshot: A(new), B(new), C(new), D(new)
- `previousSnapshot` = [A, B, C, D]

**Hour 2:**
- Current alerts: [A, B, C] (D expired)
- Previous: [A, B, C, D]
- Snapshot: A(unchanged), B(unchanged), C(unchanged), D(expired) ✅
- `previousSnapshot` = [A, B, C] ❌ D IS LOST

**Hour 3:**
- Current alerts: [A, B] (C expired)
- Previous: [A, B, C] (D is gone!)
- Snapshot: A(unchanged), B(unchanged), C(expired) ✅
- `previousSnapshot` = [A, B] ❌ C IS LOST

**Hour 4:**
- Current alerts: [A] (B expired)
- Previous: [A, B] (C is gone!)
- Snapshot: A(unchanged), B(expired) ✅
- `previousSnapshot` = [A] ❌ B IS LOST

**Hour 5:**
- Current alerts: [A]
- Previous: [A] (B is gone!)
- Snapshot: A(unchanged)
- `previousSnapshot` = [A] ❌ B IS PERMANENTLY LOST

---

## 📈 Data Flow Breakdown

### Alert Collection (Every 30 seconds)

**File:** `src/util/jobs/cacheRegionData.js` (Lines 609-661)

```javascript
// Fetch alerts
const hazardData = await axios.get("https://climate.cod.edu/data/text/alerts.json");

// Assign to counties
for (let currentHazard of hazardData.features) {
  for (let currentSAMECode of currentHazard.properties.geocode.SAME) {
    const sliceSAMECode = currentSAMECode.slice(1);
    if (currentCounty.properties.FIPS === sliceSAMECode) {
      currentCounty.alerts[currentHazard.id] = currentHazard;  // ✅ STORED
    }
  }
}

// Store in cache
cache.set("regionData", REGIONS);
```

**Result:** Alerts stored in cache. When alert expires, it's removed from cache.

---

### Archiving - Extract Phase

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 105-271)

```javascript
function extractAllAlerts(regionData) {
  const alerts = {};
  
  // Iterate through all regions
  for (const [regionName, region] of Object.entries(regionData)) {
    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        for (const [countyFIPS, county] of Object.entries(state.counties)) {
          // ⚠️ ONLY PROCESSES ALERTS THAT EXIST IN CACHE
          if (county.alerts) {
            for (const [alertId, alert] of Object.entries(county.alerts)) {
              alerts[alertBaseId] = { id, event, sent, expires, ... };
            }
          }
        }
      }
    }
  }
  
  return { locations, alerts, alertLocationMap };
}
```

**Key Point:** Only extracts alerts currently in cache. Expired alerts are gone.

---

### Archiving - Comparison Phase

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 280-352)

```javascript
function createOptimizedSnapshot(currentAlerts, previousAlerts) {
  const snapshot = {
    locations: currentAlerts.locations,
    alert_data: currentAlerts.alerts,  // Full data for current alerts
    alertLocationMap: currentAlerts.alertLocationMap,
    alerts: {},  // Status tracking
  };

  // Process current alerts
  for (const [alertId, alert] of Object.entries(currentAlerts.alerts)) {
    if (!previousAlerts || !previousAlerts.alerts[alertId]) {
      snapshot.alerts[alertId] = { id: alertId, status: 'new' };
    } else {
      snapshot.alerts[alertId] = { id: alertId, status: 'unchanged' };
    }
  }

  // Process expired alerts
  if (previousAlerts && previousAlerts.alerts) {
    for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
      if (!seenAlerts.has(alertId)) {
        // Try to preserve full data
        if (previousAlerts.alert_data && previousAlerts.alert_data[alertId]) {
          snapshot.alert_data[alertId] = previousAlerts.alert_data[alertId];  // ✅ GOOD
        }
        
        snapshot.alerts[alertId] = { id: alertId, status: 'expired' };
      }
    }
  }

  return snapshot;
}
```

**The Problem:**
- Line 339 tries to preserve expired alert data ✅
- But `previousAlerts` only has alerts from LAST snapshot
- After 2 hours, expired alert is gone from `previousAlerts` ❌

---

### Archiving - Storage Phase

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 20-44)

```javascript
async function archiveAlertsToS3Optimized(cache) {
  const regionData = cache.get('regionData');
  const currentAlerts = extractAllAlerts(regionData);
  const snapshot = createOptimizedSnapshot(currentAlerts, previousSnapshot);
  
  // ❌ CRITICAL LINE - OVERWRITES PREVIOUS
  previousSnapshot = currentAlerts;
  
  // Upload to S3
  await s3.putObject(params).promise();
}
```

**The Issue:** `previousSnapshot` is overwritten with only current alerts, losing expired alerts.

---

### Historical Retrieval

**File:** `src/routes/alertHistoryOptimized.js` (Lines 189-350)

```javascript
router.get('/last', async (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  
  // Build list of dates to query
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= now) {
    dates.push(`${year}/${month}/${day}`);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Fetch all snapshots from date range
  const deduplicatedAlerts = {};
  
  for (const datePrefix of dates) {
    const prefix = `alerts-optimized/${datePrefix}/`;
    const listResult = await s3.listObjectsV2(listParams).promise();
    
    for (const obj of listResult.Contents) {
      const snapshot = JSON.parse(data.Body.toString());
      
      // Extract full alert data
      if (snapshot.alert_data) {
        for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
          if (!deduplicatedAlerts[alertId]) {
            deduplicatedAlerts[alertId] = alertData;
          }
        }
      }
    }
  }
  
  return deduplicatedAlerts;
});
```

**How it works:**
1. Lists all snapshots for date range
2. Reads `alert_data` section from each snapshot
3. Deduplicates by alert ID
4. Returns all unique alerts

**The Problem:** If an alert's full data was never preserved in `alert_data`, it can't be retrieved.

---

## 🎯 Why Expired Alerts Are Missing

### The Timeline

```
Hour 1: Alert A exists
  ├─ Cache: [A]
  ├─ Snapshot 1: A(new) + full data ✅
  └─ previousSnapshot = [A]

Hour 2: Alert A expires
  ├─ Cache: [] (A removed)
  ├─ Previous: [A]
  ├─ Snapshot 2: A(expired) + full data ✅
  └─ previousSnapshot = [] ❌ A IS LOST

Hour 3: Alert A is gone
  ├─ Cache: []
  ├─ Previous: [] (A is gone!)
  ├─ Snapshot 3: (no A)
  └─ previousSnapshot = []

Query "last 3 hours":
  ├─ Snapshot 1: A ✅
  ├─ Snapshot 2: A ✅
  ├─ Snapshot 3: (no A)
  └─ Result: A found ✅

Query "last 30 days" (after A has been gone for 28 days):
  ├─ Snapshot 1 (old): A ✅
  ├─ Snapshot 2 (old): A ✅
  ├─ ... (many snapshots)
  ├─ Snapshot 1000 (recent): (no A)
  └─ Result: A found ✅ (because old snapshots preserved)
```

---

## ✅ Why It Seems to Work

The system appears to work because:
1. S3 snapshots are immutable (never deleted)
2. Old snapshots contain full alert data
3. Historical queries read ALL snapshots
4. Deduplication finds alerts in old snapshots

---

## ❌ Why It Actually Fails

The system fails when:
1. **Querying recent data:** Expired alerts from 2+ hours ago are missing
2. **Real-time + historical mismatch:** Different data sets
3. **Alert lifecycle tracking:** Can't see complete timeline
4. **Data consistency:** Inconsistent across time periods

---

## 🔧 The Solution

The `previousSnapshot` variable needs to be persistent, not just for one comparison.

**Current approach:**
- Compares only current vs previous (loses data after 2 hours)

**Needed approach:**
- Maintains complete history of all alerts ever seen
- Tracks when each alert expires
- Preserves full data for expired alerts indefinitely
- Only deletes after retention period (28 days)

---

## 📋 Summary

| Aspect | Status | Issue |
|--------|--------|-------|
| **Alert collection** | ✅ Working | None |
| **Real-time API** | ✅ Working | None |
| **Archiving job** | ⚠️ Partial | Loses expired alerts after 2 hours |
| **Historical API** | ⚠️ Partial | Missing recent expired alerts |
| **Data retention** | ⚠️ Partial | Expired alerts lost from comparison |
| **County data** | ✅ Collected | But not retained in history |

---

## 🎓 Key Takeaways

1. **Alerts are stored in cache** - removed when they expire
2. **Archiving compares current vs previous** - only 1 hour window
3. **Expired alerts preserved for 1 snapshot** - then lost
4. **After 2 hours, expired alerts can't be tracked** - no way to know they existed
5. **Historical queries work by accident** - because old S3 snapshots are preserved
6. **Real issue:** `previousSnapshot` is too short-lived


