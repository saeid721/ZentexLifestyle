// src/features/products/hooks/useProductDetail.js
import { useState, useEffect } from 'react';
import { productService } from '../features/products/services/productService';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../utils';

const buildImageUrl = (path) =>
  path ? `${BASE_IMAGE_URL}${path}` : PLACEHOLDER_IMG;

const normaliseProduct = (raw) => {
  if (!raw) return null;

  // image field can be a string OR { image: string } object
  const primaryImagePath =
    typeof raw.image === 'string' ? raw.image : raw.image?.image || '';

  // gallery: images[] array, each item has .image string
  const gallery = Array.isArray(raw.images)
    ? raw.images.map((img) => buildImageUrl(img.image))
    : [buildImageUrl(primaryImagePath)];

  return {
    id:            raw.id,
    name:          raw.name,
    slug:          raw.slug,
    price:         raw.new_price,
    originalPrice: raw.old_price,
    discount:      raw.discount || 0,
    image:         buildImageUrl(primaryImagePath),
    images:        gallery,
    description:   raw.description || '',
    category:      raw.category   || null,
    subcategory:   raw.subcategory || null,
    inStock:       true,
  };
};

const normaliseRelated = (arr = []) =>
  arr.map((raw) => {
    // related_products use nested image object: { id, image, product_id }
    const imgPath =
      typeof raw.image === 'string' ? raw.image : raw.image?.image || '';
    return {
      id:            raw.id,
      name:          raw.name,
      slug:          raw.slug,
      new_price:     raw.new_price,
      old_price:     raw.old_price,
      discount:      raw.discount || 0,
      image:         imgPath,  // keep raw path — ProductCard prepends BASE_IMAGE_URL
    };
  });

/**
 * useProductDetail(slug)
 *
 * slug — the full slug-id string from the URL, e.g. "mans-panjabi-48"
 *
 * Returns: { product, relatedProducts, variants, shippingCharges, loading, error }
 */
const useProductDetail = (slug) => {
  const [product,         setProduct]         = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variants,        setVariants]        = useState([]);
  const [shippingCharges, setShippingCharges] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    productService
      .getProductBySlug(slug)         // GET /api/product/{slug}
      .then((res) => {
        if (cancelled) return;

        // apiClient interceptor returns res.data, so `res` IS the parsed body
        // Shape: { success, product_details, related_products, variants, shipping_charge }
        const body = res?.data ?? res;

        if (!body?.success) {
          setError(body?.message || 'Product not found');
          return;
        }

        setProduct(normaliseProduct(body.product_details));
        setRelatedProducts(normaliseRelated(body.related_products || []));
        setVariants(body.variants || []);
        setShippingCharges(body.shipping_charge || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[useProductDetail] error:', err);
          setError('Failed to load product. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { product, relatedProducts, variants, shippingCharges, loading, error };
};

export default useProductDetail;