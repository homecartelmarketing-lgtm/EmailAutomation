import { verifyShopifyHmac } from '../shopify/hmac.js';
import { eventBus } from '../events/bus.js';
import { enrichCartItemsWithImages } from '../shopify/catalog.js';
import { validateCustomerEmail } from '../utils/emailValidator.js';

function toIsoUtc(val) {
  if (!val) return new Date().toISOString();
  let s = String(val).trim();
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
    s += 'Z';
  }
  return s;
}

export const recentWebhookLogs = [];

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
    const topic = req.headers['x-shopify-topic'] || 'unknown';
    const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const isValid = !!(hmacHeader && verifyShopifyHmac(rawPayload, hmacHeader, secret));

    let email = null;
    let checkoutId = null;
    try {
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      email = parsed?.email || parsed?.customer?.email || null;
      checkoutId = parsed?.id || parsed?.token || null;
    } catch (e) {}

    const logEntry = {
      timestamp: new Date().toISOString(),
      url: req.url,
      topic,
      hmacHeaderPresent: !!hmacHeader,
      hmacValid: isValid,
      email,
      checkoutId,
      status: isValid ? (email ? 'accepted' : 'skipped_no_email') : 'rejected_401'
    };
    recentWebhookLogs.unshift(logEntry);
    if (recentWebhookLogs.length > 50) recentWebhookLogs.pop();

    if (!isValid) {
      console.warn(`[Shopify Webhook] HMAC failed for ${req.url} (header: ${hmacHeader ? 'present' : 'missing'})`);
      return reply.code(401).send({ error: 'Unauthorized: Invalid Shopify HMAC signature' });
    }
    console.log(`[Shopify Webhook] Verified incoming ${req.url} (topic: ${topic})`);
  });

  // 1. Checkouts & Carts (Abandoned Cart & Checkout detection + Identity Reconciliation)
  const handleCartOrCheckout = async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const checkoutId = String(data.id || data.token || Date.now());
    const email = data.email || (data.customer ? data.customer.email : null);

    // Detect anonymous visitor ID from note attributes or cart token
    let visitorId = null;
    if (Array.isArray(data.note_attributes)) {
      const match = data.note_attributes.find(a => a.name === '_hc_vid' || a.name === 'hc_vid');
      if (match?.value) visitorId = match.value;
    }
    if (!visitorId && data.cart_token) {
      visitorId = db.getVisitorIdByCartToken(data.cart_token);
    }

    if (!email) {
      console.log(`[Shopify Webhook] Checkout ${checkoutId} received but has no email yet.`);
      return reply.code(200).send({ skipped: 'No email associated with cart/checkout' });
    }
    console.log(`[Shopify Webhook] Scheduling abandoned cart for ${email} (checkout: ${checkoutId})`);

    const cleanEmail = String(email).trim().toLowerCase();
    const customerName = data.customer ? `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() : '';

    // Validate email against disposable/bot filter
    const validation = validateCustomerEmail(cleanEmail, customerName);
    if (!validation.valid) {
      console.warn(`[Shopify Webhook] Skipping cart/checkout for ${cleanEmail}: ${validation.reason}`);
      return reply.code(200).send({ skipped: `Bot or disposable email ignored (${validation.reason})` });
    }

    // Upsert customer record
    const customerId = db.upsertCustomer({ email: cleanEmail, name: customerName });

    // If an anonymous visitor was associated with this checkout, stitch and reconcile all past events!
    if (visitorId) {
      const reconciled = db.linkVisitorEventsToCustomer(visitorId, customerId);
      const idEvent = db.recordEvent({
        customerId,
        visitorId,
        eventType: 'checkout_identify',
        propertiesJson: JSON.stringify({
          email: cleanEmail,
          checkoutId,
          reconciledEvents: reconciled,
          timestamp: new Date().toISOString()
        })
      });

      // Broadcast live reconciliation event
      eventBus.emit('event', {
        type: 'identify',
        visitorId,
        customerId,
        email: cleanEmail,
        reconciledEvents: reconciled,
        event: {
          id: idEvent.id,
          visitorId,
          customerId,
          customerEmail: cleanEmail,
          customerName,
          eventType: 'checkout_identify',
          properties: { email: cleanEmail, checkoutId, reconciledEvents: reconciled },
          createdAt: toIsoUtc(idEvent.created_at),
          isIdentified: true
        }
      });
    }

    // Enrich line items with real Shopify catalog images (e.g. for Baron Square, Aerik, etc.)
    const rawLineItems = Array.isArray(data.line_items) ? data.line_items : [];
    const enrichedLineItems = await enrichCartItemsWithImages(rawLineItems);

    // Save cart state
    db.upsertCart({
      checkoutId,
      email: cleanEmail,
      cartToken: data.cart_token || data.token || '',
      itemsJson: JSON.stringify(enrichedLineItems),
      subtotal: data.total_price || data.subtotal_price || '0.00',
      recoveryUrl: data.abandoned_checkout_url || '',
      status: 'abandoned'
    });

    // Record checkout activity event in live feed
    const chkEvent = db.recordEvent({
      customerId,
      visitorId,
      eventType: 'checkout_update',
      propertiesJson: JSON.stringify({
        checkoutId,
        email: cleanEmail,
        items: enrichedLineItems.map(i => ({ title: i.title, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })),
        subtotal: data.total_price || data.subtotal_price || '0.00',
        recoveryUrl: data.abandoned_checkout_url || '',
        timestamp: new Date().toISOString()
      })
    });

    eventBus.emit('event', {
      type: 'event',
      event: {
        id: chkEvent.id,
        visitorId,
        customerId,
        customerEmail: cleanEmail,
        customerName,
        eventType: 'checkout_update',
        properties: {
          checkoutId,
          email: cleanEmail,
          items: enrichedLineItems,
          subtotal: data.total_price || '0.00'
        },
        createdAt: toIsoUtc(chkEvent.created_at),
        isIdentified: true
      }
    });

    // Cancel any prior pending abandoned cart job for this specific checkout to avoid duplicate spam
    db.cancelPendingJobsByCheckoutId(checkoutId);

    // Schedule abandoned cart email 2 hours from now
    const executeAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    db.scheduleJob({
      flowType: 'abandoned_cart',
      recipientEmail: cleanEmail,
      contextJson: JSON.stringify({
        checkoutId,
        recoveryUrl: data.abandoned_checkout_url,
        items: enrichedLineItems
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
      const cleanEmail = String(email).trim().toLowerCase();
      db.cancelPendingJobsByEmail(cleanEmail, 'abandoned_cart');
      const customerId = db.upsertCustomer({
        email: cleanEmail,
        name: data.customer ? `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim() : ''
      });

      const orderEvent = db.recordEvent({
        customerId,
        eventType: 'order_completed',
        propertiesJson: JSON.stringify({
          orderId: data.id,
          orderNumber: data.order_number,
          total: data.total_price,
          timestamp: new Date().toISOString()
        })
      });

      eventBus.emit('event', {
        type: 'event',
        event: {
          id: orderEvent.id,
          customerId,
          customerEmail: cleanEmail,
          eventType: 'order_completed',
          properties: { orderId: data.id, total: data.total_price },
          createdAt: toIsoUtc(orderEvent.created_at),
          isIdentified: true
        }
      });
    }

    return reply.code(200).send({ success: true, cart_cancelled: true });
  });

  // 3. Fulfillments (Order fulfilled -> schedule post-purchase follow-up in 7 days)
  app.post('/api/webhooks/shopify/fulfillments', async (req, reply) => {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = data.email || (data.customer ? data.customer.email : null);

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const executeAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.scheduleJob({
        flowType: 'post_purchase',
        recipientEmail: cleanEmail,
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
      const cleanEmail = String(email).trim().toLowerCase();
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();

      // Validate email against disposable/bot filter
      const validation = validateCustomerEmail(cleanEmail, name);
      if (!validation.valid) {
        console.warn(`[Shopify Webhook] Skipping welcome flow for ${cleanEmail}: ${validation.reason}`);
        return reply.code(200).send({ skipped: `Bot or disposable email ignored (${validation.reason})` });
      }

      const customerId = db.upsertCustomer({ email: cleanEmail, name });

      db.recordEvent({
        customerId,
        eventType: 'customer_created',
        propertiesJson: JSON.stringify({ email: cleanEmail, name, timestamp: new Date().toISOString() })
      });

      // Immediate welcome email
      db.scheduleJob({
        flowType: 'welcome',
        recipientEmail: cleanEmail,
        contextJson: JSON.stringify({ name }),
        executeAt: new Date().toISOString()
      });
    }

    return reply.code(200).send({ success: true, scheduled: 'welcome' });
  });
}
