async function TStateProperties(stateProperties, fields){
    // Build return object
    const statePropertiesInfo = {
        STATE: await ( async () => {
            if ('STATE' in fields){
                return stateProperties.STATE
            } else {
                return null
            }
        })(),
        NAME: await ( async () => {
            if ('NAME' in fields){
                return stateProperties.NAME
            } else {
                return null
            }
        })(),
        FIPS: await ( async () => {
            if ('FIPS' in fields){
                return stateProperties.FIPS
            } else {
                return null
            }
        })(),
        LON: await ( async () => {
            if ('LON' in fields){
                return stateProperties.LON
            } else {
                return null
            }
        })(),
        LAT: await ( async () => {
            if ('LAT' in fields){
                return stateProperties.LAT
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return statePropertiesInfo
}

module.exports = TStateProperties