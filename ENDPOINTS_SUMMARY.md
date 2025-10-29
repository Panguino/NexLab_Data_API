# 📡 API Endpoints Summary

## Quick Overview

Your API has **10 main endpoints** organized into 4 categories:

---

## 🔴 REAL-TIME HAZARDS (4 endpoints)

All pull from **in-memory cache** updated every 30 seconds.

| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `GET /api/hazards` | All active hazards | Cache |
| `GET /api/hazards/county/:fips` | Hazards for county | Cache |
| `GET /api/hazards/state/:state` | Hazards for state | Cache |
| `GET /api/hazards/region/:region` | Hazards for region | Cache |

**Example:**
```bash
curl http://localhost:4400/api/hazards?region=CONUS&hazardType=TORNADO
```

---

## 📊 HISTORICAL ALERTS - OPTIMIZED (2 endpoints)

All pull from **S3 archive** with hourly snapshots.

| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `GET /api/alerts/history/optimized` | Alerts for specific date | S3 |
| `GET /api/alerts/history/last` | Alerts for last N hours | S3 |

**Key Features:**
- ✅ Deduplicates alerts (each appears once)
- ✅ Includes timeline of changes
- ✅ Reconstructs locations from normalized structure
- ✅ Backward compatible with old formats

**Example:**
```bash
curl http://localhost:4400/api/alerts/history/last?hours=24
```

---

## 📚 HISTORICAL ALERTS - LEGACY (3 endpoints)

Old format endpoints (use optimized instead).

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/alerts/history` | Alerts for date | Legacy |
| `GET /api/alerts/history/dates` | Available dates | Legacy |
| `GET /api/alerts/history/location/:locationId` | Location history | Coming soon |

---

## 📖 DOCUMENTATION (1 endpoint)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/docs` | Complete API schema |

**Returns:** Full documentation including all endpoints, parameters, schemas, and examples.

---

## 🔄 Data Retrieval Methods

### Real-Time Endpoints

```
Request → Get cache from memory → Apply filters → Return results
Response time: < 100ms
Data freshness: 30 seconds
```

### Historical Endpoints

```
Request → List S3 objects for date range → Read each snapshot → 
Deduplicate alerts → Reconstruct locations → Return results
Response time: 1-5 seconds
Data freshness: 1 hour
```

---

## 📍 Location Types

Alerts can affect three types of locations:

1. **County** - `county-{FIPS}`
   - Example: `county-12086` (Miami-Dade)

2. **Coast** - `coast-{ID}`
   - Example: `coast-AMZ530`

3. **Offshore** - `offshore-{ID}`
   - Example: `offshore-AMZ630`

---

## 🎯 Common Use Cases

### Get all active tornado warnings
```
GET /api/hazards?hazardType=TORNADO&hazardLevel=WARNING
```

### Get hazards for Florida
```
GET /api/hazards/state/FL
```

### Get hazards for specific county
```
GET /api/hazards/county/12086
```

### Get all alerts from last 24 hours
```
GET /api/alerts/history/last?hours=24
```

### Get all alerts for specific date
```
GET /api/alerts/history/optimized?date=2025-10-28
```

### Get alerts for date and region
```
GET /api/alerts/history/optimized?date=2025-10-28&region=CONUS
```

### Get alerts from last 7 days
```
GET /api/alerts/history/last?hours=168
```

---

## 📊 Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "message": "Description of results",
  "data": {
    // Endpoint-specific data
  },
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

---

## 🔐 Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "data": []
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `500` - Server error
- `503` - Service unavailable

---

## ⚡ Performance Tips

1. **Use region filter** - Reduces data transfer
2. **Use specific date** - Faster than large time ranges
3. **Cache results** - API data updates every 30-60 seconds
4. **Batch requests** - Combine multiple queries if possible
5. **Use `/api/docs`** - For complete schema reference

---

## 🔄 Data Flow

```
weather.cod.edu
    ↓ (every 30 sec)
cacheRegionData()
    ↓
NodeCache (in-memory)
    ├→ /api/hazards/* (real-time)
    └→ archiveAlertsToS3Optimized()
        ↓ (every hour at :05)
        Amazon S3
        └→ /api/alerts/history/* (historical)
```

---

## 📋 Query Parameter Limits

| Parameter | Min | Max | Default |
|-----------|-----|-----|---------|
| `hours` | 1 | 720 | 24 |
| Date format | - | - | YYYY-MM-DD |

---

## ✨ Key Features

✅ Real-time data (30 sec updates)
✅ Historical data (up to 30 days)
✅ Deduplication (no duplicate alerts)
✅ Flexible filtering (region, state, type, level)
✅ Normalized structure (efficient storage)
✅ Backward compatible (old formats work)
✅ Timeline tracking (see alert changes)
✅ Complete documentation (/api/docs)

---

## 🚀 Getting Started

1. **Check API docs:**
   ```bash
   curl http://localhost:4400/api/docs
   ```

2. **Get all active hazards:**
   ```bash
   curl http://localhost:4400/api/hazards
   ```

3. **Get hazards for your region:**
   ```bash
   curl http://localhost:4400/api/hazards?region=CONUS
   ```

4. **Get historical data:**
   ```bash
   curl http://localhost:4400/api/alerts/history/last?hours=24
   ```


