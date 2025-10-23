const express = require('express');
const router = express.Router();

/**
 * GET /api/docs
 * Returns comprehensive API documentation and schema information
 * Perfect for AI agents to understand available endpoints and parameters
 */
router.get('/', (req, res) => {
  const apiDocs = {
    success: true,
    version: '1.0.0',
    baseUrl: process.env.SITE_URL || 'http://localhost:4400',
    timestamp: new Date().toISOString(),
    description: 'NexLab Weather Alerts API - Complete endpoint documentation',
    
    endpoints: {
      // HAZARDS ENDPOINTS
      hazards: {
        category: 'Real-time Hazards',
        description: 'Get active weather hazards with real-time data',
        endpoints: [
          {
            method: 'GET',
            path: '/api/hazards',
            description: 'Get all active hazards with optional filters',
            queryParameters: {
              region: {
                type: 'string',
                description: 'Filter by region',
                examples: ['CONUS', 'ALASKA', 'HAWAII'],
                required: false,
              },
              state: {
                type: 'string',
                description: 'Filter by state code (2-letter)',
                examples: ['FL', 'CA', 'TX'],
                required: false,
              },
              hazardType: {
                type: 'string',
                description: 'Filter by hazard type',
                examples: ['TORNADO', 'SEVERE', 'FIRE', 'WINTER', 'MARINE'],
                required: false,
              },
              hazardLevel: {
                type: 'string',
                description: 'Filter by hazard level',
                examples: ['WARNING', 'WATCH', 'ADVISORY', 'STATEMENT'],
                required: false,
              },
            },
            exampleUrl: '/api/hazards?region=CONUS&hazardType=TORNADO',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              data: 'array of hazard objects',
              timestamp: 'ISO 8601 datetime',
            },
          },
          {
            method: 'GET',
            path: '/api/hazards/county/:fips',
            description: 'Get hazards for a specific county by FIPS code',
            pathParameters: {
              fips: {
                type: 'string',
                description: 'County FIPS code (5 digits)',
                examples: ['12086', '06083', '36061'],
                required: true,
              },
            },
            exampleUrl: '/api/hazards/county/12086',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              data: 'array of hazard objects for county',
              timestamp: 'ISO 8601 datetime',
            },
          },
          {
            method: 'GET',
            path: '/api/hazards/state/:state',
            description: 'Get hazards for a specific state',
            pathParameters: {
              state: {
                type: 'string',
                description: 'State code (2-letter)',
                examples: ['FL', 'CA', 'TX'],
                required: true,
              },
            },
            exampleUrl: '/api/hazards/state/FL',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              data: 'array of hazard objects for state',
              timestamp: 'ISO 8601 datetime',
            },
          },
          {
            method: 'GET',
            path: '/api/hazards/region/:region',
            description: 'Get hazards for a specific region',
            pathParameters: {
              region: {
                type: 'string',
                description: 'Region name',
                examples: ['CONUS', 'ALASKA', 'HAWAII'],
                required: true,
              },
            },
            exampleUrl: '/api/hazards/region/CONUS',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              data: 'array of hazard objects for region',
              timestamp: 'ISO 8601 datetime',
            },
          },
        ],
      },

      // ALERT HISTORY ENDPOINTS
      alertHistory: {
        category: 'Historical Alerts',
        description: 'Get historical alert data with deduplication and timeline tracking',
        endpoints: [
          {
            method: 'GET',
            path: '/api/alerts/history/optimized',
            description: 'Get deduplicated alerts for a specific date with timeline',
            queryParameters: {
              date: {
                type: 'string',
                format: 'YYYY-MM-DD',
                description: 'Date to query (required)',
                examples: ['2025-10-23', '2025-10-22'],
                required: true,
              },
              region: {
                type: 'string',
                description: 'Filter by region (optional)',
                examples: ['CONUS', 'ALASKA'],
                required: false,
              },
            },
            exampleUrl: '/api/alerts/history/optimized?date=2025-10-23&region=CONUS',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              date: 'YYYY-MM-DD',
              region: 'string',
              data: {
                alerts: 'object with alert ID keys, each containing full alert data with locations array',
                timeline: 'array of snapshot events with timestamps',
              },
            },
            notes: [
              'Returns deduplicated alerts (each alert appears once)',
              'Includes timeline of when alerts were created/updated/expired',
              'Locations are reconstructed from normalized database structure',
              'Backward compatible with old snapshot formats',
            ],
          },
          {
            method: 'GET',
            path: '/api/alerts/history/last',
            description: 'Get alerts from the last N hours',
            queryParameters: {
              hours: {
                type: 'integer',
                description: 'Number of hours to look back (default: 24, max: 720)',
                examples: [1, 6, 24, 48],
                required: false,
              },
              region: {
                type: 'string',
                description: 'Filter by region (optional)',
                examples: ['CONUS', 'ALASKA'],
                required: false,
              },
            },
            exampleUrl: '/api/alerts/history/last?hours=24&region=CONUS',
            responseSchema: {
              success: 'boolean',
              message: 'string',
              hours: 'integer',
              region: 'string',
              data: {
                alerts: 'object with alert ID keys, each containing full alert data with locations array',
                timeline: 'array of snapshot events with timestamps',
              },
            },
            notes: [
              'Queries multiple days if hours span multiple days',
              'Returns deduplicated alerts across all snapshots',
              'Includes timeline of all changes',
              'Hours must be between 1 and 720 (30 days)',
            ],
          },
        ],
      },

      // GRAPHQL ENDPOINT
      graphql: {
        category: 'GraphQL API',
        description: 'GraphQL endpoint for complex queries',
        endpoints: [
          {
            method: 'POST',
            path: '/graphql',
            description: 'GraphQL query endpoint',
            exampleUrl: '/graphql',
            notes: [
              'Supports queries, mutations, and subscriptions',
              'Use /graphql for interactive GraphQL playground',
              'Depth limit: 10 levels',
            ],
          },
        ],
      },
    },

    // ALERT DATA SCHEMA
    alertSchema: {
      description: 'Structure of alert objects returned by API',
      fields: {
        id: {
          type: 'string',
          description: 'Unique alert identifier from weather.gov',
          example: 'alert-1',
        },
        event: {
          type: 'string',
          description: 'Type of weather event',
          examples: ['Tornado Warning', 'Severe Thunderstorm Warning', 'Winter Storm Watch'],
        },
        headline: {
          type: 'string',
          description: 'Short headline for the alert',
          example: 'Tornado Warning issued',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the alert',
        },
        severity: {
          type: 'string',
          description: 'Severity level',
          examples: ['Extreme', 'Severe', 'Moderate', 'Minor'],
        },
        urgency: {
          type: 'string',
          description: 'Urgency level',
          examples: ['Immediate', 'Expected', 'Future', 'Past'],
        },
        certainty: {
          type: 'string',
          description: 'Certainty of the alert',
          examples: ['Observed', 'Likely', 'Possible'],
        },
        areaDesc: {
          type: 'string',
          description: 'Description of affected area',
          example: 'Miami-Dade County',
        },
        sent: {
          type: 'ISO 8601 datetime',
          description: 'When the alert was sent',
        },
        effective: {
          type: 'ISO 8601 datetime',
          description: 'When the alert becomes effective',
        },
        onset: {
          type: 'ISO 8601 datetime',
          description: 'When the weather event is expected to begin',
        },
        expires: {
          type: 'ISO 8601 datetime',
          description: 'When the alert expires',
        },
        ends: {
          type: 'ISO 8601 datetime',
          description: 'When the weather event is expected to end',
        },
        locations: {
          type: 'array of location objects',
          description: 'Array of affected locations',
          locationFields: {
            id: 'string - composite key (county-FIPS, coast-ID, or offshore-ID)',
            locationId: 'string - FIPS code or location ID',
            name: 'string - location name',
            type: 'string - county, coast, or offshore',
            state: 'string - state code (if applicable)',
            lat: 'number - latitude',
            lon: 'number - longitude',
          },
        },
      },
    },

    // FILTERING OPTIONS
    filteringOptions: {
      regions: ['CONUS', 'ALASKA', 'HAWAII'],
      states: [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      ],
      hazardTypes: [
        'TORNADO', 'SEVERE', 'FIRE', 'WINTER', 'MARINE', 'FLOOD',
        'WIND', 'HEAT', 'COLD', 'FROST', 'FREEZE',
      ],
      hazardLevels: ['WARNING', 'WATCH', 'ADVISORY', 'STATEMENT'],
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'ISO 8601 (UTC)',
    },

    // USAGE EXAMPLES
    examples: {
      getAllHazards: {
        description: 'Get all active hazards',
        url: '/api/hazards',
      },
      getTornadoWarnings: {
        description: 'Get all tornado warnings in CONUS',
        url: '/api/hazards?region=CONUS&hazardType=TORNADO&hazardLevel=WARNING',
      },
      getCountyHazards: {
        description: 'Get all hazards for Miami-Dade County (FIPS: 12086)',
        url: '/api/hazards/county/12086',
      },
      getFloridaHazards: {
        description: 'Get all hazards in Florida',
        url: '/api/hazards/state/FL',
      },
      getAlertsForDate: {
        description: 'Get all alerts for October 23, 2025',
        url: '/api/alerts/history/optimized?date=2025-10-23',
      },
      getAlertsLast24Hours: {
        description: 'Get all alerts from the last 24 hours',
        url: '/api/alerts/history/last?hours=24',
      },
      getAlertsLast7Days: {
        description: 'Get all alerts from the last 7 days',
        url: '/api/alerts/history/last?hours=168',
      },
    },

    // NOTES FOR AI AGENTS
    aiAgentNotes: {
      description: 'Important information for AI agents using this API',
      points: [
        'All timestamps are in UTC (ISO 8601 format)',
        'Alert IDs are unique identifiers from weather.gov',
        'Locations array contains all affected areas for each alert',
        'Use /api/hazards for real-time data (updated every 30 seconds)',
        'Use /api/alerts/history/* for historical data (stored in S3)',
        'Normalized database structure: locations stored separately from alerts',
        'Each alert can affect multiple locations (counties, coasts, offshores)',
        'Backward compatible with old snapshot formats',
        'Maximum 720 hours (30 days) for historical queries',
        'Region filtering is optional but recommended for performance',
      ],
    },
  };

  res.json(apiDocs);
});

module.exports = router;

