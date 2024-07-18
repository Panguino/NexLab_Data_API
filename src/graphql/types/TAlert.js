async function TAlert(alert, fields){
    // Build return object
    const alertInfo = {
        id: await ( async () => {
            if ('id' in fields){
                return alert.id
            } else {
                return null
            }
        })(),
        type: await ( async () => {
            if ('type' in fields){
                return alert.type
            } else {
                return null
            }
        })(),
        geometry: await ( async () => {
            if ('geometry' in fields){
                return alert.geometry
            } else {
                return null
            }
        })(),
        properties: await ( async () => {
            if ('properties' in fields){
                const TAlertProperties = require('./TAlertProperties')
                return await TAlertProperties(alert.properties, fields.properties)
            } else {
                return null
            }
        })(),
    }
    // Return requested data
    return alertInfo
}

module.exports = TAlert