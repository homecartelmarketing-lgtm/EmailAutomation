import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads valid configuration from environment variables', () => {
    const config = loadConfig({
      PORT: '3000',
      SHOP_DOMAIN: 'homecartel.net',
      SHOPIFY_WEBHOOK_SECRET: 'test_secret_123',
      EMAIL_PROVIDER: 'mock',
      DB_PATH: ':memory:'
    });
    expect(config.port).toBe(3000);
    expect(config.shopDomain).toBe('homecartel.net');
    expect(config.shopifyWebhookSecret).toBe('test_secret_123');
    expect(config.emailProvider).toBe('mock');
    expect(config.dbPath).toBe(':memory:');
  });

  it('throws an error when mandatory variables are missing', () => {
    expect(() => loadConfig({})).toThrow(/Missing required environment variable/);
  });
});
