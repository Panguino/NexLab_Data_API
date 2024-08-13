async function TOffshoreProperties(offshoreProperties, fields) {
  // Build return object
  const offshorePropertiesInfo = {
    ID: await (async () => {
      if ("ID" in fields) {
        return offshoreProperties.ID;
      } else {
        return null;
      }
    })(),
    WFO: await (async () => {
      if ("WFO" in fields) {
        return offshoreProperties.WFO;
      } else {
        return null;
      }
    })(),
    LON: await (async () => {
      if ("LON" in fields) {
        return offshoreProperties.LON;
      } else {
        return null;
      }
    })(),
    LAT: await (async () => {
      if ("LAT" in fields) {
        return offshoreProperties.LAT;
      } else {
        return null;
      }
    })(),
    Location: await (async () => {
      if ("Location" in fields) {
        return offshoreProperties.Location;
      } else {
        return null;
      }
    })(),
    NAME: await (async () => {
      if ("NAME" in fields) {
        return offshoreProperties.Name;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return offshorePropertiesInfo;
}

module.exports = TOffshoreProperties;
