const { feature } = require('topojson-client')
const { multiPolygon, polygon, simplify, kinks } = require('@turf/turf')
const axios = require('axios')

const HAZARD_LEVEL_WARNING_ID = 'WARNING'
const HAZARD_LEVEL_WATCH_ID = 'WATCH'
const HAZARD_LEVEL_ADVISORY_ID = 'ADVISORY'
const HAZARD_LEVEL_STATEMENT_ID = 'STATEMENT'
const HAZARD_LEVEL_UNKNOWN_ID = 'UNKNOWN'
const HAZARD_LEVELS = [HAZARD_LEVEL_WARNING_ID, HAZARD_LEVEL_WATCH_ID, HAZARD_LEVEL_ADVISORY_ID, HAZARD_LEVEL_STATEMENT_ID]

const HAZARD_TYPE_TORNADO_ID = 'TORNADO'
const HAZARD_TYPE_SEVERE_ID = 'SEVERE'
const HAZARD_TYPE_FIRE_ID = 'FIRE'
const HAZARD_TYPE_HYDROLOGICAL_ID = 'HYDROLOGICAL'
const HAZARD_TYPE_MARINE_ID = 'MARINE'
const HAZARD_TYPE_NONMET_ID = 'NONMET'
const HAZARD_TYPE_NONPRECIP_ID = 'NONPRECIP'
const HAZARD_TYPE_TROPICAL_ID = 'TROPICAL'
const HAZARD_TYPE_WINTER_ID = 'WINTER'
const HAZARD_TYPE_SPECIALWX_ID = 'SPECIALWX'
const HAZARD_TYPE_UNKNOWN_ID = 'UNKNOWN'
const HAZARD_TYPES = [
	HAZARD_TYPE_TORNADO_ID,
	HAZARD_TYPE_SEVERE_ID,
	HAZARD_TYPE_FIRE_ID,
	HAZARD_TYPE_HYDROLOGICAL_ID,
	HAZARD_TYPE_MARINE_ID,
	HAZARD_TYPE_NONMET_ID,
	HAZARD_TYPE_NONPRECIP_ID,
	HAZARD_TYPE_TROPICAL_ID,
	HAZARD_TYPE_WINTER_ID,
	HAZARD_TYPE_SPECIALWX_ID,
    HAZARD_TYPE_UNKNOWN_ID
]
const HAZARD_LEVEL_NAMES = {
	[HAZARD_LEVEL_WARNING_ID]: 'Warning',
	[HAZARD_LEVEL_WATCH_ID]: 'Watch',
	[HAZARD_LEVEL_ADVISORY_ID]: 'Advisory',
	[HAZARD_LEVEL_STATEMENT_ID]: 'Statement',
    [HAZARD_LEVEL_UNKNOWN_ID]: 'Unknown'
}
const HAZARD_TYPE_NAMES = {
	[HAZARD_TYPE_TORNADO_ID]: 'Tornado',
	[HAZARD_TYPE_SEVERE_ID]: 'Severe',
	[HAZARD_TYPE_FIRE_ID]: 'Fire',
	[HAZARD_TYPE_HYDROLOGICAL_ID]: 'Hydro',
	[HAZARD_TYPE_MARINE_ID]: 'Marine',
	[HAZARD_TYPE_NONMET_ID]: 'Non-Met',
	[HAZARD_TYPE_NONPRECIP_ID]: 'Non-Precip',
	[HAZARD_TYPE_TROPICAL_ID]: 'Tropical',
	[HAZARD_TYPE_WINTER_ID]: 'Winter',
	[HAZARD_TYPE_SPECIALWX_ID]: 'Special',
    [HAZARD_TYPE_UNKNOWN_ID]: 'Unknown'
}

