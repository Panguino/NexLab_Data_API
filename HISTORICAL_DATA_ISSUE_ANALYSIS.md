# Historical Data Retrieval - Critical Issue Analysis

## 🚨 THE PROBLEM

Your system has a **critical flaw in how expired alerts are handled** during historical retrieval. When an alert expires, it's **NOT being stored in the snapshot**, so when you query historical data, **expired alerts are completely missing**.

---

## 📊 How It Currently Works (BROKEN)

### **Storage (archiveAlertsToS3Optimized.js)**

```javascript
// Line 280-346: createOptimizedSnapshot()

// Only stores CURRENT alerts in alert_data
snapshot.alert_data = currentAlerts.alerts;  // ❌ ONLY CURRENT ALERTS

// Tracks status changes in alerts section
snapshot.alerts = {
  "alert-1": { id: "alert-1", status: "new" },
  "alert-2": { id: "alert-2", status: "unchanged" },
  "alert-3": { id: "alert-3", status: "expired" }  // ✅ Status tracked
};
```

### **Retrieval (alertHistoryOptimized.js)**

```javascript
// Line 82-105: Processing alert_data

if (snapshot.alert_data) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    if (!deduplicatedAlerts[alertId]) {
      deduplicatedAlerts[alertId] = {
        ...alertData,
        locations: locations,
      };
    }
  }
}
```

**THE BUG:** 
- `alert_data` only contains **CURRENT** alerts
- When an alert expires, it's removed from `alert_data`
- The retrieval code **only reads from `alert_data`**
- **Result:** Expired alerts are never returned in historical queries

---

## 🔍 Example Scenario

### **Timeline**

```
2025-10-23 10:00 AM
├─ Snapshot 1: alert-1 (NEW)
│  └─ alert_data: { alert-1: {...} }
│  └─ alerts: { alert-1: { status: "new" } }

2025-10-23 11:00 AM
├─ Snapshot 2: alert-1 (UNCHANGED)
│  └─ alert_data: { alert-1: {...} }
│  └─ alerts: { alert-1: { status: "unchanged" } }

2025-10-23 12:00 PM
├─ Snapshot 3: alert-1 EXPIRES
│  └─ alert_data: {} ❌ ALERT REMOVED!
│  └─ alerts: { alert-1: { status: "expired" } }

2025-10-23 1:00 PM
├─ Snapshot 4: alert-1 gone
│  └─ alert_data: {}
│  └─ alerts: {}
```

### **Query: Get alerts from last 24 hours**

```javascript
// Current broken logic:
for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
  // Only processes alerts in alert_data
  // Snapshot 3 has NO alert-1 in alert_data
  // Result: alert-1 is MISSING from response ❌
}
```

---

## 💾 What SHOULD Be Stored

Each snapshot should store:

```json
{
  "timestamp": "2025-10-23T12:00:00Z",
  "snapshot_id": "uuid",
  "alerts_count": 150,
  "new_count": 5,
  "unchanged_count": 140,
  "expired_count": 5,
  
  "locations": { ... },
  
  "alert_data": {
    "alert-1": { id: "alert-1", event: "Tornado", ... },
    "alert-2": { id: "alert-2", event: "Flood", ... }
  },
  
  "alerts": {
    "alert-1": { id: "alert-1", status: "unchanged" },
    "alert-2": { id: "alert-2", status: "new" },
    "alert-3": { id: "alert-3", status: "expired" }  // ✅ EXPIRED ALERT
  },
  
  "alertLocationMap": { ... }
}
```

**Key Point:** The `alerts` section tracks **ALL** alerts (current + expired), but `alert_data` only has full data for current ones.

---

## 🔧 The Fix

### **Problem 1: Expired Alerts Not Stored**

**Current Code (Line 333-344):**
```javascript
// Process expired alerts (were in previous but not in current)
if (previousAlerts && previousAlerts.alerts) {
  for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
    if (!seenAlerts.has(alertId)) {
      snapshot.alerts[alertId] = {
        id: alertId,
        status: 'expired',
      };
      snapshot.expired_count++;
    }
  }
}
```

