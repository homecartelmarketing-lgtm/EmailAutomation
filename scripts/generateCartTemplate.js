import fs from 'node:fs';

const rawHtml = fs.readFileSync('email-templates/cart_abandonment/email.html', 'utf8');

// 1. Part 1: from start up to the first cart item table
const p1Marker = '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-1"';
const p1EndIdx = rawHtml.indexOf(p1Marker);
let rawHeader = rawHtml.substring(0, p1EndIdx);

// Remove preloads for Canva placeholder product images
rawHeader = rawHeader.replace(/<link rel="preload" as="image" href="images\/(ccf0df87c4814653202adf4b19c60e5c|b425fe1f3e9750056ea70120b8c40f97|eea3c97993f62b4d9c5267094eca4cfd|726aa29b02c62565f3151bd782f92ef8|765e0aca26cd80db2d5701ca74fb1f9d)\.(png|jpg)">/g, '');

// 2. Part 2: between cart items and recommendations (divider, second checkout button, divider, "You may also like:")
const p2StartMarker = '<tr><td style="padding:0px 24px 16px"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:552px"><tbody><tr><td height="1" style="height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#dddddd">';
const p2StartIdx = rawHtml.indexOf(p2StartMarker, p1EndIdx);
const p2EndMarker = '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-3"';
const p2EndIdx = rawHtml.indexOf(p2EndMarker);
const rawMid = rawHtml.substring(p2StartIdx, p2EndIdx);

// 3. Part 3: from layout-4 to end (footer)
const p3StartMarker = '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-4"';
const p3StartIdx = rawHtml.indexOf(p3StartMarker);
const rawFooter = rawHtml.substring(p3StartIdx);

console.log('rawHeader length:', rawHeader.length);
console.log('rawMid length:', rawMid.length);
console.log('rawFooter length:', rawFooter.length);

