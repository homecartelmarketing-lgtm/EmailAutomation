import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/templates/renderer.js';

describe('Email Template Renderer', () => {
  it('renders abandoned cart email with product items, restore button, and mandatory footer', () => {
    const { subject, html } = renderTemplate('abandoned_cart', {
      customerName: 'Claire',
      storeName: 'HomeCartel',
      items: [{ title: 'Nordic Glass Chandelier', price: '₱12,500' }],
      recoveryUrl: 'https://homecartel.net/cart/restore/123',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/leave something behind/i);
    expect(html).toContain('Nordic Glass Chandelier');
    expect(html).toContain('₱12,500');
    expect(html).toContain('673 Banawe Street');
    expect(html).toContain('https://api.homecartel.net/unsubscribe?t=tok');
  });

  it('renders welcome series with lighting guide and store address', () => {
    const { subject, html } = renderTemplate('welcome', {
      customerName: 'Maria',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/welcome to homecartel/i);
    expect(html).toContain('Maria');
    expect(html).toContain('673 Banawe Street');
  });

  it('renders post purchase care and review email', () => {
    const { subject, html } = renderTemplate('post_purchase', {
      customerName: 'Joshua',
      orderNumber: '1088',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/recent order/i);
    expect(html).toContain('Joshua');
    expect(html).toContain('1088');
  });
});
