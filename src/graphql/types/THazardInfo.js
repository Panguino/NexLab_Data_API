const getHazardInfoByEvent = require("../../util/hazardInfoUtil");
async function THazardInfo(event, fields) {
  // Build return object
  const hazardInfoData = await getHazardInfoByEvent(event);
  const hazardInfo = {
    type: await (async () => {
      if ("type" in fields) {
        const THazardTypeInfo = require("./THazardTypeInfo");
        return await THazardTypeInfo(hazardInfoData, fields.type);
      } else {
        return null;
      }
    })(),
    level: await (async () => {
      if ("level" in fields) {
        const THazardLevelInfo = require("./THazardLevelInfo");
        return await THazardLevelInfo(hazardInfoData, fields.level);
      } else {
        return null;
      }
    })(),
    color: await (async () => {
      if ("color" in fields) {
        const THazardColor = require("./THazardColor");
        return await THazardColor(hazardInfoData, fields.color);
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return hazardInfo;
}

module.exports = THazardInfo;
