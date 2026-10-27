import { verifyShopifyHmac } from '../shopify/hmac.js';

/**
 * Registers Shopify Webhook Ingestion Routes
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase>, secret: string }} options
 */
export async function registerWebhookRoutes(app, { db, secret }) {
  // Hook to verify HMAC on Shopify webhook endpoints
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/api/webhooks/shopify')) {
      return;
    }

    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    if (!hmacHeader || !verifyShopifyHmac(rawPayload, hmacHeader, secret)) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid Shopify HMAC signature' });
    }
  });

  // 1. Checkouts & Carts (Abandoned Cart & Checkout detection)
  const handleCartOrCheckout = async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const checkoutId = String(data.id || data.token || Date.now());
    const email = data.email || (data.customer ? data.customer.email : null);

    if (!email) {
      return reply.code(200).send({ skipped: 'No email associated with cart/checkout' });
    }

    // Upsert customer record
    db.upsertCustomer({ email, name: data.customer ? `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() : '' });

    // Save cart state
    db.upsertCart({
      checkoutId,
      email,
      cartToken: data.cart_token || data.token || '',
      itemsJson: JSON.stringify(data.line_items || []),
      subtotal: data.total_price || data.subtotal_price || '0.00',
      recoveryUrl: data.abandoned_checkout_url || '',
      status: 'abandoned'
    });

    // Cancel any prior pending abandoned cart job for this specific checkout to avoid duplicate spam
    db.cancelPendingJobsByCheckoutId(checkoutId);

    // Schedule abandoned cart email 2 hours from now
    const executeAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    db.scheduleJob({
      flowType: 'abandoned_cart',
      recipientEmail: email,
      contextJson: JSON.stringify({
        checkoutId,
        recoveryUrl: data.abandoned_checkout_url,
        items: data.line_items || []
      }),
      executeAt
    });

    return reply.code(200).send({ success: true, scheduled: 'abandoned_cart' });
  };

  app.post('/api/webhooks/shopify/checkouts', handleCartOrCheckout);
  app.post('/api/webhooks/shopify/carts', handleCartOrCheckout);

  // 2. Orders (Order completed -> cancel pending cart reminders & mark cart recovered)
  app.post('/api/webhooks/shopify/orders', async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = data.email || (data.customer ? data.customer.email : null);

    if (data.checkout_id) {
      db.markCartRecovered(String(data.checkout_id));
      db.cancelPendingJobsByCheckoutId(String(data.checkout_id));
    }

    if (email) {
      // Cancel any pending abandoned cart reminders for this buyer
      db.cancelPendingJobsByEmail(email, 'abandoned_cart');
      db.upsertCustomer({
        email,
        name: data.customer ? `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() : ''
      });
    }

    return reply.code(200).send({ success: true, cart_cancelled: true });
  });

  // 3. Fulfillments (Order fulfilled -> schedule post-purchase follow-up in 7 days)
  app.post('/api/webhooks/shopify/fulfillments', async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = data.email || (data.customer ? data.customer.email : null);

    if (email) {
      const executeAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.scheduleJob({
        flowType: 'post_purchase',
        recipientEmail: email,
        contextJson: JSON.stringify({ orderId: data.order_id, fulfillmentId: data.id }),
        executeAt
      });
    }

    return reply.code(200).send({ success: true, scheduled: 'post_purchase' });
  });

  // 4. Customers (New customer / newsletter signup -> trigger welcome series)
  app.post('/api/webhooks/shopify/customers', async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = data.email;

    if (email) {
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      db.upsertCustomer({ email, name });

      // Immediate welcome email
      db.scheduleJob({
        flowType: 'welcome',
        recipientEmail: email,
        contextJson: JSON.stringify({ name }),
        executeAt: new Date().toISOString()
      });
    }

    return reply.code(200).send({ success: true, scheduled: 'welcome' });
  });
}
