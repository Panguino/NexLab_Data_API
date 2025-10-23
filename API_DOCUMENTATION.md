# NexLab Data API - REST Hazards Endpoint Documentation

## Overview

The NexLab Data API now includes a new REST API for retrieving weather hazard data optimized for DeckGL mapping applications. This endpoint provides lightweight, JSON-formatted hazard information with location identifiers for easy integration with mapping tools.

---

## Base URL

```
http://localhost:{PORT}/api/hazards
```

Replace `{PORT}` with the port specified in your `.env` file (default: 3000).

---

## Endpoints

### 1. Get All Hazards

**Endpoint:** `GET /api/hazards`

**Description:** Retrieve all active hazards across all regions, with optional filtering.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `region` | string | Filter by region | `CONUS`, `ALASKA`, `HAWAII` |
| `state` | string | Filter by state code | `FL`, `CA`, `NY` |
| `hazardType` | string | Filter by hazard type | `TORNADO`, `SEVERE`, `FIRE` |
| `hazardLevel` | string | Filter by hazard level | `WARNING`, `WATCH`, `ADVISORY` |

**Examples:**

```bash
# Get all hazards
curl http://localhost:3000/api/hazards

# Get all tornado warnings in CONUS
curl http://localhost:3000/api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING

# Get all hazards in Florida
curl http://localhost:3000/api/hazards?state=FL

# Get all fire warnings
curl http://localhost:3000/api/hazards?hazardType=FIRE&hazardLevel=WARNING
```

**Response:**

```json
{
  "success": true,
  "message": "Found 15 active hazards",
  "data": [
    {
      "id": "alert-uuid-123",
      "locationId": "12086",
      "locationType": "county",
      "locationName": "Miami-Dade",
      "state": "FL",
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
      "effective": "2024-10-23T14:30:00Z",
      "onset": "2024-10-23T14:30:00Z",
      "expires": "2024-10-23T15:30:00Z",
      "ends": null,
      "headline": "Tornado Warning issued for Miami-Dade County",
      "description": "A tornado warning has been issued...",
      "areaDesc": "Miami-Dade County",
      "severity": "Extreme",
      "certainty": "Observed",
      "urgency": "Immediate"
    }
  ],
  "timestamp": "2024-10-23T14:35:00Z"
}
```

---

### 2. Get Hazards by County FIPS Code

**Endpoint:** `GET /api/hazards/county/:fips`

**Description:** Retrieve all hazards for a specific county using its FIPS code.

**Path Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `fips` | string | County FIPS code | `12086` |

**Examples:**

```bash
# Get hazards for Miami-Dade County (FIPS: 12086)
curl http://localhost:3000/api/hazards/county/12086

# Get hazards for Los Angeles County (FIPS: 06037)
curl http://localhost:3000/api/hazards/county/06037
```

**Response:**

```json
{
  "success": true,
  "message": "Found 2 hazards for county 12086",
  "data": [
    {
      "id": "alert-uuid-123",
      "locationId": "12086",
      "locationType": "county",
      "locationName": "Miami-Dade",
      "state": "FL",
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
      "headline": "Tornado Warning issued for Miami-Dade County",
      "description": "A tornado warning has been issued...",
      "areaDesc": "Miami-Dade County",
      "severity": "Extreme",
      "certainty": "Observed",
      "urgency": "Immediate"
    }
  ],
  "timestamp": "2024-10-23T14:35:00Z"
}
```

---

### 3. Get Hazards by State

**Endpoint:** `GET /api/hazards/state/:state`

**Description:** Retrieve all hazards for a specific state.

**Path Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `state` | string | State code (case-insensitive) | `FL`, `CA`, `NY` |

**Examples:**

```bash
# Get all hazards in Florida
curl http://localhost:3000/api/hazards/state/FL

# Get all hazards in California
curl http://localhost:3000/api/hazards/state/CA
```

**Response:** Same format as county endpoint, but with all hazards for the state.

---

### 4. Get Hazards by Region

**Endpoint:** `GET /api/hazards/region/:region`

**Description:** Retrieve all hazards for a specific geographic region.

**Path Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `region` | string | Region name (case-insensitive) | `CONUS`, `ALASKA`, `HAWAII` |

**Valid Regions:**
- `CONUS` - Continental United States
- `CANADA` - Canada
- `ALASKA` - Alaska
- `HAWAII` - Hawaii
- `PUERTO_RICO` - Puerto Rico
- `GUAM` - Guam
- `AMERICAN_SAMOA` - American Samoa
- `PANAMA` - Panama
- `MEXICO` - Mexico
- `CUBA` - Cuba
- `GUATEMALA` - Guatemala
- `BELIZE` - Belize
- `HONDURAS` - Honduras
- `EL_SALVADOR` - El Salvador
- `DOMINICAN_REPUBLIC` - Dominican Republic
- `HAITI` - Haiti
- `JAMAICA` - Jamaica
- `BAHAMAS` - Bahamas
- `NICARAGUA` - Nicaragua
- `COSTA_RICA` - Costa Rica

**Examples:**

```bash
# Get all hazards in CONUS
curl http://localhost:3000/api/hazards/region/CONUS

# Get all hazards in Alaska
curl http://localhost:3000/api/hazards/region/ALASKA
```

