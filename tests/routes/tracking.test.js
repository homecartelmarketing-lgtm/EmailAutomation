import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { initDatabase } from '../../src/db/database.js';
import { registerTrackingRoutes } from '../../src/routes/tracking.js';

describe('Tracking API Routes', () => {
  let app, db;
  beforeEach(async () => {
    db = initDatabase(':memory:');
    app = Fastify();
    await registerTrackingRoutes(app, { db });
  });

  it('ingests product view events', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId: 'vid_abc123',
        eventType: 'product_view',
        properties: { productId: 'prod_99', title: 'Aura Chandelier' }
      }
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
  });

  it('links visitor session to email upon identify', async () => {
    // Record an event before identification
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId: 'vid_abc123',
        eventType: 'product_view',
        properties: { productId: 'prod_99' }
      }
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/track/identify',
      payload: { visitorId: 'vid_abc123', email: 'guest@homecartel.ph', name: 'Guest User' }
    });
    expect(res.statusCode).toBe(200);

    const customer = db.getCustomerByEmail('guest@homecartel.ph');
    expect(customer).toBeDefined();
    expect(customer.email).toBe('guest@homecartel.ph');

    const events = db.getEventsByCustomerId(customer.id);
    expect(events.length).toBe(1);
  });
});
