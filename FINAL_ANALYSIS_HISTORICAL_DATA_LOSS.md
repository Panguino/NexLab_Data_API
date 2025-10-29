# 🎯 Final Analysis - Historical Data Loss Issue

## Your Question

> "Can you break down how the reports stores information each hour, we still don't have any historical data of alerts that expired. Please detail/explain the process what happens each hour, and how alerts are added. I want to figure out how alerts are being removed or why we are losing historical data."

## The Answer

**The system is losing historical data because expired alerts are only preserved for 2 hours, then permanently lost from the archiving comparison logic.**

---

## 📊 What Happens Each Hour

### Every 30 Seconds: Alert Collection

```
cacheRegionData() runs
  ↓
Fetches fresh alerts from weather.cod.edu
  ↓
Assigns alerts to counties/coasts/offshores
  ↓
Stores in cache: REGIONS[region].states[state].counties[fips].alerts[alertId]
  ↓
When alert expires: Removed from cache
```

**Result:** Cache always contains only current, active alerts.

---

### Every Hour at :05: Archiving

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

### Line 44 in archiveAlertsToS3Optimized.js

```javascript
previousSnapshot = currentAlerts; // ❌ OVERWRITES PREVIOUS!
```

This single line causes all expired alerts to be lost.

---

## 📈 How Alerts Are Added and Removed

### Alert Added

**When alert first appears:**

1. Weather service includes it in alerts.json
2. cacheRegionData() fetches it
3. Assigns to matching counties/coasts
4. Stores in cache
5. Next archiving cycle: Marked as `status: 'new'`
6. Full data stored in snapshot ✅

---

### Alert Removed (Expires)

**When alert expires:**

**Hour 1:**

- Alert exists in cache
- Snapshot includes it with `status: 'new'` or `'unchanged'`
- `previousSnapshot` = [A, B, C, D]

**Hour 2:**

- Alert removed from cache (weather service no longer includes it)
- Archiving compares current [A, B, C] with previous [A, B, C, D]
- Detects D is missing: marks as `status: 'expired'`
- Tries to preserve full data from previous ✅
- Snapshot includes D with full data ✅
- `previousSnapshot` = [A, B, C] ❌ D IS LOST

**Hour 3:**

- Alert is gone from cache
- Archiving compares current [A, B] with previous [A, B, C]
- Detects C is missing: marks as `status: 'expired'`
- Tries to preserve full data from previous ✅
- Snapshot includes C with full data ✅
- `previousSnapshot` = [A, B] ❌ C IS LOST

**Hour 4:**

- Alert is gone from cache
- Archiving compares current [A] with previous [A, B]
- Detects B is missing: marks as `status: 'expired'`
- Tries to preserve full data from previous ✅
- Snapshot includes B with full data ✅
- `previousSnapshot` = [A] ❌ B IS LOST

**Hour 5:**

- Alert is gone from cache
- Archiving compares current [A] with previous [A]
- No expired alerts detected ❌
- Snapshot has no record of B ❌
- B is permanently lost from archiving logic ❌

---

## 🎯 Why Historical Data Is Lost

### The Timeline

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

## 📋 The Data Flow

### Collection (Every 30 seconds)

```
weather.cod.edu → cacheRegionData() → Cache
```

### Archiving (Every hour at :05)

```
Cache → extractAllAlerts() → currentAlerts
previousSnapshot + currentAlerts → createOptimizedSnapshot() → Snapshot
Snapshot → S3
currentAlerts → previousSnapshot ❌ PROBLEM
```

### Retrieval (On demand)

```
S3 → List snapshots → Read alert_data → Deduplicate → Return
```

---

## 🔧 The Root Cause

**Line 44 in archiveAlertsToS3Optimized.js:**

```javascript
previousSnapshot = currentAlerts;
```

This line overwrites `previousSnapshot` with only the current alerts, losing all expired alerts from the comparison.

**Why it's a problem:**

- `previousSnapshot` is used to detect expired alerts
- After overwriting, only current alerts are in `previousSnapshot`
- Next hour, expired alerts are gone from `previousSnapshot`
- Can't detect them as expired anymore
- Lost from archiving logic

---

## 📊 Summary

| Aspect               | Status       | Issue                               |
| -------------------- | ------------ | ----------------------------------- |
| **Alert collection** | ✅ Working   | None                                |
| **Real-time API**    | ✅ Working   | None                                |
| **Archiving job**    | ⚠️ Partial   | Loses expired alerts after 2 hours  |
| **Historical API**   | ⚠️ Partial   | Missing recent expired alerts       |
| **Data retention**   | ⚠️ Partial   | Expired alerts lost from comparison |
| **County data**      | ✅ Collected | But not retained in history         |

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

I've created comprehensive documentation explaining this issue:

1. **HOURLY_ARCHIVING_PROCESS_DETAILED.md** - Detailed breakdown of each phase
2. **CODE_FLOW_ANALYSIS_EXPIRED_ALERTS.md** - Code flow with exact line numbers
3. **COMPLETE_BREAKDOWN_HOURLY_PROCESS.md** - Hour-by-hour timeline
4. **EXPIRED_ALERTS_ISSUE_SUMMARY.md** - Complete summary
5. **ROOT_CAUSE_ANALYSIS_HISTORICAL_DATA.md** - Root cause analysis

Plus visual diagrams showing the data loss process.

---

## 🔍 What's Happening Right Now

**Current state:**

- ✅ Alerts are being collected every 30 seconds
- ✅ Archiving job is running every hour at :05
- ✅ Snapshots are being created and stored in S3
- ❌ Expired alerts are being lost after 2 hours
- ⚠️ Historical queries work for old data but miss recent expirations

**Example:**

- Alert expires at 12:00
- Snapshot at 12:05: Alert marked as expired ✅
- Snapshot at 13:05: Alert marked as expired ✅
- Snapshot at 14:05: Alert NOT marked as expired ❌ (lost from comparison)
- Query "last 3 hours" at 14:10: Alert found ✅
- Query "last 3 hours" at 15:10: Alert NOT found ❌

---

## 🚀 Next Steps

To fix this issue, the `previousSnapshot` variable needs to be persistent, not just for one comparison. It should:

1. Store ALL alerts ever seen (not just current)
2. Track when each alert expires
3. Preserve full data for expired alerts indefinitely
4. Only delete after retention period (28 days)

This would require refactoring the archiving logic to maintain a complete history instead of just comparing current vs previous.
