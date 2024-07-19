// Third Party
const { gql } = require("apollo-server-express");

// Schema
const schema = gql`
  scalar JSON
  scalar Date
  scalar UUID

  enum EHazardType {
    TORNADO
    SEVERE
    FIRE
    HYDROLOGICAL
    MARINE
    NONMET
    NONPRECIP
    TROPICAL
    WINTER
    SPECIALWX
    UNKNOWN
  }

  enum EHazardLevel {
    WARNING
    WATCH
    ADVISORY
    STATEMENT
  }

  enum ERegion {
    CONUS
    CANADA
    ALASKA
    HAWAII
    PUERTO_RICO
    GUAM
    AMERICAN_SAMOA
    PANAMA
    MEXICO
    CUBA
    GUATEMALA
    BELIZE
    HONDURAS
    EL_SALVADOR
    DOMINICAN_REPUBLIC
    HAITI
    JAMAICA
    BAHAMAS
    NICARAGUA
    COSTA_RICA
  }

  type Region {
    name: String
    bounds: [Bound]
    states: [State]
    coasts: [Coast]
    offshores: [Offshore]
  }

  type Bound {
    N: Float
    S: Float
    E: Float
    W: Float
  }

  type Coast {
    type: String
    properties: CoastProperties
    geometry: JSON
    alerts: [Alert]
  }

  type CoastProperties {
    ID: String
    WFO: String
    GL_WFO: String
    NAME: String
    LON: Float
    LAT: Float
  }

  type Offshore {
    type: String
    properties: OffshoreProperties
    geometry: JSON
    alerts: [Alert]
  }

  type OffshoreProperties {
    ID: String
    WFO: String
    LON: Float
    LAT: Float
    Location: String
    Name: String
  }

  type State {
    type: String
    properties: StateProperties
    geometry: JSON
    counties: [County]
  }

  type StateProperties {
    STATE: String
    NAME: String
    FIPS: String
    LON: Float
    LAT: Float
  }

  type County {
    type: String
    properties: CountyProperties
    geometry: JSON
    alerts: [Alert]
  }

  type CountyProperties {
    ID: String
    STATE: String
    CWA: String
    COUNTYNAME: String
    FIPS: String
    TIME_ZONE: String
    FE_AREA: String
    LON: Float
    LAT: Float
  }

  type Alert {
    id: String
    type: String
    geometry: JSON
    properties: AlertProperties
  }

  type AlertProperties {
    atId: String
    atType: String
    id: String
    areaDesc: String
    geocode: GeoCode
    affectedZones: [String]
    references: [Reference]
    sent: Date
    effective: Date
    onset: Date
    expires: Date
    ends: Date
    status: String
    messageType: String
    category: String
    severity: String
    certainty: String
    urgency: String
    event: String
    sender: String
    senderName: String
    headline: String
    description: String
    instruction: String
    response: String
    parameters: ParameterObject
    hazard_info: HazardInfo
  }

  type HazardInfo {
    type: HazardTypeInfo
    level: HazardLevelInfo
    color: HazardColor
  }

  type HazardTypeInfo {
    type: EHazardType
    name: String
  }

  type HazardLevelInfo {
    level: EHazardLevel
    name: String
  }

  type HazardColor {
    RGB: RGB
    HEX: String
  }

  type RGB {
    R: Int
    G: Int
    B: Int
  }

  type GeoCode {
    SAME: [String]
    UGC: [String]
  }

  type Reference {
    atId: String
    identifier: String
    sender: String
    sent: Date
  }

  type ParameterObject {
    AWIPSidentifier: [String]
    WMOidentifier: [String]
    NWSheadline: [String]
    BLOCKCHANNEL: [String]
    VTEC: [String]
    eventEndingTime: [String]
  }

  type Query {
    getRegion(region: ERegion!): Region
    getRegions(regions: [ERegion]!): [Region]
    getCoastByUGC(UGC: String!): Coast
    getOffshoreByUGC(UGC: String!): Offshore
    getStateByFIPS(FIPS: String!): State
    getCountyByFIPS(FIPS: String!): County
  }
`;

module.exports = schema;
