import { renderTemplate } from '../templates/renderer.js';

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
      sentEmails: raw.prepare('SELECT COUNT(*) as c FROM email_logs').get().c
    };

    return { counts, customers, carts, jobs, logs };
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
        executeAt: new Date(Date.now() + 1000).toISOString() // 1 sec delay for live demo
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
      const cycle = await app.runScheduler(new Date(Date.now() + 100000).toISOString());
      return { success: true, cycle };
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
      unsubscribeUrl: 'http://localhost:3000/api/unsubscribe?email=demo@homecartel.ph'
    });

    reply.type('text/html').send(html);
  });
}
