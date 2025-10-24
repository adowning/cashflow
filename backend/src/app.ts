import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { writeFileSync } from 'fs';
import { join } from 'path';

import createApp from './lib/create-app';
import configureOpenAPI from './lib/configure-open-api';
import { authRoutes } from './services/auth/auth.router';
import { getAllGamesRoute } from './services/games/games.router';
import { userRoutes } from './services/user/routes/user.router';
import { dashboardRoutes } from './services/dashboard/dashboard.router';

const app = createApp();

// Define allowed origins for CORS
const allowedOrigins = new Set<string>([
  'http://localhost',
  'https://localhost/',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:9999',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://192.168.1.35:3000',
  'https://slots.cashflowcasino.com',
  'https://app.cashflowcasino.com',
  'https://api.cashflowcasino.com',
  'https://apidev.cashflowcasino.com',
  'https://4000.cashflowcasino.com',
]);

// Apply CORS middleware to all routes
app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.has(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'Upgrade-Insecure-Requests',
      'Cache-Control',
      'Pragma',
    ],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    credentials: true,
    maxAge: 600,
  })
);

// Configure OpenAPI documentation
configureOpenAPI(app);

// --- API ROUTING ---
// Create a separate Hono instance for API routes for clear separation
// const api =  createApp();

const routes = [
  // userRoutes,
  // authRoutes,
  getAllGamesRoute,
  // dashboardRoutes,
] as const;

// Register all API modules under the /api base path
// const routes = []
routes.forEach((route) => {
  // app.route('/', route);
    // app.basePath("/api").route("/", route);

});
// const routes = app.route('/auth', authRoutes).route('/games', gameRoutes).route('/users', userRoutes).route('/dashboard', dashboardRoutes)

// Mount the API router to the main app instance
// app.route('/api', routes);

export type AppType = typeof app;

console.log('[DEBUG] API routes registered under /api.');


// --- STATIC FILE SERVING ---
// Serve static files AFTER API routes to prevent conflicts.
// This is the fallback for any request that doesn't match an API route.
app.use('/games/*', serveStatic({ root: '../public' }));
app.use('/*', serveStatic({ root: '../public' }));

console.log('[DEBUG] Static file serving registered.');


// Export types for external use
// export type AppType = typeof modules//modules)[number];

// Function to download the OpenAPI specification
async function downloadOpenAPISpec()
{
  try {
    const response = await fetch('http://localhost:6001/doc');
    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`
      );
    }
    const openapiSpec = await response.json();
    const rootDir = process.cwd();
    const openapiPath = join(rootDir, '../', 'openapi.json');
    writeFileSync(openapiPath, JSON.stringify(openapiSpec, null, 2));
    console.log('OpenAPI specification saved to openapi.json');
  } catch (error) {
    console.error('Error downloading OpenAPI specification:', error);
  }
}

// Download spec shortly after server start
setTimeout(downloadOpenAPISpec, 2000);

export default app;


// // import configureOpenAPI from "#/lib/configure-open-api";
// // import createApp from "#/lib/create-app";
// // import { startRtpWorker } from "#/lib/rtp.worker";
// import {authRoutes} from './services/auth/auth.router';
// // import game from "#/modules/games/games.router";
// import { writeFileSync } from 'fs';
// import { join } from 'path';
// // import index from "#/modules/index.route";
// // import dashboard from "#/modules/dashboard/dashboard.router";
// // import operator from "#/modules/operator/operator.router";
// // import php from "#/modules/php/php.router";
// // import redtiger from "#/modules/redtiger/redtiger.router";
// // import referrals from "#/modules/referral-code/referral.router";
// // import reward from "#/modules/rewards/reward.router";
// // import transactions from "#/modules/transaction/transaction.router";
// // import updates from "#/modules/updates/updates.router";
// // import users from "#/modules/user/user.router";
// // import vip from "#/modules/vip/vip.router";
// // import wallet from "#/modules/wallet/wallet.router";
// import { serveStatic } from 'hono/bun';
// import { cors } from 'hono/cors';
// import { userRoutes } from './services/user/routes/user.router';
// import configureOpenAPI from './lib/configure-open-api';
// import createApp from './lib/create-app';
// import { gameRoutes } from './services/games/games.router';
// import { dashboardRoutes } from './services/dashboard/dashboard.router';

// // const app = createApp();
// // const app = new OpenAPIHono();
// const app = createApp();

// const allowedOrigins = new Set<string>([
//   'http://localhost',
//   'https://localhost/',
//   'http://localhost:5173',
//   'http://localhost:5174',
//   'http://localhost:9999',
//   'http://localhost:3001',
//   'http://localhost:3000',
//   'http://localhost:4000',
//   'http://192.168.1.35:3000',
//   'https://slots.cashflowcasino.com',
//   'https://app.cashflowcasino.com',
//   'https://api.cashflowcasino.com',
//   'https://apidev.cashflowcasino.com',
//   'https://4000.cashflowcasino.com',
// ]);

// app.use(
//   '*',
//   cors({
//     origin: (origin) =>
//     {
//       if (allowedOrigins.has(origin)) {
//         return origin;
//       }
//       return ''; // Block by returning an empty string
//     },
//     allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowHeaders: [
//       'Authorization',
//       'Content-Type',
//       'X-Requested-With',
//       'Upgrade-Insecure-Requests',
//       'Cache-Control',
//       'Pragma',
//     ],
//     exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
//     credentials: true,
//     maxAge: 600,
//   })
// );

// configureOpenAPI(app);



// const modules = [
//   // index,
//   // updates,
//   userRoutes,
//   // transactions,
//   // reward,
//   // wallet,
//   // referrals,
//   authRoutes,
//   // game,
//   gameRoutes,
//   dashboardRoutes,
//   // vip,
//   // dashboard,
//   // operator,
//   // redtiger,
//   // php,
// ] as const;

// modules.forEach((route) =>
// {
//   app.route('/api/', route);
// });

// app.use('/*', serveStatic({ root: '../public' }));

// console.log(
//   '[DEBUG] Static file serving registered for path /* with root: ../public'
// );
// app.use('/games/*', serveStatic({ root: '../public' }));

// console.log(
//   '[DEBUG] Static file serving registered for path /games/* with root: ../public'
// );

// // Debug log to verify API routes are registered after static middleware
// console.log('[DEBUG] API routes registered after static middleware');

// export type AppType = (typeof modules)[number];
// export type ApplicationType = typeof app;

// // Function to download OpenAPI specification
// async function downloadOpenAPISpec()
// {
//   try {
//     // Fetch the OpenAPI specification from the /doc endpoint
//     const response = await fetch('http://localhost:6001/doc');
//     if (!response.ok) {
//       throw new Error(
//         `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`
//       );
//     }

//     const openapiSpec = await response.json();

//     // Write the specification to openapi.json in the root directory
//     const rootDir = process.cwd();
//     const openapiPath = join(rootDir + '/../', 'openapi.json');
//     writeFileSync(openapiPath, JSON.stringify(openapiSpec, null, 2));

//     console.log('OpenAPI specification saved to openapi.json');
//   } catch (error) {
//     console.error('Error downloading OpenAPI specification:', error);
//   }
// }

// // Start the background worker
// // startRtpWorker();

// // // Download OpenAPI specification after a short delay to ensure server is ready
// setTimeout(downloadOpenAPISpec, 1000);

// export default app;
