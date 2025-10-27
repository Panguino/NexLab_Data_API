# Deployment and Testing Guide - Historical Data Fix

## ✅ Fix Implementation Complete

All code changes have been successfully applied and tested locally.

---

## 📋 Changes Made

### **File 1: src/util/jobs/archiveAlertsToS3Optimized.js**

**Location:** Lines 333-349
**Change:** Added 5 lines to store expired alert data

```javascript
// Store full data for expired alerts so they can be retrieved in historical queries
if (previousAlerts.alert_data && previousAlerts.alert_data[alertId]) {
  snapshot.alert_data[alertId] = previousAlerts.alert_data[alertId];
}
```

**What it does:**
- Before marking an alert as expired, stores its full data
- Ensures expired alerts can be retrieved in historical queries
- Backward compatible with old snapshots

---

### **File 2: src/routes/alertHistoryOptimized.js**

**Location 1:** Lines 107-124 (in `/optimized` endpoint)
**Location 2:** Lines 277-294 (in `/last` endpoint)
**Change:** Added 18 lines to retrieve expired alerts

```javascript
// Also process expired alerts that may not be in alert_data
if (snapshot.alerts) {
  for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
    if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
      // Try to get full data from alert_data
      if (snapshot.alert_data && snapshot.alert_data[alertId]) {
        const locationIds = snapshot.alertLocationMap && snapshot.alertLocationMap[alertId] ? snapshot.alertLocationMap[alertId] : [];
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

**What it does:**
- Reads expired alerts from the `alerts` section
- Reconstructs full alert data from `alert_data`
- Includes expired alerts in historical query results
- Marks alerts with `status: 'expired'` for client visibility

---

## ✅ Local Testing Results

### **Syntax Validation**
- ✅ No syntax errors in either file
- ✅ IDE diagnostics passed
- ✅ Code formatting correct

### **Server Startup**
- ✅ Server starts successfully
- ✅ All dependencies loaded
- ✅ Cache jobs running
- ✅ No runtime errors

### **API Endpoints**
- ✅ `/api/alerts/history/last?hours=24` responds
- ✅ `/api/alerts/history/optimized?date=YYYY-MM-DD` responds
- ✅ No errors in response handling

---

## 🚀 Deployment Steps

### **Step 1: Commit Changes**

```bash
git add src/util/jobs/archiveAlertsToS3Optimized.js
git add src/routes/alertHistoryOptimized.js
git commit -m "Fix: Store and retrieve expired alerts in historical data

- Store full alert data when alerts expire (archiveAlertsToS3Optimized.js)
- Retrieve expired alerts from both alert_data and alerts sections (alertHistoryOptimized.js)
- Ensures expired alerts are retained in historical queries
- Backward compatible with old snapshots
- Fixes data loss issue for expired alerts"
```

### **Step 2: Push to Staging**

```bash
git push origin release/staging
```

### **Step 3: Deploy to Staging**

```bash
# Deploy to Heroku staging
git push heroku-staging release/staging:main
```

### **Step 4: Verify Staging Deployment**

```bash
# Test the staging endpoint
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"

