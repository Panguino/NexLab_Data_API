// Third Party
const ns = require('node-schedule');

// Jobs
const cacheRegionData = require('./src/util/jobs/cacheRegionData');
const archiveAlertsToS3 = require('./src/util/jobs/archiveAlertsToS3');
const archiveAlertsToS3Optimized = require('./src/util/jobs/archiveAlertsToS3Optimized');

async function setup(cache) {
  ns.scheduleJob(process.env.CRON_SCHEDULE_WEATHER_UPDATE, async function () {
    const regionUpdateResult = await cacheRegionData(cache);
    if (!regionUpdateResult.success) {
      console.log(`Failed to update weather data: ${regionUpdateResult.message}`);
      return;
    }
  });

  // Archive alerts to S3 every hour (if enabled)
  if (process.env.ENABLE_S3_ARCHIVE === 'true') {
    ns.scheduleJob('0 * * * *', async function () {
      console.log('🔄 Running S3 archive job...');
      const archiveResult = await archiveAlertsToS3(cache);
      if (!archiveResult.success) {
        console.log(`⚠️  S3 archive warning: ${archiveResult.message}`);
      }
    });

    // Archive alerts to S3 (optimized) every hour (if enabled)
    if (process.env.ENABLE_S3_ARCHIVE_OPTIMIZED === 'true') {
      ns.scheduleJob('5 * * * *', async function () {
        console.log('🔄 Running optimized S3 archive job...');
        const archiveResult = await archiveAlertsToS3Optimized(cache);
        if (!archiveResult.success) {
          console.log(`⚠️  Optimized S3 archive warning: ${archiveResult.message}`);
        } else {
          console.log(
            `✅ Optimized archive: New=${archiveResult.newCount}, Unchanged=${archiveResult.unchangedCount}, Expired=${archiveResult.expiredCount}`
          );
        }
      });
    }
  }
}

module.exports = {
  setup,
};
