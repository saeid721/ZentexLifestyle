// src/components/common/ProductCard/ProductCard.jsx
import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import useCartStore from '../../../app/store';
import { formatPrice, PLACEHOLDER_IMG, BASE_IMAGE_URL } from '../../../utils';
import apiClient from '../../../services/apiClient';
import { prefetchProduct, getPrefetchedProduct } from '../../../utils/productPrefetchCache';
import { X, Info, Heart } from 'lucide-react';
import useWishlistStore from '../../../app/wishlistStore';
import OptimizedImage from '../OptimizedImage';
import { showGlobalToast } from '../../../utils/toastBus';
import './ProductCard.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildImageUrl = (rawImage) => {
  if (!rawImage) return PLACEHOLDER_IMG;
  if (/^https?:\/\//i.test(rawImage)) return rawImage;
  const base = (BASE_IMAGE_URL || '').replace(/\/+$/, '');
  const path = rawImage.replace(/^\/+/, '');
  return `${base}/${path}`;
};

const resolveRawImage = (imageField) => {
  if (!imageField) return '';
  if (typeof imageField === 'string') return imageField;
  if (typeof imageField === 'object') return imageField.image ?? '';
  return '';
};

const extractImageFromProduct = (product) => {
  // 1. images[] array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const raw = product.images[0]?.image;
    if (raw) return buildImageUrl(raw);
  }
  // 2. flat image field
  const raw = resolveRawImage(product.image);
  if (raw) return buildImageUrl(raw);

  return ''; // no image available from this product object
};

// Extract image from a prefetch cache body (GET /product/:slug response)
const extractImageFromCacheBody = (body) => {
  if (!body?.success) return '';
  const pd = body.product_details;
  if (!pd) return '';

  // product_details.images[]
  if (Array.isArray(pd.images) && pd.images.length > 0) {
    const raw = pd.images[0]?.image;
    if (raw) return buildImageUrl(raw);
  }
  // product_details.image
  const raw = resolveRawImage(pd.image);
  if (raw) return buildImageUrl(raw);

  return '';
};

