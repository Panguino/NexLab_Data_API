# NexLab Data API - Codebase Analysis Report

## Project Overview

**Project Name:** NexLab Weather API  
**Type:** GraphQL API Server  
**Runtime:** Node.js (v21.4.0+)  
**Main Entry Point:** `server.js`  
**Package Manager:** npm

---

## Project Purpose

The NexLab Data API is a **weather data aggregation and geographic region management system** that provides GraphQL endpoints to query weather-related geographic data including:
- Geographic regions (US states, counties, coasts, offshore areas, and international regions)
- Weather alerts and hazard information
- Geospatial data with simplified geometries
- Regional boundaries and properties

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express + Apollo Server                   │
│                    (GraphQL API Server)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  GraphQL Schema  │  │  GraphQL Resolvers                 │
│  │  (schema.js)     │  │  (resolvers.js)                    │
│  └──────────────────┘  └──────────────────┘                 │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                       │
│           ┌──────────▼──────────┐                           │
│           │  Type Transformers  │                           │
│           │  (TRegion, TCoast,  │                           │
│           │   TState, TAlert)   │                           │
│           └──────────┬──────────┘                           │
│                      │                                       │
│           ┌──────────▼──────────┐                           │
│           │   Node Cache        │                           │
│           │   (In-Memory)       │                           │
│           └──────────┬──────────┘                           │
│                      │                                       │
│           ┌──────────▼──────────┐                           │
│           │  Cache Job Service  │                           │
│           │ (cacheRegionData)   │                           │
│           └──────────┬──────────┘                           │
│                      │                                       │
│           ┌──────────▼──────────┐                           │
│           │  External APIs      │                           │
│           │  (weather.cod.edu)  │                           │
│           └─────────────────────┘                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
NexLab_Data_API/
├── server.js                 # Main Express + Apollo Server setup
├── schedule.js               # Scheduled job configuration
├── package.json              # Dependencies and scripts
├── env-example.txt           # Environment variables template
├── README.md                 # Project documentation (minimal)
│
└── src/
    ├── graphql/
    │   ├── schema.js         # GraphQL type definitions and schema
    │   ├── resolvers.js      # Query resolver mappings
    │   │
    │   ├── resolvers/
    │   │   └── query/
    │   │       └── public/
    │   │           ├── getRegion.js           # Get single region
    │   │           ├── getRegions.js          # Get multiple regions
    │   │           ├── getCoastByUGC.js       # Get coast by UGC code
    │   │           ├── getOffshoreByUGC.js    # Get offshore by UGC code
    │   │           ├── getStateByFIPS.js      # Get state by FIPS code
    │   │           └── getCountyByFIPS.js     # Get county by FIPS code
    │   │
    │   └── types/
    │       ├── TRegion.js                # Region type transformer
    │       ├── TState.js                 # State type transformer
    │       ├── TCounty.js                # County type transformer
    │       ├── TCoast.js                 # Coast type transformer
    │       ├── TOffshore.js              # Offshore type transformer
    │       ├── TAlert.js                 # Alert type transformer
    │       ├── THazardInfo.js            # Hazard info type transformer
    │       ├── THazardTypeInfo.js        # Hazard type info transformer
    │       ├── THazardLevelInfo.js       # Hazard level info transformer
    │       ├── THazardColor.js           # Hazard color type transformer
    │       ├── TRGB.js                   # RGB color type transformer
    │       ├── TBound.js                 # Geographic bounds transformer
    │       ├── TGeoCode.js               # GeoCode type transformer
    │       ├── TReference.js             # Reference type transformer
    │       ├── TParameterObject.js       # Parameter object transformer
    │       ├── TCoastProperties.js       # Coast properties transformer
    │       ├── TOffshoreProperties.js    # Offshore properties transformer
    │       ├── TStateProperties.js       # State properties transformer
    │       ├── TCountyProperties.js      # County properties transformer
    │       ├── TAlertProperties.js       # Alert properties transformer
    │
    └── util/
        ├── hazardInfoUtil.js            # Hazard type/level/color mappings
        │
        ├── common/
        │   └── response.js               # Response formatting utilities
        │
        └── jobs/
            └── cacheRegionData.js        # Main data caching job
