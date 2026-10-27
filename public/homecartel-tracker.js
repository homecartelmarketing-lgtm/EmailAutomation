/**
 * HomeCartel Storefront Behavioral Tracker
 * Embed in Shopify theme.liquid before </head>
 */
(function() {
  const COOKIE_NAME = 'hc_vid';
  const API_ENDPOINT = window.HOMECARTEL_API_URL || '/api/track';

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, val, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  function getOrCreateVisitorId() {
    let vid = getCookie(COOKIE_NAME);
    if (!vid) {
      vid = 'hc_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      setCookie(COOKIE_NAME, vid);
    }
    return vid;
  }

  const visitorId = getOrCreateVisitorId();

  window.homeCartelTrack = function(eventType, properties) {
    try {
      fetch(`${API_ENDPOINT}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, eventType, properties }),
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  };

  window.homeCartelIdentify = function(email, name) {
    try {
      fetch(`${API_ENDPOINT}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, email, name })
      }).catch(() => {});
    } catch (e) {}
  };

  // Auto-track page view
  document.addEventListener('DOMContentLoaded', function() {
    window.homeCartelTrack('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title
    });

    // Detect Shopify product page
    if (window.meta && window.meta.product) {
      window.homeCartelTrack('product_view', {
        productId: window.meta.product.id,
        title: window.meta.product.name,
        price: window.meta.product.price
      });
    }
  });
})();
