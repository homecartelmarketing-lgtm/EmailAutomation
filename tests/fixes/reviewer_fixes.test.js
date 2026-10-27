import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import crypto from 'node:crypto';
import { initDatabase } from '../../src/db/database.js';
import { registerUnsubscribeRoutes, generateUnsubscribeToken, verifyUnsubscribeToken } from '../../src/routes/unsubscribe.js';
import { runSchedulerCycle } from '../../src/scheduler/worker.js';
import { buildServer } from '../../src/server.js';

describe('Reviewer Fixes Verification', () => {
  const secret = 'test_secret_for_fixes_123';
  let db;

  beforeEach(() => {
    db = initDatabase(':memory:');
  });

  it('generates secure HMAC tokens for unsubscribe and verifies them', () => {
    const email = 'customer@homecartel.ph';
    const token = generateUnsubscribeToken(email, secret);
    expect(token).toBeDefined();
    expect(verifyUnsubscribeToken(email, token, secret)).toBe(true);
    expect(verifyUnsubscribeToken(email, 'tampered_token', secret)).toBe(false);
  });

  it('escapes HTML in unsubscribe confirmation to prevent reflected XSS', async () => {
    const app = Fastify();
    await registerUnsubscribeRoutes(app, { db, secret });

    const xssPayload = '<script>alert(1)</script>';
    const token = generateUnsubscribeToken(xssPayload, secret);
    const res = await app.inject({
      method: 'GET',
      url: `/api/unsubscribe?email=${encodeURIComponent(xssPayload)}&token=${token}`
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('<script>alert(1)</script>');
    expect(res.body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('unsubscribing a guest email creates a suppressed customer record', async () => {
    const app = Fastify();
    await registerUnsubscribeRoutes(app, { db, secret });

    const guestEmail = 'guest_never_saved_before@test.com';
    const token = generateUnsubscribeToken(guestEmail, secret);

    const res = await app.inject({
      method: 'GET',
      url: `/api/unsubscribe?email=${encodeURIComponent(guestEmail)}&token=${token}`
    });
    expect(res.statusCode).toBe(200);

    const customer = db.getCustomerByEmail(guestEmail);
    expect(customer).toBeDefined();
    expect(customer.status).toBe('unsubscribed');
  });

  it('frequency capping correctly honors 48 hours regardless of server timezone', async () => {
    const mockSender = { send: vi.fn().mockResolvedValue({ messageId: 'm1' }) };
    const mockRenderer = { render: vi.fn().mockReturnValue({ subject: 'Test', html: '<html></html>' }) };

    db.upsertCustomer({ email: 'cap_test@homecartel.ph', name: 'Cap Test' });

    // Simulate an email sent exactly 42 hours ago
    const fortyTwoHoursAgo = new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString();
    db.recordEmailLog({
      recipientEmail: 'cap_test@homecartel.ph',
      flowName: 'welcome',
      sentAt: fortyTwoHoursAgo
    });

    // Schedule a job due now
    db.scheduleJob({
      flowType: 'browse_abandonment',
      recipientEmail: 'cap_test@homecartel.ph',
      executeAt: new Date().toISOString()
    });

    // Run scheduler now: 42h < 48h, so it MUST be skipped!
    const result = await runSchedulerCycle({
      db,
      sender: mockSender,
      renderer: mockRenderer,
      now: new Date().toISOString()
    });

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockSender.send).not.toHaveBeenCalled();
  });

  it('server webhook verifies raw request payload with arbitrary spacing', async () => {
    const server = await buildServer({
      DB_PATH: ':memory:',
      SHOPIFY_WEBHOOK_SECRET: secret,
      SHOP_DOMAIN: 'homecartel.net',
      EMAIL_PROVIDER: 'mock'
    });

    // Raw payload with irregular spacing
    const rawPayload = '{\n  "id": 9999,\n  "email": "raw_test@homecartel.ph",\n  "abandoned_checkout_url": "https://homecartel.net/c/9999"\n}';
    const validHmac = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('base64');

    const res = await server.inject({
      method: 'POST',
      url: '/api/webhooks/shopify/checkouts',
      headers: {
        'x-shopify-hmac-sha256': validHmac,
        'content-type': 'application/json'
      },
      payload: rawPayload
    });

    expect(res.statusCode).toBe(200);
  });
});
