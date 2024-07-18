// Queries
// --- PUBLIC
const getRegion = require('./resolvers/query/public/getRegion')
const getRegions = require('./resolvers/query/public/getRegions')
const getCoastByUGC = require('./resolvers/query/public/getCoastByUGC')
const getOffshoreByUGC = require('./resolvers/query/public/getOffshoreByUGC')
const getStateByFIPS = require('./resolvers/query/public/getStateByFIPS')
const getCountyByFIPS = require('./resolvers/query/public/getCountyByFIPS')

// Mutations
// --- PUBLIC

const resolvers = {
    Query: {
        getRegion,
        getRegions,
        getCoastByUGC,
        getOffshoreByUGC,
        getStateByFIPS,
        getCountyByFIPS
    }
}

module.exports = resolvers