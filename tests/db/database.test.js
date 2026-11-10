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

  it('initializes and manages per-flow settings and toggle state', () => {
    const flows = db.getAllFlowSettings();
    expect(flows.length).toBe(5);

    // Verify all 5 core flows exist and default to disabled (0)
    const keys = flows.map(f => f.flow_key);
    expect(keys).toEqual(['welcome', 'abandoned_cart', 'browse_abandonment', 'winback', 'post_purchase']);
    expect(db.isFlowEnabled('welcome')).toBe(false);
    expect(db.isFlowEnabled('abandoned_cart')).toBe(false);
    expect(db.isFlowEnabled('post_purchase')).toBe(false);

    // Toggle on
    db.setFlowEnabled('abandoned_cart', true);
    expect(db.isFlowEnabled('abandoned_cart')).toBe(true);

    // Sub-drip keys map to parent setting
    expect(db.isFlowEnabled('welcome_1')).toBe(false);
    db.setFlowEnabled('welcome', true);
    expect(db.isFlowEnabled('welcome')).toBe(true);
    expect(db.isFlowEnabled('welcome_1')).toBe(true);
    expect(db.isFlowEnabled('welcome_2')).toBe(true);

    // Toggle off
    db.setFlowEnabled('welcome', false);
    expect(db.isFlowEnabled('welcome')).toBe(false);
    expect(db.isFlowEnabled('welcome_2')).toBe(false);
  });
});
