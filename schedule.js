// Third Party
const ns = require('node-schedule')

// Jobs
const cacheRegionData = require('./src/util/jobs/cacheRegionData')

async function setup(cache){
    ns.scheduleJob(process.env.CRON_SCHEDULE_WEATHER_UPDATE, async function(){
        const regionUpdateResult = await cacheRegionData(cache)
        if (!regionUpdateResult.success){
            console.log(`Failed to update weather data: ${regionUpdateResult.message}`)
            return
        }
    })
}

module.exports = {
    setup
}
