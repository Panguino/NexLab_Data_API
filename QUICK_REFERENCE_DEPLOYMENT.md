# Quick Reference - Deployment & Testing

## 🎯 TL;DR

**Status:** ✅ Ready to deploy
**Changes:** 23 lines in 2 files
**Risk:** None (backward compatible)
**Testing:** 24-48 hours

---

## 📋 Files Changed

```
src/util/jobs/archiveAlertsToS3Optimized.js    (+5 lines)
src/routes/alertHistoryOptimized.js            (+18 lines)
```

---

## 🚀 Deploy in 3 Steps

### **Step 1: Commit**
```bash
git add src/util/jobs/archiveAlertsToS3Optimized.js
git add src/routes/alertHistoryOptimized.js
git commit -m "Fix: Store and retrieve expired alerts in historical data"
```

### **Step 2: Push**
```bash
git push origin release/staging
git push heroku-staging release/staging:main
```

### **Step 3: Verify**
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
```

---

## 🧪 Testing Checklist

### **Immediate (0-2 hours)**
- [ ] API responds without errors
- [ ] Check Heroku logs
- [ ] Test both endpoints

### **Short-term (2-12 hours)**
- [ ] Create test alerts
- [ ] Let them expire
- [ ] Query history
- [ ] Verify they appear

### **Long-term (12-48 hours)**
- [ ] Monitor for anomalies
- [ ] Check data completeness
- [ ] Verify visualization
- [ ] Confirm no issues

---

## 📊 Success Indicators

✅ API responding
✅ No errors in logs
✅ Expired alerts appearing
✅ Data completeness improved
✅ Timeline complete
✅ Visualization working

---

## 🔍 Quick Tests

### **Health Check**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.success'
```

### **Count Alerts**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.data.alerts | length'
```

### **Find Expired**
```bash
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.data.alerts[] | select(.status=="expired")'
```

---

## 🚨 If Issues Occur

```bash
# Rollback
git revert <commit-hash>
git push origin release/staging
git push heroku-staging release/staging:main
```

---

## 📈 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Expired alerts | ❌ Missing | ✅ Included |
| Data completeness | ~95% | ~100% |
| Timeline | Incomplete | Complete |

---

## 📞 Monitoring

```bash
# Watch logs
heroku logs --tail --app api-data-nexlab-staging

# Check status
curl -s "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24" | jq '.success'
```

---

## ✅ Ready?

1. Deploy to staging
2. Monitor 24-48 hours
3. Verify fix working
4. Deploy to production

**Go!** 🚀

