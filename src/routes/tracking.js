/**
 * Registers Storefront Tracking API Routes
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase> }} options
 */
export async function registerTrackingRoutes(app, { db }) {
  // Ingest behavioral events (product view, page view, cart action)
  app.post('/api/track/event', async (req, reply) => {
    const { visitorId, eventType, properties = {} } = req.body || {};
    if (!visitorId || !eventType) {
      return reply.code(400).send({ error: 'visitorId and eventType are required' });
    }

    db.recordEvent({
      visitorId,
      eventType,
      propertiesJson: JSON.stringify(properties)
    });

    return reply.code(200).send({ success: true });
  });

  // Link anonymous session visitor ID to an email identity
  app.post('/api/track/identify', async (req, reply) => {
    const { visitorId, email, name = '' } = req.body || {};
    if (!visitorId || !email) {
      return reply.code(400).send({ error: 'visitorId and email are required' });
    }

    const customerId = db.upsertCustomer({ email, name });
    db.linkVisitorEventsToCustomer(visitorId, customerId);

    return reply.code(200).send({ success: true, customerId });
  });
}
