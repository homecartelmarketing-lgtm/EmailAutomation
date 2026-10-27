import { describe, it, expect } from 'vitest';
import { buildServer } from '../../src/server.js';
import crypto from 'node:crypto';

describe('End-to-End Behavioral Lifecycle', () => {
  it('processes abandoned checkout, triggers email, and cancels upon purchase', async () => {
    const secret = 'e2e_secret_test';
    const server = await buildServer({
      DB_PATH: ':memory:',
      SHOPIFY_WEBHOOK_SECRET: secret,
      EMAIL_PROVIDER: 'mock',
      SHOP_DOMAIN: 'homecartel.net'
    });

    function sign(payload) {
      return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
    }

    // 1. Checkout started
    const checkoutPayload = JSON.stringify({
      id: 5050,
      email: 'cart_user@homecartel.ph',
      abandoned_checkout_url: 'https://homecartel.net/checkout/5050',
      line_items: [{ title: 'Solomon Pendant Light', price: '4500.00', quantity: 1 }]
    });

    const chkRes = await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      headers: { 'x-shopify-hmac-sha256': sign(checkoutPayload), 'content-type': 'application/json' },
      payload: checkoutPayload
    });
    expect(chkRes.statusCode).toBe(200);

    // 2. Order completed -> should cancel the cart job
    const orderPayload = JSON.stringify({
      id: 9090,
      checkout_id: 5050,
      email: 'cart_user@homecartel.ph'
    });

    const ordRes = await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/orders',
      headers: { 'x-shopify-hmac-sha256': sign(orderPayload), 'content-type': 'application/json' },
      payload: orderPayload
    });
    expect(ordRes.statusCode).toBe(200);

    // 3. Run scheduler cycle at future time -> 0 abandoned cart emails should be sent
    const cycle = await server.runScheduler(new Date(Date.now() + 10000000).toISOString());
    expect(cycle.sent).toBe(0);
    expect(cycle.cancelled).toBe(0);
  });

  it('triggers welcome series and honors unsubscribe', async () => {
    const secret = 'e2e_secret_test';
    const server = await buildServer({
      DB_PATH: ':memory:',
      SHOPIFY_WEBHOOK_SECRET: secret,
      EMAIL_PROVIDER: 'mock',
      SHOP_DOMAIN: 'homecartel.net'
    });

    function sign(payload) {
      return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
    }

    // 1. Customer created
    const custPayload = JSON.stringify({
      id: 7777,
      email: 'welcome_test@homecartel.ph',
      first_name: 'Isabella'
    });

    await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/customers',
      headers: { 'x-shopify-hmac-sha256': sign(custPayload), 'content-type': 'application/json' },
      payload: custPayload
    });

    // 2. Scheduler runs and sends welcome email
    const cycle1 = await server.runScheduler(new Date().toISOString());
    expect(cycle1.sent).toBe(1);
    expect(server.emailSender.getSentMessages().length).toBe(1);
    expect(server.emailSender.getSentMessages()[0].to).toBe('welcome_test@homecartel.ph');

    // 3. User clicks unsubscribe
    const unsubRes = await server.inject({
      method: 'GET',
      url: '/api/unsubscribe?email=welcome_test@homecartel.ph'
    });
    expect(unsubRes.statusCode).toBe(200);

    // 4. Any future jobs for this user are cancelled
    server.db.scheduleJob({
      flowType: 'winback',
      recipientEmail: 'welcome_test@homecartel.ph',
      executeAt: new Date().toISOString()
    });

    const cycle2 = await server.runScheduler(new Date().toISOString());
    expect(cycle2.sent).toBe(0);
    expect(cycle2.cancelled).toBe(1);
  });
});
