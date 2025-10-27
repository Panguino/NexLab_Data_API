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
 * GET /api/alerts/history/optimized
 * Get deduplicated alert history for a date
 * Returns full alert data once, with timeline of changes
 * Query parameters:
 *   - date (required): YYYY-MM-DD format
 *   - region (optional): Filter by region
 */
router.get('/optimized', async (req, res) => {
  try {
    const { date, region } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date parameter required (format: YYYY-MM-DD)',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const [year, month, day] = date.split('-');
    const prefix = `alerts-optimized/${year}/${month}/${day}/`;

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
        data: { alerts: {}, timeline: [] },
      });
    }

    // Fetch all snapshots and deduplicate
    const deduplicatedAlerts = {};
    const timeline = [];

    for (const obj of listResult.Contents) {
      try {
        const getParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: obj.Key,
        };

        const data = await s3.getObject(getParams).promise();
        const snapshot = JSON.parse(data.Body.toString());

        // Extract timestamp from snapshot
        const timestamp = snapshot.timestamp;

        // Process alerts in this snapshot
        const timelineEntry = {
          timestamp,
          events: [],
        };

        // First, collect full alert data from alert_data section (new format)
        if (snapshot.alert_data) {
          for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
            if (!deduplicatedAlerts[alertId]) {
              // Check if this is normalized structure (has locations/alertLocationMap)
              if (snapshot.locations && snapshot.alertLocationMap && snapshot.alertLocationMap[alertId]) {
                // Reconstruct locations array from normalized structure
                const locationIds = snapshot.alertLocationMap[alertId];
                const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc); // Filter out any missing locations

                deduplicatedAlerts[alertId] = {
                  ...alertData,
                  locations: locations,
                };
              } else if (alertData.locations) {
                // Old alert-centric format with embedded locations
                deduplicatedAlerts[alertId] = alertData;
              } else {
                // Fallback: just the alert data without locations
                deduplicatedAlerts[alertId] = alertData;
              }
            }
          }
        }

        // Also process expired alerts that may not be in alert_data (for old snapshots or backward compatibility)
        if (snapshot.alerts) {
          for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
            if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
              // Try to get full data from alert_data
              if (snapshot.alert_data && snapshot.alert_data[alertId]) {
                const locationIds = snapshot.alertLocationMap && snapshot.alertLocationMap[alertId] ? snapshot.alertLocationMap[alertId] : [];
                const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);

                deduplicatedAlerts[alertId] = {
                  ...snapshot.alert_data[alertId],
                  locations: locations,
                  status: 'expired',
                };
              }
            }
          }
        }

        // Then, track status changes in timeline
        for (const [alertId, alertData] of Object.entries(snapshot.alerts)) {
          // For backward compatibility with old snapshots:
          // If alert_data section doesn't exist and this alert has full data (not just id+status),
          // add it to deduplicatedAlerts
          if (!snapshot.alert_data && (alertData.status === 'new' || alertData.status === 'updated')) {
            if (!deduplicatedAlerts[alertId]) {
              deduplicatedAlerts[alertId] = alertData;
            }
          }

          timelineEntry.events.push({
            alertId,
            status: alertData.status,
          });
        }

        if (timelineEntry.events.length > 0) {
          timeline.push(timelineEntry);
        }
      } catch (error) {
        console.error(`Error processing snapshot ${obj.Key}:`, error.message);
      }
    }

    // Apply region filter if specified
    if (region) {
      for (const alertId in deduplicatedAlerts) {
        const alert = deduplicatedAlerts[alertId];
        // Check if alert has region info (may not for optimized format)
        if (alert.region && alert.region !== region) {
          delete deduplicatedAlerts[alertId];
        }
      }
    }

    res.json({
      success: true,
      message: `Found ${Object.keys(deduplicatedAlerts).length} unique alerts with ${timeline.length} snapshots`,
      date,
      region: region || 'all',
      data: {
        alerts: deduplicatedAlerts,
        timeline,
      },
    });
  } catch (error) {
    console.error('Error fetching optimized history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert history',
      error: error.message,
    });
  }
});

/**
 * GET /api/alerts/history/last
 * Get alerts from last X hours
 * Query parameters:
 *   - hours (optional): Number of hours to look back (default: 24)
 *   - region (optional): Filter by region
 */