**Response:** Same format as county endpoint, but with all hazards for the region.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Description of results",
  "data": [
    {
      "id": "string - Unique alert identifier",
      "locationId": "string - FIPS code or UGC code",
      "locationType": "string - 'county', 'coast', or 'offshore'",
      "locationName": "string - County/Coast/Offshore name",
      "state": "string - State code (null for coasts/offshores)",
      "lat": "number - Latitude",
      "lon": "number - Longitude",
      "event": "string - Event name (e.g., 'Tornado Warning')",
      "hazardType": "string - Hazard type (TORNADO, SEVERE, FIRE, etc.)",
      "hazardLevel": "string - Hazard level (WARNING, WATCH, ADVISORY, STATEMENT)",
      "color": {
        "hex": "string - Hex color code (e.g., '#FF0000')",
        "rgb": "string - RGB color code (e.g., '255,0,0')"
      },
      "sent": "string - ISO 8601 timestamp when alert was sent",
      "effective": "string - ISO 8601 timestamp when alert becomes effective",
      "onset": "string - ISO 8601 timestamp when event onset",
      "expires": "string - ISO 8601 timestamp when alert expires",
      "ends": "string - ISO 8601 timestamp when event ends (nullable)",
      "headline": "string - Alert headline",
      "description": "string - Detailed alert description",
      "areaDesc": "string - Area description",
      "severity": "string - Severity level",
      "certainty": "string - Certainty level",
      "urgency": "string - Urgency level"
    }
  ],
  "timestamp": "string - ISO 8601 timestamp of response"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "data": []
}
```

---

## Hazard Types

| Type | Description |
|------|-------------|
| `TORNADO` | Tornado warnings and watches |
| `SEVERE` | Severe thunderstorm warnings and watches |
| `FIRE` | Fire weather warnings and advisories |
| `HYDROLOGICAL` | Flood and flash flood warnings |
| `MARINE` | Marine warnings and advisories |
| `NONMET` | Non-meteorological warnings |
| `NONPRECIP` | Non-precipitation warnings |
| `TROPICAL` | Tropical storm and hurricane warnings |
| `WINTER` | Winter storm and blizzard warnings |
| `SPECIALWX` | Special weather statements |
| `UNKNOWN` | Unknown hazard type |

---

## Hazard Levels

| Level | Description |
|-------|-------------|
| `WARNING` | Issued when a hazard is imminent or occurring |
| `WATCH` | Issued when conditions are favorable for a hazard |
| `ADVISORY` | Issued for less severe hazards |
| `STATEMENT` | Issued for informational purposes |

---

## Color Coding

Each hazard type and level combination has a predefined color for visualization:

```json
{
  "TORNADO": {
    "WARNING": { "hex": "#FF0000", "rgb": "255,0,0" },
    "WATCH": { "hex": "#FF6464", "rgb": "255,100,100" }
  },
  "SEVERE": {
    "WARNING": { "hex": "#0064E1", "rgb": "0,100,225" },
    "WATCH": { "hex": "#3296FF", "rgb": "50,150,255" }
  },
  "FIRE": {
    "WARNING": { "hex": "#FF6E00", "rgb": "255,110,0" },
    "ADVISORY": { "hex": "#E86400", "rgb": "232,100,0" },
    "WATCH": { "hex": "#D15B00", "rgb": "209,91,0" },
    "STATEMENT": { "hex": "#BA5100", "rgb": "186,81,0" }
  }
}
```

---

## DeckGL Integration Example

```javascript
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';

async function fetchHazards() {
  const response = await fetch('http://localhost:3000/api/hazards?region=CONUS');
  const result = await response.json();
  return result.data;
}

export default function HazardMap() {
  const [hazards, setHazards] = React.useState([]);

  React.useEffect(() => {
    fetchHazards().then(setHazards);
  }, []);

  const layer = new ScatterplotLayer({
    id: 'hazard-layer',
    data: hazards,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 6,
    radiusMinPixels: 1,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 1,
    getPosition: (d) => [d.lon, d.lat],
    getFillColor: (d) => {
      const rgb = d.color.rgb.split(',').map(Number);
      return [...rgb, 200];
    },
    getLineColor: [0, 0, 0],
    getRadius: (d) => 5,
    onHover: ({ object, x, y }) => {
      if (object) {
        console.log(`${object.event} in ${object.locationName}`);
      }
    },
  });

  return (
    <DeckGL
      initialViewState={{
        longitude: -95,
        latitude: 40,
        zoom: 4,
      }}
      controller={true}
      layers={[layer]}
    />
  );
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Hazards retrieved |
| `400` | Bad Request - Missing or invalid parameters |
| `500` | Server Error - Internal server error |
| `503` | Service Unavailable - Region data not loaded |

---

## Rate Limiting

Currently, there is no rate limiting on the hazards endpoints. This may be added in future versions.

---

## Caching

Hazard data is cached in-memory and updated every 30 seconds. The `timestamp` field in the response indicates when the response was generated, not when the data was last updated.

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Location IDs are FIPS codes for counties, UGC codes for coasts/offshores
- The API returns an empty array if no hazards match the criteria
- Coordinates are in WGS84 (EPSG:4326) format
- The API is read-only; no mutations are supported

---

## Support

For issues or questions, please contact the development team.