const HAZARD_COLORS = {
	[HAZARD_TYPE_TORNADO_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '255,0,0',
		[HAZARD_LEVEL_WATCH_ID]: '255,100,100'
	},
	[HAZARD_TYPE_SEVERE_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '0,100,225',
		[HAZARD_LEVEL_WATCH_ID]: '50,150,255'
	},
	[HAZARD_TYPE_FIRE_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '255,110,0',
		[HAZARD_LEVEL_ADVISORY_ID]: '232,100,0',
		[HAZARD_LEVEL_WATCH_ID]: '209,91,0',
		[HAZARD_LEVEL_STATEMENT_ID]: '186,81,0'
	},
	[HAZARD_TYPE_HYDROLOGICAL_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '66,230,66',
		[HAZARD_LEVEL_ADVISORY_ID]: '33,215,33',
		[HAZARD_LEVEL_WATCH_ID]: '0,180,0',
		[HAZARD_LEVEL_STATEMENT_ID]: '15,150,15'
	},
	[HAZARD_TYPE_MARINE_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '115,225,235',
		[HAZARD_LEVEL_ADVISORY_ID]: '96,185,193',
		[HAZARD_LEVEL_WATCH_ID]: '74,144,150',
		[HAZARD_LEVEL_STATEMENT_ID]: '53,103,107'
	},
	[HAZARD_TYPE_NONMET_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '222,214,187',
		[HAZARD_LEVEL_ADVISORY_ID]: '203,199,171',
		[HAZARD_LEVEL_WATCH_ID]: '183,181,154',
		[HAZARD_LEVEL_STATEMENT_ID]: '163,161,137'
	},
	[HAZARD_TYPE_NONPRECIP_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '225,175,115',
		[HAZARD_LEVEL_ADVISORY_ID]: '185,144,95',
		[HAZARD_LEVEL_WATCH_ID]: '144,112,74',
		[HAZARD_LEVEL_STATEMENT_ID]: '123,96,63'
	},
	[HAZARD_TYPE_TROPICAL_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '230,225,15',
		[HAZARD_LEVEL_ADVISORY_ID]: '213,208,0',
		[HAZARD_LEVEL_WATCH_ID]: '180,176,0',
		[HAZARD_LEVEL_STATEMENT_ID]: '150,146,0'
	},
	[HAZARD_TYPE_WINTER_ID]: {
		[HAZARD_LEVEL_WARNING_ID]: '222,112,236',
		[HAZARD_LEVEL_ADVISORY_ID]: '165,75,180',
		[HAZARD_LEVEL_WATCH_ID]: '135,55,160',
		[HAZARD_LEVEL_STATEMENT_ID]: '130,0,145'
	},
	[HAZARD_TYPE_SPECIALWX_ID]: {
		[HAZARD_LEVEL_STATEMENT_ID]: '150,150,150'
	},
    [HAZARD_TYPE_UNKNOWN_ID]: {
        [HAZARD_LEVEL_UNKNOWN_ID]: '255,255,255'
    }
}

