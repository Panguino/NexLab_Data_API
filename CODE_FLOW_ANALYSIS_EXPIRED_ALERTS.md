# 🔍 Code Flow Analysis - Why Expired Alerts Are Lost

## The Complete Data Flow

### Step 1: Alert Collection (Every 30 seconds)

**File:** `src/util/jobs/cacheRegionData.js` (Lines 609-661)

```javascript
// Fetch alerts from weather service
const response = await axios.get("https://climate.cod.edu/data/text/alerts.json");
const hazardData = response.data;

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

**Result:** Alerts stored in cache under location objects
- `REGIONS[region].states[state].counties[fips].alerts[alertId]`
- `REGIONS[region].coasts[coastId].alerts[alertId]`
- `REGIONS[region].offshores[offshoreId].alerts[alertId]`

---

### Step 2: Archiving - Extract Current Alerts

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 20-44)

```javascript
async function archiveAlertsToS3Optimized(cache) {
  // Get current alerts from cache
  const regionData = cache.get('regionData');
  
  // Extract into normalized structure
  const currentAlerts = extractAllAlerts(regionData);
  
  // Compare with previous
  const snapshot = createOptimizedSnapshot(currentAlerts, previousSnapshot);
  
  // ❌ CRITICAL LINE - OVERWRITES PREVIOUS
  previousSnapshot = currentAlerts;
  
  // Upload to S3
  await s3.putObject(params).promise();
}
```

**Key Issue:** Line 44 overwrites `previousSnapshot` with only current alerts

---

### Step 3: Extract All Alerts Function

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 105-271)

```javascript
function extractAllAlerts(regionData) {
  const locations = {};
  const alerts = {};
  const alertLocationMap = {};

  // Iterate through all regions
  for (const [regionName, region] of Object.entries(regionData)) {
    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        for (const [countyFIPS, county] of Object.entries(state.counties)) {
          // ⚠️ ONLY PROCESSES ALERTS THAT EXIST IN CACHE
          if (county.alerts) {
            for (const [alertId, alert] of Object.entries(county.alerts)) {
              // Store alert data
              alerts[alertBaseId] = { id, event, sent, expires, ... };
              
              // Map alert to location
              alertLocationMap[alertBaseId].push(locationId);
            }
          }
        }
      }
    }
    
    // Same for coasts and offshores...
  }

  return { locations, alerts, alertLocationMap };
}
```

**Key Point:** Only extracts alerts that currently exist in cache. If an alert expired and was removed, it's NOT extracted.

---

### Step 4: Create Optimized Snapshot

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js` (Lines 280-352)

```javascript
function createOptimizedSnapshot(currentAlerts, previousAlerts) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    alerts_count: Object.keys(currentAlerts.alerts).length,
    new_count: 0,
    unchanged_count: 0,
    expired_count: 0,
    
    // Full data for current alerts
    locations: currentAlerts.locations,
    alert_data: currentAlerts.alerts,
    alertLocationMap: currentAlerts.alertLocationMap,
    
    // Status tracking
    alerts: {},
  };

  const seenAlerts = new Set();

  // Process current alerts
  for (const [alertId, alert] of Object.entries(currentAlerts.alerts)) {
    seenAlerts.add(alertId);

    if (!previousAlerts || !previousAlerts.alerts[alertId]) {
      // New alert
      snapshot.alerts[alertId] = { id: alertId, status: 'new' };
      snapshot.new_count++;
    } else {
      // Check if changed
      const hasChanged = JSON.stringify(alert) !== JSON.stringify(prev);
      
      if (hasChanged) {
        snapshot.alerts[alertId] = { id: alertId, status: 'updated' };
        snapshot.new_count++;
      } else {
        snapshot.alerts[alertId] = { id: alertId, status: 'unchanged' };
        snapshot.unchanged_count++;
      }
    }
  }

  // ⚠️ PROCESS EXPIRED ALERTS
  if (previousAlerts && previousAlerts.alerts) {
    for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
      if (!seenAlerts.has(alertId)) {
        // Try to preserve full data
        if (previousAlerts.alert_data && previousAlerts.alert_data[alertId]) {
          snapshot.alert_data[alertId] = previousAlerts.alert_data[alertId];  // ✅ GOOD
        }

        snapshot.alerts[alertId] = {
          id: alertId,
          status: 'expired',  // ❌ ONLY STATUS
        };
        snapshot.expired_count++;
      }
    }
  }

  return snapshot;
}
```

