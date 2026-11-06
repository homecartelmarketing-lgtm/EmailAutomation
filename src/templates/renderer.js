import { renderCanvaCartTemplate } from './canvaCart.js';
import { renderCanvaWelcomeTemplate } from './canvaWelcome.js';

function wrapBaseLayout({ title, contentHtml, unsubscribeUrl = '#', viewInBrowserUrl = 'https://homecartel.net', baseUrl = 'https://emailautomation-production-d651.up.railway.app' }) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f1f5; font-family: Verdana, Geneva, sans-serif; color: #2b2b2b; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f1f5; padding: 30px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
    .header { width: 100%; text-align: center; background-color: #ffffff; }
    .content { padding: 36px 28px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #c59b27; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; text-align: center; margin-top: 20px; }
    .item-card { border: 1px solid #ebebeb; border-radius: 6px; padding: 14px 18px; margin: 12px 0; background: #fafafa; }
    .item-title { font-weight: 600; font-size: 15px; color: #1a1a1a; }
    .item-price { color: #c59b27; font-weight: bold; margin-top: 4px; }
    .footer { background-color: #ffffff; padding: 16px 24px 24px; text-align: center; font-size: 13.3px; color: #0d161b; font-family: Verdana, Geneva, sans-serif; }
    .footer hr { border: none; height: 1px; background-color: #0d161b; margin: 0 0 16px; }
    .footer p { margin: 6px 0; line-height: 22.4px; }
    .footer a { color: #0d161b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <a href="https://homecartel.net" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">
          <img src="${cleanBaseUrl}/images/3ef43aae1391d3855242f78c9975c8b9.png" width="600" height="180" alt="HomeCartel" style="display:block;width:100%;max-width:600px;height:auto;border:0">
        </a>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <hr>
        <p>You received this email from your activity on <strong><a href="https://homecartel.net" style="text-decoration:none;">homecartel.net</a></strong>.</p>
        <p><a href="${unsubscribeUrl}">Unsubscribe</a> | <a href="${viewInBrowserUrl}">View in browser</a></p>
        <p>© 2026 Home Cartel ®. All rights reserved.</p>
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
      return renderCanvaCartTemplate(context);
    }

    case 'welcome': {
      return renderCanvaWelcomeTemplate(context);
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
