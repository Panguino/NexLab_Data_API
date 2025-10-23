# API Documentation Endpoint - Complete Guide

## Overview

A new comprehensive API documentation endpoint has been created that provides complete schema and endpoint information for AI agents and developers.

**Endpoint:** `GET /api/docs`

---

## What's Included

### ✅ Complete Endpoint Listing
All available endpoints organized by category:
- **Real-time Hazards** (4 endpoints)
- **Historical Alerts** (2 endpoints)
- **GraphQL API** (1 endpoint)

### ✅ Query Parameter Documentation
For each endpoint:
- Parameter name and type
- Description
- Required/optional status
- Examples
- Valid values

### ✅ Response Schema
- Success/error response structure
- Data types for each field
- Example responses

### ✅ Alert Data Schema
Complete documentation of alert object structure:
- All 15+ fields documented
- Type information
- Descriptions
- Examples

### ✅ Filtering Options
- Available regions: CONUS, ALASKA, HAWAII
- Available states: All 50 US states
- Hazard types: TORNADO, SEVERE, FIRE, WINTER, MARINE, FLOOD, WIND, HEAT, COLD, FROST, FREEZE
- Hazard levels: WARNING, WATCH, ADVISORY, STATEMENT

### ✅ Usage Examples
Pre-built example URLs for common queries:
- Get all hazards
- Get tornado warnings
- Get county hazards
- Get state hazards
- Get alerts for specific date
- Get alerts from last N hours

### ✅ AI Agent Notes
Important information for AI systems:
- Timestamp format (UTC, ISO 8601)
- Alert ID structure
- Location array information
- Real-time vs historical data
- Normalized database structure
- Backward compatibility
- Query limits

---

## Example Response

```json
{
  "success": true,
  "version": "1.0.0",
  "baseUrl": "http://localhost:4400",
  "timestamp": "2025-10-23T19:50:00.000Z",
  "description": "NexLab Weather Alerts API - Complete endpoint documentation",
  "endpoints": {
    "hazards": {
      "category": "Real-time Hazards",
      "description": "Get active weather hazards with real-time data",
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/hazards",
          "description": "Get all active hazards with optional filters",
          "queryParameters": {
            "region": { "type": "string", "examples": ["CONUS", "ALASKA"] },
            "state": { "type": "string", "examples": ["FL", "CA"] },
            "hazardType": { "type": "string", "examples": ["TORNADO", "SEVERE"] },
            "hazardLevel": { "type": "string", "examples": ["WARNING", "WATCH"] }
          },
          "exampleUrl": "/api/hazards?region=CONUS&hazardType=TORNADO"
        }
      ]
    },
    "alertHistory": {
      "category": "Historical Alerts",
      "description": "Get historical alert data with deduplication and timeline tracking",
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/alerts/history/optimized",
          "description": "Get deduplicated alerts for a specific date with timeline",
          "queryParameters": {
            "date": { "type": "string", "format": "YYYY-MM-DD", "required": true },
            "region": { "type": "string", "required": false }
          },
          "exampleUrl": "/api/alerts/history/optimized?date=2025-10-23"
        }
      ]
    }
  },
  "alertSchema": {
    "fields": {
      "id": { "type": "string", "description": "Unique alert identifier" },
      "event": { "type": "string", "description": "Type of weather event" },
      "severity": { "type": "string", "examples": ["Extreme", "Severe", "Moderate"] },
      "locations": { "type": "array", "description": "Array of affected locations" }
    }
  },
  "filteringOptions": {
    "regions": ["CONUS", "ALASKA", "HAWAII"],
    "hazardTypes": ["TORNADO", "SEVERE", "FIRE", "WINTER", "MARINE"],
    "hazardLevels": ["WARNING", "WATCH", "ADVISORY", "STATEMENT"]
  },
  "aiAgentNotes": {
    "points": [
      "All timestamps are in UTC (ISO 8601 format)",
      "Use /api/hazards for real-time data (updated every 30 seconds)",
      "Use /api/alerts/history/* for historical data (stored in S3)",
      "Each alert can affect multiple locations"
    ]
  }
}
```

---

## How to Use

### For Developers
```bash
curl http://localhost:4400/api/docs | jq
```

### For AI Agents
```javascript
// Fetch documentation
const docs = await fetch('http://localhost:4400/api/docs').then(r => r.json());

// Get all endpoints
const endpoints = docs.endpoints;

// Get alert schema
const schema = docs.alertSchema;

// Get filtering options
const filters = docs.filteringOptions;

// Get AI notes
const notes = docs.aiAgentNotes;
```

### For Integration
```python
import requests

# Get API documentation
docs = requests.get('http://localhost:4400/api/docs').json()

# Extract endpoint information
for category, info in docs['endpoints'].items():
    print(f"{info['category']}: {len(info['endpoints'])} endpoints")
    for endpoint in info['endpoints']:
        print(f"  {endpoint['method']} {endpoint['path']}")
```

---

## Endpoints Documented

### Real-time Hazards (4 endpoints)
1. `GET /api/hazards` - Get all active hazards
2. `GET /api/hazards/county/:fips` - Get hazards for county
3. `GET /api/hazards/state/:state` - Get hazards for state
4. `GET /api/hazards/region/:region` - Get hazards for region

### Historical Alerts (2 endpoints)
1. `GET /api/alerts/history/optimized?date=YYYY-MM-DD` - Get alerts for date
2. `GET /api/alerts/history/last?hours=N` - Get alerts from last N hours

### GraphQL (1 endpoint)
1. `POST /graphql` - GraphQL queries and subscriptions

---

## Key Features

✅ **Machine-Readable** - JSON format perfect for AI agents
✅ **Complete** - All endpoints and parameters documented
✅ **Examples** - Pre-built example URLs
✅ **Schema** - Full alert data structure
✅ **Filters** - All available filtering options
✅ **Notes** - Important information for AI systems
✅ **Discoverable** - Single endpoint for all documentation
✅ **Versioned** - API version included

---

## Integration with Augment Code

You can now tell Augment Code:

> "Here's my API documentation endpoint: `http://localhost:4400/api/docs`
> 
> Use this to understand the available endpoints and data structure. 
> The alerts data is available at `/api/hazards` for real-time data 
> and `/api/alerts/history/*` for historical data."

Augment Code can then:
1. Fetch the documentation
2. Understand all available endpoints
3. Know the exact query parameters
4. Understand the response schema
5. Know the filtering options
6. Make proper API calls

---

## File Created

- `src/routes/apiDocs.js` - API documentation endpoint

## Files Modified

- `server.js` - Registered the new documentation route

---

## Testing

The endpoint has been tested and verified to return:
- ✅ All endpoint information
- ✅ Complete parameter documentation
- ✅ Alert schema details
- ✅ Filtering options
- ✅ Usage examples
- ✅ AI agent notes

**Test Result:** ✅ WORKING PERFECTLY

