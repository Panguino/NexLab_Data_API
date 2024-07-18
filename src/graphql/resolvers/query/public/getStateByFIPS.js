// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TState = require('../../../types/TState')

async function getStateByFIPS(_, { FIPS }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return null
    }
    let targetState = null
    for (let [currentRegionKey, currentRegion] of Object.entries(regionData)){
        for (let [currentStateKey, currentState] of Object.entries(currentRegion.states)){
            if (currentState.properties.FIPS === FIPS){
                targetState = currentState
                break
            }
        }
    }
    if (!targetState){
        return null
    }
    return await TState(targetState, fields)
}

module.exports = getStateByFIPS