**Issue:** Expired alerts are tracked in `snapshot.alerts` but their full data is NOT in `alert_data`.

**Solution:** Store expired alert data in `alert_data` before they expire:

```javascript
// Store full data for expired alerts too
if (previousAlerts && previousAlerts.alerts) {
  for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
    if (!seenAlerts.has(alertId)) {
      // Store the full alert data from previous snapshot
      snapshot.alert_data[alertId] = previousAlerts.alerts[alertId];
      
      snapshot.alerts[alertId] = {
        id: alertId,
        status: 'expired',
      };
      snapshot.expired_count++;
    }
  }
}
```

### **Problem 2: Retrieval Only Reads Current Alerts**

**Current Code (Line 82-105):**
```javascript
if (snapshot.alert_data) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    if (!deduplicatedAlerts[alertId]) {
      deduplicatedAlerts[alertId] = { ...alertData, locations };
    }
  }
}
```

**Issue:** This only gets alerts in `alert_data`. Expired alerts are missing.

**Solution:** Also process expired alerts from the `alerts` section:

```javascript
// First, collect full alert data from alert_data section
if (snapshot.alert_data) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    if (!deduplicatedAlerts[alertId]) {
      deduplicatedAlerts[alertId] = { ...alertData, locations };
    }
  }
}

// Then, add expired alerts that may not be in alert_data
if (snapshot.alerts) {
  for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
    if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
      // Try to get full data from alert_data
      if (snapshot.alert_data && snapshot.alert_data[alertId]) {
        deduplicatedAlerts[alertId] = {
          ...snapshot.alert_data[alertId],
          locations: [],
          status: 'expired'
        };
      }
    }
  }
}
```

---

## 📋 Summary of Issues

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| **Expired alerts not stored** | archiveAlertsToS3Optimized.js:333-344 | Expired alerts lost | Store full data before expiry |
| **Retrieval ignores expired** | alertHistoryOptimized.js:82-105 | Missing from history | Read from alerts section too |
| **No full data for expired** | archiveAlertsToS3Optimized.js:280-346 | Can't reconstruct alert | Store in alert_data |

---

## ✅ Expected Behavior After Fix

### **Timeline (FIXED)**

```
2025-10-23 10:00 AM - Query last 24 hours
├─ Snapshot 1: alert-1 (NEW)
│  └─ Returns: alert-1 ✅

2025-10-23 11:00 AM
├─ Snapshot 2: alert-1 (UNCHANGED)
│  └─ Returns: alert-1 ✅

2025-10-23 12:00 PM
├─ Snapshot 3: alert-1 EXPIRES
│  └─ alert_data: { alert-1: {...} } ✅ STORED
│  └─ alerts: { alert-1: { status: "expired" } }
│  └─ Returns: alert-1 ✅

2025-10-23 1:00 PM
├─ Snapshot 4: alert-1 gone
│  └─ Returns: alert-1 from previous snapshots ✅
```

---

## 🎯 Next Steps

1. **Modify archiveAlertsToS3Optimized.js**
   - Store full data for expired alerts in `alert_data`

2. **Modify alertHistoryOptimized.js**
   - Read expired alerts from `alerts` section
   - Reconstruct full alert data

3. **Test the fix**
   - Create test alert
   - Let it expire
   - Query historical data
   - Verify expired alert is returned

---

## 📊 Data Flow (FIXED)

```
Current Alerts in Cache
    ↓
Extract to alert_data
    ↓
Compare with previous
    ↓
Track status changes
    ├─ New: Store full data ✅
    ├─ Unchanged: Store full data ✅
    ├─ Updated: Store full data ✅
    └─ Expired: Store full data ✅ (FIX)
    ↓
Upload to S3
    ↓
Query Historical Data
    ├─ Read alert_data ✅
    ├─ Read alerts section ✅ (FIX)
    └─ Return all alerts (current + expired) ✅
```

---

## 🚀 Implementation Priority

**CRITICAL** - This is a data loss issue. Expired alerts should be retained in historical data.

**Estimated Fix Time:** 30 minutes
**Complexity:** Low
**Risk:** Low (backward compatible)

