/**
 * Registers One-Click Unsubscribe Routes
 * @param {import('fastify').FastifyInstance} app
 * @param {{ db: ReturnType<import('../db/database.js').initDatabase> }} options
 */
export async function registerUnsubscribeRoutes(app, { db }) {
  app.get('/api/unsubscribe', async (req, reply) => {
    const { email } = req.query || {};
    if (!email) {
      return reply.code(400).send({ error: 'Missing email parameter' });
    }

    db.setCustomerUnsubscribed(email);

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
          <p>The address <strong>${email}</strong> will no longer receive automated marketing or promotional emails from HomeCartel.</p>
          <p><a href="https://homecartel.net">Return to HomeCartel</a></p>
        </div>
      </body>
      </html>
    `);
  });
}
