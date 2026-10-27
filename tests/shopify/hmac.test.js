import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyShopifyHmac } from '../../src/shopify/hmac.js';

describe('verifyShopifyHmac', () => {
  const secret = 'h_secret_key_xyz';
  const body = JSON.stringify({ id: 12345, note: 'cart test' });

  it('returns true for a valid Shopify HMAC signature', () => {
    const validHmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    expect(verifyShopifyHmac(body, validHmac, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    expect(verifyShopifyHmac(body, 'invalid_hmac_base64', secret)).toBe(false);
  });

  it('returns false when signature or secret is empty', () => {
    expect(verifyShopifyHmac(body, '', secret)).toBe(false);
    expect(verifyShopifyHmac(body, 'abc', '')).toBe(false);
    expect(verifyShopifyHmac('', 'abc', secret)).toBe(false);
  });
});
