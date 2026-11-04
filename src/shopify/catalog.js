const imageCache = new Map();

// Authentic HomeCartel lighting fixture CDN URLs
const KNOWN_LIGHTING_IMAGES = {
  aerik: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
  baron: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
  vanja: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
  default: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482'
};

/**
 * Resolves a high-resolution product image for a given cart line item
 * from HomeCartel's live Shopify catalog.
 *
 * @param {{ title?: string, name?: string, product_id?: string | number, image?: string, imageUrl?: string }} item
 * @returns {Promise<string>} Image URL
 */
export async function resolveShopifyProductImage(item = {}) {
  // If already has a valid non-placeholder image, return it
  if (item.imageUrl && !item.imageUrl.includes('04c8b285c02346c0b1b567007090fc7e') && !item.imageUrl.includes('chair')) {
    return item.imageUrl;
  }
  if (item.image && !item.image.includes('04c8b285c02346c0b1b567007090fc7e') && !item.image.includes('chair')) {
    return item.image;
  }

  const title = (item.title || item.name || '').trim();
  const productId = item.product_id ? String(item.product_id) : '';
  const cacheKey = productId ? `id:${productId}` : `title:${title.toLowerCase()}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const searchTerms = title.split('|')[0].trim().replace(/[^\w\s-]/gi, '');
    if (searchTerms) {
      const url = `https://homecartel.net/search/suggest.json?q=${encodeURIComponent(searchTerms)}&resources[type]=product`;
      const res = await fetch(url, { headers: { 'User-Agent': 'HomeCartel-Automations/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const products = data.resources?.results?.products || [];

        // 1. Try exact product_id match
        if (productId) {
          const match = products.find(p => String(p.id) === productId);
          if (match && (match.image || match.featured_image?.url)) {
            const foundImg = match.image || match.featured_image.url;
            imageCache.set(cacheKey, foundImg);
            return foundImg;
          }
        }

        // 2. Try first matching product
        if (products.length > 0) {
          const first = products[0];
          const foundImg = first.image || first.featured_image?.url;
          if (foundImg) {
            imageCache.set(cacheKey, foundImg);
            return foundImg;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[Shopify Catalog] Failed to resolve image for "${title}":`, err.message);
  }

  // Keyword-based fallback for known lighting collections
  const lowerTitle = title.toLowerCase();
  let fallback = KNOWN_LIGHTING_IMAGES.default;
  if (lowerTitle.includes('aerik')) {
    fallback = KNOWN_LIGHTING_IMAGES.aerik;
  } else if (lowerTitle.includes('baron')) {
    fallback = KNOWN_LIGHTING_IMAGES.baron;
  }

  imageCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Enriches a list of cart line items with real Shopify CDN image URLs.
 * @param {Array<object>} items
 * @returns {Promise<Array<object>>}
 */
export async function enrichCartItemsWithImages(items = []) {
  if (!Array.isArray(items) || items.length === 0) return items;

  return Promise.all(items.map(async (item) => {
    const imageUrl = await resolveShopifyProductImage(item);
    return {
      ...item,
      imageUrl,
      image: imageUrl
    };
  }));
}
