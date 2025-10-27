# Historical Data Fix - Implementation Guide

## 🎯 Overview

This guide explains how to fix the expired alert data loss issue in the historical data system.

---

## 🚨 The Problem (Quick Summary)

When an alert expires:
1. ❌ It's removed from `alert_data` in the snapshot
2. ✅ Its status is tracked as "expired" in the `alerts` section
3. ❌ When querying history, only `alert_data` is read
4. ❌ **Result:** Expired alerts are missing from historical queries

---

## ✅ The Solution

### **Part 1: Store Expired Alert Data (archiveAlertsToS3Optimized.js)**

**Current Code (Lines 333-344):**
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

**Fixed Code:**
```javascript
// Process expired alerts (were in previous but not in current)
if (previousAlerts && previousAlerts.alerts) {
  for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
    if (!seenAlerts.has(alertId)) {
      // ✅ STORE FULL DATA FOR EXPIRED ALERTS
      if (previousAlerts.alerts[alertId]) {
        snapshot.alert_data[alertId] = previousAlerts.alerts[alertId];
      }
      
      snapshot.alerts[alertId] = {
        id: alertId,
        status: 'expired',
      };
      snapshot.expired_count++;
    }
  }
}
```

**What Changed:**
- Added 3 lines to store expired alert's full data
- Preserves alert information before it's removed from cache
- Allows retrieval to find the alert later

---

### **Part 2: Retrieve Expired Alerts (alertHistoryOptimized.js)**

**Current Code (Lines 82-105):**
```javascript
// First, collect full alert data from alert_data section (new format)
if (snapshot.alert_data) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    if (!deduplicatedAlerts[alertId]) {
      // Reconstruct locations array from normalized structure
      const locationIds = snapshot.alertLocationMap[alertId];
      const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);

      deduplicatedAlerts[alertId] = {
        ...alertData,
        locations: locations,
      };
    }
  }
}
```

**Fixed Code:**
```javascript
// First, collect full alert data from alert_data section (new format)
if (snapshot.alert_data) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    if (!deduplicatedAlerts[alertId]) {
      // Reconstruct locations array from normalized structure
      const locationIds = snapshot.alertLocationMap[alertId];
      const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);

      deduplicatedAlerts[alertId] = {
        ...alertData,
        locations: locations,
      };
    }
  }
}

// ✅ ALSO PROCESS EXPIRED ALERTS
if (snapshot.alerts) {
  for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
    if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
      // Try to get full data from alert_data
      if (snapshot.alert_data && snapshot.alert_data[alertId]) {
        const locationIds = snapshot.alertLocationMap[alertId] || [];
        const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);
        
        deduplicatedAlerts[alertId] = {
          ...snapshot.alert_data[alertId],
          locations: locations,
          status: 'expired'
        };
      }
    }
  }
}
```

**What Changed:**
- Added 15 lines to process expired alerts
- Reads from `alerts` section to find expired ones
- Reconstructs full alert data from `alert_data`
- Marks alert with `status: 'expired'` for client visibility

---

## 📋 Files to Modify

### **File 1: src/util/jobs/archiveAlertsToS3Optimized.js**

**Location:** Lines 333-344
**Change Type:** Add 3 lines
**Complexity:** Low

```javascript
// BEFORE (Line 333-344)
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

// AFTER
if (previousAlerts && previousAlerts.alerts) {
  for (const [alertId, alert] of Object.entries(previousAlerts.alerts)) {
    if (!seenAlerts.has(alertId)) {
      // Store full data for expired alerts
      if (previousAlerts.alerts[alertId]) {
        snapshot.alert_data[alertId] = previousAlerts.alerts[alertId];
      }
      
      snapshot.alerts[alertId] = {
        id: alertId,
        status: 'expired',
      };
      snapshot.expired_count++;
    }
  }
}
```

---

### **File 2: src/routes/alertHistoryOptimized.js**

**Location:** Lines 105-106 (after the alert_data loop)
**Change Type:** Add 15 lines
**Complexity:** Low

```javascript
// ADD AFTER LINE 105 (after the alert_data processing loop)

// Also process expired alerts
if (snapshot.alerts) {
  for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
    if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
      // Try to get full data from alert_data
      if (snapshot.alert_data && snapshot.alert_data[alertId]) {
        const locationIds = snapshot.alertLocationMap[alertId] || [];
        const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);
        
        deduplicatedAlerts[alertId] = {
          ...snapshot.alert_data[alertId],
          locations: locations,
          status: 'expired'
        };
      }
    }
  }
}
```

