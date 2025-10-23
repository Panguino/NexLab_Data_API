# Alert History API - Frontend Integration Guide

## 🎉 New Optimized Endpoints Available

We've released new optimized endpoints for querying alert history with significantly improved performance and reduced data transfer.

---

## 📡 Base URL

```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com
```

---

## 🆕 New Endpoints

### 1. Query Alert History by Date (Optimized)

**Endpoint:**
```
GET /api/alerts/history/optimized?date=YYYY-MM-DD
```

**Parameters:**
- `date` (required): Date in format `YYYY-MM-DD` (e.g., `2025-10-23`)
- `region` (optional): Filter by region (e.g., `CONUS`, `ALASKA`, `HAWAII`)

**Example Request:**
```javascript
fetch('https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "alerts": {
      "alert-1": {
        "id": "alert-1",
        "event": "Tornado Warning",
        "headline": "Tornado Warning issued for...",
        "description": "A tornado warning has been issued...",
        "severity": "Extreme",
        "urgency": "Immediate",
        "areaDesc": "County Name",
        "effective": "2025-10-23T14:00:00Z",
        "expires": "2025-10-23T16:00:00Z",
        "status": "new"
      },
      "alert-2": {
        "id": "alert-2",
        "status": "unchanged"
      }
    },
    "timeline": [
      {
        "timestamp": "2025-10-23T14:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "new" },
          { "alertId": "alert-2", "status": "unchanged" }
        ]
      },
      {
        "timestamp": "2025-10-23T15:00:00Z",
        "events": [
          { "alertId": "alert-1", "status": "unchanged" }
        ]
      }
    ]
  }
}
```

---

### 2. Query Last X Hours (NEW!) ⭐

**Endpoint:**
```
GET /api/alerts/history/last?hours=X
```

**Parameters:**
- `hours` (required): Number of hours to query (1-720)
- `region` (optional): Filter by region (e.g., `CONUS`, `ALASKA`, `HAWAII`)

**Example Requests:**
```javascript
// Last 24 hours
fetch('https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24')

// Last 6 hours
fetch('https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=6')

// Last 1 hour
fetch('https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=1')

// Last 24 hours for CONUS region only
fetch('https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24&region=CONUS')
```

**Response Format:** Same as date-based query above

---

## 📊 Understanding the Response

### Alert Object Structure

**Full Alert (NEW or UPDATED):**
```json
{
  "id": "alert-id",
  "event": "Tornado Warning",
  "headline": "Tornado Warning issued...",
  "description": "A tornado warning has been issued...",
  "severity": "Extreme",
  "urgency": "Immediate",
  "areaDesc": "County Name",
  "effective": "2025-10-23T14:00:00Z",
  "expires": "2025-10-23T16:00:00Z",
  "status": "new"  // or "updated"
}
```

**Minimal Alert (UNCHANGED or EXPIRED):**
```json
{
  "id": "alert-id",
  "status": "unchanged"  // or "expired"
}
```

### Alert Status Values

- **`new`**: Alert first appeared in this snapshot (full data included)
- **`unchanged`**: Alert exists but hasn't changed (only ID included to save bandwidth)
- **`updated`**: Alert properties changed (full data included)
- **`expired`**: Alert is no longer active (only ID included)

### Timeline Structure

The `timeline` array shows when alerts changed status:

```json
{
  "timestamp": "2025-10-23T14:00:00Z",
  "events": [
    { "alertId": "alert-1", "status": "new" },
    { "alertId": "alert-2", "status": "unchanged" }
  ]
}
```

---

## 💡 Usage Examples

### Example 1: Get Today's Alerts
```javascript
const today = new Date().toISOString().split('T')[0];
const response = await fetch(
  `https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=${today}`
);
const data = await response.json();
console.log(data.data.alerts);
```

### Example 2: Get Last 24 Hours of Alerts
```javascript
const response = await fetch(
  'https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24'
);
const data = await response.json();
console.log(data.data.alerts);
```

### Example 3: Build Full Alert History from Timeline
```javascript
const response = await fetch(
  'https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24'
);
const { alerts, timeline } = (await response.json()).data;

// Reconstruct full alert data for each timestamp
timeline.forEach(snapshot => {
  const alertsAtTime = {};
  snapshot.events.forEach(event => {
    if (event.status === 'new' || event.status === 'updated') {
      alertsAtTime[event.alertId] = alerts[event.alertId];
    } else if (event.status === 'unchanged') {
      alertsAtTime[event.alertId] = alerts[event.alertId];
    }
  });
  console.log(`At ${snapshot.timestamp}:`, alertsAtTime);
});
```

### Example 4: Filter by Region
```javascript
const response = await fetch(
  'https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=6&region=CONUS'
);
const data = await response.json();
console.log(data.data.alerts);
```

---

## ⚡ Performance Benefits

### Bandwidth Reduction
- **95% smaller responses** compared to old endpoints
- 24-hour query: 2-5 MB → 100-500 KB
- Faster load times for your users

### Data Efficiency
- Unchanged alerts stored as minimal objects (ID + status only)
- Full data only included when alerts are new or updated
- Significantly reduced data transfer

### Example Size Comparison
```
Old Endpoint (24 hours):
  - 2-5 MB response size
  - Full alert data repeated every hour
  - Slow on mobile networks

New Endpoint (24 hours):
  - 100-500 KB response size
  - Minimal data for unchanged alerts
  - Fast on all networks ✅
```

---

## 🔄 Backward Compatibility

**Old endpoints still work:**
```
GET /api/alerts/history?date=2025-10-23
GET /api/alerts/history/dates
GET /api/alerts/history/location/:locationId
```

You can migrate to the new endpoints at your own pace. No breaking changes!

---

## 🚀 Migration Guide

### Step 1: Update Your Requests
Replace old endpoint calls with new optimized endpoints:

```javascript
// OLD
fetch('/api/alerts/history?date=2025-10-23')

// NEW
fetch('/api/alerts/history/optimized?date=2025-10-23')
```

### Step 2: Handle Minimal Alerts
When processing alerts, check if full data is present:

```javascript
const alerts = data.data.alerts;
Object.values(alerts).forEach(alert => {
  if (alert.status === 'unchanged' || alert.status === 'expired') {
    // Minimal alert - only has id and status
    console.log(`Alert ${alert.id} is ${alert.status}`);
  } else {
    // Full alert data available
    console.log(`Alert: ${alert.headline}`);
  }
});
```

### Step 3: Use Timeline for History
Use the timeline to track when alerts changed:

```javascript
const { alerts, timeline } = data.data;
timeline.forEach(snapshot => {
  console.log(`At ${snapshot.timestamp}:`);
  snapshot.events.forEach(event => {
    console.log(`  - Alert ${event.alertId}: ${event.status}`);
  });
});
```

---

## ❓ FAQ

**Q: Why are some alerts minimal?**
A: Unchanged alerts are stored minimally to save bandwidth. Full data is only included when alerts are new or updated.

**Q: How do I get full data for an unchanged alert?**
A: Look in the `alerts` object - it contains all full alert data. Minimal alerts just reference the ID.

**Q: Can I still use the old endpoints?**
A: Yes! Old endpoints continue to work. Migrate at your own pace.

**Q: What's the maximum hours I can query?**
A: Up to 720 hours (30 days) of history is available.

**Q: How often is data updated?**
A: Alerts are archived hourly. New snapshots are created every hour.

---

## 📞 Support

For questions or issues with the new endpoints, contact the backend team.

**Endpoint Status**: ✅ Live and optimized
**Performance**: 95% smaller responses
**Backward Compatible**: Yes ✅

