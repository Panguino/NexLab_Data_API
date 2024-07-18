async function TState(state, fields){
    // Build return object
    const stateInfo = {
        type: await ( async () => {
            if ('type' in fields){
                return state.type
            } else {
                return null
            }
        })(),
        properties: await ( async () => {
            if ('properties' in fields){
                const TStateProperties = require('./TStateProperties')
                return await TStateProperties(state.properties, fields.properties)
            } else {
                return null
            }
        })(),
        geometry: await ( async () => {
            if ('geometry' in fields){
                return state.geometry
            } else {
                return null
            }
        })(),
        counties: await ( async () => {
            if ('counties' in fields){
                const TCounty = require('./TCounty')
                let counties = []
                for (let [currentCountyKey, currentCounty] of Object.entries(state.counties)){
                    counties.push(await TCounty(currentCounty, fields.counties))
                }
                return counties
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return stateInfo
}

module.exports = TState