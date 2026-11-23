import { describe, it, expect } from 'vitest';
import { renderCanvaCartTemplate } from '../../src/templates/canvaCart.js';

describe('Canva Cart Abandonment Template (2nd Version)', () => {
  it('renders cart abandonment template with authentic lighting fixtures, 10% discount, and no physical address', () => {
    const { subject, html } = renderCanvaCartTemplate({
      customerName: 'Claire',
      unsubscribeUrl: 'https://homecartel.net/unsubscribe',
      recoveryUrl: 'https://homecartel.net/cart'
    });

    expect(subject).toBe('Claire, your favorites are still waiting | 10% off with code WELCOME10');
    expect(html).toContain('Your favorites are still waiting.');
    expect(html).toContain('Complete your order now and enjoy');
    expect(html).toContain('10% off');
    expect(html).toContain('WELCOME10');
    expect(html).toContain('CHECK OUT NOW');
    expect(html).toContain('In your cart:');
    expect(html).toContain('Item');
    expect(html).toContain('Qty');
    expect(html).toContain('Price');
    expect(html).toContain('Soeren | Luxe White Glass Chandelier with Brass Detail');
    expect(html).toContain('Darynthas | Pendant Light');
    expect(html).toContain('You may also like:');
    expect(html).toContain('BUY NOW');
    expect(html).toContain('Still deciding? Browse the full collection to find your fit.');
    expect(html).toContain('Got questions? Contact us.');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).not.toContain('Banawe');
    expect(html).not.toMatch(/["']images\//);
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/');
    expect(html).toContain('© 2026 Home Cartel ®. All rights reserved.');
  });

  it('renders dynamic cart items with quantity, PHP currency formatting, and recovery discount link', () => {
    const { html } = renderCanvaCartTemplate({
      customerName: 'Mariel',
      recoveryUrl: 'https://homecartel.net/checkouts/chk_123',
      items: [
        {
          title: 'Solomon Nordic Pendant Light',
          price: 4200,
          quantity: 3,
          imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/solomon.jpg',
          url: 'https://homecartel.net/products/solomon-nordic-pendant'
        }
      ]
    });

    expect(html).toContain('Solomon Nordic Pendant Light');
    expect(html).toContain('₱4,200.00');
    expect(html).toContain('>3<br>');
    expect(html).toContain('https://homecartel.net/checkouts/chk_123?discount=WELCOME10');
    expect(html).not.toContain('Soeren | Luxe White Glass Chandelier');
  });

  it('is responsive to website browsing history in "You may also like:" section', () => {
    const { html } = renderCanvaCartTemplate({
      customerName: 'Leigh',
      items: [
        {
          title: 'Baron Square | Ceiling Mounted Light',
          price: '₱2,850.00',
          quantity: 1
        }
      ],
      viewedItems: [
        {
          title: 'Aura Modern Brass Chandelier',
          price: '₱18,500.00',
          imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/aura.jpg',
          url: 'https://homecartel.net/products/aura-modern-brass-chandelier'
        },
        {
          title: 'Grajek | Shaded Table Lamp',
          price: '₱3,450.00',
          imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/grajek.jpg',
          url: 'https://homecartel.net/products/grajek-shaded-table-lamp'
        },
        {
          // Should not duplicate the item that is already in the cart
          title: 'Baron Square | Ceiling Mounted Light',
          price: '₱2,850.00'
        }
      ]
    });

    // Recommendations should feature the viewed items
    expect(html).toContain('Aura Modern Brass Chandelier');
    expect(html).toContain('Grajek | Shaded Table Lamp');
    expect(html).toContain('₱18,500.00');
    expect(html).toContain('₱3,450.00');
    // Cart item should not be duplicated in recommendations
    // Fallback item should be used to complete 3 cards
    expect(html).toContain('Talisa | Modern Chandelier');
    // Ensure placeholder Canva graphic hashes are never rendered
    expect(html).not.toContain('ccf0df87c4814653202adf4b19c60e5c');
    expect(html).not.toContain('b425fe1f3e9750056ea70120b8c40f97');
    expect(html).not.toContain('eea3c97993f62b4d9c5267094eca4cfd');
    // Check BUY NOW links have discount auto-applied
    expect(html).toContain('https://homecartel.net/products/aura-modern-brass-chandelier?discount=WELCOME10');
  });

  it('handles empty customer name gracefully with high-converting subject line', () => {
    const { subject } = renderCanvaCartTemplate({
      customerName: '',
      items: []
    });

    expect(subject).toBe('Your favorites are still waiting | Complete your order with 10% off');
  });
});
