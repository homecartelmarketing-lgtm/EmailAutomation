import { describe, it, expect } from 'vitest';
import { renderCanvaBrowseTemplate } from '../../src/templates/canvaBrowse.js';

describe('Canva Browse Abandonment Template', () => {
  it('renders browse abandonment with default authentic fixtures and no physical address', () => {
    const { subject, html } = renderCanvaBrowseTemplate({
      customerName: 'Claire',
      unsubscribeUrl: 'https://homecartel.net/unsubscribe',
      viewInBrowserUrl: 'https://homecartel.net'
    });

    expect(subject).toMatch(/grajek \| shaded table lamp is waiting for you/i);
    expect(html).toContain('Grajek | Shaded Table Lamp');
    expect(html).toContain('Check availability');
    expect(html).toContain('Something caught your eye?');
    expect(html).toContain('More items you’ll love:');
    expect(html).toContain('Aura Modern Brass Chandelier');
    expect(html).toContain('Solomon Nordic Pendant Light');
    expect(html).toContain('Baron Square Ceiling Fixture');
    expect(html).not.toContain('Steel Chair in Warm Cedar');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/');
    expect(html).toContain('© 2026 Home Cartel ®. All rights reserved.');
  });

  it('renders custom viewed fixture title, link, and recommendations', () => {
    const { subject, html } = renderCanvaBrowseTemplate({
      customerName: 'Marcus',
      fixtureTitle: 'Elysian Minimalist Sconce',
      fixtureUrl: 'https://homecartel.net/products/elysian-sconce',
      recommendations: [
        { title: 'Custom Pendant 1', price: '₱5,000.00' },
        { title: 'Custom Pendant 2', price: '₱6,000.00' },
        { title: 'Custom Pendant 3', price: '₱7,000.00' }
      ]
    });

    expect(subject).toMatch(/the elysian minimalist sconce is waiting for you/i);
    expect(html).toContain('Elysian Minimalist Sconce');
    expect(html).toContain('https://homecartel.net/products/elysian-sconce');
    expect(html).toContain('Custom Pendant 1');
    expect(html).toContain('₱5,000.00');
    expect(html).toContain('Custom Pendant 2');
    expect(html).toContain('₱6,000.00');
    expect(html).toContain('Custom Pendant 3');
    expect(html).toContain('₱7,000.00');
  });

  it('makes the hero photo responsive to the most recent browsed item and recommendation photos responsive to history', () => {
    const history = [
      {
        title: 'Nordic Glass Chandelier',
        price: '₱14,800.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/nordic-hero.jpg',
        url: 'https://homecartel.net/products/nordic-glass-chandelier'
      },
      {
        title: 'Minimalist Wall Sconce',
        price: '₱3,100.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/sconce-rec1.jpg',
        url: 'https://homecartel.net/products/minimalist-wall-sconce'
      },
      {
        title: 'Smoked Glass Pendant',
        price: '₱4,500.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/pendant-rec2.jpg',
        url: 'https://homecartel.net/products/smoked-glass-pendant'
      },
      {
        title: 'Brushed Brass Table Lamp',
        price: '₱2,900.00',
        imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/lamp-rec3.jpg',
        url: 'https://homecartel.net/products/brushed-brass-lamp'
      }
    ];

    const { subject, html } = renderCanvaBrowseTemplate({
      customerName: 'Elena',
      viewedItems: history,
      unsubscribeUrl: 'https://homecartel.net/unsubscribe'
    });

    expect(subject).toMatch(/the nordic glass chandelier is waiting for you/i);

    // 1. First photo shown (hero) must be responsive to the most recent browsed item
    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/files/nordic-hero.jpg');
    expect(html).toContain('Nordic Glass Chandelier');
    expect(html).toContain('https://homecartel.net/products/nordic-glass-chandelier');

    // 2. Photos in "More items you'll love" must be responsive to browsing history
    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/files/sconce-rec1.jpg');
    expect(html).toContain('Minimalist Wall Sconce');
    expect(html).toContain('₱3,100.00');

    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/files/pendant-rec2.jpg');
    expect(html).toContain('Smoked Glass Pendant');
    expect(html).toContain('₱4,500.00');

    expect(html).toContain('https://cdn.shopify.com/s/files/1/1870/0659/files/lamp-rec3.jpg');
    expect(html).toContain('Brushed Brass Table Lamp');
    expect(html).toContain('₱2,900.00');

    // Ensure raw placeholder images from Canva are not present
    expect(html).not.toContain('366023d2834a428fbcb8a67fe62f1fd6');
    expect(html).not.toContain('dd37a0048d6b92a55ad7d360fc06951f');
    expect(html).not.toContain('ec1f40a02977cf474dfda728c4cc9e53');
    expect(html).not.toContain('0d4bd847cd36449b3d3c1bf962f9ec3b');
    expect(html).not.toContain('Steel Chair in Warm Cedar');
    expect(html).not.toContain('673 Banawe Street');
  });
});
