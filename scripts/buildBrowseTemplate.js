import fs from 'node:fs';
import path from 'node:path';

const rawHtml = fs.readFileSync('email-templates/browse_abandonment/email.html', 'utf8');

const code = `/**
 * Canva Luxury Browse Abandonment Email Template
 * Replicated directly from email-templates/browse_abandonment/email.html
 * 
 * Features:
 * - High-impact hero fixture callout ("You left a limited item behind")
 * - Hero photo is 100% responsive to the most recent item browsed by the user
 * - "More items you'll love" section photos and cards are 100% responsive to browsing history
 * - Clickable product links on all photos, titles, and CTA buttons
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

function formatPrice(val) {
  if (!val) return '₱3,450.00';
  const s = String(val).trim();
  if (s.startsWith('₱') || s.startsWith('$')) return s;
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? s : ('₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

// Authentic HomeCartel lighting catalog fallbacks
const DEFAULT_CATALOG_FIXTURES = [
  {
    title: 'Aura Modern Brass Chandelier',
    price: '₱18,500.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
    url: 'https://homecartel.net/products/aura-modern-brass-chandelier'
  },
  {
    title: 'Solomon Nordic Pendant Light',
    price: '₱4,200.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
    url: 'https://homecartel.net/products/solomon-nordic-pendant'
  },
  {
    title: 'Baron Square Ceiling Fixture',
    price: '₱2,850.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
    url: 'https://homecartel.net/products/baron-square-ceiling-light'
  },
  {
    title: 'Aerik Modern Gold Ceiling Light',
    price: '₱3,450.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
    url: 'https://homecartel.net/products/aerik-ceiling-light'
  }
];

export function renderCanvaBrowseTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName : '';

  // 1. Resolve Hero Item (Most recent item browsed)
  let heroItem = {
    title: context.fixtureTitle || 'Grajek | Shaded Table Lamp',
    price: formatPrice(context.fixturePrice || '3450.00'),
    imageUrl: context.fixtureImage || (baseUrl + '/images/366023d2834a428fbcb8a67fe62f1fd6.jpg'),
    url: context.fixtureUrl || 'https://homecartel.net'
  };

  // If viewedItems array is passed, the first item is the most recent browsed item
  if (Array.isArray(context.viewedItems) && context.viewedItems.length > 0) {
    const mostRecent = context.viewedItems[0];
    heroItem = {
      title: mostRecent.title || heroItem.title,
      price: formatPrice(mostRecent.price || heroItem.price),
      imageUrl: mostRecent.imageUrl || mostRecent.image || heroItem.imageUrl,
      url: mostRecent.url || heroItem.url
    };
  }

  const viewInBrowserUrl = context.viewInBrowserUrl || heroItem.url || 'https://homecartel.net';

  // 2. Resolve Recommendations ("More items you'll love" - responsive to browsing history)
  let recommendations = [];
  if (Array.isArray(context.recommendations) && context.recommendations.length > 0) {
    recommendations = [...context.recommendations];
  } else if (Array.isArray(context.viewedItems) && context.viewedItems.length > 1) {
    // Items 2, 3, 4 from history
    recommendations = context.viewedItems.slice(1).map(it => ({
      title: it.title,
      price: formatPrice(it.price),
      imageUrl: it.imageUrl || it.image,
      url: it.url || 'https://homecartel.net'
    }));
  }

  // Backfill with authentic catalog fixtures if history has fewer than 3 items
  for (const fallback of DEFAULT_CATALOG_FIXTURES) {
    if (recommendations.length >= 3) break;
    const fallbackTitleLower = fallback.title.toLowerCase();
    const heroTitleLower = heroItem.title.toLowerCase();
    if (!recommendations.some(r => (r.title || '').toLowerCase() === fallbackTitleLower) &&
        !heroTitleLower.includes(fallbackTitleLower) &&
        !fallbackTitleLower.includes(heroTitleLower)) {
      recommendations.push(fallback);
    }
  }

  // Fallback if still under 3
  while (recommendations.length < 3) {
    recommendations.push(DEFAULT_CATALOG_FIXTURES[recommendations.length % DEFAULT_CATALOG_FIXTURES.length]);
  }

  let html = rawTemplate;

  // 3. Preload tags in <head>: replace placeholder preloads with dynamic hero and recommendation images
  html = html.replace(
    '<link rel="preload" as="image" href="images/366023d2834a428fbcb8a67fe62f1fd6.jpg">',
    '<link rel="preload" as="image" href="' + escapeHtml(heroItem.imageUrl) + '">'
  );
  html = html.replace(
    '<link rel="preload" as="image" href="images/dd37a0048d6b92a55ad7d360fc06951f.png">',
    '<link rel="preload" as="image" href="' + escapeHtml(recommendations[0].imageUrl) + '">'
  );
  html = html.replace(
    '<link rel="preload" as="image" href="images/ec1f40a02977cf474dfda728c4cc9e53.png">',
    '<link rel="preload" as="image" href="' + escapeHtml(recommendations[1].imageUrl) + '">'
  );
  html = html.replace(
    '<link rel="preload" as="image" href="images/0d4bd847cd36449b3d3c1bf962f9ec3b.png">',
    '<link rel="preload" as="image" href="' + escapeHtml(recommendations[2].imageUrl) + '">'
  );

  // 4. Hero Photo: replace static image with responsive most recent browsed item photo & clickable link
  const staticHeroImgTag = '<img src="images/366023d2834a428fbcb8a67fe62f1fd6.jpg" width="552" height="420" style="display:block;width:552px;height:auto;max-width:100%">';
  const dynamicHeroImgTag = '<a href="' + escapeHtml(heroItem.url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">' +
    '<img src="' + escapeHtml(heroItem.imageUrl) + '" width="552" height="420" style="display:block;width:552px;height:auto;max-width:100%;border-radius:8px;object-fit:cover" alt="' + escapeHtml(heroItem.title) + '">' +
    '</a>';
  html = html.replace(staticHeroImgTag, dynamicHeroImgTag);

  // 5. Hero Product Title: replace with responsive browsed product title & link
  html = html.replace(
    'Grajek | Shaded Table Lamp',
    '<a href="' + escapeHtml(heroItem.url) + '" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">' + escapeHtml(heroItem.title) + '</a>'
  );

  // 6. Hero CTA Button: update link to the viewed fixture
  html = html.replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(heroItem.url) + '"');

  // 7. "More items you'll love" Photos: replace 3 placeholder images with responsive history photos
  const staticCard1Img = '<img src="images/dd37a0048d6b92a55ad7d360fc06951f.png" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%">';
  const dynamicCard1Img = '<a href="' + escapeHtml(recommendations[0].url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">' +
    '<img src="' + escapeHtml(recommendations[0].imageUrl) + '" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%;border-radius:6px;object-fit:cover" alt="' + escapeHtml(recommendations[0].title) + '">' +
    '</a>';
  html = html.replace(staticCard1Img, dynamicCard1Img);

  const staticCard2Img = '<img src="images/ec1f40a02977cf474dfda728c4cc9e53.png" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%">';
  const dynamicCard2Img = '<a href="' + escapeHtml(recommendations[1].url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">' +
    '<img src="' + escapeHtml(recommendations[1].imageUrl) + '" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%;border-radius:6px;object-fit:cover" alt="' + escapeHtml(recommendations[1].title) + '">' +
    '</a>';
  html = html.replace(staticCard2Img, dynamicCard2Img);

  const staticCard3Img = '<img src="images/0d4bd847cd36449b3d3c1bf962f9ec3b.png" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%">';
  const dynamicCard3Img = '<a href="' + escapeHtml(recommendations[2].url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">' +
    '<img src="' + escapeHtml(recommendations[2].imageUrl) + '" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%;border-radius:6px;object-fit:cover" alt="' + escapeHtml(recommendations[2].title) + '">' +
    '</a>';
  html = html.replace(staticCard3Img, dynamicCard3Img);

  // 8. "More items you'll love" Titles & Prices: replace placeholder text with responsive history titles & prices
  let recIdx = 0;
  html = html.replace(/Steel Chair in Warm Cedar<br>/g, () => {
    const item = recommendations[recIdx % recommendations.length];
    recIdx++;
    return '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:none">' + escapeHtml(item.title) + '</a><br>';
  });

  let priceIdx = 0;
  html = html.replace(/\\$349\\.00<br>/g, () => {
    const item = recommendations[priceIdx % recommendations.length];
    priceIdx++;
    return '<span style="font-weight:700;color:#0d161b">' + escapeHtml(formatPrice(item.price)) + '</span><br>';
  });

  // 9. Rewrite remaining relative images (header banner and lifestyle room banner) to absolute URLs
  html = html.replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
    return attr + '="' + baseUrl + '/images/' + filename + '"';
  });

  // 10. Replace template placeholders
  html = html.replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, unsubscribeUrl);
  html = html.replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, viewInBrowserUrl);

  const subject = customerName
    ? \`Still thinking about \${heroItem.title}, \${customerName}? | HomeCartel\`
    : \`You left a limited item behind: \${heroItem.title} | HomeCartel\`;

  return { subject, html };
}
`;

fs.writeFileSync(path.resolve('src/templates/canvaBrowse.js'), code, 'utf8');
console.log('Successfully generated src/templates/canvaBrowse.js with responsive hero and history recommendations');
