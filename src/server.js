import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { initDatabase } from './db/database.js';
import { createEmailSender } from './email/sender.js';
import { renderTemplate } from './templates/renderer.js';
import { registerWebhookRoutes } from './routes/webhooks.js';
import { registerTrackingRoutes } from './routes/tracking.js';
import { registerUnsubscribeRoutes, generateUnsubscribeToken } from './routes/unsubscribe.js';
import { runSchedulerCycle } from './scheduler/worker.js';

/**
 * Builds and configures the Fastify application server.
 * @param {object} envOverrides - Optional config overrides for testing
 */
export async function buildServer(envOverrides = {}) {
  const config = loadConfig({ ...process.env, ...envOverrides });
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

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', store: config.shopDomain }));

  // Register feature routes
  await registerWebhookRoutes(app, { db, secret: config.shopifyWebhookSecret });
  await registerTrackingRoutes(app, { db });
  await registerUnsubscribeRoutes(app, { db, secret: config.shopifyWebhookSecret });

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
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
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
