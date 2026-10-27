import { describe, it, expect } from 'vitest';
import { createEmailSender } from '../../src/email/sender.js';

describe('Email Sender Adapter', () => {
  it('sends via mock provider and records sent messages', async () => {
    const sender = createEmailSender({ emailProvider: 'mock' });
    const result = await sender.send({
      to: 'buyer@test.com',
      subject: 'Your Cart',
      html: '<p>Hello</p>'
    });

    expect(result.messageId).toBeDefined();
    expect(sender.getSentMessages().length).toBe(1);
    expect(sender.getSentMessages()[0].to).toBe('buyer@test.com');
  });

  it('fails cleanly when resend provider lacks API key', () => {
    expect(() => createEmailSender({ emailProvider: 'resend', resendApiKey: '' })).toThrow(/Missing RESEND_API_KEY/);
  });
});