**Also add the same code to the `/last` endpoint:**
**Location:** Lines 256-257 (after the alert_data loop in the `/last` endpoint)

---

## 🧪 Testing the Fix

### **Test 1: Verify Expired Alerts Are Stored**

```bash
node test-historical-data-issue.js
```

Expected output:
```
✅ Expired alerts WITH full data: 5
❌ Expired alerts WITHOUT full data: 0
```

### **Test 2: Query Historical Data**

```bash
# Get alerts from last 24 hours
curl "http://localhost:3000/api/alerts/history/last?hours=24"
```

Expected:
- Expired alerts should appear in response
- Each expired alert should have full data (event, severity, etc.)
- Each expired alert should have `status: 'expired'`

### **Test 3: Verify Timeline**

```bash
# Get alerts for specific date
curl "http://localhost:3000/api/alerts/history/optimized?date=2025-10-23"
```

Expected:
- Timeline should show alerts transitioning through states
- NEW → UNCHANGED → EXPIRED
- All states should have corresponding alert data

---

## 📊 Before & After Comparison

### **Before Fix**

```json
{
  "success": true,
  "message": "Found 150 unique alerts in last 24 hours",
  "data": {
    "alerts": {
      "alert-1": { "event": "Tornado", "severity": "Extreme" },
      "alert-2": { "event": "Flood", "severity": "Severe" }
      // ❌ alert-3 (expired) is MISSING
    },
    "timeline": [
      { "timestamp": "10:00", "events": [{ "alertId": "alert-1", "status": "new" }] },
      { "timestamp": "11:00", "events": [{ "alertId": "alert-1", "status": "unchanged" }] },
      { "timestamp": "12:00", "events": [{ "alertId": "alert-1", "status": "expired" }] }
      // ❌ alert-1 data is gone even though status shows "expired"
    ]
  }
}
```

### **After Fix**

```json
{
  "success": true,
  "message": "Found 151 unique alerts in last 24 hours",
  "data": {
    "alerts": {
      "alert-1": { "event": "Tornado", "severity": "Extreme" },
      "alert-2": { "event": "Flood", "severity": "Severe" },
      "alert-3": { "event": "Winter Storm", "severity": "Moderate", "status": "expired" }
      // ✅ alert-3 (expired) is NOW INCLUDED
    },
    "timeline": [
      { "timestamp": "10:00", "events": [{ "alertId": "alert-1", "status": "new" }] },
      { "timestamp": "11:00", "events": [{ "alertId": "alert-1", "status": "unchanged" }] },
      { "timestamp": "12:00", "events": [{ "alertId": "alert-1", "status": "expired" }] }
      // ✅ alert-1 data is preserved with status "expired"
    ]
  }
}
```

---

## ✨ Benefits of This Fix

✅ **No Data Loss** - Expired alerts are retained in history
✅ **Complete Timeline** - Can see full lifecycle of alerts
✅ **Backward Compatible** - Old snapshots still work
✅ **Minimal Changes** - Only 18 lines of code added
✅ **Low Risk** - No breaking changes
✅ **Better Visualization** - Can show when alerts expired

---

## 🚀 Implementation Steps

1. **Backup current code** (optional but recommended)
2. **Apply fix to archiveAlertsToS3Optimized.js**
3. **Apply fix to alertHistoryOptimized.js** (both endpoints)
4. **Test with test-historical-data-issue.js**
5. **Deploy to staging**
6. **Verify with API queries**
7. **Deploy to production**

---

## 📞 Rollback Plan

If issues occur:
1. Revert the two files to previous versions
2. Old snapshots will still work (backward compatible)
3. New snapshots will use old format
4. No data loss

---

## 🎯 Expected Outcome

After this fix:
- ✅ All alerts (current and expired) appear in historical queries
- ✅ Timeline shows complete alert lifecycle
- ✅ Visualization can show when alerts expired
- ✅ No more missing historical data
- ✅ Better data retention and analysis

---

## 📊 Impact Summary

| Aspect | Impact |
|--------|--------|
| **Data Retention** | Improved - No more lost expired alerts |
| **Query Results** | More complete - Includes expired alerts |
| **Performance** | Minimal - Adds ~18 lines of code |
| **Storage** | Minimal increase - Expired alerts stored once |
| **Backward Compatibility** | Maintained - Old snapshots still work |
| **Breaking Changes** | None |

---

## ✅ Ready to Implement?

This fix is:
- ✅ Low risk
- ✅ Backward compatible
- ✅ Minimal code changes
- ✅ High impact (fixes data loss)
- ✅ Easy to test

**Recommendation:** Implement immediately to prevent further data loss.

