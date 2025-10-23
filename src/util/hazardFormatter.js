const getHazardInfoByEvent = require("./hazardInfoUtil");

/**
 * Formats a single alert into DeckGL-compatible hazard object
 * @param {Object} alert - Alert object from cache
 * @param {Object} location - Location info (county, coast, or offshore)
 * @param {String} locationType - Type of location: 'county', 'coast', or 'offshore'
 * @param {String} state - State code (for counties)
 * @returns {Object} Formatted hazard object
 */
async function formatHazard(alert, location, locationType, state = null) {
  const hazardInfo = await getHazardInfoByEvent(alert.properties.event);

  const hazard = {
    id: alert.id,
    locationId: location.properties.FIPS || location.properties.ID,
    locationType: locationType,
    locationName:
      location.properties.COUNTYNAME ||
      location.properties.NAME ||
      location.properties.Location,
    state: state || location.properties.STATE || null,
    lat: location.properties.LAT,
    lon: location.properties.LON,
    event: alert.properties.event,
    hazardType: hazardInfo.type || "UNKNOWN",
    hazardLevel: hazardInfo.level || "UNKNOWN",
    color: {
      hex: hazardInfo.color_hex || "#CCCCCC",
      rgb: hazardInfo.color_rgb || "204,204,204",
    },
    sent: alert.properties.sent,
    effective: alert.properties.effective,
    onset: alert.properties.onset,
    expires: alert.properties.expires,
    ends: alert.properties.ends,
    headline: alert.properties.headline,
    description: alert.properties.description,
    areaDesc: alert.properties.areaDesc,
    severity: alert.properties.severity,
    certainty: alert.properties.certainty,
    urgency: alert.properties.urgency,
  };

  return hazard;
}

/**
 * Extracts all active hazards from region data
 * @param {Object} regionData - Cached region data
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of formatted hazards
 */
async function extractAllHazards(regionData, filters = {}) {
  const hazards = [];

  if (!regionData) {
    return hazards;
  }

  // Iterate through all regions
  for (const [regionKey, region] of Object.entries(regionData)) {
    // Apply region filter if specified
    if (filters.region && filters.region !== regionKey) {
      continue;
    }

    // Extract county hazards
    for (const [stateKey, state] of Object.entries(region.states)) {
      // Apply state filter if specified
      if (filters.state && filters.state !== state.properties.STATE) {
        continue;
      }

      for (const [countyKey, county] of Object.entries(state.counties)) {
        // Apply county filter if specified
        if (filters.countyFIPS && filters.countyFIPS !== county.properties.FIPS) {
          continue;
        }

        for (const [alertKey, alert] of Object.entries(county.alerts)) {
          const hazard = await formatHazard(
            alert,
            county,
            "county",
            state.properties.STATE
          );

          // Apply hazard type filter if specified
          if (
            filters.hazardType &&
            filters.hazardType !== hazard.hazardType
          ) {
            continue;
          }

          // Apply hazard level filter if specified
          if (
            filters.hazardLevel &&
            filters.hazardLevel !== hazard.hazardLevel
          ) {
            continue;
          }

          hazards.push(hazard);
        }
      }
    }

    // Extract coast hazards
    for (const [coastKey, coast] of Object.entries(region.coasts)) {
      for (const [alertKey, alert] of Object.entries(coast.alerts)) {
        const hazard = await formatHazard(alert, coast, "coast");

        if (
          filters.hazardType &&
          filters.hazardType !== hazard.hazardType
        ) {
          continue;
        }

        if (
          filters.hazardLevel &&
          filters.hazardLevel !== hazard.hazardLevel
        ) {
          continue;
        }

        hazards.push(hazard);
      }
    }

    // Extract offshore hazards
    for (const [offshoreKey, offshore] of Object.entries(region.offshores)) {
      for (const [alertKey, alert] of Object.entries(offshore.alerts)) {
        const hazard = await formatHazard(alert, offshore, "offshore");

        if (
          filters.hazardType &&
          filters.hazardType !== hazard.hazardType
        ) {
          continue;
        }

        if (
          filters.hazardLevel &&
          filters.hazardLevel !== hazard.hazardLevel
        ) {
          continue;
        }

        hazards.push(hazard);
      }
    }
  }

  return hazards;
}

/**
 * Get hazards for a specific county by FIPS code
 * @param {Object} regionData - Cached region data
 * @param {String} fips - County FIPS code
 * @returns {Array} Array of formatted hazards
 */
async function getHazardsByCountyFIPS(regionData, fips) {
  return extractAllHazards(regionData, { countyFIPS: fips });
}

/**
 * Get hazards for a specific state
 * @param {Object} regionData - Cached region data
 * @param {String} state - State code (e.g., 'FL', 'CA')
 * @returns {Array} Array of formatted hazards
 */
async function getHazardsByState(regionData, state) {
  return extractAllHazards(regionData, { state });
}

/**
 * Get hazards for a specific region
 * @param {Object} regionData - Cached region data
 * @param {String} region - Region name (e.g., 'CONUS', 'ALASKA')
 * @returns {Array} Array of formatted hazards
 */
async function getHazardsByRegion(regionData, region) {
  return extractAllHazards(regionData, { region });
}

module.exports = {
  formatHazard,
  extractAllHazards,
  getHazardsByCountyFIPS,
  getHazardsByState,
  getHazardsByRegion,
};

