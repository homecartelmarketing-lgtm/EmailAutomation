import { renderTemplate } from '../templates/renderer.js';
import { recentWebhookLogs } from './webhooks.js';
import { eventBus } from '../events/bus.js';

/**
 * Registers Admin Dashboard & Simulation Endpoints
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase> }} options
 */
export async function registerAdminRoutes(app, { db }) {
  // Returns store overview, stats, recent jobs, and email logs
  app.get('/api/admin/overview', async () => {
    const raw = db.rawDb;

    const customers = raw.prepare('SELECT * FROM customers ORDER BY id DESC LIMIT 10').all();
    const carts = raw.prepare('SELECT * FROM carts ORDER BY id DESC LIMIT 10').all();
    const jobs = raw.prepare('SELECT * FROM scheduled_jobs ORDER BY id DESC LIMIT 15').all();
    const logs = raw.prepare('SELECT * FROM email_logs ORDER BY id DESC LIMIT 10').all();

    const counts = {
      customers: raw.prepare('SELECT COUNT(*) as c FROM customers').get().c,
      abandonedCarts: raw.prepare("SELECT COUNT(*) as c FROM carts WHERE status = 'abandoned'").get().c,
      recoveredCarts: raw.prepare("SELECT COUNT(*) as c FROM carts WHERE status = 'recovered'").get().c,
      pendingJobs: raw.prepare("SELECT COUNT(*) as c FROM scheduled_jobs WHERE status = 'pending'").get().c,
      sentEmails: raw.prepare('SELECT COUNT(*) as c FROM email_logs').get().c,
      totalEvents: raw.prepare('SELECT COUNT(*) as c FROM events').get().c
    };

    return { counts, customers, carts, jobs, logs, recentWebhookLogs };
  });

  // Diagnostics endpoint for live troubleshooting
  app.get('/api/admin/diagnostics', async () => {
    const sec = app.config.shopifyWebhookSecret || '';
    return {
      status: 'online',
      shopDomain: app.config.shopDomain,
      secretConfigured: sec ? `${sec.substring(0, 6)}... (${sec.length} chars)` : 'none',
      emailProvider: app.config.emailProvider,
      appBaseUrl: app.config.appBaseUrl,
      recentWebhookAttempts: recentWebhookLogs
    };
  });

  // Real-time shopper events feed
  app.get('/api/admin/events', async (req) => {
    const limit = Math.min(Number(req.query?.limit) || 50, 200);
    const rawEvents = db.getRecentEvents(limit);

    const events = rawEvents.map(ev => {
      let parsedProps = {};
      try {
        parsedProps = typeof ev.properties_json === 'string' ? JSON.parse(ev.properties_json) : (ev.properties_json || {});
      } catch (e) {}

      return {
        id: ev.id,
        visitorId: ev.visitor_id,
        customerId: ev.customer_id,
        customerEmail: ev.customer_email || null,
        customerName: ev.customer_name || null,
        eventType: ev.event_type,
        properties: parsedProps,
        createdAt: ev.created_at,
        isIdentified: !!ev.customer_id
      };
    });

    return { events, count: events.length };
  });

  // Real-time Server-Sent Events (SSE) Stream
  app.get('/api/admin/events/stream', (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders?.();

    // Initial handshake ping
    reply.raw.write(': connected\n\n');

    const listener = (data) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {}
    };

    eventBus.on('event', listener);

    const pingInterval = setInterval(() => {
      try { reply.raw.write(': ping\n\n'); } catch (e) {}
    }, 20000);

    req.raw.on('close', () => {
      clearInterval(pingInterval);
      eventBus.off('event', listener);
    });
  });

  // Simulator helper to test behavioral triggers live
  app.post('/api/admin/simulate', async (req, reply) => {
    const { scenario, data = {} } = req.body || {};

    if (scenario === 'welcome') {
      const email = data.email || `new.shopper.${Math.floor(Math.random() * 1000)}@gmail.com`;
      const name = data.name || 'Maria Santos';
      db.upsertCustomer({ email, name });
      db.scheduleJob({
        flowType: 'welcome',
        recipientEmail: email,
        contextJson: JSON.stringify({ name }),
        executeAt: new Date().toISOString()
      });
      return { success: true, message: `Welcome email scheduled for ${email}`, email };
    }

    if (scenario === 'abandoned_cart') {
      const email = data.email || 'sophia.designer@studio.ph';
      const checkoutId = String(Date.now());
      const items = [
        { title: 'Aura Modern Brass Chandelier', price: '₱18,500.00', quantity: 1 },
        { title: 'Solomon Nordic Pendant Light', price: '₱4,200.00', quantity: 2 }
      ];

      db.upsertCustomer({ email, name: 'Sophia Reyes' });
      db.upsertCart({
        checkoutId,
        email,
        cartToken: 'tok_' + checkoutId,
        itemsJson: JSON.stringify(items),
        subtotal: '26900.00',
        recoveryUrl: `https://homecartel.net/checkouts/${checkoutId}`,
        status: 'abandoned'
      });

      db.scheduleJob({
        flowType: 'abandoned_cart',
        recipientEmail: email,
        contextJson: JSON.stringify({
          checkoutId,
          recoveryUrl: `https://homecartel.net/checkouts/${checkoutId}`,
          items
        }),
        executeAt: new Date(Date.now() + 1000).toISOString()
      });

      return { success: true, message: `Abandoned cart trigger created for ${email}`, checkoutId, email };
    }

    if (scenario === 'order_complete') {
      const email = data.email || 'sophia.designer@studio.ph';
      db.cancelPendingJobsByEmail(email, 'abandoned_cart');
      db.rawDb.prepare("UPDATE carts SET status = 'recovered' WHERE email = ?").run(email);
      return { success: true, message: `Order completed for ${email}. Abandoned cart email cancelled!` };
    }

    if (scenario === 'run_scheduler') {
      // Advance virtual time by 30 days so any queued jobs (even +2h or +7d) are processed immediately
      const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const cycle = await app.runScheduler(farFuture);
      const msg = cycle.sent > 0
        ? `⚡ Dispatched ${cycle.sent} email(s) successfully!`
        : `Scheduler cycle completed: 0 emails sent (${cycle.skipped} skipped, ${cycle.cancelled} failed/cancelled).`;
      return { success: true, message: msg, cycle };
    }

    return reply.code(400).send({ error: 'Unknown scenario' });
  });

  // Comprehensive shopper journey simulation: Anonymous -> View -> Click -> Leave -> Add to Cart -> Checkout Email -> Reconciled
  app.post('/api/admin/simulate-shopper-journey', async (req) => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const visitorId = `anon_hc_${randomSuffix}`;
    const email = req.body?.email || `shopper.${randomSuffix}@gmail.com`;
    const name = req.body?.name || 'Bea Valenzuela';

    const eventsCreated = [];

    // Step 1: Anonymous Accesses Homepage
    const ev1 = db.recordEvent({
      visitorId,
      eventType: 'page_view',
      propertiesJson: JSON.stringify({
        url: 'https://homecartel.net/',
        path: '/',
        title: 'HomeCartel Lighting • Modern & Minimalist Fixtures',
        page_type: 'home',
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev1);

    // Step 2: Anonymous Clicks an Item
    const ev2 = db.recordEvent({
      visitorId,
      eventType: 'item_click',
      propertiesJson: JSON.stringify({
        title: 'Vanja 5 | Glass Luxe Chandelier',
        url: 'https://homecartel.net/products/vanja-5-glass-luxe-chandelier',
        price: '₱16,995.00',
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev2);

    // Step 3: Anonymous Views the Product Page
    const ev3 = db.recordEvent({
      visitorId,
      eventType: 'page_view',
      propertiesJson: JSON.stringify({
        url: 'https://homecartel.net/products/vanja-5-glass-luxe-chandelier',
        path: '/products/vanja-5-glass-luxe-chandelier',
        title: 'Vanja 5 | Glass Luxe Chandelier – HomeCartel',
        page_type: 'product',
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev3);

    // Step 4: Anonymous Adds to Cart
    const ev4 = db.recordEvent({
      visitorId,
      eventType: 'add_to_cart',
      propertiesJson: JSON.stringify({
        title: 'Vanja 5 | Glass Luxe Chandelier',
        price: '₱16,995.00',
        quantity: 1,
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev4);

    // Step 5: Anonymous Leaves Page after 34 seconds
    const ev5 = db.recordEvent({
      visitorId,
      eventType: 'page_leave',
      propertiesJson: JSON.stringify({
        url: 'https://homecartel.net/products/vanja-5-glass-luxe-chandelier',
        path: '/products/vanja-5-glass-luxe-chandelier',
        duration_seconds: 34,
        max_scroll_percent: 88,
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev5);

    // Step 6: Customer Enters Email in Checkout! (Identity Reconciliation)
    const customerId = db.upsertCustomer({ email, name });
    const reconciledCount = db.linkVisitorEventsToCustomer(visitorId, customerId);

    const ev6 = db.recordEvent({
      customerId,
      visitorId,
      eventType: 'identify',
      propertiesJson: JSON.stringify({
        email,
        name,
        reconciledEvents: reconciledCount,
        note: `Identity stitched: ${visitorId} is now ${email}`,
        timestamp: new Date().toISOString()
      })
    });
    eventsCreated.push(ev6);

    // Emit live event to SSE subscribers
    eventBus.emit('event', {
      type: 'identify',
      visitorId,
      customerId,
      email,
      name,
      reconciledEvents: reconciledCount,
      event: {
        id: ev6.id,
        visitorId,
        customerId,
        customerEmail: email,
        customerName: name,
        eventType: 'identify',
        properties: { email, name, reconciledEvents: reconciledCount },
        createdAt: ev6.created_at,
        isIdentified: true
      }
    });

    return {
      success: true,
      visitorId,
      email,
      reconciledCount,
      message: `Simulated full journey for ${visitorId}! Reconciled ${reconciledCount} anonymous events into ${email}.`
    };
  });

  // Endpoint to preview any template directly
  app.get('/api/admin/preview/:template', async (req, reply) => {
    const { template } = req.params;
    const { html } = renderTemplate(template, {
      customerName: 'Maria Santos',
      storeName: 'HomeCartel',
      items: [
        { title: 'Aura Brass Chandelier', price: '₱18,500' },
        { title: 'Solomon Pendant Light', price: '₱4,200' }
      ],
      recoveryUrl: 'https://homecartel.net/checkout/demo',
      unsubscribeUrl: `${app.config.appBaseUrl}/api/unsubscribe?email=demo@homecartel.ph`
    });

    reply.type('text/html').send(html);
  });

  // Endpoint to send an immediate real or mock test email to any inbox
  app.post('/api/admin/send-test', async (req, reply) => {
    const { to, template = 'abandoned_cart' } = req.body || {};
    if (!to) {
      return reply.code(400).send({ error: 'Recipient "to" email address is required' });
    }

    const { html, subject } = renderTemplate(template, {
      customerName: 'HomeCartel Shopper',
      storeName: 'HomeCartel',
      items: [
        { title: 'Aura Modern Brass Chandelier', price: '₱18,500.00', quantity: 1 },
        { title: 'Solomon Nordic Pendant Light', price: '₱4,200.00', quantity: 2 }
      ],
      recoveryUrl: 'https://homecartel.net/cart',
      unsubscribeUrl: `${app.config.appBaseUrl}/api/unsubscribe?email=${encodeURIComponent(to)}`
    });

    try {
      const result = await app.emailSender.send({
        to,
        subject: `[HomeCartel Test] ${subject}`,
        html,
        text: `HomeCartel test email for ${template}`
      });

      return {
        success: true,
        provider: app.config.emailProvider,
        messageId: result.messageId,
        message: app.config.emailProvider === 'resend'
          ? `Real email sent to ${to} via Resend!`
          : `Simulated in MOCK mode. To send to your real inbox, add RESEND_API_KEY to Railway.`
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
