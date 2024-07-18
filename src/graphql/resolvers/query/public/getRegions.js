// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TRegion = require('../../../types/TRegion')

async function getRegions(_, { regions }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return []
    }
    let targetRegions = []
    for (let [currentRegionKey, currentRegion] of Object.entries(regionData)){
        if (regions.includes(currentRegionKey)){
            targetRegions.push(await TRegion(currentRegion, fields))
        }
    }
    return targetRegions
}

module.exports = getRegions