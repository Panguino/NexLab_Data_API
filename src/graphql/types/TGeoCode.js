async function TGeoCode(geocode, fields){
    // Build return object
    const geoCodeInfo = {
        SAME: await ( async () => {
            if ('SAME' in fields){
                if ('SAME' in geocode === false){
                    return []
                }
                return geocode.SAME
            } else {
                return null
            }
        })(),
        UGC: await ( async () => {
            if ('UGC' in fields){
                if ('UGC' in geocode === false){
                    return []
                }
                return geocode.UGC
            } else {
                return null
            }
        })(),
    }
    // Return requested data
    return geoCodeInfo
}

module.exports = TGeoCode