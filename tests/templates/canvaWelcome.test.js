import { describe, it, expect } from 'vitest';
import { renderCanvaWelcomeTemplate } from '../../src/templates/canvaWelcome.js';

describe('Canva Welcome Guide Template', () => {
  it('renders the luxury welcome guide with 10% off and category links', () => {
    const { subject, html } = renderCanvaWelcomeTemplate({
      customerName: 'Sarah',
      unsubscribeUrl: 'https://homecartel.net/unsub?tok=abc123xyz',
      viewInBrowserUrl: 'https://homecartel.net/email/view/welcome',
      baseUrl: 'https://emailautomation-production-d651.up.railway.app'
    });

    // Subject personalization
    expect(subject).toBe('Welcome to HomeCartel, Sarah | Enjoy 10% Off');

    // 10% Off discount promise
    expect(html).toContain('Here’s our promise.');
    expect(html).toContain('10% off');
    expect(html).toContain('Thank you for signing up, Sarah! Enjoy');

    // Category navigation links
    expect(html).toContain('https://homecartel.net/collections/chandelier-1');
    expect(html).toContain('https://homecartel.net/collections/pendant-lights');
    expect(html).toContain('https://homecartel.net/collections/table-lamps');
    expect(html).toContain('https://homecartel.net/collections/all-lighting');

    // Production absolute image URLs (no relative images/)
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/5fde53c52841ffe349002090665198c3.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/a89ad58ed97e6b7b206f01871a6f4e7c.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/fbabf6ac28afc37202c02e74f0d21b81.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/0c1e4739a88dabe014008f6e9f3ce186.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/763f33ee9394810652d07ec15d4354e3.jpg');
    expect(html).not.toMatch(/src=["']images\//);

    // Dynamic placeholders
    expect(html).toContain('https://homecartel.net/unsub?tok=abc123xyz');
    expect(html).toContain('https://homecartel.net/email/view/welcome');

    // Footer and branding (no physical address)
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('© 2026 Home Cartel');
    expect(html).toContain('homecartel.net');
  });

  it('renders clean fallback when customerName is not provided', () => {
    const { subject, html } = renderCanvaWelcomeTemplate({});
    expect(subject).toBe('Welcome to HomeCartel | Enjoy 10% Off Your Next Order');
    expect(html).toContain('Thank you for signing up! Enjoy');
  });
});
