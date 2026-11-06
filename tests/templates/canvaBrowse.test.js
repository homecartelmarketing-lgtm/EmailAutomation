import { describe, it, expect } from 'vitest';
import { renderCanvaBrowseTemplate } from '../../src/templates/canvaBrowse.js';

describe('Canva Browse Abandonment Template', () => {
  it('renders browse abandonment with default authentic fixtures and no physical address', () => {
    const { subject, html } = renderCanvaBrowseTemplate({
      customerName: 'Claire',
      unsubscribeUrl: 'https://homecartel.net/unsubscribe',
      viewInBrowserUrl: 'https://homecartel.net'
    });

    expect(subject).toMatch(/claire/i);
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

    expect(subject).toMatch(/elysian minimalist sconce/i);
    expect(html).toContain('Elysian Minimalist Sconce');
    expect(html).toContain('https://homecartel.net/products/elysian-sconce');
    expect(html).toContain('Custom Pendant 1');
    expect(html).toContain('₱5,000.00');
    expect(html).toContain('Custom Pendant 2');
    expect(html).toContain('₱6,000.00');
    expect(html).toContain('Custom Pendant 3');
    expect(html).toContain('₱7,000.00');
  });
});
