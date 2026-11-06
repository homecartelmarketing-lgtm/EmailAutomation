import { renderTemplate } from '../templates/renderer.js';
import { recentWebhookLogs } from './webhooks.js';
import { eventBus } from '../events/bus.js';
import { generateUnsubscribeToken } from './unsubscribe.js';
import { enrichCartItemsWithImages } from '../shopify/catalog.js';
import { validateCustomerEmail } from '../utils/emailValidator.js';

function toIsoUtc(val) {
  if (!val) return val;
  let s = String(val).trim();
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
    s += 'Z';
  }
  return s;
}

/**
 * Registers Admin Dashboard, Staged Client Flows & Simulation Endpoints
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase> }} options
 */
export async function registerAdminRoutes(app, { db }) {
  // Returns store overview, stats, recent jobs, and email logs
  app.get('/api/admin/overview', async () => {
    const raw = db.rawDb;

    const customers = raw.prepare('SELECT * FROM customers ORDER BY id DESC LIMIT 10').all();
    const carts = raw.prepare('SELECT * FROM carts ORDER BY id DESC LIMIT 10').all();
    const jobs = raw.prepare('SELECT * FROM scheduled_jobs ORDER BY id DESC LIMIT 15').all().map(j => ({
      ...j,
      execute_at: toIsoUtc(j.execute_at),
      created_at: toIsoUtc(j.created_at)
    }));
    const logs = raw.prepare('SELECT * FROM email_logs ORDER BY id DESC LIMIT 10').all().map(l => ({
      ...l,
      sent_at: toIsoUtc(l.sent_at)
    }));

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
      version: '273ed33',
      flows: ['abandoned_cart', 'welcome', 'browse_abandonment', 'winback'],
      shopDomain: app.config.shopDomain,
      secretConfigured: sec ? `${sec.substring(0, 6)}... (${sec.length} chars)` : 'none',
      emailProvider: app.config.emailProvider,
      appBaseUrl: app.config.appBaseUrl,
      autoDispatchEnabled: !!app.config.autoDispatch,
      recentWebhookAttempts: recentWebhookLogs
    };
  });

  // Prune disposable and bot emails from database
  app.post('/api/admin/clean-bots', async () => {
    const raw = db.rawDb;
    const customers = raw.prepare('SELECT id, email, name FROM customers').all();
    const removed = [];

    for (const c of customers) {
      const val = validateCustomerEmail(c.email, c.name);
      if (!val.valid) {
        raw.prepare('DELETE FROM email_logs WHERE recipient_email = ?').run(c.email);
        raw.prepare('DELETE FROM scheduled_jobs WHERE recipient_email = ?').run(c.email);
        raw.prepare('DELETE FROM events WHERE customer_id = ?').run(c.id);
        raw.prepare('DELETE FROM customers WHERE id = ?').run(c.id);
        removed.push({ id: c.id, email: c.email, reason: val.reason });
      }
    }

    return { success: true, removedCount: removed.length, removed };
  });

  // Returns all staged clients qualified for behavioral flows (Flows 1-4) awaiting manual send
  app.get('/api/admin/staged-jobs', async () => {
    const rows = db.rawDb.prepare(`
      SELECT 
        j.id,
        j.flow_type,
        j.recipient_email,
        j.context_json,
        j.execute_at,
        j.status,
        j.created_at,
        c.name AS customer_name
      FROM scheduled_jobs j
      LEFT JOIN customers c ON c.email = j.recipient_email
      WHERE j.status = 'pending'
      ORDER BY j.id DESC
    `).all();

    const flowMeta = {
      abandoned_cart: { flowNumber: 1, label: 'Flow 1: Abandoned Cart', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      welcome: { flowNumber: 2, label: 'Flow 2: Welcome Onboarding', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
      browse_abandonment: { flowNumber: 3, label: 'Flow 3: Browse Abandonment', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
      winback: { flowNumber: 4, label: 'Flow 4: Customer Winback', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    };

    const stagedJobs = rows.map(r => {
      let parsedContext = {};
      try { parsedContext = JSON.parse(r.context_json || '{}'); } catch (e) {}
      const meta = flowMeta[r.flow_type] || { flowNumber: 0, label: r.flow_type, badge: 'bg-zinc-800 text-zinc-300 border-zinc-700' };

      let summary = '';
      if (r.flow_type === 'abandoned_cart') {
        const items = parsedContext.items || [];
        const count = items.length;
        const firstTitle = items[0]?.title || 'Lighting fixture';
        summary = `${count} item(s) in cart: "${firstTitle}"${count > 1 ? ` +${count - 1} more` : ''}`;
      } else if (r.flow_type === 'welcome') {
        summary = 'New subscriber welcome & 10% voucher (LIGHT10)';
      } else if (r.flow_type === 'browse_abandonment') {
        summary = `Viewed fixture: "${parsedContext.fixtureTitle || 'Modern Chandelier'}"`;
      } else if (r.flow_type === 'winback') {
        summary = 'Inactive customer (60+ days) new collection invitation & 10% appreciation discount';
      }

      return {
        id: r.id,
        flowType: r.flow_type,
        flowNumber: meta.flowNumber,
        flowLabel: meta.label,
        badgeClass: meta.badge,
        recipientEmail: r.recipient_email,
        customerName: r.customer_name || parsedContext.name || 'Valued Shopper',
        summary,
        context: parsedContext,
        executeAt: toIsoUtc(r.execute_at),
        status: r.status,
        createdAt: toIsoUtc(r.created_at)
      };
    });

    return { stagedJobs, count: stagedJobs.length };
  });

  // Manually sends the specific behavioral flow email for a given staged job
  app.post('/api/admin/jobs/:id/send', async (req, reply) => {
    const { id } = req.params;
    const job = db.rawDb.prepare('SELECT * FROM scheduled_jobs WHERE id = ?').get(id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    if (job.status === 'sent') {
      return reply.code(400).send({ error: 'This email has already been sent' });
    }

    // Check if customer has unsubscribed
    const customer = db.getCustomerByEmail(job.recipient_email);
    if (customer && customer.status === 'unsubscribed') {
      db.rawDb.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE id = ?").run(id);
      return reply.code(400).send({ error: 'Customer has unsubscribed from marketing emails' });
    }

    try {
      const parsedContext = JSON.parse(job.context_json || '{}');
      const token = generateUnsubscribeToken(job.recipient_email, app.config.shopifyWebhookSecret);
      const unsubscribeUrl = `${app.config.appBaseUrl}/api/unsubscribe?email=${encodeURIComponent(job.recipient_email)}&token=${token}`;

      // Resolve live Shopify lighting images for any cart items
      if (Array.isArray(parsedContext.items) && parsedContext.items.length > 0) {
        parsedContext.items = await enrichCartItemsWithImages(parsedContext.items);
      }

      const context = {
        ...parsedContext,
        email: job.recipient_email,
        unsubscribeUrl
      };

      const { subject, html } = renderTemplate(job.flow_type, context);
      const result = await app.emailSender.send({
        to: job.recipient_email,
        subject,
        html,
        text: `HomeCartel ${job.flow_type} email`
      });

      db.recordEmailLog({
        recipientEmail: job.recipient_email,
        flowName: job.flow_type,
        templateName: job.flow_type,
        messageId: result.messageId || '',
        sentAt: new Date().toISOString()
      });

      db.markJobSent(job.id);

      // Broadcast manual dispatch in live stream
      eventBus.emit('event', {
        type: 'event',
        event: {
          id: Date.now(),
          customerEmail: job.recipient_email,
          eventType: 'manual_email_sent',
          properties: {
            flow: job.flow_type,
            messageId: result.messageId,
            to: job.recipient_email
          },
          createdAt: new Date().toISOString(),
          isIdentified: true
        }
      });

      return {
        success: true,
        message: `Successfully sent ${job.flow_type} email to ${job.recipient_email}!`,
        messageId: result.messageId,
        flow: job.flow_type,
        to: job.recipient_email
      };
    } catch (err) {
      console.error(`[Manual Send] Error sending job ${id}:`, err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // Cancel / dismiss a staged job without sending
  app.post('/api/admin/jobs/:id/cancel', async (req, reply) => {
    const { id } = req.params;
    db.rawDb.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE id = ?").run(id);
    return { success: true, message: `Staged job #${id} cancelled.` };
  });

  // Preview the exact email that will be sent for a specific staged job
  app.get('/api/admin/jobs/:id/preview', async (req, reply) => {
    const { id } = req.params;
    const job = db.rawDb.prepare('SELECT * FROM scheduled_jobs WHERE id = ?').get(id);
    if (!job) {
      return reply.code(404).send('Job not found');
    }

    const parsedContext = JSON.parse(job.context_json || '{}');
    const token = generateUnsubscribeToken(job.recipient_email, app.config.shopifyWebhookSecret);
    const unsubscribeUrl = `${app.config.appBaseUrl}/api/unsubscribe?email=${encodeURIComponent(job.recipient_email)}&token=${token}`;

    if (Array.isArray(parsedContext.items) && parsedContext.items.length > 0) {
      parsedContext.items = await enrichCartItemsWithImages(parsedContext.items);
    }

    const context = {
      ...parsedContext,
      email: job.recipient_email,
      unsubscribeUrl
    };

    const { html } = renderTemplate(job.flow_type, context);
    reply.type('text/html').send(html);
  });

  // Real-time shopper events feed
  app.get('/api/admin/events', async (req) => {
    const limit = Math.min(Number(req.query?.limit) || 200, 1000);
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
        createdAt: toIsoUtc(ev.created_at),
        isIdentified: !!ev.customer_id
      };
    });

    return { events, count: events.length };
  });

  // Grouped shoppers endpoint (distinct visitors & sessions)
  app.get('/api/admin/shoppers', async (req) => {
    const limit = Math.min(Number(req.query?.limit) || 300, 1000);
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
        createdAt: toIsoUtc(ev.created_at),
        isIdentified: !!ev.customer_id
      };
    });

    // Group by customer email or visitorId
    const shoppersMap = new Map();
    events.forEach(ev => {
      const key = ev.customerEmail || ev.visitorId || 'unknown';
      if (!shoppersMap.has(key)) {
        shoppersMap.set(key, {
          id: key,
          visitorId: ev.visitorId,
          customerEmail: ev.customerEmail || null,
          customerName: ev.customerName || null,
          isIdentified: !!ev.isIdentified,
          events: []
        });
      }
      const shopper = shoppersMap.get(key);
      if (ev.customerEmail && !shopper.customerEmail) {
        shopper.customerEmail = ev.customerEmail;
        shopper.isIdentified = true;
      }
      if (ev.customerName && !shopper.customerName) {
        shopper.customerName = ev.customerName;
      }
      shopper.events.push(ev);
    });

    const shoppers = Array.from(shoppersMap.values()).map(s => {
      const sorted = [...s.events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const firstSeen = sorted[0]?.createdAt || s.events[0]?.createdAt;
      const lastSeen = sorted[sorted.length - 1]?.createdAt || s.events[0]?.createdAt;

      // Group into sessions with 30-minute inactivity threshold
      const sessions = [];
      let cur = [];
      sorted.forEach((e, idx) => {
        if (idx === 0) {
          cur.push(e);
        } else {
          const prev = new Date(sorted[idx - 1].createdAt).getTime();
          const now = new Date(e.createdAt).getTime();
          if (now - prev > 30 * 60 * 1000) {
            sessions.push({
              sessionNumber: sessions.length + 1,
              startTime: cur[0].createdAt,
              endTime: cur[cur.length - 1].createdAt,
              events: [...cur].reverse()
            });
            cur = [e];
          } else {
            cur.push(e);
          }
        }
      });
      if (cur.length > 0) {
        sessions.push({
          sessionNumber: sessions.length + 1,
          startTime: cur[0].createdAt,
          endTime: cur[cur.length - 1].createdAt,
          events: [...cur].reverse()
        });
      }

      const nowMs = Date.now();
      const lastSeenMs = new Date(lastSeen).getTime();
      const latestEvent = sorted[sorted.length - 1];
      const isLatestEventLeave = latestEvent && (latestEvent.event_type === 'page_leave');
      const isActiveNow = !isLatestEventLeave && ((nowMs - lastSeenMs) < (15 * 60 * 1000));
      const isSessionEnded = (!isActiveNow) || isLatestEventLeave;
      const isReturning = sessions.length > 1;

      return {
        id: s.id,
        visitorId: s.visitorId,
        customerEmail: s.customerEmail,
        customerName: s.customerName,
        isIdentified: s.isIdentified,
        firstSeen,
        lastSeen,
        isActiveNow,
        isSessionEnded,
        isReturning,
        totalEvents: sorted.length,
        sessionCount: sessions.length,
        sessions: sessions.reverse() // Most recent session first
      };
    });

    // Sort shoppers by most recent activity descending
    shoppers.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    return { shoppers, totalShoppers: shoppers.length };
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

  // Simulator helper (retained for programmatic tests)
  app.post('/api/admin/simulate', async (req, reply) => {
    const { scenario, data = {} } = req.body || {};

    if (scenario === 'abandoned_cart' || scenario === 'flow_1') {
      const email = data.email || 'sophia.designer@studio.ph';
      const checkoutId = String(Date.now());
      const rawItems = data.items || [
        { title: 'Vanja 5 | Glass Luxe Chandelier', price: '₱16,995.00', quantity: 1 },
        { title: 'Baron Square | Ceiling Mounted Light', price: '₱2,850.00', quantity: 1 }
      ];
      const items = await enrichCartItemsWithImages(rawItems);

      db.upsertCustomer({ email, name: data.name || 'Sophia Reyes' });
      db.upsertCart({
        checkoutId,
        email,
        cartToken: 'tok_' + checkoutId,
        itemsJson: JSON.stringify(items),
        subtotal: data.subtotal || '19845.00',
        recoveryUrl: `https://homecartel.net/checkouts/${checkoutId}`,
        status: 'abandoned'
      });

      const jobId = db.scheduleJob({
        flowType: 'abandoned_cart',
        recipientEmail: email,
        contextJson: JSON.stringify({
          checkoutId,
          recoveryUrl: `https://homecartel.net/checkouts/${checkoutId}`,
          items
        }),
        executeAt: new Date().toISOString()
      });

      return {
        success: true,
        message: `Staged Flow 1 (Abandoned Cart) for ${email}. Ready for manual send!`,
        jobId,
        email,
        flow: 'Flow 1'
      };
    }

    if (scenario === 'welcome' || scenario === 'flow_2') {
      const email = data.email || `new.subscriber.${Math.floor(Math.random() * 1000)}@gmail.com`;
      const name = data.name || 'Maria Santos';
      db.upsertCustomer({ email, name });
      const jobId = db.scheduleJob({
        flowType: 'welcome',
        recipientEmail: email,
        contextJson: JSON.stringify({ name }),
        executeAt: new Date().toISOString()
      });
      return {
        success: true,
        message: `Staged Flow 2 (Welcome Series) for ${email}. Ready for manual send!`,
        jobId,
        email,
        flow: 'Flow 2'
      };
    }

    if (scenario === 'browse_abandonment' || scenario === 'flow_3') {
      const email = data.email || 'claire.architect@design.ph';
      const name = data.name || 'Claire Dizon';
      db.upsertCustomer({ email, name });
      const jobId = db.scheduleJob({
        flowType: 'browse_abandonment',
        recipientEmail: email,
        contextJson: JSON.stringify({
          name,
          fixtureTitle: 'Nordic Glass Cluster Chandelier',
          fixtureUrl: 'https://homecartel.net/products/nordic-glass-cluster'
        }),
        executeAt: new Date().toISOString()
      });
      return {
        success: true,
        message: `Staged Flow 3 (Browse Abandonment) for ${email}. Ready for manual send!`,
        jobId,
        email,
        flow: 'Flow 3'
      };
    }

    if (scenario === 'winback' || scenario === 'flow_4') {
      const email = data.email || 'angela.client@gmail.com';
      const name = data.name || 'Angela Lopez';
      db.upsertCustomer({ email, name });
      const jobId = db.scheduleJob({
        flowType: 'winback',
        recipientEmail: email,
        contextJson: JSON.stringify({
          name,
          customerName: name,
          claimUrl: 'https://homecartel.net?discount=WELCOMEBACK10'
        }),
        executeAt: new Date().toISOString()
      });
      return {
        success: true,
        message: `Staged Flow 4 (Customer Winback) for ${email}. Ready for manual send!`,
        jobId,
        email,
        flow: 'Flow 4'
      };
    }

    if (scenario === 'order_complete') {
      const email = data.email || 'sophia.designer@studio.ph';
      db.cancelPendingJobsByEmail(email, 'abandoned_cart');
      db.rawDb.prepare("UPDATE carts SET status = 'recovered' WHERE email = ?").run(email);
      return { success: true, message: `Order completed for ${email}. Pending cart reminder cancelled!` };
    }

    if (scenario === 'run_scheduler') {
      const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const cycle = await app.runScheduler(farFuture);
      const msg = cycle.sent > 0
        ? `⚡ Dispatched ${cycle.sent} email(s) successfully!`
        : `Scheduler cycle completed: 0 emails sent (${cycle.skipped} skipped, ${cycle.cancelled} failed/cancelled).`;
      return { success: true, message: msg, cycle };
    }

    return reply.code(400).send({ error: 'Unknown scenario' });
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

  // Query Resend Domain verification status
  app.get('/api/admin/resend/status', async (req, reply) => {
    if (!app.config.resendApiKey) {
      return reply.code(400).send({ error: 'No RESEND_API_KEY configured' });
    }
    try {
      const res = await fetch('https://api.resend.com/domains/02c0e71c-3a6c-4436-b651-f1a618577243', {
        headers: { 'Authorization': `Bearer ${app.config.resendApiKey}` }
      });
      const data = await res.json();
      return { ...data, configFromEmail: app.config.fromEmail };
    } catch (e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  // Trigger Resend to immediately re-verify DNS records for homecartel.net
  app.post('/api/admin/resend/verify', async (req, reply) => {
    if (!app.config.resendApiKey) {
      return reply.code(400).send({ error: 'No RESEND_API_KEY configured' });
    }
    try {
      // 1. Get all domains to find homecartel.net's ID
      const listRes = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${app.config.resendApiKey}` }
      });
      const listData = await listRes.json();
      const domain = (listData.data || []).find(d => d.name === 'homecartel.net') || listData.data?.[0];

      if (!domain) {
        return reply.code(404).send({ error: 'No domain found in Resend', listData });
      }

      // 2. Trigger verification
      const verifyRes = await fetch(`https://api.resend.com/domains/${domain.id}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${app.config.resendApiKey}` }
      });
      const verifyData = await verifyRes.json();
      return { success: true, domain, result: verifyData };
    } catch (e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  // Endpoint to send an immediate real or mock test email to any inbox
  app.post('/api/admin/send-test', async (req, reply) => {
    const { to, template = 'abandoned_cart' } = req.body || {};
    if (!to) {
      return reply.code(400).send({ error: 'Recipient "to" email address is required' });
    }

    const realHistory = db.getCustomerBrowsingHistory(to);
    const viewedItems = (realHistory && realHistory.length > 0) ? realHistory : [
      {
        title: 'Aura Modern Brass Chandelier',
        price: '₱18,500.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
        url: 'https://homecartel.net/products/aura-modern-brass-chandelier'
      },
      {
        title: 'Solomon Nordic Pendant Light',
        price: '₱4,200.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
        url: 'https://homecartel.net/products/solomon-nordic-pendant'
      },
      {
        title: 'Baron Square Ceiling Fixture',
        price: '₱2,850.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
        url: 'https://homecartel.net/products/baron-square-ceiling-light'
      },
      {
        title: 'Aerik Modern Gold Ceiling Light',
        price: '₱3,450.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
        url: 'https://homecartel.net/products/aerik-ceiling-light'
      }
    ];

    const { html, subject } = renderTemplate(template, {
      customerName: 'HomeCartel Shopper',
      storeName: 'HomeCartel',
      items: [
        { title: 'Aura Modern Brass Chandelier', price: '₱18,500.00', quantity: 1 },
        { title: 'Solomon Nordic Pendant Light', price: '₱4,200.00', quantity: 2 }
      ],
      viewedItems,
      fixtureTitle: viewedItems[0].title,
      fixturePrice: viewedItems[0].price,
      fixtureImage: viewedItems[0].imageUrl,
      fixtureUrl: viewedItems[0].url,
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
