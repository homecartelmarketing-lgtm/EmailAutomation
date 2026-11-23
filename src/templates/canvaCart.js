/**
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

const rawHeader = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><html xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\"><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><link rel=\"preload\" as=\"image\" href=\"images/8ab0bf732ae590e7f9a50f94764172f8.png\"><link rel=\"preload\" as=\"image\" href=\"images/cee2469f847556a707b454a847e0cdd0.jpg\"><link rel=\"preload\" as=\"image\" href=\"images/7b7eb5e0aff51ffa87b12afa34ffb1c2.png\"><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"><meta name=\"format-detection\" content=\"telephone=no, date=no, address=no, email=no\"><meta name=\"x-apple-disable-message-reformatting\"><meta name=\"keywords\" content=\"DAHaY3vXVok, BAGkOITyY_4\"><style>body{margin:0;padding:0}table{mso-table-lspace:0;mso-table-rspace:0}p,span,h1,h2,h3,h4,h5,h6{margin:0;padding:0}p{line-height:inherit}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}img+div{display:none}@media (max-width:599px){.ecw{width:100%!important;min-width:0!important}}</style><!--[if mso]><div>\n                <noscript>\n                  <xml>\n                    <w:WordDocument xmlns:w=\"urn:schemas-microsoft-com:office:word\">\n                      <w:DontUseAdvancedTypographyReadingMail/>\n                    </w:WordDocument>\n                    <o:OfficeDocumentSettings>\n                      <o:AllowPNG/>\n                      <o:PixelsPerInch>96</o:PixelsPerInch>\n                    </o:OfficeDocumentSettings>\n                  </xml>\n                </noscript></div><![endif]--><style>@media(max-width:550px){.ers-fs-173{font-size:16.7px!important}.ers-fs-187{font-size:17.4px!important}.ers-fs-213{font-size:18.7px!important}.ers-fs-240{font-size:20px!important}.ers-fs-293{font-size:22.7px!important}.ers-fs-347{font-size:25.4px!important}}</style></head><body style=\"width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0\"><table width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" bgcolor=\"#f0f1f5\" style=\"background-color:#f0f1f5\"><tbody><tr><td style=\"background-color:#f0f1f5\"><!--[if mso]><center>\n                    <table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\">\n                      <tbody>\n                        <tr>\n                          <td><![endif]--><table align=\"center\" width=\"600\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" class=\"ecw\" style=\"max-width:600px;min-height:600px;margin:0 auto;background-color:#ffffff;width:600px;min-width:600px\"><tbody><tr><td style=\"vertical-align:top\"></td></tr><tr><td style=\"vertical-align:top\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px\"><tbody><tr><td style=\"width:100%\"><img src=\"images/8ab0bf732ae590e7f9a50f94764172f8.png\" width=\"600\" height=\"150\" style=\"display:block;width:600px;height:auto;max-width:100%\"></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"vertical-align:top;padding:0px\n           0px\n           0px\n           0px\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td style=\"vertical-align:top\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word\"><tbody><tr><td style=\"padding:24px 0px 20px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px\"><tbody><tr><td style=\"width:100%\"><img src=\"images/cee2469f847556a707b454a847e0cdd0.jpg\" width=\"600\" height=\"419\" style=\"display:block;width:600px;height:auto;max-width:100%\"></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-347\" style=\"font-size:34.7px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 24px 30px;line-height:1.3;mso-line-height-alt:45.1px\">Your favorites are still waiting.<br></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-187\" style=\"font-size:18.7px;font-family:Tahoma, Geneva, sans-serif;text-align:center;padding:0px 24px 10px;line-height:1;mso-line-height-alt:18.7px\"><span style=\"white-space:pre-wrap\">Complete your order now and enjoy </span><span style=\"font-weight:700;text-decoration:underline;white-space:pre-wrap\">10% off</span><span style=\"white-space:pre-wrap\">!</span><br></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-187\" style=\"font-size:18.7px;font-family:Tahoma, Geneva, sans-serif;text-align:center;padding:0px 24px 8px;line-height:1;mso-line-height-alt:18.7px\"><span style=\"white-space:pre-wrap\">Use code </span><span style=\"font-weight:700;white-space:pre-wrap\">WELCOME10</span><span style=\"white-space:pre-wrap\"> upon checkout.</span><br></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-187\" style=\"font-size:18.7px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 24px 24px;line-height:1;mso-line-height-alt:18.7px\">Hurry, this offer expires soon.<br></td></tr><tr><td style=\"padding:0px 24px 38px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><!--[if mso]><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"241\" style=\"width:241px\"><tbody><tr><td><![endif]--><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:241px\"><tbody><tr><td style=\"width:100%\"><!--[if mso]><v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" href=\"https://homecartel.net\" style=\"height:54px;width:241px;v-text-anchor:middle;\" arcsize=\"0%\" fillcolor=\"#ff9900\"><v:stroke dashstyle=\"Solid\" weight=\"0px\" color=\"#ff9900\"/><w:anchorlock/><v:textbox inset=\"0px,0px,0px,0px\"><center dir=\"false\" style=\"color:#ffffff;font-family:sans-serif;font-size:22.9px;font-weight:700\">CHECK OUT NOW</center></v:textbox></v:roundrect><![endif]--><!--[if !mso]><!--><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"width:100%;max-width:100%;border-collapse:separate;border-spacing:0\"><tbody><tr><td bgcolor=\"#ff9900\" style=\"background-color:#ff9900;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:0px;border-right:0px solid transparent;border-top:0px solid transparent;mso-border-alt:none\"><a href=\"https://homecartel.net\" target=\"_blank\" rel=\"noopener\" ses:no-track=\"\" style=\"color:#ffffff;text-decoration:none;display:block;padding-top:16px;padding-bottom:16px;padding-left:8px;padding-right:8px;text-align:center;font-family:Tahoma, Geneva, sans-serif;font-size:22.9px;font-weight:700;letter-spacing:0em;line-height:22.9px;box-sizing:border-box;mso-line-height-rule:exactly\"><span style=\"word-break:break-word;line-height:22.9px;color:#ffffff;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#ffffff\">CHECK OUT NOW</span></a></td></tr></tbody></table><!--<![endif]--></td></tr></tbody></table><!--[if mso]></td></tr></tbody></table><![endif]--></td></tr></tbody></table></td></tr><tr><td style=\"padding:0px 24px 16px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:552px\"><tbody><tr><td height=\"1\" style=\"height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#0d161b\">&nbsp;</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-293\" style=\"font-size:29.3px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 24px 16px;line-height:1.4;mso-line-height-alt:41px\">In your cart:<br></td></tr><tr><td style=\"padding:0px 24px 16px\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"layout-0\" align=\"center\" style=\"display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto\"><tbody><tr><td style=\"text-align:center\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;max-width:552px;table-layout:fixed;margin:0 auto\"><tbody><tr><td width=\"33.33%\" style=\"width:33.33%;box-sizing:border-box;vertical-align:top;background-color:#0d161b\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed\"><tbody><tr><td style=\"padding:12px\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word\"><tbody><tr><td dir=\"ltr\" style=\"color:#ffffff;font-size:16px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;line-height:1.4;mso-line-height-alt:22.4px\">Item<br></td></tr></tbody></table></td></tr></tbody></table></td><td width=\"0\" style=\"width:0;box-sizing:border-box;font-size:0\">&nbsp;</td><td width=\"33.33%\" style=\"width:33.33%;box-sizing:border-box;vertical-align:top;background-color:#0d161b\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed\"><tbody><tr><td style=\"padding:12px\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word\"><tbody><tr><td dir=\"ltr\" style=\"color:#ffffff;font-size:16px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:right;line-height:1.4;mso-line-height-alt:22.4px\">Qty<br></td></tr></tbody></table></td></tr></tbody></table></td><td width=\"0\" style=\"width:0;box-sizing:border-box;font-size:0\">&nbsp;</td><td width=\"33.33%\" style=\"width:33.33%;box-sizing:border-box;vertical-align:top;background-color:#0d161b\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed\"><tbody><tr><td style=\"padding:12px\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word\"><tbody><tr><td dir=\"ltr\" style=\"color:#ffffff;font-size:16px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;line-height:1.4;mso-line-height-alt:22.4px\">Price<br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr>";
const rawMid = "<tr><td style=\"padding:0px 24px 16px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:552px\"><tbody><tr><td height=\"1\" style=\"height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#dddddd\">&nbsp;</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding:0px 24px 30px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><!--[if mso]><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"241\" style=\"width:241px\"><tbody><tr><td><![endif]--><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:241px\"><tbody><tr><td style=\"width:100%\"><!--[if mso]><v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" href=\"https://homecartel.net\" style=\"height:54px;width:241px;v-text-anchor:middle;\" arcsize=\"0%\" fillcolor=\"#ff9900\"><v:stroke dashstyle=\"Solid\" weight=\"0px\" color=\"#ff9900\"/><w:anchorlock/><v:textbox inset=\"0px,0px,0px,0px\"><center dir=\"false\" style=\"color:#ffffff;font-family:sans-serif;font-size:22.9px;font-weight:700\">CHECK OUT NOW</center></v:textbox></v:roundrect><![endif]--><!--[if !mso]><!--><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"width:100%;max-width:100%;border-collapse:separate;border-spacing:0\"><tbody><tr><td bgcolor=\"#ff9900\" style=\"background-color:#ff9900;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:0px;border-right:0px solid transparent;border-top:0px solid transparent;mso-border-alt:none\"><a href=\"https://homecartel.net\" target=\"_blank\" rel=\"noopener\" ses:no-track=\"\" style=\"color:#ffffff;text-decoration:none;display:block;padding-top:16px;padding-bottom:16px;padding-left:8px;padding-right:8px;text-align:center;font-family:Tahoma, Geneva, sans-serif;font-size:22.9px;font-weight:700;letter-spacing:0em;line-height:22.9px;box-sizing:border-box;mso-line-height-rule:exactly\"><span style=\"word-break:break-word;line-height:22.9px;color:#ffffff;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#ffffff\">CHECK OUT NOW</span></a></td></tr></tbody></table><!--<![endif]--></td></tr></tbody></table><!--[if mso]></td></tr></tbody></table><![endif]--></td></tr></tbody></table></td></tr><tr><td style=\"padding:0px 24px 30px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:552px\"><tbody><tr><td height=\"1\" style=\"height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#0d161b\">&nbsp;</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-240\" style=\"font-size:24px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 24px 16px;line-height:1;mso-line-height-alt:24px\">You may also like:<br></td></tr>";
const rawFooter = "<tr><td style=\"padding:0px 24px 16px\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"layout-4\" align=\"center\" style=\"display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto\"><tbody><tr><td style=\"text-align:center\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;max-width:552px;table-layout:fixed;margin:0 auto\"><tbody><tr><td width=\"100.00%\" style=\"width:100.00%;box-sizing:border-box;vertical-align:middle\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed\"><tbody><tr><td style=\"padding:18px\"><table align=\"center\" width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"color:#000;font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word\"><tbody><tr><td dir=\"ltr\" class=\"ers-fs-187\" style=\"font-size:18.7px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 0px 16px;line-height:1.4;mso-line-height-alt:26.2px\"><a href=\"https://homecartel.net/collections/all-lighting\" target=\"_blank\" rel=\"noopener nofollow\" ses:no-track=\"\" style=\"color:inherit;text-decoration:inherit\">Still deciding? Browse the full collection to find your fit.</a><br></td></tr><tr><td dir=\"ltr\" class=\"ers-fs-173\" style=\"font-size:17.3px;text-decoration:underline;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;line-height:1;mso-line-height-alt:17.3px\"><a href=\"https://homecartel.net\" target=\"_blank\" rel=\"noopener nofollow\" ses:no-track=\"\" style=\"color:inherit;text-decoration:inherit\">Got questions? Contact us.</a><br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding:0px 24px 16px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:552px\"><tbody><tr><td height=\"1\" style=\"height:1px;border-radius:999px;line-height:1px;mso-line-height-rule:exactly;font-size:0;background-color:#0d161b\">&nbsp;</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding:0px 24px 9px\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%\"><tbody><tr><td align=\"center\"><!--[if mso]><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"513\" style=\"width:513px\"><tbody><tr><td><![endif]--><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:513px\"><tbody><tr><td style=\"width:100%\"><img src=\"images/7b7eb5e0aff51ffa87b12afa34ffb1c2.png\" width=\"513\" height=\"35\" style=\"display:block;width:513px;height:auto;max-width:100%\"></td></tr></tbody></table><!--[if mso]></td></tr></tbody></table><![endif]--></td></tr></tbody></table></td></tr><tr><td dir=\"ltr\" style=\"color:#0d161b;font-size:13.3px;font-family:Tahoma, Geneva, sans-serif;text-align:center;padding:0px 24px 16px;line-height:22.4px;mso-line-height-alt:22.4px\"><span style=\"white-space:pre-wrap\">You received this email because you subscribed at </span><span style=\"font-weight:700;white-space:pre-wrap\"><a href=\"http://homecartel.net\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#0d161b;text-decoration:none\">homecartel.net</a>. </span><br></td></tr><tr><td dir=\"ltr\" style=\"font-size:13.3px;font-weight:700;font-family:Tahoma, Geneva, sans-serif;text-align:center;padding:0px 24px 16px;line-height:22.4px;mso-line-height-alt:22.4px\"><a href=\"{{ unsubscribe }}\" target=\"_blank\" rel=\"noopener nofollow\" style=\"color:inherit;text-decoration:inherit\"><span style=\"text-decoration:underline;white-space:pre-wrap\">Unsubscribe</span></a><span style=\"white-space:pre-wrap\"> | </span><a href=\"{{ view_in_browser }}\" target=\"_blank\" rel=\"noopener nofollow\" style=\"color:inherit;text-decoration:inherit\"><span style=\"text-decoration:underline;white-space:pre-wrap\">View in browser</span></a><br></td></tr><tr><td dir=\"ltr\" style=\"color:#0d161b;font-size:13.3px;font-family:Tahoma, Geneva, sans-serif;white-space:pre-wrap;text-align:center;padding:0px 24px 24px;line-height:22.4px;mso-line-height-alt:22.4px\">© 2026 Home Cartel ®. All rights reserved.<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td height=\"100%\" style=\"height:100%;font-size:0;line-height:0\" aria-hidden=\"true\">&nbsp;</td></tr></tbody></table><!--[if mso]></td>\n                </tr>\n              </tbody>\n            </table>\n          </center><![endif]--></td></tr></tbody></table></body></html>";

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
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\/+$/, '');
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
    .replace(/(src|href)=["']images\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/href="https:\/\/homecartel\.net"/g, 'href="' + escapeHtml(checkoutUrl) + '"');

  let mid = rawMid
    .replace(/(src|href)=["']images\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/href="https:\/\/homecartel\.net"/g, 'href="' + escapeHtml(checkoutUrl) + '"');

  let footer = rawFooter
    .replace(/(src|href)=["']images\/([^"']+)["']/g, (match, attr, filename) => {
      return attr + '="' + baseUrl + '/images/' + filename + '"';
    })
    .replace(/\{\{\s*unsubscribe\s*\}\}/g, escapeHtml(unsubscribeUrl))
    .replace(/\{\{\s*view_in_browser\s*\}\}/g, escapeHtml(viewInBrowserUrl));

  const fullHtml = header + cartItemsHtml + mid + recommendationsTableHtml + footer;

  const subject = customerName
    ? customerName + ', your favorites are still waiting | 10% off with code WELCOME10'
    : 'Your favorites are still waiting | Complete your order with 10% off';

  return {
    subject,
    html: fullHtml
  };
}
