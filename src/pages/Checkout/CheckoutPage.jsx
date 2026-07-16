import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Spinner, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../app/store';
import { formatPrice, PLACEHOLDER_IMG, API_BASE_URL } from '../../utils';
import { setAuth, getAuth } from '../../utils/auth';
import { Eye, EyeOff, Phone, Mail, MapPin } from 'lucide-react';
import Reveal from '../../components/ui/Reveal/Reveal';
import axios from 'axios';
import './CheckoutPage.scss';

// ── API endpoints ─────────────────────────────────────────────────────────────
const CHECKOUT_API = `${API_BASE_URL}/checkout`;
const UPDATE_SHIP_API = `${API_BASE_URL}/update-shipping`;
const ORDER_SAVE_API = `${API_BASE_URL}/order-save`;
const PROFILE_API = `${API_BASE_URL}/customer/profile`;
const ADDRESS_API = `${API_BASE_URL}/address`;
// CHANGE 1: GET_DISTRICT_API — fetches districts by division_id
// GET /api/get-district?id=<division_id>  →  { success, data: { "1": "Dhaka", ... } }
const GET_DISTRICT_API = `${API_BASE_URL}/get-district`;

// ── Payment methods ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: 'Cash On Delivery', label: 'Cash on Delivery', icon: '💵' },
  { value: 'bKash', label: 'bKash', icon: '📱' },
  // { value: 'Nagad',            label: 'Nagad',            icon: '📲' },
  // { value: 'Card',             label: 'Card',             icon: '💳' },
];

// ── Eye icons ─────────────────────────────────────────────────────────────────
const EyeOpenIcon = () => <Eye size={16} strokeWidth={1.5} />;
const EyeClosedIcon = () => <EyeOff size={16} strokeWidth={1.5} />;

// ── Blank customer form ───────────────────────────────────────────────────────
const BLANK_CUSTOMER = { name: '', phone: '', customerAddress: '' };

