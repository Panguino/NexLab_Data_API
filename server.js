(async () => {
  // Third party
  const express = require('express');
  const { ApolloServer } = require('apollo-server-express');
  const { execute, subscribe } = require('graphql');
  const { SubscriptionServer } = require('subscriptions-transport-ws');
  const { makeExecutableSchema } = require('@graphql-tools/schema');
  const { createServer } = require('http');
  const { PubSub } = require('graphql-subscriptions');
  const cors = require('cors');
  const depthLimit = require('graphql-depth-limit');
  const NodeCache = require('node-cache');
  require('dotenv').config();

  // Setup Cache
  const cache = new NodeCache({
    useClones: false,
  });

  // Schema + Resolvers
  const resolvers = require('./src/graphql/resolvers');
  const schema = require('./src/graphql/schema');

  // Defaut async iterator
  const pubsub = new PubSub();

  // Cache Weather Function
  const cacheRegionData = require('./src/util/jobs/cacheRegionData');

  // Schedule setup for archiving jobs
  const { setup: setupSchedule } = require('./schedule');

  // Hazards Routes
  const hazardsRouter = require('./src/routes/hazards');
  const alertHistoryRouter = require('./src/routes/alertHistory');
  const alertHistoryOptimizedRouter = require('./src/routes/alertHistoryOptimized');
  const apiDocsRouter = require('./src/routes/apiDocs');

  // Create executable schema
  const execSchema = makeExecutableSchema({
    typeDefs: schema,
    resolvers,
  });

  // Setup Server
  const app = express();
  const httpServer = createServer(app);
  // Define Subscription Server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema: execSchema,
      execute,
      subscribe,
      onConnect(connectionParams, webSocket, context) {
        console.log('Connected');
        return {
          pubsub: pubsub,
        };
      },
      onDisconnect(webSocket, context) {
        console.log('Disconnected');
      },
    },
    {
      server: httpServer,
      path: '/graphql',
    }
  );
  // Define Server Properties
  const server = new ApolloServer({
    cors: {
      origin: '*',
      credentials: true,
    },
    typeDefs: schema,
    resolvers,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    debug: false,
    validationRules: [depthLimit(10)],
    context: async ({ req }) => {
      const remoteAddress = req.ip;
      return {
        pubsub: pubsub,
        ip: remoteAddress,
        cache: cache,
      };
    },
  });
  app.enable('trust proxy');
  app.use(cors());

  app.use(express.json());
  app.use(express.text());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  // Store cache in app.locals for route access
  app.locals.cache = cache;

  // Register API documentation route
  app.use('/api/docs', apiDocsRouter);

  // Register hazards REST API routes
  app.use('/api/hazards', hazardsRouter);

  // Register alert history REST API routes
  app.use('/api/alerts/history', alertHistoryRouter);

  // Register optimized alert history REST API routes
  app.use('/api/alerts/history', alertHistoryOptimizedRouter);

  console.log((process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB');

  // Initially cache region data
  const cacheRegionDataResult = await cacheRegionData(cache);
  if (!cacheRegionDataResult.success) {
    console.log(`Failed caching initial region data: ${cacheRegionDataResult.message}`);
    return;
  }

  // Start Server
  server.start();
  server.applyMiddleware({ app });

  httpServer.listen({ port: process.env.PORT }, async () => {
    console.log(`Server ready at ${process.env.SITE_URL}:${process.env.PORT}${server.graphqlPath}`);

    // Setup scheduled jobs (archiving, etc.)
    setupSchedule(cache);

    setInterval(async () => {
      console.log('--RAM Usage: ' + (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB');
      console.log('running cache job');
      await cacheRegionData(cache);
    }, 30000);
  });
})();
