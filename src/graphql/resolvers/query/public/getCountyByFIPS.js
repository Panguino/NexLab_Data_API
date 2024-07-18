// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TCounty = require('../../../types/TCounty')

async function getCountyByFIPS(_, { FIPS }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return null
    }
    let targetCounty = null
    for (let [currentRegionKey, currentRegion] of Object.entries(regionData)){
        for (let [currentStateKey, currentState] of Object.entries(currentRegion.states)){
            if (currentState.counties.hasOwnProperty(FIPS)){
                targetCounty = currentState.counties[FIPS]
                break
            }
        }
    }
    if (!targetCounty){
        return null
    }
    return await TCounty(targetCounty, fields)
}

module.exports = getCountyByFIPS