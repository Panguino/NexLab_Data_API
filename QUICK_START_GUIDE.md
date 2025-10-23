# Quick Start Guide - Hazards REST API

## 🚀 Get Started in 5 Minutes

### 1. Start the Server

```bash
npm start
```

Server will be available at `http://localhost:3000`

### 2. Test the API

```bash
# Get all hazards
curl http://localhost:3000/api/hazards

# Get tornado warnings in CONUS
curl "http://localhost:3000/api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING"

# Get hazards for Miami-Dade County (FIPS: 12086)
curl http://localhost:3000/api/hazards/county/12086

# Get all hazards in Florida
curl http://localhost:3000/api/hazards/state/FL

# Get all hazards in Alaska
curl http://localhost:3000/api/hazards/region/ALASKA
```

### 3. Use in Your DeckGL App

```javascript
import React from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';

export default function HazardMap() {
  const [hazards, setHazards] = React.useState([]);

  React.useEffect(() => {
    // Fetch hazards from API
    fetch('http://localhost:3000/api/hazards')
      .then(res => res.json())
      .then(data => setHazards(data.data));
  }, []);

  // Create layer with hazard data
  const layer = new ScatterplotLayer({
    id: 'hazards',
    data: hazards,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 6,
    radiusMinPixels: 1,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 1,
    getPosition: d => [d.lon, d.lat],
    getFillColor: d => {
      const [r, g, b] = d.color.rgb.split(',').map(Number);
      return [r, g, b, 200];
    },
    getLineColor: [0, 0, 0],
    getRadius: d => 5,
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

## 📍 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/hazards` | All hazards | `/api/hazards?region=CONUS` |
| `GET /api/hazards/county/:fips` | Hazards by county | `/api/hazards/county/12086` |
| `GET /api/hazards/state/:state` | Hazards by state | `/api/hazards/state/FL` |
| `GET /api/hazards/region/:region` | Hazards by region | `/api/hazards/region/CONUS` |

---

## 🔍 Query Parameters

Use these to filter results:

```
?region=CONUS              # Filter by region
?state=FL                  # Filter by state code
?hazardType=TORNADO        # Filter by hazard type
?hazardLevel=WARNING       # Filter by hazard level
```

**Combine multiple filters:**
```
?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING
```

---

## 🎨 Response Format

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

## 🎯 Hazard Types

```
TORNADO        - Tornado warnings/watches
SEVERE         - Severe thunderstorm warnings/watches
FIRE           - Fire weather warnings
HYDROLOGICAL   - Flood warnings
MARINE         - Marine warnings
TROPICAL       - Hurricane/tropical storm warnings
WINTER         - Winter storm warnings
SPECIALWX      - Special weather statements
NONMET         - Non-meteorological warnings
NONPRECIP      - Non-precipitation warnings
UNKNOWN        - Unknown hazard type
```

---

## 🚨 Hazard Levels

```
WARNING    - Imminent or occurring hazard
WATCH      - Conditions favorable for hazard
ADVISORY   - Less severe hazard
STATEMENT  - Informational
```

---

## 🗺️ Regions

```
CONUS                  - Continental United States
ALASKA                 - Alaska
HAWAII                 - Hawaii
CANADA                 - Canada
PUERTO_RICO            - Puerto Rico
GUAM                   - Guam
AMERICAN_SAMOA         - American Samoa
PANAMA                 - Panama
MEXICO                 - Mexico
CUBA                   - Cuba
GUATEMALA              - Guatemala
BELIZE                 - Belize
HONDURAS               - Honduras
EL_SALVADOR            - El Salvador
DOMINICAN_REPUBLIC     - Dominican Republic
HAITI                  - Haiti
JAMAICA                - Jamaica
BAHAMAS                - Bahamas
NICARAGUA              - Nicaragua
COSTA_RICA             - Costa Rica
```

---

## 💡 Common Use Cases

### Show All Active Hazards
```bash
curl http://localhost:3000/api/hazards
```

### Show Only Tornado Warnings
```bash
curl "http://localhost:3000/api/hazards?hazardType=TORNADO&hazardLevel=WARNING"
```

### Show Hazards in Specific State
```bash
curl http://localhost:3000/api/hazards/state/CA
```

### Show Hazards in Specific County
```bash
curl http://localhost:3000/api/hazards/county/06037
```

### Show Hazards in Specific Region
```bash
curl http://localhost:3000/api/hazards/region/CONUS
```

### Show Fire Warnings in CONUS
```bash
curl "http://localhost:3000/api/hazards?region=CONUS&hazardType=FIRE&hazardLevel=WARNING"
```

---

## 🔗 Linking to Your Database

Use the `locationId` field to link hazards to your location database:

```javascript
// Example: Link hazard to county in your database
const hazard = hazards[0];
const countyId = hazard.locationId;  // FIPS code

// Query your database
const county = await db.counties.findByFIPS(countyId);
```

---

## 🎨 Using Colors in DeckGL

The API provides both HEX and RGB colors:

```javascript
// Using HEX color
getFillColor: d => {
  const hex = d.color.hex;  // e.g., "#FF0000"
  // Convert hex to RGB...
}

// Using RGB color (easier)
getFillColor: d => {
  const [r, g, b] = d.color.rgb.split(',').map(Number);
  return [r, g, b, 200];  // Add alpha channel
}
```

---

## 📊 Filtering in JavaScript

```javascript
// Fetch and filter
const response = await fetch('http://localhost:3000/api/hazards');
const { data } = await response.json();

// Filter by hazard type
const tornadoes = data.filter(h => h.hazardType === 'TORNADO');

// Filter by severity
const warnings = data.filter(h => h.hazardLevel === 'WARNING');

// Filter by state
const floridaHazards = data.filter(h => h.state === 'FL');
```

---

## 🔄 Auto-Refresh Hazards

```javascript
// Refresh every 30 seconds
React.useEffect(() => {
  const interval = setInterval(() => {
    fetch('http://localhost:3000/api/hazards')
      .then(res => res.json())
      .then(data => setHazards(data.data));
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

---

## ❌ Error Handling

```javascript
try {
  const response = await fetch('http://localhost:3000/api/hazards');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const { success, data, message } = await response.json();
  
  if (!success) {
    console.error('API Error:', message);
    return [];
  }
  
  return data;
} catch (error) {
  console.error('Fetch Error:', error);
  return [];
}
```

---

## 📚 More Information

- **Full API Reference**: See `API_DOCUMENTATION.md`
- **Implementation Details**: See `HAZARDS_ENDPOINT_IMPLEMENTATION.md`
- **Architecture Overview**: See `CODEBASE_ANALYSIS_REPORT.md`

---

## 🆘 Troubleshooting

### No hazards returned
- Check if server is running: `npm start`
- Verify filters are correct
- Check server logs for errors

### 503 Service Unavailable
- Region data is still loading
- Wait a few seconds and retry

### CORS errors
- CORS is enabled by default
- Check browser console for details

### Connection refused
- Verify server is running on correct port
- Check `.env` file for PORT setting

---

## 🎉 You're Ready!

Start building your hazard visualization with DeckGL. The API is ready to use!

```bash
# Start server
npm start

# Test in another terminal
curl http://localhost:3000/api/hazards
```

Happy mapping! 🗺️

