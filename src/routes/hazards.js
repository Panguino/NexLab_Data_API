const express = require("express");
const router = express.Router();
const {
  extractAllHazards,
  getHazardsByCountyFIPS,
  getHazardsByState,
  getHazardsByRegion,
} = require("../util/hazardFormatter");

/**
 * GET /api/hazards
 * Get all active hazards, optionally filtered by region, state, hazard type, or level
 *
 * Query Parameters:
 *   - region: Filter by region (e.g., CONUS, ALASKA, HAWAII)
 *   - state: Filter by state code (e.g., FL, CA)
 *   - hazardType: Filter by hazard type (e.g., TORNADO, SEVERE, FIRE)
 *   - hazardLevel: Filter by hazard level (e.g., WARNING, WATCH, ADVISORY)
 *
 * Example: GET /api/hazards?region=CONUS&hazardType=TORNADO
 */
router.get("/", async (req, res) => {
  try {
    const regionData = req.app.locals.cache.get("regionData");

    if (!regionData) {
      return res.status(503).json({
        success: false,
        message: "Region data not available",
        data: [],
      });
    }

    const filters = {
      region: req.query.region || null,
      state: req.query.state || null,
      hazardType: req.query.hazardType || null,
      hazardLevel: req.query.hazardLevel || null,
    };

    // Remove null filters
    Object.keys(filters).forEach(
      (key) => filters[key] === null && delete filters[key]
    );

    const hazards = await extractAllHazards(regionData, filters);

    res.json({
      success: true,
      message: `Found ${hazards.length} active hazards`,
      data: hazards,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching hazards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hazards",
      error: error.message,
      data: [],
    });
  }
});

/**
 * GET /api/hazards/county/:fips
 * Get hazards for a specific county by FIPS code
 *
 * Example: GET /api/hazards/county/12086
 */
router.get("/county/:fips", async (req, res) => {
  try {
    const { fips } = req.params;

    if (!fips) {
      return res.status(400).json({
        success: false,
        message: "County FIPS code is required",
        data: [],
      });
    }

    const regionData = req.app.locals.cache.get("regionData");

    if (!regionData) {
      return res.status(503).json({
        success: false,
        message: "Region data not available",
        data: [],
      });
    }

    const hazards = await getHazardsByCountyFIPS(regionData, fips);

    res.json({
      success: true,
      message: `Found ${hazards.length} hazards for county ${fips}`,
      data: hazards,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching county hazards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching county hazards",
      error: error.message,
      data: [],
    });
  }
});

/**
 * GET /api/hazards/state/:state
 * Get hazards for a specific state
 *
 * Example: GET /api/hazards/state/FL
 */
router.get("/state/:state", async (req, res) => {
  try {
    const { state } = req.params;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "State code is required",
        data: [],
      });
    }

    const regionData = req.app.locals.cache.get("regionData");

    if (!regionData) {
      return res.status(503).json({
        success: false,
        message: "Region data not available",
        data: [],
      });
    }

    const hazards = await getHazardsByState(regionData, state.toUpperCase());

    res.json({
      success: true,
      message: `Found ${hazards.length} hazards for state ${state.toUpperCase()}`,
      data: hazards,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching state hazards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching state hazards",
      error: error.message,
      data: [],
    });
  }
});

/**
 * GET /api/hazards/region/:region
 * Get hazards for a specific region
 *
 * Example: GET /api/hazards/region/CONUS
 */
router.get("/region/:region", async (req, res) => {
  try {
    const { region } = req.params;

    if (!region) {
      return res.status(400).json({
        success: false,
        message: "Region name is required",
        data: [],
      });
    }

    const regionData = req.app.locals.cache.get("regionData");

    if (!regionData) {
      return res.status(503).json({
        success: false,
        message: "Region data not available",
        data: [],
      });
    }

    const hazards = await getHazardsByRegion(regionData, region.toUpperCase());

    res.json({
      success: true,
      message: `Found ${hazards.length} hazards for region ${region.toUpperCase()}`,
      data: hazards,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching region hazards:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching region hazards",
      error: error.message,
      data: [],
    });
  }
});

module.exports = router;

