const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

/**
 * GET /api/alerts/history
 * Get historical alert snapshots for a specific date
 * Query parameters:
 *   - date (required): YYYY-MM-DD format
 *   - region (optional): Filter by region (e.g., CONUS, ALASKA)
 *   - hazardType (optional): Filter by hazard type (e.g., TORNADO, WINTER)
 */
router.get('/', async (req, res) => {
  try {
    const { date, region, hazardType } = req.query;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date parameter required (format: YYYY-MM-DD)',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Parse date
    const [year, month, day] = date.split('-');
    const prefix = `alerts/${year}/${month}/${day}/`;

    // List all snapshots for the day
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
    };

    const listResult = await s3.listObjectsV2(listParams).promise();

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return res.json({
        success: true,
        message: `No data found for date ${date}`,
        date,
        data: [],
      });
    }

    // Fetch all snapshots for the day
    const snapshots = [];
    for (const obj of listResult.Contents) {
      try {
        const getParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: obj.Key,
        };

        const data = await s3.getObject(getParams).promise();
        const snapshot = JSON.parse(data.Body.toString());

        // Apply region filter if specified
        if (region && snapshot.regions[region]) {
          snapshot.regions = { [region]: snapshot.regions[region] };
        } else if (region) {
          // Skip this snapshot if region doesn't exist
          continue;
        }

        // Apply hazard type filter if specified
        if (hazardType) {
          for (const regionName in snapshot.regions) {
            snapshot.regions[regionName].alerts = 
              snapshot.regions[regionName].alerts.filter(
                a => a.event && a.event.includes(hazardType)
              );
          }
          // Remove empty regions
          for (const regionName in snapshot.regions) {
            if (snapshot.regions[regionName].alerts.length === 0) {
              delete snapshot.regions[regionName];
            }
          }
        }

        // Only include snapshot if it has data after filtering
        if (Object.keys(snapshot.regions).length > 0) {
          snapshots.push(snapshot);
        }
      } catch (error) {
        console.error(`Error processing snapshot ${obj.Key}:`, error.message);
        // Continue to next snapshot on error
      }
    }

    res.json({
      success: true,
      message: `Found ${snapshots.length} snapshots for ${date}`,
      date,
      region: region || 'all',
      hazardType: hazardType || 'all',
      snapshotCount: snapshots.length,
      data: snapshots,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert history',
      error: error.message,
    });
  }
});

/**
 * GET /api/alerts/history/dates
 * Get list of available dates with data
 * Query parameters:
 *   - year (optional): Filter by year (YYYY)
 *   - month (optional): Filter by month (MM)
 */
router.get('/dates', async (req, res) => {
  try {
    const { year, month } = req.query;

    // Build prefix based on filters
    let prefix = 'alerts/';
    if (year) {
      prefix += `${year}/`;
      if (month) {
        prefix += `${month}/`;
      }
    }

    // List all objects with prefix
    const listParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    };

    const listResult = await s3.listObjectsV2(listParams).promise();

    const dates = [];
    if (listResult.CommonPrefixes) {
      for (const commonPrefix of listResult.CommonPrefixes) {
        dates.push(commonPrefix.Prefix);
      }
    }

    res.json({
      success: true,
      message: `Found ${dates.length} available dates`,
      prefix,
      dates,
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available dates',
      error: error.message,
    });
  }
});

/**
 * GET /api/alerts/history/location/:locationId
 * Get historical alerts for a specific location
 * Query parameters:
 *   - startDate (optional): Start date (YYYY-MM-DD)
 *   - endDate (optional): End date (YYYY-MM-DD)
 */
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { startDate, endDate } = req.query;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'locationId parameter required',
      });
    }

    // For now, return a message that this requires more complex querying
    res.json({
      success: true,
      message: 'Location history query - feature coming soon',
      locationId,
      note: 'This endpoint requires querying multiple snapshots. Use the main history endpoint with date parameter.',
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location history',
      error: error.message,
    });
  }
});

module.exports = router;

