# 📡 NexLab Data API - Complete Endpoints Guide

## Overview

The API has **4 main route files** providing **10+ endpoints** for real-time and historical weather alert data.

---

## 🔴 REAL-TIME HAZARDS ENDPOINTS

### 1. GET `/api/hazards`
**Get all active hazards with optional filters**

**Data Source:** In-memory cache (updated every 30 seconds)

**Query Parameters:**
- `region` - Filter by region (CONUS, ALASKA, HAWAII)
- `state` - Filter by state code (FL, CA, TX, etc.)
- `hazardType` - Filter by type (TORNADO, SEVERE, FIRE, WINTER, MARINE, etc.)
- `hazardLevel` - Filter by level (WARNING, WATCH, ADVISORY, STATEMENT)

**Example:**
```
GET /api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING
```

**Response:**
```json
{
  "success": true,
  "message": "Found 45 active hazards",
  "data": [
    {
      "id": "alert-1",
      "event": "Tornado Warning",
      "headline": "Tornado Warning issued",
      "severity": "Extreme",
      "urgency": "Immediate",
      "areaDesc": "Miami-Dade County",
      "locations": [
        {
          "id": "county-12086",
          "name": "Miami-Dade County",
          "type": "county",
          "state": "FL",
          "lat": 25.7617,
          "lon": -80.1918
        }
      ]
    }
  ],
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

---

### 2. GET `/api/hazards/county/:fips`
**Get hazards for a specific county**

**Data Source:** In-memory cache

**Path Parameters:**
- `fips` - County FIPS code (5 digits, e.g., 12086)

**Example:**
```
GET /api/hazards/county/12086
```

---

### 3. GET `/api/hazards/state/:state`
**Get hazards for a specific state**

**Data Source:** In-memory cache

**Path Parameters:**
- `state` - State code (2 letters, e.g., FL)

**Example:**
```
GET /api/hazards/state/FL
```

---

### 4. GET `/api/hazards/region/:region`
**Get hazards for a specific region**

**Data Source:** In-memory cache

**Path Parameters:**
- `region` - Region name (CONUS, ALASKA, HAWAII)

**Example:**
```
GET /api/hazards/region/CONUS
```

---

## 📊 HISTORICAL ALERTS ENDPOINTS (Optimized)

### 5. GET `/api/alerts/history/optimized`
**Get deduplicated alerts for a specific date with timeline**

**Data Source:** Amazon S3 (alerts-optimized/ folder)

**Query Parameters:**
- `date` (required) - Date in YYYY-MM-DD format
- `region` (optional) - Filter by region

**How it works:**
1. Lists all snapshots for the specified date from S3
2. Reads each snapshot (created hourly at :05 past the hour)
3. Deduplicates alerts by ID (each alert appears once)
4. Reconstructs locations from normalized database structure
5. Returns timeline of when alerts were created/updated

**Example:**
```
GET /api/alerts/history/optimized?date=2025-10-28&region=CONUS
```

**Response:**
```json
{
  "success": true,
  "message": "Found 212 unique alerts with 24 snapshots",
  "date": "2025-10-28",
  "region": "CONUS",
  "data": {
    "alerts": {
      "alert-1": {
        "id": "alert-1",
        "event": "Tornado Warning",
        "headline": "Tornado Warning issued",
        "locations": [...]
      }
    },
    "timeline": [
      {
        "timestamp": "2025-10-28T00:05:00.000Z",
        "events": [
          {"alertId": "alert-1", "status": "new"},
          {"alertId": "alert-2", "status": "new"}
        ]
      }
    ]
  }
}
```

---

### 6. GET `/api/alerts/history/last`
**Get alerts from the last N hours**

**Data Source:** Amazon S3 (alerts-optimized/ folder)

**Query Parameters:**
- `hours` (optional) - Number of hours to look back (default: 24, max: 720)
- `region` (optional) - Filter by region

**How it works:**
1. Calculates date range based on hours parameter
2. Lists all snapshots for each day in the range
3. Filters snapshots by time
4. Deduplicates alerts across all snapshots
5. Returns complete alert history for the period

**Example:**
```
GET /api/alerts/history/last?hours=48&region=CONUS
```

**Response:** Same structure as `/optimized` endpoint

---

## 📚 LEGACY HISTORICAL ENDPOINTS

### 7. GET `/api/alerts/history`
**Get historical alert snapshots for a specific date (Legacy)**

**Data Source:** Amazon S3 (alerts/ folder - old format)

**Query Parameters:**
- `date` (required) - Date in YYYY-MM-DD format
- `region` (optional) - Filter by region
- `hazardType` (optional) - Filter by hazard type

**Note:** This uses the old snapshot format. Use `/optimized` endpoint instead.

---

### 8. GET `/api/alerts/history/dates`
**Get list of available dates with data (Legacy)**

**Data Source:** Amazon S3 (alerts/ folder)

**Query Parameters:**
- `year` (optional) - Filter by year (YYYY)
- `month` (optional) - Filter by month (MM)

---

### 9. GET `/api/alerts/history/location/:locationId`
**Get historical alerts for a specific location (Legacy)**

**Status:** Feature coming soon

---

## 📖 DOCUMENTATION ENDPOINT

### 10. GET `/api/docs`
**Get complete API documentation**

**Data Source:** Generated dynamically

**Returns:** Complete API schema including:
- All endpoints with descriptions
- Query parameters and examples
- Response schemas
- Alert data structure
- Filtering options
- Usage examples
- Notes for AI agents

**Example:**
```
GET /api/docs
```

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    REAL-TIME DATA FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  weather.cod.edu ──→ cacheRegionData() ──→ NodeCache       │
│  (every 30 sec)      (every 30 sec)      (in-memory)       │
│                                              ↓              │
│                                    /api/hazards/* endpoints │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  HISTORICAL DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NodeCache ──→ archiveAlertsToS3Optimized() ──→ Amazon S3  │
│  (current)     (every hour at :05)          (alerts-opt/)  │
│                                                  ↓          │
│                            /api/alerts/history/* endpoints │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK REFERENCE

| Endpoint | Data Source | Update Freq | Use Case |
|----------|-------------|-------------|----------|
| `/api/hazards*` | Cache | 30 sec | Real-time alerts |
| `/api/alerts/history/optimized` | S3 | Hourly | Historical by date |
| `/api/alerts/history/last` | S3 | Hourly | Historical by hours |
| `/api/docs` | Generated | Real-time | API documentation |

---

## 📍 LOCATION TYPES

Alerts can affect three types of locations:

1. **County** - Format: `county-{FIPS}`
   - Example: `county-12086` (Miami-Dade)
   - Has: FIPS code, state, name, coordinates

2. **Coast** - Format: `coast-{ID}`
   - Example: `coast-AMZ530`
   - Has: UGC code, name, coordinates

3. **Offshore** - Format: `offshore-{ID}`
   - Example: `offshore-AMZ630`
   - Has: UGC code, name, coordinates

---

## 🔐 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "data": []
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `500` - Server error
- `503` - Service unavailable (cache not ready)

---

## ✨ Key Features

✅ **Real-time data** - Updated every 30 seconds
✅ **Historical data** - Up to 30 days of history
✅ **Deduplication** - Each alert appears once in results
✅ **Flexible filtering** - By region, state, hazard type, level
✅ **Normalized structure** - Locations stored separately
✅ **Backward compatible** - Works with old snapshot formats
✅ **Timeline tracking** - See when alerts were created/updated
✅ **Complete documentation** - `/api/docs` endpoint


