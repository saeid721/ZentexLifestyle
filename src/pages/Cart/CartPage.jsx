import React, { useState, useMemo, useCallback } from 'react';
import { Container, Row, Col, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../app/store';
import { formatPrice, CALCULATE_API, PLACEHOLDER_IMG } from '../../utils';
import Reveal from '../../components/ui/Reveal/Reveal';
import OptimizedImage from '../../components/ui/OptimizedImage';
import './CartPage.scss';


// ── CartPage ──────────────────────────────────────────────────────────────────
const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQty, clearCart, setCouponData } = useCartStore();

  const [toast, setToast] = useState(null);
  const toastAnchorRef = React.useRef(null);
  const toastTimerRef = React.useRef(null);
  const showToast = (message, type) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 1000);
  };

  // Coupon state
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const [apiSubtotal, setApiSubtotal] = useState(null);
  const [apiDiscount, setApiDiscount] = useState(null);
  const [apiGrandTotal, setApiGrandTotal] = useState(null);
  const [apiCouponId, setApiCouponId] = useState(null);

  const localSubtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );

  const buildCartItems = useCallback(
    () => items.map((item) => ({
      id: item.id,
      qty: item.quantity,
      slug: item.slug ?? '',
      image: item.image ?? '',
      old_price: item.originalPrice ?? item.price,
      new_price: item.price,
      product_size: item.variant?.size?.sizeName ?? item.variant?.sizeName ?? null,
      product_size_id: item.variant?.size?.id ?? item.variant?.size_id ?? null,
      product_color: item.variant?.color?.colorName ?? item.variant?.colorName ?? null,
      product_color_id: item.variant?.color?.id ?? item.variant?.color_id ?? null,
      pro_unit: item.pro_unit ?? null,
    })),
    [items],
  );

  const syncCoupon = useCallback(
    (coupon, subtotal, discount, grandTotal, coupon_id) => {
      setCouponData?.({ coupon, subtotal, discount, grandTotal, coupon_id });
    },
    [setCouponData],
  );

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) { setCouponError('Please enter a coupon code'); return; }
    setIsApplying(true);
    setCouponError('');
    try {
      const res = await fetch(CALCULATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ coupon_code: code, cartItems: buildCartItems() }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon ?? code);
        setApiSubtotal(data.subtotal);
        setApiDiscount(data.discount);
        setApiGrandTotal(data.grandTotal);
        setApiCouponId(data.coupon_id ?? null);
        setCouponCode('');
        setShowCoupon(false);
        syncCoupon(data.coupon ?? code, data.subtotal, data.discount, data.grandTotal, data.coupon_id ?? null);
      } else {
        setAppliedCoupon(null);
        setApiSubtotal(null);
        setApiDiscount(null);
        setApiGrandTotal(null);
        setApiCouponId(null);
        setCouponError(data.message ?? 'Invalid or expired coupon code');
        syncCoupon(null, null, null, null, null);
      }
    } catch {
      setCouponError('Something went wrong. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setApiSubtotal(null);
    setApiDiscount(null);
    setApiGrandTotal(null);
    setApiCouponId(null);
    setCouponError('');
    setCouponCode('');
    syncCoupon(null, null, null, null, null);
  };

  const displaySubtotal = appliedCoupon ? (apiSubtotal ?? localSubtotal) : localSubtotal;
  const displayDiscount = appliedCoupon ? (apiDiscount ?? 0) : 0;
  const displayGrandTotal = appliedCoupon ? (apiGrandTotal ?? localSubtotal) : localSubtotal;

  const handleQtyChange = (item, newQty) => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setApiSubtotal(null);
      setApiDiscount(null);
      setApiGrandTotal(null);
      setApiCouponId(null);
      syncCoupon(null, null, null, null, null);
    }
    if (newQty < 1) removeFromCart(item.id);
    else if (newQty <= 99) updateQty(item.id, newQty, (msg) => showToast(msg, 'error'));
  };

  // ── Checkout: go directly to checkout page (no modal)
  const handleCheckout = (e) => {
    e?.preventDefault?.();
    navigate('/checkout');
  };

  // ── Empty cart
  if (items.length === 0) {
    return (
      <main className="cart-page">
        <Container className="container-1500 py-5 text-center">
          <div className="cart-page__empty">
            <p className="cart-page__empty-icon" aria-hidden="true">🛒</p>
            <h4>Your cart is empty</h4>
            <p className="text-muted mb-4">Looks like you haven't added anything yet.</p>
            <Link to="/" className="cart-page__continue-btn">← Continue Shopping</Link>
          </div>
        </Container>
      </main>
    );
  }

  // Simple inline toast — add just above the main return
  const ToastEl = toast && (() => {
    const anchor = toastAnchorRef.current;
    const rect = anchor ? anchor.getBoundingClientRect() : null;
    const style = rect
      ? {
        position: 'fixed',
        top: `${rect.top - 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -100%)',
      }
      : {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    return (
      <div style={{
        ...style,
        background: toast.type === 'error' ? '#ff0000' : '#198754',
        color: '#fff', padding: '8px 16px', borderRadius: '8px',
        zIndex: 9999, fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>
        {toast.message}
      </div>
    );
  })();

  return (
    <>
      {ToastEl}
      <main className="cart-page">
        <div className="hero-section">
          <Container className="container-1500">
            <Reveal as="h1" type="fade-up" className="hero-section__title">Your Cart</Reveal>
            <nav aria-label="breadcrumb">
              <ol className="hero-section__breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><span className="hero-section__sep">&gt;</span><span>Your Cart</span> <span className="text-muted small">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} item(s)
                </span></li>

              </ol>
            </nav>
          </Container>
        </div>

        <Container className="container-1500  mt-4">
          <Row className="g-4">
            {/* ── Left: Items ── */}
            <Col xs={12} lg={8}>
              <div className="cart-page__table-wrap">
                <Table responsive className="cart-page__table" role="table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col" className="text-end">Price</th>
                      <th scope="col" className="text-center">Qty</th>
                      <th scope="col" className="text-end">Total</th>
                      <th scope="col" className="text-center" aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <tr key={item.id}>
                          {/* Desktop */}
                          <td className="desktop-view">
                            <div className="d-flex align-items-center gap-3">
                              <OptimizedImage
                                src={item.image || PLACEHOLDER_IMG}
                                alt={item.name}
                                className="cart-page__item-img"
                                wrapperStyle={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '6px' }}
                              />
                              <div className="min-w-0">
                                <p className="cart-page__item-name mb-0 text-truncate" title={item.name}>{item.name}</p>
                                {item.variant && (
                                  <p className="cart-page__item-variant mb-0">
                                    {item.variant?.color?.colorName && `Color: ${item.variant.color.colorName}`}
                                    {item.variant?.color?.colorName && item.variant?.size?.sizeName && ' / '}
                                    {item.variant?.size?.sizeName && `Size: ${item.variant.size.sizeName}`}
                                  </p>
                                )}
                                {item.sku && <p className="cart-page__item-sku mb-0">SKU: {item.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="align-middle text-end desktop-view">
                            <span className="cart-page__price">{formatPrice(item.price)}</span>
                          </td>
                          <td className="align-middle text-center desktop-view">
                            <div className="cart-page__qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                              <button onClick={() => handleQtyChange(item, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                              <span aria-live="polite">{item.quantity}</span>
                              <button onClick={(e) => { toastAnchorRef.current = e.currentTarget; handleQtyChange(item, item.quantity + 1); }} disabled={item.quantity >= 99}>+</button>
                            </div>
                          </td>
                          <td className="align-middle text-end desktop-view">
                            <strong className="cart-page__price">{formatPrice(itemTotal)}</strong>
                          </td>
                          <td className="align-middle text-center desktop-view">
                            <button className="cart-page__remove-btn" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>✕</button>
                          </td>

                          {/* Mobile */}
                          <td className="mobile-view" style={{ position: 'relative' }}>
                            <div className="mobile-product-card">
                              <button className="mobile-remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                              <div className="mobile-product-header">
                                <OptimizedImage
                                  src={item.image || PLACEHOLDER_IMG}
                                  alt={item.name}
                                  className="mobile-product-img"
                                  wrapperStyle={{ width: '70px', height: '70px', flexShrink: 0, borderRadius: '6px' }}
                                />
                                <div className="mobile-product-details">
                                  <p className="mobile-product-name">{item.name}</p>
                                  {item.variant && (
                                    <p className="mobile-product-variant">
                                      {item.variant?.color?.colorName && `Color: ${item.variant.color.colorName}`}
                                      {item.variant?.color?.colorName && item.variant?.size?.sizeName && ' / '}
                                      {item.variant?.size?.sizeName && `Size: ${item.variant.size.sizeName}`}
                                    </p>
                                  )}
                                  {item.sku && <p className="mobile-product-sku">SKU: {item.sku}</p>}
                                  <div className="mobile-product-unit-price">
                                    <span className="price-label">Price:</span>
                                    <strong>{formatPrice(item.price)}</strong>
                                  </div>
                                </div>
                              </div>
                              <div className="mobile-product-footer">
                                <div className="mobile-qty-ctrl" role="group">
                                  <button onClick={() => handleQtyChange(item, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                                  <span>{item.quantity}</span>
                                  <button onClick={(e) => { toastAnchorRef.current = e.currentTarget; handleQtyChange(item, item.quantity + 1); }} disabled={item.quantity >= 99}>+</button>
                                </div>
                                <div className="mobile-item-total">
                                  <span>Total: </span><strong>{formatPrice(itemTotal)}</strong>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              <div className="cart-page__actions">
                <Link to="/" className="cart-page__continue-btn">← Continue Shopping</Link>
                <button className="cart-page__clear-btn" onClick={clearCart} type="button">Clear Cart</button>
              </div>
            </Col>

            {/* ── Right: Summary ── */}
            <Col xs={12} lg={4}>
              <div className="cart-page__summary">
                <div className="coupon-box" aria-labelledby="coupon-heading">
                  <div className="coupon-box__header" id="coupon-heading">
                    <span>Have a coupon?</span>{' '}
                    <button type="button" className="coupon-toggle"
                      onClick={() => setShowCoupon((p) => !p)} aria-expanded={showCoupon}>
                      {showCoupon ? 'Hide Code' : 'Click Here To Enter Your Code'}
                    </button>
                  </div>

                  {(showCoupon || appliedCoupon) && (
                    <div id="coupon-form" className="coupon-box__body">
                      {appliedCoupon ? (
                        <>
                          <Form.Control className="coupon-input" value={`${appliedCoupon} ✓`} readOnly disabled />
                          <button type="button" className="coupon-btn" onClick={removeCoupon} style={{ background: '#6c757d' }}>Remove</button>
                        </>
                      ) : (
                        <>
                          <Form.Control
                            className="coupon-input"
                            placeholder="Enter code (e.g. Shihab20)"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value); if (couponError) setCouponError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !isApplying) { e.preventDefault(); applyCoupon(); } }}
                            isInvalid={!!couponError}
                            disabled={isApplying}
                          />
                          <button type="button" className="coupon-btn" onClick={applyCoupon}
                            disabled={isApplying || !couponCode.trim()}>
                            {isApplying ? 'Applying...' : 'Apply'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {couponError && <p className="coupon-error mb-0" role="alert">⚠️ {couponError}</p>}
                  {appliedCoupon && <p className="coupon-success mb-0">✅ {appliedCoupon} applied! Saved {formatPrice(displayDiscount)}</p>}
                </div>

                <hr className="my-3" />

                <h5 className="cart-page__summary-title">Order Summary</h5>

                <div className="cart-page__summary-row">
                  <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                  <span>{formatPrice(displaySubtotal)}</span>
                </div>

                {displayDiscount > 0 && (
                  <div className="cart-page__summary-row text-success">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-{formatPrice(displayDiscount)}</span>
                  </div>
                )}

                <div className="cart-page__summary-row cart-page__summary-row--total">
                  <span>Total (BDT)</span>
                  <span className="fs-5">{formatPrice(displayGrandTotal)}</span>
                </div>

                <button className="cart-page__checkout-btn" onClick={handleCheckout} type="button">
                  Proceed to Checkout →
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
};

export default CartPage;