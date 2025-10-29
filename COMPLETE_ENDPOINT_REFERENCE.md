# 📚 Complete Endpoint Reference

## Real-Time Endpoints

### 1. GET /api/hazards
Get all active hazards with optional filters

**Query Parameters:**
- `region` (optional) - CONUS, ALASKA, HAWAII
- `state` (optional) - 2-letter state code (FL, CA, TX, etc.)
- `hazardType` (optional) - TORNADO, SEVERE, FIRE, WINTER, MARINE, FLOOD, WIND, HEAT, COLD, FROST, FREEZE
- `hazardLevel` (optional) - WARNING, WATCH, ADVISORY, STATEMENT

**Examples:**
```
GET /api/hazards
GET /api/hazards?region=CONUS
GET /api/hazards?state=FL
GET /api/hazards?hazardType=TORNADO
GET /api/hazards?hazardLevel=WARNING
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
      "description": "...",
      "severity": "Extreme",
      "urgency": "Immediate",
      "certainty": "Observed",
      "areaDesc": "Miami-Dade County",
      "sent": "2025-10-29T12:00:00Z",
      "effective": "2025-10-29T12:00:00Z",
      "onset": "2025-10-29T12:00:00Z",
      "expires": "2025-10-29T13:00:00Z",
      "ends": "2025-10-29T13:00:00Z",
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

### 2. GET /api/hazards/county/:fips
Get hazards for a specific county

**Path Parameters:**
- `fips` (required) - 5-digit county FIPS code

**Examples:**
```
GET /api/hazards/county/12086
GET /api/hazards/county/06083
GET /api/hazards/county/36061
```

**Response:** Same as /api/hazards but filtered to county

---

### 3. GET /api/hazards/state/:state
Get hazards for a specific state

**Path Parameters:**
- `state` (required) - 2-letter state code

**Examples:**
```
GET /api/hazards/state/FL
GET /api/hazards/state/CA
GET /api/hazards/state/TX
```

**Response:** Same as /api/hazards but filtered to state

---

### 4. GET /api/hazards/region/:region
Get hazards for a specific region

**Path Parameters:**
- `region` (required) - CONUS, ALASKA, or HAWAII

**Examples:**
```
GET /api/hazards/region/CONUS
GET /api/hazards/region/ALASKA
GET /api/hazards/region/HAWAII
```

**Response:** Same as /api/hazards but filtered to region

---

## Historical Endpoints (Optimized)

### 5. GET /api/alerts/history/optimized
Get deduplicated alerts for a specific date

**Query Parameters:**
- `date` (required) - YYYY-MM-DD format
- `region` (optional) - CONUS, ALASKA, HAWAII

**Examples:**
```
GET /api/alerts/history/optimized?date=2025-10-28
GET /api/alerts/history/optimized?date=2025-10-28&region=CONUS
GET /api/alerts/history/optimized?date=2025-10-27
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
        "description": "...",
        "severity": "Extreme",
        "urgency": "Immediate",
        "certainty": "Observed",
        "areaDesc": "Miami-Dade County",
        "sent": "2025-10-28T12:00:00Z",
        "effective": "2025-10-28T12:00:00Z",
        "onset": "2025-10-28T12:00:00Z",
        "expires": "2025-10-28T13:00:00Z",
        "ends": "2025-10-28T13:00:00Z",
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
    },
    "timeline": [
      {
        "timestamp": "2025-10-28T00:05:00.000Z",
        "events": [
          {"alertId": "alert-1", "status": "new"},
          {"alertId": "alert-2", "status": "new"}
        ]
      },
      {
        "timestamp": "2025-10-28T01:05:00.000Z",
        "events": [
          {"alertId": "alert-3", "status": "new"}
        ]
      }
    ]
  }
}
```

---

### 6. GET /api/alerts/history/last
Get alerts from the last N hours

**Query Parameters:**
- `hours` (optional) - Number of hours (1-720, default: 24)
- `region` (optional) - CONUS, ALASKA, HAWAII

**Examples:**
```
GET /api/alerts/history/last
GET /api/alerts/history/last?hours=24
GET /api/alerts/history/last?hours=48
GET /api/alerts/history/last?hours=168
GET /api/alerts/history/last?hours=24&region=CONUS
```

**Response:** Same structure as /optimized endpoint

---

## Legacy Endpoints

### 7. GET /api/alerts/history
Get historical alert snapshots (legacy format)

**Query Parameters:**
- `date` (required) - YYYY-MM-DD format
- `region` (optional) - Filter by region
- `hazardType` (optional) - Filter by hazard type

**Note:** Use /optimized endpoint instead

---

### 8. GET /api/alerts/history/dates
Get list of available dates with data

**Query Parameters:**
- `year` (optional) - YYYY format
- `month` (optional) - MM format

**Examples:**
```
GET /api/alerts/history/dates
GET /api/alerts/history/dates?year=2025
GET /api/alerts/history/dates?year=2025&month=10
```

---

### 9. GET /api/alerts/history/location/:locationId
Get historical alerts for a location

**Status:** Feature coming soon

---

## Documentation

### 10. GET /api/docs
Get complete API documentation

**Examples:**
```
GET /api/docs
```

**Response:** Complete API schema with all endpoints, parameters, examples, and notes

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "date parameter required (format: YYYY-MM-DD)",
  "data": []
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "message": "Region data not available",
  "data": []
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error fetching hazards",
  "error": "Detailed error message",
  "data": []
}
```

---

## Alert Data Structure

Each alert contains:

```json
{
  "id": "string - unique alert ID",
  "event": "string - event type",
  "headline": "string - short headline",
  "description": "string - detailed description",
  "severity": "string - Extreme, Severe, Moderate, Minor",
  "urgency": "string - Immediate, Expected, Future, Past",
  "certainty": "string - Observed, Likely, Possible",
  "areaDesc": "string - affected area description",
  "sent": "ISO 8601 - when alert was sent",
  "effective": "ISO 8601 - when alert becomes effective",
  "onset": "ISO 8601 - when event begins",
  "expires": "ISO 8601 - when alert expires",
  "ends": "ISO 8601 - when event ends",
  "locations": [
    {
      "id": "string - composite key",
      "locationId": "string - FIPS or location ID",
      "name": "string - location name",
      "type": "string - county, coast, or offshore",
      "state": "string - state code (if applicable)",
      "lat": "number - latitude",
      "lon": "number - longitude"
    }
  ]
}
```

---

## Filtering Options

**Regions:**
- CONUS
- ALASKA
- HAWAII

**States:** All 50 US states (AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY)

**Hazard Types:**
- TORNADO
- SEVERE
- FIRE
- WINTER
- MARINE
- FLOOD
- WIND
- HEAT
- COLD
- FROST
- FREEZE

**Hazard Levels:**
- WARNING
- WATCH
- ADVISORY
- STATEMENT