```

---

## Core Components

### 1. **Server Setup (server.js)**

**Responsibilities:**
- Initialize Express application
- Configure Apollo Server with GraphQL
- Setup WebSocket subscriptions
- Configure CORS and middleware
- Initialize in-memory cache (NodeCache)
- Start scheduled caching jobs
- Monitor memory usage

**Key Features:**
- GraphQL depth limit validation (max depth: 10)
- Subscription support via WebSocket
- Context injection (pubsub, IP, cache)
- Automatic cache refresh every 30 seconds
- Memory monitoring

---

### 2. **GraphQL Schema (schema.js)**

**Enums:**
- `EHazardType`: TORNADO, SEVERE, FIRE, HYDROLOGICAL, MARINE, NONMET, NONPRECIP, TROPICAL, WINTER, SPECIALWX, UNKNOWN
- `EHazardLevel`: WARNING, WATCH, ADVISORY, STATEMENT
- `ERegion`: 20 geographic regions (CONUS, CANADA, ALASKA, HAWAII, PUERTO_RICO, GUAM, AMERICAN_SAMOA, PANAMA, MEXICO, CUBA, GUATEMALA, BELIZE, HONDURAS, EL_SALVADOR, DOMINICAN_REPUBLIC, HAITI, JAMAICA, BAHAMAS, NICARAGUA, COSTA_RICA)

**Main Types:**
- `Region`: Contains name, bounds, states, coasts, offshores
- `State`: Geographic state with properties and counties
- `County`: Geographic county with properties and alerts
- `Coast`: Coastal area with properties, geometry, and alerts
- `Offshore`: Offshore area with properties, geometry, and alerts
- `Alert`: Weather alert with properties and hazard information
- `HazardInfo`: Type, level, and color information for hazards

**Query Endpoints:**
- `getRegion(region: ERegion!)`: Get single region
- `getRegions(regions: [ERegion]!)`: Get multiple regions
- `getCoastByUGC(UGC: String!)`: Get coast by UGC code
- `getOffshoreByUGC(UGC: String!)`: Get offshore by UGC code
- `getStateByFIPS(FIPS: String!)`: Get state by FIPS code
- `getCountyByFIPS(FIPS: String!)`: Get county by FIPS code

---

### 3. **Data Caching Job (cacheRegionData.js)**

**Purpose:** Fetches and caches geographic data from external APIs

**Data Sources:**
- US States: `https://weather.cod.edu/text/exper/assets/json/old/us-states-nws.json`
- US Counties: `https://weather.cod.edu/text/exper/assets/json/old/us-counties-nws.json`
- Coastal Areas: `https://weather.cod.edu/text/exper/assets/json/old/coastal.json`
- Offshore Areas: `https://weather.cod.edu/text/exper/assets/json/old/offshore.json`
- Canada Provinces: `https://weather.cod.edu/text/exper/assets/json/old/canada.json`
- Mexico & Others: `https://weather.cod.edu/text/exper/assets/json/old/mexi-cuba.json`

**Processing Steps:**
1. Fetch TopoJSON data from external APIs
2. Convert TopoJSON to GeoJSON features
3. Simplify geometries using Turf.js (tolerance: 0.001)
4. Validate geometries (check for kinks in multipolygons)
5. Assign geographic features to appropriate regions
6. Cache entire region data structure in NodeCache

**Key Functions:**
- `getRegionByState()`: Maps US state codes to regions
- `getProvinceNameByAlphaCode()`: Maps Canadian province codes to names
- `getRegionByCoastOrOffshore()`: Maps coordinates to regions using bounds
- `simplifyGeoJson()`: Simplifies polygon geometries for performance

---

### 4. **Hazard Information Utility (hazardInfoUtil.js)**

**Purpose:** Maps weather alert names to hazard types, levels, and colors

**Hazard Type Mappings:**
- Convective: Tornado, Severe Thunderstorm
- Marine: Tsunami, Special Marine Warning
- Fire: Fire Weather
- Hydrological: Flood, Flash Flood
- Winter: Winter Storm, Blizzard
- Tropical: Hurricane, Tropical Storm
- And more...

