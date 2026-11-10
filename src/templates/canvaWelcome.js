/**
 * Canva-designed Luxury Welcome Series (3-Message Drip) for HomeCartel
 * - Email 1 (welcome / welcome_1): Welcome Promise & 10% Voucher (immediate on signup)
 * - Email 2 (welcome_2): Social Proof & Influencer Spaces (2 days after Email 1)
 * - Email 3 (welcome_3): Best Sellers & Voucher Urgency (3 days after Email 2)
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const rawWelcome1 = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preload" as="image" href="images/3ef43aae1391d3855242f78c9975c8b9.png">
  <link rel="preload" as="image" href="images/5fde53c52841ffe349002090665198c3.jpg">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <style>body{margin:0;padding:0}table{border-collapse:collapse}p,span,h1,h2,h3{margin:0;padding:0}@media (max-width:599px){.ecw{width:100%!important;min-width:0!important}}</style>
</head>
<body style="width:100%;background-color:#f0f1f5;margin:0;padding:0">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tr><td>
      <table align="center" width="600" border="0" cellpadding="0" cellspacing="0" class="ecw" style="max-width:600px;margin:0 auto;background-color:#ffffff;width:600px">
        <tr><td align="center"><img src="images/3ef43aae1391d3855242f78c9975c8b9.png" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
        <tr><td style="padding:24px 0 16px"><img src="images/5fde53c52841ffe349002090665198c3.jpg" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
        <tr><td style="font-size:30px;font-weight:700;font-family:Verdana,sans-serif;text-align:center;padding:12px 24px 16px;color:#0d161b">Here’s our promise.</td></tr>
        <tr><td style="font-size:16px;font-family:Verdana,sans-serif;text-align:center;padding:0 28px 20px;line-height:1.5;color:#272e1c">Thank you for signing up! Enjoy <span style="font-weight:700;text-decoration:underline">10% off</span> your next purchase, our way of saying welcome. Use voucher code <strong style="color:#ff9900;letter-spacing:1px">WELCOME10</strong> on the lighting that makes your home feel like yours.</td></tr>
        <tr><td align="center" style="padding:0 24px 24px">
          <table border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ff9900" style="background-color:#ff9900;border-radius:26px">
            <a href="https://homecartel.net?discount=WELCOME10" target="_blank" style="color:#000000;text-decoration:none;display:block;padding:12px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:700">Shop now</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:16px 24px">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" valign="top">
                <a href="https://homecartel.net/collections/chandelier-1" target="_blank" style="text-decoration:none;color:inherit">
                  <img src="images/a89ad58ed97e6b7b206f01871a6f4e7c.jpg" width="268" style="display:block;width:100%;height:auto;border-radius:4px" />
                  <div style="font-weight:700;font-size:16px;margin-top:8px;font-family:Verdana,sans-serif;text-decoration:underline">Chandeliers</div>
                  <div style="font-size:13px;color:#555;margin-top:4px;font-family:Verdana,sans-serif">Crystal, alabaster, and cluster designs that anchor a room.</div>
                </a>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top">
                <a href="https://homecartel.net/collections/pendant-lights" target="_blank" style="text-decoration:none;color:inherit">
                  <img src="images/fbabf6ac28afc37202c02e74f0d21b81.jpg" width="268" style="display:block;width:100%;height:auto;border-radius:4px" />
                  <div style="font-weight:700;font-size:16px;margin-top:8px;font-family:Verdana,sans-serif;text-decoration:underline">Pendant Lights</div>
                  <div style="font-size:13px;color:#555;margin-top:4px;font-family:Verdana,sans-serif">Statement lighting for dining tables, kitchen islands and bedrooms.</div>
                </a>
              </td>
            </tr>
            <tr><td colspan="3" height="20"></td></tr>
            <tr>
              <td width="48%" valign="top">
                <a href="https://homecartel.net/collections/table-lamps" target="_blank" style="text-decoration:none;color:inherit">
                  <img src="images/0c1e4739a88dabe014008f6e9f3ce186.jpg" width="268" style="display:block;width:100%;height:auto;border-radius:4px" />
                  <div style="font-weight:700;font-size:16px;margin-top:8px;font-family:Verdana,sans-serif;text-decoration:underline">Table Lamps</div>
                  <div style="font-size:13px;color:#555;margin-top:4px;font-family:Verdana,sans-serif">Soft, sculptural light for bedsides, consoles and work desks.</div>
                </a>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top">
                <a href="https://homecartel.net/collections/all-lighting" target="_blank" style="text-decoration:none;color:inherit">
                  <img src="images/763f33ee9394810652d07ec15d4354e3.jpg" width="268" style="display:block;width:100%;height:auto;border-radius:4px" />
                  <div style="font-weight:700;font-size:16px;margin-top:8px;font-family:Verdana,sans-serif;text-decoration:underline">... and more!</div>
                  <div style="font-size:13px;color:#555;margin-top:4px;font-family:Verdana,sans-serif">Browse our full range of fixtures to find the perfect match.</div>
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 0 16px"><img src="images/db14bb4f8487787d5f106be9f940c58f.jpg" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
        <tr><td style="padding:24px;text-align:center">
          <div style="color:#0d161b;font-size:13px;font-family:Verdana,sans-serif">You received this email from your activity on <a href="https://homecartel.net" target="_blank" rel="noopener noreferrer" style="color:#0d161b;font-weight:700;text-decoration:none">homecartel.net</a>.</div>
          <div style="font-size:13px;font-weight:700;font-family:Verdana,sans-serif;margin:8px 0"><a href="{{ unsubscribe }}" style="color:inherit;text-decoration:underline">Unsubscribe</a> | <a href="{{ view_in_browser }}" style="color:inherit;text-decoration:underline">View in browser</a></div>
          <div style="color:#0d161b;font-size:13px;font-family:Verdana,sans-serif">© 2026 Home Cartel ®. All rights reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export function renderCanvaWelcomeTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName.trim() : '';

  let html = rawWelcome1;
  html = html.replace(/(src|href)=["']images\/([^"']+)["']/g, (match, attr, filename) => {
    return attr + '="' + baseUrl + '/images/' + filename + '"';
  });

  if (customerName) {
    html = html.replace('Thank you for signing up! Enjoy', 'Thank you for signing up, ' + escapeHtml(customerName) + '! Enjoy');
  }

  html = html.replace(/\{\{\s*unsubscribe\s*\}\}/g, unsubscribeUrl);
  html = html.replace(/\{\{\s*view_in_browser\s*\}\}/g, viewInBrowserUrl);

  const discount = context.discount || '10%';
  const subject = customerName 
    ? `Welcome to HomeCartel, ${customerName} | ${discount} off your first order`
    : `Welcome to HomeCartel | ${discount} off your first order`;

  return { subject, html };
}

/**
 * Welcome Drip Email 2 (Social Proof & Influencer Showcase)
 * Sent 2 days after Email 1
 */
export function renderWelcomeSocialProofTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName.trim() : '';

  const subject = customerName
    ? `Seen in beautiful spaces: Inside real homes with HomeCartel, ${customerName}`
    : 'Seen in beautiful spaces: Inside real homes with HomeCartel';

  const introText = customerName
    ? `Hi ${escapeHtml(customerName)}, discover how top interior designers, architects, and over 10,000+ homeowners use HomeCartel fixtures to turn dining rooms, kitchens, and living spaces into architectural statements.`
    : 'Discover how top interior designers, architects, and over 10,000+ homeowners use HomeCartel fixtures to turn dining rooms, kitchens, and living spaces into architectural statements.';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{margin:0;padding:0}table{border-collapse:collapse}p,h1,h2,h3{margin:0;padding:0}@media(max-width:599px){.ecw{width:100%!important}}</style>
</head>
<body style="background-color:#f0f1f5;margin:0;padding:0;font-family:Verdana,sans-serif">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tr><td align="center" style="padding:20px 10px">
      <table width="600" class="ecw" style="max-width:600px;background:#ffffff;border-radius:4px;overflow:hidden">
        <tr><td align="center" style="background:#0d161b;padding:28px"><img src="${baseUrl}/images/3ef43aae1391d3855242f78c9975c8b9.png" width="220" style="display:block"></td></tr>
        <tr><td style="padding:32px 28px 16px;text-align:center">
          <h2 style="font-size:24px;font-weight:700;color:#0d161b;margin-bottom:12px">Styled by Leading Designers & Creators</h2>
          <p style="font-size:14.5px;color:#4a5568;line-height:1.6">${introText}</p>
        </td></tr>
        
        <!-- Social Proof Feature 1 -->
        <tr><td style="padding:16px 28px">
          <img src="${baseUrl}/images/5fde53c52841ffe349002090665198c3.jpg" width="544" style="display:block;width:100%;border-radius:6px;margin-bottom:12px">
          <div style="background:#f8f9fa;padding:16px 20px;border-left:4px solid #ff9900;border-radius:4px">
            <p style="font-style:italic;font-size:14px;color:#2d3748;line-height:1.6">"HomeCartel's statement chandelier was the single piece that pulled our entire open living concept together. The warm brass finish is timeless."</p>
            <p style="font-size:12px;font-weight:700;color:#0d161b;margin-top:8px">— Featured Residence in Makati • Styled by Studio Interior</p>
          </div>
        </td></tr>

        <!-- Social Proof Feature 2 -->
        <tr><td style="padding:16px 28px">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" valign="top">
                <img src="${baseUrl}/images/a89ad58ed97e6b7b206f01871a6f4e7c.jpg" width="260" style="display:block;width:100%;border-radius:4px">
                <p style="font-size:13px;font-weight:700;color:#0d161b;margin-top:8px">Talisa Modern Chandelier</p>
                <p style="font-size:12px;color:#718096">⭐⭐⭐⭐⭐ 4.9/5 from 80+ Homeowners</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top">
                <img src="${baseUrl}/images/fbabf6ac28afc37202c02e74f0d21b81.jpg" width="260" style="display:block;width:100%;border-radius:4px">
                <p style="font-size:13px;font-weight:700;color:#0d161b;margin-top:8px">Kevin Pendant Light</p>
                <p style="font-size:12px;color:#718096">⭐⭐⭐⭐⭐ Featured in BGC Penthouses</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA & Discount Reminder -->
        <tr><td style="padding:24px 28px;text-align:center;background:#fff8ee">
          <p style="font-size:15px;font-weight:700;color:#0d161b;margin-bottom:6px">Your 10% Welcome Voucher is Active</p>
          <p style="font-size:13px;color:#744210;margin-bottom:16px">Use code <strong style="letter-spacing:1px">WELCOME10</strong> at checkout</p>
          <table align="center" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ff9900" style="border-radius:24px"><a href="https://homecartel.net?discount=WELCOME10" target="_blank" style="display:block;padding:12px 32px;color:#000;font-size:13px;font-weight:700;text-decoration:none">Explore Designer Favorites</a></td></tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px;text-align:center">
          <div style="color:#0d161b;font-size:13px">You received this email from your activity on <a href="https://homecartel.net" target="_blank" rel="noopener noreferrer" style="color:#0d161b;font-weight:700;text-decoration:none">homecartel.net</a>.</div>
          <div style="font-size:13px;font-weight:700;margin:8px 0"><a href="${escapeHtml(unsubscribeUrl)}" style="color:inherit;text-decoration:underline">Unsubscribe</a> | <a href="${escapeHtml(viewInBrowserUrl)}" style="color:inherit;text-decoration:underline">View in browser</a></div>
          <div style="color:#0d161b;font-size:13px">© 2026 Home Cartel ®. All rights reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * Welcome Drip Email 3 (Best Sellers & Voucher Urgency)
 * Sent 3 days after Email 2
 */
export function renderWelcomeBestSellersTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName.trim() : '';

  const subject = customerName
    ? `Your 10% welcome voucher is waiting, ${customerName} | HomeCartel Best Sellers`
    : 'Your 10% welcome voucher is waiting | HomeCartel Best Sellers';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{margin:0;padding:0}table{border-collapse:collapse}p,h1,h2,h3{margin:0;padding:0}@media(max-width:599px){.ecw{width:100%!important}}</style>
</head>
<body style="background-color:#f0f1f5;margin:0;padding:0;font-family:Verdana,sans-serif">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tr><td align="center" style="padding:20px 10px">
      <table width="600" class="ecw" style="max-width:600px;background:#ffffff;border-radius:4px;overflow:hidden">
        <tr><td align="center" style="background:#0d161b;padding:28px"><img src="${baseUrl}/images/3ef43aae1391d3855242f78c9975c8b9.png" width="220" style="display:block"></td></tr>
        <tr><td style="padding:32px 28px 16px;text-align:center">
          <h2 style="font-size:24px;font-weight:700;color:#0d161b;margin-bottom:12px">Our Most-Loved Lighting Fixtures</h2>
          <p style="font-size:14.5px;color:#4a5568;line-height:1.6">Still considering the right fixture for your space? Here are the pieces our clients and interior designers come back to time and again.</p>
        </td></tr>

        <!-- Showcase Image -->
        <tr><td style="padding:0 28px 20px">
          <img src="${baseUrl}/images/db14bb4f8487787d5f106be9f940c58f.jpg" width="544" style="display:block;width:100%;border-radius:6px">
        </td></tr>

        <!-- Featured Products -->
        <tr><td style="padding:0 28px 24px">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="padding:14px;background:#f8f9fa;border-radius:6px">
                <p style="font-size:14px;font-weight:700;color:#0d161b">Talisa | Modern Chandelier</p>
                <p style="font-size:13px;color:#c59b27;font-weight:700;margin:6px 0">₱27,920.00</p>
                <p style="font-size:12px;color:#718096">Statement centerpiece for double-height ceilings and dining areas.</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" style="padding:14px;background:#f8f9fa;border-radius:6px">
                <p style="font-size:14px;font-weight:700;color:#0d161b">Kevin | Pendant Light</p>
                <p style="font-size:13px;color:#c59b27;font-weight:700;margin:6px 0">₱3,970.00</p>
                <p style="font-size:12px;color:#718096">Sculptural minimalism for kitchen islands and bedside accents.</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Voucher Urgency Box -->
        <tr><td style="padding:24px 28px;text-align:center;background:#fff8ee;border-top:1px solid #fed7aa;border-bottom:1px solid #fed7aa">
          <p style="font-size:16px;font-weight:700;color:#9a3412;margin-bottom:6px">Don’t forget your 10% welcome discount</p>
          <p style="font-size:13px;color:#7c2d12;margin-bottom:16px">Enter voucher code <strong style="letter-spacing:1px;background:#ffedd5;padding:2px 8px;border-radius:4px">WELCOME10</strong> before it expires.</p>
          <table align="center" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ff9900" style="border-radius:24px"><a href="https://homecartel.net/collections/all?discount=WELCOME10" target="_blank" style="display:block;padding:12px 36px;color:#000;font-size:14px;font-weight:700;text-decoration:none">Claim 10% Off Now</a></td></tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px;text-align:center">
          <div style="color:#0d161b;font-size:13px">You received this email from your activity on <a href="https://homecartel.net" target="_blank" rel="noopener noreferrer" style="color:#0d161b;font-weight:700;text-decoration:none">homecartel.net</a>.</div>
          <div style="font-size:13px;font-weight:700;margin:8px 0"><a href="${escapeHtml(unsubscribeUrl)}" style="color:inherit;text-decoration:underline">Unsubscribe</a> | <a href="${escapeHtml(viewInBrowserUrl)}" style="color:inherit;text-decoration:underline">View in browser</a></div>
          <div style="color:#0d161b;font-size:13px">© 2026 Home Cartel ®. All rights reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