const getAlertIdByEvent = (alertName) => {
	const alertclass = {
		/* CONVECTIVE */
		'Tornado Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TORNADO_ID },
		'Severe Thunderstorm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_SEVERE_ID },
		'Severe Weather Statement': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_SEVERE_ID },
		'Tornado Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TORNADO_ID },
		'Severe Thunderstorm Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_SEVERE_ID },

		/* MARINE */
		'Tsunami Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Special Marine Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Storm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Tsunami Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Tsunami Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'High Surf Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Gale Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Storm Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Lakeshore Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Coastal Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'High Surf Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Heavy Freezing Spray Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Small Craft Advisory for Hazardous Seas': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Small Craft Advisory for Rough Bar': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Small Craft Advisory for Winds': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Small Craft Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Brisk Wind Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Hazardous Seas Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_MARINE_ID },
		'Lake Wind Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Freezing Spray Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Low Water Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_MARINE_ID },
		'Rip Current Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_MARINE_ID },
		'Beach Hazards Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_MARINE_ID },
		'Gale Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Hazardous Seas Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Heavy Freezing Spray Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Coastal Flood Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Lakeshore Flood Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_MARINE_ID },
		'Coastal Flood Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_MARINE_ID },
		'Lakeshore Flood Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_MARINE_ID },
		'Marine Weather Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_MARINE_ID },

		/* FIRE */
		'Fire Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_FIRE_ID },
		'Red Flag Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_FIRE_ID },
		'Fire Weather Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_FIRE_ID },
		'Extreme Fire Danger': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_FIRE_ID },

		/* WINTER */
		'Blizzard Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Snow Squall Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Ice Storm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Winter Storm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Lake Effect Snow Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Wind Chill Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Extreme Cold Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Hard Freeze Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Freeze Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_WINTER_ID },
		'Freezing Rain Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Winter Weather Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Lake Effect Snow Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Wind Chill Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Frost Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Freezing Fog Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_WINTER_ID },
		'Blizzard Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Winter Storm Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Extreme Cold Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Wind Chill Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Lake Effect Snow Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Hard Freeze Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },
		'Freeze Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_WINTER_ID },

		/* TROPCIAL */
		'Storm Surge Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Hurricane Force Wind Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Hurricane Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Typhoon Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Tropical Storm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Storm Surge Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Hurricane Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Hurricane Force Wind Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Typhoon Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Tropical Storm Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Hurricane Local Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Typhoon Local Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Tropical Storm Local Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Tropical Depression Local Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_TROPICAL_ID },
		'Tropical Cyclone Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_TROPICAL_ID },

		/* HYDROLOGICAL */
		'Flash Flood Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flash Flood Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Coastal Flood Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Lakeshore Flood Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flood Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flash Flood Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flood Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Urban And Small Stream Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Small Stream Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Arroyo And Small Stream Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flood Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Hydrologic Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Flood Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },
		'Hydrologic Outlook': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_HYDROLOGICAL_ID },

		/* NON-PRECIP */
		'Extreme Wind Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'High Wind Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Dust Storm Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Blowing Dust Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Excessive Heat Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Heat Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Dense Fog Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Dense Smoke Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Dust Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Blowing Dust Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Wind Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'High Wind Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_NONPRECIP_ID },
		'Excessive Heat Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_NONPRECIP_ID },

		/* NON-METEOROLOGICAL */
		'Civil Danger Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Nuclear Power Plant Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Radiological Hazard Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Hazardous Materials Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Civil Emergency Message': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONMET_ID },
		'Law Enforcement Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Avalanche Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Earthquake Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Volcano Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Ashfall Warning': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Avalanche Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONMET_ID },
		'Ashfall Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONMET_ID },
		'Local Area Emergency': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Child Abduction Emergency': { level: HAZARD_LEVEL_WARNING_ID, type: HAZARD_TYPE_NONMET_ID },
		'Avalanche Watch': { level: HAZARD_LEVEL_WATCH_ID, type: HAZARD_TYPE_NONMET_ID },
		'911 Telephone Outage': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_NONMET_ID },
		'Air Quality Alert': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONMET_ID },
		'Air Stagnation Advisory': { level: HAZARD_LEVEL_ADVISORY_ID, type: HAZARD_TYPE_NONMET_ID },

		/* SPECIAL CASES */
		'Special Weather Statement': { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_SPECIALWX_ID },

		/* DEFAULT */
		default: { level: HAZARD_LEVEL_STATEMENT_ID, type: HAZARD_TYPE_SPECIALWX_ID }
		// known occurances
		// Hydrologic Outlook - fcst - likely to be filtered out
	}

    if (alertclass[alertName]){
        console.log(`Unknown Alert: ${alertName}`)
        return {

        }
    } else {
        return {
            hazard_type: alertclass[alertName].type,
            hazard_type_name: HAZARD_TYPE_NAMES[alertclass[alertName].type],
            hazard_level: alertclass[alertName].level,
            hazard_level_name: HAZARD_LEVEL_NAMES[alertclass[alertName].level],
            color_rgb: HAZARD_COLORS[alertclass[alertName].type][alertclass[alertName].level],
            color_hex: `#${HAZARD_COLORS[alertclass[alertName].type][alertclass[alertName].level].replace(/,/g, '')}`
        }
    }



	return alertclass[alertName] || alertclass['default']
}