**The Problem:**
- Line 339 tries to preserve expired alert data ✅
- But `previousAlerts` only contains alerts from the LAST snapshot
- After 2 hours, the expired alert is gone from `previousAlerts` ❌

---

## 🎯 The Data Loss Timeline

### Hour 1 (12:05 UTC)

**Cache state:**
```
Alerts: [A, B, C, D]
```

**Archiving:**
```javascript
currentAlerts = { alerts: {A, B, C, D} }
previousAlerts = null  // First run

// Create snapshot
snapshot.alert_data = {A, B, C, D}  // Full data
snapshot.alerts = {
  A: {status: 'new'},
  B: {status: 'new'},
  C: {status: 'new'},
  D: {status: 'new'}
}

// ❌ CRITICAL LINE
previousSnapshot = currentAlerts  // {A, B, C, D}
```

**S3 Result:** Snapshot 1 has full data for A, B, C, D ✅

---

### Hour 2 (13:05 UTC)

**Cache state:**
```
Alerts: [A, B, C]  // D expired and removed from cache
```

**Archiving:**
```javascript
currentAlerts = { alerts: {A, B, C} }
previousAlerts = { alerts: {A, B, C, D} }  // From last hour

// Create snapshot
snapshot.alert_data = {A, B, C}  // Only current

// Process current
snapshot.alerts = {
  A: {status: 'unchanged'},
  B: {status: 'unchanged'},
  C: {status: 'unchanged'}
}

// Process expired (D is in previous but not current)
if (!seenAlerts.has('D')) {
  // Try to preserve D
  if (previousAlerts.alert_data['D']) {
    snapshot.alert_data['D'] = previousAlerts.alert_data['D']  // ✅ PRESERVED
  }
  
  snapshot.alerts['D'] = {status: 'expired'}
}

// ❌ CRITICAL LINE
previousSnapshot = currentAlerts  // {A, B, C}  ❌ D IS LOST
```

**S3 Result:** Snapshot 2 has full data for A, B, C, D ✅

---

### Hour 3 (14:05 UTC)

**Cache state:**
```
Alerts: [A, B]  // C expired and removed from cache
```

**Archiving:**
```javascript
currentAlerts = { alerts: {A, B} }
previousAlerts = { alerts: {A, B, C} }  // From last hour (D is gone!)

// Create snapshot
snapshot.alert_data = {A, B}

// Process current
snapshot.alerts = {
  A: {status: 'unchanged'},
  B: {status: 'unchanged'}
}

// Process expired (C is in previous but not current)
if (!seenAlerts.has('C')) {
  if (previousAlerts.alert_data['C']) {
    snapshot.alert_data['C'] = previousAlerts.alert_data['C']  // ✅ PRESERVED
  }
  
  snapshot.alerts['C'] = {status: 'expired'}
}

// ❌ CRITICAL LINE
previousSnapshot = currentAlerts  // {A, B}  ❌ C IS LOST
```

**S3 Result:** Snapshot 3 has full data for A, B, C ✅

---

### Hour 4 (15:05 UTC)

**Cache state:**
```
Alerts: [A]  // B expired and removed from cache
```

**Archiving:**
```javascript
currentAlerts = { alerts: {A} }
previousAlerts = { alerts: {A, B} }  // From last hour (C is gone!)

// Create snapshot
snapshot.alert_data = {A}

// Process current
snapshot.alerts = {
  A: {status: 'unchanged'}
}

// Process expired (B is in previous but not current)
if (!seenAlerts.has('B')) {
  if (previousAlerts.alert_data['B']) {
    snapshot.alert_data['B'] = previousAlerts.alert_data['B']  // ✅ PRESERVED
  }
  
  snapshot.alerts['B'] = {status: 'expired'}
}

// ❌ CRITICAL LINE
previousSnapshot = currentAlerts  // {A}  ❌ B IS LOST
```

