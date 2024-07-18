async function TParameterObject(parameterObject, fields){
    // Build return object
    const parameterObjectInfo = {
        AWIPSidentifier: await ( async () => {
            if ('AWIPSidentifier' in fields){
                if ('AWIPSidentifier' in parameterObject){
                    return parameterObject.AWIPSidentifier
                } else {
                    return []
                }
            } else {
                return null
            }
        })(),
        WMOidentifier: await ( async () => {
            if ('WMOidentifier' in fields){
                if ('WMOidentifier' in parameterObject){
                    return parameterObject.WMOidentifier
                } else {
                    return []
                }
            } else {
                return null
            }
        })(),
        NWSheadline: await ( async () => {
            if ('NWSheadline' in fields){
                if ('NWSheadline' in parameterObject){
                    return parameterObject.NWSheadline
                } else {
                    return []
                }
            } else {
                return null
            }
        })(),
        BLOCKCHANNEL: await ( async () => {
            if ('BLOCKCHANNEL' in fields){
                if ('BLOCKCHANNEL' in parameterObject){
                    return parameterObject.BLOCKCHANNEL
                } else {
                    return []
                }
            } else {
                return null
            }
        })(),
        VTEC: await ( async () => {
            if ('VTEC' in fields){
                if ('VTEC' in parameterObject){
                    return parameterObject.VTEC
                } else {
                    return []
                } 
            } else {
                return null
            }
        })(),
        eventEndingTime: await ( async () => {
            if ('eventEndingTime' in fields){
                if ('eventEndingTime' in parameterObject){
                    return parameterObject.eventEndingTime
                } else {
                    return []
                } 
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return parameterObjectInfo
}

module.exports = TParameterObject