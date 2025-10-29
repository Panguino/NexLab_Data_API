# 📋 Complete Breakdown - Hourly Archiving Process

## Quick Summary

**Question:** How does the system store and retrieve historical data each hour?

**Answer:** 
1. Every 30 seconds: Fetches fresh alerts and stores in cache
2. Every hour at :05: Archives cache to S3 snapshots
3. **Problem:** Expired alerts are lost after 2 hours
4. **Result:** Historical queries can't find recently expired alerts

---

## 🔄 The Complete Hourly Cycle

### Every 30 Seconds: Alert Collection

**Process:**
```
1. cacheRegionData() runs
2. Fetches: https://climate.cod.edu/data/text/alerts.json
3. For each alert:
   - Matches SAME codes to county FIPS codes
   - Matches UGC codes to coast/offshore IDs
   - Stores in cache: REGIONS[region].states[state].counties[fips].alerts[alertId]
4. Updates cache with regionData
```

**Result:** Cache contains all current alerts

**When alert expires:**
- Weather service removes it from alerts.json
- Next fetch doesn't include it
- Alert is removed from cache

---

### Every Hour at :05: Archiving

#### Phase 1: Extract Current Alerts

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 20-44)

```javascript
const regionData = cache.get('regionData');
const currentAlerts = extractAllAlerts(regionData);
```

**What extractAllAlerts does:**
- Iterates through all regions, states, counties, coasts, offshores
- Extracts alerts that currently exist in cache
- Creates normalized structure:
  ```javascript
  {
    locations: { "county-06001": {...}, "coast-AMZ001": {...} },
    alerts: { "alert-id-1": {...}, "alert-id-2": {...} },
    alertLocationMap: { "alert-id-1": ["county-06001"], "alert-id-2": ["coast-AMZ001"] }
  }
  ```

**Key Point:** Only extracts alerts currently in cache. Expired alerts are NOT extracted.

---

#### Phase 2: Compare with Previous

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 280-352)

```javascript
const snapshot = createOptimizedSnapshot(currentAlerts, previousSnapshot);
```

**What createOptimizedSnapshot does:**

1. **For each current alert:**
   - If new: `status: 'new'`
   - If unchanged: `status: 'unchanged'`
   - If updated: `status: 'updated'`

2. **For each previous alert NOT in current:**
   - If in previous but not current: `status: 'expired'`
   - Tries to preserve full data from `previousAlerts.alert_data`

**Snapshot structure:**
```javascript
{
  timestamp: "2025-10-28T12:05:00.000Z",
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
    "alert-id-3": { id, status: "expired" }
  }
}
```

---

#### Phase 3: Upload to S3

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 46-74)

```javascript
const s3Key = `alerts-optimized/${year}/${month}/${day}/${hour}-${minute}-${second}.json`;

await s3.putObject({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: s3Key,
  Body: JSON.stringify(snapshot, null, 2),
  ContentType: 'application/json',
  ServerSideEncryption: 'AES256',
  Metadata: { ... }
}).promise();
```

**Result:** Snapshot stored in S3 at `alerts-optimized/2025/10/28/12-05-00.json`

---

#### Phase 4: ❌ THE CRITICAL PROBLEM

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Line 44)

```javascript
// Store current for next comparison
previousSnapshot = currentAlerts;  // ❌ OVERWRITES PREVIOUS!
```

**What happens:**
- `previousSnapshot` is overwritten with only current alerts
- Expired alerts are lost from the comparison
- After 2 hours, expired alerts can't be tracked

---

## 📊 Data Loss Timeline

### Hour 1 (12:05 UTC)

**Cache:** [A, B, C, D]

**Archiving:**
```
currentAlerts = {A, B, C, D}
previousSnapshot = null

Snapshot 1:
  alert_data: {A, B, C, D}
  alerts: {
    A: {status: 'new'},
    B: {status: 'new'},
    C: {status: 'new'},
    D: {status: 'new'}
  }

previousSnapshot = {A, B, C, D}  ✅
```

**S3:** Snapshot 1 has full data for A, B, C, D ✅

---

### Hour 2 (13:05 UTC)

**Cache:** [A, B, C] (D expired and removed)

**Archiving:**
```
currentAlerts = {A, B, C}
previousSnapshot = {A, B, C, D}

Snapshot 2:
  alert_data: {A, B, C}
  alerts: {
    A: {status: 'unchanged'},
    B: {status: 'unchanged'},
    C: {status: 'unchanged'},
    D: {status: 'expired'}  // Preserved from previous ✅
  }

previousSnapshot = {A, B, C}  ❌ D IS LOST
```

