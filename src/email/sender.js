/**
 * Creates an email delivery client.
 * Supports 'mock' for tests/development and 'resend' for production.
 *
 * @param {{ emailProvider?: string, resendApiKey?: string, fromEmail?: string }} config
 */
export function createEmailSender(config = {}) {
  const provider = config.emailProvider || 'mock';
  const from = config.fromEmail || 'HomeCartel <support@homecartel.net>';

  if (provider === 'resend') {
    if (!config.resendApiKey) {
      throw new Error('Missing RESEND_API_KEY for resend email provider');
    }

    return {
      async send({ to, subject, html, text = '' }) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from,
            to,
            subject,
            html,
            text
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Resend API send failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        return { messageId: data.id };
      }
    };
  }

  // Default Mock Provider
  const sentMessages = [];
  return {
    async send({ to, subject, html, text = '' }) {
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sentMessages.push({ to, subject, html, text, messageId, sentAt: new Date().toISOString() });
      return { messageId };
    },
    getSentMessages() {
      return sentMessages;
    },
    clear() {
      sentMessages.length = 0;
    }
  };
}
