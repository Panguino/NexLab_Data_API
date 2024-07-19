async function THazardLevelInfo({ level, level_name }) {
  // Build return object
  const hazardLevel = {
    name: await (async () => {
      if ("name" in fields) {
        return level_name;
      } else {
        return null;
      }
    })(),
    level: await (async () => {
      if ("level" in fields) {
        return level;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return hazardLevel;
}

module.exports = THazardLevelInfo;