const generatedCode = `/**
 * Canva Luxury Cart Abandonment Email Template (2nd Version)
 * Replicated directly from email-templates/cart_abandonment/email.html
 * 
 * Features:
 * - Direct links to Shopify cart recovery with auto-applied discount (WELCOME10)
 * - Dynamic "In your cart:" section responsive to customer's actual cart items
 * - Dynamic "You may also like:" section 100% responsive to customer's browsing history on the website
 * - Authentic HomeCartel lighting bestseller fallbacks when browsing history has < 3 items
 * - Philippine Peso (₱) formatting
 * - Zero physical address (never Banawe Street)
 * - Full MSO Outlook and mobile responsive styling
 */

const rawHeader = ${JSON.stringify(rawHeader)};
const rawMid = ${JSON.stringify(rawMid)};
const rawFooter = ${JSON.stringify(rawFooter)};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(val) {
  if (!val) return '₱3,995.00';
  const cleanNum = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(cleanNum) ? String(val) : ('₱' + cleanNum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

function addDiscount(url, code = 'WELCOME10') {
  if (!url) return 'https://homecartel.net';
  if (url.includes('discount=')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + 'discount=' + encodeURIComponent(code);
}

// Authentic HomeCartel fallback recommendations matching real products on homecartel.net
const DEFAULT_RECOMMENDATIONS = [
  {
    title: 'Talisa | Modern Chandelier',
    price: '₱27,920.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/t2_b06b3de7-0e1d-42a9-98a9-3e015a618d6e.jpg?v=1685505425',
    url: 'https://homecartel.net/products/talisa-modern-chandelier'
  },
  {
    title: 'Kevin | Pendant Light',
    price: '₱3,970.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/Kevin-ModelPhoto-clean.jpg?v=1795013714',
    url: 'https://homecartel.net/products/kevin-pendant-light'
  },
  {
    title: 'Lorvanar | Alabaster Pendant Light',
    price: '₱41,500.00',
    imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/64fbd9107f02d0e14fe3ca29fd6a6e0bfaab8e81_img.jpg?v=1775610039',
    url: 'https://homecartel.net/products/lorvanar-alabaster-pendant-light'
  }
];

export function renderCanvaCartTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const rawRecoveryUrl = context.recoveryUrl || 'https://homecartel.net/cart';
  const checkoutUrl = addDiscount(rawRecoveryUrl, 'WELCOME10');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || checkoutUrl;
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName : '';

  // 1. Dynamic Cart Line Items ("In your cart:")
  const items = Array.isArray(context.items) && context.items.length > 0 ? context.items : [
    {
      title: 'Soeren | Luxe White Glass Chandelier with Brass Detail',
      price: '₱55,495.00',
      quantity: 1,
      imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebg_2b12c008-d634-40f8-84cd-5b8154745288.jpg?v=1615166204',
      url: 'https://homecartel.net/products/soeren-luxxe-white-glass-chandelier-with-brass-detail'
    },
    {
      title: 'Darynthas | Pendant Light',
      price: '₱3,995.00',
      quantity: 1,
      imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/4019f2b8e0cd1e1fa4f912341c092de48f881ffc_img.jpg?v=1775585080',
      url: 'https://homecartel.net/products/darynthas-i-pendant-light'
    }
  ];

  const defaultItemImages = [
    'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebg_2b12c008-d634-40f8-84cd-5b8154745288.jpg?v=1615166204',
    'https://cdn.shopify.com/s/files/1/1870/0659/files/4019f2b8e0cd1e1fa4f912341c092de48f881ffc_img.jpg?v=1775585080'
  ];

  const cartItemsHtml = items.map((item, idx) => {
    let itemImage = item.imageUrl || item.image || defaultItemImages[idx % defaultItemImages.length];
    if (itemImage.includes('726aa29b02c62565f3151bd782f92ef8') || itemImage.includes('765e0aca26cd80db2d5701ca74fb1f9d')) {
      itemImage = defaultItemImages[idx % defaultItemImages.length];
    }
    const qty = item.quantity || 1;
    const priceDisplay = formatPrice(item.price);
    const itemUrl = addDiscount(item.url || rawRecoveryUrl, 'WELCOME10');

    return '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-item" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto"><tbody><tr><td style="text-align:center"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:552px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="31.40%" style="width:31.40%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:174px"><tbody><tr><td style="width:100%"><a href="' + escapeHtml(itemUrl) + '" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none"><img src="' + escapeHtml(itemImage) + '" width="174" height="133" style="display:block;width:174px;height:auto;max-width:100%;border-radius:4px;object-fit:cover" alt="' + escapeHtml(item.title) + '"></a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td><td width="16" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td><td width="31.40%" style="width:31.40%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td style="padding:18px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td dir="ltr" class="ers-fs-187" style="font-size:18.7px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:right;line-height:1.4;mso-line-height-alt:26.2px">' + qty + '<br></td></tr></tbody></table></td></tr></tbody></table></td><td width="16" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td><td width="31.40%" style="width:31.40%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td style="padding:18px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td dir="ltr" class="ers-fs-213" style="font-size:21.3px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:left;padding:0px 0px 16px;line-height:1.4;mso-line-height-alt:29.8px"><a href="' + escapeHtml(itemUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:none">' + escapeHtml(item.title) + '</a><br></td></tr><tr><td dir="ltr" style="font-size:16px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:left;line-height:1.4;mso-line-height-alt:22.4px">' + escapeHtml(priceDisplay) + '<br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr>';
  }).join('');

  // 2. Dynamic Recommendations ("You may also like:") responsive to customer browsing history
  const viewedItems = Array.isArray(context.viewedItems) ? context.viewedItems : [];
  const cartTitles = new Set(items.map(it => (it.title || '').trim().toLowerCase()));

  const recommendations = [];
  const seenRecTitles = new Set();

  // Pick up to 3 browsed items not already in the customer's cart
  for (const v of viewedItems) {
    if (recommendations.length >= 3) break;
    const cleanTitle = (v.title || '').trim();
    if (cleanTitle && !cartTitles.has(cleanTitle.toLowerCase()) && !seenRecTitles.has(cleanTitle.toLowerCase())) {
      seenRecTitles.add(cleanTitle.toLowerCase());
      const fallbackImg = DEFAULT_RECOMMENDATIONS[recommendations.length % DEFAULT_RECOMMENDATIONS.length].imageUrl;
      let img = v.imageUrl || v.image;
      if (!img || img.includes('ccf0df87c4814653202adf4b19c60e5c') || img.includes('b425fe1f3e9750056ea70120b8c40f97') || img.includes('eea3c97993f62b4d9c5267094eca4cfd')) {
        img = fallbackImg;
      }
      recommendations.push({
        title: cleanTitle,
        price: formatPrice(v.price),
        imageUrl: img,
        url: addDiscount(v.url || 'https://homecartel.net', 'WELCOME10')
      });
    }
  }

  // Fallback to authentic lighting bestsellers if customer browsed fewer than 3 items
  for (let i = 0; i < DEFAULT_RECOMMENDATIONS.length && recommendations.length < 3; i++) {
    const fallback = DEFAULT_RECOMMENDATIONS[i];
    if (!seenRecTitles.has(fallback.title.toLowerCase()) && !cartTitles.has(fallback.title.toLowerCase())) {
      seenRecTitles.add(fallback.title.toLowerCase());
      recommendations.push({
        title: fallback.title,
        price: fallback.price,
        imageUrl: fallback.imageUrl,
        url: addDiscount(fallback.url, 'WELCOME10')
      });
    }
  }

  // Render 3 recommendation cards into layout-3
  const recCardsHtml = recommendations.map(rec => {
    return '<td width="31.40%" style="width:31.40%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td style="padding:0px 0px 8px"><a href="' + escapeHtml(rec.url) + '" target="_blank" rel="noopener nofollow" ses:no-track="" style="display:block;text-decoration:none;border:none;outline:none" aria-label="' + escapeHtml(rec.title) + '"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:174px"><tbody><tr><td style="width:100%"><img src="' + escapeHtml(rec.imageUrl) + '" width="174" height="215" style="display:block;width:174px;height:auto;max-width:100%;border-radius:4px;object-fit:cover" alt="' + escapeHtml(rec.title) + '"></td></tr></tbody></table></td></tr></tbody></table></a></td></tr><tr><td dir="ltr" class="ers-fs-187" style="font-size:18.7px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 0px 8px;line-height:1.4;mso-line-height-alt:26.2px"><a href="' + escapeHtml(rec.url) + '" target="_blank" rel="noopener nofollow" ses:no-track="" style="color:inherit;text-decoration:none">' + escapeHtml(rec.title) + '</a><br></td></tr><tr><td dir="ltr" style="font-size:16px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 0px 16px;line-height:1.4;mso-line-height-alt:22.4px">' + escapeHtml(rec.price) + '<br></td></tr><tr><td><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><!--[if mso]><table cellpadding="0" cellspacing="0" border="0" width="114" style="width:114px"><tbody><tr><td><![endif]--><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:114px"><tbody><tr><td style="width:100%"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' + escapeHtml(rec.url) + '" style="height:37px;width:114px;v-text-anchor:middle;" arcsize="0%" fillcolor="#ff9900"><v:stroke dashstyle="Solid" weight="0px" color="#ff9900"/><w:anchorlock/><v:textbox inset="0px,0px,0px,0px"><center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:16.3px;font-weight:700">BUY NOW</center></v:textbox></v:roundrect><![endif]--><!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:100%;border-collapse:separate;border-spacing:0"><tbody><tr><td bgcolor="#ff9900" style="background-color:#ff9900;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:0px;border-right:0px solid transparent;border-top:0px solid transparent;mso-border-alt:none"><a href="' + escapeHtml(rec.url) + '" target="_blank" rel="noopener" ses:no-track="" style="color:#ffffff;text-decoration:none;display:block;padding-top:7px;padding-bottom:7px;padding-left:8px;padding-right:8px;text-align:center;font-family:Tahoma, Geneva, sans-serif;font-size:16.3px;font-weight:700;letter-spacing:0em;line-height:22.8px;box-sizing:border-box;mso-line-height-rule:exactly"><span style="word-break:break-word;line-height:22.8px;color:#ffffff;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#ffffff">BUY NOW</span></a></td></tr></tbody></table><!--<![endif]--></td></tr></tbody></table><!--[if mso]></td></tr></tbody></table><![endif]--></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td>';
  });

  const recommendationsTableHtml = '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-3" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto"><tbody><tr><td style="text-align:center"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:552px;table-layout:fixed;margin:0 auto"><tbody><tr>' + recCardsHtml.join('<td width="16" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td>') + '</tr></tbody></table></td></tr></tbody></table></td></tr>';

  // Assemble full HTML
  let header = rawHeader
    .replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(checkoutUrl) + '"');

  let mid = rawMid
    .replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(checkoutUrl) + '"');

  let footer = rawFooter
    .replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, escapeHtml(unsubscribeUrl))
    .replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, escapeHtml(viewInBrowserUrl));

  const fullHtml = header + cartItemsHtml + mid + recommendationsTableHtml + footer;

  const subject = customerName
    ? customerName + ', your favorites are still waiting | 10% off with code WELCOME10'
    : 'Your favorites are still waiting | Complete your order with 10% off';

  return {
    subject,
    html: fullHtml
  };
}
`;

fs.writeFileSync('src/templates/canvaCart.js', generatedCode, 'utf8');
console.log('Successfully generated src/templates/canvaCart.js');
