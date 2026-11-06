import { describe, it, expect } from 'vitest';
import { renderCanvaCartTemplate } from '../../src/templates/canvaCart.js';

describe('Canva Cart Abandonment Template', () => {
  it('renders cart abandonment template with authentic lighting fixtures and no physical address', () => {
    const { subject, html } = renderCanvaCartTemplate({
      customerName: 'Claire',
      unsubscribeUrl: 'https://homecartel.net/unsubscribe',
      recoveryUrl: 'https://homecartel.net/cart'
    });

    expect(subject).toMatch(/still thinking it over/i);
    expect(html).toContain('Still thinking it over?');
    expect(html).toContain('Shop now');
    expect(html).toContain('Item');
    expect(html).toContain('Price');
    expect(html).toContain('Cart total');
    expect(html).toContain('Baron Square | Ceiling Mounted Light');
    expect(html).toContain('Aerik | Ceiling Mounted Light (Gold)');
    expect(html).not.toContain('Steel Chair in Warm Cedar');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/');
    expect(html).toContain('© 2026 Home Cartel ®. All rights reserved.');
  });
});
