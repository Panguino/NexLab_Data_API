# 🔍 Data Retrieval Process - Detailed Breakdown

## Real-Time Endpoints (In-Memory Cache)

### How Real-Time Data is Collected

```
Every 30 seconds:
  1. cacheRegionData() is called by schedule.js
  2. Fetches alerts from weather.cod.edu
  3. Processes and normalizes the data
  4. Stores in NodeCache under key "regionData"
  5. Cache is stored in req.app.locals.cache
```

### Real-Time Endpoint Retrieval Flow

**GET /api/hazards** (and variants)

```
Request arrives
  ↓
1. Get cache from req.app.locals.cache
   cache.get("regionData")
  ↓
2. Check if cache exists
   if (!regionData) → return 503 error
  ↓
3. Extract filters from query parameters
   - region
   - state
   - hazardType
   - hazardLevel
  ↓
4. Call hazardFormatter function
   extractAllHazards(regionData, filters)
  ↓
5. Function processes regionData:
   - Iterates through all alerts
   - Applies filters
   - Formats response
  ↓
6. Return JSON response with hazards array
```

### Cache Structure

```javascript
cache.get("regionData") returns:
{
  alerts: {
    "alert-id-1": {
      id: "alert-id-1",
      event: "Tornado Warning",
      headline: "...",
      severity: "Extreme",
      urgency: "Immediate",
      certainty: "Observed",
      areaDesc: "...",
      sent: "2025-10-29T12:00:00Z",
      effective: "2025-10-29T12:00:00Z",
      onset: "2025-10-29T12:00:00Z",
      expires: "2025-10-29T13:00:00Z",
      ends: "2025-10-29T13:00:00Z"
    }
  },
  locations: {
    "county-12086": {
      id: "county-12086",
      locationId: "12086",
      name: "Miami-Dade County",
      type: "county",
      state: "FL",
      lat: 25.7617,
      lon: -80.1918
    }
  },
  alertLocationMap: {
    "alert-id-1": ["county-12086", "county-12087"]
  }
}
```

---

## Historical Endpoints (S3 Archive)

### How Historical Data is Archived

```
Every hour at :05 (5 * * * *):
  1. archiveAlertsToS3Optimized() is called
  2. Gets current alerts from cache
  3. Compares with previous snapshot
  4. Creates incremental snapshot (only NEW/UPDATED alerts)
  5. Uploads to S3: alerts-optimized/YYYY/MM/DD/HH-mm-ss.json
  6. Stores current for next comparison
```

### Incremental Snapshot Structure

```json
{
  "timestamp": "2025-10-28T13:05:00.000Z",
  "snapshot_id": "uuid-here",
  "new_alerts_count": 5,
  "locations": {
    "county-12086": { location data },
    "county-12087": { location data }
  },
  "alert_data": {
    "alert-1": { full alert data },
    "alert-2": { full alert data }
  },
  "alertLocationMap": {
    "alert-1": ["county-12086"],
    "alert-2": ["county-12086", "county-12087"]
  },
  "alerts": {
    "alert-1": { "id": "alert-1" },
    "alert-2": { "id": "alert-2" }
  }
}
```

### Historical Endpoint Retrieval Flow

**GET /api/alerts/history/optimized?date=2025-10-28**

```
Request arrives with date parameter
  ↓
1. Validate date format (YYYY-MM-DD)
  ↓
2. Build S3 prefix
   alerts-optimized/2025/10/28/
  ↓
3. List all objects with prefix
   s3.listObjectsV2({ Bucket, Prefix })
  ↓
4. For each snapshot file:
   a. Get object from S3
      s3.getObject({ Bucket, Key })
   b. Parse JSON
   c. Extract timestamp
   d. Process alert_data section
   e. Deduplicate by alert ID
   f. Reconstruct locations from normalized structure
   g. Add to timeline
  ↓
5. Deduplication logic:
   if (!deduplicatedAlerts[alertId]) {
     // First time seeing this alert
     // Reconstruct locations from alertLocationMap
     // Add to results
   }
   // If already seen, skip (keep first occurrence)
  ↓
6. Return deduplicated alerts + timeline
```

### Historical Endpoint Retrieval Flow

**GET /api/alerts/history/last?hours=24**

