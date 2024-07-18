// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TOffshore = require('../../../types/TOffshore')

async function getOffshoreByUGC(_, { UGC }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return null
    }
    let targetOffshore = null
    for (let [currentRegionKey, currentRegion] of Object.entries(regionData)){
        if (currentRegion.offshores.hasOwnProperty(UGC)){
            targetOffshore = currentRegion.offshores[UGC]
            break
        }
    }
    if (!targetOffshore){
        return null
    }
    return await TOffshore(targetOffshore, fields)
}

module.exports = getOffshoreByUGC