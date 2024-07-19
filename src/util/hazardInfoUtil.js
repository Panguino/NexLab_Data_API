const HAZARD_LEVEL_WARNING_ID = "WARNING";
const HAZARD_LEVEL_WATCH_ID = "WATCH";
const HAZARD_LEVEL_ADVISORY_ID = "ADVISORY";
const HAZARD_LEVEL_STATEMENT_ID = "STATEMENT";
const HAZARD_LEVEL_UNKNOWN_ID = "UNKNOWN";
const HAZARD_LEVELS = [
  HAZARD_LEVEL_WARNING_ID,
  HAZARD_LEVEL_WATCH_ID,
  HAZARD_LEVEL_ADVISORY_ID,
  HAZARD_LEVEL_STATEMENT_ID,
];

const HAZARD_TYPE_TORNADO_ID = "TORNADO";
const HAZARD_TYPE_SEVERE_ID = "SEVERE";
const HAZARD_TYPE_FIRE_ID = "FIRE";
const HAZARD_TYPE_HYDROLOGICAL_ID = "HYDROLOGICAL";
const HAZARD_TYPE_MARINE_ID = "MARINE";
const HAZARD_TYPE_NONMET_ID = "NONMET";
const HAZARD_TYPE_NONPRECIP_ID = "NONPRECIP";
const HAZARD_TYPE_TROPICAL_ID = "TROPICAL";
const HAZARD_TYPE_WINTER_ID = "WINTER";
const HAZARD_TYPE_SPECIALWX_ID = "SPECIALWX";
const HAZARD_TYPE_UNKNOWN_ID = "UNKNOWN";
const HAZARD_TYPES = [
  HAZARD_TYPE_TORNADO_ID,
  HAZARD_TYPE_SEVERE_ID,
  HAZARD_TYPE_FIRE_ID,
  HAZARD_TYPE_HYDROLOGICAL_ID,
  HAZARD_TYPE_MARINE_ID,
  HAZARD_TYPE_NONMET_ID,
  HAZARD_TYPE_NONPRECIP_ID,
  HAZARD_TYPE_TROPICAL_ID,
  HAZARD_TYPE_WINTER_ID,
  HAZARD_TYPE_SPECIALWX_ID,
  HAZARD_TYPE_UNKNOWN_ID,
];
const HAZARD_LEVEL_NAMES = {
  [HAZARD_LEVEL_WARNING_ID]: "Warning",
  [HAZARD_LEVEL_WATCH_ID]: "Watch",
  [HAZARD_LEVEL_ADVISORY_ID]: "Advisory",
  [HAZARD_LEVEL_STATEMENT_ID]: "Statement",
  [HAZARD_LEVEL_UNKNOWN_ID]: "Unknown",
};
const HAZARD_TYPE_NAMES = {
  [HAZARD_TYPE_TORNADO_ID]: "Tornado",
  [HAZARD_TYPE_SEVERE_ID]: "Severe",
  [HAZARD_TYPE_FIRE_ID]: "Fire",
  [HAZARD_TYPE_HYDROLOGICAL_ID]: "Hydro",
  [HAZARD_TYPE_MARINE_ID]: "Marine",
  [HAZARD_TYPE_NONMET_ID]: "Non-Met",
  [HAZARD_TYPE_NONPRECIP_ID]: "Non-Precip",
  [HAZARD_TYPE_TROPICAL_ID]: "Tropical",
  [HAZARD_TYPE_WINTER_ID]: "Winter",
  [HAZARD_TYPE_SPECIALWX_ID]: "Special",
  [HAZARD_TYPE_UNKNOWN_ID]: "Unknown",
};

const HAZARD_COLORS = {
  [HAZARD_TYPE_TORNADO_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "255,0,0",
    [HAZARD_LEVEL_WATCH_ID]: "255,100,100",
  },
  [HAZARD_TYPE_SEVERE_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "0,100,225",
    [HAZARD_LEVEL_WATCH_ID]: "50,150,255",
  },
  [HAZARD_TYPE_FIRE_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "255,110,0",
    [HAZARD_LEVEL_ADVISORY_ID]: "232,100,0",
    [HAZARD_LEVEL_WATCH_ID]: "209,91,0",
    [HAZARD_LEVEL_STATEMENT_ID]: "186,81,0",
  },
  [HAZARD_TYPE_HYDROLOGICAL_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "66,230,66",
    [HAZARD_LEVEL_ADVISORY_ID]: "33,215,33",
    [HAZARD_LEVEL_WATCH_ID]: "0,180,0",
    [HAZARD_LEVEL_STATEMENT_ID]: "15,150,15",
  },
  [HAZARD_TYPE_MARINE_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "115,225,235",
    [HAZARD_LEVEL_ADVISORY_ID]: "96,185,193",
    [HAZARD_LEVEL_WATCH_ID]: "74,144,150",
    [HAZARD_LEVEL_STATEMENT_ID]: "53,103,107",
  },
  [HAZARD_TYPE_NONMET_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "222,214,187",
    [HAZARD_LEVEL_ADVISORY_ID]: "203,199,171",
    [HAZARD_LEVEL_WATCH_ID]: "183,181,154",
    [HAZARD_LEVEL_STATEMENT_ID]: "163,161,137",
  },
  [HAZARD_TYPE_NONPRECIP_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "225,175,115",
    [HAZARD_LEVEL_ADVISORY_ID]: "185,144,95",
    [HAZARD_LEVEL_WATCH_ID]: "144,112,74",
    [HAZARD_LEVEL_STATEMENT_ID]: "123,96,63",
  },
  [HAZARD_TYPE_TROPICAL_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "230,225,15",
    [HAZARD_LEVEL_ADVISORY_ID]: "213,208,0",
    [HAZARD_LEVEL_WATCH_ID]: "180,176,0",
    [HAZARD_LEVEL_STATEMENT_ID]: "150,146,0",
  },
  [HAZARD_TYPE_WINTER_ID]: {
    [HAZARD_LEVEL_WARNING_ID]: "222,112,236",
    [HAZARD_LEVEL_ADVISORY_ID]: "165,75,180",
    [HAZARD_LEVEL_WATCH_ID]: "135,55,160",
    [HAZARD_LEVEL_STATEMENT_ID]: "130,0,145",
  },
  [HAZARD_TYPE_SPECIALWX_ID]: {
    [HAZARD_LEVEL_STATEMENT_ID]: "150,150,150",
  },
  [HAZARD_TYPE_UNKNOWN_ID]: {
    [HAZARD_LEVEL_UNKNOWN_ID]: "255,255,255",
  },
};

