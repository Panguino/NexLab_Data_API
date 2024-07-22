async function TRGB(r, g, b) {
  // Build return object
  const rgb = {
    R: await (async () => {
      if ("R" in fields) {
        return r;
      } else {
        return null;
      }
    })(),
    G: await (async () => {
      if ("G" in fields) {
        return g;
      } else {
        return null;
      }
    })(),
    B: await (async () => {
      if ("B" in fields) {
        return b;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return rgb;
}

module.exports = TRGB;
