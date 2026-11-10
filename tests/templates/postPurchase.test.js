import { describe, it, expect } from 'vitest';
import { renderPostPurchaseReviewTemplate } from '../../src/templates/postPurchase.js';

describe('Post-Purchase Review & Care Guide Template', () => {
  it('renders post-purchase email with customer name, care tips, and review button', () => {
    const { subject, html } = renderPostPurchaseReviewTemplate({
      customerName: 'Claire',
      orderNumber: '1088',
      reviewUrl: 'https://homecartel.net/products/talisa-chandelier#reviews',
      unsubscribeUrl: 'https://homecartel.net/api/unsubscribe?t=tok',
      viewInBrowserUrl: 'https://homecartel.net'
    });

    expect(subject).toBe('How is your new lighting, Claire? | HomeCartel');
    expect(html).toContain('Thank you for choosing HomeCartel, Claire.');
    expect(html).toContain('#1088');
    expect(html).toContain('Lighting Care & Installation Notes:');
    expect(html).toContain('circuit breaker');
    expect(html).toContain('2700K or 3000K warm white');
    expect(html).toContain('microfiber cloth');
    expect(html).toContain('Leave a Review & Share Your Space');
    expect(html).toContain('@homecartel');
    expect(html).toContain('https://homecartel.net/products/talisa-chandelier#reviews');
    expect(html).toContain('https://homecartel.net/api/unsubscribe?t=tok');
    expect(html).not.toContain('673 Banawe Street');
  });

  it('renders gracefully without customer name or order number', () => {
    const { subject, html } = renderPostPurchaseReviewTemplate();

    expect(subject).toBe('How is your new lighting? | HomeCartel');
    expect(html).toContain('Thank you for choosing HomeCartel.');
    expect(html).toContain('We hope your recent lighting pieces arrived safely');
    expect(html).not.toContain('673 Banawe Street');
  });
});
