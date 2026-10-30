import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// Safely load .env in local dev if file exists; on Railway, variables are in process.env
if (fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch (e) {}
}

import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { initDatabase } from './db/database.js';
import { createEmailSender } from './email/sender.js';
import { renderTemplate } from './templates/renderer.js';
import { registerWebhookRoutes } from './routes/webhooks.js';
import { registerTrackingRoutes } from './routes/tracking.js';
import { registerUnsubscribeRoutes, generateUnsubscribeToken } from './routes/unsubscribe.js';
import { registerAdminRoutes } from './routes/admin.js';
import { runSchedulerCycle } from './scheduler/worker.js';

/**
 * Builds and configures the Fastify application server.
 * @param {object} envOverrides - Optional config overrides for testing
 */
export async function buildServer(envOverrides = {}) {
  const mergedEnv = { ...process.env, ...envOverrides };
  const detectedSecret = mergedEnv.SHOPIFY_WEBHOOK_SECRET ||
    mergedEnv['SHOPIFY WEBHOOK SECRET'] ||
    mergedEnv.SHOPIFY_SECRET ||
    'homecartel_secret_key';

  const config = loadConfig({
    SHOP_DOMAIN: 'homecartel.net',
    ...mergedEnv,
    SHOPIFY_WEBHOOK_SECRET: detectedSecret
  });
  const db = initDatabase(config.dbPath);
  const emailSender = createEmailSender(config);

  const rendererAdapter = {
    render: (templateName, context) => {
      const email = context.email || '';
      const token = email ? generateUnsubscribeToken(email, config.shopifyWebhookSecret) : '';
      const unsubscribeUrl = `${config.appBaseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
      return renderTemplate(templateName, { ...context, unsubscribeUrl });
    }
  };

  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test'
  });

  // Preserve raw request body for accurate HMAC signature validation
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    req.rawBody = body;
    try {
      const json = JSON.parse(body.toString('utf8'));
      done(null, json);
    } catch (err) {
      done(err, undefined);
    }
  });

  // CORS support for storefront tracking
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-Sha256');
    if (req.method === 'OPTIONS') {
      return reply.code(200).send();
    }
  });

  // Root landing endpoint: serves the interactive UI dashboard for browsers, or JSON for API clients
  app.get('/', async (req, reply) => {
    const wantsJson = req.query?.format === 'json' ||
      (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html'));

    if (wantsJson) {
      return {
        status: 'online',
        service: 'HomeCartel Behavioral Email Marketing Engine',
        store: config.shopDomain,
        endpoints: {
          dashboard: '/',
          healthCheck: '/health',
          adminOverview: '/api/admin/overview',
          storefrontTracker: '/homecartel-tracker.js',
          webhooks: '/api/webhooks/shopify/{checkouts,orders,customers,fulfillments}'
        }
      };
    }

    const htmlPath = path.resolve(process.cwd(), 'public/index.html');
    if (fs.existsSync(htmlPath)) {
      reply.header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(fs.readFileSync(htmlPath, 'utf8'));
    }
    return { status: 'online', store: config.shopDomain };
  });

  // Dedicated UI dashboard aliases
  const serveDashboard = async (req, reply) => {
    const htmlPath = path.resolve(process.cwd(), 'public/index.html');
    if (fs.existsSync(htmlPath)) {
      reply.header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(fs.readFileSync(htmlPath, 'utf8'));
    }
    return reply.code(404).send('Dashboard UI not found');
  };
  app.get('/ui', serveDashboard);
  app.get('/admin', serveDashboard);
  app.get('/dashboard', serveDashboard);

  // Serve client tracker script directly
  app.get('/homecartel-tracker.js', async (req, reply) => {
    const trackerPath = path.resolve(process.cwd(), 'public/homecartel-tracker.js');
    if (fs.existsSync(trackerPath)) {
      reply.header('Content-Type', 'application/javascript; charset=utf-8');
      return reply.send(fs.readFileSync(trackerPath, 'utf8'));
    }
    return reply.code(404).send('Tracker script not found');
  });

  // Serve static images directly from public/images
  app.get('/images/:file', async (req, reply) => {
    const filename = path.basename(req.params.file);
    const imagePath = path.resolve(process.cwd(), 'public/images', filename);
    if (fs.existsSync(imagePath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif'
      };
      reply.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      reply.header('Cache-Control', 'public, max-age=86400');
      return reply.send(fs.readFileSync(imagePath));
    }
    return reply.code(404).send('Image not found');
  });

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', store: config.shopDomain }));

  // Register feature routes
  await registerWebhookRoutes(app, { db, secret: config.shopifyWebhookSecret });
  await registerTrackingRoutes(app, { db });
  await registerUnsubscribeRoutes(app, { db, secret: config.shopifyWebhookSecret });
  await registerAdminRoutes(app, { db });

  // Expose services and runner for tests or internal execution
  app.decorate('db', db);
  app.decorate('emailSender', emailSender);
  app.decorate('config', config);
  app.decorate('runScheduler', async (now) => {
    return runSchedulerCycle({
      db,
      sender: emailSender,
      renderer: rendererAdapter,
      now
    });
  });

  return app;
}

// Start server if executed directly
const isMain = process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url);
if (isMain) {
  const app = await buildServer();
  const port = app.config.port;

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`HomeCartel Email Automation server running on port ${port}`);

  // Background scheduler interval (runs every 60s)
  setInterval(async () => {
    try {
      await app.runScheduler();
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, 60000);
}
