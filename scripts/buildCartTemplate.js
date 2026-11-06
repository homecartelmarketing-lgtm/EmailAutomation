import fs from 'node:fs';
import path from 'node:path';

const rawHtml = fs.readFileSync('email-templates/cart_abandonment/email.html', 'utf8');

const itemHeaderMarker = 'Item<br></td></tr></tbody></table></td></tr></tbody></table></td><td width="0" style="width:0;box-sizing:border-box;font-size:0">&nbsp;</td><td width="50.00%" style="width:50.00%;box-sizing:border-box;vertical-align:top;background-color:#0d161b"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td style="padding:12px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td dir="ltr" style="color:#f5f5f5;font-size:16px;font-family:Verdana, Geneva, sans-serif;white-space:pre-wrap;text-align:left;line-height:1.4;mso-line-height-alt:22.4px">Price<br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr>';

const dividerBeforeTotal = '<tr><td style="padding:0px 24px 16px"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:552px"><tbody><tr><td height="1" style="height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#dddddd">&nbsp;</td></tr></tbody></table></td></tr></tbody></table></td></tr>';

const headerIdx = rawHtml.indexOf(itemHeaderMarker) + itemHeaderMarker.length;
const remainderIdx = rawHtml.indexOf(dividerBeforeTotal);

let rawHeader = rawHtml.substring(0, headerIdx);
// Strip static placeholder chair image preloads from <head>
rawHeader = rawHeader
  .replace(/<link rel="preload" as="image" href="images\/04c8b285c02346c0b1b567007090fc7e\.png">/g, '')
  .replace(/<link rel="preload" as="image" href="images\/3b8a6bf1dd2327d2e0d234126bb9a98d\.jpg">/g, '')
  .replace(/<link rel="preload" as="image" href="images\/0c4d1278d554ac33abad746c0c4bc05f\.jpg">/g, '');
const rawRemainder = rawHtml.substring(remainderIdx);

const code = `/**
 * Canva Luxury Cart Abandonment Email Template
 * Replicated directly from email-templates/cart_abandonment/email.html
 * 
 * Features:
 * - Direct links to Shopify cart recovery
 * - Dynamic items rendering with authentic lighting fixture fallbacks
 * - Dynamic subtotal in PHP (₱)
 * - Responsive layout with mobile scaling and full mso Outlook support
 * - Clean unified footer without physical address
 */

const rawHeader = ${JSON.stringify(rawHeader)};
const rawRemainder = ${JSON.stringify(rawRemainder)};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCanvaCartTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\\/+$/, '');
  const recoveryUrl = context.recoveryUrl || 'https://homecartel.net/cart';
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || recoveryUrl;

  // Authentic HomeCartel lighting fixture default samples
  const items = context.items && context.items.length > 0 ? context.items : [
    {
      title: 'Baron Square | Ceiling Mounted Light',
      price: '₱2,850.00',
      quantity: 1,
      imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482'
    },
    {
      title: 'Aerik | Ceiling Mounted Light (Gold)',
      price: '₱3,450.00',
      quantity: 1,
      imageUrl: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031'
    }
  ];

  // Calculate or format subtotal
  let subtotalStr = context.subtotal;
  if (!subtotalStr) {
    let numTotal = 0;
    for (const it of items) {
      const cleanNum = parseFloat(String(it.price || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanNum)) {
        numTotal += cleanNum * (it.quantity || 1);
      }
    }
    subtotalStr = numTotal > 0 ? ('₱' + numTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '₱6,300.00';
  } else if (!subtotalStr.startsWith('₱') && !subtotalStr.startsWith('$')) {
    const cleanNum = parseFloat(subtotalStr);
    subtotalStr = isNaN(cleanNum) ? subtotalStr : ('₱' + cleanNum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  // Authentic HomeCartel lighting fixture image fallbacks (never chairs or random furniture)
  const fallbackLightingImages = [
    'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
    'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031'
  ];

  const dynamicItemsHtml = items.map((item, idx) => {
    let itemImage = item.imageUrl || item.image;
    if (!itemImage || itemImage.includes('04c8b285c02346c0b1b567007090fc7e') || itemImage.includes('chair')) {
      const lower = (item.title || '').toLowerCase();
      if (lower.includes('aerik')) {
        itemImage = fallbackLightingImages[1];
      } else {
        itemImage = fallbackLightingImages[idx % fallbackLightingImages.length];
      }
    }

    let priceDisplay = item.price;
    if (typeof priceDisplay === 'number' || (priceDisplay && !String(priceDisplay).startsWith('₱') && !String(priceDisplay).startsWith('$'))) {
      const num = parseFloat(priceDisplay);
      priceDisplay = isNaN(num) ? priceDisplay : ('₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    const qtyText = item.quantity && item.quantity > 1 ? ' &times; ' + item.quantity : '';
    const itemUrl = item.url || recoveryUrl;

    return '<tr><td style="padding:0px 24px 16px"><table border="0" cellpadding="0" cellspacing="0" class="layout-item" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto"><tbody><tr><td style="text-align:center"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:552px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="48.55%" class="cart-item-col" style="width:48.55%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td><table cellpadding="0" cellspacing="0" border="0" class="cart-item-img-table" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:268px"><tbody><tr><td style="width:100%"><a href="' + escapeHtml(itemUrl) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block"><img src="' + itemImage + '" class="cart-item-img" width="268" height="204" style="display:block;width:268px;height:auto;max-width:100%;border-radius:6px;object-fit:cover" alt="' + escapeHtml(item.title) + '"></a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td><td width="16" class="cart-item-spacer" style="width:16px;box-sizing:border-box;font-size:0">&nbsp;</td><td width="48.55%" class="cart-item-col" style="width:48.55%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td class="cart-item-info" style="padding:18px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word"><tbody><tr><td dir="ltr" class="ers-fs-213" style="font-size:21.3px;font-weight:700;font-family:Verdana, Geneva, sans-serif;white-space:pre-wrap;text-align:left;padding:0px 0px 16px;line-height:1.4;mso-line-height-alt:29.8px"><a href="' + escapeHtml(itemUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:none">' + escapeHtml(item.title) + qtyText + '</a><br></td></tr><tr><td dir="ltr" style="font-size:16px;font-family:Verdana, Geneva, sans-serif;white-space:pre-wrap;text-align:left;line-height:1.4;mso-line-height-alt:22.4px"><span style="font-weight:700;color:#0d161b">' + escapeHtml(priceDisplay) + '</span><br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr>';
  }).join('');

  let header = rawHeader
    .replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/href="https:\\/\\/homecartel\\.net"/g, 'href="' + escapeHtml(recoveryUrl) + '"');

  let remainder = rawRemainder
    .replace(/(src|href)=["']images\\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/\\$737\\.00/g, escapeHtml(subtotalStr))
    .replace(/\\{\\{\\s*unsubscribe\\s*\\}\\}/g, unsubscribeUrl)
    .replace(/\\{\\{\\s*view_in_browser\\s*\\}\\}/g, viewInBrowserUrl);

  const fullHtml = header + dynamicItemsHtml + remainder;
  const customerName = context.customerName ? ', ' + context.customerName : '';

  return {
    subject: 'Did you leave something behind' + customerName + '? | Still thinking it over? | HomeCartel',
    html: fullHtml
  };
}
`;

fs.writeFileSync(path.resolve('src/templates/canvaCart.js'), code, 'utf8');
console.log('Successfully regenerated src/templates/canvaCart.js');
