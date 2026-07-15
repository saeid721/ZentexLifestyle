// src/utils/productPrefetchCache.js
// ─── Module-level shared prefetch cache ──────────────────────────────────────
// Stores: slug → { data: <parsed API body>, promise, ts }
// "data" here is the RAW API response body (what apiClient returns after interceptor strips .data)

const prefetchCache = new Map();
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

/**
 * Kick off a background prefetch for a product slug.
 * Safe to call multiple times — deduplicates in-flight requests and respects TTL.
 *
 * @param {string} slug
 * @param {Function} fetcher  — () => Promise<apiBody>
 *                              Pass productService.getProductBySlug(slug) wrapped in a thunk.
 */
export const prefetchProduct = (slug, fetcher) => {
  if (!slug || typeof fetcher !== 'function') return Promise.resolve(null);

  const cached = prefetchCache.get(slug);
  const now = Date.now();

  if (cached?.data && now - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve(cached.data);
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = fetcher()
    .then((body) => {
      // body is already the unwrapped API payload (apiClient interceptor strips axios wrapper)
      prefetchCache.set(slug, { data: body, promise: null, ts: Date.now() });
      return body;
    })
    .catch(() => {
      prefetchCache.delete(slug); // allow retry on next hover
      return null;
    });

  prefetchCache.set(slug, { data: null, promise, ts: now });
  return promise;
};

/**
 * Synchronously read a cached product body.
 * Returns the raw API body, or null if not cached / stale.
 *
 * @param {string} slug
 * @returns {object|null}
 */
export const getPrefetchedProduct = (slug) => {
  const cached = prefetchCache.get(slug);
  if (!cached?.data) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    prefetchCache.delete(slug);
    return null;
  }
  return cached.data;
};