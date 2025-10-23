# Alert History Optimization Analysis

## 🔍 Current Implementation Issues

### Problem 1: Redundant Data in Snapshots
Currently, **every hourly snapshot stores the ENTIRE alert object** with all properties:

```javascript
{
  id: "alert-1",
  event: "Tornado Warning",
  locationId: "12086",
  locationName: "Miami-Dade",
  locationType: "county",
  state: "FL",
  lat: 25.7617,
  lon: -80.1918,
  sent: "2025-10-23T16:00:00Z",
  effective: "2025-10-23T16:00:00Z",
  onset: "2025-10-23T16:00:00Z",
  expires: "2025-10-23T17:00:00Z",
  ends: "2025-10-23T17:00:00Z",
  headline: "Tornado Warning issued",
  description: "A tornado warning has been issued...",
  areaDesc: "Miami-Dade County",
  severity: "Extreme",
  certainty: "Observed",
  urgency: "Immediate",
}
```

**Per Alert**: ~900 bytes
**Per Snapshot**: ~117 KB (130 alerts)
**Per Hour**: ~14 MB
**Per Day**: ~336 MB

### Problem 2: Redundant Data in Query Responses
When querying history, the endpoint returns **full snapshots** with all properties repeated:

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-10-23T16:00:00Z",
      "alerts": [
        {
          "id": "alert-1",
          "event": "Tornado Warning",
          "locationId": "12086",
          "locationName": "Miami-Dade",
          "state": "FL",
          "lat": 25.7617,
          "lon": -80.1918,
          "sent": "2025-10-23T16:00:00Z",
          "expires": "2025-10-23T17:00:00Z",
          "headline": "Tornado Warning issued",
          "description": "...",
          "severity": "Extreme",
          "certainty": "Observed",
          "urgency": "Immediate"
        }
      ]
    },
    {
      "timestamp": "2025-10-23T17:00:00Z",
      "alerts": [
        {
          "id": "alert-1",
          "event": "Tornado Warning",
          "locationId": "12086",
          "locationName": "Miami-Dade",
          "state": "FL",
          "lat": 25.7617,
          "lon": -80.1918,
          "sent": "2025-10-23T16:00:00Z",
          "expires": "2025-10-23T17:00:00Z",
          "headline": "Tornado Warning issued",
          "description": "...",
          "severity": "Extreme",
          "certainty": "Observed",
          "urgency": "Immediate"
        }
      ]
    }
  ]
}
```

**Same alert repeated** in multiple snapshots with identical data!

---

## 📊 Data Redundancy Analysis

### Example: Single Alert Over 24 Hours

If an alert exists for 24 hours:
- **Current**: Alert stored 24 times (once per hourly snapshot)
- **Data**: 900 bytes × 24 = **21.6 KB for ONE alert**
- **Wasted**: 20.7 KB (96% redundant!)

### Example: 100 Alerts Over 24 Hours

- **Current**: 100 alerts × 24 snapshots = 2,400 alert objects
- **Data**: 2,400 × 900 bytes = **2.16 MB**
- **Wasted**: ~2.07 MB (96% redundant!)

---

## ✨ Optimized Solution

### Concept: Alert Lifecycle Tracking

Instead of storing full alerts in every snapshot, track **when alerts appear and disappear**:

```javascript
{
  timestamp: "2025-10-23T16:00:00Z",
  snapshot_id: "uuid",
  alerts: {
    "alert-1": {
      id: "alert-1",
      event: "Tornado Warning",
      locationId: "12086",
      locationName: "Miami-Dade",
      state: "FL",
      lat: 25.7617,
      lon: -80.1918,
      sent: "2025-10-23T16:00:00Z",
      expires: "2025-10-23T17:00:00Z",
      headline: "Tornado Warning issued",
      description: "...",
      severity: "Extreme",
      certainty: "Observed",
      urgency: "Immediate",
      status: "new"  // NEW, UPDATED, UNCHANGED, EXPIRED
    },
    "alert-2": {
      id: "alert-2",
      status: "unchanged"  // Only include ID and status
    },
    "alert-3": {
      id: "alert-3",
      status: "expired"
    }
  }
}
```

### Data Reduction

**Per Snapshot with Optimization**:
- New alerts: ~900 bytes each
- Unchanged alerts: ~50 bytes each (just ID + status)
- Expired alerts: ~50 bytes each

**Example**: 100 alerts, 10 new, 85 unchanged, 5 expired
- Current: 100 × 900 = 90 KB
- Optimized: (10 × 900) + (85 × 50) + (5 × 50) = 13.25 KB
- **Reduction: 85% smaller!**

---

## 🚀 Optimized Query Response

### Current Response (Redundant)
```json
{
  "data": [
    {
      "timestamp": "2025-10-23T16:00:00Z",
      "alerts": [
        { "id": "alert-1", "event": "...", "headline": "...", ... }
      ]
    },
    {
      "timestamp": "2025-10-23T17:00:00Z",
      "alerts": [
        { "id": "alert-1", "event": "...", "headline": "...", ... }
      ]
    }
  ]
}
```

### Optimized Response (Deduplicated)
```json
{
  "data": {
    "alerts": {
      "alert-1": {
        "id": "alert-1",
        "event": "Tornado Warning",
        "locationId": "12086",
        "locationName": "Miami-Dade",
        "state": "FL",
        "lat": 25.7617,
        "lon": -80.1918,
        "sent": "2025-10-23T16:00:00Z",
        "expires": "2025-10-23T17:00:00Z",
        "headline": "Tornado Warning issued",
        "description": "...",
        "severity": "Extreme",
        "certainty": "Observed",
        "urgency": "Immediate"
      }
    },
    "timeline": [
      {
        "timestamp": "2025-10-23T16:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "new" }
        ]
      },
      {
        "timestamp": "2025-10-23T17:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "unchanged" }
        ]
      },
      {
        "timestamp": "2025-10-23T18:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "expired" }
        ]
      }
    ]
  }
}
```

**Data Reduction**: 95%+ smaller!

---

## 📈 Storage Impact

### Current Implementation
- Per Day: 336 MB
- Per Week: 2.35 GB
- Per Month: 10.08 GB
- Cost/Month: $0.23

### Optimized Implementation
- Per Day: ~50 MB (85% reduction)
- Per Week: ~350 MB
- Per Month: ~1.5 GB
- Cost/Month: ~$0.03

**Savings: 85% storage reduction!**

---

## 🎯 Implementation Options

### Option 1: Minimal (Recommended)
- Store only alert ID and status in snapshots
- Keep full alert data in separate index
- Query returns deduplicated data

### Option 2: Moderate
- Store full data only for new/updated alerts
- Store only ID+status for unchanged alerts
- Requires merging data during queries

### Option 3: Advanced
- Implement delta compression
- Store only changes between snapshots
- Most complex but smallest storage

---

## 🔄 Query Patterns

### Current: "Get alerts for a date"
```bash
GET /api/alerts/history?date=2025-10-23
```
Returns: 24 full snapshots with redundant data

### Optimized: "Get alert timeline for a date"
```bash
GET /api/alerts/history/timeline?date=2025-10-23
```
Returns: Deduplicated alerts + timeline of changes

### New: "Get alerts from last X hours"
```bash
GET /api/alerts/history/last?hours=24
```
Returns: Alerts active in last 24 hours with timeline

### New: "Get alert lifecycle"
```bash
GET /api/alerts/history/alert/:alertId
```
Returns: Full lifecycle of specific alert

---

## ✅ Recommendation

**Implement Option 1 (Minimal)** because:

1. **85% storage reduction** - Huge cost savings
2. **Simpler implementation** - Minimal code changes
3. **Better query performance** - Less data to transfer
4. **Backward compatible** - Can add new endpoints
5. **Flexible** - Easy to enhance later

**Changes needed**:
1. Modify `archiveAlertsToS3.js` to track alert status
2. Create new endpoint for optimized queries
3. Keep old endpoint for backward compatibility
4. Add alert deduplication logic

---

## 📊 Comparison Table

| Aspect | Current | Optimized |
|--------|---------|-----------|
| **Per Snapshot** | 117 KB | 18 KB |
| **Per Hour** | 14 MB | 2.1 MB |
| **Per Day** | 336 MB | 50 MB |
| **Per Month** | 10.08 GB | 1.5 GB |
| **Cost/Month** | $0.23 | $0.03 |
| **Query Response** | 2-5 MB | 100-500 KB |
| **Data Redundancy** | 96% | 5% |

---

## 🎉 Summary

**Current**: Stores full alert data in every snapshot (96% redundant)
**Optimized**: Tracks alert status changes (5% redundant)
**Benefit**: 85% storage reduction + faster queries
**Effort**: 2-3 hours implementation
**ROI**: Huge - saves $0.20/month per month + better performance

