import { Hono } from 'hono';
import { serveStatic, upgradeWebSocket } from 'hono/bun';
import { cors } from 'hono/cors';
import { writeFileSync } from 'fs';
import { join } from 'path';

import createApp from './config/create-app';
import { configureOpenAPI } from './config/configure-openapi';
import games from './features/games/games.router';
import users from './features/user/routes/user.router';
import { dashboardRoutes } from './features/dashboard/dashboard.router';
import { wsRouter } from './app.ws';

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
  }),
);

// Configure OpenAPI documentation
// configureOpenAPI(app);

// --- API ROUTING ---
// Create a separate Hono instance for API routes for clear separation
// const api =  createApp();

const routes = [
  users,
  // authRoutes,
  games,
  dashboardRoutes,
] as const;

// Register all API modules under the /api base path
// const routes = []
routes.forEach((route) => {
  // app.route('/', route);
  app.basePath('/api').route('/', route);
});
// const routes = app.route('/auth', authRoutes).route('/games', gameRoutes).route('/users', userRoutes).route('/dashboard', dashboardRoutes)

// Mount the API router to the main app instance
// app.route('/api', routes);

export type AppType = (typeof routes)[number];

console.log('[DEBUG] API routes registered under /api.');

// --- STATIC FILE SERVING ---
// Serve static files AFTER API routes to prevent conflicts.
// This is the fallback for any request that doesn't match an API route.
app.use('/games/*', serveStatic({ root: './public' }));
app.use('/*', serveStatic({ root: './public' }));

console.log('[DEBUG] Static file serving registered.');

// Export types for external use
// export type AppType = typeof modules//modules)[number];

// Function to download the OpenAPI specification
async function downloadOpenAPISpec() {
  try {
    const response = await fetch('http://localhost:6001/doc');
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
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
// setTimeout(downloadOpenAPISpec, 2000);

export default app;