# Should return alerts with expired ones included
```

---

## 🧪 Testing Plan (24-48 Hours)

### **Phase 1: Immediate Testing (After Deployment)**

**Time:** 0-2 hours

1. **Verify API Responses**
   ```bash
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
   ```
   - Check that response includes alerts
   - Verify no errors in response

2. **Check Logs**
   - Monitor Heroku logs for errors
   - Verify snapshots are being created
   - Check for any warnings

3. **Test Both Endpoints**
   ```bash
   # Test /optimized endpoint
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-27"
   
   # Test /last endpoint
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
   ```

### **Phase 2: Short-term Testing (2-12 Hours)**

**Time:** 2-12 hours after deployment

1. **Monitor Alert Lifecycle**
   - Create test alerts
   - Let them expire
   - Query historical data
   - Verify expired alerts appear

2. **Check Data Completeness**
   - Query last 24 hours
   - Count total alerts
   - Verify no missing alerts
   - Check all fields are present

3. **Verify Timeline**
   - Query with date range
   - Check alert status transitions
   - Verify NEW → UNCHANGED → EXPIRED flow

### **Phase 3: Long-term Testing (12-48 Hours)**

**Time:** 12-48 hours after deployment

1. **Monitor Production Behavior**
   - Check alert counts over time
   - Verify data consistency
   - Monitor for any anomalies

2. **Test Historical Queries**
   - Query different date ranges
   - Verify expired alerts included
   - Check data accuracy

3. **Verify Visualization**
   - Check if visualization shows complete data
   - Verify timeline is complete
   - Confirm no gaps in data

---

## 📊 Expected Behavior After Fix

### **Before Fix**
```
Query: GET /api/alerts/history/last?hours=24
Response: 150 alerts
Issue: Expired alerts missing
```

### **After Fix**
```
Query: GET /api/alerts/history/last?hours=24
Response: 155 alerts (includes 5 expired)
Status: ✅ All alerts included
```

---

## 🔍 Monitoring Checklist

### **During First 24 Hours**

- [ ] Server running without errors
- [ ] Snapshots being created hourly
- [ ] API endpoints responding
- [ ] No increase in error rates
- [ ] Memory usage stable
- [ ] CPU usage normal

### **During First 48 Hours**

- [ ] Expired alerts appearing in queries
- [ ] Data completeness improved
- [ ] Timeline showing complete lifecycle
- [ ] Visualization working correctly
- [ ] No data inconsistencies
- [ ] Performance acceptable

---

## 🚨 Rollback Plan

If issues occur:

1. **Revert Changes**
   ```bash
   git revert <commit-hash>
   git push origin release/staging
   ```

2. **Redeploy**
   ```bash
   git push heroku-staging release/staging:main
   ```

3. **Verify Rollback**
   ```bash
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
   ```

**Note:** Old snapshots will still work (backward compatible)

---

## 📈 Success Criteria

### **Deployment Success**
- ✅ Code deployed without errors
- ✅ Server running normally
- ✅ API endpoints responding
- ✅ No increase in error rates

### **Fix Validation (24 Hours)**
- ✅ Expired alerts appearing in queries
- ✅ Data completeness improved
- ✅ Timeline showing complete lifecycle
- ✅ Visualization working correctly

### **Production Ready (48 Hours)**
- ✅ All tests passing
- ✅ No anomalies detected
- ✅ Performance acceptable
- ✅ Data consistency verified

---

## 📞 Testing Commands

### **Quick Health Check**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.success'
```

### **Count Alerts**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.data.alerts | length'
```

### **Check for Expired Alerts**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.data.alerts[] | select(.status=="expired") | .id'
```

### **View Timeline**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-27" | jq '.data.timeline'
```

---

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] Code changes reviewed
- [ ] Local testing passed
- [ ] No syntax errors
- [ ] Backward compatibility verified

### **Deployment**
- [ ] Changes committed
- [ ] Pushed to staging
- [ ] Deployed to Heroku
- [ ] Logs checked

### **Post-Deployment**
- [ ] API endpoints responding
- [ ] No errors in logs
- [ ] Snapshots being created
- [ ] Data looks correct

### **Testing (24-48 Hours)**
- [ ] Expired alerts appearing
- [ ] Data completeness improved
- [ ] Timeline complete
- [ ] Visualization working
- [ ] No anomalies detected

---

## 🎯 Next Steps

1. **Commit and push changes** to staging
2. **Deploy to staging environment**
3. **Monitor for 24-48 hours**
4. **Verify fix is working**
5. **Deploy to production**
6. **Continue monitoring**

---

## 📞 Support

If you encounter any issues:

1. Check the logs: `heroku logs --tail`
2. Review the changes: `git diff HEAD~1`
3. Run diagnostics: `node test-historical-data-issue.js`
4. Rollback if needed: `git revert <commit-hash>`

---

## ✅ Status

**Implementation:** ✅ Complete
**Local Testing:** ✅ Passed
**Ready for Deployment:** ✅ Yes
**Estimated Deployment Time:** 5 minutes
**Estimated Testing Time:** 24-48 hours

---

**Ready to deploy?** Follow the deployment steps above and monitor for 24-48 hours to verify the fix is working correctly.

