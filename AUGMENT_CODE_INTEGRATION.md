# NexLab Weather Alerts API - Integration Guide for Augment Code

## Quick Start

**API Documentation Endpoint:**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

**Base API URL:**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com
```

---

## What You Need to Know

### Real-Time Hazards Data
- **Endpoint:** `GET /api/hazards`
- **Updated:** Every 30 seconds
- **Use for:** Current active weather alerts and hazards

### Historical Alerts Data
- **Endpoints:** 
  - `GET /api/alerts/history/optimized?date=YYYY-MM-DD`
  - `GET /api/alerts/history/last?hours=N`
- **Storage:** Amazon S3 (28-day retention)
- **Use for:** Historical alert data and timeline tracking

### Complete Documentation
- **Endpoint:** `GET /api/docs`
- **Format:** JSON
- **Contains:** All endpoints, parameters, schema, filtering options, and examples

---

## How to Use

### Step 1: Fetch the Documentation
```bash
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

This returns complete API schema including:
- All 7 endpoints
- Query parameters for each endpoint
- Alert data structure (15+ fields)
- Filtering options (regions, states, hazard types, levels)
- Usage examples
- Important notes for AI agents

### Step 2: Query Real-Time Hazards
```bash
# Get all active hazards
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards

# Get tornado warnings in CONUS
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING"

# Get hazards for specific county (Miami-Dade, FIPS: 12086)
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards/county/12086

# Get hazards for specific state (Florida)
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards/state/FL

# Get hazards for specific region
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards/region/CONUS
```

### Step 3: Query Historical Alerts
```bash
# Get all alerts for a specific date
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23"

# Get alerts from last 24 hours
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"

# Get alerts from last 7 days
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=168"
```

---

## Available Filters

### Regions
- `CONUS` - Continental United States
- `ALASKA` - Alaska
- `HAWAII` - Hawaii

### States
All 50 US states (2-letter codes): AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY

### Hazard Types
- `TORNADO` - Tornado warnings/watches
- `SEVERE` - Severe thunderstorm warnings/watches
- `FIRE` - Fire weather alerts
- `WINTER` - Winter weather alerts
- `MARINE` - Marine/coastal alerts
- `FLOOD` - Flood warnings/watches
- `WIND` - Wind alerts
- `HEAT` - Heat alerts
- `COLD` - Cold alerts
- `FROST` - Frost alerts
- `FREEZE` - Freeze alerts

### Hazard Levels
- `WARNING` - Immediate threat
- `WATCH` - Conditions favorable
- `ADVISORY` - Potential hazard
- `STATEMENT` - General information

---

## Alert Data Structure

Each alert contains:
```json
{
  "id": "unique-alert-id",
  "event": "Tornado Warning",
  "headline": "Tornado Warning issued",
  "description": "A tornado warning has been issued...",
  "severity": "Extreme",
  "urgency": "Immediate",
  "certainty": "Observed",
  "areaDesc": "Miami-Dade County",
  "sent": "2025-10-23T16:27:30.046Z",
  "effective": "2025-10-23T16:27:30.047Z",
  "onset": "2025-10-23T16:27:30.047Z",
  "expires": "2025-10-23T17:27:30.047Z",
  "ends": "2025-10-23T17:27:30.047Z",
  "locations": [
    {
      "id": "county-12086",
      "locationId": "12086",
      "name": "Miami-Dade",
      "type": "county",
      "state": "FL",
      "lat": 25.7617,
      "lon": -80.1918
    }
  ]
}
```

---

## Important Notes

1. **Timestamps:** All timestamps are in UTC (ISO 8601 format)
2. **Real-time Data:** `/api/hazards` is updated every 30 seconds
3. **Historical Data:** `/api/alerts/history/*` is stored in S3 with 28-day retention
4. **Locations:** Each alert can affect multiple locations (counties, coasts, offshores)
5. **Normalized Structure:** Locations are stored separately from alerts for efficiency
6. **Backward Compatible:** API handles both old and new snapshot formats
7. **Query Limits:** Maximum 720 hours (30 days) for historical queries
8. **Region Filtering:** Optional but recommended for performance

---

## Example Use Cases

### Get All Current Tornado Warnings
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?hazardType=TORNADO&hazardLevel=WARNING"
```

### Get All Alerts for Miami-Dade County
```bash
curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards/county/12086
```

### Get All Alerts from Last 24 Hours
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
```

### Get All Alerts for Specific Date
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23"
```

### Get Marine Warnings in CONUS
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?region=CONUS&hazardType=MARINE&hazardLevel=WARNING"
```

---

## Response Format

All endpoints return JSON with this structure:
```json
{
  "success": true,
  "message": "Description of results",
  "data": {
    "alerts": {
      "alert-id-1": { /* alert object */ },
      "alert-id-2": { /* alert object */ }
    }
  },
  "timestamp": "2025-10-23T19:50:00.000Z"
}
```

---

## Getting Started

1. **Fetch the documentation:**
   ```bash
   curl https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
   ```

2. **Review the complete schema** - includes all endpoints, parameters, and examples

3. **Start querying** - use the endpoints and filters documented above

4. **Use the examples** - pre-built URLs are provided in the documentation

---

## Support

For questions about the API:
- Check the `/api/docs` endpoint for complete documentation
- Review the examples provided above
- All endpoints are self-documenting with parameter descriptions

---

## Summary

**Documentation Endpoint:**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

**Real-Time Hazards:**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards
```

**Historical Alerts:**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23
```

**Available Filters:** Regions, States, Hazard Types, Hazard Levels

**Data Updated:** Every 30 seconds for real-time, historical data stored in S3