**S3:** Snapshot 2 has full data for A, B, C, D ✅

---

### Hour 3 (14:05 UTC)

**Cache:** [A, B] (C expired and removed)

**Archiving:**
```
currentAlerts = {A, B}
previousSnapshot = {A, B, C}  // D is gone!

Snapshot 3:
  alert_data: {A, B, C}
  alerts: {
    A: {status: 'unchanged'},
    B: {status: 'unchanged'},
    C: {status: 'expired'}  // Preserved from previous ✅
    // D is NOT in previous anymore ❌
  }

previousSnapshot = {A, B}  ❌ C IS LOST
```

**S3:** Snapshot 3 has full data for A, B, C ✅ (but not D)

---

### Hour 4 (14:05 UTC)

**Cache:** [A] (B expired and removed)

**Archiving:**
```
currentAlerts = {A}
previousSnapshot = {A, B}  // C is gone!

Snapshot 4:
  alert_data: {A, B}
  alerts: {
    A: {status: 'unchanged'},
    B: {status: 'expired'}  // Preserved from previous ✅
    // C is NOT in previous anymore ❌
  }

previousSnapshot = {A}  ❌ B IS LOST
```

**S3:** Snapshot 4 has full data for A, B ✅ (but not C)

---

### Hour 5 (15:05 UTC)

**Cache:** [A]

**Archiving:**
```
currentAlerts = {A}
previousSnapshot = {A}  // B is gone!

Snapshot 5:
  alert_data: {A}
  alerts: {
    A: {status: 'unchanged'}
    // B is NOT in previous anymore ❌
  }

previousSnapshot = {A}  ❌ B IS PERMANENTLY LOST
```

**S3:** Snapshot 5 has full data for A only ✅ (but not B)

---

## 🔍 Historical Retrieval

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
2. For each snapshot, reads `alert_data` section
3. Deduplicates by alert ID (first occurrence wins)
4. Returns all unique alerts found

---

## ✅ Why It Seems to Work

**Query: "Last 24 hours"**

```
Snapshots found:
  Snapshot 1: A, B, C, D ✅
  Snapshot 2: A, B, C, D ✅
  Snapshot 3: A, B, C ✅
  Snapshot 4: A, B ✅
  Snapshot 5: A ✅

Deduplicated result:
  A: Found in all ✅
  B: Found in 1-4 ✅
  C: Found in 1-3 ✅
  D: Found in 1-2 ✅

Result: All alerts found ✅
```

---

## ❌ Why It Actually Fails

**Query: "Last 30 days" (after D has been gone for 28+ days)**

```
Snapshots found:
  Snapshot 1 (old): A, B, C, D ✅
  Snapshot 2 (old): A, B, C, D ✅
  ... (many snapshots)
  Snapshot 1000 (recent): A ✅

Deduplicated result:
  A: Found in all ✅
  B: Found in old snapshots ✅
  C: Found in old snapshots ✅
  D: Found in old snapshots ✅

Result: All alerts found ✅
```

**Appears to work!** But only because old snapshots are preserved in S3.

---

## 🎯 The Real Issue

The system works by accident:
1. S3 snapshots are immutable (never deleted)
2. Old snapshots contain full alert data
3. Historical queries read ALL snapshots
4. Deduplication finds alerts in old snapshots

**But the archiving logic is broken:**
1. `previousSnapshot` is too short-lived (only 1 hour)
2. Expired alerts only preserved for 1 snapshot (2 hours)
3. After 2 hours, expired alerts can't be tracked
4. System relies on S3 preservation, not archiving logic

---

## 📋 Summary Table

| Hour | Cache | Current | Previous | Snapshot | previousSnapshot |
|------|-------|---------|----------|----------|------------------|
| 1 | A,B,C,D | A,B,C,D | null | A,B,C,D | A,B,C,D |
| 2 | A,B,C | A,B,C | A,B,C,D | A,B,C,D ✅ | A,B,C ❌ |
| 3 | A,B | A,B | A,B,C | A,B,C ✅ | A,B ❌ |
| 4 | A | A | A,B | A,B ✅ | A ❌ |
| 5 | A | A | A | A | A |

---

## 🔧 What Needs to Change

**Current approach:**
- Compares current vs previous (only 1 hour window)
- Loses expired alerts after 2 hours

**Needed approach:**
- Maintain persistent record of all alerts ever seen
- Track when each alert expires
- Preserve full data for expired alerts indefinitely
- Only delete after retention period (28 days)

**Key change:**
- Don't overwrite `previousSnapshot` with only current alerts
- Instead, maintain a complete history of all alerts


