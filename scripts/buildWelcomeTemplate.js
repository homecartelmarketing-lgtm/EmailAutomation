import fs from 'node:fs';
import path from 'node:path';

const rawHtml = fs.readFileSync(path.resolve('email.html'), 'utf8');

const code = `/**
 * Canva-designed Luxury Welcome Guide Template for HomeCartel
 * Features:
 * - 10% Off welcome discount callout
 * - Direct links to Chandeliers, Pendant Lights, Table Lamps & Full Collection
 * - Responsive layout with mobile scaling
 * - Full mso Outlook support
 * - Clean unified footer without physical address
 */

const rawTemplate = ${JSON.stringify(rawHtml)};

export function renderCanvaWelcomeTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName : '';

  let html = rawTemplate;

  // 1. Rewrite relative image paths to absolute Railway production URLs
  html = html.replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
    return attr + '="' + baseUrl + '/images/' + filename + '"';
  });

  // 2. Personalize greeting if customer name is available
  if (customerName) {
    html = html.replace(
      'Thank you for signing up! Enjoy',
      'Thank you for signing up, ' + customerName + '! Enjoy'
    );
  }

  // 3. Replace template placeholders
  html = html.replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, unsubscribeUrl);
  html = html.replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, viewInBrowserUrl);

  const subject = customerName 
    ? \`Welcome to HomeCartel, \${customerName} | Enjoy 10% Off\`
    : 'Welcome to HomeCartel | Enjoy 10% Off Your Next Order';

  return { subject, html };
}
`;

fs.writeFileSync(path.resolve('src/templates/canvaWelcome.js'), code, 'utf8');
console.log('Successfully regenerated src/templates/canvaWelcome.js without physical address');
