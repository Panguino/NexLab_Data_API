async function THazardColor({ color_rgb, color_hex }) {
  // Build return object
  const R = Number(color_rgb.split(",")[0]);
  const G = Number(color_rgb.split(",")[1]);
  const B = Number(color_rgb.split(",")[2]);
  const hazardColor = {
    rgb: await (async () => {
      if ("rgb" in fields) {
        const TRGB = require("./TRGB");
        return await TRGB(R, G, B);
      } else {
        return null;
      }
    })(),
    hex: await (async () => {
      if ("hex" in fields) {
        return color_hex;
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return hazardColor;
}

module.exports = THazardColor;
