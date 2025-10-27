# Coastal & Ocean Alerts - Quick Guide

## ✅ YES - Fully Captured

Your system captures **all** coastal and ocean alerts across the US.

---

## 📊 Three Location Types

| Type | ID Format | Count | Examples |
|------|-----------|-------|----------|
| **County** | `county-{FIPS}` | ~3,000+ | county-12086 (Miami-Dade, FL) |
| **Coast** | `coast-{ID}` | ~100+ | coast-AMZ123 (Northern CA Coast) |
| **Offshore** | `offshore-{ID}` | ~50+ | offshore-OFZ001 (Atlantic Offshore) |

---

## 🌊 Coastal Coverage

### **Atlantic Coast**
- Maine to Florida
- All coastal zones captured
- All offshore zones captured

### **Gulf Coast**
- Florida to Texas
- All coastal zones captured
- All offshore zones captured

### **Pacific Coast**
- California to Washington
- All coastal zones captured
- All offshore zones captured

### **Great Lakes**
- All 5 Great Lakes
- Coastal zones captured
- Offshore zones captured

### **Alaska & Hawaii**
- All coastal zones
- All offshore zones

---

## 🔍 Query Examples

### **Get All Marine Alerts**
```bash
GET /api/hazards?hazardType=MARINE
```

### **Get Marine Warnings**
```bash
GET /api/hazards?hazardType=MARINE&hazardLevel=WARNING
```

### **Get Coastal Alerts for Last 24 Hours**
```bash
GET /api/alerts/history/last?hours=24
```

### **Get Coastal Alerts for Specific Date**
```bash
GET /api/alerts/history/optimized?date=2025-10-23
```

### **Get Alerts by Region**
```bash
GET /api/hazards?region=CONUS&hazardType=MARINE
```

---

## 📈 Data Structure

### **Coastal Alert Example**
```json
{
  "id": "alert-marine-001",
  "event": "Marine Warning",
  "severity": "Severe",
  "urgency": "Immediate",
  "sent": "2025-10-23T16:27:30Z",
  "expires": "2025-10-23T22:27:30Z",
  "locations": [
    {
      "id": "coast-AMZ123",
      "name": "Coastal Waters of Northern California",
      "type": "coast",
      "lat": 40.5,
      "lon": -124.5
    },
    {
      "id": "offshore-OFZ001",
      "name": "Offshore Waters",
      "type": "offshore",
      "lat": 35.0,
      "lon": -75.0
    }
  ]
}
```

---

## 🎯 Hazard Types for Coastal/Ocean

- **MARINE** - Marine warnings and watches
- **FLOOD** - Coastal flood warnings
- **WIND** - High wind warnings (coastal)
- **WINTER** - Winter storm warnings (coastal)
- **SEVERE** - Severe weather (coastal areas)

---

## 💾 Storage

### **Normalized Structure**
- **Locations:** Stored once (3,150+ total)
- **Alerts:** Stored once per unique alert
- **Mappings:** Alert → Multiple locations

### **Example**
One marine alert affecting 5 coastal zones:
- Stored as 1 alert record
- Stored as 5 location records (if new)
- Mapped as 1 alert → 5 locations

---

## ⏱️ Update Frequency

- **Real-Time:** Every 30 seconds
- **Historical:** 28-day retention in S3
- **Retention:** Automatic cleanup after 28 days

---

## 🔗 API Endpoints

### **Real-Time Hazards**
```
GET /api/hazards
GET /api/hazards/county/:fips
GET /api/hazards/state/:state
GET /api/hazards/region/:region
```

### **Historical Alerts**
```
GET /api/alerts/history/last?hours=N
GET /api/alerts/history/optimized?date=YYYY-MM-DD
```

### **Documentation**
```
GET /api/docs
```

---

## 📋 Coastal Zones Included

### **Atlantic**
- AMZ (Atlantic Marine Zones)
- ANZ (Atlantic Nearshore Zones)
- OFZ (Offshore Forecast Zones)

### **Gulf**
- GMZ (Gulf Marine Zones)
- GNZ (Gulf Nearshore Zones)

### **Pacific**
- PMZ (Pacific Marine Zones)
- PNZ (Pacific Nearshore Zones)

### **Great Lakes**
- LMZ (Lake Marine Zones)

### **Alaska & Hawaii**
- AKZ (Alaska Zones)
- HWZ (Hawaii Zones)

---

## ✨ Key Features

✅ **Complete Coverage** - All US coasts and offshores
✅ **Real-Time Updates** - Every 30 seconds
✅ **Historical Data** - 28-day retention
✅ **Normalized Storage** - Efficient deduplication
✅ **Multiple Formats** - REST API, GraphQL, S3
✅ **Coordinates** - Latitude/longitude for mapping
✅ **Full Details** - Event, severity, urgency, timestamps

---

## 🚀 Getting Started

1. **Query real-time coastal alerts:**
   ```bash
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?hazardType=MARINE"
   ```

2. **Query historical coastal alerts:**
   ```bash
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
   ```

3. **Get complete documentation:**
   ```bash
   curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs"
   ```

---

## 📞 Summary

**Your system captures:**
- ✅ All US coastal alerts
- ✅ All US offshore alerts
- ✅ All marine warnings
- ✅ All coastal hazards
- ✅ Real-time updates (30 seconds)
- ✅ Historical data (28 days)

**Coverage:** 100% of US coasts and offshore regions
**Locations:** 3,150+ unique locations
**Update Frequency:** Every 30 seconds
**Retention:** 28 days

**Status:** ✅ FULLY OPERATIONAL

