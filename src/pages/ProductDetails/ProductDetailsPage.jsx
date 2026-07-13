// src/pages/ProductDetails/ProductDetailsPage.jsx
import SEO from '../../components/SEO';
import { SCHEMA_ORG_URL, SCHEMA_ORG_IN_STOCK } from '../../utils';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import { productService } from '../../features/products/services/productService';
import { getPrefetchedProduct, prefetchProduct } from '../../utils/productPrefetchCache';
import apiClient from '../../services/apiClient';
import useCartStore from '../../app/store';
import { formatPrice, PLACEHOLDER_IMG, BASE_IMAGE_URL, FACEBOOK_SHARE_URL, TWITTER_SHARE_URL, LINKEDIN_SHARE_URL, WHATSAPP_BASE_URL } from '../../utils';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import './ProductDetailsPage.scss';

const buildUrl = (path) =>
  path ? `${BASE_IMAGE_URL}${path}` : PLACEHOLDER_IMG;

// Safely build a full image URL from a raw path
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

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose, anchorRef }) => {
  const toastRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    if (anchorRef?.current && toastRef.current) {
      const btnRect = anchorRef.current.getBoundingClientRect();
      const toastEl = toastRef.current;
      toastEl.style.position = 'fixed';
      toastEl.style.bottom = 'auto';
      toastEl.style.right = 'auto';
      toastEl.style.left = `${btnRect.left}px`;
      toastEl.style.top = `${btnRect.top - 8}px`;
      toastEl.style.transform = 'translateY(-100%)';
      toastEl.style.maxWidth = `${btnRect.width}px`;
      toastEl.style.width = `${btnRect.width}px`;
      toastEl.style.textAlign = 'center';
      toastEl.style.justifyContent = 'center';
    }
  }, [anchorRef]);

  return (
    <div ref={toastRef} className={`pdp-toast pdp-toast--${type}`}>
      <span className="pdp-toast__icon">
        {type === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>
      {message}
    </div>
  );
};

