# ✅ API Endpoints Documentation - Complete

I've created comprehensive documentation for all your API endpoints. Here's what's available:

---

## 📚 Documentation Files Created

### 1. **ENDPOINTS_SUMMARY.md** ⭐ START HERE
Quick overview of all 10 endpoints organized by category:
- Real-time hazards (4 endpoints)
- Historical alerts optimized (2 endpoints)
- Legacy endpoints (3 endpoints)
- Documentation endpoint (1 endpoint)

**Best for:** Quick reference and understanding the big picture

---

### 2. **API_ENDPOINTS_COMPLETE_GUIDE.md**
Detailed guide with:
- Full endpoint descriptions
- Query parameters and examples
- Response schemas
- Alert data structure
- Filtering options
- Usage examples
- Data flow diagram

**Best for:** Understanding how to use each endpoint

---

### 3. **COMPLETE_ENDPOINT_REFERENCE.md**
Complete reference with:
- All 10 endpoints documented
- Query parameters for each
- Multiple examples per endpoint
- Full response structures
- Error responses
- Alert data schema
- Filtering options

**Best for:** Copy-paste reference when building integrations

---

### 4. **DATA_RETRIEVAL_PROCESS.md**
Technical deep-dive showing:
- How real-time data is collected (every 30 seconds)
- How historical data is archived (every hour)
- Incremental snapshot structure
- Deduplication process with examples
- Location reconstruction logic
- Performance characteristics
- Backward compatibility

**Best for:** Understanding the technical implementation

---

## 🎯 Quick Summary

### Real-Time Endpoints (4)
```
GET /api/hazards                    - All active hazards
GET /api/hazards/county/:fips       - Hazards for county
GET /api/hazards/state/:state       - Hazards for state
GET /api/hazards/region/:region     - Hazards for region
```

**Data Source:** In-memory cache (updated every 30 seconds)
**Response Time:** < 100ms

---

### Historical Endpoints (2)
```
GET /api/alerts/history/optimized   - Alerts for specific date
GET /api/alerts/history/last        - Alerts for last N hours
```

**Data Source:** Amazon S3 (alerts-optimized/ folder)
**Response Time:** 1-5 seconds
**Features:** Deduplication, timeline tracking, location reconstruction

---

### Documentation Endpoint (1)
```
GET /api/docs                       - Complete API schema
```

**Returns:** Full documentation with all endpoints, parameters, and examples

---

### Legacy Endpoints (3)
```
GET /api/alerts/history             - Old format (use /optimized)
GET /api/alerts/history/dates       - Available dates
GET /api/alerts/history/location/:id - Coming soon
```

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

## 📊 Endpoint Comparison

| Aspect | Real-Time | Historical |
|--------|-----------|-----------|
| **Data Source** | Cache | S3 |
| **Update Frequency** | 30 sec | 1 hour |
| **Response Time** | < 100ms | 1-5 sec |
| **Data Freshness** | Very fresh | 1 hour old |
| **Use Case** | Current alerts | Historical analysis |
| **Endpoints** | 4 | 2 (optimized) |

---

## 🎓 How to Use This Documentation

### For Quick Reference
1. Read **ENDPOINTS_SUMMARY.md** first
2. Use **COMPLETE_ENDPOINT_REFERENCE.md** for specific endpoints

### For Integration
1. Read **API_ENDPOINTS_COMPLETE_GUIDE.md**
2. Check **COMPLETE_ENDPOINT_REFERENCE.md** for exact parameters
3. Use `/api/docs` endpoint for live schema

### For Understanding Implementation
1. Read **DATA_RETRIEVAL_PROCESS.md**
2. Understand how data flows through the system
3. Learn about deduplication and location reconstruction

---

## 🚀 Common Use Cases

### Get all active tornado warnings
```bash
curl http://localhost:4400/api/hazards?hazardType=TORNADO&hazardLevel=WARNING
```

### Get hazards for Florida
```bash
curl http://localhost:4400/api/hazards/state/FL
```

### Get all alerts from last 24 hours
```bash
curl http://localhost:4400/api/alerts/history/last?hours=24
```

### Get alerts for specific date
```bash
curl http://localhost:4400/api/alerts/history/optimized?date=2025-10-28
```

### Get complete API documentation
```bash
curl http://localhost:4400/api/docs
```

---

## 📍 Location Types

Alerts can affect three types of locations:

1. **County** - `county-{FIPS}`
   - Example: `county-12086` (Miami-Dade)
   - Has: FIPS code, state, name, coordinates

2. **Coast** - `coast-{ID}`
   - Example: `coast-AMZ530`
   - Has: UGC code, name, coordinates

3. **Offshore** - `offshore-{ID}`
   - Example: `offshore-AMZ630`
   - Has: UGC code, name, coordinates

---

## ✨ Key Features

✅ **Real-time data** - Updated every 30 seconds
✅ **Historical data** - Up to 30 days of history
✅ **Deduplication** - Each alert appears once in results
✅ **Flexible filtering** - By region, state, hazard type, level
✅ **Normalized structure** - Efficient storage and retrieval
✅ **Backward compatible** - Works with old snapshot formats
✅ **Timeline tracking** - See when alerts were created/updated
✅ **Complete documentation** - `/api/docs` endpoint
✅ **Consistent responses** - All endpoints follow same format
✅ **Error handling** - Clear error messages with status codes

---

## 🔐 Response Format

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

## 📋 Query Parameter Limits

| Parameter | Min | Max | Default |
|-----------|-----|-----|---------|
| `hours` | 1 | 720 | 24 |
| Date format | - | - | YYYY-MM-DD |

---

## 🎯 Next Steps

1. **Review the documentation files** created in your workspace
2. **Test the endpoints** using curl or Postman
3. **Check `/api/docs`** for live schema
4. **Integrate** with your frontend or other services

---

## 📞 Support

For questions about specific endpoints:
1. Check **COMPLETE_ENDPOINT_REFERENCE.md** for examples
2. Visit `/api/docs` endpoint for live documentation
3. Review **DATA_RETRIEVAL_PROCESS.md** for technical details

---

## 📝 Files Summary

| File | Purpose | Best For |
|------|---------|----------|
| ENDPOINTS_SUMMARY.md | Quick overview | Getting started |
| API_ENDPOINTS_COMPLETE_GUIDE.md | Detailed guide | Understanding usage |
| COMPLETE_ENDPOINT_REFERENCE.md | Full reference | Integration |
| DATA_RETRIEVAL_PROCESS.md | Technical details | Implementation |

All files are in your workspace root directory.


