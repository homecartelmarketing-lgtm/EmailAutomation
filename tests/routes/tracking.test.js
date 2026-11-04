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

  it('records item click events with product details, date, and time', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId: 'anon_shopper_1',
        eventType: 'item_click',
        properties: {
          title: 'Vanja 5 | Glass Luxe Chandelier',
          url: 'https://homecartel.net/products/vanja-5',
          price: '₱16,995.00',
          timestamp: '2026-11-04T10:15:00.000Z'
        }
      }
    });

    expect(res.statusCode).toBe(200);
    const recent = db.getRecentEvents(5);
    expect(recent.length).toBeGreaterThanOrEqual(1);
    const clickEvent = recent.find(e => e.event_type === 'item_click');
    expect(clickEvent).toBeDefined();
    expect(clickEvent.visitor_id).toBe('anon_shopper_1');
    expect(clickEvent.customer_id).toBeNull();
    const props = JSON.parse(clickEvent.properties_json);
    expect(props.title).toBe('Vanja 5 | Glass Luxe Chandelier');
    expect(props.price).toBe('₱16,995.00');
  });

  it('records page leave event with duration and scroll percentage', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId: 'anon_shopper_2',
        eventType: 'page_leave',
        properties: {
          url: 'https://homecartel.net/collections/chandeliers',
          duration_seconds: 42,
          max_scroll_percent: 75
        }
      }
    });

    expect(res.statusCode).toBe(200);
    const recent = db.getRecentEvents(5);
    const leaveEvent = recent.find(e => e.event_type === 'page_leave');
    expect(leaveEvent).toBeDefined();
    const props = JSON.parse(leaveEvent.properties_json);
    expect(props.duration_seconds).toBe(42);
    expect(props.max_scroll_percent).toBe(75);
    expect(props.timestamp).toBeDefined();
  });

  it('updates all anonymous events to the customer email upon checkout/email entry', async () => {
    const visitorId = 'anon_session_99';

    // 1. Anonymous visitor accesses page
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId,
        eventType: 'page_view',
        properties: { path: '/products/vanja-5', title: 'Vanja 5' }
      }
    });

    // 2. Anonymous visitor clicks an item
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId,
        eventType: 'item_click',
        properties: { title: 'Aarhus Chandelier', price: '₱25,995.00' }
      }
    });

    // 3. Anonymous visitor leaves page
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: {
        visitorId,
        eventType: 'page_leave',
        properties: { duration_seconds: 55 }
      }
    });

    // Verify all 3 events are currently anonymous
    let eventsBefore = db.getRecentEvents(10).filter(e => e.visitor_id === visitorId);
    expect(eventsBefore.length).toBe(3);
    eventsBefore.forEach(e => {
      expect(e.customer_id).toBeNull();
      expect(e.customer_email).toBeNull();
    });

    // 4. Shopper reaches checkout and enters email
    const identifyRes = await app.inject({
      method: 'POST',
      url: '/api/track/identify',
      payload: {
        visitorId,
        email: 'sophia@homecartel.ph',
        name: 'Sophia Valenzuela'
      }
    });

    expect(identifyRes.statusCode).toBe(200);
    const identifyData = JSON.parse(identifyRes.body);
    expect(identifyData.reconciledEvents).toBe(3);

    // Verify all 3 previous events are now updated to sophia@homecartel.ph
    let eventsAfter = db.getRecentEvents(10).filter(e => e.visitor_id === visitorId);
    expect(eventsAfter.length).toBe(3);
    eventsAfter.forEach(e => {
      expect(e.customer_id).toBe(identifyData.customerId);
      expect(e.customer_email).toBe('sophia@homecartel.ph');
      expect(e.customer_name).toBe('Sophia Valenzuela');
    });
  });

  it('provides public store visit and anonymous visitor counters via GET /api/track/counter', async () => {
    // 1. First anonymous visitor visits 2 pages
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: { visitorId: 'anon_1', eventType: 'page_view', properties: { path: '/' } }
    });
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: { visitorId: 'anon_1', eventType: 'page_view', properties: { path: '/collections/all' } }
    });

    // 2. Second anonymous visitor visits 1 page
    await app.inject({
      method: 'POST',
      url: '/api/track/event',
      payload: { visitorId: 'anon_2', eventType: 'page_view', properties: { path: '/products/lamp' } }
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/track/counter'
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.storeVisits).toBe(3);
    expect(data.uniqueVisitors).toBe(2);
    expect(data.anonymousVisitors).toBe(2);
    expect(data.activeNow).toBe(2);
  });
});
