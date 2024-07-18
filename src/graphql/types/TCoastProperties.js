async function TCoastProperties(coastProperties, fields){
    // Build return object
    const coastPropertiesInfo = {
        ID: await ( async () => {
            if ('ID' in fields){
                return coastProperties.ID
            } else {
                return null
            }
        })(),
        WFO: await ( async () => {
            if ('WFO' in fields){
                return coastProperties.WFO
            } else {
                return null
            }
        })(),
        GL_WFO: await ( async () => {
            if ('GL_WFO' in fields){
                return coastProperties.GL_WFO
            } else {
                return null
            }
        })(),
        NAME: await ( async () => {
            if ('NAME' in fields){
                return coastProperties.NAME
            } else {
                return null
            }
        })(),
        LON: await ( async () => {
            if ('LON' in fields){
                return coastProperties.LON
            } else {
                return null
            }
        })(),
        LAT: await ( async () => {
            if ('LAT' in fields){
                return coastProperties.LAT
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return coastPropertiesInfo
}

module.exports = TCoastProperties