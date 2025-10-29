# 📋 Executive Summary - Historical Data Loss Issue

## Your Question

> "Can you break down how the reports stores information each hour, we still don't have any historical data of alerts that expired. Please detail/explain the process what happens each hour, and how alerts are added. I want to figure out how alerts are being removed or why we are losing historical data."

---

## The Answer in One Sentence

**Expired alerts are only preserved for 2 hours in the archiving comparison logic, then permanently lost because `previousSnapshot` is overwritten with only current alerts.**

---

## 🔄 What Happens Each Hour

### Every 30 Seconds
```
cacheRegionData() runs
  ↓
Fetches fresh alerts from weather.cod.edu
  ↓
Assigns to counties/coasts/offshores
  ↓
Stores in cache
  ↓
When alert expires: Removed from cache
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

## 🔴 The Critical Problem

**File:** `src/util/jobs/archiveAlertsToS3Optimized.js`
**Line:** 44

```javascript
previousSnapshot = currentAlerts;  // ❌ OVERWRITES PREVIOUS!
```

This single line causes all expired alerts to be lost.

---

## 📈 How Alerts Are Added

1. Weather service includes alert in alerts.json
2. cacheRegionData() fetches it
3. Assigns to matching counties/coasts
4. Stores in cache
5. Next archiving cycle: Marked as `status: 'new'`
6. Full data stored in snapshot ✅

---

## 📉 How Alerts Are Removed (Data Loss)

### Hour 1
- Alert exists in cache
- Snapshot: Alert(new) + full data ✅
- `previousSnapshot` = [A, B, C, D]

### Hour 2
- Alert removed from cache (expired)
- Archiving compares current [A, B, C] with previous [A, B, C, D]
- Detects D is missing: marks as expired ✅
- Snapshot: D(expired) + full data ✅
- `previousSnapshot` = [A, B, C] ❌ **D IS LOST**

### Hour 3
- Archiving compares current [A, B] with previous [A, B, C]
- Detects C is missing: marks as expired ✅
- Snapshot: C(expired) + full data ✅
- `previousSnapshot` = [A, B] ❌ **C IS LOST**

### Hour 4
- Archiving compares current [A] with previous [A, B]
- Detects B is missing: marks as expired ✅
- Snapshot: B(expired) + full data ✅
- `previousSnapshot` = [A] ❌ **B IS LOST**

### Hour 5
- Archiving compares current [A] with previous [A]
- No expired alerts detected ❌
- Snapshot: A(unchanged)
- `previousSnapshot` = [A] ❌ **B IS PERMANENTLY LOST**

---

## 🎯 Why Historical Data Is Lost

**The Timeline:**

```
Hour 1: Alert A exists
  ├─ Cache: [A]
  ├─ Snapshot: A(new) + full data ✅
  └─ previousSnapshot = [A]

Hour 2: Alert A expires
  ├─ Cache: [] (A removed)
  ├─ Previous: [A]
  ├─ Snapshot: A(expired) + full data ✅
  └─ previousSnapshot = [] ❌ A IS LOST

Hour 3: Alert A is gone
  ├─ Cache: []
  ├─ Previous: [] (A is gone!)
  ├─ Snapshot: (no A)
  └─ previousSnapshot = []

Query "last 3 hours":
  ├─ Snapshot 1: A ✅
  ├─ Snapshot 2: A ✅
  ├─ Snapshot 3: (no A)
  └─ Result: A found ✅

Query "last 30 days" (after A has been gone for 28+ days):
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

**But this is accidental!** The archiving logic is broken; it just happens to work because S3 preserves old data.

---

## ❌ Why It Actually Fails

The system fails when:
1. **Querying recent data:** Expired alerts from 2+ hours ago are missing
2. **Real-time + historical mismatch:** Different data sets
3. **Alert lifecycle tracking:** Can't see complete timeline
4. **Data consistency:** Inconsistent across time periods

---

## 📊 Data Flow

```
Collection (Every 30 seconds):
  weather.cod.edu → cacheRegionData() → Cache

Archiving (Every hour at :05):
  Cache → extractAllAlerts() → currentAlerts
  previousSnapshot + currentAlerts → createOptimizedSnapshot() → Snapshot
  Snapshot → S3
  currentAlerts → previousSnapshot ❌ PROBLEM

Retrieval (On demand):
  S3 → List snapshots → Read alert_data → Deduplicate → Return
```

---

## 🔧 Root Cause

**Line 44 in archiveAlertsToS3Optimized.js:**

```javascript
previousSnapshot = currentAlerts;
```

This overwrites `previousSnapshot` with only current alerts, losing all expired alerts from the comparison.

**Why it's a problem:**
- `previousSnapshot` is used to detect expired alerts
- After overwriting, only current alerts are in `previousSnapshot`
- Next hour, expired alerts are gone from `previousSnapshot`
- Can't detect them as expired anymore
- Lost from archiving logic

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

## 🎓 Key Insights

1. **Alerts are stored in cache** - removed when they expire
2. **Archiving compares current vs previous** - only 1 hour window
3. **Expired alerts preserved for 1 snapshot** - then lost
4. **After 2 hours, expired alerts can't be tracked** - no way to know they existed
5. **Historical queries work by accident** - because old S3 snapshots are preserved
6. **Real issue:** `previousSnapshot` is too short-lived

---

## 📚 Documentation Created

I've created comprehensive documentation:

1. **HOURLY_ARCHIVING_PROCESS_DETAILED.md** - Detailed breakdown of each phase
2. **CODE_FLOW_ANALYSIS_EXPIRED_ALERTS.md** - Code flow with exact line numbers
3. **COMPLETE_BREAKDOWN_HOURLY_PROCESS.md** - Hour-by-hour timeline
4. **EXPIRED_ALERTS_ISSUE_SUMMARY.md** - Complete summary
5. **ROOT_CAUSE_ANALYSIS_HISTORICAL_DATA.md** - Root cause analysis
6. **FINAL_ANALYSIS_HISTORICAL_DATA_LOSS.md** - Final analysis

Plus visual diagrams showing the data loss process.

---

## 🚀 Next Steps

To fix this issue, the `previousSnapshot` variable needs to be persistent, not just for one comparison. It should:

1. Store ALL alerts ever seen (not just current)
2. Track when each alert expires
3. Preserve full data for expired alerts indefinitely
4. Only delete after retention period (28 days)

This would require refactoring the archiving logic to maintain a complete history instead of just comparing current vs previous.


