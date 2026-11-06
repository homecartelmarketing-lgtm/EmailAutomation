import { describe, it, expect } from 'vitest';
import { renderCanvaWinbackTemplate } from '../../src/templates/canvaWinback.js';

describe('Canva Customer Winback Template (Flow #4)', () => {
  it('renders customer winback email with 10% voucher and category links without physical address', () => {
    const { subject, html } = renderCanvaWinbackTemplate({
      customerName: 'Marcus',
      unsubscribeUrl: 'https://homecartel.net/unsubscribe',
      viewInBrowserUrl: 'https://homecartel.net'
    });

    expect(subject).toBe('We miss you, Marcus | 10% off your next order');
    expect(html).toContain('It’s been a while, Marcus.');
    expect(html).toContain('Claim now');
    expect(html).toContain('Chandeliers');
    expect(html).toContain('https://homecartel.net/collections/chandelier-1');
    expect(html).toContain('Pendant Lights');
    expect(html).toContain('https://homecartel.net/collections/pendant-lights');
    expect(html).toContain('Table Lamps');
    expect(html).toContain('https://homecartel.net/collections/table-lamp');
    expect(html).toContain('... and more!');
    expect(html).toContain('Your next favorite piece is waiting.');
    expect(html).not.toContain('673 Banawe Street');
    expect(html).toContain('https://emailautomation-production-d651.up.railway.app/images/');
    expect(html).toContain('© 2026 Home Cartel ®. All rights reserved.');
  });

  it('renders default greeting when no customer name is provided', () => {
    const { subject, html } = renderCanvaWinbackTemplate({
      unsubscribeUrl: 'https://homecartel.net/unsubscribe'
    });

    expect(subject).toBe('We miss you | 10% off your next order');
    expect(html).toContain('It’s been a while.');
    expect(html).toContain('Claim now');
  });
});
