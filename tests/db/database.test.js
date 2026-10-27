import { describe, it, expect, beforeEach } from 'vitest';
import { initDatabase } from '../../src/db/database.js';

describe('Database State Store', () => {
  let db;
  beforeEach(() => {
    db = initDatabase(':memory:');
  });

  it('upserts customers and manages subscription status', () => {
    const id = db.upsertCustomer({ email: 'shopper@test.com', name: 'Maria Santos', status: 'subscribed' });
    expect(id).toBeDefined();

    const customer = db.getCustomerByEmail('shopper@test.com');
    expect(customer.name).toBe('Maria Santos');
    expect(customer.status).toBe('subscribed');

    db.setCustomerUnsubscribed('shopper@test.com');
    expect(db.getCustomerByEmail('shopper@test.com').status).toBe('unsubscribed');
  });

  it('records events and links anonymous visitor events to customer', () => {
    db.recordEvent({ visitorId: 'vid_123', eventType: 'page_view', propertiesJson: JSON.stringify({ url: '/collections/chandeliers' }) });
    const custId = db.upsertCustomer({ email: 'maria@homecartel.ph', name: 'Maria' });
    db.linkVisitorEventsToCustomer('vid_123', custId);

    const events = db.getEventsByCustomerId(custId);
    expect(events.length).toBe(1);
    expect(events[0].event_type).toBe('page_view');
  });

  it('upserts carts and tracks abandoned checkout sessions', () => {
    db.upsertCart({
      checkoutId: 'chk_101',
      email: 'cart_user@test.com',
      cartToken: 'tok_abc',
      itemsJson: JSON.stringify([{ title: 'Aura Pendant', price: '3500' }]),
      subtotal: '3500.00',
      recoveryUrl: 'https://homecartel.net/checkouts/chk_101',
      status: 'abandoned'
    });

    const cart = db.getCartByCheckoutId('chk_101');
    expect(cart.email).toBe('cart_user@test.com');
    expect(cart.status).toBe('abandoned');
  });

  it('schedules and cancels pending jobs', () => {
    const futureTime = new Date(Date.now() + 7200000).toISOString();
    const jobId = db.scheduleJob({
      flowType: 'abandoned_cart',
      recipientEmail: 'shopper@test.com',
      contextJson: JSON.stringify({ checkoutId: 'chk_101' }),
      executeAt: futureTime
    });
    expect(jobId).toBeDefined();

    // Cancel pending jobs
    db.cancelPendingJobsByEmail('shopper@test.com', 'abandoned_cart');
    const dueJobs = db.getPendingDueJobs(new Date(Date.now() + 10000000).toISOString());
    expect(dueJobs.filter(j => j.recipient_email === 'shopper@test.com').length).toBe(0);
  });
});
