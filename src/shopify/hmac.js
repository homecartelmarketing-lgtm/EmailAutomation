import crypto from 'node:crypto';

/**
 * Validates a Shopify webhook HMAC SHA256 signature using timing-safe comparison.
 *
 * @param {string|Buffer} rawBody - The unparsed raw HTTP request body
 * @param {string} signature - The X-Shopify-Hmac-Sha256 header value (base64)
 * @param {string} secret - The shared webhook secret key
 * @returns {boolean} True if the signature is valid, false otherwise
 */
export function verifyShopifyHmac(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody, typeof rawBody === 'string' ? 'utf8' : undefined)
      .digest('base64');

    const sigBuf = Buffer.from(signature, 'base64');
    const compBuf = Buffer.from(computed, 'base64');

    if (sigBuf.length !== compBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch {
    return false;
  }
}
