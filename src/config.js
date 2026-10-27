/**
 * Application Configuration Loader
 * Validates and loads environment configuration.
 */
export function loadConfig(env = process.env) {
  const shopDomain = env.SHOP_DOMAIN;
  if (!shopDomain) {
    throw new Error('Missing required environment variable: SHOP_DOMAIN');
  }

  const shopifyWebhookSecret = env.SHOPIFY_WEBHOOK_SECRET;
  if (!shopifyWebhookSecret) {
    throw new Error('Missing required environment variable: SHOPIFY_WEBHOOK_SECRET');
  }

  const port = parseInt(env.PORT || '3000', 10);
  const appBaseUrl = env.APP_BASE_URL || `http://localhost:${port}`;

  return {
    port,
    appBaseUrl,
    shopDomain,
    shopifyWebhookSecret,
    emailProvider: env.EMAIL_PROVIDER || 'mock',
    resendApiKey: env.RESEND_API_KEY || '',
    fromEmail: env.FROM_EMAIL || 'HomeCartel <support@homecartel.net>',
    dbPath: env.DB_PATH || './data/homecartel.db'
  };
}