function cachingResult(success, message){
    return {
        success: success,
        message: message
    }
}

function rewindRing(ring, dir) {
    var area = 0, err = 0;
    for (var i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
        var k = (ring[i][0] - ring[j][0]) * (ring[j][1] + ring[i][1]);
        var m = area + k;
        err += Math.abs(area) >= Math.abs(k) ? area - m + k : k - m + area;
        area = m;
    }
    if (area + err >= 0 !== !!dir) ring.reverse();
}

function rewindRings(rings, outer) {
    if (rings.length === 0) return;

    rewindRing(rings[0], outer);
    for (var i = 1; i < rings.length; i++) {
        rewindRing(rings[i], !outer);
    }
}

function rewind(gj, outer) {
    var type = gj && gj.type, i;

    if (type === 'FeatureCollection') {
        for (i = 0; i < gj.features.length; i++) rewind(gj.features[i], outer);

    } else if (type === 'GeometryCollection') {
        for (i = 0; i < gj.geometries.length; i++) rewind(gj.geometries[i], outer);

    } else if (type === 'Feature') {
        rewind(gj.geometry, outer);

    } else if (type === 'Polygon') {
        rewindRings(gj.coordinates, outer);

    } else if (type === 'MultiPolygon') {
        for (i = 0; i < gj.coordinates.length; i++) rewindRings(gj.coordinates[i], outer);
    }

    return gj;
}

