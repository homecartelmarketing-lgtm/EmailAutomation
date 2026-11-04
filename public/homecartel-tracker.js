/**
 * HomeCartel Storefront Real-Time Behavioral Tracker
 * Embed in Shopify theme.liquid before </head>
 *
 * Capabilities:
 * - Anonymous visitor persistence (cookie + localStorage)
 * - Page Access (date, time, path, title, product details)
 * - Item Clicks (product titles, prices, URLs)
 * - Page Leaves (duration in seconds, max scroll depth %)
 * - Cart Actions & Token Synchronization
 * - Automatic Email Capture & Anonymous-to-Customer Identity Stitching
 */
(function() {
  'use strict';

  const COOKIE_NAME = 'hc_vid';
  const STORAGE_KEY = 'homecartel_vid';
  const API_ENDPOINT = window.HOMECARTEL_API_URL || '';
  const pageStartTime = Date.now();
  let maxScrollPercent = 0;
  let pageLeaveFired = false;

  // --- 1. Persistent Anonymous Visitor ID Management ---
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
    let vid = null;
    try {
      vid = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (!vid) {
      vid = getCookie(COOKIE_NAME);
    }

    if (!vid) {
      const rand = Math.random().toString(36).substring(2, 10);
      const time = Date.now().toString(36);
      vid = `anon_hc_${rand}_${time}`;
    }

    try {
      localStorage.setItem(STORAGE_KEY, vid);
    } catch (e) {}
    setCookie(COOKIE_NAME, vid);
    return vid;
  }

  const visitorId = getOrCreateVisitorId();

  // --- 2. Dispatch Helpers ---
  function sendPayload(endpoint, payload) {
    const fullUrl = `${API_ENDPOINT}${endpoint}`;
    const bodyStr = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      if (navigator.sendBeacon(fullUrl, blob)) {
        return;
      }
    }

    try {
      fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  }

  // Global Tracking Function
  window.homeCartelTrack = function(eventType, properties = {}) {
    properties.timestamp = new Date().toISOString();
    properties.local_time = new Date().toLocaleString();
    sendPayload('/api/track/event', { visitorId, eventType, properties });
  };

  // Global Identity Resolution Function
  window.homeCartelIdentify = function(email, name = '') {
    if (!email || typeof email !== 'string') return;
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return;

    try {
      localStorage.setItem('homecartel_email', cleanEmail);
    } catch (e) {}

    sendPayload('/api/track/identify', {
      visitorId,
      email: cleanEmail,
      name,
      timestamp: new Date().toISOString()
    });
  };

  window.homeCartelGetVisitorId = function() {
    return visitorId;
  };

  // --- 3. Page Access / View Tracking ---
  function trackPageAccess() {
    const now = new Date();
    const pathname = window.location.pathname;

    let pageType = 'other';
    if (pathname === '/' || pathname === '') pageType = 'home';
    else if (pathname.includes('/collections/')) pageType = 'collection';
    else if (pathname.includes('/products/')) pageType = 'product';
    else if (pathname.includes('/cart')) pageType = 'cart';
    else if (pathname.includes('/checkouts') || pathname.includes('/checkout')) pageType = 'checkout';

    const properties = {
      url: window.location.href,
      path: pathname,
      title: document.title,
      referrer: document.referrer || null,
      page_type: pageType,
      screen_width: window.innerWidth,
      timestamp: now.toISOString(),
      local_time: now.toLocaleString()
    };

    // If on a Shopify Product Page, capture rich item attributes
    if (pageType === 'product') {
      try {
        if (window.meta && window.meta.product) {
          properties.productId = window.meta.product.id;
          properties.productTitle = window.meta.product.name || window.meta.product.title;
          properties.productPrice = window.meta.product.price ? `₱${(window.meta.product.price / 100).toFixed(2)}` : null;
        } else {
          const h1 = document.querySelector('h1');
          if (h1) properties.productTitle = h1.innerText.trim();
        }
      } catch (e) {}
    }

    window.homeCartelTrack('page_view', properties);
  }

  // --- 4. Page Leave Tracking (Duration & Max Scroll Depth) ---
  function trackPageLeave() {
    if (pageLeaveFired) return;
    pageLeaveFired = true;

    const durationSeconds = Math.max(1, Math.round((Date.now() - pageStartTime) / 1000));
    window.homeCartelTrack('page_leave', {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      duration_seconds: durationSeconds,
      max_scroll_percent: maxScrollPercent,
      timestamp: new Date().toISOString(),
      local_time: new Date().toLocaleString()
    });
  }

  // Monitor scroll depth
  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const currentPercent = Math.min(100, Math.round((window.scrollY / docHeight) * 100));
      if (currentPercent > maxScrollPercent) {
        maxScrollPercent = currentPercent;
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Listen for page exit / navigation events
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      trackPageLeave();
    }
  });
  window.addEventListener('pagehide', trackPageLeave);
  window.addEventListener('beforeunload', trackPageLeave);

  // --- 5. Item / Product Click Detection ---
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;

    // Detect link to a product
    const link = target.closest('a[href*="/products/"]');
    const productCard = target.closest('.product-card, .grid-product, [data-product-id], product-item, .card--product');

    if (link || productCard) {
      let productTitle = '';
      let productUrl = link ? link.href : window.location.href;
      let productPrice = '';
      let productImage = '';

      if (link) {
        productTitle = link.innerText.trim() || link.getAttribute('title') || '';
      }

      if (!productTitle && productCard) {
        const titleEl = productCard.querySelector('.product-card__title, .card__heading, h2, h3, a');
        if (titleEl) productTitle = titleEl.innerText.trim();
      }

      const priceEl = (productCard || document).querySelector('.price, [data-price], .price-item');
      if (priceEl) productPrice = priceEl.innerText.trim();

      const imgEl = (productCard || document).querySelector('img');
      if (imgEl && imgEl.src) productImage = imgEl.src;

      window.homeCartelTrack('item_click', {
        title: productTitle || document.title,
        url: productUrl,
        price: productPrice || null,
        image: productImage || null,
        element: target.tagName,
        timestamp: new Date().toISOString(),
        local_time: new Date().toLocaleString()
      });
    }

    // Detect Add to Cart Clicks
    const isAddToCart = target.closest('form[action*="/cart/add"], button[name="add"], .add-to-cart, [data-add-to-cart]');
    if (isAddToCart) {
      window.homeCartelTrack('add_to_cart_click', {
        url: window.location.href,
        buttonText: target.innerText ? target.innerText.trim() : 'Add to cart',
        timestamp: new Date().toISOString(),
        local_time: new Date().toLocaleString()
      });
      syncShopifyCart();
    }
  }, true);

  // --- 6. Shopify Cart Token & Attribute Synchronization ---
  function syncShopifyCart() {
    try {
      fetch('/cart.js')
        .then(r => r.json())
        .then(cart => {
          if (cart && cart.token) {
            sendPayload('/api/track/cart-sync', { visitorId, cartToken: cart.token });
          }
        })
        .catch(() => {});

      // Attach anonymous visitor ID to Shopify cart attributes so webhooks carry it!
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { '_hc_vid': visitorId } })
      }).catch(() => {});
    } catch (e) {}
  }

  // --- 7. Automatic Email Detection & Identity Stitching ---
  function observeEmailInputs() {
    document.addEventListener('change', function(e) {
      const el = e.target;
      if (!el) return;
      const type = el.getAttribute('type') || '';
      const name = el.getAttribute('name') || '';
      const id = el.getAttribute('id') || '';

      if (type === 'email' || name.toLowerCase().includes('email') || id.toLowerCase().includes('email')) {
        const val = (el.value || '').trim();
        if (/^\S+@\S+\.\S+$/.test(val)) {
          window.homeCartelIdentify(val);
        }
      }
    }, true);
  }

  // Initialize tracking once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      trackPageAccess();
      observeEmailInputs();
      syncShopifyCart();
    });
  } else {
    trackPageAccess();
    observeEmailInputs();
    syncShopifyCart();
  }

})();
