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
    expect(html).toContain('homecartel.net');
    expect(html).toContain('https://api.homecartel.net/unsubscribe?t=tok');
    // Ensure placeholder chair is NEVER present
    expect(html).not.toContain('04c8b285c02346c0b1b567007090fc7e');
    // Ensure responsive layout classes are present
    expect(html).toContain('cart-item-col');
    expect(html).toContain('cart-item-img');
  });

  it('renders cart items responsively with customer-specific lighting fixtures and images', () => {
    const { html } = renderTemplate('abandoned_cart', {
      customerName: 'Johncel Pallasigue',
      items: [
        {
          title: 'Baron Square | Ceiling Mounted Light',
          price: '2850.00',
          quantity: 1,
          imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482'
        },
        {
          title: 'Aerik | Ceiling Mounted Light (Gold)',
          price: '3450.00',
          quantity: 1,
          imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031'
        }
      ],
      recoveryUrl: 'https://homecartel.net/checkouts/c/12345',
      unsubscribeUrl: 'https://homecartel.net/api/unsubscribe?t=tok'
    });

    expect(html).toContain('Baron Square | Ceiling Mounted Light');
    expect(html).toContain('Aerik | Ceiling Mounted Light (Gold)');
    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg');
    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg');
    expect(html).not.toContain('04c8b285c02346c0b1b567007090fc7e');
    expect(html).toContain('₱6,300.00'); // Dynamic total calculation
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
