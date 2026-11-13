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

    expect(subject).toBe('Claire, your cart is still waiting');
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

  it('renders welcome series with luxury guide and consistent footer without physical address', () => {
    const { subject, html } = renderTemplate('welcome', {
      customerName: 'Maria',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/welcome to homecartel/i);
    expect(html).toContain('Maria');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('homecartel.net');
    expect(html).toContain('© 2026 Home Cartel');
  });

  it('renders welcome drip part 2 (social proof & influencers)', () => {
    const { subject, html } = renderTemplate('welcome_2', {
      customerName: 'Patricia',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toBe('Loved in homes like yours, Patricia | Janeena Chan & Marian Rivera for HomeCartel');
    expect(html).toContain('Patricia');
    expect(html).toContain('Marian Rivera Dantes');
    expect(html).toContain('Janeena Chan');
    expect(html).toContain('WELCOME10');
    expect(html).not.toContain('673 Banawe Street');
  });

  it('renders welcome drip part 3 (best sellers & voucher urgency)', () => {
    const { subject, html } = renderTemplate('welcome_3', {
      customerName: 'Patricia',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toBe('Which light goes where? A quick room-by-room guide, Patricia | HomeCartel');
    expect(html).toContain('Not sure where to start');
    expect(html).toContain('Chandeliers');
    expect(html).toContain('Pendant Lights');
    expect(html).toContain('Table Lamps');
    expect(html).toContain('WELCOME10');
    expect(html).not.toContain('673 Banawe Street');
  });

  it('renders browse abandonment with luxury hero fixture and recommendations without physical address', () => {
    const { subject, html } = renderTemplate('browse_abandonment', {
      customerName: 'Claire',
      fixtureTitle: 'Aura Modern Brass Chandelier',
      fixtureUrl: 'https://homecartel.net/products/aura-modern-brass-chandelier',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toBe('The Aura Modern Brass Chandelier is waiting for you');
    expect(html).toContain('Aura Modern Brass Chandelier');
    expect(html).toContain('https://homecartel.net/products/aura-modern-brass-chandelier');
    expect(html).toContain('Check availability');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).not.toContain('Steel Chair in Warm Cedar');
    expect(html).toContain('homecartel.net');
    expect(html).toContain('© 2026 Home Cartel');
  });

  it('renders customer winback email (Flow 4) with 10% voucher and category links', () => {
    const { subject, html } = renderTemplate('winback', {
      customerName: 'Joshua',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toMatch(/we miss you, joshua/i);
    expect(html).toContain('Joshua');
    expect(html).toContain('Claim now');
    expect(html).toContain('https://homecartel.net/collections/chandelier-1');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('homecartel.net');
    expect(html).toContain('© 2026 Home Cartel');
  });

  it('renders post-purchase review email (Flow 5) with installation notes and review CTA', () => {
    const { subject, html } = renderTemplate('post_purchase', {
      customerName: 'Claire',
      orderNumber: '8910',
      unsubscribeUrl: 'https://api.homecartel.net/unsubscribe?t=tok'
    });

    expect(subject).toContain('How is your new lighting, Claire?');
    expect(html).toContain('Thank you for choosing HomeCartel, Claire.');
    expect(html).toContain('#8910');
    expect(html).toContain('Lighting Care & Installation Notes:');
    expect(html).toContain('circuit breaker');
    expect(html).toContain('Leave a Review & Share Your Space');
    expect(html).not.toContain('673 Banawe Street');
  });
});
