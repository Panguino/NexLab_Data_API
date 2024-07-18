async function TOffshore(offshore, fields){
    // Build return object
    const offshoreInfo = {
        type: await ( async () => {
            if ('type' in fields){
                return offshore.type
            } else {
                return null
            }
        })(),
        properties: await ( async () => {
            if ('properties' in fields){
                const TOffshoreProperties = require('./TOffshoreProperties')
                return await TOffshoreProperties(offshore.properties, fields.properties)
            } else {
                return null
            }
        })(),
        geometry: await ( async () => {
            if ('geometry' in fields){
                return offshore.geometry
            } else {
                return null
            }
        })(),
        alerts: await ( async () => {
            if ('alerts' in fields){
                const TAlert = require('./TAlert')
                let alerts = []
                for (let [currentAlertKey, currentAlert] of Object.entries(offshore.alerts)){
                    alerts.push(await TAlert(currentAlert, fields.alerts))
                }
                return alerts
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return offshoreInfo
}

module.exports = TOffshore