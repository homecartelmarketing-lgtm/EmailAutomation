/**
 * Luxury Post-Purchase Review & Care Guide Template for HomeCartel
 * Features:
 * - Order follow-up & gratitude
 * - Lighting fixture installation & care tips (circuit breaker safety, 2700K warm white, microfiber cloth)
 * - Review & UGC photo submission CTA
 * - Responsive layout with mobile scaling
 * - Clean unified footer without physical address
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

export function renderPostPurchaseReviewTemplate(context = {}) {
  const baseUrl = (context.baseUrl || 'https://emailautomation-production-d651.up.railway.app').replace(/\/+$/, '');
  const unsubscribeUrl = context.unsubscribeUrl || '#';
  const viewInBrowserUrl = context.viewInBrowserUrl || 'https://homecartel.net';
  const customerName = context.customerName && context.customerName !== 'there' ? context.customerName.trim() : '';
  const orderNumber = context.orderNumber ? String(context.orderNumber).replace(/^#/, '') : '';
  const reviewUrl = context.reviewUrl || 'https://homecartel.net';

  const subject = customerName
    ? `How is your new lighting, ${customerName}? | HomeCartel`
    : 'How is your new lighting? | HomeCartel';

  const greeting = customerName
    ? `Thank you for choosing HomeCartel, ${escapeHtml(customerName)}.`
    : 'Thank you for choosing HomeCartel.';

  const orderLine = orderNumber
    ? `We hope your recent order #${escapeHtml(orderNumber)} arrived safely and has found its perfect place in your home.`
    : 'We hope your recent lighting pieces arrived safely and have found their perfect place in your home.';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f1f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; }
    table { border-collapse: separate; mso-table-lspace: 0; mso-table-rspace: 0; }
    p, span, h1, h2, h3 { margin: 0; padding: 0; }
    @media (max-width: 599px) { .ecw { width: 100% !important; min-width: 0 !important; } }
  </style>
</head>
<body style="width: 100%; -webkit-text-size-adjust: 100%; background-color: #f0f1f5; margin: 0; padding: 0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table align="center" width="600" border="0" cellpadding="0" cellspacing="0" class="ecw" style="max-width: 600px; background-color: #ffffff; width: 600px; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #0d161b; padding: 32px 24px;">
              <a href="https://homecartel.net" target="_blank" style="text-decoration: none;">
                <img src="${baseUrl}/images/3ef43aae1391d3855242f78c9975c8b9.png" width="220" alt="HomeCartel" style="display: block; width: 220px; height: auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Hero Image -->
          <tr>
            <td align="center">
              <img src="${baseUrl}/images/5fde53c52841ffe349002090665198c3.jpg" width="600" alt="HomeCartel Lighting" style="display: block; width: 100%; max-width: 600px; height: auto;" />
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <h1 style="font-size: 26px; line-height: 1.3; font-weight: 700; color: #0d161b; margin-bottom: 16px; font-family: Verdana, Geneva, sans-serif;">
                ${greeting}
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
                ${orderLine}
              </p>

              <!-- Care & Installation Guide Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #ff9900; border-radius: 4px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0d161b; margin-bottom: 12px; font-family: Verdana, Geneva, sans-serif;">
                      ✨ Lighting Care & Installation Notes:
                    </h3>
                    <p style="font-size: 13.5px; line-height: 1.6; color: #4a5568; margin-bottom: 8px;">
                      • <strong>Safety First:</strong> Always switch off the circuit breaker before mounting or adjusting your fixtures.
                    </p>
                    <p style="font-size: 13.5px; line-height: 1.6; color: #4a5568; margin-bottom: 8px;">
                      • <strong>Ideal Ambiance:</strong> We recommend 2700K or 3000K warm white LED bulbs for optimal warmth and luxury glow.
                    </p>
                    <p style="font-size: 13.5px; line-height: 1.6; color: #4a5568;">
                      • <strong>Finish Maintenance:</strong> Gently wipe brass, crystal, and matte finishes with a clean, dry microfiber cloth. Avoid abrasive detergents.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Review Call to Action -->
              <div style="text-align: center; padding: 12px 0 20px;">
                <p style="font-size: 15px; font-weight: 600; color: #0d161b; margin-bottom: 16px;">
                  Would you share a photo of your new lighting in your space?
                </p>
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td bgcolor="#ff9900" style="background-color: #ff9900; border-radius: 26px;">
                      <a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 36px; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.02em;">
                        Leave a Review & Share Your Space
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size: 12px; color: #718096; margin-top: 14px;">
                  Tag <strong>@homecartel</strong> on Instagram to be featured on our official showcase.
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #e2e8f0; width: 100%;"></div>
            </td>
          </tr>

          <!-- Consistent Compliant Footer (NO PHYSICAL ADDRESS) -->
          <tr>
            <td style="padding: 24px 32px 32px; text-align: center;">
              <p style="font-size: 13px; color: #0d161b; line-height: 1.6; margin-bottom: 8px; font-family: Verdana, Geneva, sans-serif;">
                You received this email from your activity on <a href="https://homecartel.net" target="_blank" rel="noopener noreferrer" style="color: #0d161b; font-weight: 700; text-decoration: none;">homecartel.net</a>.
              </p>
              <p style="font-size: 13px; font-weight: 700; line-height: 1.6; margin-bottom: 12px; font-family: Verdana, Geneva, sans-serif;">
                <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" rel="noopener nofollow" style="color: #4a5568; text-decoration: underline;">Unsubscribe</a>
                <span style="color: #cbd5e0; margin: 0 8px;">|</span>
                <a href="${escapeHtml(viewInBrowserUrl)}" target="_blank" rel="noopener nofollow" style="color: #4a5568; text-decoration: underline;">View in browser</a>
              </p>
              <p style="font-size: 12.5px; color: #718096; line-height: 1.6; font-family: Verdana, Geneva, sans-serif;">
                © 2026 Home Cartel ®. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
