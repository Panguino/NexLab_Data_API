const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

// Store previous snapshot for comparison
let previousSnapshot = null;

/**
 * Archives current alert snapshot to S3 with optimization
 * Only stores full data for new/updated alerts, status-only for unchanged
 * @param {Object} cache - NodeCache instance
 * @returns {Promise<Object>} Result object with success status
 */
async function archiveAlertsToS3Optimized(cache) {
  try {
    if (process.env.ENABLE_S3_ARCHIVE !== 'true') {
      return { success: false, message: 'S3 archiving is disabled' };
    }

    if (!process.env.AWS_S3_BUCKET) {
      console.error('❌ AWS_S3_BUCKET environment variable not set');
      return { success: false, message: 'AWS_S3_BUCKET not configured' };
    }

    const regionData = cache.get('regionData');
    if (!regionData) {
      console.log('⚠️  No region data to archive');
      return { success: false, message: 'No region data in cache' };
    }

    // Extract current alerts
    const currentAlerts = extractAllAlerts(regionData);

    // Compare with previous snapshot to determine status
    const snapshot = createOptimizedSnapshot(currentAlerts, previousSnapshot);

    // Store current for next comparison
    previousSnapshot = currentAlerts;

    // Generate S3 key
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    const second = String(now.getUTCSeconds()).padStart(2, '0');

    const s3Key = `alerts-optimized/${year}/${month}/${day}/${hour}-${minute}-${second}.json`;

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(snapshot, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'snapshot-id': snapshot.snapshot_id,
        timestamp: snapshot.timestamp,
        'new-alerts-count': String(snapshot.new_alerts_count),
      },
    };

    await s3.putObject(params).promise();

    console.log(`✅ Archived ${snapshot.new_alerts_count} new/updated alerts to S3 (incremental)`);

    return {
      success: true,
      message: 'Alerts archived to S3 (incremental)',
      s3Key,
      newAlertsCount: snapshot.new_alerts_count,
      timestamp: snapshot.timestamp,
    };
  } catch (error) {
    console.error('❌ Error archiving to S3:', error.message);
    return {
      success: false,
      message: `Error archiving to S3: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Extract all alerts from region data into a normalized database structure
 * Separates locations, alerts, and their mappings to minimize duplication
 * @param {Object} regionData - Cached region data
 * @returns {Object} { locations: {}, alerts: {}, alertLocationMap: {} }
 */
function extractAllAlerts(regionData) {
  const locations = {}; // locationId -> location data
  const alerts = {}; // alertId -> alert data (without locations)
  const alertLocationMap = {}; // alertId -> [locationIds]

  for (const [regionName, region] of Object.entries(regionData)) {
    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            // Store location once
            const locationId = `county-${county.properties.FIPS}`;
            if (!locations[locationId]) {
              locations[locationId] = {
                id: locationId,
                locationId: county.properties.FIPS,
                name: county.properties.COUNTYNAME,
                type: 'county',
                state: state.properties.STATE,
                lat: county.properties.LAT,
                lon: county.properties.LON,
              };
            }

            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                const alertBaseId = alert.id;

                // Store alert once
                if (!alerts[alertBaseId]) {
                  alerts[alertBaseId] = {
                    id: alert.id,
                    event: alert.properties.event,
                    sent: alert.properties.sent,
                    effective: alert.properties.effective,
                    onset: alert.properties.onset,
                    expires: alert.properties.expires,
                    ends: alert.properties.ends,
                    headline: alert.properties.headline,
                    description: alert.properties.description,
                    areaDesc: alert.properties.areaDesc,
                    severity: alert.properties.severity,
                    certainty: alert.properties.certainty,
                    urgency: alert.properties.urgency,
                  };
                }

                // Map alert to location
                if (!alertLocationMap[alertBaseId]) {
                  alertLocationMap[alertBaseId] = [];
                }
                if (!alertLocationMap[alertBaseId].includes(locationId)) {
                  alertLocationMap[alertBaseId].push(locationId);
                }
              }
            }
          }
        }
      }
    }

    // Extract from coasts
    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        // Store location once
        const locationId = `coast-${coast.properties.ID}`;
        if (!locations[locationId]) {
          locations[locationId] = {
            id: locationId,
            locationId: coast.properties.ID,
            name: coast.properties.NAME,
            type: 'coast',
            lat: coast.properties.LAT,
            lon: coast.properties.LON,
          };
        }

        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            const alertBaseId = alert.id;

            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
                sent: alert.properties.sent,
                effective: alert.properties.effective,
                onset: alert.properties.onset,
                expires: alert.properties.expires,
                ends: alert.properties.ends,
                headline: alert.properties.headline,
                description: alert.properties.description,
                areaDesc: alert.properties.areaDesc,
                severity: alert.properties.severity,
                certainty: alert.properties.certainty,
                urgency: alert.properties.urgency,
              };
            }

            if (!alertLocationMap[alertBaseId]) {
              alertLocationMap[alertBaseId] = [];
            }
            if (!alertLocationMap[alertBaseId].includes(locationId)) {
              alertLocationMap[alertBaseId].push(locationId);
            }
          }
        }
      }
    }

    // Extract from offshores
    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        // Store location once
        const locationId = `offshore-${offshore.properties.ID}`;
        if (!locations[locationId]) {
          locations[locationId] = {
            id: locationId,
            locationId: offshore.properties.ID,
            name: offshore.properties.Name,
            type: 'offshore',
            lat: offshore.properties.LAT,
            lon: offshore.properties.LON,
          };
        }

        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            const alertBaseId = alert.id;

            if (!alerts[alertBaseId]) {
              alerts[alertBaseId] = {
                id: alert.id,
                event: alert.properties.event,
                sent: alert.properties.sent,
                effective: alert.properties.effective,
                onset: alert.properties.onset,
                expires: alert.properties.expires,
                ends: alert.properties.ends,
                headline: alert.properties.headline,
                description: alert.properties.description,
                areaDesc: alert.properties.areaDesc,
                severity: alert.properties.severity,
                certainty: alert.properties.certainty,
                urgency: alert.properties.urgency,
              };
            }

            if (!alertLocationMap[alertBaseId]) {
              alertLocationMap[alertBaseId] = [];
            }
            if (!alertLocationMap[alertBaseId].includes(locationId)) {
              alertLocationMap[alertBaseId].push(locationId);
            }
          }
        }
      }
    }
  }

  return {
    locations,
    alerts,
    alertLocationMap,
  };
}

/**
 * Create incremental snapshot by comparing with previous snapshot
 * Only stores NEW and UPDATED alerts (not unchanged or expired)
 * This creates an incremental archive where each snapshot only contains new data
 * @param {Object} currentAlerts - Current alerts object { locations, alerts, alertLocationMap }
 * @param {Object} previousAlerts - Previous alerts object
 * @returns {Object} Incremental snapshot
 */
function createOptimizedSnapshot(currentAlerts, previousAlerts) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    snapshot_id: uuidv4(),
    new_alerts_count: 0,
    // Normalized database structure - only for new/updated alerts
    locations: {},
    alert_data: {},
    alertLocationMap: {},
    // Store new/updated alerts
    alerts: {},
  };

  // Track which alerts are new or updated
  const newOrUpdatedAlerts = new Set();

  // Process current alerts - only store if new or updated
  for (const [alertId, alert] of Object.entries(currentAlerts.alerts)) {
    let isNew = false;

    if (!previousAlerts || !previousAlerts.alerts || !previousAlerts.alerts[alertId]) {
      // New alert
      isNew = true;
    } else {
      // Check if alert has changed
      const prev = previousAlerts.alerts[alertId];
      const hasChanged = JSON.stringify(alert) !== JSON.stringify(prev);

      if (hasChanged) {
        // Updated alert
        isNew = true;
      }
    }

    // Only store new or updated alerts
    if (isNew) {
      newOrUpdatedAlerts.add(alertId);
      snapshot.alerts[alertId] = {
        id: alertId,
      };
      snapshot.new_alerts_count++;

      // Store full alert data
      snapshot.alert_data[alertId] = alert;

      // Store locations and mappings for this alert
      if (currentAlerts.alertLocationMap[alertId]) {
        snapshot.alertLocationMap[alertId] = currentAlerts.alertLocationMap[alertId];

        // Store location data for all locations this alert is assigned to
        for (const locationId of currentAlerts.alertLocationMap[alertId]) {
          if (currentAlerts.locations[locationId]) {
            snapshot.locations[locationId] = currentAlerts.locations[locationId];
          }
        }
      }
    }
  }

  return snapshot;
}

module.exports = archiveAlertsToS3Optimized;
