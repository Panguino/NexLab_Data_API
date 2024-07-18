// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TCoast = require('../../../types/TCoast')

async function getCoastByUGC(_, { UGC }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return null
    }
    let targetCoast = null
    for (let [currentRegionKey, currentRegion] of Object.entries(regionData)){
        if (currentRegion.coasts.hasOwnProperty(UGC)){
            targetCoast = currentRegion.coasts[UGC]
            break
        }
    }
    if (!targetCoast){
        return null
    }
    return await TCoast(targetCoast, fields)
}

module.exports = getCoastByUGC