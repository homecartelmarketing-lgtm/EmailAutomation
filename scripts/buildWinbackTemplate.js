import fs from 'node:fs';
import path from 'node:path';

const rawHtml = fs.readFileSync('email-templates/customer_winback/email.html', 'utf8');

const code = `/**
 * Canva Luxury Customer Winback Email Template (Flow #4)
 * Replicated directly from email-templates/customer_winback/email.html
 * 
 * Features:
 * - High-impact re-engagement copy ("It’s been a while. We’d love to have you back")
 * - 10% appreciation discount claim button
 * - Curated category collections (Chandeliers, Pendant Lights, Table Lamps, Full Collection)
 * - Responsive layout with mobile scaling and full mso Outlook support
 * - Clean unified footer without physical address
 */

const rawTemplate = ${JSON.stringify(rawHtml)};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCanvaWinbackTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName : '';
  const claimUrl = context.claimUrl || 'https://homecartel.net';

  let html = rawTemplate;

  // 1. Rewrite relative image paths to absolute production URLs
  html = html.replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
    return attr + '="' + baseUrl + '/images/' + filename + '"';
  });

  // 2. Personalize greeting if customer name is provided
  if (customerName) {
    html = html.replace('It’s been a while.<br>', 'It’s been a while, ' + escapeHtml(customerName) + '.<br>');
  }

  // 3. Update claim button URL if customized
  if (claimUrl && claimUrl !== 'https://homecartel.net') {
    html = html.replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(claimUrl) + '"');
  }

  // 4. Replace template placeholders
  html = html.replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, unsubscribeUrl);
  html = html.replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, viewInBrowserUrl);

  const subject = customerName
    ? \`We miss you, \${customerName} | Enjoy 10% Off Your Next Order | HomeCartel\`
    : "It's been a while | We'd love to have you back (10% Off) | HomeCartel";

  return { subject, html };
}
`;

fs.writeFileSync(path.resolve('src/templates/canvaWinback.js'), code, 'utf8');
console.log('Successfully generated src/templates/canvaWinback.js');