// ─── Variant Popup ────────────────────────────────────────────────────────────
const VariantPopup = ({ productName, productSlug, productImage, mode, onClose, onConfirm }) => {
  const [variants, setVariants] = useState([]);
  const [preOrderColors, setPreOrderColors] = useState([]);
  const [preOrderSizes, setPreOrderSizes] = useState([]);
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    const applyBody = (body) => {
      if (!body?.success) return;
      const po = !!body.product_details?.pre_order_status;
      setIsPreOrder(po);
      setVariants(body.variants || []);
      setPreOrderColors(body.colors || []);
      setPreOrderSizes(body.sizes || []);
    };

    const cached = getPrefetchedProduct(productSlug);
    if (cached) {
      applyBody(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient.get(`/product/${productSlug}`)
      .then((body) => applyBody(body))
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

  // Pre-order: use top-level colors/sizes; ignore variant stock entirely
  const uniqueColors = isPreOrder
    ? preOrderColors.map((c) => ({ id: c.id, color: { colorName: c.colorName }, stock: 9999 }))
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
    ? preOrderSizes.map((s) => ({ id: s.id, size: { sizeName: s.sizeName }, stock: 9999 }))
    : selectedColor
      ? variants.filter((v) => v.size !== null && v.color?.colorName === selectedColor)
      : variants.filter((v) => v.size !== null);

  const totalStock = isPreOrder ? 9999 : variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const isOutOfStock = !isPreOrder && (variants.length === 0 || totalStock <= 0);

  const hasColorSelector = uniqueColors.length > 0;
  const hasSizeSelector = availableSizes.length > 0;
  const hasVariants = hasColorSelector || hasSizeSelector;

  const canConfirm = !loading && !isOutOfStock && (
    !hasVariants || (
      (!hasColorSelector || !!selectedColor) &&
      (!hasSizeSelector || !!selectedVariant)
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
          <img
            src={productImage}
            alt={productName}
            className="pc-popup__thumb"
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
          <span className="pc-popup__header-name">{productName}</span>
        </div>
        <button className="pc-popup__close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
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

            {!isPreOrder && selectedVariant && (
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
      </div>
    </div>
  );
};

// ─── Size Guide Modal ─────────────────────────────────────────────────────────
const SizeGuideModal = ({ onClose, sizeGuideImg }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="sg-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sg-modal" role="dialog" aria-modal="true" aria-label="Size Guide">
        <div className="sg-modal__header">
          <div className="sg-modal__header-left">
            <span className="sg-modal__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9l20-7-7 20-3-8-10-5z" />
              </svg>
            </span>
            <div>
              <h2 className="sg-modal__title">Size Guide</h2>
              <p className="sg-modal__subtitle">Measurement chart</p>
            </div>
          </div>
          <button className="sg-modal__close" onClick={onClose} aria-label="Close size guide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="sg-modal__body">
          <div className="sg-modal__img-wrap">
            {sizeGuideImg ? (
              <img
                src={sizeGuideImg}
                alt="Size measurement chart"
                className="sg-modal__img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                draggable={false}
              />
            ) : null}
            <div className="sg-modal__img-fallback" style={{ display: sizeGuideImg ? 'none' : 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Size chart not available.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Parse raw API body → page state ─────────────────────────────────────────
const parseProductBody = (body) => {
  if (!body?.success) return null;

  const pd = body.product_details;
  if (!pd) return null;

  const primaryPath =
    typeof pd.image === 'string' ? pd.image : pd.image?.image || '';
  const gallery = Array.isArray(pd.images) && pd.images.length > 0
    ? pd.images.map((img) => buildUrl(img.image))
    : [buildUrl(primaryPath)];

  const product = {
    id: pd.id,
    name: pd.name,
    slug: pd.slug,
    price: Number(pd.new_price),
    originalPrice: Number(pd.old_price),
    discount: Number(pd.discount) || 0,
    image: buildUrl(primaryPath),
    images: gallery,
    description: pd.description || '',
    sku: pd.product_code || '',
    brand: pd.brand?.name || null,
    category: pd.category || null,
    subcategory: pd.subcategory || null,
    badge: Number(pd.new_arrival) === 1 ? 'New' : null,
    sizeGuideImg: pd.size_guide ? buildUrl(pd.size_guide) : null,
    pre_order_status: Number(pd.pre_order_status) || 0,   // ← add this line
  };

  const related = (body.related_products || []).map((rp) => ({ ...rp }));

  const pd_meta = body.product_details;
  return {
    product,
    related,
    variants: body.variants || [],
    shippingCharges: body.shipping_charge || [],
    preOrderColors: body.colors || [],
    preOrderSizes: body.sizes || [],
    meta: {
      title: body.meta?.title || pd_meta?.meta_title || null,
      description: body.meta?.description || pd_meta?.meta_description || null,
      keywords: body.meta?.keywords || (pd_meta?.meta_keywords ? pd_meta.meta_keywords.split(',').map(k => k.trim()) : []),
    },
  };
};

// ─── Touch Helpers ───────────────────────────────────────────────────────────
const getTouchDistance = (t1, t2) => {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getTouchMidpoint = (t1, t2, rect) => {
  const x = ((t1.clientX + t2.clientX) / 2 - rect.left) / rect.width * 100;
  const y = ((t1.clientY + t2.clientY) / 2 - rect.top) / rect.height * 100;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y))
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const imgWrapRef = useRef(null);
  const cartBtnRef = useRef(null);

  const initialParsed = (() => {
    if (!slug) return null;
    const cached = getPrefetchedProduct(slug);
    if (!cached) return null;
    return parseProductBody(cached);
  })();

  const [product, setProduct] = useState(initialParsed?.product ?? null);
  const [relatedProducts, setRelatedProducts] = useState(initialParsed?.related ?? []);
  const [variants, setVariants] = useState(initialParsed?.variants ?? []);
  const [shippingCharges, setShippingCharges] = useState(initialParsed?.shippingCharges ?? []);
  const [preOrderColors, setPreOrderColors] = useState(initialParsed?.preOrderColors ?? []);
  const [preOrderSizes, setPreOrderSizes] = useState(initialParsed?.preOrderSizes ?? []);
  const [sizeGuideImg, setSizeGuideImg] = useState(initialParsed?.product?.sizeGuideImg ?? null);
  const [loading, setLoading] = useState(!initialParsed);

  const [qty, setQty] = useState(1);
  const [qtyWarning, setQtyWarning] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [toast, setToast] = useState(null);
  const [openTab, setOpenTab] = useState(null);

  // Zoom states
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [activeImg, setActiveImg] = useState('');
  const [colorOverrideImg, setColorOverrideImg] = useState(null);

  // Touch zoom states
  const [touchScale, setTouchScale] = useState(1);
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [isTouchZooming, setIsTouchZooming] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  // live visitors count
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [showLiveVisitors, setShowLiveVisitors] = useState(false);

  // Popup state for variant selection (for main product)
  const [popupMode, setPopupMode] = useState(null);

  const addToCart = useCartStore((s) => s.addToCart);

  // SEO Meta state
  const [meta, setMeta] = useState(initialParsed?.meta ?? null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const applyParsed = useCallback((parsed) => {
    if (!parsed) return;
    setProduct(parsed.product);
    setRelatedProducts(parsed.related);
    setVariants(parsed.variants);
    setShippingCharges(parsed.shippingCharges);
    setSizeGuideImg(parsed.product.sizeGuideImg);
    setPreOrderColors(parsed.preOrderColors);
    setPreOrderSizes(parsed.preOrderSizes);
    setMeta(parsed.meta ?? null);
  }, []);

  // Fetch live visitors count
  useEffect(() => {
    const fetchLiveVisitors = async () => {
      try {
        const response = await apiClient.get('/live-visitors');
        if (response?.visible && response?.count > 0) {
          setLiveVisitors(response.count);
          setShowLiveVisitors(true);
        }
      } catch (error) {
        console.error('Failed to fetch live visitors:', error);
      }
    };

    fetchLiveVisitors();

    // Poll every 30 seconds
    const interval = setInterval(fetchLiveVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!slug) return;

    setQty(1);
    setQtyWarning('');
    setSelectedVariant(null);
    setSelectedColor(null);
    setToast(null);
    setOpenTab(null);
    setTouchScale(1);
    setIsTouchZooming(false);
    setColorOverrideImg(null);

    const cached = getPrefetchedProduct(slug);
    if (cached) {
      const parsed = parseProductBody(cached);
      if (parsed) {
        applyParsed(parsed);
        setLoading(false);
        parsed.related.forEach((rp) =>
          prefetchProduct(rp.slug, () => apiClient.get(`/product/${rp.slug}`))
        );
        return;
      }
    }

    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setVariants([]);
    setShippingCharges([]);
    setSizeGuideImg(null);
    setPreOrderColors([]);
    setPreOrderSizes([]);
    setMeta(null);

    productService
      .getProductBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        const parsed = parseProductBody(res);
        applyParsed(parsed);
        if (parsed) {
          parsed.related.forEach((rp) =>
            prefetchProduct(rp.slug, () => apiClient.get(`/product/${rp.slug}`))
          );
        }
      })
      .catch((err) => console.error('[ProductDetailsPage]', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    setQtyWarning('');
    setQty(1);
  }, [selectedVariant]);

  // ─── Mouse Zoom Handlers ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (isTouchZooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, [isTouchZooming]);

  const handleZoomEnter = useCallback((img) => {
    if (isTouchZooming) return;
    setActiveImg(img);
    setIsZooming(true);
  }, [isTouchZooming]);

  const handleZoomLeave = useCallback(() => {
    if (isTouchZooming) return;
    setIsZooming(false);
  }, [isTouchZooming]);

  // ─── Touch Zoom Handlers ─────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const midpoint = getTouchMidpoint(e.touches[0], e.touches[1], rect);
      setTouchStartDist(distance);
      setZoomPos(midpoint);
      setIsTouchZooming(true);
      return;
    }

    // Double-tap detection
    const now = Date.now();
    if (e.touches.length === 1 && now - lastTapTime < 300) {
      e.preventDefault();
      if (touchScale > 1) {
        setTouchScale(1);
        setIsTouchZooming(false);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
        setZoomPos({ x, y });
        setTouchScale(2.5);
        setIsTouchZooming(true);
      }
      setLastTapTime(0);
      return;
    }
    setLastTapTime(now);
  }, [lastTapTime, touchScale]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isTouchZooming) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = getTouchMidpoint(e.touches[0], e.touches[1], rect);
      const scale = Math.min(3.5, Math.max(1, (currentDist / touchStartDist) * touchScale));
      setTouchScale(scale);
      setZoomPos(midpoint);
    }
  }, [isTouchZooming, touchStartDist, touchScale]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      if (isTouchZooming && touchScale < 1.15) {
        setTouchScale(1);
        setIsTouchZooming(false);
      }
      // Update the base scale reference for next pinch
      setTouchStartDist(0);
    }
  }, [isTouchZooming, touchScale]);

  const handleTouchCancel = useCallback(() => {
    setTouchScale(1);
    setIsTouchZooming(false);
  }, []);

  // ─── Available Colors/Sizes Logic ────────────────────────────────────────────
  const availableColors = useMemo(() => {
    const isPreOrder = !!product?.pre_order_status;
    if (isPreOrder) {
      // Use top-level colors array from API, no stock check
      return preOrderColors.map((c) => {
        const matched = variants.find((v) => v.color?.colorName === c.colorName && v.image);
        return {
          name: c.colorName,
          hex: c.color || null,
          totalStock: 9999,
          variantImage: matched?.image ? buildUrl(matched.image) : null,
        };
      });
    }
    const map = {};
    variants.forEach((v) => {
      if (v.color?.colorName && Number(v.stock) > 0) {
        if (!map[v.color.colorName]) {
          map[v.color.colorName] = {
            name: v.color.colorName,
            hex: v.color?.color || null,
            totalStock: 0,
            variantImage: v.image ? buildUrl(v.image) : null,
          };
        }
        map[v.color.colorName].totalStock += Number(v.stock);
      }
    });
    return Object.values(map);
  }, [variants, preOrderColors, product?.pre_order_status]);

  const availableSizes = useMemo(() => {
    const isPreOrder = !!product?.pre_order_status;
    if (isPreOrder) {
      const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      return preOrderSizes
        .map((s) => ({ name: s.sizeName, totalStock: 9999 }))
        .sort((a, b) => {
          const ai = order.indexOf(a.name.toUpperCase());
          const bi = order.indexOf(b.name.toUpperCase());
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        });
    }
    const map = {};
    variants.forEach((v) => {
      if (v.size?.sizeName) {
        if (!map[v.size.sizeName]) {
          map[v.size.sizeName] = { name: v.size.sizeName, totalStock: 0 };
        }
        map[v.size.sizeName].totalStock += Number(v.stock || 0);
      }
    });
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    return Object.values(map).sort((a, b) => {
      const ai = order.indexOf(a.name.toUpperCase());
      const bi = order.indexOf(b.name.toUpperCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }, [variants, preOrderSizes, product?.pre_order_status]);

  const totalStock = useMemo(() => {
    if (product?.pre_order_status) return 9999;
    return variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }, [variants, product?.pre_order_status]);
  const selectedStock = (() => {
    if (product?.pre_order_status || selectedVariant === null) return null;
    // If both color and size selected: show that specific variant's stock
    if (selectedColor && selectedVariant) {
      return Number(selectedVariant.stock || 0);
    }
    // If only size selected (no color): show total stock across all colors for that size
    if (!selectedColor && selectedVariant) {
      const total = variants
        .filter((v) => v.size?.sizeName === selectedVariant.size?.sizeName)
        .reduce((sum, v) => sum + Number(v.stock || 0), 0);
      return total;
    }
    return Number(selectedVariant.stock || 0);
  })();
  const inStock = product?.pre_order_status ? true : (variants.length > 0 ? totalStock > 0 : false);
  const activePrice = product?.price || 0;

  const discountPct =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const baseImages = product?.images?.length > 0 ? product.images : [PLACEHOLDER_IMG];
  const images = colorOverrideImg
    ? [colorOverrideImg, ...baseImages.filter((img) => img !== colorOverrideImg)]
    : baseImages;
  const hasColorSelector = availableColors.length > 0;
  const hasSizeSelector = availableSizes.length > 0;

  // ─── Quantity Handlers ───────────────────────────────────────────────────────
  const handleQtyIncrease = () => {
    if (!product?.pre_order_status && selectedStock !== null && qty >= selectedStock) {
      setQtyWarning(`Maximum available stock is ${selectedStock}`);
      return;
    }
    setQtyWarning('');
    setQty((q) => q + 1);
  };

  const handleQtyDecrease = () => {
    setQtyWarning('');
    setQty((q) => Math.max(1, q - 1));
  };

  // ─── Cart Logic for Main Product ──────────────────────────────────────────────
  const getCartError = () => {
    const isPreOrder = !!product?.pre_order_status;
    if (isPreOrder) {
      if (hasColorSelector && !selectedColor) return 'Please select a color first!';
      if (hasSizeSelector && !selectedVariant) return 'Please select a size first!';
      return null;
    }
    if (variants.length > 0) {
      if (hasColorSelector && !selectedColor) return 'Please select a color first!';
      if (hasSizeSelector && !selectedVariant) return 'Please select a size first!';
      if (selectedVariant) {
        const varStock = Number(selectedVariant.stock || 0);
        if (varStock <= 0) return 'This item is out of stock!';
        if (qty > varStock) return `Only ${varStock} item(s) available in stock!`;
        return null;
      }
      if (!hasColorSelector && !hasSizeSelector && totalStock <= 0)
        return 'This product is out of stock!';
      return null;
    }
    if (!inStock) return 'This product is out of stock!';
    return null;
  };

  const handleAddToCart = () => {
    const error = getCartError();
    if (error) { showToast(error, 'error'); return; }
    const finalStock = product?.pre_order_status ? 9999 : Number(selectedVariant?.stock ?? totalStock);
    if (finalStock <= 0) { showToast('Item went out of stock!', 'error'); return; }
    addToCart(
      {
        id: product.id, name: product.name, slug: product.slug, price: activePrice,
        originalPrice: product.originalPrice, image: product.image, sku: product.sku,
        variant: selectedVariant || null, stock: finalStock,
        pre_order_status: product.pre_order_status ?? 0
      },
      qty,
      (msg) => showToast(msg, 'error'),
    );
    showToast('Item added to cart successfully!', 'success');
  };

  const handleBuyNow = () => {
    const error = getCartError();
    if (error) { showToast(error, 'error'); return; }
    const finalStock = product?.pre_order_status ? 9999 : Number(selectedVariant?.stock ?? totalStock);
    if (finalStock <= 0) { showToast('Item went out of stock!', 'error'); return; }
    addToCart(
      {
        id: product.id, name: product.name, slug: product.slug, price: activePrice,
        originalPrice: product.originalPrice, image: product.image, sku: product.sku,
        variant: selectedVariant || null, stock: finalStock,
        pre_order_status: product.pre_order_status ?? 0
      },
      qty,
      (msg) => showToast(msg, 'error'),
    );
    navigate('/checkout');
  };

  // Handler for variant popup confirmation
  const handleVariantConfirm = useCallback((selectedVariant, status) => {
    const mode = popupMode;
    setPopupMode(null);

    if (status === 'out') {
      showToast('This variant is out of stock!', 'error');
      return;
    }

    const isPreOrderProduct = !!product?.pre_order_status;
    const stock = isPreOrderProduct ? 9999 : Number(selectedVariant?.stock ?? totalStock);
    if (!isPreOrderProduct && stock <= 0) {
      showToast('Sorry, this item is out of stock!', 'error');
      return;
    }

    const finalPrice = selectedVariant ? Number(selectedVariant.price ?? activePrice) : activePrice;
    const finalVariant = selectedVariant || null;

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: finalPrice,
        originalPrice: product.originalPrice,
        image: product.image,
        sku: product.sku,
        variant: finalVariant,
        stock: stock,
        pre_order_status: product.pre_order_status ?? 0,
      },
      qty,
      (msg) => showToast(msg, 'error')
    );

    if (mode === 'buy') {
      navigate('/checkout');
    } else {
      showToast('Item added to cart successfully!', 'success');
    }
  }, [popupMode, product, activePrice, totalStock, qty, addToCart, showToast, navigate]);

  const toggleTab = (tabName) => setOpenTab(openTab === tabName ? null : tabName);

  if (loading) return (
    <div className="pdp-loader"><div className="pdp-spinner" /></div>
  );

  if (!product) return (
    <Container className="container-1500 py-5 text-center">
      <h4>Product not found.</h4>
      <Link to="/" className="pdp-btn pdp-btn--buy mt-3">← Back to Home</Link>
    </Container>
  );

  const isAnyZooming = isZooming || isTouchZooming;
  const currentScale = isTouchZooming ? touchScale : 1;

  return (
    <main className="pdp">
      {/* ── SEO ── */}
      {product && (
        <SEO
          title={meta?.title || product.name}
          description={meta?.description || ''}
          keywords={Array.isArray(meta?.keywords) ? meta.keywords.join(', ') : (meta?.keywords || '')}
          url={typeof window !== 'undefined' ? window.location.href : ''}
          canonical={typeof window !== 'undefined' ? window.location.href : ''}
          ogType="product"
          ogImage={product.image}
          schemas={[
            {
              '@context': SCHEMA_ORG_URL,
              '@type': 'Product',
              name: product.name,
              image: product.images || [product.image],
              description: meta?.description || '',
              sku: product.sku,
              brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'BDT',
                availability: inStock ? SCHEMA_ORG_IN_STOCK : 'https://schema.org/OutOfStock',
                url: typeof window !== 'undefined' ? window.location.href : '',
              },
            },
          ]}
        />
      )}

      {showSizeGuide && (
        <SizeGuideModal onClose={() => setShowSizeGuide(false)} sizeGuideImg={sizeGuideImg} />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          anchorRef={toast.type === 'success' ? cartBtnRef : null}
        />
      )}

      {/* Variant Popup for Main Product */}
      {popupMode && (
        <div className="pdp-variant-popup-overlay">
          <VariantPopup
            productName={product.name}
            productSlug={product.slug}
            productImage={product.image}
            mode={popupMode}
            onClose={() => setPopupMode(null)}
            onConfirm={handleVariantConfirm}
          />
        </div>
      )}

      <Container className="container-1500 py-3">

        {/* Breadcrumb + Back */}
        <div className="pdp__topbar d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="pdp__breadcrumb">
              <li className="pdp__bc-item">
                <Link to="/">Home</Link>
              </li>
              {product.category && (
                <li className="pdp__bc-item">
                  <span className="pdp__bc-sep">&gt;</span>
                  <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
                </li>
              )}
              {product.subcategory && (
                <li className="pdp__bc-item">
                  <span className="pdp__bc-sep">&gt;</span>
                  <Link to={`/subcategory/${product.subcategory.slug}`}>{product.subcategory.subcategoryName}</Link>
                </li>
              )}
              <li className="pdp__bc-item" aria-current="page">
                <span className="pdp__bc-sep">&gt;</span>
                <span className="pdp__bc-active">{product.name}</span>
              </li>
            </ol>
          </nav>
          <Link to="/" className="pdp__back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back To Home
          </Link>
        </div>

        <Row className="g-4">

          {/* ── Left: Gallery ── */}
          <Col xs={12} md={6}>
            <div className="pdp__gallery-wrap">
              <div className="pdp__gallery">
                <div className="pdp__main-swiper-wrap">
                  <button className="pdp__nav-btn pdp__nav-btn--prev pdp__nav-btn--main-prev" aria-label="Previous image">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button className="pdp__nav-btn pdp__nav-btn--next pdp__nav-btn--main-next" aria-label="Next image">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <Swiper
                    modules={[Navigation, Thumbs, FreeMode]}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    navigation={{ prevEl: '.pdp__nav-btn--main-prev', nextEl: '.pdp__nav-btn--main-next' }}
                    loop
                    className="pdp__main-swiper"
                  >
                    {images.map((img, i) => (
                      <SwiperSlide key={i}>
                        <div
                          ref={imgWrapRef}
                          className={`pdp__main-img-wrap ${isAnyZooming ? 'pdp__main-img-wrap--zooming' : ''} ${isTouchZooming ? 'pdp__main-img-wrap--touch' : ''}`}
                          onMouseMove={handleMouseMove}
                          onMouseEnter={() => handleZoomEnter(img)}
                          onMouseLeave={handleZoomLeave}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchCancel}
                          style={{ touchAction: isTouchZooming ? 'none' : 'pan-y' }}
                        >
                          <div
                            className={`pdp__zoom-lens ${isAnyZooming ? 'pdp__zoom-lens--visible' : ''}`}
                            style={{
                              left: `${zoomPos.x}%`,
                              top: `${zoomPos.y}%`,
                              width: isTouchZooming ? `${110 / currentScale}px` : '110px',
                              height: isTouchZooming ? `${110 / currentScale}px` : '110px',
                            }}
                          />

                          <img
                            src={img}
                            alt={`${product.name} view ${i + 1}`}
                            className={`pdp__main-img ${isTouchZooming ? 'pdp__main-img--touch-zoom' : ''}`}
                            style={{
                              transform: isTouchZooming ? `scale(${touchScale})` : 'none',
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                              transition: isTouchZooming ? 'none' : 'transform 0.25s ease, opacity 0.2s',
                            }}
                            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                            draggable={false}
                          />

                          <span className={`pdp__zoom-hint ${isAnyZooming ? 'pdp__zoom-hint--hidden' : ''}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              <line x1="11" y1="8" x2="11" y2="14" />
                              <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                            {isTouchZooming ? '🤏 Pinch to adjust' : 'Hover or pinch to zoom'}
                          </span>

                          <span className={`pdp__zoom-hint-mobile ${isAnyZooming ? 'pdp__zoom-hint-mobile--hidden' : ''}`}>
                            🤏 Pinch to zoom
                          </span>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                <div className="pdp__thumb-swiper-wrap">
                  <button className="pdp__nav-btn pdp__nav-btn--sm pdp__nav-btn--thumb-prev" aria-label="Previous">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button className="pdp__nav-btn pdp__nav-btn--sm pdp__nav-btn--thumb-next" aria-label="Next">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                  <Swiper
                    modules={[FreeMode, Navigation, Thumbs]}
                    onSwiper={setThumbsSwiper}
                    navigation={{ prevEl: '.pdp__nav-btn--thumb-prev', nextEl: '.pdp__nav-btn--thumb-next' }}
                    spaceBetween={8} slidesPerView={5} freeMode watchSlidesProgress
                    className="pdp__thumb-swiper"
                  >
                    {images.map((img, i) => (
                      <SwiperSlide key={i}>
                        <div className="pdp__thumb-wrap">
                          <img src={img} alt={`thumb ${i + 1}`} className="pdp__thumb-img"
                            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }} />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>

              <div
                className={`pdp__zoom-result ${isAnyZooming ? 'pdp__zoom-result--visible' : ''}`}
                style={{
                  backgroundImage: `url(${activeImg || images[0]})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: `${300 * currentScale}%`,
                  backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
              />
            </div>
          </Col>

          {/* ── Right: Info ── */}
          <Col xs={12} md={6}>
            <div className="pdp__info">

              <h1 className="pdp__name">{product.name}</h1>

              <div className="pdp__sku-share">
                {product.sku && <p className="pdp__sku">SKU: {product.sku}</p>}
                <div className="pdp__share">
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open(`${FACEBOOK_SHARE_URL}?u=${encodeURIComponent(window.location.href)}`, 'facebook-share-dialog', 'width=626,height=436'); }} className="pdp__share-btn pdp__share-btn--fb" aria-label="Share on Facebook">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open(`${TWITTER_SHARE_URL}?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(window.location.href)}`, 'twitter-share-dialog', 'width=550,height=420'); }} className="pdp__share-btn pdp__share-btn--tw" aria-label="Share on Twitter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open(`${LINKEDIN_SHARE_URL}?url=${encodeURIComponent(window.location.href)}`, 'linkedin-share-dialog', 'width=550,height=550'); }} className="pdp__share-btn pdp__share-btn--li" aria-label="Share on LinkedIn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.open(`${WHATSAPP_BASE_URL}/?text=${encodeURIComponent(product.name + ' - ' + window.location.href)}`, 'whatsapp-share-dialog', 'width=600,height=500'); }} className="pdp__share-btn pdp__share-btn--wa" aria-label="Share on WhatsApp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.527 5.845L.057 23.926l6.264-1.643A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.66-.52-5.17-1.426l-.371-.22-3.818 1.002 1.017-3.722-.241-.383A9.952 9.952 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = `mailto:?subject=${encodeURIComponent('Check out ' + product.name)}&body=${encodeURIComponent('I found this product: ' + product.name + '\n\n' + window.location.href)}`; }} className="pdp__share-btn pdp__share-btn--em" aria-label="Share via Email">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </a>
                </div>
              </div>

              <div className="pdp__price-row">
                <span className="pdp__price-label">PRICE:</span>
                <span className="pdp__price-current">{formatPrice(activePrice)}</span>
                {product.originalPrice > product.price && (
                  <span className="pdp__price-original">{formatPrice(product.originalPrice)}</span>
                )}
                {discountPct && (
                  <span className="pdp__price-discount">{discountPct}% OFF</span>
                )}
              </div>

              {hasColorSelector && (
                <div className="pdp__size-row">
                  <span className="pdp__size-label">
                    Select Your Color: <strong>{selectedColor || ''}</strong>
                  </span>
                  <div className="pdp__sizes pdp__sizes--colors">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        className={['pdp__color-btn', selectedColor === color.name ? 'pdp__color-btn--active' : ''].join(' ')}
                        onClick={() => {
                          const newColor = color.name;
                          setSelectedColor(newColor);
                          setQty(1);
                          setQtyWarning('');
                          setColorOverrideImg(color.variantImage || null);
                          // Auto-reselect previously chosen size if still available under new color
                          const prevSizeName = selectedVariant?.size?.sizeName;
                          if (prevSizeName) {
                            const matched = variants.find((v) =>
                              v.size?.sizeName === prevSizeName &&
                              v.color?.colorName === newColor &&
                              Number(v.stock) > 0
                            );
                            setSelectedVariant(matched || null);
                          } else {
                            setSelectedVariant(null);
                          }
                        }}
                        title={color.name}
                      >
                        {color.variantImage ? (
                          <img src={color.variantImage} alt={color.name} className="pdp__color-btn-img" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : color.hex ? (
                          <span className="pdp__color-btn-swatch" style={{ backgroundColor: color.hex }} />
                        ) : null}
                        <span className="pdp__color-btn-label">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasSizeSelector && (
                <div className="pdp__size-row">
                  <div className="pdp__size-label-row">
                    <span className="pdp__size-label">
                      Select Your Size: <strong>{selectedVariant?.size?.sizeName || ''}</strong>
                    </span>
                    {sizeGuideImg && (
                      <button type="button" className="pdp__size-guide-trigger" onClick={() => setShowSizeGuide(true)} aria-label="Open size guide">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10H7M21 6H3M21 14H3M21 18H7" /></svg>
                        Size Guide
                      </button>
                    )}
                  </div>
                  <div className="pdp__sizes">
                    {availableSizes
                      .map((size) => {
                        const outOfStock = !product?.pre_order_status && !variants.some((v) =>
                          v.size?.sizeName === size.name &&
                          (!selectedColor || v.color?.colorName === selectedColor) &&
                          Number(v.stock) > 0
                        );
                        const isActive = selectedVariant?.size?.sizeName === size.name;
                        return (
                          <button
                            key={size.name}
                            className={['pdp__size-btn', isActive ? 'pdp__size-btn--active' : '', outOfStock ? 'pdp__size-btn--disabled' : ''].join(' ')}
                            disabled={outOfStock}
                            onClick={() => {
                              if (outOfStock) return;
                              if (product?.pre_order_status) {
                                // For pre-order, build a synthetic variant object from sizes/colors lists
                                setSelectedVariant({ size: { sizeName: size.name }, stock: 9999 });
                                return;
                              }
                              const matched = variants.find((v) =>
                                v.size?.sizeName === size.name &&
                                (!selectedColor || v.color?.colorName === selectedColor) &&
                                Number(v.stock) > 0
                              );
                              setSelectedVariant(matched || null);
                            }}
                            title={outOfStock ? 'Out of stock' : `${size.name} (${size.totalStock} in stock)`}
                          >
                            {size.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {product.brand && (
                <div className="pdp__field-row">
                  <span className="pdp__field-label">BRAND:</span>
                  <span className="pdp__field-value">{product.brand}</span>
                </div>
              )}

              {shippingCharges.length > 0 && (
                <div className="pdp__field-row">
                  <span className="pdp__field-label">DELIVERY:</span>
                  <span className="pdp__field-value">{shippingCharges.map((s) => s.name).join(' | ')}</span>
                </div>
              )}

              {/* <div className="pdp__field-row">
                <span className="pdp__field-label">STATUS:</span>
                {product?.pre_order_status
                  ? <span className="pdp__status pdp__status--preorder">PRE ORDER</span>
                  : inStock
                    ? <span className="pdp__status pdp__status--in">STOCK IN</span>
                    : <span className="pdp__status pdp__status--out">STOCK OUT</span>
                }
              </div> */}

              {inStock && (
                <div className="pdp__qty-row">
                  <span className="pdp__qty-label">QUANTITY</span>
                  <div className="pdp__qty-ctrl">
                    <button onClick={handleQtyDecrease} disabled={qty <= 1}>−</button>
                    <span>{qty}</span>
                    <button onClick={handleQtyIncrease} disabled={!product?.pre_order_status && selectedStock !== null && qty >= selectedStock}>+</button>
                  </div>
                  {qtyWarning && (
                    <p className="pdp__qty-warning">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {qtyWarning}
                    </p>
                  )}
                  {selectedStock !== null && selectedStock > 0 && !qtyWarning && (
                    <p className="pdp__qty-stock-hint">{selectedStock} item{selectedStock > 1 ? 's' : ''} available</p>
                  )}
                </div>
              )}

              <div className="pdp__actions">
                <button
                  ref={cartBtnRef}
                  className="pdp__btn pdp__btn--cart"
                  onClick={() => { const e = getCartError(); if (!e) { handleAddToCart(); } else { setPopupMode('cart'); } }}
                  disabled={!inStock && !product.pre_order_status}
                >
                  Add to Cart
                </button>
                {product.pre_order_status ? (
                  <button
                    className="pdp__btn pdp__btn--preorder"
                    onClick={() => { const e = getCartError(); if (!e) { handleBuyNow(); } else { setPopupMode('buy'); } }}
                  >
                    Pre Order
                  </button>
                ) : (
                  <button
                    className="pdp__btn pdp__btn--buy"
                    onClick={() => { const e = getCartError(); if (!e) { handleBuyNow(); } else { setPopupMode('buy'); } }}
                    disabled={!inStock}
                  >
                    Buy Now
                  </button>
                )}
              </div>
              {showLiveVisitors && (
                <p className="pdp__live-viewers">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {liveVisitors} People viewing this right now
                </p>
              )}

            </div>

            <div className="pdp__accordion mt-4">

              <div className="pdp__accordion-item">
                <button className={`pdp__accordion-header ${openTab === 'description' ? 'pdp__accordion-header--active' : ''}`} onClick={() => toggleTab('description')}>
                  <span className="pdp__accordion-title">Description</span>
                  <span className="pdp__accordion-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </span>
                </button>
                <div className={`pdp__accordion-content ${openTab === 'description' ? 'pdp__accordion-content--active' : ''}`}>
                  {product.description && (
                    <div className="pdp__desc-text" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}
                </div>
              </div>

              <div className="pdp__accordion-item">
                <button className={`pdp__accordion-header ${openTab === 'additional' ? 'pdp__accordion-header--active' : ''}`} onClick={() => toggleTab('additional')}>
                  <span className="pdp__accordion-title">Additional Information</span>
                  <span className="pdp__accordion-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </span>
                </button>
                <div className={`pdp__accordion-content ${openTab === 'additional' ? 'pdp__accordion-content--active' : ''}`}>
                  <div className="pdp__additional-info">
                    {product.sku && (<div className="pdp__info-row"><span className="pdp__info-label">SKU:</span><span className="pdp__info-value">{product.sku}</span></div>)}
                    {product.brand && (<div className="pdp__info-row"><span className="pdp__info-label">Brand:</span><span className="pdp__info-value">{product.brand}</span></div>)}
                    {product.category && (<div className="pdp__info-row"><span className="pdp__info-label">Category:</span><span className="pdp__info-value">{product.category.name}</span></div>)}
                    {availableColors.length > 0 && (
                      <div className="pdp__info-row pdp__info-row--block">
                        <span className="pdp__info-label">Available Colors:</span>
                        <div className="pdp__info-value pdp__info-chips">
                          {availableColors.map((color) => (
                            <span key={color.name} className="pdp__info-chip">
                              {color.hex && <span className="pdp__color-dot" style={{ backgroundColor: color.hex }} />}
                              {color.name}<span className="pdp__chip-stock">({color.totalStock})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {availableSizes.length > 0 && (
                      <div className="pdp__info-row pdp__info-row--block">
                        <span className="pdp__info-label">Available Sizes:</span>
                        <div className="pdp__info-value pdp__info-chips">
                          {availableSizes.map((size, index) => (
                            <span key={size.name} className="pdp__info-chip">
                              {size.name} <span className="pdp__chip-stock">({size.totalStock})</span>
                              {index < availableSizes.length - 1 && <span className="pdp__chip-comma">,</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {totalStock > 0 && (
                      <div className="pdp__info-row">
                        <span className="pdp__info-label">Total Stock:</span>
                        <span className="pdp__info-value pdp__info-value--stock">{totalStock} items</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </Col>
        </Row>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="pdp__more-section mt-5">
            <h2 className="pdp__more-title">RELATED PRODUCTS</h2>
            <div className="pdp__more-swiper-wrap">
              <button className="pdp__nav-btn pdp__nav-btn--more pdp__nav-btn--more-prev" aria-label="Previous products">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="pdp__nav-btn pdp__nav-btn--more pdp__nav-btn--more-next" aria-label="Next products">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <Swiper
                modules={[Navigation, Autoplay]}
                navigation={{ prevEl: '.pdp__nav-btn--more-prev', nextEl: '.pdp__nav-btn--more-next' }}
                autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                loop={relatedProducts.length > 2}
                spaceBetween={16} slidesPerView={2}
                breakpoints={{ 576: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 992: { slidesPerView: 4 } }}
                className="pdp__more-swiper"
              >
                {relatedProducts.map((rp) => (
                  <SwiperSlide key={rp.id}>
                    <ProductCard product={rp} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}

      </Container>
    </main>
  );
};

export default ProductDetailsPage;