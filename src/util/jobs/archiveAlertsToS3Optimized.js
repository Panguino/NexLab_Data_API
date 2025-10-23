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
        'timestamp': snapshot.timestamp,
        'alerts-count': String(snapshot.alerts_count),
        'new-count': String(snapshot.new_count),
        'unchanged-count': String(snapshot.unchanged_count),
        'expired-count': String(snapshot.expired_count),
      },
    };

    await s3.putObject(params).promise();

    console.log(`✅ Archived ${snapshot.alerts_count} alerts to S3 (optimized)`);
    console.log(`   New: ${snapshot.new_count}, Unchanged: ${snapshot.unchanged_count}, Expired: ${snapshot.expired_count}`);

    return {
      success: true,
      message: 'Alerts archived to S3 (optimized)',
      s3Key,
      alertsCount: snapshot.alerts_count,
      newCount: snapshot.new_count,
      unchangedCount: snapshot.unchanged_count,
      expiredCount: snapshot.expired_count,
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
 * Extract all alerts from region data into a flat structure
 * @param {Object} regionData - Cached region data
 * @returns {Object} Map of alertId -> alert with location info
 */
function extractAllAlerts(regionData) {
  const alerts = {};

  for (const [regionName, region] of Object.entries(regionData)) {
    // Extract from counties
    if (region.states) {
      for (const [stateName, state] of Object.entries(region.states)) {
        if (state.counties) {
          for (const [countyFIPS, county] of Object.entries(state.counties)) {
            if (county.alerts) {
              for (const [alertId, alert] of Object.entries(county.alerts)) {
                alerts[alert.id] = {
                  id: alert.id,
                  event: alert.properties.event,
                  locationId: county.properties.FIPS,
                  locationName: county.properties.COUNTYNAME,
                  locationType: 'county',
                  state: state.properties.STATE,
                  lat: county.properties.LAT,
                  lon: county.properties.LON,
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
            }
          }
        }
      }
    }

    // Extract from coasts
    if (region.coasts) {
      for (const [coastId, coast] of Object.entries(region.coasts)) {
        if (coast.alerts) {
          for (const [alertId, alert] of Object.entries(coast.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
              event: alert.properties.event,
              locationId: coast.properties.ID,
              locationName: coast.properties.NAME,
              locationType: 'coast',
              lat: coast.properties.LAT,
              lon: coast.properties.LON,
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
        }
      }
    }

    // Extract from offshores
    if (region.offshores) {
      for (const [offshoreId, offshore] of Object.entries(region.offshores)) {
        if (offshore.alerts) {
          for (const [alertId, alert] of Object.entries(offshore.alerts)) {
            alerts[alert.id] = {
              id: alert.id,
              event: alert.properties.event,
              locationId: offshore.properties.ID,
              locationName: offshore.properties.Name,
              locationType: 'offshore',
              lat: offshore.properties.LAT,
              lon: offshore.properties.LON,
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
        }
      }
    }
  }

  return alerts;
}

/**
 * Create optimized snapshot by comparing with previous snapshot
 * Only stores full data for new/updated alerts
 * @param {Object} currentAlerts - Current alerts map
 * @param {Object} previousAlerts - Previous alerts map
 * @returns {Object} Optimized snapshot
 */
function createOptimizedSnapshot(currentAlerts, previousAlerts) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    snapshot_id: uuidv4(),
    alerts_count: Object.keys(currentAlerts).length,
    new_count: 0,
    unchanged_count: 0,
    expired_count: 0,
    alerts: {},
  };

  // Track which alerts we've seen
  const seenAlerts = new Set();

  // Process current alerts
  for (const [alertId, alert] of Object.entries(currentAlerts)) {
    seenAlerts.add(alertId);

    if (!previousAlerts || !previousAlerts[alertId]) {
      // New alert - store full data
      snapshot.alerts[alertId] = {
        ...alert,
        status: 'new',
      };
      snapshot.new_count++;
    } else {
      // Check if alert has changed
      const prev = previousAlerts[alertId];
      const hasChanged = JSON.stringify(alert) !== JSON.stringify(prev);

      if (hasChanged) {
        // Updated alert - store full data
        snapshot.alerts[alertId] = {
          ...alert,
          status: 'updated',
        };
        snapshot.new_count++; // Count as new data
      } else {
        // Unchanged alert - store only ID and status
        snapshot.alerts[alertId] = {
          id: alertId,
          status: 'unchanged',
        };
        snapshot.unchanged_count++;
      }
    }
  }

  // Process expired alerts (were in previous but not in current)
  if (previousAlerts) {
    for (const [alertId, alert] of Object.entries(previousAlerts)) {
      if (!seenAlerts.has(alertId)) {
        snapshot.alerts[alertId] = {
          id: alertId,
          status: 'expired',
        };
        snapshot.expired_count++;
      }
    }
  }

  return snapshot;
}

module.exports = archiveAlertsToS3Optimized;

