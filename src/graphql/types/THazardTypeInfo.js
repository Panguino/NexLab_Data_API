async function THazardTypeInfo({ type, type_name }) {
  // Build return object
  const hazardType = {
    name: await (async () => {
      if ("name" in fields) {
        return type_name;
      } else {
        return null;
      }
    })(),
    type: await (async () => {
      if ("type" in fields) {
        return type;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return hazardType;
}

module.exports = THazardTypeInfo;