async function cacheRegionData(cache){
        // Define Regions
        const REGIONS = {
            CONUS: {
                name: 'Continental United States',
                bounds: [
                    {
                        N: 52.02331008491122,
                        S: 20.747656434501387,
                        E: -59.793669287999734,
                        W: -134.9037846114994,
                    }
                ]
            },
            CANADA: {
                name: 'Canada',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            ALASKA: {
                name: 'Alaska',
                bounds: [
                    {
                        N: 75,
                        S: 49.96458012436583,
                        E: -128.65084365375589,
                        W: -180
                    },
                    {
                        N: 75,
                        S: 49.96458012436583,
                        E: 180,
                        W: 170.00389637915683
                    }
                ]
            },
            HAWAII: {
                name: 'Hawaii',
                bounds: [
                    {
                        N: 26.896294325107885,
                        S: 14.639684806688997,
                        E: -149.9758245405501,
                        W: -164.9797096888613,
                    }
                ]
            },
            PUERTO_RICO: {
                name: 'Puerto Rico',
                bounds: [
                    {
                        N: 20.332413503135466,
                        S: 15.947641065447575,
                        E: -60.77162723097216,
                        W: -71.03669318351179,
                    }
                ]
            },
            GUAM: {
                name: 'Guam',
                bounds: [
                    {
                        N: 23.964138843347023,
                        S: 3.7283673499396666,
                        E: 173.85560189597825,
                        W: 131.62244511353302,
                    }
                ]
            },
            AMERICAN_SAMOA: {
                name: 'American Samoa',
                bounds: [
                    {
                        N: -9.82702519137894,
                        S: -15.206128215457086,
                        E: -168.11074635338161,
                        W: -172.26436826879046,
                    }
                ]
            },
            PANAMA: {
                name: 'Panama',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            MEXICO: {
                name: 'Mexico',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            CUBA: {
                name: 'Cuba',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            GUATEMALA: {
                name: 'Guatemala',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            BELIZE: {
                name: 'Belize',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            HONDURAS: {
                name: 'Honduras',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            EL_SALVADOR: {
                name: 'El Salvador',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            DOMINICAN_REPUBLIC: {
                name: 'Dominican Republic',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            HAITI: {
                name: 'Haiti',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            JAMAICA: {
                name: 'Jamaica',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            BAHAMAS: {
                name: 'Bahamas',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            NICARAGUA: {
                name: 'Nicaragua',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
            COSTA_RICA: {
                name: 'Costa Rica',
                bounds: [
                    {
                        N: 0,
                        S: 0,
                        E: 0,
                        W: 0,
                    }
                ]
            },
        }
    
        // Create states, coasts and offshore arrays for each region
        for (let region in REGIONS){
            REGIONS[region].states = {}
            REGIONS[region].coasts = {}
            REGIONS[region].offshores = {}
        }
    
        // State To Region Assigning Function
        function getRegionByState(state){
            targetRegion = null
            switch (state){
                case 'AK':
                    targetRegion = REGIONS['ALASKA']
                    break
                case 'HI':
                    targetRegion = REGIONS['HAWAII']
                    break
                case 'PR':
                    targetRegion = REGIONS['PUERTO_RICO']
                    break
                case 'GU':
                    targetRegion = REGIONS['GUAM']
                    break
                case 'AS':
                    targetRegion = REGIONS['AMERICAN_SAMOA']
                    break
                default:
                    targetRegion = REGIONS['CONUS']
                    break
            }
            return targetRegion
        }
    
        // Canada Province Naming Function
        function getProvinceNameByAlphaCode(alphaCode){
            switch (alphaCode){
                case 'AB':
                    return 'Alberta'
                case 'BC':
                    return 'British Columbia'
                case 'MB':
                    return 'Manitoba'
                case 'NB':
                    return 'New Brunswick'
                case 'NL':
                    return 'Newfoundland and Labrador'
                case 'NS':
                    return 'Nova Scotia'
                case 'NT':
                    return 'Northwest Territories'
                case 'NU':
                    return 'Nunavut'
                case 'ON':
                    return 'Ontario'
                case 'PE':
                    return 'Prince Edward Island'
                case 'QC':
                    return 'Quebec'
                case 'SK':
                    return 'Saskatchewan'
                case 'YT':
                    return 'Yukon'
                default:
                    return null
            }
        }
    
        // Coast & Offshore To Region Assigning Function
        function getRegionByCoastOrOffshore(lat, lon){
            for (const regionName in REGIONS) {
                const region = REGIONS[regionName]
                for (let bound of region.bounds){
                    const { N, S, E, W } = bound
                    if (lat <= N && lat >= S && lon <= E && lon >= W) {
                        return region
                    }
                }
            }
            return null
        }
    
        // Simplify Geometry Function
        function simplifyGeoJson(geoJson, tolerance = 0.001, debug = false){
            geoJson = rewind(geoJson)
            const simplifiedGeoJson = geoJson.features.map((feature) => {
                if (debug) {
                    console.log('feature', feature)
                }
                if (feature.geometry?.type === 'Polygon') {
                    if (feature.geometry.coordinates[0].length <= 4) {
                        return feature
                    }
                    const simplifiedPolygon = simplify(polygon(feature.geometry.coordinates), { tolerance, highQuality: true })
                    return { ...simplifiedPolygon, properties: feature.properties }
                } else if (feature.geometry?.type === 'MultiPolygon') {
                    const multiPolygonShape = multiPolygon(feature.geometry.coordinates)
                    if (kinks(multiPolygonShape).features.length > 0) {
                        if (debug) {
                            console.warn('Invalid multipolygon detected, skipping simplification')
                        }
                        return feature
                    }
                    const simplifiedMultiPolygon = simplify(multiPolygonShape, {
                        tolerance,
                        highQuality: true
                    })
                    return { ...simplifiedMultiPolygon, properties: feature.properties }
                }
            })
        
            return { type: 'FeatureCollection', features: simplifiedGeoJson.filter((feature) => feature !== undefined) }
        }
    
        // Fetch Canada provinces
        let canadaData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/canada.json')
            canadaData = simplifyGeoJson(feature(response.data, response.data.objects.collection))
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Modify canada provinces and assign to canada
        for (let province of canadaData.features){
            const provinceWithName = province
            provinceWithName.properties.ALPHA_CODE = province.properties.NAME
            provinceWithName.properties.NAME = getProvinceNameByAlphaCode(province.properties.NAME)
            REGIONS['CANADA'].states[provinceWithName.properties.ALPHA_CODE] = {
                ...provinceWithName,
                counties: []
            }
    
        }
    
        // Fetch Mexico & Others
        let mexicoAndOthersData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/mexi-cuba.json')
            mexicoAndOthersData = simplifyGeoJson(feature(response.data, response.data.objects.collection))
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Normalize Mexico & Other states and assign to region
        for (let state of mexicoAndOthersData.features){
            targetRegionName = null
            switch (state.properties.name){
                case 'Panama':
                    targetRegionName = 'PANAMA'
                    break
                case 'Mexico':
                    targetRegionName = 'MEXICO'
                    break
                case 'Cuba':
                    targetRegionName = 'CUBA'
                    break
                case 'Guatemala':
                    targetRegionName = 'GUATEMALA'
                    break
                case 'Belize':
                    targetRegionName = 'BELIZE'
                    break
                case 'Honduras':
                    targetRegionName = 'HONDURAS'
                    break
                case 'El Salvador':
                    targetRegionName = 'EL_SALVADOR'
                    break
                case 'Dominican Rep.':
                    targetRegionName = 'DOMINICAN_REPUBLIC'
                    break
                case 'Haiti':
                    targetRegionName = 'HAITI'
                    break
                case 'Jamaica':
                    targetRegionName = 'JAMAICA'
                    break
                case 'Bahamas':
                    targetRegionName = 'BAHAMAS'
                    break
                case 'Nicaragua':
                    targetRegionName = 'NICARAGUA'
                    break
                case 'Costa Rica':
                    targetRegionName = 'COSTA_RICA'
                    break
                default:
                    targetRegionName = null
                    break
            }
            if (!targetRegionName){
                continue
            }
            REGIONS[targetRegionName].states[targetRegionName] = {
                ...state,
                counties: {}
            }
        }
    
        // Fetch US states
        let stateData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/us-states-nws.json')
            stateData = simplifyGeoJson(feature(response.data, response.data.objects.states))
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Assign states to regions
        for (let state of stateData.features){
            getRegionByState(state.properties.STATE).states[state.properties.STATE] = {
                ...state,
                counties: {}
            }
        }
    
        // Fetch counties
        let countyData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/us-counties-nws.json')
            countyData = simplifyGeoJson(feature(response.data, response.data.objects.counties))
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Assign counties to states
        for (let county of countyData.features){
            const state = county.properties.STATE
            const countyFIPS = county.properties.FIPS
            getRegionByState(state).states[county.properties.STATE].counties[countyFIPS] = {
                ...county,
                alerts: {}
            }
        }
    
        // Fetch coasts
        let coastData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/coastal.json')
            coastData = simplifyGeoJson(response.data)
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Assign coasts to regions
        for (let coast of coastData.features){
            const region = getRegionByCoastOrOffshore(coast.properties.LAT, coast.properties.LON)
            if (!region){
                //console.log('No region found for coast:', coast.properties.ID, coast.properties.NAME)
                continue
            }
            region.coasts[coast.properties.ID] = {
                ...coast,
                alerts: {}
            }
        }
    
        // for (let region in REGIONS){
        //     console.log(`===== ${region} =====`)
        //     for (let coast in REGIONS[region].coasts){
        //         console.log(`ID: ${coast} | Name: ${REGIONS[region].coasts[coast].properties.NAME}`)
        //     }
        // }
        // return
    
        // Fetch offshores
        let offshoreData = null
        try {
            const response = await axios.get('https://weather.cod.edu/text/exper/assets/json/old/offshore.json')
            offshoreData = simplifyGeoJson(response.data)
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // Assign offshores to regions
        for (let offshore of offshoreData.features){
            const region = getRegionByCoastOrOffshore(offshore.properties.LAT, offshore.properties.LON)
            if (!region){
                //console.log('No region found for offshore:', offshore.properties.ID, offshore.properties.Name)
                continue
            }
            region.offshores[offshore.properties.ID] = {
                ...offshore,
                alerts: {}
            }
        }
    
        // for (let region in REGIONS){
        //     console.log(`===== ${region} =====`)
        //     for (let offshore in REGIONS[region].offshores){
        //         console.log(`ID: ${offshore} | Name: ${REGIONS[region].offshores[offshore].properties.Name}`)
        //     }
        // }
        //return
    
        // Fetch weather alerts
        let hazardData = null
        try {
            const response = await axios.get('https://climate.cod.edu/data/text/alerts.json')
            hazardData = response.data
        } catch (error) {
            return cachingResult(false, error)
        }
    
        // for (let hazard of hazardData.features){
        //     console.log(hazard.properties.event)
        //     console.log(getAlertIdByEvent(hazard.properties.event))
        //     break
        // }

        // return

        // Assign alerts to counties, coasts and offshores
        for (let [currentRegionKey, currentRegion] of Object.entries(REGIONS)){
            // Assign to counties
            for (let [currentStateKey, currentState] of Object.entries(currentRegion.states)){
                for (let [currentCountyKey, currentCounty] of Object.entries(currentState.counties)){
                    for (let currentHazard of hazardData.features){
                        if ('SAME' in currentHazard.properties.geocode === false){
                            continue
                        }
                        for (let currentSAMECode of currentHazard.properties.geocode.SAME){
                            const intSAMECode = parseInt(currentSAMECode)
                            const strSAMECode = intSAMECode.toString()
                            if (currentCounty.properties.FIPS === strSAMECode){
                                currentCounty.alerts[currentHazard.id] = currentHazard
                            }
                        }
                    }
                }
            }
            // Assign to coasts
            for (let [currentCoastKey, currentCoast] of Object.entries(currentRegion.coasts)){
                for (let currentHazard of hazardData.features){
                    if ('UGC' in currentHazard.properties.geocode === false){
                        continue
                    }
                    for (let currentUGCCode of currentHazard.properties.geocode.UGC){
                        if (currentCoast.properties.ID === currentUGCCode){
                            currentCoast.alerts[currentHazard.id] = currentHazard
                        }
                    }
                }
            }
            // Assign to offshores
            for (let [currentOffshoreKey, currentOffshore] of Object.entries(currentRegion.offshores)){
                for (let currentHazard of hazardData.features){
                    if ('UGC' in currentHazard.properties.geocode === false){
                        continue
                    }
                    for (let currentUGCCode of currentHazard.properties.geocode.UGC){
                        if (currentOffshore.properties.ID === currentUGCCode){
                            currentOffshore.alerts[currentHazard.id] = currentHazard
                        }
                    }
                }
            }
        }
    
        // for (let [currentStateKey, currentState] of Object.entries(REGIONS['GUAM'].states)){
        //     console.log('===== COUNTIES =====')
        //     for (let [currentCountyKey, currentCounty] of Object.entries(currentState.counties)){
        //         for (let currentAlert of currentCounty.alerts){
        //             console.log(currentAlert.id)
        //         }
        //     }
        //     console.log('===== COASTS =====')
        //     for (let [currentCoastKey, currentCoast] of Object.entries(REGIONS['GUAM'].coasts)){
        //         for (let currentAlert of currentCoast.alerts){
        //             console.log(currentAlert.id)
        //         }
        //     }
        //     console.log('===== OFFSHORES =====')
        //     for (let [currentOffshoreKey, currentOffshore] of Object.entries(REGIONS['GUAM'].offshores)){
        //         for (let currentAlert of currentOffshore.alerts){
        //             console.log(currentAlert.id)
        //         }
        //     }
        // }
        // return

        cache.set('regionData', REGIONS)
        console.log('Region data updated...')
        return cachingResult(true, 'OK')
}

module.exports = cacheRegionData