# Share This With Augment Code

## 🎯 The Simplest Way to Share

Copy and paste this entire section to Augment Code:

---

## 📚 NexLab Weather Alerts API

I have a weather alerts API you can use. Here's everything you need to know:

### **Documentation Endpoint**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

This endpoint returns complete API documentation in JSON format with all endpoints, parameters, data structure, and examples.

### **Real-Time Hazards**
```
GET https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/hazards
```
- Updated every 30 seconds
- Query parameters: region, state, hazardType, hazardLevel
- Examples:
  - `/api/hazards` - Get all hazards
  - `/api/hazards?region=CONUS&hazardType=TORNADO` - Get tornado warnings
  - `/api/hazards/state/FL` - Get Florida hazards
  - `/api/hazards/county/12086` - Get county hazards

### **Historical Alerts**
```
GET https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/last?hours=24
GET https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/alerts/history/optimized?date=2025-10-23
```
- Stored in S3 with 28-day retention
- Query parameters: hours (1-720), date (YYYY-MM-DD), region
- Examples:
  - `/api/alerts/history/last?hours=24` - Last 24 hours
  - `/api/alerts/history/last?hours=168` - Last 7 days
  - `/api/alerts/history/optimized?date=2025-10-23` - Specific date

### **Available Filters**
- **Regions:** CONUS, ALASKA, HAWAII
- **States:** All 50 US states (AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY)
- **Hazard Types:** TORNADO, SEVERE, FIRE, WINTER, MARINE, FLOOD, WIND, HEAT, COLD, FROST, FREEZE
- **Hazard Levels:** WARNING, WATCH, ADVISORY, STATEMENT

### **Alert Data Structure**
Each alert contains:
- `id` - Unique identifier
- `event` - Type of weather event
- `headline` - Short headline
- `description` - Detailed description
- `severity` - Extreme, Severe, Moderate, Minor
- `urgency` - Immediate, Expected, Future, Past
- `certainty` - Observed, Likely, Possible
- `areaDesc` - Affected area description
- `sent`, `effective`, `onset`, `expires`, `ends` - ISO 8601 UTC timestamps
- `locations` - Array of affected locations with id, name, type, state, lat, lon

### **Important Notes**
- All timestamps are in UTC (ISO 8601 format)
- Each alert can affect multiple locations
- Real-time data updated every 30 seconds
- Historical data stored in S3 with 28-day retention
- Maximum 720 hours (30 days) for historical queries
- Region filtering is optional but recommended for performance

### **Quick Examples**
```
Get all tornado warnings:
/api/hazards?hazardType=TORNADO&hazardLevel=WARNING

Get marine warnings in CONUS:
/api/hazards?region=CONUS&hazardType=MARINE&hazardLevel=WARNING

Get all hazards in Florida:
/api/hazards/state/FL

Get alerts from last 24 hours:
/api/alerts/history/last?hours=24

Get alerts from last 7 days:
/api/alerts/history/last?hours=168

Get alerts for specific date:
/api/alerts/history/optimized?date=2025-10-23
```

### **Base URL**
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com
```

---

## 🚀 What You Can Do

With this API, you can:
- ✅ Get current active weather hazards
- ✅ Filter by region, state, hazard type, or level
- ✅ Get historical alert data
- ✅ Query by date or time range
- ✅ Access complete alert information with locations
- ✅ Track alert changes over time

---

## 📖 Complete Documentation

For complete API documentation with all endpoints, parameters, and examples:
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com/api/docs
```

This endpoint returns the full API schema in JSON format.

---

## 💡 Use Cases

1. **Get current tornado warnings:** `/api/hazards?hazardType=TORNADO&hazardLevel=WARNING`
2. **Get all hazards for a county:** `/api/hazards/county/12086`
3. **Get alerts from last 24 hours:** `/api/alerts/history/last?hours=24`
4. **Get alerts for a specific date:** `/api/alerts/history/optimized?date=2025-10-23`
5. **Get marine warnings in CONUS:** `/api/hazards?region=CONUS&hazardType=MARINE&hazardLevel=WARNING`

---

## ✨ That's It!

You now have access to:
- Real-time weather hazards (updated every 30 seconds)
- Historical alert data (28-day retention)
- Complete API documentation
- All filtering options
- Full data structure

Start using the API at:
```
https://api-data-nexlab-staging-1108a5c77b75.herokuapp.com
```

---

## 📚 Files Available

I've also created these reference files for you:
- `AUGMENT_CODE_INTEGRATION.md` - Comprehensive integration guide
- `AUGMENT_QUICK_REFERENCE.txt` - Quick reference card
- `COPY_PASTE_FOR_AUGMENT.txt` - Copy-paste text
- `AUGMENT_INTEGRATION_SUMMARY.md` - Complete summary

---


