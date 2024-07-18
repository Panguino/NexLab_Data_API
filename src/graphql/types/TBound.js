async function TBound(bound, fields){
    // Build return object
    const boundInfo = {
        N: await ( async () => {
            if ('N' in fields){
                return bound.N
            } else {
                return null
            }
        })(),
        S: await ( async () => {
            if ('S' in fields){
                return bound.S
            } else {
                return null
            }
        })(),
        E: await ( async () => {
            if ('E' in fields){
                return bound.E
            } else {
                return null
            }
        })(),
        W: await ( async () => {
            if ('W' in fields){
                return bound.W
            } else {
                return null
            }
        })(),
    }
    // Return requested data
    return boundInfo
}

module.exports = TBound