**S3 Result:** Snapshot 4 has full data for A, B ✅

---

### Hour 5 (16:05 UTC)

**Cache state:**
```
Alerts: [A]  // No new expirations
```

**Archiving:**
```javascript
currentAlerts = { alerts: {A} }
previousAlerts = { alerts: {A} }  // From last hour

// Create snapshot
snapshot.alert_data = {A}

// Process current
snapshot.alerts = {
  A: {status: 'unchanged'}
}

// Process expired - NOTHING TO PROCESS
// D, C, B are all gone from previousAlerts!

// ❌ CRITICAL LINE
previousSnapshot = currentAlerts  // {A}
```

**S3 Result:** Snapshot 5 has full data for A only ✅

---

## 📊 Historical Query Results

### Query: "Last 5 hours"

**Snapshots found:**
- Snapshot 1: A, B, C, D ✅
- Snapshot 2: A, B, C, D ✅
- Snapshot 3: A, B, C ✅
- Snapshot 4: A, B ✅
- Snapshot 5: A ✅

**Deduplicated result:**
- A: Found in all snapshots ✅
- B: Found in snapshots 1-4 ✅
- C: Found in snapshots 1-3 ✅
- D: Found in snapshots 1-2 ✅

**Appears to work!** But only because we're querying within 2 hours of expiration.

---

### Query: "Last 10 hours" (After D has been gone for 6+ hours)

**Snapshots found:**
- Snapshot 1: A, B, C, D ✅
- Snapshot 2: A, B, C, D ✅
- Snapshot 3: A, B, C ✅
- Snapshot 4: A, B ✅
- Snapshot 5: A ✅
- Snapshot 6: A ✅
- Snapshot 7: A ✅
- Snapshot 8: A ✅
- Snapshot 9: A ✅
- Snapshot 10: A ✅

**Deduplicated result:**
- A: Found in all snapshots ✅
- B: Found in snapshots 1-4 ✅
- C: Found in snapshots 1-3 ✅
- D: Found in snapshots 1-2 ✅

**Still works!** Because D is in the first 2 snapshots.

---

### Query: "Last 30 days" (After D has been gone for 28+ days)

**Snapshots found:**
- Snapshot 1 (old): A, B, C, D ✅
- Snapshot 2 (old): A, B, C, D ✅
- ... (many snapshots)
- Snapshot 1000 (recent): A ✅

**Deduplicated result:**
- A: Found in all snapshots ✅
- B: Found in old snapshots ✅
- C: Found in old snapshots ✅
- D: Found in old snapshots ✅

**Still works!** Because old snapshots are preserved in S3.

---

## ✅ Why It Seems to Work

The system appears to work because:
1. S3 snapshots are immutable (never deleted)
2. Old snapshots contain the full alert data
3. Historical queries read ALL snapshots, not just recent ones
4. Deduplication finds alerts in old snapshots

---

## ❌ Why It Actually Fails

The system fails when:
1. **Querying recent data:** Expired alerts from 2+ hours ago are missing
2. **Real-time + historical mismatch:** Real-time shows current alerts, history shows different set
3. **Alert lifecycle tracking:** Can't see complete timeline of an alert
4. **Data integrity:** Inconsistent data across time periods

---

## 🔧 The Real Issue

The problem isn't that data is permanently lost (it's in S3). The problem is:

1. **`previousSnapshot` is too short-lived** - only lasts 1 hour
2. **Expired alerts are only preserved for 1 snapshot** - then lost from comparison
3. **After 2 hours, expired alerts can't be tracked** - no way to know they existed
4. **Historical queries work by accident** - because old S3 snapshots are preserved

**Solution:** Need to maintain a persistent record of all alerts ever seen, not just the previous snapshot.


