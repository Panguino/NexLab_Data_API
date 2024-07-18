async function TRegion(region, fields){
    // Build return object
    const regionInfo = {
        name: await ( async () => {
            if ('name' in fields){
                return region.name
            } else {
                return null
            }
        })(),
        bounds: await ( async () => {
            if ('bounds' in fields){
                let bounds = []
                for (let bound of region.bounds){
                    const TBound = require('./TBound')
                    bounds.push(await TBound(bound, fields.bounds))
                }
                return bounds
            } else {
                return null
            }
        })(),
        states: await ( async () => {
            if ('states' in fields){
                const TState = require('./TState')
                let states = []
                for (let [currentStateKey, currentState] of Object.entries(region.states)){
                    states.push(await TState(currentState, fields.states))
                }
                return states
            } else {
                return null
            }
        })(),
        coasts: await ( async () => {
            if ('coasts' in fields){
                const TCoast = require('./TCoast')
                let coasts = []
                for (let [currentCoastKey, currentCoast] of Object.entries(region.coasts)){
                    coasts.push(await TCoast(currentCoast, fields.coasts))
                }
                return coasts
            } else {
                return null
            }
        })(),
        offshores: await ( async () => {
            if ('offshores' in fields){
                const TOffshore = require('./TOffshore')
                let offshores = []
                for (let [currentOffshoreKey, currentOffshore] of Object.entries(region.offshores)){
                    offshores.push(await TOffshore(currentOffshore, fields.offshores))
                }
                return offshores
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return regionInfo
}

module.exports = TRegion