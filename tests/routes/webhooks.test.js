import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import crypto from 'node:crypto';
import { initDatabase } from '../../src/db/database.js';
import { registerWebhookRoutes } from '../../src/routes/webhooks.js';

describe('Shopify Webhook Routes', () => {
  let app, db;
  const secret = 'webhook_secret_test';

  function sign(payload) {
    return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
  }

  beforeEach(async () => {
    db = initDatabase(':memory:');
    app = Fastify();
    await registerWebhookRoutes(app, { db, secret });
  });

  it('rejects unsigned webhook requests with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      payload: { id: 101 }
    });
    expect(res.statusCode).toBe(401);
  });

  it('schedules an abandoned cart email on valid checkout webhook', async () => {
    const payload = JSON.stringify({
      id: 202,
      email: 'cart_abandoner@homecartel.ph',
      abandoned_checkout_url: 'https://homecartel.net/checkout/202',
      line_items: [{ title: 'Solomon Pendant Light', price: '4500.00', quantity: 1 }]
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      headers: {
        'x-shopify-hmac-sha256': sign(payload),
        'content-type': 'application/json'
      },
      payload
    });
    expect(res.statusCode).toBe(200);

    const jobs = db.getPendingDueJobs(new Date(Date.now() + 8000000).toISOString());
    expect(jobs.some(j => j.flow_type === 'abandoned_cart')).toBe(true);
  });

  it('cancels pending abandoned cart jobs when order is completed', async () => {
    // Schedule an abandoned cart job
    db.scheduleJob({
      flowType: 'abandoned_cart',
      recipientEmail: 'buyer@homecartel.ph',
      contextJson: JSON.stringify({ checkoutId: 303 }),
      executeAt: new Date(Date.now() + 7200000).toISOString()
    });

    const orderPayload = JSON.stringify({
      id: 909,
      checkout_id: 303,
      email: 'buyer@homecartel.ph',
      line_items: [{ title: 'Solomon Pendant Light', price: '4500.00', quantity: 1 }]
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/orders',
      headers: {
        'x-shopify-hmac-sha256': sign(orderPayload),
        'content-type': 'application/json'
      },
      payload: orderPayload
    });
    expect(res.statusCode).toBe(200);

    const pending = db.getPendingDueJobs(new Date(Date.now() + 8000000).toISOString());
    expect(pending.filter(j => j.recipient_email === 'buyer@homecartel.ph').length).toBe(0);
  });

  it('schedules post-purchase review job upon order fulfillment', async () => {
    const fulfillmentPayload = JSON.stringify({
      id: 888,
      email: 'fulfilled_user@homecartel.ph',
      order_id: 909,
      status: 'success'
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/fulfillments',
      headers: {
        'x-shopify-hmac-sha256': sign(fulfillmentPayload),
        'content-type': 'application/json'
      },
      payload: fulfillmentPayload
    });
    expect(res.statusCode).toBe(200);

    const futureJobs = db.getPendingDueJobs(new Date(Date.now() + 691200000).toISOString()); // +8 days
    expect(futureJobs.some(j => j.flow_type === 'post_purchase')).toBe(true);
  });

  it('schedules welcome onboarding job upon customer creation', async () => {
    const customerPayload = JSON.stringify({
      id: 777,
      email: 'new_subscriber@homecartel.ph',
      first_name: 'Angela',
      last_name: 'Cruz'
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/customers',
      headers: {
        'x-shopify-hmac-sha256': sign(customerPayload),
        'content-type': 'application/json'
      },
      payload: customerPayload
    });
    expect(res.statusCode).toBe(200);

    const immediateJobs = db.getPendingDueJobs(new Date().toISOString());
    expect(immediateJobs.some(j => j.flow_type === 'welcome')).toBe(true);
  });
});
