const { getHazardInfoByEvent } = require("../../util/hazardInfoUtil");

async function THazardInfo(event) {
  // Build return object
  const hazardInfoData = await getHazardInfoByEvent(event);
  const hazardInfo = {
    type: await (async () => {
      if ("type" in fields) {
        const THazardTypeInfo = require("./THazardTypeInfo");
        return await THazardTypeInfo(hazardInfoData);
      } else {
        return null;
      }
    })(),
    level: await (async () => {
      if ("level" in fields) {
        const THazardLevelInfo = require("./THazardLevelInfo");
        return await THazardLevelInfo(hazardInfoData);
      } else {
        return null;
      }
    })(),
    color: await (async () => {
      if ("color" in fields) {
        const THazardColor = require("./THazardColor");
        color = "255,0,0";
        return await THazardColor(hazardInfoData);
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return hazardInfo;
}

module.exports = THazardInfo;
