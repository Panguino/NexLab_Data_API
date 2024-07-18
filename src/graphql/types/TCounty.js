async function TCounty(county, fields){
    // Build return object
    const countyInfo = {
        type: await ( async () => {
            if ('type' in fields){
                return county.type
            } else {
                return null
            }
        })(),
        properties: await ( async () => {
            if ('properties' in fields){
                const TCountyProperties = require('./TCountyProperties')
                return await TCountyProperties(county.properties, fields.properties)
            } else {
                return null
            }
        })(),
        geometry: await ( async () => {
            if ('geometry' in fields){
                return county.geometry
            } else {
                return null
            }
        })(),
        alerts: await ( async () => {
            if ('alerts' in fields){
                const TAlert = require('./TAlert')
                let alerts = []
                for (let [currentAlertKey, currentAlert] of Object.entries(county.alerts)){
                    alerts.push(await TAlert(currentAlert, fields.alerts))
                }
                return alerts
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return countyInfo
}

module.exports = TCounty