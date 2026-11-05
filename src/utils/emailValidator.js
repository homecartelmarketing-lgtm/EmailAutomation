/**
 * Bot & Disposable / Temporary Email Filter
 * Protects HomeCartel from spam bot account creations, scrapers, and disposable inboxes.
 */

// Well-known disposable, temporary, and throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  // The specific domain from the Shopify bot event
  'mailkolnet.com',

  // Common disposable services
  'tempmail.com',
  'temp-mail.org',
  'tempmail.net',
  'temp-mail.io',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'mailinater.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.it',
  'dispostable.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'getairmail.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'dropmail.me',
  'fakeinbox.com',
  'emailondeck.com',
  'crazymailing.com',
  'inboxkitten.com',
  'minutemailbox.com',
  'burnermail.io',
  'nada.ltd',
  'getnada.com',
  'abcvg.com',
  'crazymail.com',
  'discard.email',
  'disposablemail.com',
  'fakeemail.net',
  'maildrop.cc',
  'mailcatch.com',
  'mytempemail.com',
  'trashmail.me',
  'trashmail.at',
  'trashmail.io',
  'temporarymail.com',
  'tempr.email',
  'tempinbox.com',
  'zippymail.info'
]);

// Keywords that indicate a temporary / throwaway domain pattern
const DISPOSABLE_DOMAIN_KEYWORDS = [
  'tempmail',
  'throwaway',
  'trashmail',
  'dispostable',
  'disposable',
  'fakeinbox',
  'burnermail',
  '10minute',
  'minutemail',
  'dropmail',
  'guerrilla',
  'mailkolnet'
];

// Known spam bot name patterns (such as rogue pharmacy / SEO spam networks)
const BOT_NAME_PATTERNS = [
  /^rxstore\d*/i,
  /^seo\s*boost/i,
  /^cialis/i,
  /^viagra/i,
  /^casino/i
];

/**
 * Checks whether an email domain is from a disposable/temporary email provider.
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return true;

  const domain = parts[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  // Check for keyword matches in domain (e.g. *.tempmail.xyz)
  for (const keyword of DISPOSABLE_DOMAIN_KEYWORDS) {
    if (domain.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an email or name matches known automated bot/scraper patterns.
 * @param {string} email
 * @param {string} [name='']
 * @returns {boolean}
 */
export function isBotPattern(email, name = '') {
  if (!email || typeof email !== 'string') return true;
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || '').trim();

  // Test name patterns
  if (cleanName) {
    for (const pattern of BOT_NAME_PATTERNS) {
      if (pattern.test(cleanName)) {
        return true;
      }
    }
  }

  // Check for email username matching bot patterns (e.g. rxstore38@...)
  const username = cleanEmail.split('@')[0] || '';
  for (const pattern of BOT_NAME_PATTERNS) {
    if (pattern.test(username)) {
      return true;
    }
  }

  return false;
}

/**
 * Master email validator for marketing automation.
 * @param {string} email
 * @param {string} [name='']
 * @returns {{ valid: boolean, reason?: string, isDisposable?: boolean, isBot?: boolean }}
 */
export function validateCustomerEmail(email, name = '') {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'empty_or_invalid_email' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic syntax check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { valid: false, reason: 'malformed_syntax' };
  }

  // Disposable check
  if (isDisposableEmail(cleanEmail)) {
    return {
      valid: false,
      reason: 'disposable_domain',
      isDisposable: true
    };
  }

  // Bot check
  if (isBotPattern(cleanEmail, name)) {
    return {
      valid: false,
      reason: 'bot_pattern_detected',
      isBot: true
    };
  }

  return { valid: true };
}