export const getHazardInfoByEvent = async (alertName) => {
  const alertclass = {
    /* CONVECTIVE */
    "Tornado Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TORNADO_ID,
    },
    "Severe Thunderstorm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_SEVERE_ID,
    },
    "Severe Weather Statement": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_SEVERE_ID,
    },
    "Tornado Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TORNADO_ID,
    },
    "Severe Thunderstorm Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_SEVERE_ID,
    },

    /* MARINE */
    "Tsunami Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Special Marine Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Storm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Tsunami Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Tsunami Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "High Surf Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Gale Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Storm Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Lakeshore Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Coastal Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "High Surf Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Heavy Freezing Spray Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Small Craft Advisory for Hazardous Seas": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Small Craft Advisory for Rough Bar": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Small Craft Advisory for Winds": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Small Craft Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Brisk Wind Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Hazardous Seas Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Lake Wind Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Freezing Spray Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Low Water Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Rip Current Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Beach Hazards Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Gale Watch": { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
    "Hazardous Seas Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Heavy Freezing Spray Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Coastal Flood Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Lakeshore Flood Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Coastal Flood Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Lakeshore Flood Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },
    "Marine Weather Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_MARINE_ID,
    },

    /* FIRE */
    "Fire Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_FIRE_ID,
    },
    "Red Flag Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_FIRE_ID,
    },
    "Fire Weather Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_FIRE_ID,
    },
    "Extreme Fire Danger": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_FIRE_ID,
    },

    /* WINTER */
    "Blizzard Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Snow Squall Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Ice Storm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Winter Storm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Lake Effect Snow Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Wind Chill Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Extreme Cold Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Hard Freeze Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Freeze Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Freezing Rain Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Winter Weather Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Lake Effect Snow Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Wind Chill Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Frost Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Freezing Fog Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Blizzard Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Winter Storm Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Extreme Cold Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Wind Chill Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Lake Effect Snow Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Hard Freeze Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },
    "Freeze Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_WINTER_ID,
    },

    /* TROPCIAL */
    "Storm Surge Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Hurricane Force Wind Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Hurricane Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Typhoon Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Tropical Storm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Storm Surge Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Hurricane Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Hurricane Force Wind Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Typhoon Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Tropical Storm Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Hurricane Local Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Typhoon Local Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Tropical Storm Local Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Tropical Depression Local Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },
    "Tropical Cyclone Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_TROPICAL_ID,
    },

    /* HYDROLOGICAL */
    "Flash Flood Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flash Flood Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Coastal Flood Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Lakeshore Flood Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flood Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flash Flood Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flood Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Urban And Small Stream Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Small Stream Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Arroyo And Small Stream Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flood Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Hydrologic Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Flood Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },
    "Hydrologic Outlook": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_HYDROLOGICAL_ID,
    },

    /* NON-PRECIP */
    "Extreme Wind Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "High Wind Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Dust Storm Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Blowing Dust Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Excessive Heat Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Heat Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Dense Fog Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Dense Smoke Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Dust Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Blowing Dust Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Wind Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "High Wind Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },
    "Excessive Heat Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_NONPRECIP_ID,
    },

    /* NON-METEOROLOGICAL */
    "Civil Danger Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Nuclear Power Plant Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Radiological Hazard Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Hazardous Materials Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Civil Emergency Message": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Law Enforcement Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Avalanche Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Earthquake Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Volcano Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Ashfall Warning": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Avalanche Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Ashfall Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Local Area Emergency": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Child Abduction Emergency": {
      level: HAZARD_LEVEL_WARNING_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Avalanche Watch": {
      level: HAZARD_LEVEL_WATCH_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "911 Telephone Outage": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Air Quality Alert": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },
    "Air Stagnation Advisory": {
      level: HAZARD_LEVEL_ADVISORY_ID,
      type: HAZARD_TYPE_NONMET_ID,
    },

    /* SPECIAL CASES */
    "Special Weather Statement": {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_SPECIALWX_ID,
    },

    /* DEFAULT */
    default: {
      level: HAZARD_LEVEL_STATEMENT_ID,
      type: HAZARD_TYPE_SPECIALWX_ID,
    },
    // known occurances
    // Hydrologic Outlook - fcst - likely to be filtered out
  };

  if (alertclass[alertName]) {
    console.log(`Unknown Alert: ${alertName}`);
    return {};
  } else {
    const color =
      HAZARD_COLORS[alertclass[alertName].type][alertclass[alertName].level];
    return {
      type: alertclass[alertName].type,
      type_name: HAZARD_TYPE_NAMES[alertclass[alertName].type],
      level: alertclass[alertName].level,
      level_name: HAZARD_LEVEL_NAMES[alertclass[alertName].level],
      color_rgb: color,
      color_hex: rgbToHex(
        color.split(",")[0],
        color.split(",")[1],
        color.split(",")[2]
      ),
    };
  }
};

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
