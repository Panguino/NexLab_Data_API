const { feature } = require("topojson-client");
const {
  multiPolygon,
  polygon,
  simplify,
  kinks,
  rewind,
} = require("@turf/turf");
const axios = require("axios");

function cachingResult(success, message) {
  return {
    success: success,
    message: message,
  };
}

async function cacheRegionData(cache) {
  // Define Regions
  const REGIONS = {
    CONUS: {
      name: "Continental United States",
      bounds: [
        {
          N: 52.02331008491122,
          S: 21.332413503135466,
          E: -59.793669287999734,
          W: -134.9037846114994,
        },
      ],
    },
    CANADA: {
      name: "Canada",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    ALASKA: {
      name: "Alaska",
      bounds: [
        {
          N: 75,
          S: 49,
          E: -128.65084365375589,
          W: -180,
        },
        {
          N: 75,
          S: 49,
          E: 180,
          W: 170.00389637915683,
        },
      ],
    },
    HAWAII: {
      name: "Hawaii",
      bounds: [
        {
          N: 26.896294325107885,
          S: 14.639684806688997,
          E: -149.9758245405501,
          W: -164.9797096888613,
        },
      ],
    },
    PUERTO_RICO: {
      name: "Puerto Rico",
      bounds: [
        {
          N: 20.332413503135466,
          S: 15.947641065447575,
          E: -60.77162723097216,
          W: -71.03669318351179,
        },
      ],
    },
    GUAM: {
      name: "Guam",
      bounds: [
        {
          N: 23.964138843347023,
          S: 3.7283673499396666,
          E: 173.85560189597825,
          W: 131.62244511353302,
        },
      ],
    },
    AMERICAN_SAMOA: {
      name: "American Samoa",
      bounds: [
        {
          N: -9.82702519137894,
          S: -15.206128215457086,
          E: -168.11074635338161,
          W: -172.26436826879046,
        },
      ],
    },
    PANAMA: {
      name: "Panama",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    MEXICO: {
      name: "Mexico",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    CUBA: {
      name: "Cuba",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    GUATEMALA: {
      name: "Guatemala",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    BELIZE: {
      name: "Belize",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    HONDURAS: {
      name: "Honduras",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    EL_SALVADOR: {
      name: "El Salvador",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    DOMINICAN_REPUBLIC: {
      name: "Dominican Republic",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    HAITI: {
      name: "Haiti",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    JAMAICA: {
      name: "Jamaica",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    BAHAMAS: {
      name: "Bahamas",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    NICARAGUA: {
      name: "Nicaragua",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
    COSTA_RICA: {
      name: "Costa Rica",
      bounds: [
        {
          N: 0,
          S: 0,
          E: 0,
          W: 0,
        },
      ],
    },
  };

  // Create states, coasts and offshore arrays for each region
  for (let region in REGIONS) {
    REGIONS[region].states = {};
    REGIONS[region].coasts = {};
    REGIONS[region].offshores = {};
  }

  // State To Region Assigning Function
  function getRegionByState(state) {
    targetRegion = null;
    switch (state) {
      case "AK":
        targetRegion = REGIONS["ALASKA"];
        break;
      case "HI":
        targetRegion = REGIONS["HAWAII"];
        break;
      case "PR":
        targetRegion = REGIONS["PUERTO_RICO"];
        break;
      case "GU":
        targetRegion = REGIONS["GUAM"];
        break;
      case "AS":
        targetRegion = REGIONS["AMERICAN_SAMOA"];
        break;
      default:
        targetRegion = REGIONS["CONUS"];
        break;
    }
    return targetRegion;
  }

  // Canada Province Naming Function
  function getProvinceNameByAlphaCode(alphaCode) {
    switch (alphaCode) {
      case "AB":
        return "Alberta";
      case "BC":
        return "British Columbia";
      case "MB":
        return "Manitoba";
      case "NB":
        return "New Brunswick";
      case "NL":
        return "Newfoundland and Labrador";
      case "NS":
        return "Nova Scotia";
      case "NT":
        return "Northwest Territories";
      case "NU":
        return "Nunavut";
      case "ON":
        return "Ontario";
      case "PE":
        return "Prince Edward Island";
      case "QC":
        return "Quebec";
      case "SK":
        return "Saskatchewan";
      case "YT":
        return "Yukon";
      default:
        return null;
    }
  }

  // Coast & Offshore To Region Assigning Function
  function getRegionByCoastOrOffshore(lat, lon) {
    for (const regionName in REGIONS) {
      const region = REGIONS[regionName];
      for (let bound of region.bounds) {
        const { N, S, E, W } = bound;
        if (lat <= N && lat >= S && lon <= E && lon >= W) {
          return region;
        }
      }
    }
    return null;
  }

  // Simplify Geometry Function
  function simplifyGeoJson(geoJson, tolerance = 0.001, debug = false) {
    const simplifiedGeoJson = geoJson.features.map((feature) => {
      if (feature.geometry) {
        feature = rewind(feature);
      }
      if (debug) {
        console.log("feature", feature);
      }
      if (feature.geometry?.type === "Polygon") {
        if (feature.geometry.coordinates[0].length <= 4) {
          return feature;
        }
        const simplifiedPolygon = simplify(
          polygon(feature.geometry.coordinates),
          { tolerance, highQuality: true }
        );
        return { ...simplifiedPolygon, properties: feature.properties };
      } else if (feature.geometry?.type === "MultiPolygon") {
        const multiPolygonShape = multiPolygon(feature.geometry.coordinates);
        if (kinks(multiPolygonShape).features.length > 0) {
          if (debug) {
            console.warn(
              "Invalid multipolygon detected, skipping simplification"
            );
          }
          return feature;
        }
        const simplifiedMultiPolygon = simplify(multiPolygonShape, {
          tolerance,
          highQuality: true,
        });
        return { ...simplifiedMultiPolygon, properties: feature.properties };
      }
    });

    return {
      type: "FeatureCollection",
      features: simplifiedGeoJson.filter((feature) => feature !== undefined),
    };
  }

  // Fetch Canada provinces
  let canadaData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/canada.json"
    );
    canadaData = simplifyGeoJson(
      feature(response.data, response.data.objects.collection)
    );
  } catch (error) {
    return cachingResult(false, error);
  }

  // Modify canada provinces and assign to canada
  for (let province of canadaData.features) {
    const provinceWithName = province;
    provinceWithName.properties.ALPHA_CODE = province.properties.NAME;
    provinceWithName.properties.NAME = getProvinceNameByAlphaCode(
      province.properties.NAME
    );
    REGIONS["CANADA"].states[provinceWithName.properties.ALPHA_CODE] = {
      ...provinceWithName,
      counties: [],
    };
  }

  // Fetch Mexico & Others
  let mexicoAndOthersData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/mexi-cuba.json"
    );
    mexicoAndOthersData = simplifyGeoJson(
      feature(response.data, response.data.objects.collection)
    );
  } catch (error) {
    return cachingResult(false, error);
  }

  // Normalize Mexico & Other states and assign to region
  for (let state of mexicoAndOthersData.features) {
    targetRegionName = null;
    switch (state.properties.name) {
      case "Panama":
        targetRegionName = "PANAMA";
        break;
      case "Mexico":
        targetRegionName = "MEXICO";
        break;
      case "Cuba":
        targetRegionName = "CUBA";
        break;
      case "Guatemala":
        targetRegionName = "GUATEMALA";
        break;
      case "Belize":
        targetRegionName = "BELIZE";
        break;
      case "Honduras":
        targetRegionName = "HONDURAS";
        break;
      case "El Salvador":
        targetRegionName = "EL_SALVADOR";
        break;
      case "Dominican Rep.":
        targetRegionName = "DOMINICAN_REPUBLIC";
        break;
      case "Haiti":
        targetRegionName = "HAITI";
        break;
      case "Jamaica":
        targetRegionName = "JAMAICA";
        break;
      case "Bahamas":
        targetRegionName = "BAHAMAS";
        break;
      case "Nicaragua":
        targetRegionName = "NICARAGUA";
        break;
      case "Costa Rica":
        targetRegionName = "COSTA_RICA";
        break;
      default:
        targetRegionName = null;
        break;
    }
    if (!targetRegionName) {
      continue;
    }
    REGIONS[targetRegionName].states[targetRegionName] = {
      ...state,
      counties: {},
    };
  }

  // Fetch US states
  let stateData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/us-states-nws.json"
    );
    stateData = simplifyGeoJson(
      feature(response.data, response.data.objects.states)
    );
  } catch (error) {
    return cachingResult(false, error);
  }

  // Assign states to regions
  for (let state of stateData.features) {
    if (
      state.properties.STATE in getRegionByState(state.properties.STATE).states
    ) {
      console.log(`Duplicate state found: ${state.properties.STATE}`);
      continue;
    }
    getRegionByState(state.properties.STATE).states[state.properties.STATE] = {
      ...state,
      counties: {},
    };
  }

  // Fetch counties
  let countyData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/us-counties-nws.json"
    );
    countyData = simplifyGeoJson(
      feature(response.data, response.data.objects.counties)
    );
  } catch (error) {
    return cachingResult(false, error);
  }

  // Assign counties to states
  for (let county of countyData.features) {
    const state = county.properties.STATE;
    const countyFIPS = county.properties.FIPS;
    getRegionByState(state).states[county.properties.STATE].counties[
      countyFIPS
    ] = {
      ...county,
      alerts: {},
    };
  }

  // Fetch coasts
  let coastData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/coastal.json"
    );
    coastData = simplifyGeoJson(response.data);
  } catch (error) {
    return cachingResult(false, error);
  }

  // Assign coasts to regions
  for (let coast of coastData.features) {
    const region = getRegionByCoastOrOffshore(
      coast.properties.LAT,
      coast.properties.LON
    );
    if (!region) {
      //console.log('No region found for coast:', coast.properties.ID, coast.properties.NAME)
      continue;
    }
    region.coasts[coast.properties.ID] = {
      ...coast,
      alerts: {},
    };
  }

  // for (let region in REGIONS){
  //     console.log(`===== ${region} =====`)
  //     for (let coast in REGIONS[region].coasts){
  //         console.log(`ID: ${coast} | Name: ${REGIONS[region].coasts[coast].properties.NAME}`)
  //     }
  // }
  // return

  // Fetch offshores
  let offshoreData = null;
  try {
    const response = await axios.get(
      "https://weather.cod.edu/text/exper/assets/json/old/offshore.json"
    );
    offshoreData = simplifyGeoJson(response.data);
  } catch (error) {
    return cachingResult(false, error);
  }

  // Assign offshores to regions
  for (let offshore of offshoreData.features) {
    const region = getRegionByCoastOrOffshore(
      offshore.properties.LAT,
      offshore.properties.LON
    );
    if (!region) {
      //console.log('No region found for offshore:', offshore.properties.ID, offshore.properties.Name)
      continue;
    }
    region.offshores[offshore.properties.ID] = {
      ...offshore,
      alerts: {},
    };
  }

  // for (let region in REGIONS){
  //     console.log(`===== ${region} =====`)
  //     for (let offshore in REGIONS[region].offshores){
  //         console.log(`ID: ${offshore} | Name: ${REGIONS[region].offshores[offshore].properties.Name}`)
  //     }
  // }
  //return

  // Fetch weather alerts
  let hazardData = null;
  try {
    const response = await axios.get(
      "https://climate.cod.edu/data/text/alerts.json"
    );
    hazardData = response.data;
  } catch (error) {
    return cachingResult(false, error);
  }

  // for (let hazard of hazardData.features){
  //     console.log(hazard.properties.event)
  //     console.log(getAlertIdByEvent(hazard.properties.event))
  //     break
  // }

  // return

  // Assign alerts to counties, coasts and offshores
  for (let [currentRegionKey, currentRegion] of Object.entries(REGIONS)) {
    // Assign to counties
    for (let [currentStateKey, currentState] of Object.entries(
      currentRegion.states
    )) {
      for (let [currentCountyKey, currentCounty] of Object.entries(
        currentState.counties
      )) {
        for (let currentHazard of hazardData.features) {
          if ("SAME" in currentHazard.properties.geocode === false) {
            continue;
          }
          for (let currentSAMECode of currentHazard.properties.geocode.SAME) {
            const sliceSAMECode = currentSAMECode.slice(1);
            if (currentCounty.properties.FIPS === sliceSAMECode) {
              currentCounty.alerts[currentHazard.id] = currentHazard;
            }
          }
        }
      }
    }
    // Assign to coasts
    for (let [currentCoastKey, currentCoast] of Object.entries(
      currentRegion.coasts
    )) {
      for (let currentHazard of hazardData.features) {
        if ("UGC" in currentHazard.properties.geocode === false) {
          continue;
        }
        for (let currentUGCCode of currentHazard.properties.geocode.UGC) {
          if (currentCoast.properties.ID === currentUGCCode) {
            currentCoast.alerts[currentHazard.id] = currentHazard;
          }
        }
      }
    }
    // Assign to offshores
    for (let [currentOffshoreKey, currentOffshore] of Object.entries(
      currentRegion.offshores
    )) {
      for (let currentHazard of hazardData.features) {
        if ("UGC" in currentHazard.properties.geocode === false) {
          continue;
        }
        for (let currentUGCCode of currentHazard.properties.geocode.UGC) {
          if (currentOffshore.properties.ID === currentUGCCode) {
            currentOffshore.alerts[currentHazard.id] = currentHazard;
          }
        }
      }
    }
  }

  // for (let [currentStateKey, currentState] of Object.entries(REGIONS['GUAM'].states)){
  //     console.log('===== COUNTIES =====')
  //     for (let [currentCountyKey, currentCounty] of Object.entries(currentState.counties)){
  //         for (let currentAlert of currentCounty.alerts){
  //             console.log(currentAlert.id)
  //         }
  //     }
  //     console.log('===== COASTS =====')
  //     for (let [currentCoastKey, currentCoast] of Object.entries(REGIONS['GUAM'].coasts)){
  //         for (let currentAlert of currentCoast.alerts){
  //             console.log(currentAlert.id)
  //         }
  //     }
  //     console.log('===== OFFSHORES =====')
  //     for (let [currentOffshoreKey, currentOffshore] of Object.entries(REGIONS['GUAM'].offshores)){
  //         for (let currentAlert of currentOffshore.alerts){
  //             console.log(currentAlert.id)
  //         }
  //     }
  // }
  // return

  cache.set("regionData", REGIONS);
  console.log("Region data updated...");
  return cachingResult(true, "OK");
}

module.exports = cacheRegionData;
