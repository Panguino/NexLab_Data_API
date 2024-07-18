// Third party
const gqlFields = require('graphql-fields')

// Type resolvers
const TRegion = require('../../../types/TRegion')

async function getRegion(_, { region }, context, info){
    const fields = gqlFields(info)
    const regionData = await context.cache.get("regionData")
    if (!regionData){
        return null
    }
    const targetRegion = regionData[region]
    if (!targetRegion){
        return null
    }
    return await TRegion(targetRegion, fields)
}

module.exports = getRegion