// ─── Variant Popup ────────────────────────────────────────────────────────────
const VariantPopup = ({ productName, productSlug, productImage, mode, onClose, onConfirm }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [preOrderColors, setPreOrderColors] = useState([]);
  const [preOrderSizes, setPreOrderSizes] = useState([]);
  const [isPreOrder, setIsPreOrder] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const cached = getPrefetchedProduct(productSlug);
    if (cached) {
      if (cached?.success) {
        setVariants(cached.variants || []);
        setPreOrderColors(cached.colors || []);
        setPreOrderSizes(cached.sizes || []);
        setIsPreOrder(!!cached.product_details?.pre_order_status);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient.get(`/product/${productSlug}`)
      .then((body) => {
        if (body?.success) {
          setVariants(body.variants || []);
          setPreOrderColors(body.colors || []);
          setPreOrderSizes(body.sizes || []);
          setIsPreOrder(!!body.product_details?.pre_order_status);
        }
      })
      .catch((err) => console.error('[VariantPopup]', err))
      .finally(() => setLoading(false));
  }, [productSlug]);

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => { setSelectedVariant(null); }, [selectedColor]);

  const totalStock = isPreOrder ? 9999 : variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const isOutOfStock = !isPreOrder && (variants.length === 0 || totalStock <= 0);

  const uniqueColors = isPreOrder
    ? preOrderColors
      .filter((c) => c && c.colorName)
      .map((c) => ({ color: { colorName: c.colorName }, id: c.id, stock: 9999 }))
    : (() => {
      const seen = {};
      return variants
        .filter((v) => v.color !== null)
        .filter((v) => {
          const n = v.color?.colorName;
          if (!n || seen[n]) return false;
          seen[n] = true;
          return true;
        });
    })();

  const availableSizes = isPreOrder
    ? preOrderSizes
      .filter((s) => s && s.sizeName)
      .map((s) => ({ id: s.id, size: { sizeName: s.sizeName }, stock: 9999 }))
    : selectedColor
      ? variants.filter((v) => v.size !== null && v.color?.colorName === selectedColor)
      : variants.filter((v) => v.size !== null);

  const hasColorSelector = uniqueColors.length > 0;
  const hasSizeSelector = availableSizes.length > 0;
  const hasVariants = hasColorSelector || hasSizeSelector;

  const canConfirm = !loading && !isOutOfStock && (
    !hasVariants || (
      (!hasColorSelector || !!selectedColor) &&
      (!hasSizeSelector || !!selectedVariant) &&
      (isPreOrder || !selectedVariant || Number(selectedVariant.stock || 0) > 0)
    )
  );

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (hasVariants) {
      if (hasColorSelector && !selectedColor) return;
      if (hasSizeSelector && !selectedVariant) return;
      if (!isPreOrder && selectedVariant && Number(selectedVariant.stock || 0) <= 0) {
        onConfirm(null, 'out');
        return;
      }
    }
    onConfirm(selectedVariant, 'success');
  };

  const isBuyNow = mode === 'buy';

  return (
    <div
      className="pc-popup"
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="pc-popup__header">
        <div className="pc-popup__header-info">
          <OptimizedImage
            src={productImage}
            alt={productName}
            className="pc-popup__thumb"
            fallbackSrc={PLACEHOLDER_IMG}
            loading="lazy"
            decoding="async"
            wrapperStyle={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}
          />
          <span className="pc-popup__header-name">{productName}</span>
        </div>
        <button className="pc-popup__close" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="pc-popup__body">
        {loading ? (
          <div className="pc-popup__loading">
            <div className="pc-popup__spinner" />
            <span>Loading…</span>
          </div>
        ) : isOutOfStock ? (
          <p className="pc-popup__out-of-stock">
            <Info size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            This product is currently out of stock.
          </p>
        ) : !hasVariants ? (
          <p className="pc-popup__no-variants">No size or color options for this product.</p>
        ) : (
          <>
            {hasColorSelector && (
              <div className="pc-popup__section">
                <p className="pc-popup__section-label">
                  Color:{' '}
                  <strong>{selectedColor || <span className="pc-popup__hint">Select a color</span>}</strong>
                </p>
                <div className="pc-popup__options">
                  {uniqueColors.map((v) => {
                    const label = v.color?.colorName || `#${v.id}`;
                    const allOut = !isPreOrder && variants
                      .filter((x) => x.color?.colorName === label)
                      .every((x) => Number(x.stock) === 0);
                    return (
                      <button
                        key={label}
                        className={[
                          'pc-popup__opt-btn',
                          selectedColor === label ? 'pc-popup__opt-btn--active' : '',
                          allOut ? 'pc-popup__opt-btn--disabled' : '',
                        ].join(' ')}
                        onClick={() => !allOut && setSelectedColor(label)}
                        disabled={allOut}
                        title={allOut ? 'Out of stock' : label}
                      >
                        {label}
                        {allOut && <span className="pc-popup__out-tag">Out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasSizeSelector && (
              <div className="pc-popup__section">
                <p className="pc-popup__section-label">
                  Size:{' '}
                  <strong>{selectedVariant?.size?.sizeName || <span className="pc-popup__hint">Select a size</span>}</strong>
                </p>
                <div className="pc-popup__options">
                  {availableSizes.map((v) => {
                    const outOfStock = !isPreOrder && Number(v.stock) === 0;
                    const label = v.size?.sizeName || `#${v.id}`;
                    return (
                      <button
                        key={v.id}
                        className={[
                          'pc-popup__opt-btn',
                          selectedVariant?.id === v.id ? 'pc-popup__opt-btn--active' : '',
                          outOfStock ? 'pc-popup__opt-btn--disabled' : '',
                        ].join(' ')}
                        onClick={() => !outOfStock && setSelectedVariant(v)}
                        disabled={outOfStock}
                        title={outOfStock ? 'Out of stock' : label}
                      >
                        {label}
                        {outOfStock && <span className="pc-popup__out-tag">Out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedVariant && !isPreOrder && (
              <p className="pc-popup__stock-info">
                {Number(selectedVariant.stock) > 0
                  ? `${Number(selectedVariant.stock)} items available`
                  : 'This variant is out of stock'}
              </p>
            )}
          </>
        )}
      </div>

      <div className="pc-popup__footer">
        <button
          className={[
            'pc-popup__confirm-btn',
            isBuyNow && isPreOrder ? 'pc-popup__confirm-btn--preorder' :
              isBuyNow ? 'pc-popup__confirm-btn--buy' : '',
          ].join(' ')}
          onClick={handleConfirm}
          disabled={loading || !canConfirm}
        >
          {isBuyNow ? (isPreOrder ? 'Pre Order' : 'Buy Now') : 'Add to Cart'}
        </button>
        <Link to={`/product/${productSlug}`} className="pc-popup__detail-link" onClick={onClose}>
          View Details
        </Link>
      </div>
    </div>
  );
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, showWishlistToggle = false, listView = false }) => {
  const [popupMode, setPopupMode] = useState(null);

  // ── Image state ───────────────────────────────────────────────
  const [resolvedImage, setResolvedImage] = useState(() => extractImageFromProduct(product));
  const fetchedRef = useRef(null);

  const slug = product?.slug;
  const name = product?.name;
  const price = Number(product?.new_price ?? product?.price ?? 0);
  const originalPrice = Number(product?.old_price ?? product?.originalPrice ?? 0);
  const discountPct = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;
  const [isStockOut, setIsStockOut] = useState(false);

  const [availableSizes, setAvailableSizes] = useState([]);

  const addToCart = useCartStore((s) => s.addToCart);
  const navigate = useNavigate();

  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const inWishlist = product?.id ? isInWishlist(product.id) : false;

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = inWishlist;
    toggleWishlistItem({
      id: product.id,
      name,
      slug,
      price,
      new_price: price,
      old_price: originalPrice,
      image: resolvedImage,
      images: product?.images,
    });
    showGlobalToast(
      wasInWishlist ? 'Removed from wishlist!' : 'Added to wishlist!',
      'success'
    );
  };

  const applyProductPayload = useCallback((body) => {
    if (!body?.success) return;

    const img = extractImageFromCacheBody(body);
    if (img) {
      setResolvedImage(img);
    }

    const variants = body.variants || [];
    if (variants.length === 0) {
      setIsStockOut(true);
      setAvailableSizes([]);
      return;
    }

    const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    setIsStockOut(totalStock <= 0);

    const seen = new Set();
    const sizes = variants
      .filter((v) => v.size?.sizeName)
      .filter((v) => {
        const n = v.size.sizeName;
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .map((v) => ({
        name: v.size.sizeName,
        inStock: Number(v.stock || 0) > 0,
      }));
    setAvailableSizes(sizes);
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (fetchedRef.current === slug) return;
    fetchedRef.current = slug;

    const cached = getPrefetchedProduct(slug);
    if (cached) {
      applyProductPayload(cached);
      return;
    }

    prefetchProduct(slug, () => apiClient.get(`/product/${slug}`))
      .then(applyProductPayload)
      .catch(() => { });
  }, [slug, applyProductPayload]);

  // ── Prefetch on hover (for variant popup speed) ───────────────
  const handleMouseEnter = useCallback(() => {
    prefetchProduct(slug, () => apiClient.get(`/product/${slug}`));
  }, [slug]);

  const handleVariantConfirm = useCallback((selectedVariant, status) => {
    const mode = popupMode;
    setPopupMode(null);

    if (status === 'out') {
      showGlobalToast('This variant is out of stock!', 'error');
      return;
    }

    const isPreOrder = !!product?.pre_order_status;
    const stock = isPreOrder ? 9999 : Number(selectedVariant?.stock ?? 999);
    if (!isPreOrder && stock <= 0) {
      showGlobalToast('Sorry, this item is out of stock!', 'error');
      return;
    }

    const cartItem = {
      id: product.id,
      name,
      slug,
      price: selectedVariant ? Number(selectedVariant.price ?? price) : price,
      originalPrice,
      image: resolvedImage,
      sku: product.product_code ?? product.sku ?? '',
      variant: selectedVariant || null,
      stock,
      pre_order_status: product.pre_order_status ?? 0,
    };

    addToCart(cartItem, 1, (errMsg) => showGlobalToast(errMsg, 'error'));

    if (mode === 'buy') {
      navigate('/checkout');
    } else {
      showGlobalToast('Item added to cart successfully!', 'success');
    }
  }, [popupMode, product, name, slug, price, originalPrice, resolvedImage, addToCart, navigate]);

  if (!product) return null;

  return (
    <div className={`product-card-wrapper${listView ? ' product-card-wrapper--list' : ''}`} style={{ position: 'relative' }}>
      <Card className={`product-card h-100${listView ? ' product-card--list' : ''}`} onMouseEnter={handleMouseEnter}>
        <Link to={`/product/${slug}`} className="product-card__img-wrapper">
          {showWishlistToggle && (
            <button
              type="button"
              className={`product-card__wishlist-btn${inWishlist ? ' product-card__wishlist-btn--active' : ''}`}
              onClick={handleToggleWishlist}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          )}
          {discountPct && (
            <span className="product-card__badge">{discountPct}% OFF</span>
          )}

          {product?.pre_order_status ? (
            <span className="product-card__badge product-card__badge--preorder">PRE ORDER</span>
          ) : isStockOut ? (
            <span className="product-card__badge product-card__badge--stockout">Stock Out</span>
          ) : null
          }
          <OptimizedImage
            src={resolvedImage || PLACEHOLDER_IMG}
            alt={name}
            className="product-card__img"
            fallbackSrc={PLACEHOLDER_IMG}
            loading="lazy"
            decoding="async"
            width={320}
            height={320}
            fetchPriority="auto"
            wrapperStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />

          {!listView && availableSizes.length > 0 && (
            <div className="product-card__sizes">
              {availableSizes.map((s) => (
                <span
                  key={s.name}
                  className={`product-card__size${s.inStock ? '' : ' product-card__size--out'}`}
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </Link>

        <Card.Body className="product-card__body d-flex flex-column">
          <Link to={`/product/${slug}`}>
            <p className="product-card__name">{name}</p>
          </Link>

          <div className="product-card__price mt-auto mb-2">
            <span className="price-current">{formatPrice(price)}</span>
            {originalPrice > price && (
              <span className="price-original ms-2">{formatPrice(originalPrice)}</span>
            )}
          </div>

          {listView ? (
            <div className="product-card__list-footer">
              {availableSizes.length > 0 && (
                <div className="product-card__list-sizes">
                  {availableSizes.map((s) => (
                    <span
                      key={s.name}
                      className={`product-card__size${s.inStock ? '' : ' product-card__size--out'}`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="product-card__actions d-flex gap-2">
                <button
                  className="product-card__btn product-card__btn--add"
                  onClick={(e) => { e.preventDefault(); setPopupMode('cart'); }}
                >
                  Add to Cart
                </button>
                {product.pre_order_status ? (
                  <button
                    className="product-card__btn product-card__btn--preorder"
                    onClick={(e) => { e.preventDefault(); setPopupMode('buy'); }}
                  >
                    Pre Order
                  </button>
                ) : (
                  <button
                    className="product-card__btn product-card__btn--buy"
                    onClick={(e) => { e.preventDefault(); setPopupMode('buy'); }}
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="product-card__actions d-flex gap-2">
              <button
                className="product-card__btn product-card__btn--add"
                onClick={(e) => { e.preventDefault(); setPopupMode('cart'); }}
              >
                Add to Cart
              </button>
              {product.pre_order_status ? (
                <button
                  className="product-card__btn product-card__btn--preorder"
                  onClick={(e) => { e.preventDefault(); setPopupMode('buy'); }}
                >
                  Pre Order
                </button>
              ) : (
                <button
                  className="product-card__btn product-card__btn--buy"
                  onClick={(e) => { e.preventDefault(); setPopupMode('buy'); }}
                >
                  Buy Now
                </button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {popupMode && (
        <VariantPopup
          productName={name}
          productSlug={slug}
          productImage={resolvedImage}
          mode={popupMode}
          onClose={() => setPopupMode(null)}
          onConfirm={handleVariantConfirm}
        />
      )}

    </div>
  );
};

export default memo(ProductCard);