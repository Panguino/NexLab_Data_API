async function TCoast(coast, fields){
    // Build return object
    const coastInfo = {
        type: await ( async () => {
            if ('type' in fields){
                return coast.type
            } else {
                return null
            }
        })(),
        properties: await ( async () => {
            if ('properties' in fields){
                const TCoastProperties = require('./TCoastProperties')
                return await TCoastProperties(coast.properties, fields.properties)
            } else {
                return null
            }
        })(),
        geometry: await ( async () => {
            if ('geometry' in fields){
                return coast.geometry
            } else {
                return null
            }
        })(),
        alerts: await ( async () => {
            if ('alerts' in fields){
                const TAlert = require('./TAlert')
                let alerts = []
                for (let [currentAlertKey, currentAlert] of Object.entries(coast.alerts)){
                    alerts.push(await TAlert(currentAlert, fields.alerts))
                }
                return alerts
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return coastInfo
}

module.exports = TCoast