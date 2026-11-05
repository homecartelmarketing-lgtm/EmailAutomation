import { eventBus } from '../events/bus.js';
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

/**
 * Registers Storefront Behavioral Tracking API Routes
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase> }} options
 */
export async function registerTrackingRoutes(app, { db }) {
  // Ingest real-time behavioral events (item_click, page_view, page_leave, add_to_cart, etc.)
  app.post('/api/track/event', async (req, reply) => {
    const { visitorId, eventType, properties = {} } = req.body || {};
    if (!visitorId || !eventType) {
      return reply.code(400).send({ error: 'visitorId and eventType are required' });
    }

    // Ensure timestamp is attached to event properties
    if (!properties.timestamp) {
      properties.timestamp = new Date().toISOString();
    }

    const recorded = db.recordEvent({
      visitorId,
      eventType,
      propertiesJson: JSON.stringify(properties)
    });

    // Broadcast in real-time to all connected SSE clients & admin consoles
    eventBus.emit('event', {
      type: 'event',
      event: {
        id: recorded.id,
        visitorId: recorded.visitor_id,
        customerId: recorded.customer_id,
        customerEmail: recorded.customer_email || null,
        customerName: recorded.customer_name || null,
        eventType: recorded.event_type,
        properties,
        createdAt: toIsoUtc(recorded.created_at),
        isIdentified: !!recorded.customer_id
      }
    });

    return reply.code(200).send({ success: true });
  });

  // Link anonymous session visitor ID to an identified email account
  app.post('/api/track/identify', async (req, reply) => {
    const { visitorId, email, name = '' } = req.body || {};
    if (!visitorId || !email) {
      return reply.code(400).send({ error: 'visitorId and email are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const validation = validateCustomerEmail(cleanEmail, name);
    if (!validation.valid) {
      return reply.code(400).send({ error: `Invalid or disposable email rejected (${validation.reason})` });
    }

    const customerId = db.upsertCustomer({ email: cleanEmail, name });
    const reconciledEvents = db.linkVisitorEventsToCustomer(visitorId, customerId);

    // Broadcast identification to update on-screen anonymous events in real-time
    eventBus.emit('event', {
      type: 'identify',
      visitorId,
      customerId,
      email: cleanEmail,
      name,
      reconciledEvents,
      timestamp: new Date().toISOString()
    });

    return reply.code(200).send({
      success: true,
      customerId,
      email: cleanEmail,
      reconciledEvents
    });
  });

  // Sync visitor anonymous ID with Shopify Cart Token
  app.post('/api/track/cart-sync', async (req, reply) => {
    const { visitorId, cartToken } = req.body || {};
    if (!visitorId || !cartToken) {
      return reply.code(400).send({ error: 'visitorId and cartToken are required' });
    }

    db.linkVisitorToCartToken(visitorId, cartToken);
    return reply.code(200).send({ success: true });
  });

  // Public real-time visitor & store visit counter endpoint (for other projects/dashboards)
  app.get('/api/track/counter', async (req, reply) => {
    try {
      // 1. Total store page visits
      const totalVisitsRow = db.rawDb.prepare("SELECT COUNT(*) AS count FROM events WHERE event_type = 'page_view'").get();

      // 2. Total unique visitors (all-time)
      const uniqueVisitorsRow = db.rawDb.prepare("SELECT COUNT(DISTINCT visitor_id) AS count FROM events WHERE visitor_id IS NOT NULL").get();

      // 3. Unique anonymous visitors (unidentified shoppers)
      const anonymousVisitorsRow = db.rawDb.prepare("SELECT COUNT(DISTINCT visitor_id) AS count FROM events WHERE visitor_id IS NOT NULL AND customer_id IS NULL").get();

      // 4. Active visitors right now (browsed within the last 15 minutes)
      const activeNowRow = db.rawDb.prepare("SELECT COUNT(DISTINCT visitor_id) AS count FROM events WHERE created_at >= datetime('now', '-15 minutes')").get();

      return {
        storeVisits: totalVisitsRow?.count || 0,
        uniqueVisitors: uniqueVisitorsRow?.count || 0,
        anonymousVisitors: anonymousVisitorsRow?.count || 0,
        activeNow: activeNowRow?.count || 0,
        asOf: new Date().toISOString()
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
