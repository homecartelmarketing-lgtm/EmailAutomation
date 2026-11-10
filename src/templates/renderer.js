import { renderCanvaCartTemplate } from './canvaCart.js';
import {
  renderCanvaWelcomeTemplate,
  renderWelcomeSocialProofTemplate,
  renderWelcomeBestSellersTemplate
} from './canvaWelcome.js';
import { renderCanvaBrowseTemplate } from './canvaBrowse.js';
import { renderCanvaWinbackTemplate } from './canvaWinback.js';
import { renderPostPurchaseReviewTemplate } from './postPurchase.js';

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
 * @param {string} templateName - 'abandoned_cart' | 'welcome' | 'welcome_1' | 'welcome_2' | 'welcome_3' | 'post_purchase' | 'browse_abandonment' | 'winback'
 * @param {object} context
 * @returns {{ subject: string, html: string }}
 */
export function renderTemplate(templateName, context = {}) {
  switch (templateName) {
    case 'abandoned_cart':
      return renderCanvaCartTemplate(context);

    case 'welcome':
    case 'welcome_1':
      return renderCanvaWelcomeTemplate(context);

    case 'welcome_2':
      return renderWelcomeSocialProofTemplate(context);

    case 'welcome_3':
      return renderWelcomeBestSellersTemplate(context);

    case 'browse_abandonment':
      return renderCanvaBrowseTemplate(context);

    case 'winback':
      return renderCanvaWinbackTemplate(context);

    case 'post_purchase':
      return renderPostPurchaseReviewTemplate(context);

    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}
