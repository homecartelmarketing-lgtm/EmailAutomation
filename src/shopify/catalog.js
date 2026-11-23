const imageCache = new Map();

// Authentic HomeCartel lighting fixture CDN URLs
const KNOWN_LIGHTING_IMAGES = {
  talisa: 'https://cdn.shopify.com/s/files/1/1870/0659/files/t2_b06b3de7-0e1d-42a9-98a9-3e015a618d6e.jpg?v=1685505425',
  kevin: 'https://cdn.shopify.com/s/files/1/1870/0659/files/Kevin-ModelPhoto-clean.jpg?v=1795013714',
  lorvanar: 'https://cdn.shopify.com/s/files/1/1870/0659/files/64fbd9107f02d0e14fe3ca29fd6a6e0bfaab8e81_img.jpg?v=1775610039',
  soeren: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebg_2b12c008-d634-40f8-84cd-5b8154745288.jpg?v=1615166204',
  darynthas: 'https://cdn.shopify.com/s/files/1/1870/0659/files/4019f2b8e0cd1e1fa4f912341c092de48f881ffc_img.jpg?v=1775585080',
  aerik: 'https://cdn.shopify.com/s/files/1/1870/0659/files/O1CN01qZZIHQ2CRlojwy1uX__1703828471.jpg?v=1713427031',
  baron: 'https://cdn.shopify.com/s/files/1/1870/0659/files/11b4c063a23ac9a60c13a91525eb68d2190d83ce_SquarePhoto12_aa07dc0c_c31d_44d4_ac9c_428e728fe327.jpg?v=1754977150',
  cerantia: 'https://cdn.shopify.com/s/files/1/1870/0659/files/562042_img.jpg?v=1792723459',
  havoris: 'https://cdn.shopify.com/s/files/1/1870/0659/files/89dc90bc3b4155b1d72a873374eecb147181c73c_imgi_66_il_fullxfull.6639179620_113w_d487fb4b-e04a-4c4b-922d-797be67c8883.jpg?v=1755670366',
  vanja: 'https://cdn.shopify.com/s/files/1/1870/0659/products/whitebackgroundceilingmounted.jpg?v=1612841482',
  default: 'https://cdn.shopify.com/s/files/1/1870/0659/files/Kevin-ModelPhoto-clean.jpg?v=1795013714'
};

function isPlaceholderOrGeneric(url = '') {
  if (!url) return true;
  const s = String(url).toLowerCase();
  return (
    s.includes('04c8b285c02346c0b1b567007090fc7e') ||
    s.includes('chair') ||
    s.includes('ccf0df87c4814653202adf4b19c60e5c') ||
    s.includes('b425fe1f3e9750056ea70120b8c40f97') ||
    s.includes('eea3c97993f62b4d9c5267094eca4cfd')
  );
}

/**
 * Resolves a high-resolution product image for a given cart line item
 * from HomeCartel's live Shopify catalog.
 *
 * @param {{ title?: string, name?: string, product_id?: string | number, image?: string, imageUrl?: string }} item
 * @returns {Promise<string>} Image URL
 */
export async function resolveShopifyProductImage(item = {}) {
  // If already has a valid non-placeholder image, return it
  if (item.imageUrl && !isPlaceholderOrGeneric(item.imageUrl)) {
    return item.imageUrl;
  }
  if (item.image && !isPlaceholderOrGeneric(item.image)) {
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

        // 2. Try product with matching keyword in title
        if (products.length > 0) {
          const searchLower = searchTerms.toLowerCase();
          const match = products.find(p => (p.title || '').toLowerCase().includes(searchLower)) || products[0];
          const foundImg = match.image || match.featured_image?.url;
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
  for (const [key, url] of Object.entries(KNOWN_LIGHTING_IMAGES)) {
    if (key !== 'default' && lowerTitle.includes(key)) {
      fallback = url;
      break;
    }
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