**Color Coding System:**
- Each hazard type + level combination has RGB and HEX color codes
- Used for visualization on maps

---

### 5. **Type Transformers (types/*.js)**

**Purpose:** Transform raw cached data into GraphQL response format

**Pattern:**
- Each type file exports an async function
- Checks requested fields using `graphql-fields`
- Only includes requested fields in response
- Recursively transforms nested types

**Example (TRegion.js):**
- Transforms region object
- Conditionally includes: name, bounds, states, coasts, offshores
- Calls nested type transformers for complex fields

---

## Dependencies

### Core Framework
- `express`: Web server framework
- `apollo-server-express`: GraphQL server
- `graphql`: GraphQL implementation

### Data Processing
- `@turf/turf`: Geospatial analysis (geometry simplification)
- `topojson-client`: TopoJSON to GeoJSON conversion
- `axios`: HTTP client for external API calls

### Caching & Scheduling
- `node-cache`: In-memory caching
- `node-schedule`: Scheduled job execution

### GraphQL Utilities
- `graphql-fields`: Extract requested fields from GraphQL queries
- `graphql-depth-limit`: Prevent deeply nested queries
- `graphql-subscriptions`: Pub/Sub for subscriptions
- `subscriptions-transport-ws`: WebSocket transport

### Other
- `cors`: Cross-Origin Resource Sharing
- `dotenv`: Environment variable management
- `moment`: Date/time utilities
- `uuid`: UUID generation
- `password-validator`: Password validation
- `@sendgrid/mail`: Email service (currently unused)

---

## Environment Variables

Required configuration (see `env-example.txt`):
- `CRON_SCHEDULE_WEATHER_UPDATE`: Cron expression for scheduled updates
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `SITE_URL`: Base URL for the API

---

## Data Flow

### Query Execution Flow

```
1. Client sends GraphQL query
   ↓
2. Apollo Server receives request
   ↓
3. Resolver function called (e.g., getRegion)
   ↓
4. Retrieves data from NodeCache
   ↓
5. Type transformer processes data
   ↓
6. Only requested fields included in response
   ↓
7. Response sent to client
```

### Cache Update Flow

```
1. Server startup
   ↓
2. cacheRegionData() called
   ↓
3. Fetch data from external APIs
   ↓
4. Process and simplify geometries
   ↓
5. Organize by region/state/county/coast/offshore
   ↓
6. Store in NodeCache with key "regionData"
   ↓
7. Repeat every 30 seconds (or via cron schedule)
```

---

## Performance Considerations

1. **Geometry Simplification**: Reduces file size and query response times
2. **In-Memory Caching**: Fast data access without database queries
3. **Field Selection**: Only requested fields are processed
4. **Query Depth Limiting**: Prevents expensive nested queries
5. **Scheduled Updates**: Periodic cache refresh without blocking requests

---

## Known Issues & Observations

1. **Minimal Documentation**: README.md is empty
2. **Unused Dependencies**: `@sendgrid/mail`, `password-validator` not used
3. **Hard-coded API URLs**: External data sources are hard-coded
4. **No Error Handling**: Limited error recovery in resolvers
5. **No Database**: All data is in-memory (lost on restart)
6. **No Authentication**: All endpoints are public
7. **Memory Monitoring**: Logs memory usage but no alerts

---

## Scalability & Future Improvements

### Potential Enhancements
1. Add database persistence (PostgreSQL with PostGIS)
2. Implement authentication/authorization
3. Add mutation endpoints for alert management
4. Implement proper error handling and logging
5. Add rate limiting and request throttling
6. Implement data versioning
7. Add comprehensive API documentation
8. Create unit and integration tests
9. Add monitoring and alerting
10. Implement data validation schemas

---

## Summary

The NexLab Data API is a **specialized weather data aggregation service** that:
- Fetches geographic and weather data from external sources
- Caches data in-memory for fast access
- Exposes data via GraphQL API
- Supports queries by region, state, county, coast, and offshore areas
- Includes hazard information with color coding
- Automatically refreshes data on a schedule

It's designed for **read-heavy workloads** with **geographic data queries** and is suitable for weather visualization applications, alert systems, and geographic information services.

