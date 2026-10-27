import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { initDatabase } from '../../src/db/database.js';
import { registerUnsubscribeRoutes } from '../../src/routes/unsubscribe.js';

describe('Unsubscribe Handler', () => {
  let app, db;
  beforeEach(async () => {
    db = initDatabase(':memory:');
    db.upsertCustomer({ email: 'optout@test.com', name: 'Opt Out', status: 'subscribed' });
    app = Fastify();
    await registerUnsubscribeRoutes(app, { db });
  });

  it('marks customer as unsubscribed and returns confirmation page', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/unsubscribe?email=optout@test.com'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('successfully unsubscribed');
    expect(db.getCustomerByEmail('optout@test.com').status).toBe('unsubscribed');
  });

  it('rejects request without email', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/unsubscribe'
    });
    expect(res.statusCode).toBe(400);
  });
});
