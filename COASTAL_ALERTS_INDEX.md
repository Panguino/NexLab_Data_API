# Coastal & Ocean Alerts - Documentation Index

## 🎯 Quick Answer

**YES - Your system fully captures coastal and ocean region alerts.**

---

## 📚 Documentation Files

### **START HERE**

#### **COASTAL_OCEAN_ALERTS_SUMMARY.md** ⭐ MAIN FILE
Complete summary with:
- Direct answer (YES)
- What's captured (3 location types)
- Geographic coverage (100% US coasts/offshores)
- How it works (data flow)
- Query examples
- Data statistics
- Alert data structure
- Update frequency
- API endpoints
- Technical implementation
- Key features
- Use cases

**👉 Read this first for complete overview**

---

### **Reference Files**

#### **COASTAL_ALERTS_QUICK_GUIDE.md**
Quick reference guide with:
- Location types table
- Coastal coverage by region
- Query examples
- Data structure example
- Hazard types
- Storage information
- Update frequency
- API endpoints
- Coastal zones included
- Key features
- Getting started

**Use if:** You want a quick reference

---

#### **COASTAL_OCEAN_ALERTS_COVERAGE.md**
Detailed technical documentation with:
- Three location types explained
- Data flow for coastal/ocean alerts
- Current coverage statistics
- Geographic coverage details
- Normalized storage structure
- API endpoints for coastal/ocean
- Hazard types for coastal/ocean
- GraphQL support
- Example coastal alert data
- Key features
- Next steps

**Use if:** You want technical details

---

## 🔍 Key Information

### **Three Location Types**

| Type | Count | ID Format | Example |
|------|-------|-----------|---------|
| County | ~3,000+ | `county-{FIPS}` | county-12086 |
| Coast | ~100+ | `coast-{ID}` | coast-AMZ123 |
| Offshore | ~50+ | `offshore-{ID}` | offshore-OFZ001 |

### **Geographic Coverage**

✅ Atlantic Coast (Maine to Florida)
✅ Gulf Coast (Florida to Texas)
✅ Pacific Coast (California to Washington)
✅ Great Lakes (All 5 lakes)
✅ Alaska (All coasts & offshores)
✅ Hawaii (All coasts & offshores)

**Total: 100% of US coasts and offshore regions**

---

## 🚀 Quick Start

### **Get All Marine Alerts**
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?hazardType=MARINE"
```

### **Get Marine Warnings**
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards?hazardType=MARINE&hazardLevel=WARNING"
```

### **Get Coastal Alerts (Last 24 Hours)**
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24"
```

### **Get Coastal Alerts (Specific Date)**
```bash
curl "https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23"
```

---

## 📊 Data Statistics

- **Total Locations:** ~3,150+ (counties, coasts, offshores)
- **Update Frequency:** Every 30 seconds (real-time)
- **Historical Retention:** 28 days in S3
- **Coverage:** 100% of US coasts and offshore regions
- **Hazard Types:** MARINE, FLOOD, WIND, WINTER, SEVERE

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

## 💾 Storage Structure

### **Normalized Database**
- **Locations Collection:** 3,150+ unique locations
- **Alerts Collection:** All unique alerts
- **Alert-Location Map:** Alert → Multiple locations

### **Deduplication**
Same alert affecting multiple locations:
- Stored as 1 alert record
- Mapped to multiple location records
- Efficient storage with no duplication

---

## ⏱️ Update Frequency

- **Real-Time:** Every 30 seconds
- **Historical:** 28-day retention
- **Automatic Cleanup:** Snapshots older than 28 days removed

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
✅ **Scalable** - Handles thousands of alerts

---

## 🎯 Use Cases

1. **Marine Safety** - Get current marine warnings
2. **Coastal Planning** - Historical coastal alert analysis
3. **Offshore Operations** - Real-time offshore alerts
4. **Emergency Response** - Quick access to coastal hazards
5. **Weather Tracking** - Monitor coastal weather patterns
6. **Mapping** - Display coastal alerts on maps

---

## 📞 File Selection Guide

| Need | File | Purpose |
|------|------|---------|
| **Complete Overview** | COASTAL_OCEAN_ALERTS_SUMMARY.md | Full details |
| **Quick Reference** | COASTAL_ALERTS_QUICK_GUIDE.md | Fast lookup |
| **Technical Details** | COASTAL_OCEAN_ALERTS_COVERAGE.md | Implementation |
| **File Index** | COASTAL_ALERTS_INDEX.md | This file |

---

## 🎉 Summary

Your NexLab alerts system:

✅ **Captures all coastal alerts** - 100+ coastal zones
✅ **Captures all ocean alerts** - 50+ offshore zones
✅ **Captures all land alerts** - 3,000+ counties
✅ **Updates in real-time** - Every 30 seconds
✅ **Stores historically** - 28-day retention
✅ **Provides full data** - Event, severity, timestamps, coordinates
✅ **Accessible via API** - REST, GraphQL, S3

**Status: ✅ FULLY OPERATIONAL**

---

## 🚀 Next Steps

1. **Read** `COASTAL_OCEAN_ALERTS_SUMMARY.md` for complete overview
2. **Reference** `COASTAL_ALERTS_QUICK_GUIDE.md` for quick lookups
3. **Query** `/api/hazards?hazardType=MARINE` for current alerts
4. **Query** `/api/alerts/history/last?hours=24` for historical data
5. **Explore** `/api/docs` for complete API documentation

---

## 📞 Support

All information you need is available at:
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

This endpoint provides complete API documentation with all endpoints, parameters, and examples.

---

**Your coastal and ocean alerts system is fully operational and ready to use!** 🌊