```
Request arrives with hours parameter
  ↓
1. Validate hours (1-720)
  ↓
2. Calculate date range
   startDate = now - (hours * 60 * 60 * 1000)
   endDate = now
  ↓
3. Build list of dates to query
   For each day in range:
     dates.push("YYYY/MM/DD")
  ↓
4. For each date:
   a. Build S3 prefix: alerts-optimized/YYYY/MM/DD/
   b. List all objects
   c. For each snapshot:
      - Get from S3
      - Parse JSON
      - Check timestamp is within range
      - Process alert_data
      - Deduplicate
      - Add to timeline
  ↓
5. Return combined results from all dates
```

---

## Data Deduplication Process

### How Deduplication Works

```javascript
const deduplicatedAlerts = {};

for (const snapshot of snapshots) {
  for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
    
    // Only add if we haven't seen this alert before
    if (!deduplicatedAlerts[alertId]) {
      
      // Reconstruct locations from normalized structure
      if (snapshot.locations && snapshot.alertLocationMap[alertId]) {
        const locationIds = snapshot.alertLocationMap[alertId];
        const locations = locationIds
          .map(locId => snapshot.locations[locId])
          .filter(loc => loc);
        
        deduplicatedAlerts[alertId] = {
          ...alertData,
          locations: locations
        };
      } else {
        // Fallback for old format
        deduplicatedAlerts[alertId] = alertData;
      }
    }
  }
}

// Result: Each alert appears exactly once
```

### Example Deduplication

```
Snapshot 1 (12:05):
  - alert-A (NEW)
  - alert-B (NEW)

Snapshot 2 (13:05):
  - alert-A (UPDATED) ← Ignored, already have alert-A
  - alert-C (NEW)

Snapshot 3 (14:05):
  - alert-B (UPDATED) ← Ignored, already have alert-B
  - alert-D (NEW)

Final Result:
  - alert-A (from snapshot 1)
  - alert-B (from snapshot 1)
  - alert-C (from snapshot 2)
  - alert-D (from snapshot 3)
```

---

## Location Reconstruction

### Normalized Structure

```
Snapshot stores:
  locations: {
    "county-12086": { name, type, state, lat, lon },
    "county-12087": { name, type, state, lat, lon }
  }
  
  alertLocationMap: {
    "alert-1": ["county-12086", "county-12087"]
  }
```

### Reconstruction Process

```javascript
// Get location IDs for this alert
const locationIds = snapshot.alertLocationMap[alertId];

// Map IDs to full location objects
const locations = locationIds
  .map(locId => snapshot.locations[locId])
  .filter(loc => loc);

// Result: Full locations array
[
  { name: "Miami-Dade County", type: "county", ... },
  { name: "Broward County", type: "county", ... }
]
```

---

## Performance Characteristics

### Real-Time Endpoints
- **Response Time:** < 100ms
- **Data Freshness:** 30 seconds
- **Memory Usage:** ~100-200 MB
- **Scalability:** Limited by cache size

### Historical Endpoints
- **Response Time:** 1-5 seconds (depends on date range)
- **Data Freshness:** 1 hour (snapshots created hourly)
- **S3 Requests:** Multiple (one per snapshot)
- **Scalability:** Excellent (S3 handles large volumes)

### Deduplication
- **Time Complexity:** O(n) where n = total alerts across snapshots
- **Space Complexity:** O(m) where m = unique alerts
- **Typical Result:** 200-300 unique alerts per day

---

## Error Handling

### Cache Not Available
```
GET /api/hazards
→ 503 Service Unavailable
→ "Region data not available"
```

### Invalid Date Format
```
GET /api/alerts/history/optimized?date=10-28-2025
→ 400 Bad Request
→ "Invalid date format. Use YYYY-MM-DD"
```

### No Data Found
```
GET /api/alerts/history/optimized?date=2025-01-01
→ 200 OK
→ "No data found for date 2025-01-01"
→ data: { alerts: {}, timeline: [] }
```

---

## Backward Compatibility

### Old Snapshot Format Support

The retrieval logic handles both:

1. **New Format** (incremental snapshots)
   - Has `alert_data` section
   - Has `alertLocationMap` section
   - Locations reconstructed from normalized structure

2. **Old Format** (full snapshots)
   - Has `alerts` section with full data
   - Locations embedded in alert objects
   - Fallback logic handles this

```javascript
if (snapshot.alert_data) {
  // New format - use alert_data
} else if (alertData.locations) {
  // Old format - use embedded locations
} else {
  // Fallback - just alert data
}
```


