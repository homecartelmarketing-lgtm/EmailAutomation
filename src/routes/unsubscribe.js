import crypto from 'node:crypto';

/**
 * Generates an HMAC SHA256 token for an email unsubscribe link.
 * @param {string} email
 * @param {string} secret
 * @returns {string}
 */
export function generateUnsubscribeToken(email, secret) {
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Validates an unsubscribe HMAC token.
 * @param {string} email
 * @param {string} token
 * @param {string} secret
 * @returns {boolean}
 */
export function verifyUnsubscribeToken(email, token, secret) {
  if (!email || !token || !secret) return false;
  const expected = generateUnsubscribeToken(email, secret);
  try {
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Registers One-Click Unsubscribe Routes
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase>, secret?: string }} options
 */
export async function registerUnsubscribeRoutes(app, { db, secret }) {
  app.get('/api/unsubscribe', async (req, reply) => {
    const { email, token } = req.query || {};
    if (!email) {
      return reply.code(400).send({ error: 'Missing email parameter' });
    }

    if (secret && token) {
      if (!verifyUnsubscribeToken(email, token, secret)) {
        return reply.code(403).send({ error: 'Invalid or expired unsubscribe token' });
      }
    }

    // Persist unsubscription status
    db.setCustomerUnsubscribed(email);

    const safeEmail = escapeHtml(email);

    reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unsubscribed — HomeCartel</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #f8f6f2; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); text-align: center; max-width: 480px; }
          h2 { color: #1a1a1a; margin-top: 0; }
          p { color: #666; line-height: 1.5; }
          a { color: #c59b27; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>You have successfully unsubscribed</h2>
          <p>The address <strong>${safeEmail}</strong> will no longer receive automated marketing or promotional emails from HomeCartel.</p>
          <p><a href="https://homecartel.net">Return to HomeCartel</a></p>
        </div>
      </body>
      </html>
    `);
  });
}
