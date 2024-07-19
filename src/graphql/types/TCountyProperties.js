async function TCountyProperties(countyProperties, fields) {
  // Build return object
  const countyPropertiesInfo = {
    ID: await (async () => {
      if ("FIPS" in fields) {
        return countyProperties.FIPS;
      } else {
        return null;
      }
    })(),
    STATE: await (async () => {
      if ("STATE" in fields) {
        return countyProperties.STATE;
      } else {
        return null;
      }
    })(),
    CWA: await (async () => {
      if ("CWA" in fields) {
        return countyProperties.CWA;
      } else {
        return null;
      }
    })(),
    COUNTYNAME: await (async () => {
      if ("COUNTYNAME" in fields) {
        return countyProperties.COUNTYNAME;
      } else {
        return null;
      }
    })(),
    FIPS: await (async () => {
      if ("FIPS" in fields) {
        return countyProperties.FIPS;
      } else {
        return null;
      }
    })(),
    TIME_ZONE: await (async () => {
      if ("TIME_ZONE" in fields) {
        return countyProperties.TIME_ZONE;
      } else {
        return null;
      }
    })(),
    FE_AREA: await (async () => {
      if ("FE_AREA" in fields) {
        return countyProperties.FE_AREA;
      } else {
        return null;
      }
    })(),
    LON: await (async () => {
      if ("LON" in fields) {
        return countyProperties.LON;
      } else {
        return null;
      }
    })(),
    LAT: await (async () => {
      if ("LAT" in fields) {
        return countyProperties.LAT;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return countyPropertiesInfo;
}

module.exports = TCountyProperties;
