import { describe, it, expect } from 'vitest';
import { renderCanvaWelcomeTemplate } from '../../src/templates/canvaWelcome.js';

describe('Canva Welcome Guide Template (2nd Version)', () => {
  it('renders the new welcome guide with 10% off, customer name, and category buy now blocks', () => {
    const { subject, html } = renderCanvaWelcomeTemplate({
      customerName: 'Sarah',
      unsubscribeUrl: 'https://homecartel.net/unsub?tok=abc123xyz',
      viewInBrowserUrl: 'https://homecartel.net/email/view/welcome',
      baseUrl: 'https://emailautomation-production-d651.up.railway.app'
    });

    // Subject personalization
    expect(subject).toBe('Welcome to HomeCartel, Sarah | 10% off your first order');

    // Headline & greeting personalization
    expect(html).toContain('Welcome to HomeCartel, Sarah!');
    expect(html).toContain('We’re so glad you’ve joined us.');
    expect(html).toContain('10% discount');
    expect(html).toContain('WELCOME10');

    // Category navigation & buy now links
    expect(html).toContain('https://homecartel.net/collections/chandelier-1');
    expect(html).toContain('https://homecartel.net/collections/pendant-lights');
    expect(html).toContain('https://homecartel.net/collections/table-lamps');
    expect(html).toContain('https://homecartel.net/collections/all-lighting');

    // Production absolute image URLs (no relative images/)
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/8c851cee0b6b492ea60a7fe8d0c52e0d.png');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/4fc174fe067a3381d8eac24178d6be4c.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/f7da9d96daf6843f1957e1f808408a37.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/4adaf5ec29dd306e10b69ad790fe50c7.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/a9eca2757cabed358d769c373f9c5fa6.jpg');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/5ee19a3503604b10d4ca522866439b81.png');
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
    expect(subject).toBe('Welcome to HomeCartel | 10% off your first order');
    expect(html).toContain('Welcome to HomeCartel, Shopper!');
  });
});
