import { describe, it, expect } from 'vitest';
import { isDisposableEmail, isBotPattern, validateCustomerEmail } from '../../src/utils/emailValidator.js';

describe('Bot & Disposable Email Validator', () => {
  it('correctly flags known disposable email domains', () => {
    expect(isDisposableEmail('upikenure@mailkolnet.com')).toBe(true);
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
    expect(isDisposableEmail('user@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('random@10minutemail.com')).toBe(true);
    expect(isDisposableEmail('bot@sub.throwawaymail.org')).toBe(true);
  });

  it('allows legitimate email domains', () => {
    expect(isDisposableEmail('homecartelmarketing@gmail.com')).toBe(false);
    expect(isDisposableEmail('client@yahoo.com')).toBe(false);
    expect(isDisposableEmail('designer@studio-k.ph')).toBe(false);
    expect(isDisposableEmail('support@homecartel.net')).toBe(false);
  });

  it('detects bot name and username patterns', () => {
    expect(isBotPattern('test@example.com', 'rxstore38 rxstore38')).toBe(true);
    expect(isBotPattern('rxstore99@gmail.com', 'John Doe')).toBe(true);
    expect(isBotPattern('karen@gmail.com', 'Arch. Karen Lim')).toBe(false);
  });

  it('validates customer emails accurately with detailed reasons', () => {
    const invalidDisposable = validateCustomerEmail('upikenure@mailkolnet.com', 'rxstore38');
    expect(invalidDisposable.valid).toBe(false);
    expect(invalidDisposable.reason).toBe('disposable_domain');
    expect(invalidDisposable.isDisposable).toBe(true);

    const invalidBot = validateCustomerEmail('validuser@gmail.com', 'rxstore123');
    expect(invalidBot.valid).toBe(false);
    expect(invalidBot.reason).toBe('bot_pattern_detected');

    const validCustomer = validateCustomerEmail('karenlim.design@gmail.com', 'Karen Lim');
    expect(validCustomer.valid).toBe(true);
    expect(validCustomer.reason).toBeUndefined();
  });
});