// ══════════════════════════════════════════════════════════════════════════════
//  CheckoutPage
// ══════════════════════════════════════════════════════════════════════════════
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, clearCart, couponData, clearCouponData } = useCartStore();

  // ── Auth state ────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  // ── Login modal ───────────────────────────────────────────────────────────
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // ── Coupon / pricing ──────────────────────────────────────────────────────
  const cartSubtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const couponSubtotal = couponData?.subtotal ?? cartSubtotal;
  const couponDiscount = couponData?.discount ?? 0;
  const appliedCoupon = couponData?.coupon ?? null;
  const couponId = couponData?.coupon_id ?? null;

  // ── Shipping ──────────────────────────────────────────────────────────────
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState('');
  const [shippingAmount, setShippingAmount] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [bkashEnabled, setBkashEnabled] = useState(false);
  const [bkashGatewayId, setBkashGatewayId] = useState(null);

  // ── bKash return banner (after redirect back from gateway) ────────────────
  const [paymentStatusMsg, setPaymentStatusMsg] = useState(null); // { type: 'success' | 'error', text }

  // ── Saved addresses ───────────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // CHANGE 2: Renamed area→district, added division states
  // OLD: districts[], areas[], selectedDistrict, selectedAreaId
  // NEW: divisions[], districts[], selectedDivisionId, selectedDivisionName, selectedDistrict
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDivisionName, setSelectedDivisionName] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // ── Customer info ─────────────────────────────────────────────────────────
  const [customerForm, setCustomerForm] = useState(BLANK_CUSTOMER);
  const [sameAsCustomer, setSameAsCustomer] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeToNews, setSubscribeToNews] = useState(false);

  // ── Other ─────────────────────────────────────────────────────────────────
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('Cash On Delivery');
  const [agreed, setAgreed] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isPlacing, setIsPlacing] = useState(false);

  const grandTotal = couponSubtotal - couponDiscount + shippingAmount;

  // ── Resolve active token ──────────────────────────────────────────────────
  const getActiveToken = useCallback(() => {
    if (sessionToken) return sessionToken;
    const { token } = getAuth();
    return token ?? null;
  }, [sessionToken]);

  // ── Fill customer form from profile API ──────────────────────────────────
  // NOTE: customerAddress is NOT set here — set by fetchAddressData from default_address
  const fillFromProfile = useCallback(async (token) => {
    if (!token) return;
    try {
      const res = await fetch(PROFILE_API, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setCustomerForm((prev) => ({
          ...prev,
          name: p.name || prev.name,
          phone: p.phone || prev.phone,
        }));
      }
    } catch (err) {
      console.error('Profile API error:', err);
    }
  }, []);

  // CHANGE 3: fetchAddressData — now loads divisions (not districts+areas).
  // Also fills Customer Address from default_address as "address, district, division"
  // for logged-in. Works for both guest (divisions only) and logged-in.
  const fetchAddressData = useCallback(async (token) => {
    setLoadingAddress(true);
    try {
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(ADDRESS_API, { headers });
      const data = await res.json();
      if (data.status && data.data) {
        const { divisions: div, default_address } = data.data;

        // Always set divisions (guest + logged-in)
        if (Array.isArray(div)) setDivisions(div);

        // Logged-in only: fill Customer Address from default_address
        // Format: "address, district, division"
        if (token && default_address) {
          const parts = [
            default_address.address,
            default_address.district,
            default_address.division,
          ].filter(Boolean);
          if (parts.length > 0) {
            setCustomerForm((prev) => ({
              ...prev,
              customerAddress: parts.join(', '),
            }));
          }
        }
      }
    } catch (err) {
      console.error('Address API error:', err);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  // CHANGE 4: fetchDistrictsByDivision — replaces old fetchAreasByDistrict.
  // Called when Division dropdown changes (guest + logged-in).
  // GET /api/get-district?id=<division_id>
  // Response: { success, data: { "1": "Dhaka", "2": "Faridpur", ... } }
  const fetchDistrictsByDivision = useCallback(async (divisionId) => {
    if (!divisionId) { setDistricts([]); setSelectedDistrict(''); return; }
    setLoadingDistricts(true);
    setSelectedDistrict('');
    try {
      const res = await fetch(`${GET_DISTRICT_API}?id=${encodeURIComponent(divisionId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        // Convert { "1": "Dhaka", "2": "Faridpur" } → [{ id: "1", name: "Dhaka" }, ...]
        const list = Object.entries(data.data).map(([id, name]) => ({
          id: String(id),
          name: String(name),
        }));
        setDistricts(list);
      } else {
        setDistricts([]);
      }
    } catch (err) {
      console.error('Get districts by division error:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  // ── Fetch checkout API — shipping options + saved addresses ───────────────
  const fetchCheckoutData = useCallback(async (token) => {
    setFetchingOptions(true);
    try {
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(CHECKOUT_API, { headers });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.shippingcharge)) setShippingOptions(data.shippingcharge);
        if (token && Array.isArray(data.allAddresses)) setSavedAddresses(data.allAddresses);
        setBkashEnabled(!!(data.bkashGetWay && data.bkashGetWay.id));
        setBkashGatewayId(data.bkashGetWay?.id ?? null);
      }
    } catch (err) {
      console.error('Checkout API error:', err);
    } finally {
      setFetchingOptions(false);
    }
  }, []);

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const { token, isAuthenticated } = getAuth();
    if (isAuthenticated && token) {
      setIsLoggedIn(true);
      setSessionToken(token);
      fillFromProfile(token);
      fetchCheckoutData(token);
      fetchAddressData(token);
    } else {
      fetchCheckoutData(null);
      fetchAddressData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync delivery address when "same as customer" checked ────────────────
  useEffect(() => {
    if (sameAsCustomer) {
      setDeliveryAddress(customerForm.customerAddress);
      setFormErrors((p) => ({ ...p, deliveryAddress: '' }));
    }
  }, [sameAsCustomer, customerForm.customerAddress]);

  // ✅ NEW — if bKash becomes unavailable, fall back to Cash on Delivery
  useEffect(() => {
    if (!bkashEnabled && payment === 'bKash') {
      setPayment('Cash On Delivery');
    }
  }, [bkashEnabled, payment]);



  // ── Shipping select ───────────────────────────────────────────────────────
  const handleShippingSelect = useCallback(async (shipId) => {
    setSelectedShipId(shipId);
    if (!shipId) { setShippingAmount(0); return; }
    setLoadingShipping(true);
    try {
      const token = getActiveToken();
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${UPDATE_SHIP_API}?area_id=${shipId}`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) setShippingAmount(Number(data.shipping_amount ?? 0));
    } catch (err) {
      console.error('Shipping amount error:', err);
    } finally {
      setLoadingShipping(false);
    }
  }, [getActiveToken]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((f) => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  // ── Handle saved address selection ───────────────────────────────────────
  const handleSavedAddressSelect = (addr) => {
    setSelectedAddressId(String(addr.id));
    setDeliveryAddress(addr.address);
    setSameAsCustomer(false);
    setShowAddressDropdown(false);
    if (formErrors.deliveryAddress) setFormErrors((p) => ({ ...p, deliveryAddress: '' }));
    const matchingShip = shippingOptions.find((o) => String(o.id) === String(addr.area_id));
    if (matchingShip) handleShippingSelect(String(matchingShip.id));
  };

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    if (!loginData.phone.trim()) { setLoginError('Please enter your phone number.'); return; }
    if (!loginData.password.trim()) { setLoginError('Please enter your password.'); return; }

    setLoginLoading(true);
    try {
      const API = API_BASE_URL;
      const formData = new FormData();
      formData.append('phone', loginData.phone.trim());
      formData.append('password', loginData.password);

      const res = await axios.post(`${API}/customer/login`, formData, {
        headers: { Accept: 'application/json' },
      });

      if (res.data.success) {
        const { token: newToken, data } = res.data;
        const userData = {
          id: data.id, name: data.name, phone: data.phone,
          email: data.email, address: data.address,
          district: data.district, area: data.area, slug: data.slug,
        };

        setAuth(newToken, userData, rememberMe);
        useCartStore.setState({ token: newToken, auth: { token: newToken, ...userData }, user: userData });
        setSessionToken(newToken);
        setIsLoggedIn(true);
        setLoginSuccess('Login successful!');

        // Reset division/district on login
        setSelectedDivisionId('');
        setSelectedDivisionName('');
        setSelectedDistrict('');
        setDistricts([]);

        setTimeout(() => { setShowLoginModal(false); setLoginSuccess(''); }, 800);

        await fillFromProfile(newToken);
        await fetchCheckoutData(newToken);
        await fetchAddressData(newToken);

      } else {
        setLoginError(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422) {
        setLoginError('Invalid phone number or password.');
      } else if (err.response?.data?.message) {
        setLoginError(err.response.data.message);
      } else {
        setLoginError('Something went wrong. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const openLoginModal = () => {
    setLoginData({ phone: '', password: '' });
    setShowPass(false);
    setRememberMe(false);
    setLoginError('');
    setLoginSuccess('');
    setShowLoginModal(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!customerForm.name.trim()) errors.name = 'Full name is required';
    if (!customerForm.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^01[3-9]\d{8}$/.test(customerForm.phone.trim()))
      errors.phone = 'Enter a valid Bangladeshi phone number';

    if (isLoggedIn && !customerForm.customerAddress.trim()) {
      errors.customerAddress = 'Customer address is required';
    }

    if (subscribeEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscribeEmail.trim())) {
      errors.subscribeEmail = 'Enter a valid email address';
    }

    if (!sameAsCustomer && !deliveryAddress.trim()) errors.deliveryAddress = 'Delivery address is required';
    if (!selectedShipId) errors.shipping = 'Please select a delivery area';
    if (!agreed) errors.agreed = 'You must agree to the terms and conditions';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─────────────────────────────────────────────
  // Place Order
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isPlacing) return;

    setIsPlacing(true);

    const finalDeliveryAddress = sameAsCustomer
      ? customerForm.customerAddress
      : deliveryAddress;

    const token = isLoggedIn ? getActiveToken() : null;

    try {
      // CHANGE 5: payload now sends "division" (name string) instead of "area" (id).
      // "area" field removed, "division" field added.
      const payload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: finalDeliveryAddress.trim(),

        shipping_area: Number(selectedShipId),
        ...(selectedDivisionName ? { division: selectedDivisionName } : {}),
        ...(selectedDistrict ? { district: selectedDistrict } : {}),
        payment_method: payment === 'bKash' ? 'bkash' : payment,
        payment_method_id: payment === 'bKash' ? bkashGatewayId : null,

        subtotal: Number(couponSubtotal),
        discount: Number(couponDiscount),
        shippingfee: Number(shippingAmount),

        ...(couponId ? { coupon_id: couponId } : {}),
        ...(appliedCoupon ? { coupon_code: appliedCoupon } : {}),
        ...(subscribeToNews && subscribeEmail.trim()
          ? { subscribe_email: subscribeEmail.trim() } : {}),
        note: note.trim(),

        cartItems: items.map((item) => ({
          slug: item.slug ?? item.name,
          image: item.image ?? '',
          purchase_price: Number(item.purchase_price ?? item.price ?? 0),

          old_price: Number(item.originalPrice ?? item.price ?? 0),
          new_price: Number(item.price ?? 0),

          product_discount: Number(item.product_discount ?? 0),

          product_size:
            item.variant?.size?.sizeName ??
            item.variant?.sizeName ??
            null,

          product_size_id:
            item.variant?.size?.id ??
            item.variant?.size_id ??
            null,

          product_color:
            item.variant?.color?.colorName ??
            item.variant?.colorName ??
            null,

          product_color_id:
            item.variant?.color?.id ??
            item.variant?.color_id ??
            null,

          pro_unit: item.pro_unit ?? null,
          product_id: Number(item.id),
          qty: Number(item.quantity),

          item_discount:
            couponDiscount > 0 && couponSubtotal > 0
              ? Math.round(
                ((item.price * item.quantity) / couponSubtotal) *
                couponDiscount
              )
              : 0,

          ...(appliedCoupon ? { applied_coupon: appliedCoupon } : {}),
        })),
      };

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(ORDER_SAVE_API, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from server.");
      }

      console.log("Order-save response:", JSON.stringify(data)); // debug — remove after fix

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      const isSuccess =
        data.status === true ||
        data.status === "true" ||
        data.status === 1 ||
        !!(data.data && data.data.id);

      if (isSuccess) {
        clearCart();
        clearCouponData?.();

        const invoiceOrderData = {
          ...data.data,
          _isLoggedIn: isLoggedIn,
          _customerName: customerForm.name.trim(),
          _customerPhone: customerForm.phone.trim(),
          _customerAddress: isLoggedIn ? customerForm.customerAddress.trim() : null,
          _deliveryAddress: finalDeliveryAddress.trim(),
          _selectedDivision: selectedDivisionName || null,
          _selectedDistrict: selectedDistrict || null,
          _paymentMethod: payment,
          _couponCode: appliedCoupon ?? "",
          _couponDiscount: Number(couponDiscount),
          _subtotal: Number(couponSubtotal),
          _shippingAmount: Number(shippingAmount),
        };

        navigate(`/invoice/${data.data.id}`, {
          state: { orderData: invoiceOrderData, token },
        });
      } else {
        console.error("Order failed response:", JSON.stringify(data));
        let msg = 'Order placement failed. Please try again.';
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          msg = Object.values(data.errors).flat().join(', ');
        } else if (data.message) {
          msg = data.message;
        } else if (data.error) {
          msg = data.error;
        }
        alert(msg);
      }
    } catch (error) {
      console.error("Order Save Error:", error?.message || error);
      alert(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };


  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <Container className="container-1500 py-5 text-center">
          <div className="checkout-page__empty">
            <p style={{ fontSize: '3rem' }}>🛒</p>
            <h4>Your cart is empty</h4>
            <Link to="/" className="checkout-page__back-btn mt-3 d-inline-block">← Continue Shopping</Link>
          </div>
        </Container>
      </main>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <main className="checkout-page">
      {paymentStatusMsg && (
        <div className={`checkout-page__payment-banner checkout-page__payment-banner--${paymentStatusMsg.type}`}>
          <Container className="container-1500">
            {paymentStatusMsg.type === 'success' ? '✅' : '⚠️'} {paymentStatusMsg.text}
          </Container>
        </div>
      )}
      
      <div className="hero-section">
        <Container className="container-1500">
          <Reveal as="h1" type="fade-up" className="hero-section__title">Checkout</Reveal>
          <nav aria-label="breadcrumb">
            <ol className="hero-section__breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><span className="hero-section__sep">&gt;</span><span>Checkout</span></li>
              
            </ol>
          </nav>
        </Container>
      </div>
      <Container className="container-1500 mt-4">

        <Row className="g-4">

          {/* ════ LEFT: Delivery Form ════ */}
          <Col xs={12} lg={7}>
            <div className="checkout-page__form-card">

              {/* Contact header + Login button */}
              <Row className="g-3 align-items-center">
                <Col xs={6}>
                  <h5 className="checkout-page__form-title mb-3 mt-4">Contact</h5>
                </Col>
                <Col xs={6} className="text-end">
                  {isLoggedIn ? (
                    <span className="checkout-page__logged-badge">✅ Logged in</span>
                  ) : (
                    <button type="button" className="checkout-page__login-btn" onClick={openLoginModal}>
                      Login
                    </button>
                  )}
                </Col>
              </Row>

              {/* Subscribe email */}
              <Form noValidate autoComplete="off">
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Control
                      name="subscribe_email"
                      type="email"
                      placeholder="Please enter a valid email address."
                      className="checkout-page__input"
                      value={subscribeEmail}
                      onChange={(e) => {
                        setSubscribeEmail(e.target.value);
                        if (formErrors.subscribeEmail) setFormErrors((p) => ({ ...p, subscribeEmail: '' }));
                      }}
                      disabled={isPlacing}
                      autoComplete="email"
                      isInvalid={!!formErrors.subscribeEmail}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.subscribeEmail}
                    </Form.Control.Feedback>
                  </Col>
                  <Col xs={12}>
                    <div className="checkout-page__delivery-address-header">
                      <label className="checkout-page__same-check-label">
                        <input
                          type="checkbox"
                          checked={subscribeToNews}
                          onChange={(e) => setSubscribeToNews(e.target.checked)}
                          disabled={isPlacing}
                        />
                        <span>Email me with news and offers</span>
                      </label>
                    </div>
                  </Col>
                </Row>
              </Form>

              <h5 className="checkout-page__form-title mb-3 mt-4">Delivery Information</h5>

              <Form onSubmit={handleSubmit} noValidate autoComplete="off">
                <Row className="g-3">

                  {/* Name */}
                  <Col sm={6}>
                    <Form.Control
                      name="name"
                      value={customerForm.name}
                      onChange={handleCustomerChange}
                      placeholder="Full Name *"
                      required
                      isInvalid={!!formErrors.name}
                      disabled={isPlacing}
                      className="checkout-page__input"
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                  </Col>

                  {/* Phone */}
                  <Col sm={6}>
                    <Form.Control
                      name="phone"
                      value={customerForm.phone}
                      onChange={(e) => {
                        handleCustomerChange(e);
                        if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder="Phone Number * (e.g. 01410200230)"
                      type="tel"
                      required
                      isInvalid={!!formErrors.phone}
                      disabled={isPlacing}
                      className="checkout-page__input"
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                  </Col>

                  {/* Customer Address — only shown when logged in */}
                  {isLoggedIn && (
                    <Col xs={12}>
                      <Form.Label className="checkout-page__field-label">
                        Customer Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        name="customerAddress"
                        value={customerForm.customerAddress}
                        onChange={handleCustomerChange}
                        placeholder="Your home / permanent address *"
                        required
                        isInvalid={!!formErrors.customerAddress}
                        disabled={isPlacing}
                        className="checkout-page__input"
                        autoComplete="off"
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.customerAddress}</Form.Control.Feedback>
                    </Col>
                  )}

                  {/* Delivery Address */}
                  <Col xs={12}>
                    <div className="checkout-page__delivery-address-header">
                      <Form.Label className="checkout-page__field-label mb-0">
                        Delivery Address <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {/* Saved addresses dropdown — only for logged-in */}
                        {isLoggedIn && savedAddresses.length > 0 && (
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="checkout-page__office-toggle-btn"
                              style={{ padding: '4px 12px', fontSize: '0.8rem', border: '1.5px solid #c8102e', color: '#c8102e', background: '#fff5f5', borderRadius: '6px', width: 'auto' }}
                              onClick={() => setShowAddressDropdown((v) => !v)}
                              disabled={isPlacing || sameAsCustomer}
                            >
                              📍 Saved Addresses <span style={{ marginLeft: '2px', fontSize: '0.7em' }}>▼</span>
                            </button>
                            {showAddressDropdown && (
                              <div className="checkout-page__address-dropdown">
                                {savedAddresses.map((addr) => (
                                  <button
                                    key={addr.id}
                                    type="button"
                                    className={`checkout-page__address-option${String(selectedAddressId) === String(addr.id) ? ' checkout-page__address-option--active' : ''}`}
                                    onClick={() => handleSavedAddressSelect(addr)}
                                  >
                                    <span className="checkout-page__address-option-title">{addr.address_title}</span>
                                    <span className="checkout-page__address-option-text">{addr.address} — {addr.district}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Same as Customer Address — only for logged-in */}
                        {isLoggedIn && (
                          <label className="checkout-page__same-check-label">
                            <input
                              type="checkbox"
                              checked={sameAsCustomer}
                              onChange={(e) => {
                                setSameAsCustomer(e.target.checked);
                                if (e.target.checked) {
                                  setSelectedAddressId('');
                                  setFormErrors((p) => ({ ...p, deliveryAddress: '' }));
                                }
                              }}
                              disabled={isPlacing}
                            />
                            <span>Same as Customer Address</span>
                          </label>
                        )}
                      </div>
                    </div>
                    <Form.Control
                      value={sameAsCustomer ? customerForm.customerAddress : deliveryAddress}
                      onChange={(e) => {
                        if (!sameAsCustomer) {
                          setDeliveryAddress(e.target.value);
                          setSelectedAddressId('');
                          if (formErrors.deliveryAddress) setFormErrors((p) => ({ ...p, deliveryAddress: '' }));
                        }
                      }}
                      placeholder="Delivery address (where to ship) *"
                      disabled={(isLoggedIn && sameAsCustomer) || isPlacing}
                      isInvalid={!!formErrors.deliveryAddress}
                      className={`checkout-page__input${(isLoggedIn && sameAsCustomer) ? ' checkout-page__input--disabled' : ''}`}
                      autoComplete="off"
                    />
                    {formErrors.deliveryAddress && (
                      <div className="invalid-feedback d-block">{formErrors.deliveryAddress}</div>
                    )}
                  </Col>

                  {/* CHANGE 7: Division dropdown — replaces old "District" dropdown.
                      Visible always (guest + logged-in), hidden when sameAsCustomer.
                      On change: calls fetchDistrictsByDivision(division.id) */}
                  {!sameAsCustomer && (
                    <Col sm={6}>
                      <Form.Label className="checkout-page__field-label">Division</Form.Label>
                      {loadingAddress ? (
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ padding: '10px 0' }}>
                          <Spinner size="sm" /> Loading...
                        </div>
                      ) : (
                        <Form.Select
                          value={selectedDivisionId}
                          onChange={(e) => {
                            const divId = e.target.value;
                            const divObj = divisions.find((d) => String(d.id) === String(divId));
                            const divName = divObj?.name ?? '';
                            setSelectedDivisionId(divId);
                            setSelectedDivisionName(divName);
                            // Fetch districts for this division
                            fetchDistrictsByDivision(divId);
                          }}
                          disabled={isPlacing}
                          className="checkout-page__input"
                        >
                          <option value="">Select Division</option>
                          {divisions.map((d) => (
                            <option key={d.id} value={String(d.id)}>{d.name}</option>
                          ))}
                        </Form.Select>
                      )}
                    </Col>
                  )}

                  {/* CHANGE 8: District dropdown — loads after Division is selected.
                      Replaces old "Area" dropdown. Hidden when sameAsCustomer. */}
                  {!sameAsCustomer && (
                    <Col sm={6}>
                      <Form.Label className="checkout-page__field-label">District</Form.Label>
                      {loadingDistricts ? (
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ padding: '10px 0' }}>
                          <Spinner size="sm" /> Loading...
                        </div>
                      ) : (
                        <Form.Select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          disabled={isPlacing || !selectedDivisionId}
                          className="checkout-page__input"
                        >
                          <option value="">
                            {selectedDivisionId ? 'Select District' : 'Select Division first'}
                          </option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </Form.Select>
                      )}
                    </Col>
                  )}

                  {/* Delivery Area (Shipping fee selector) */}
                  <Col xs={12}>
                    <Form.Label className="checkout-page__field-label">
                      Delivery Area <span className="text-danger">*</span>
                    </Form.Label>
                    {fetchingOptions ? (
                      <div className="d-flex align-items-center gap-2 text-muted">
                        <Spinner size="sm" /> Loading delivery options...
                      </div>
                    ) : (
                      <Form.Select
                        value={selectedShipId}
                        onChange={(e) => handleShippingSelect(e.target.value)}
                        required
                        isInvalid={!!formErrors.shipping}
                        disabled={isPlacing}
                        className="checkout-page__input"
                      >
                        <option value="">Select Delivery Area *</option>
                        {shippingOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </Form.Select>
                    )}
                    {formErrors.shipping && (
                      <div className="invalid-feedback d-block">{formErrors.shipping}</div>
                    )}
                  </Col>

                  {/* Order Note */}
                  <Col xs={12}>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Order Note (optional)"
                      disabled={isPlacing}
                      className="checkout-page__input"
                      autoComplete="off"
                    />
                  </Col>
                </Row>

                {/* Payment Method */}
                {(() => {
                  const visiblePaymentMethods = PAYMENT_METHODS.filter(
                    (m) => m.value !== 'bKash' || bkashEnabled
                  );
                  return (
                    <>
                      <h5 className="checkout-page__section-title mt-4">Payment Method</h5>
                      <div className="payment-methods">
                        {visiblePaymentMethods.map((m) => (
                          <label key={m.value} className={`payment-card ${payment === m.value ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="payment"
                              value={m.value}
                              checked={payment === m.value}
                              onChange={(e) => setPayment(e.target.value)}
                              disabled={isPlacing}
                            />
                            <div className="payment-card__content">
                              <span className="payment-card__icon">{m.icon}</span>
                              <span className="payment-card__label">{m.label}</span>
                            </div>
                            <span className="payment-card__check">{payment === m.value && '✔'}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  );
                })()}

                {/* Terms */}
                <Form.Group className="checkout-page__agreement mt-3">
                  <Form.Check
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (formErrors.agreed) setFormErrors((p) => ({ ...p, agreed: '' }));
                    }}
                    required
                    isInvalid={!!formErrors.agreed}
                    disabled={isPlacing}
                    label={
                      <>
                        I have read and agree to the{' '}
                        <Link to="/page/terms-and-conditions" target="_blank" className="checkout-page__policy-link">Terms &amp; Conditions</Link>,{' '}
                        <Link to="/page/refund-and-return-policy" target="_blank" className="checkout-page__policy-link">Refund Policy</Link> and{' '}
                        <Link to="/page/privacy-policy" target="_blank" className="checkout-page__policy-link">Privacy Policy</Link>.
                      </>
                    }
                  />
                  {formErrors.agreed && (
                    <div className="invalid-feedback d-block">{formErrors.agreed}</div>
                  )}
                </Form.Group>

                {/* Submit */}
                <button
                  className="checkout-page__submit-btn mt-4"
                  type="submit"
                  disabled={isPlacing || !agreed || !selectedShipId || !!paymentStatusMsg}
                >
                  {isPlacing
                    ? <><Spinner size="sm" className="me-2" />Placing Order...</>
                    : 'Place Order →'
                  }
                </button>
              </Form>
            </div>
          </Col>

          {/* ════ RIGHT: Order Summary ════ */}
          <Col xs={12} lg={5}>
            <div className="checkout-page__summary">
              <h5>Order Summary</h5>
              <div className="checkout-page__items-list">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variant?.id ?? 'nv'}`} className="checkout-page__summary-item">
                    <div className="d-flex align-items-center gap-2 flex-1 min-w-0">
                      <img
                        src={item.image || PLACEHOLDER_IMG}
                        alt={item.name}
                        className="checkout-page__item-thumb"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                      />
                      <div className="min-w-0">
                        <p className="checkout-page__item-name mb-0 text-truncate">{item.name}</p>
                        {item.variant && (
                          <p className="checkout-page__item-variant mb-0">
                            {[item.variant?.color?.colorName, item.variant?.size?.sizeName].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        <p className="checkout-page__item-qty mb-0">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="checkout-page__item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="checkout-page__price-row">
                <span>Subtotal</span><span>{formatPrice(couponSubtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="checkout-page__price-row invoice-doc__total-row--discount">
                  <span>Coupon {appliedCoupon ? `(${appliedCoupon})` : ''}</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="checkout-page__price-row">
                <span>Delivery Charge</span>
                <span>
                  {loadingShipping
                    ? <Spinner size="sm" />
                    : selectedShipId
                      ? formatPrice(shippingAmount)
                      : <span className="text-muted" style={{ fontSize: '0.82rem' }}>—</span>
                  }
                </span>
              </div>
              <hr />
              <div className="checkout-page__price-row checkout-page__price-row--grand">
                <span>Total</span><span>{formatPrice(grandTotal)}</span>
              </div>
              {!selectedShipId && (
                <p className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                  * Delivery Charge will be added after area selection
                </p>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      {/* ── Login Modal ── */}
      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        backdrop="static"
        className="login-popup-modal"
      >
        <Modal.Header closeButton className="login-popup-modal__header">
          <Modal.Title className="login-popup-modal__title">Login to My Account</Modal.Title>
        </Modal.Header>
        <Modal.Body className="login-popup-modal__body">
          {loginError && (
            <div className="login-popup-modal__alert login-popup-modal__alert--error" role="alert">
              {loginError}
            </div>
          )}
          {loginSuccess && (
            <div className="login-popup-modal__alert login-popup-modal__alert--success" role="alert">
              {loginSuccess}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} noValidate autoComplete="off">
            <div className="login-popup-modal__field">
              <label className="login-popup-modal__label">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. 01886 899103"
                className="login-popup-modal__input"
                value={loginData.phone}
                onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                disabled={loginLoading}
                autoComplete="off"
              />
            </div>

            <div className="login-popup-modal__field">
              <label className="login-popup-modal__label">Password</label>
              <div className="login-popup-modal__input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Write your password"
                  className="login-popup-modal__input"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  disabled={loginLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-popup-modal__eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  disabled={loginLoading}
                >
                  {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <div className="login-popup-modal__remember">
              <label className="login-popup-modal__remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loginLoading}
                />
                <span> Remember me</span>
              </label>
            </div>

            <button type="submit" className="login-popup-modal__btn" disabled={loginLoading}>
              {loginLoading
                ? <span className="login-popup-modal__spinner" aria-label="Logging in…" />
                : 'Login'
              }
            </button>

            <div className="login-popup-modal__forgot">
              <Link to="/forgot-password" onClick={() => setShowLoginModal(false)}>Forgot Password?</Link>
            </div>
          </form>

          <div className="login-popup-modal__meta">
            <span>New customer?</span>
            <Link to="/register" onClick={() => setShowLoginModal(false)}> Create your account</Link>
          </div>
        </Modal.Body>
      </Modal>
    </main>
  );
};

// Wait until linked + injected styles are applied before cloning CSS for PDF/print windows.
function waitForStylesReady() {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const linkWaits = links.map(
    (link) =>
      new Promise((resolve) => {
        if (link.sheet) {
          resolve();
          return;
        }
        const done = () => resolve();
        link.addEventListener('load', done, { once: true });
        link.addEventListener('error', done, { once: true });
        setTimeout(done, 4000);
      }),
  );

  return Promise.all(linkWaits).then(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  });
}

// Inline all document CSS — <link> tags in blob: URLs do not load before print().
async function collectDocumentStylesForPrint() {
  await waitForStylesReady();

  const chunks = new Set();
  const pending = [];

  document.querySelectorAll('style').forEach((tag) => {
    const text = tag.textContent?.trim();
    if (text) chunks.add(text);
  });

  const fetchCss = (href) =>
    fetch(href)
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => { if (text?.trim()) chunks.add(text); })
      .catch(() => { });

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules?.length) {
        const text = Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('\n');
        if (text.trim()) chunks.add(text);
      }
    } catch {
      /* cross-origin — fetch href below */
    }
    if (sheet.href) pending.push(fetchCss(sheet.href));
  }

  document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
    pending.push(fetchCss(link.href));
  });

  await Promise.all(pending);
  return Array.from(chunks)
    .join('\n')
    .replace(/<\/style/gi, '<\\/style');
}

function buildInvoicePrintHtml(invoiceHtml, inlinedCss, invoiceNo) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice-${invoiceNo || 'order'}</title>
  <style>
    ${inlinedCss}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 16px; background: #fff; }
    .invoice-action-bar, .no-print { display: none !important; }
    .invoice-print-container { max-width: 100% !important; padding: 0 !important; }
    .invoice-doc { box-shadow: none !important; border-radius: 8px !important; padding: 24px !important; }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { padding: 0; }
      .invoice-doc { padding: 0 !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body>
  ${invoiceHtml}
</body>
</html>`;
}

function schedulePrintWhenReady(targetWindow, delayMs = 700) {
  const runPrint = () => {
    const doc = targetWindow.document;
    const imgs = Array.from(doc.images || []);
    const afterImages = () => {
      try {
        targetWindow.focus();
      } catch {
        /* cross-origin or detached */
      }
      setTimeout(() => {
        try {
          targetWindow.print();
        } catch {
          /* fallback below */
        }
      }, delayMs);
    };
    if (!imgs.length) {
      afterImages();
      return;
    }
    let done = 0;
    const tick = () => {
      done += 1;
      if (done >= imgs.length) afterImages();
    };
    imgs.forEach((img) => {
      if (img.complete) tick();
      else {
        img.onload = tick;
        img.onerror = tick;
      }
    });
  };

  if (targetWindow.document.readyState === 'complete') runPrint();
  else targetWindow.addEventListener('load', runPrint, { once: true });
}

// Mobile browsers block window.open after async work — open print target on tap (sync).
function createSyncPrintTarget() {
  const popup = window.open('about:blank', '_blank');
  if (popup) {
    try {
      popup.document.open();
      popup.document.write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice</title></head><body style="font-family:sans-serif;padding:24px;color:#555;">Preparing invoice…</body></html>',
      );
      popup.document.close();
    } catch {
      /* ignore */
    }
    return { kind: 'popup', win: popup, cleanup: null };
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Invoice PDF');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:100%;height:100%;border:0;z-index:2147483646;background:#fff;opacity:0.01;pointer-events:none;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return null;
  }

  try {
    win.document.open();
    win.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice</title></head><body style="font-family:sans-serif;padding:24px;color:#555;">Preparing invoice…</body></html>',
    );
    win.document.close();
  } catch {
    iframe.remove();
    return null;
  }

  const cleanup = () => {
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* already removed */
      }
    }, 120000);
  };

  return { kind: 'iframe', win, cleanup };
}

function writeHtmlToPrintTarget(target, html) {
  target.win.document.open();
  target.win.document.write(html);
  target.win.document.close();
  schedulePrintWhenReady(target.win, target.kind === 'iframe' ? 900 : 700);
  target.cleanup?.();
}

function openBlobInvoiceOnMobile(blobUrl) {
  // iOS/Android: <a download> is unreliable; navigating opens the invoice for Print → Save as PDF.
  const opened = window.open(blobUrl, '_blank');
  if (!opened) {
    window.location.assign(blobUrl);
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

function isMobileBrowser() {
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  return (
    navigator.maxTouchPoints > 0
    && window.matchMedia?.('(max-width: 768px)').matches === true
  );
}

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || '');
}

// Best-effort storage / persistence before saving files (mobile browsers).
async function requestMobileStoragePermission() {
  try {
    if (navigator.storage?.persist) {
      const already = await navigator.storage.persisted?.();
      if (!already) await navigator.storage.persist();
    }
  } catch {
    /* not supported — downloads still work without it */
  }
  return true;
}

async function trySaveWithFilePicker(blob, filename) {
  if (typeof window.showSaveFilePicker !== 'function') return false;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return true;
    return false;
  }
}

function tryAnchorDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.setAttribute('target', '_self');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch {
    URL.revokeObjectURL(url);
    return false;
  }
}

async function tryWebShareFile(blob, filename) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (typeof navigator.share !== 'function' || !navigator.canShare?.({ files: [file] })) {
    return false;
  }
  try {
    await navigator.share({ files: [file], title: filename });
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return true;
    return false;
  }
}

function openPdfInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank');
  if (!opened) window.location.assign(url);
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

async function savePdfBlob(blob, filename) {
  void requestMobileStoragePermission();

  // 1. Native save dialog (Android Chrome / supported browsers)
  if (await trySaveWithFilePicker(blob, filename)) return;

  // 2. Direct download — must run before share (share was blocking Android downloads)
  if (isAndroidDevice()) {
    tryAnchorDownload(blob, filename);
    return;
  }

  // 3. iOS: try direct download (works on some Safari versions)
  if (tryAnchorDownload(blob, filename) && !isIOSDevice()) return;

  // 4. iOS fallback: Share → Save to Files (only when direct download isn't available)
  if (isIOSDevice() && (await tryWebShareFile(blob, filename))) return;

  // 5. Last resort: open PDF tab
  if (isIOSDevice()) {
    openPdfInNewTab(blob);
    return;
  }

  tryAnchorDownload(blob, filename);
}

async function inlineInvoiceImages(root) {
  const imgs = root.querySelectorAll('img');
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise((resolve) => {
          if (!img.src || img.src.startsWith('data:')) {
            resolve();
            return;
          }
          const url = img.src;
          const tester = new Image();
          tester.crossOrigin = 'anonymous';
          tester.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = tester.naturalWidth;
              canvas.height = tester.naturalHeight;
              canvas.getContext('2d').drawImage(tester, 0, 0);
              img.src = canvas.toDataURL('image/png');
            } catch {
              /* CORS — keep remote src; html2canvas may still render if allowed */
            }
            resolve();
          };
          tester.onerror = () => resolve();
          tester.src = url;
        }),
    ),
  );
}

function createPdfCaptureClone(rootEl) {
  const clone = rootEl.cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.add('invoice-doc--pdf');
  clone.style.width = '860px';
  clone.style.maxWidth = '860px';
  clone.style.minWidth = '860px';

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '860px';
  wrapper.style.minWidth = '860px';
  wrapper.style.height = 'auto';
  wrapper.style.overflow = 'hidden';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '0';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return { clone, wrapper };
}

let html2pdfModule = null;

async function getHtml2Pdf() {
  if (!html2pdfModule) {
    html2pdfModule = (await import('html2pdf.js')).default;
  }
  return html2pdfModule;
}

function invoicePdfFilename(invoiceNo) {
  return `invoice-${invoiceNo || 'order'}.pdf`;
}

function getInvoicePdfOptions(captureEl, filename) {
  return {
    margin: [8, 8, 8, 8],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: captureEl.scrollWidth,
      height: captureEl.scrollHeight,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };
}

// Build A4 PDF blob after styles + images are ready (used for preload + download).
async function buildInvoicePdfBlob(rootEl, invoiceNo) {
  const html2pdf = await getHtml2Pdf();
  const originalCaptureEl = rootEl.querySelector('.invoice-doc') || rootEl;
  const { clone: captureEl, wrapper } = createPdfCaptureClone(originalCaptureEl);

  try {
    await waitForStylesReady();
    if (document.fonts?.ready) await document.fonts.ready;
    await inlineInvoiceImages(captureEl);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const filename = invoicePdfFilename(invoiceNo);
    const opt = getInvoicePdfOptions(captureEl, filename);
    return await html2pdf().set(opt).from(captureEl).outputPdf('blob');
  } finally {
    try {
      wrapper.remove();
    } catch {
      // ignore cleanup issues
    }
  }
}

function startInvoicePdfPrepare(rootEl, invoiceNo, cacheRef, promiseRef) {
  if (promiseRef.current) return promiseRef.current;

  cacheRef.current = { blob: null, filename: invoicePdfFilename(invoiceNo), ready: false };

  promiseRef.current = (async () => {
    try {
      const blob = await buildInvoicePdfBlob(rootEl, invoiceNo);
      cacheRef.current = {
        blob,
        filename: invoicePdfFilename(invoiceNo),
        ready: true,
      };
      return cacheRef.current;
    } catch (err) {
      cacheRef.current = { blob: null, filename: invoicePdfFilename(invoiceNo), ready: false };
      promiseRef.current = null;
      throw err;
    }
  })();

  return promiseRef.current;
}

// Mobile: save pre-built PDF on tap (keeps user-gesture for download) or build then save.
async function downloadInvoicePdfFile(rootEl, invoiceNo, cacheRef, promiseRef) {
  const filename = invoicePdfFilename(invoiceNo);

  if (cacheRef.current?.ready && cacheRef.current.blob) {
    await savePdfBlob(cacheRef.current.blob, cacheRef.current.filename || filename);
    return;
  }

  const prepared = await (promiseRef.current || startInvoicePdfPrepare(rootEl, invoiceNo, cacheRef, promiseRef));
  if (prepared?.blob) {
    await savePdfBlob(prepared.blob, prepared.filename || filename);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  InvoicePage
// ══════════════════════════════════════════════════════════════════════════════
export const InvoicePage = ({ orderData, token }) => {
  const navigate = useNavigate();

  // ── ALL useState — must be before any early return ────────────────────────
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdfLoadingModal, setShowPdfLoadingModal] = useState(false);
  const [pdfLoadingAction, setPdfLoadingAction] = useState(null); // 'download' or 'share'
  const [error, setError] = useState(null);
  const invoicePrintCssRef = useRef(null);
  const invoicePdfCacheRef = useRef({ blob: null, filename: null, ready: false });
  const invoicePdfPrepareRef = useRef(null);

  const orderId = orderData?.id;
  const isLoggedInOrder = orderData?._isLoggedIn ?? !!orderData?.customer?.id;

  // ── useEffect 1: Load invoice + settings ─────────────────────────────────
  useEffect(() => {
    if (!orderId) { setError('Order ID not found.'); setLoading(false); return; }

    const load = async () => {
      try {
        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const [invRes, setRes] = await Promise.all([
          fetch(`${INVOICE_API}?id=${orderId}`, { headers }),
          fetch(SETTINGS_API, { headers: { Accept: 'application/json' } }),
        ]);

        const invData = await invRes.json();
        const setData = await setRes.json();

        if ((invData.status || invData.success) && invData.data) {
          setInvoice(invData.data);
        } else {
          setInvoice(orderData);
        }

        if (setData.success && setData.data?.data) {
          setSettings({ ...setData.data.data, contact: setData.data.contact });
        }
      } catch {
        setInvoice(orderData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, token, orderData]);

  // ── useEffect 2: Auto-navigate timer ─────────────────────────────────────
  useEffect(() => {
    if (!invoice) return;
    const timer = setTimeout(() => navigate('/'), 30000);
    return () => clearTimeout(timer);
  }, [invoice, navigate]);

  // Same route as checkout — ScrollToTop does not run; reset scroll when invoice view loads.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [loading]);

  // Pre-cache print CSS so mobile PDF/print runs right after tap (user-gesture window).
  useEffect(() => {
    if (loading || !invoice) return undefined;
    let cancelled = false;
    const run = () => {
      collectDocumentStylesForPrint().then((css) => {
        if (!cancelled) invoicePrintCssRef.current = css;
      });
    };
    const id = requestAnimationFrame(run);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [loading, invoice, settings]);

  // Preload html2pdf + pre-generate PDF so first Download tap saves immediately (mobile gesture).
  useEffect(() => {
    if (loading || !invoice || !isMobileBrowser()) return undefined;

    let cancelled = false;
    invoicePdfPrepareRef.current = null;
    invoicePdfCacheRef.current = { blob: null, filename: null, ready: false };

    const invoiceNo = invoice.invoice_id ?? orderId;

    const warmup = async () => {
      await requestMobileStoragePermission();
      await getHtml2Pdf();
      if (cancelled) return;

      const el = document.getElementById('invoice-root');
      if (!el) return;

      try {
        await startInvoicePdfPrepare(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef);
      } catch {
        invoicePdfPrepareRef.current = null;
      }
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(warmup);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      invoicePdfPrepareRef.current = null;
    };
  }, [loading, invoice, settings, orderId]);

  // ── Derive logoUrl BEFORE useEffect 3 and BEFORE early returns ───────────
  // This must be a plain derived value (not a hook), placed here so logoUrl
  // is available for the useEffect dependency array below.
  const logoPath = settings?.dark_logo || settings?.white_logo || null;
  const logoUrl = logoPath ? `${BASE_IMAGE_URL}${logoPath.replace(/^\/+/, '')}` : null;

  // ── Early returns — ALL hooks are above this line ─────────────────────────
  if (loading) {
    return (
      <main className="checkout-page invoice-page">
        <Container className="container-1500 py-5 text-center">
          <Spinner animation="border" style={{ color: '#c8102e' }} />
          <p className="mt-3 text-muted">Generating your invoice...</p>
        </Container>
      </main>
    );
  }

  if (error && !invoice) {
    return (
      <main className="checkout-page invoice-page">
        <Container className="container-1500 py-5 text-center">
          <p className="text-danger">{error}</p>
          <Link to="/" className="checkout-page__back-btn mt-3 d-inline-block">← Continue Shopping</Link>
        </Container>
      </main>
    );
  }

  // ── Derived values (after early returns — these are plain variables, not hooks) ──
  const { orderdetails = [] } = invoice;

  const orderDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  const subtotalAmt = Number(invoice.amount ?? orderData?._subtotal ?? 0);
  const discountAmt = Number(invoice.coupon_discount ?? orderData?._couponDiscount ?? 0);
  const shippingAmt = Number(invoice.shipping_charge ?? orderData?._shippingAmount ?? 0);
  const grandAmt = Number(invoice.final_amount ?? (subtotalAmt - discountAmt + shippingAmt));
  const paidAmt = Number(invoice.paid_amount ?? 0);
  const dueAmt = Number(invoice.due_amount ?? (grandAmt - paidAmt));

  const paymentMethod = invoice.payment?.payment_method
    ?? invoice.payment_method
    ?? orderData?._paymentMethod
    ?? 'Cash On Delivery';

  const customerName = orderData?._customerName
    || invoice.shipping?.name
    || invoice.customer?.name
    || invoice.name
    || 'Customer';

  const customerPhone = orderData?._customerPhone
    || invoice.shipping?.phone
    || invoice.customer?.phone
    || invoice.phone
    || '—';

  // Customer Address — use snapshot if available, else build from API
  const customerAddressDisplay = orderData?._customerAddress
    ? orderData._customerAddress
    : (() => {
      const raw = invoice.customer?.address || null;
      const district = invoice.customer?.district || null;
      const division = invoice.customer?.division?.name || null;
      return raw ? [raw, district, division].filter(Boolean).join(', ') : null;
    })();

  // Shipping/Delivery Address
  const shipAddrRaw = orderData?._deliveryAddress || invoice.shipping?.address || invoice.address || '—';
  const shipDistrict = orderData?._selectedDistrict || invoice.shipping?.district || null;
  const shipDivision = orderData?._selectedDivision || invoice.shipping?.division || null;
  const shippingAddressDisplay = [shipAddrRaw, shipDistrict, shipDivision].filter(Boolean).join(', ') || '—';

  const couponCode = orderData?._couponCode || invoice.coupon_code || null;

  // Site info from settings
  const siteName = settings?.name || 'Zentex';
  const siteAddress = settings?.contact?.address || 'Dhaka, Bangladesh';
  const sitePhone = settings?.contact?.hotline || settings?.contact?.phone || '+88 01846-139660';
  const siteEmail = settings?.contact?.hotmail || settings?.contact?.email || 'info@zentex.com';
  // logoUrl already derived above (before hooks); logoPath also derived above
  // Re-derive the display URL the same way for use in JSX (logoUrl already available)

  const invoiceNo = invoice.invoice_id ?? orderId;

  const showCustomerAddress = isLoggedInOrder && !!customerAddressDisplay;
  const addressesAreSame = showCustomerAddress &&
    customerAddressDisplay.trim().toLowerCase() === shippingAddressDisplay.trim().toLowerCase();

  // ── Download PDF — Blob HTML download (works on all mobile browsers) ──────
  // Why this approach:
  // • window.open() is blocked by mobile browsers
  // • html2canvas cannot capture external SCSS styles or cross-origin logo
  // • Blob download triggers the browser's native "Open with / Save" dialog
  //   where user can choose "Print" → "Save as PDF" — works on iOS & Android
  // Styles are inlined (not <link>) so blob pages match on-page Print output.
  const handleDownloadPDF = async () => {
    const el = document.getElementById('invoice-root');
    if (!el || pdfLoading) return;

    try {
      // Mobile: show loading modal for better UX
      if (isMobileBrowser()) {
        setShowPdfLoadingModal(true);
        setPdfLoadingAction('download');
      }

      setPdfLoading(true);

      // Mobile: use pre-built PDF when ready so download runs in the same tap (user gesture).
      if (isMobileBrowser()) {
        if (invoicePdfCacheRef.current?.ready && invoicePdfCacheRef.current.blob) {
          await savePdfBlob(
            invoicePdfCacheRef.current.blob,
            invoicePdfCacheRef.current.filename || invoicePdfFilename(invoiceNo),
          );
          return;
        }

        await downloadInvoicePdfFile(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef);
        return;
      }

      // Desktop: open print target synchronously on tap (popup gesture).
      const printTarget = createSyncPrintTarget();

      const inlinedCss =
        invoicePrintCssRef.current || (await collectDocumentStylesForPrint());
      if (!invoicePrintCssRef.current) invoicePrintCssRef.current = inlinedCss;
      const html = buildInvoicePrintHtml(el.outerHTML, inlinedCss, invoiceNo);

      if (printTarget?.win) {
        writeHtmlToPrintTarget(printTarget, html);
        return;
      }

      // Last resort: blob page (auto-print) — open in tab for mobile Save as PDF
      const blobHtml = `${html}
<script>
(function() {
  function triggerPrint() { setTimeout(function() { window.print(); }, 900); }
  function whenImagesReady(cb) {
    var imgs = Array.prototype.slice.call(document.images);
    if (!imgs.length) { cb(); return; }
    var done = 0;
    function tick() { done++; if (done >= imgs.length) cb(); }
    imgs.forEach(function(img) {
      if (img.complete) tick();
      else { img.onload = tick; img.onerror = tick; }
    });
  }
  window.addEventListener('load', function() { whenImagesReady(triggerPrint); });
})();
<\/script>`;

      const blob = new Blob([blobHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const blobWin = window.open(blobUrl, '_blank');

      if (!blobWin || blobWin.closed || typeof blobWin.closed === 'undefined') {
        openBlobInvoiceOnMobile(blobUrl);
      } else {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    } finally {
      setPdfLoading(false);
      // Close loading modal after a brief delay to show completion
      setTimeout(() => {
        setShowPdfLoadingModal(false);
        setPdfLoadingAction(null);
      }, 500);
    }
  };

  // ── Print button handler ──────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Share PDF — mobile Web Share API ──────────────────────────────────────
  const handleSharePDF = async () => {
    const el = document.getElementById('invoice-root');
    if (!el || pdfLoading) return;

    try {
      setShowPdfLoadingModal(true);
      setPdfLoadingAction('share');
      setPdfLoading(true);

      // Get the PDF blob
      let pdfBlob = null;

      if (invoicePdfCacheRef.current?.ready && invoicePdfCacheRef.current.blob) {
        pdfBlob = invoicePdfCacheRef.current.blob;
      } else {
        const prepared = await (invoicePdfPrepareRef.current || startInvoicePdfPrepare(el, invoiceNo, invoicePdfCacheRef, invoicePdfPrepareRef));
        pdfBlob = prepared?.blob;
      }

      if (!pdfBlob) {
        console.error('Failed to generate PDF for sharing');
        return;
      }

      const filename = invoicePdfFilename(invoiceNo);
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Check if Web Share API is available
      if (typeof navigator.share !== 'function' || !navigator.canShare?.({ files: [file] })) {
        // Fallback to download if share is not available
        await savePdfBlob(pdfBlob, filename);
        return;
      }

      // Use Web Share API
      await navigator.share({
        files: [file],
        title: `Invoice ${invoiceNo}`,
        text: `Check out my invoice from Zentex Lifestyle`,
      });
    } catch (err) {
      // AbortError means user cancelled share — not a real error
      if (err?.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setPdfLoading(false);
      setTimeout(() => {
        setShowPdfLoadingModal(false);
        setPdfLoadingAction(null);
      }, 500);
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <main className="checkout-page invoice-page">

      {/* Action Bar */}
      <div className="invoice-action-bar no-print">
        <Container className="container-1500">
          <div className="invoice-action-bar__inner">
            <div className="invoice-action-bar__left">
              <span className="invoice-action-bar__badge">✅ Order Placed Successfully!</span>
              <span className="invoice-action-bar__subtext">
                Invoice #{invoiceNo} · {orderDate}
              </span>
            </div>
            <div className="invoice-action-bar__btns">
              <button className="inv-btn inv-btn--print" onClick={handlePrint}>🖨️ Print Invoice</button>
              <button className="inv-btn inv-btn--pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
                {pdfLoading && pdfLoadingAction === 'download' ? 'Generating PDF…' : '📄 Download PDF'}
              </button>
              {isMobileBrowser() && (
                <button className="inv-btn inv-btn--share" onClick={handleSharePDF} disabled={pdfLoading}>
                  {pdfLoading && pdfLoadingAction === 'share' ? 'Sharing…' : '📤 Share Invoice'}
                </button>
              )}
              <Link to="/" className="inv-btn inv-btn--continue">🛒 Continue Shopping</Link>
            </div>
          </div>
        </Container>
      </div>

      {/* PDF Loading Modal */}
      <Modal
        show={showPdfLoadingModal}
        onHide={() => setShowPdfLoadingModal(false)}
        centered
        backdrop="static"
        keyboard={false}
        className="pdf-loading-modal"
      >
        <Modal.Body className="pdf-loading-modal__body">
          <div className="pdf-loading-modal__content">
            <div className="pdf-loading-modal__spinner">
              <Spinner animation="border" role="status" style={{ color: '#FF6600' }}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
            <h5 className="pdf-loading-modal__title">
              {pdfLoadingAction === 'share' ? 'Preparing Invoice for Sharing…' : 'Generating Your Invoice PDF…'}
            </h5>
            <p className="pdf-loading-modal__message">
              {pdfLoadingAction === 'share'
                ? 'Please wait while we prepare your invoice for sharing. Do not close this window.'
                : 'Please wait while we prepare your invoice with all images and styles. Do not close this window.'}
            </p>
            <button
              className="pdf-loading-modal__close-btn"
              onClick={() => setShowPdfLoadingModal(false)}
              style={{ marginTop: '16px' }}
            >
              Done
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Invoice Document */}
      <Container className="py-4 invoice-print-container" id="invoice-root">
        <div className="invoice-doc">

          {/* Header */}
          <div className="invoice-doc__header">
            <div className="invoice-doc__brand">
              {logoUrl
                ? <img src={logoUrl} alt={siteName} className="invoice-doc__logo" />
                : <h2 className="invoice-doc__brand-name">{siteName}</h2>
              }
              <div className="invoice-doc__brand-info">
                <p>
                  <Phone size={14} fill="#000" style={{ marginRight: '6px' }} />
                  {sitePhone}
                </p>
                <p>
                  <Mail size={14} fill="#000" style={{ marginRight: '6px' }} />
                  {siteEmail}
                </p>
                <p>
                  <MapPin size={14} fill="#000" style={{ marginRight: '6px' }} />
                  {siteAddress}
                </p>
              </div>
            </div>
            <div className="invoice-doc__meta">
              <h1 className="invoice-doc__title">INVOICE</h1>
              <table className="invoice-doc__meta-table">
                <tbody>
                  <tr><td>Invoice No:</td><td><strong>#{invoiceNo}</strong></td></tr>
                  <tr><td>Date:</td>      <td><strong>{orderDate}</strong></td></tr>
                  <tr><td>Payment:</td>   <td><strong>{paymentMethod}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <hr className="invoice-doc__divider" />

          {/* Parties */}
          <div className="invoice-doc__parties">
            {!showCustomerAddress ? (
              // GUEST — delivery info only
              <div className="invoice-doc__bill-to">
                <h6 className="invoice-doc__section-label">Delivery Info</h6>
                <p className="invoice-doc__customer-name">{customerName}</p>
                <p>{customerPhone}</p>
                <p>{shippingAddressDisplay}</p>
                {couponCode && (
                  <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                )}
              </div>
            ) : addressesAreSame ? (
              // LOGGED-IN, same address
              <div className="invoice-doc__bill-to">
                <h6 className="invoice-doc__section-label">Customer Info</h6>
                <p className="invoice-doc__customer-name">{customerName}</p>
                <p>{customerPhone}</p>
                <p>{customerAddressDisplay}</p>
                {couponCode && (
                  <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                )}
              </div>
            ) : (
              // LOGGED-IN, different addresses
              <div className="invoice-doc__parties-cols" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="invoice-doc__bill-to">
                  <h6 className="invoice-doc__section-label">Customer Info</h6>
                  <p className="invoice-doc__customer-name">{customerName}</p>
                  <p>{customerPhone}</p>
                  <p>{customerAddressDisplay}</p>
                  {couponCode && (
                    <p className="invoice-doc__coupon-tag">🏷️ Coupon: <strong>{couponCode}</strong></p>
                  )}
                </div>
                <div className="invoice-doc__ship-to">
                  <h6 className="invoice-doc__section-label">Shipping Address</h6>
                  <p className="invoice-doc__customer-name">{customerName}</p>
                  <p>{customerPhone}</p>
                  <p>{shippingAddressDisplay}</p>
                </div>
              </div>
            )}
          </div>

          <hr className="invoice-doc__divider" />

          {/* Items Table */}
          <div className="invoice-doc__items-wrap">
            <table className="invoice-doc__items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="text-center">Size</th>
                  <th className="text-center">Color</th>
                  <th className="text-center">Qty</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderdetails.map((d, idx) => {
                  const unitPrice = Number(d.sale_price ?? d.new_price ?? 0);
                  const qty = Number(d.qty ?? 1);
                  const raw = d.product_name || d.name || d.product?.name || '';
                  const isSlug = /^[a-z0-9]+(-[a-z0-9]+)*-\d+$/.test(raw);
                  const productName = isSlug
                    ? (d.product?.name || raw)
                    : (raw || `Product #${d.product_id}`);
                  return (
                    <tr key={d.id ?? idx}>
                      <td>{idx + 1}</td>
                      <td className="invoice-doc__product-name">{productName}</td>
                      <td className="text-center">{d.product_size || d.size || '—'}</td>
                      <td className="text-center">{d.product_color || d.color || '—'}</td>
                      <td className="text-center">{qty}</td>
                      <td className="text-end">{formatPrice(unitPrice)}</td>
                      <td className="text-end"><strong>{formatPrice(unitPrice * qty)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="invoice-doc__totals">
            <div className="invoice-doc__totals-rows">
              <div className="invoice-doc__total-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalAmt)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="invoice-doc__total-row invoice-doc__total-row--discount">
                  <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-{formatPrice(discountAmt)}</span>
                </div>
              )}
              <div className="invoice-doc__total-row">
                <span>Delivery Charge</span>
                <span>{formatPrice(shippingAmt)}</span>
              </div>
              <div className="invoice-doc__total-row invoice-doc__total-row--grand">
                <span>Total</span>
                <span>{formatPrice(grandAmt)}</span>
              </div>
              <div className="invoice-doc__total-row invoice-doc__total-row--paid">
                <span>Paid Amount</span>
                <span>{formatPrice(paidAmt)}</span>
              </div>
              <div className="invoice-doc__total-row invoice-doc__total-row--due">
                <span>Due Amount</span>
                <span>{formatPrice(dueAmt)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-doc__footer">
            <div className="invoice-doc__footer-thanks">
              <p>Thank you for shopping with <strong>{siteName}</strong>!</p>
            </div>
          </div>

        </div>
      </Container>
    </main>
  );
};

export default CheckoutPage;