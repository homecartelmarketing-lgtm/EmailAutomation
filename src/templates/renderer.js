const STORE_ADDRESS = '673 Banawe Street, Santa Mesa Heights, Quezon City, Metro Manila, Philippines';

function wrapBaseLayout({ title, contentHtml, unsubscribeUrl = '#' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2b2b2b; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8f6f2; padding: 30px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
    .header { background-color: #1a1a1a; padding: 28px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; }
    .content { padding: 36px 28px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #c59b27; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; text-align: center; margin-top: 20px; }
    .item-card { border: 1px solid #ebebeb; border-radius: 6px; padding: 14px 18px; margin: 12px 0; background: #fafafa; }
    .item-title { font-weight: 600; font-size: 15px; color: #1a1a1a; }
    .item-price { color: #c59b27; font-weight: bold; margin-top: 4px; }
    .footer { background-color: #f1ede6; padding: 24px 20px; text-align: center; font-size: 12px; color: #7a7a7a; border-top: 1px solid #e5dfd5; }
    .footer p { margin: 6px 0; }
    .footer a { color: #555555; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>HOMECARTEL</h1>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p><strong>HomeCartel Lighting & Home Decor</strong></p>
        <p>${STORE_ADDRESS}</p>
        <p>You received this email because of your activity on homecartel.net.</p>
        <p><a href="${unsubscribeUrl}">Unsubscribe from marketing emails</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders a responsive HTML email for a given behavioral flow.
 * @param {string} templateName - 'abandoned_cart' | 'welcome' | 'post_purchase' | 'browse_abandonment' | 'winback'
 * @param {object} context
 * @returns {{ subject: string, html: string }}
 */
export function renderTemplate(templateName, context = {}) {
  const { customerName = 'there', unsubscribeUrl = '#' } = context;

  switch (templateName) {
    case 'abandoned_cart': {
      const items = context.items || [];
      const recoveryUrl = context.recoveryUrl || 'https://homecartel.net/cart';
      const itemsHtml = items.map(item => `
        <div class="item-card">
          <div class="item-title">${item.title || 'Selected Fixture'}</div>
          <div class="item-price">${item.price || ''}</div>
        </div>
      `).join('');

      const contentHtml = `
        <h2>Did you leave something behind, ${customerName}?</h2>
        <p>We saved your favorite lighting fixtures in your cart so you won't lose them.</p>
        ${itemsHtml}
        <p>Ready to complete your space? Finish checking out now and we'll prepare your fixtures for careful delivery.</p>
        <div style="text-align: center;">
          <a href="${recoveryUrl}" class="btn">Restore My Cart & Checkout</a>
        </div>
      `;

      return {
        subject: `Did you leave something behind, ${customerName}? | HomeCartel`,
        html: wrapBaseLayout({ title: 'Complete your order', contentHtml, unsubscribeUrl })
      };
    }

    case 'welcome': {
      const contentHtml = `
        <h2>Welcome to HomeCartel, ${customerName}!</h2>
        <p>Thank you for subscribing to our community. We believe great lighting elevates any interior from ordinary to extraordinary.</p>
        <p>Explore our signature collections:</p>
        <ul>
          <li><strong>Pendant Lights:</strong> Perfect for kitchen islands, dining tables, and accent corners.</li>
          <li><strong>Statement Chandeliers:</strong> Centerpieces designed for high ceilings and open living areas.</li>
          <li><strong>Architectural Wall Sconces:</strong> Ambient layers of warm glow for hallways and bedframes.</li>
        </ul>
        <div style="text-align: center;">
          <a href="https://homecartel.net/collections/all" class="btn">Explore All Collections</a>
        </div>
      `;

      return {
        subject: `Welcome to HomeCartel, ${customerName}! Let's illuminate your space`,
        html: wrapBaseLayout({ title: 'Welcome to HomeCartel', contentHtml, unsubscribeUrl })
      };
    }

    case 'post_purchase': {
      const orderNumber = context.orderNumber || '';
      const contentHtml = `
        <h2>How is your recent order ${orderNumber ? `#${orderNumber}` : ''}, ${customerName}?</h2>
        <p>We hope your new HomeCartel lighting fixtures arrived safely and look stunning in your home.</p>
        <h3>Installation & Care Tips:</h3>
        <p>• Always turn off the circuit breaker before installing any fixture.<br>
           • For best ambiance, we recommend 2700K or 3000K warm white LED bulbs.<br>
           • Clean brass and metal surfaces with a dry microfiber cloth; avoid harsh chemical cleaners.</p>
        <p>Would you share a quick photo or review to let us know how they look?</p>
        <div style="text-align: center;">
          <a href="https://homecartel.net" class="btn">Share Your Review</a>
        </div>
      `;

      return {
        subject: `How is your recent order ${orderNumber ? `#${orderNumber}` : ''}? | HomeCartel`,
        html: wrapBaseLayout({ title: 'Order Follow-up', contentHtml, unsubscribeUrl })
      };
    }

    case 'browse_abandonment': {
      const fixtureTitle = context.fixtureTitle || 'your favorite fixture';
      const contentHtml = `
        <h2>Still thinking about ${fixtureTitle}, ${customerName}?</h2>
        <p>We noticed you were exploring our fixtures recently. Statement lighting requires thought, and we're here to help you get the sizing and luminescence right.</p>
        <div style="text-align: center;">
          <a href="${context.fixtureUrl || 'https://homecartel.net'}" class="btn">Take Another Look</a>
        </div>
      `;

      return {
        subject: `Still thinking about ${fixtureTitle}? | HomeCartel`,
        html: wrapBaseLayout({ title: 'Browse Follow-up', contentHtml, unsubscribeUrl })
      };
    }

    case 'winback': {
      const contentHtml = `
        <h2>We miss you, ${customerName}!</h2>
        <p>It's been a while since your last visit to HomeCartel. We've added new chandeliers, minimalist wall sconces, and outdoor architectural fixtures to our lineup.</p>
        <div style="text-align: center;">
          <a href="https://homecartel.net/collections/new-arrivals" class="btn">View New Arrivals</a>
        </div>
      `;

      return {
        subject: `We miss you at HomeCartel | Discover our newest fixtures`,
        html: wrapBaseLayout({ title: 'New Arrivals', contentHtml, unsubscribeUrl })
      };
    }

    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}
