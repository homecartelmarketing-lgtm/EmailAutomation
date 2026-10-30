/**
 * Application Configuration Loader
 * Validates and loads environment configuration.
 */
export function loadConfig(env = process.env) {
  const shopDomain = env.SHOP_DOMAIN || 'homecartel.net';

  // Support both standard underscore naming and space-separated naming from dashboard
  const shopifyWebhookSecret = env.SHOPIFY_WEBHOOK_SECRET ||
    env['SHOPIFY WEBHOOK SECRET'] ||
    env.SHOPIFY_SECRET;

  if (!shopifyWebhookSecret) {
    throw new Error('Missing required environment variable: SHOPIFY_WEBHOOK_SECRET');
  }

  const port = parseInt(env.PORT || '3000', 10);
  const appBaseUrl = env.APP_BASE_URL ||
    (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${port}`);

  return {
    port,
    appBaseUrl,
    shopDomain,
    shopifyWebhookSecret,
    emailProvider: env.EMAIL_PROVIDER || env['EMAIL PROVIDER'] || 'mock',
    resendApiKey: env.RESEND_API_KEY || env['RESEND API KEY'] || '',
    fromEmail: env.FROM_EMAIL || env['FROM EMAIL'] || 'HomeCartel <support@homecartel.net>',
    dbPath: env.DB_PATH || './data/homecartel.db'
  };
}