router.get('/last', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const { region } = req.query;

    if (hours < 1 || hours > 720) {
      return res.status(400).json({
        success: false,
        message: 'hours must be between 1 and 720',
      });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Build list of dates to query
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getUTCDate()).padStart(2, '0');
      dates.push(`${year}/${month}/${day}`);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Fetch all snapshots from date range
    const deduplicatedAlerts = {};
    const timeline = [];

    for (const datePrefix of dates) {
      const prefix = `alerts-optimized/${datePrefix}/`;

      const listParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: prefix,
      };

      const listResult = await s3.listObjectsV2(listParams).promise();

      if (!listResult.Contents) continue;

      for (const obj of listResult.Contents) {
        try {
          const getParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: obj.Key,
          };

          const data = await s3.getObject(getParams).promise();
          const snapshot = JSON.parse(data.Body.toString());

          // Filter by time if needed
          const snapshotTime = new Date(snapshot.timestamp);
          if (snapshotTime < startDate) continue;

          const timestamp = snapshot.timestamp;
          const timelineEntry = {
            timestamp,
            events: [],
          };

          // First, collect full alert data from alert_data section (new format)
          if (snapshot.alert_data) {
            for (const [alertId, alertData] of Object.entries(snapshot.alert_data)) {
              if (!deduplicatedAlerts[alertId]) {
                // Check if this is normalized structure (has locations/alertLocationMap)
                if (snapshot.locations && snapshot.alertLocationMap && snapshot.alertLocationMap[alertId]) {
                  // Reconstruct locations array from normalized structure
                  const locationIds = snapshot.alertLocationMap[alertId];
                  const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc); // Filter out any missing locations

                  deduplicatedAlerts[alertId] = {
                    ...alertData,
                    locations: locations,
                  };
                } else if (alertData.locations) {
                  // Old alert-centric format with embedded locations
                  deduplicatedAlerts[alertId] = alertData;
                } else {
                  // Fallback: just the alert data without locations
                  deduplicatedAlerts[alertId] = alertData;
                }
              }
            }
          }

          // Also process expired alerts that may not be in alert_data (for old snapshots or backward compatibility)
          if (snapshot.alerts) {
            for (const [alertId, alertStatus] of Object.entries(snapshot.alerts)) {
              if (alertStatus.status === 'expired' && !deduplicatedAlerts[alertId]) {
                // Try to get full data from alert_data
                if (snapshot.alert_data && snapshot.alert_data[alertId]) {
                  const locationIds = snapshot.alertLocationMap && snapshot.alertLocationMap[alertId] ? snapshot.alertLocationMap[alertId] : [];
                  const locations = locationIds.map((locId) => snapshot.locations[locId]).filter((loc) => loc);

                  deduplicatedAlerts[alertId] = {
                    ...snapshot.alert_data[alertId],
                    locations: locations,
                    status: 'expired',
                  };
                }
              }
            }
          }

          // Then, track status changes in timeline
          for (const [alertId, alertData] of Object.entries(snapshot.alerts)) {
            // For backward compatibility with old snapshots:
            // If alert_data section doesn't exist and this alert has full data (not just id+status),
            // add it to deduplicatedAlerts
            if (!snapshot.alert_data && (alertData.status === 'new' || alertData.status === 'updated')) {
              if (!deduplicatedAlerts[alertId]) {
                deduplicatedAlerts[alertId] = alertData;
              }
            }

            timelineEntry.events.push({
              alertId,
              status: alertData.status,
            });
          }

          if (timelineEntry.events.length > 0) {
            timeline.push(timelineEntry);
          }
        } catch (error) {
          console.error(`Error processing snapshot ${obj.Key}:`, error.message);
        }
      }
    }

    // Apply region filter if specified
    if (region) {
      for (const alertId in deduplicatedAlerts) {
        const alert = deduplicatedAlerts[alertId];
        if (alert.region && alert.region !== region) {
          delete deduplicatedAlerts[alertId];
        }
      }
    }

    res.json({
      success: true,
      message: `Found ${Object.keys(deduplicatedAlerts).length} unique alerts in last ${hours} hours`,
      hours,
      region: region || 'all',
      data: {
        alerts: deduplicatedAlerts,
        timeline,
      },
    });
  } catch (error) {
    console.error('Error fetching last hours history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert history',
      error: error.message,
    });
  }
});

module.exports = router;
