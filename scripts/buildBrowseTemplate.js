import fs from 'node:fs';
import path from 'node:path';

const rawHtml = fs.readFileSync('email-templates/browse_abandonment/email.html', 'utf8');

const code = `/**
 * Canva Luxury Browse Abandonment Email Template
 * Replicated directly from email-templates/browse_abandonment/email.html
 * 
 * Features:
 * - High-impact hero fixture callout ("You left a limited item behind")
 * - Dynamic fixture title, product link, and availability CTA
 * - Dynamic "More items you'll love" curated recommendations
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

export function renderCanvaBrowseTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || context.fixtureUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName : '';
  const fixtureTitle = context.fixtureTitle || 'Grajek | Shaded Table Lamp';
  const fixtureUrl = context.fixtureUrl || 'https://homecartel.net';
  const fixtureImage = context.fixtureImage;

  let html = rawTemplate;

  // 1. Rewrite relative image paths to absolute production URLs
  html = html.replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
    return attr + '="' + baseUrl + '/images/' + filename + '"';
  });

  // 2. Personalize viewed fixture title if dynamic
  if (fixtureTitle && fixtureTitle !== 'Grajek | Shaded Table Lamp') {
    html = html.replace('Grajek | Shaded Table Lamp', escapeHtml(fixtureTitle));
  }

  // 3. Replace hero fixture image if dynamic custom image provided
  if (fixtureImage) {
    html = html.replace(
      new RegExp(baseUrl + '/images/366023d2834a428fbcb8a67fe62f1fd6\\\\.jpg', 'g'),
      fixtureImage
    );
  }

  // 4. Update CTA button link
  if (fixtureUrl) {
    html = html.replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(fixtureUrl) + '"');
  }

  // 5. Replace placeholder furniture with curated authentic HomeCartel lighting fixtures
  const defaultRecommendations = [
    { title: 'Aura Modern Brass Chandelier', price: '₱18,500.00' },
    { title: 'Solomon Nordic Pendant Light', price: '₱4,200.00' },
    { title: 'Baron Square Ceiling Fixture', price: '₱2,850.00' }
  ];

  const recommendations = context.recommendations && context.recommendations.length > 0
    ? context.recommendations
    : defaultRecommendations;

  let recIdx = 0;
  html = html.replace(/Steel Chair in Warm Cedar<br>/g, () => {
    const item = recommendations[recIdx % recommendations.length];
    recIdx++;
    return escapeHtml(item.title) + '<br>';
  });

  let priceIdx = 0;
  html = html.replace(/\\$349\\.00<br>/g, () => {
    const item = recommendations[priceIdx % recommendations.length];
    priceIdx++;
    return escapeHtml(item.price) + '<br>';
  });

  // 6. Replace template placeholders
  html = html.replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, unsubscribeUrl);
  html = html.replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, viewInBrowserUrl);

  const subject = customerName
    ? \`Still thinking about \${fixtureTitle}, \${customerName}? | HomeCartel\`
    : \`You left a limited item behind: \${fixtureTitle} | HomeCartel\`;

  return { subject, html };
}
`;

fs.writeFileSync(path.resolve('src/templates/canvaBrowse.js'), code, 'utf8');
console.log('Successfully regenerated src/templates/canvaBrowse.js');
