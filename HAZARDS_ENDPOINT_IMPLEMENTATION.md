# Hazards REST Endpoint - Implementation Guide

## Overview

This document describes the new REST API endpoint for retrieving weather hazard data optimized for DeckGL mapping applications.

## What Was Added

### New Files Created

1. **`src/util/hazardFormatter.js`**
   - Utility module for formatting hazard data
   - Functions:
     - `formatHazard()` - Formats a single alert into DeckGL-compatible format
     - `extractAllHazards()` - Extracts all hazards with optional filtering
     - `getHazardsByCountyFIPS()` - Get hazards for a specific county
     - `getHazardsByState()` - Get hazards for a specific state
     - `getHazardsByRegion()` - Get hazards for a specific region

2. **`src/routes/hazards.js`**
   - Express router for hazards REST endpoints
   - Endpoints:
     - `GET /api/hazards` - Get all hazards with optional filters
     - `GET /api/hazards/county/:fips` - Get hazards by county FIPS code
     - `GET /api/hazards/state/:state` - Get hazards by state code
     - `GET /api/hazards/region/:region` - Get hazards by region name

### Modified Files

1. **`server.js`**
   - Added import for hazards router
   - Stored cache in `app.locals` for route access
   - Registered hazards routes at `/api/hazards`

## Architecture

### Data Flow

```
Client Request
    ↓
Express Router (src/routes/hazards.js)
    ↓
Hazard Formatter (src/util/hazardFormatter.js)
    ↓
Cached Region Data (NodeCache)
    ↓
Format & Filter Hazards
    ↓
JSON Response
```

### Key Design Decisions

1. **Separate from GraphQL**: REST endpoint doesn't interfere with existing GraphQL API
2. **Lightweight Payload**: Only includes essential fields for mapping
3. **Location IDs**: Uses FIPS codes (counties) and UGC codes (coasts/offshores) for easy linking
4. **Color Coding**: Includes pre-calculated hex and RGB colors for visualization
5. **Flexible Filtering**: Supports filtering by region, state, hazard type, and level

## Usage Examples

### Get All Hazards

```bash
curl http://localhost:3000/api/hazards
```

### Get Tornado Warnings in CONUS

```bash
curl "http://localhost:3000/api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING"
```

### Get Hazards for Miami-Dade County

```bash
curl http://localhost:3000/api/hazards/county/12086
```

### Get All Hazards in Florida

```bash
curl http://localhost:3000/api/hazards/state/FL
```

### Get All Hazards in Alaska

```bash
curl http://localhost:3000/api/hazards/region/ALASKA
```

## Response Format

All responses follow this structure:

```json
{
  "success": true/false,
  "message": "Description",
  "data": [
    {
      "id": "alert-uuid",
      "locationId": "FIPS or UGC code",
      "locationType": "county|coast|offshore",
      "locationName": "Name",
      "state": "State code or null",
      "lat": 25.7617,
      "lon": -80.1918,
      "event": "Tornado Warning",
      "hazardType": "TORNADO",
      "hazardLevel": "WARNING",
      "color": {
        "hex": "#FF0000",
        "rgb": "255,0,0"
      },
      "sent": "2024-10-23T14:30:00Z",
      "expires": "2024-10-23T15:30:00Z",
      "headline": "Alert headline",
      "description": "Alert description",
      "areaDesc": "Area description",
      "severity": "Extreme",
      "certainty": "Observed",
      "urgency": "Immediate"
    }
  ],
  "timestamp": "2024-10-23T14:35:00Z"
}
```

## Integration with DeckGL

### Basic Example

```javascript
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';

export default function HazardMap() {
  const [hazards, setHazards] = React.useState([]);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/hazards')
      .then(res => res.json())
      .then(data => setHazards(data.data));
  }, []);

  const layer = new ScatterplotLayer({
    id: 'hazards',
    data: hazards,
    getPosition: d => [d.lon, d.lat],
    getFillColor: d => {
      const [r, g, b] = d.color.rgb.split(',').map(Number);
      return [r, g, b, 200];
    },
    getRadius: 5,
  });

  return <DeckGL layers={[layer]} />;
}
```

### With Filtering

```javascript
const [region, setRegion] = React.useState('CONUS');
const [hazardType, setHazardType] = React.useState('TORNADO');

React.useEffect(() => {
  const params = new URLSearchParams({
    region,
    hazardType,
  });
  
  fetch(`http://localhost:3000/api/hazards?${params}`)
    .then(res => res.json())
    .then(data => setHazards(data.data));
}, [region, hazardType]);
```

## Testing

### Using cURL

```bash
# Test basic endpoint
curl http://localhost:3000/api/hazards

# Test with filters
curl "http://localhost:3000/api/hazards?region=CONUS&hazardType=TORNADO"

# Test county endpoint
curl http://localhost:3000/api/hazards/county/12086

# Test state endpoint
curl http://localhost:3000/api/hazards/state/FL

# Test region endpoint
curl http://localhost:3000/api/hazards/region/CONUS
```

### Using Postman

1. Create a new GET request
2. Enter URL: `http://localhost:3000/api/hazards`
3. Add query parameters as needed
4. Send request

## Performance Considerations

1. **Caching**: Data is cached in-memory and updated every 30 seconds
2. **Filtering**: Filtering happens in-memory (fast for typical datasets)
3. **Payload Size**: Optimized for DeckGL (minimal fields)
4. **No Database**: All data is in-memory (no I/O overhead)

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (missing parameters)
- `500` - Server error
- `503` - Service unavailable (cache not loaded)

## Future Enhancements

Potential improvements:

1. Add pagination for large result sets
2. Add sorting options (by date, severity, etc.)
3. Add geographic bounding box filtering
4. Add WebSocket support for real-time updates
5. Add caching headers for client-side caching
6. Add request rate limiting
7. Add authentication/authorization
8. Add request logging and analytics

## Backward Compatibility

✅ **No Breaking Changes**

- Existing GraphQL API is completely untouched
- New REST endpoints are additive only
- No modifications to existing resolvers or schema
- No changes to cache structure

## Troubleshooting

### No hazards returned

1. Check if region data is loaded: `curl http://localhost:3000/api/hazards`
2. Verify filters are correct (case-sensitive for some parameters)
3. Check server logs for errors

### 503 Service Unavailable

- Region data is still loading on startup
- Wait a few seconds and retry
- Check server logs for cache loading errors

### CORS errors

- Ensure CORS is enabled in server.js (it is by default)
- Check browser console for specific error messages

## Support

For issues or questions, refer to:
- `API_DOCUMENTATION.md` - Full API reference
- `CODEBASE_ANALYSIS_REPORT.md` - Architecture overview
- Server logs for debugging

