import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, removeAuth, getToken, getUserData } from '../../utils/auth'
import { BASE_IMAGE_URL } from '../../utils';
import { InvoicePage } from '../Checkout/CheckoutPage';
import axios from 'axios';
import './CustomerDashboardPage.scss';

import { API_BASE_URL } from '../../config/env';

const API = API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  Accept: 'application/json',
});

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusColor = (s) => {
  switch (s?.toLowerCase()) {
    case 'delivered':
    case 'completed':  return 'green';
    case 'shipped':
    case 'in-courier':
    case 'on-the-way': return 'blue';
    case 'processing': return 'orange';
    case 'pending':
    case 'on-hold':    return 'amber';
    case 'cancelled':  return 'red';
    default:           return 'gray';
  }
};

// ── Icons ─────────────────────────────────────────────────────────
const Ic = {
  Dashboard:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Orders:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="m9 14 2 2 4-4"/></svg>,
  User:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  Lock:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  MapPin:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  LogOut:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  Package:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Check:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Edit:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Plus:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Eye:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Alert:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Star:         () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Camera:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  X:            () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  ArrowLeft:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  CheckCircle:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  ChevronLeft:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
};

// ── Skeleton ────────────────────────────────────────────────────────
const Skel = ({ w = '100%', h = 16, r = 6 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

// ── Toast ────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`toast toast--${type}`}>
    {type === 'success' ? <Ic.Check /> : <Ic.Alert />}
    <span>{msg}</span>
    <button onClick={onClose}><Ic.X /></button>
  </div>
);

// ── Password strength ────────────────────────────────────────────
const pwdStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

// ── Confirm Dialog ───────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="cdp__modal-overlay" onClick={() => !loading && onCancel()}>
    <div className="cdp__modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
      <div className="cdp__modal-head">
        <h3>{title}</h3>
        <button className="cdp__modal-close" onClick={onCancel} disabled={loading}><Ic.X /></button>
      </div>
      <div className="cdp__modal-body" style={{ gap: 8 }}>
        <p style={{ margin: 0, fontSize: 14, color: '#565959' }}>{message}</p>
        <div className="cdp__modal-actions" style={{ paddingTop: 8 }}>
          <button className="cdp__btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className="cdp__btn-primary"
            style={{ background: '#b12704', borderColor: '#8a1e03' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><span className="cdp__spinner" /> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Invoice Overlay ──────────────────────────────────────────────
const InvoiceOverlay = ({ order, token, onClose }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePrint = () => {
    const invoiceEl = document.getElementById('invoice-root');
    if (!invoiceEl) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
        } catch { return ''; }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Invoice #${order.invoice_id}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${invoiceEl.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  const orderData = {
    id:               order.id,
    invoice_id:       order.invoice_id,
    created_at:       order.created_at,
    amount:           order.amount,
    discount:         order.discount,
    coupon_discount:  order.discount,
    coupon_code:      order.coupon_code || '',
    shipping_charge:  order.shipping_charge,
    payment_method:   order.payment_method || 'Cash On Delivery',
    payment:          order.payment,
    note:             order.note || '',
    customer:         order.customer,
    shipping:         order.shipping,
    orderdetails:     order.orderdetails || [],
    _customerAddress: order.customer?.address || order.address || '',
    _deliveryAddress: order.shipping?.address || order.address || '',
    _paymentMethod:   order.payment?.payment_method || order.payment_method || 'Cash On Delivery',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,17,17,0.72)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1a1a1a', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          <Ic.ArrowLeft /> Back to Orders
        </button>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Invoice #{order.invoice_id}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#000', border: '1px solid #333', color: '#fff', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            🖨️ Print
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FF6600', border: '1px solid #e55a00', color: '#fff', padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            📄 Download PDF
          </button>
        </div>
      </div>
      <InvoicePage orderData={orderData} token={token} />
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────
const CustomerDashboardPage = () => {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [tab, setTab]                       = useState('overview');
  const [user, setUser]                     = useState(null);
  const isGoogleUser = React.useMemo(() => {
    return user?.provider === 'google';
  }, [user]);
  const [orders, setOrders]                 = useState([]);
  const [orderFilter, setOrderFilter]       = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage]       = useState(1);
  const [totalOrders, setTotalOrders]       = useState(0);
  const ordersPerPage = 4;

  // ── Address state ────────────────────────────────────────────────
  const [addresses, setAddresses]           = useState([]);
  const [defaultAddrId, setDefaultAddrId]   = useState(null);
  const [allDistricts, setAllDistricts]     = useState([]);
  const [allDivisions, setAllDivisions]     = useState([]);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState(null);

  // Invoice overlay
  const [viewingOrder, setViewingOrder]     = useState(null);

  // Edit profile
  const [showEdit, setShowEdit]             = useState(false);
  const [editForm, setEditForm]             = useState({});
  const [editSaving, setEditSaving]         = useState(false);
  const [avatarPreview, setAvatarPreview]   = useState(null);
  const [avatarFile, setAvatarFile]         = useState(null);
  const [editDistricts, setEditDistricts]   = useState([]);

  // Change password
  const [pwdForm, setPwdForm]               = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwdSaving, setPwdSaving]           = useState(false);
  const [showPwd, setShowPwd]               = useState({ old: false, new: false, confirm: false });

  // Add address modal
  const [showAddAddr, setShowAddAddr]       = useState(false);
  const [addrForm, setAddrForm]             = useState({ address_title: '', address: '', district: '', division_id: '' });
  const [addrDistricts, setAddrDistricts]   = useState([]);
  const [addrSaving, setAddrSaving]         = useState(false);

  // Edit address modal
  const [showEditAddr, setShowEditAddr]     = useState(false);
  const [editAddrId, setEditAddrId]         = useState(null);
  const [editAddrIsDefault, setEditAddrIsDefault] = useState(false);
  const [editAddrForm, setEditAddrForm]     = useState({ address_title: '', address: '', district: '', division_id: '' });
  const [editAddrDistricts, setEditAddrDistricts] = useState([]);
  const [editAddrSaving, setEditAddrSaving] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [deletingAddr, setDeletingAddr]     = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch profile ───────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      // /customer/profile → flat profile fields (no divisions array)
      const res = await axios.get(`${API}/customer/profile`, { headers: authHeaders() });
      if (!res.data.success) throw new Error(res.data.message || 'Failed');
      // Image 1 shows: data is flat — id, name, division_id etc directly under data
      // BUT also supports data.profile nested structure (Image 3 /profile/edit)
      const d = res.data.data;
      const profile = d.profile || d;

      // /profile/edit → has data.profile + data.divisions + data.districts
      const editRes = await axios.get(`${API}/profile/edit`, { headers: authHeaders() });
      const divisionsList = editRes.data?.data?.divisions || [];
      const districtsList = editRes.data?.data?.districts || [];

      // Find division name using division_id from profile + divisions from edit endpoint
      let divisionName = '';
      if (profile.division_id && divisionsList.length) {
        const divisionObj = divisionsList.find(
          div => String(div.id) === String(profile.division_id)
        );
        divisionName = divisionObj?.name || '';
      }

      const storedUser = getUserData() || {};
      
      setUser({
        id:          profile.id,
        name:        profile.name || 'User',
        email:       profile.email || '',
        phone:       profile.phone || '',
        slug:        profile.slug || '',
        district:    profile.district || '',
        division_id: profile.division_id || '',
        division:    divisionName,
        address:     profile.address || '',
        verify:      profile.verify ?? 0,
        status:      profile.status || 'active',
        memberSince: formatDate(profile.created_at),
        image:       profile.image && !profile.image.includes('default/user.png')
                     ? `${BASE_IMAGE_URL}${profile.image}` : null,
        initials:    profile.name ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U',
        // ✅ Preserve provider field from stored data (for Google users)
        provider:    storedUser.provider,
      });

      // Store divisions and districts for dropdowns
      if (divisionsList.length) setAllDivisions(divisionsList);
      if (districtsList.length) setAllDistricts(districtsList);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // ── Fetch orders with pagination ────────────────────────────────
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders/overview`, { headers: authHeaders() });
      
      if (res.data?.status === true) {
        const data = res.data.data;
        if (Array.isArray(data?.orders)) {
          setOrders(data.orders);
          setTotalOrders(data.total_orders || data.orders.length);
          // totalPages is computed client-side from filteredOrders
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  };

  // ── Fetch addresses ─────────────────────────────────────────────
  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${API}/address`, { headers: authHeaders() });
      if (res.data.status) {
        const data     = res.data.data;
        const addrList = data?.addresses || [];
        const defRaw   = data?.default_address;

        setAddresses(addrList);
        
        // Store divisions and districts from address API
        if (data.divisions) setAllDivisions(data.divisions);
        if (data.districts) setAllDistricts(data.districts);

        // Match default address by division_id and district
        if (defRaw && defRaw.division && defRaw.district) {
          const matched = addrList.find(
            a => String(a.division_id) === String(defRaw.division) &&
                 a.district?.toLowerCase() === defRaw.district?.toLowerCase()
          );
          setDefaultAddrId(matched?.id ?? null);
        } else {
          setDefaultAddrId(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setAddresses([]);
      setDefaultAddrId(null);
    }
  };

  // ── Filter orders ───────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'All') return true;
    const statusName = order.status?.name?.toLowerCase();
    switch (orderFilter.toLowerCase()) {
      case 'pending':    return statusName === 'pending';
      case 'processing': return statusName === 'processing';
      case 'delivered':  return statusName === 'completed' || statusName === 'delivered';
      case 'cancelled':  return statusName === 'cancelled';
      default:           return true;
    }
  });
  

  // ── Load districts by division from API ─────────────────────────
  const loadDistrictsByDivision = async (divisionId, setter) => {
    if (!divisionId) { 
      setter([]); 
      return; 
    }
    try {
      const res = await axios.get(`${API}/get-district?id=${divisionId}`, { headers: authHeaders() });
      if (res.data.success) {
        const raw = res.data.data;
        // API returns: {"1": "Dhaka", "2": "Faridpur", ...}
        const list = typeof raw === 'object' && !Array.isArray(raw)
          ? Object.entries(raw).map(([id, districtName]) => ({ id: Number(id), district: districtName }))
          : (raw || []);
        setter(list);
      } else {
        setter([]);
      }
    } catch (err) {
      console.error('Failed to load districts:', err);
      setter([]);
    }
  };

  // ── Get division name by ID ─────────────────────────────────────
  const getDivisionName = (divisionId) => {
    if (!divisionId) return '';
    const division = allDivisions.find(d => d.id === divisionId || String(d.id) === String(divisionId));
    return division?.name || '';
  };

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    const { isAuthenticated } = getAuth();
    if (!isAuthenticated) { navigate('/', { replace: true }); return; }
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProfile(), fetchOrders(), fetchAddresses()]);
      } catch (err) {
        if (err.response?.status === 401) { removeAuth(); navigate('/', { replace: true }); }
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  // ── Handle page change ──────────────────────────────────────────
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ── Handle filter change ────────────────────────────────────────
  const handleFilterChange = (filter) => {
    setOrderFilter(filter);
    setCurrentPage(1);
  };

  // ── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => { removeAuth(); navigate('/', { replace: true }); };

  // ── Open edit profile ────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({ 
      name: user.name, 
      email: user.email, 
      phone: user.phone, 
      district: user.district, 
      division_id: user.division_id,
      address: user.address 
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    
    // Load districts for user's division
    if (user.division_id) {
      loadDistrictsByDivision(user.division_id, setEditDistricts);
    }
    
    setShowEdit(true);
  };

  // ── Save profile ─────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v || ''));
      if (avatarFile) fd.append('image', avatarFile);
      const res = await axios.post(`${API}/profile/update`, fd, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        await fetchProfile();
        setShowEdit(false);
        showToast('Profile updated successfully!');
      } else {
        showToast(res.data.message || 'Update failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally { setEditSaving(false); }
  };

  // ── Change password ──────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showToast('Passwords do not match.', 'error'); return;
    }
    setPwdSaving(true);
    try {
      const fd = new FormData();
      Object.entries(pwdForm).forEach(([k, v]) => fd.append(k, v));
      const res = await axios.post(`${API}/password-update`, fd, { headers: authHeaders() });
      if (res.data.status) {
        showToast('Password changed successfully!');
        setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        showToast(res.data.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally { setPwdSaving(false); }
  };

  // ── ADD ADDRESS ──────────────────────────────────────────────────
  const openAddAddress = () => {
    setAddrForm({ address_title: '', address: '', district: '', division_id: '' });
    setAddrDistricts([]);
    setShowAddAddr(true);
  };

  const addAddress = async (e) => {
    e.preventDefault();
    setAddrSaving(true);
    try {
      const fd = new FormData();
      fd.append('address_title', addrForm.address_title || '');
      fd.append('address',       addrForm.address || '');
      fd.append('district',      addrForm.district || '');
      fd.append('division_id',   addrForm.division_id || '');

      const res = await axios.post(`${API}/store-address`, fd, { headers: authHeaders() });
      if (res.data.status) {
        showToast('Address added successfully!');
        setShowAddAddr(false);
        setAddrForm({ address_title: '', address: '', district: '', division_id: '' });
        await fetchAddresses();
      } else {
        showToast(res.data.message || 'Failed to add address.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally { setAddrSaving(false); }
  };

  // ── EDIT ADDRESS ─────────────────────────────────────────────────
  const openEditAddress = async (addr) => {
    const isDefault = addr.id === defaultAddrId;
    setEditAddrId(addr.id);
    setEditAddrIsDefault(isDefault);
    setEditAddrForm({
      address_title: addr.address_title || '',
      address:       addr.address || '',
      district:      addr.district || '',
      division_id:   String(addr.division_id || ''),
    });
    setEditAddrDistricts([]);
    if (addr.division_id) {
      await loadDistrictsByDivision(addr.division_id, setEditAddrDistricts);
    }
    setShowEditAddr(true);
  };

  const saveEditAddress = async (e) => {
    e.preventDefault();
    setEditAddrSaving(true);
    try {
      const fd = new FormData();
      fd.append('address_title', editAddrForm.address_title || '');
      fd.append('address',       editAddrForm.address || '');
      fd.append('district',      editAddrForm.district || '');
      fd.append('division_id',   editAddrForm.division_id || '');
      if (editAddrIsDefault) {
        fd.append('type', 'default');
      }

      const res = await axios.post(`${API}/update-address/${editAddrId}`, fd, { headers: authHeaders() });
      if (res.data.status) {
        showToast('Address updated successfully!');
        setShowEditAddr(false);
        await fetchAddresses();
      } else {
        showToast(res.data.message || 'Failed to update address.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally { setEditAddrSaving(false); }
  };

  // ── SET DEFAULT ADDRESS ──────────────────────────────────────────
  const setAsDefault = async (addr) => {
    setSettingDefaultId(addr.id);
    try {
      const fd = new FormData();
      fd.append('type',          'default');
      fd.append('address_title', addr.address_title || '');
      fd.append('address',       addr.address || '');
      fd.append('district',      addr.district || '');
      fd.append('division_id',   String(addr.division_id));

      const res = await axios.post(`${API}/update-address/${addr.id}`, fd, { headers: authHeaders() });

      if (res.data.status) {
        setDefaultAddrId(addr.id);
        await fetchAddresses();
        showToast(`"${addr.address_title || 'Address'}" is now your default delivery address!`);
      } else {
        showToast(res.data.message || 'Failed to set as default.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // ── DELETE ADDRESS ────────────────────────────────────────────────
  const confirmDeleteAddress = (addr) => {
    setConfirmDelete({
      id:        addr.id,
      title:     addr.address_title || 'this address',
      isDefault: addr.id === defaultAddrId,
    });
  };

  const deleteAddress = async () => {
    if (!confirmDelete) return;
    setDeletingAddr(true);
    try {
      const { id, isDefault } = confirmDelete;
      const url = isDefault
        ? `${API}/delete-address/${id}?type=default`
        : `${API}/delete-address/${id}`;

      const res = await axios.delete(url, { headers: authHeaders() });
      if (res.data.status === 'success' || res.data.status === true) {
        showToast('Address deleted successfully!');
        setConfirmDelete(null);
        await fetchAddresses();
      } else {
        showToast(res.data.message || 'Failed to delete address.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally { setDeletingAddr(false); }
  };

  // ── Order stats ──────────────────────────────────────────────────
  const stats = {
    total:     totalOrders,
    pending:   orders.filter(o => o.status?.slug === 'pending').length,
    delivered: orders.filter(o => o.status?.slug === 'completed' || o.status?.slug === 'delivered').length,
    cancelled: orders.filter(o => o.status?.slug === 'cancelled').length,
  };
  // Client-side pagination computed values
  const totalPages     = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  const strength = pwdStrength(pwdForm.new_password);

  // ── Default address object (for display) ────────────────────────
  const defaultAddr = addresses.find(a => a.id === defaultAddrId) ?? null;
  const defaultAddrDisplay = defaultAddr
    ? [defaultAddr.address, defaultAddr.district, getDivisionName(defaultAddr.division_id)].filter(Boolean).join(', ')
    : null;

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cdp">
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div className="cdp__topbar-skeleton">
          <Skel w={200} h={28} r={4}/>
          <Skel w={100} h={36} r={40}/>
        </div>
        <div className="cdp__body">
          <aside className="cdp__sidebar">
            <Skel w="100%" h={260} r={12}/>
            <Skel w="100%" h={320} r={12}/>
          </aside>
          <main className="cdp__main">
            <Skel w="100%" h={120} r={12}/>
            <Skel w="100%" h={400} r={12}/>
          </main>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { key: 'overview',       label: 'Overview',        icon: <Ic.Dashboard /> },
    { key: 'myOrders',       label: 'My Orders',       icon: <Ic.Orders />,  badge: stats.total },
    { key: 'accountInfo',    label: 'Account Info',    icon: <Ic.User /> },
    // Hide Change Password for Google-authenticated users
    ...(!isGoogleUser ? [{ key: 'changePassword', label: 'Change Password', icon: <Ic.Lock /> }] : []),
    { key: 'addresses',      label: 'Addresses',       icon: <Ic.MapPin />,  badge: addresses.length },
  ];

  return (
    <div className="cdp">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Invoice overlay */}
      {viewingOrder && (
        <InvoiceOverlay order={viewingOrder} token={getToken()} onClose={() => setViewingOrder(null)} />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Address"
          message={
            confirmDelete.isDefault
              ? `"${confirmDelete.title}" is your default address. Deleting it will remove your default setting. Continue?`
              : `Are you sure you want to delete "${confirmDelete.title}"?`
          }
          onConfirm={deleteAddress}
          onCancel={() => !deletingAddr && setConfirmDelete(null)}
          loading={deletingAddr}
        />
      )}

      {/* ── Top Bar ── */}
      <div className="cdp__topbar">
        <div className="cdp__topbar-inner">
          <div className="cdp__topbar-left">
            <div className="cdp__topbar-brand">My Account</div>
            <span className="cdp__topbar-sep">›</span>
            <span className="cdp__topbar-page">{navItems.find(n => n.key === tab)?.label}</span>
          </div>
          <button className="cdp__logout-btn" onClick={handleLogout}>
            <Ic.LogOut /> Sign Out
          </button>
        </div>
      </div>

      <div className="cdp__body">
        {/* ── Sidebar ── */}
        <aside className="cdp__sidebar">
          <div className="cdp__profile-card">
            <div className="cdp__avatar-wrap">
              {user.image
                ? <img src={user.image} alt={user.name} className="cdp__avatar-img"/>
                : <div className="cdp__avatar-initials">{user.initials}</div>
              }
              <div
                className={`cdp__verify-dot ${user.verify === 1 ? 'cdp__verify-dot--ok' : ''}`}
                title={user.verify === 1 ? 'Verified' : 'Unverified'}
              />
            </div>
            <div className="cdp__profile-info">
              <h3 className="cdp__profile-name">{user.name}</h3>
              <p className="cdp__profile-contact">{user.email || user.phone}</p>
            </div>
          </div>

          <nav className="cdp__nav">
            {navItems.map(({ key, label, icon, badge }) => (
              <button
                key={key}
                className={`cdp__nav-item ${tab === key ? 'cdp__nav-item--active' : ''}`}
                onClick={() => setTab(key)}
              >
                <span className="cdp__nav-icon">{icon}</span>
                <span className="cdp__nav-label">{label}</span>
                {badge > 0 && <span className="cdp__nav-badge">{badge}</span>}
                <span className="cdp__nav-arrow"><Ic.ChevronRight /></span>
              </button>
            ))}
          </nav>

          <div className="cdp__mini-stats">
            {[
              { label: 'Total Orders',  val: stats.total,     color: '#232f3e' },
              { label: 'Pending',       val: stats.pending,   color: '#f0a500' },
              { label: 'Delivered',     val: stats.delivered, color: '#067d62' },
              { label: 'Cancelled',     val: stats.cancelled, color: '#b12704' },
            ].map(({ label, val, color }) => (
              <div className="cdp__mini-stat" key={label}>
                <span className="cdp__mini-stat-val" style={{ color }}>{val}</span>
                <span className="cdp__mini-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="cdp__main">

          {/* ═══ OVERVIEW ═══════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="cdp__section">
              <div className="cdp__section-header">
                <h2>Account Overview</h2>
                <p>Welcome back, <strong>{user.name.split(' ')[0]}</strong>!</p>
              </div>

              <div className="cdp__stat-grid">
                {[
                  { label: 'Total Orders',  val: stats.total,     icon: <Ic.Package />, cls: 'primary', action: () => setTab('myOrders') },
                  { label: 'Pending',       val: stats.pending,   icon: <Ic.Clock />,   cls: 'amber',   action: () => setTab('myOrders') },
                  { label: 'Delivered',     val: stats.delivered, icon: <Ic.Check />,   cls: 'green',   action: () => setTab('myOrders') },
                  { label: 'Cancelled',     val: stats.cancelled, icon: <Ic.X />,       cls: 'red',     action: () => setTab('myOrders') },
                ].map(({ label, val, icon, cls, action }) => (
                  <div className={`cdp__stat-card cdp__stat-card--${cls}`} key={label} onClick={action}>
                    <div className="cdp__stat-icon">{icon}</div>
                    <div className="cdp__stat-body">
                      <span className="cdp__stat-val">{val}</span>
                      <span className="cdp__stat-label">{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cdp__overview-grid">
                {/* Profile Summary */}
                <div className="cdp__card">
                  <div className="cdp__card-head">
                    <h3>Profile Summary</h3>
                    <button className="cdp__btn-edit" onClick={openEdit}><Ic.Edit /> Edit</button>
                  </div>
                  <div className="cdp__profile-fields">
                    {[
                      { label: 'Full Name',        val: user.name },
                      { label: 'Email',            val: user.email || '—' },
                      { label: 'Phone',            val: user.phone || '—' },
                      { label: 'Address',          val: user.address || '—' },
                      { label: 'District',         val: user.district || '—' },
                      { label: 'Division',         val: user.division || '—' },
                      { label: 'Member Since',     val: user.memberSince },
                    ].map(({ label, val }) => (
                      <div className="cdp__field-row" key={label}>
                        <span className="cdp__field-label">{label}</span>
                        <span className="cdp__field-val">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="cdp__card">
                  <div className="cdp__card-head">
                    <h3>Recent Orders</h3>
                    <button className="cdp__text-link" onClick={() => setTab('myOrders')}>View all →</button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="cdp__empty"><Ic.Package /><p>No orders yet</p></div>
                  ) : (
                    <div className="cdp__recent-orders">
                      {orders.slice(0, 5).map(order => (
                        <div
                          className="cdp__recent-order"
                          key={order.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setViewingOrder(order)}
                        >
                          <div className="cdp__recent-order-left">
                            <div className="cdp__recent-order-icon"><Ic.Package /></div>
                            <div>
                              <p className="cdp__recent-order-id">Order #{order.invoice_id}</p>
                              <p className="cdp__recent-order-date">{formatDate(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="cdp__recent-order-right">
                            <span className="cdp__recent-order-amt">
                              ৳{(parseFloat(order.amount) - parseFloat(order.discount || 0) + parseFloat(order.shipping_charge || 0)).toLocaleString()}
                            </span>
                            <span className={`cdp__status cdp__status--${statusColor(order.status?.name)}`}>
                              {order.status?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ MY ORDERS ══════════════════════════════════════════ */}
          {tab === 'myOrders' && (
            <div className="cdp__section">
              <div className="cdp__section-header">
                <h2>My Orders</h2>
                <p>{filteredOrders.length} of {totalOrders} orders</p>
              </div>

              <div className="cdp__order-filters">
                {['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'].map(f => (
                  <button
                    key={f}
                    className={`cdp__order-filter ${orderFilter === f ? 'cdp__order-filter--active' : ''}`}
                    onClick={() => handleFilterChange(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="cdp__empty-lg">
                  <Ic.Package />
                  <h3>{totalOrders === 0 ? 'No orders yet' : `No ${orderFilter.toLowerCase()} orders`}</h3>
                  <p>{totalOrders === 0 ? "You haven't placed any orders. Start shopping!" : 'Try selecting a different filter.'}</p>
                  {totalOrders === 0 && <Link to="/" className="cdp__btn-primary">Browse Products</Link>}
                </div>
              ) : (
                <>
                  <div className="cdp__orders-grid">
                    {paginatedOrders.map(order => {
                      const sc    = statusColor(order.status?.name);
                      return (
                        <div className="cdp__order-card" key={order.id}>
                          {/* Card Top */}
                          <div className="cdp__order-card-top">
                            <div className="cdp__order-meta">
                              <span className="cdp__order-invoice">Invoice: <strong>#{order.invoice_id}</strong></span>
                              <span className="cdp__order-dot">•</span>
                              <span className="cdp__order-date"><Ic.Clock /> {formatDate(order.created_at)}</span>
                            </div>
                            <span className={`cdp__status cdp__status--${sc}`}>{order.status?.name || 'Pending'}</span>
                          </div>

                          {/* Card Body */}
                          <div className="cdp__order-card-body">
                            <div className="cdp__order-amounts">
                              <div className="cdp__order-amount-row">
                                <span>Subtotal</span>
                                <span>৳{parseFloat(order.amount || 0).toLocaleString()}</span>
                              </div>
                              {parseFloat(order.coupon_discount || 0) > 0 && (
                                <div className="cdp__order-amount-row cdp__order-amount-row--discount">
                                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                                  <span>−৳{parseFloat(order.coupon_discount).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="cdp__order-amount-row">
                                <span>Delivery Charge</span>
                                <span>৳{parseFloat(order.shipping_charge || 0).toLocaleString()}</span>
                              </div>
                              <div className="cdp__order-amount-row cdp__order-amount-row--total">
                                <span>Total</span>
                                <span>৳{parseFloat(order.final_amount || 0).toLocaleString()}</span>
                              </div>
                              <div className="cdp__order-amount-row cdp__order-amount-row--paid">
                                <span>Paid Amount</span>
                                <span>৳{parseFloat(order.paid_amount || 0).toLocaleString()}</span>
                              </div>
                              <div className="cdp__order-amount-row cdp__order-amount-row--due">
                                <span>Due Amount</span>
                                <span>৳{parseFloat(order.due_amount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="cdp__order-card-actions" style={{ justifyContent: 'flex-end' }}>
                            {order.note && (
                              <span className="cdp__order-note" style={{ marginRight: 'auto' }}>📝 {order.note.slice(0, 60)}{order.note.length > 60 ? '…' : ''}</span>
                            )}
                            <div className="cdp__order-btns">
                              <button className="cdp__btn-sm" onClick={() => setViewingOrder(order)}>
                                <Ic.Eye /> View Invoice
                              </button>
                              {(order.status?.slug === 'completed' || order.status?.slug === 'delivered') && (
                                <button className="cdp__btn-sm cdp__btn-sm--star"><Ic.Star /> Review</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (() => {
                    // Smart pagination: show max 5 page buttons around current page
                    const delta = 2;
                    const range = [];
                    for (
                      let i = Math.max(1, currentPage - delta);
                      i <= Math.min(totalPages, currentPage + delta);
                      i++
                    ) { range.push(i); }

                    return (
                      <div className="cdp__pagination">
                        {/* Prev */}
                        <button
                          className="cdp__page-btn"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <Ic.ChevronLeft />
                        </button>

                        {/* First page + ellipsis */}
                        {range[0] > 1 && (
                          <>
                            <button className="cdp__page-btn" onClick={() => handlePageChange(1)}>1</button>
                            {range[0] > 2 && <span className="cdp__page-ellipsis">…</span>}
                          </>
                        )}

                        {/* Page number buttons */}
                        {range.map(page => (
                          <button
                            key={page}
                            className={`cdp__page-btn ${currentPage === page ? 'cdp__page-btn--active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        ))}

                        {/* Last page + ellipsis */}
                        {range[range.length - 1] < totalPages && (
                          <>
                            {range[range.length - 1] < totalPages - 1 && <span className="cdp__page-ellipsis">…</span>}
                            <button className="cdp__page-btn" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                          </>
                        )}

                        {/* Next */}
                        <button
                          className="cdp__page-btn"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <Ic.ChevronRight />
                        </button>

                        <span className="cdp__page-info">Page {currentPage} of {totalPages}</span>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* ═══ ACCOUNT INFO ════════════════════════════════════════ */}
          {tab === 'accountInfo' && (
            <div className="cdp__section">
              <div className="cdp__section-header">
                <h2>Account Information</h2>
                <p>Manage your personal details</p>
              </div>
              <div className="cdp__card cdp__card--full">
                <div className="cdp__card-head">
                  <h3>Personal Information</h3>
                  <button className="cdp__btn-edit" onClick={openEdit}><Ic.Edit /> Edit Profile</button>
                </div>
                <div className="cdp__account-info-grid">
                  {[
                    { label: 'Full Name',        val: user.name },
                    { label: 'Email Address',    val: user.email || '—' },
                    { label: 'Phone Number',     val: user.phone || '—' },
                    { label: 'Address',          val: user.address || '—' },
                    { label: 'District',         val: user.district || '—' },
                    { label: 'Division',         val: user.division || '—' },
                    { label: 'Member Since',     val: user.memberSince },
                  ].map(({ label, val }) => (
                    <div className="cdp__info-block" key={label}>
                      <span className="cdp__info-label">{label}</span>
                      <span className="cdp__info-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ CHANGE PASSWORD ════════════════════════════════════ */}
          {tab === 'changePassword' && !isGoogleUser && (
            <div className="cdp__section">
              <div className="cdp__section-header">
                <h2>Change Password</h2>
                <p>Keep your account secure with a strong password</p>
              </div>
              <div className="cdp__card cdp__card--narrow">
                <form onSubmit={changePassword}>
                  {[
                    { key: 'old_password',     label: 'Current Password', showKey: 'old' },
                    { key: 'new_password',     label: 'New Password',     showKey: 'new' },
                    { key: 'confirm_password', label: 'Confirm Password', showKey: 'confirm' },
                  ].map(({ key, label, showKey }) => (
                    <div className="cdp__form-field" key={key}>
                      <label className="cdp__form-label">{label}</label>
                      <div className="cdp__pwd-wrap">
                        <input
                          type={showPwd[showKey] ? 'text' : 'password'}
                          className="cdp__form-input"
                          value={pwdForm[key]}
                          onChange={e => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          required
                          disabled={pwdSaving}
                        />
                        <button
                          type="button"
                          className="cdp__pwd-toggle"
                          onClick={() => setShowPwd(p => ({ ...p, [showKey]: !p[showKey] }))}
                        >
                          {showPwd[showKey] ? <Ic.EyeOff /> : <Ic.Eye />}
                        </button>
                      </div>
                      {key === 'new_password' && pwdForm.new_password && (
                        <div className="cdp__pwd-strength">
                          <div className="cdp__pwd-bars">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`cdp__pwd-bar ${i <= strength ? `cdp__pwd-bar--s${strength}` : ''}`} />
                            ))}
                          </div>
                          <span className="cdp__pwd-strength-label">
                            {['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="cdp__pwd-tips" />
                  <button type="submit" className="cdp__btn-primary cdp__btn-primary--full" disabled={pwdSaving}>
                    {pwdSaving ? <><span className="cdp__spinner"/> Changing…</> : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══ ADDRESSES ══════════════════════════════════════════ */}
          {tab === 'addresses' && (
            <div className="cdp__section">
              <div className="cdp__section-header">
                <h2>Saved Addresses</h2>
                <p>
                  {addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved
                  {defaultAddr && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#067d62', fontWeight: 600 }}>
                      · Default: {defaultAddr.address_title || defaultAddr.address}
                    </span>
                  )}
                </p>
              </div>

              <button className="cdp__btn-primary cdp__btn-add-addr" onClick={openAddAddress}>
                <Ic.Plus /> Add New Address
              </button>

              {addresses.length === 0 ? (
                <div className="cdp__empty-lg">
                  <Ic.MapPin />
                  <h3>No saved addresses</h3>
                  <p>Add your first delivery address.</p>
                </div>
              ) : (
                <div className="cdp__addr-grid">
                  {addresses.map(addr => {
                    const isDefault    = addr.id === defaultAddrId;
                    const isSettingDef = settingDefaultId === addr.id;
                    const divisionName = getDivisionName(addr.division_id);

                    return (
                      <div
                        key={addr.id}
                        className="cdp__addr-card"
                        style={isDefault ? {
                          border:     '2px solid #067d62',
                          background: '#f6fdf9',
                          boxShadow:  '0 0 0 3px rgba(6,125,98,0.08)',
                        } : {}}
                      >
                        {/* Card header */}
                        <div
                          className="cdp__addr-card-head"
                          style={isDefault ? { background: '#e0f5ec', borderBottom: '1px solid #b2dfdb' } : {}}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="cdp__addr-type" style={isDefault ? { color: '#04594a' } : {}}>
                              {addr.address_title || 'Address'}
                            </span>
                            {isDefault && (
                              <span style={{
                                display:      'inline-flex',
                                alignItems:   'center',
                                gap:          3,
                                fontSize:     10,
                                fontWeight:   700,
                                color:        '#067d62',
                                background:   '#b2dfdb',
                                padding:      '2px 8px',
                                borderRadius: 40,
                                lineHeight:   1.6,
                              }}>
                                <Ic.CheckCircle /> Default
                              </span>
                            )}
                          </div>
                          <span style={{ color: isDefault ? '#067d62' : '#8d9494' }}>
                            <Ic.MapPin />
                          </span>
                        </div>

                        {/* Card body */}
                        <div className="cdp__addr-body">
                          <p style={isDefault ? { color: '#04594a', fontWeight: 600 } : {}}>{addr.address}</p>
                          <p className="cdp__addr-district">{addr.district}</p>
                          {divisionName && <p className="cdp__addr-district" style={{ color: '#565959' }}>{divisionName}</p>}
                          {addr.customer?.phone && <p className="cdp__addr-phone">{addr.customer.phone}</p>}
                        </div>

                        {/* Card actions */}
                        <div
                          className="cdp__addr-actions"
                          style={isDefault ? { borderTop: '1px solid #b2dfdb', background: '#f0faf6' } : {}}
                        >
                          <button className="cdp__btn-sm" onClick={() => openEditAddress(addr)}>
                            <Ic.Edit /> Edit
                          </button>
                          <button
                            className="cdp__btn-sm cdp__btn-sm--danger"
                            onClick={() => confirmDeleteAddress(addr)}
                            disabled={isSettingDef}
                          >
                            <Ic.Trash /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══ EDIT PROFILE MODAL ══════════════════════════════════════ */}
      {showEdit && (
        <div className="cdp__modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="cdp__modal" onClick={e => e.stopPropagation()}>
            <div className="cdp__modal-head">
              <h3>Edit Profile</h3>
              <button className="cdp__modal-close" onClick={() => setShowEdit(false)}><Ic.X /></button>
            </div>
            <form onSubmit={saveProfile} className="cdp__modal-body">
              <div className="cdp__avatar-upload">
                <div className="cdp__avatar-upload-preview">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview"/>
                    : user.image
                      ? <img src={user.image} alt={user.name}/>
                      : <div className="cdp__avatar-initials cdp__avatar-initials--sm">{user.initials}</div>
                  }
                  <button type="button" className="cdp__avatar-camera" onClick={() => fileRef.current?.click()}>
                    <Ic.Camera />
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                  }}
                />
                <p className="cdp__avatar-hint">Click the camera icon to change photo</p>
              </div>

              <div className="cdp__form-grid">
                {[
                  { key: 'name',    label: 'Full Name', type: 'text'  },
                  { key: 'email',   label: 'Email',     type: 'email' },
                  { key: 'phone',   label: 'Phone',     type: 'tel'   },
                  { key: 'address', label: 'Address',   type: 'text'  },
                ].map(({ key, label, type }) => (
                  <div className="cdp__form-field" key={key}>
                    <label className="cdp__form-label">{label}</label>
                    <input
                      type={type}
                      className="cdp__form-input"
                      value={editForm[key] || ''}
                      onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                      disabled={editSaving}
                    />
                  </div>
                ))}
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Division</label>
                  <select
                    className="cdp__form-select"
                    value={editForm.division_id || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm({ ...editForm, division_id: val, district: '' });
                      loadDistrictsByDivision(val, setEditDistricts);
                    }}
                    disabled={editSaving}
                  >
                    <option value="">Select Division</option>
                    {allDivisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">District</label>
                  <select
                    className="cdp__form-select"
                    value={editForm.district || ''}
                    onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                    disabled={editSaving || !editForm.division_id}
                  >
                    <option value="">Select District</option>
                    {editDistricts.map((d, i) => (
                      <option key={i} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cdp__modal-actions">
                <button type="button" className="cdp__btn-outline" onClick={() => setShowEdit(false)} disabled={editSaving}>Cancel</button>
                <button type="submit" className="cdp__btn-primary" disabled={editSaving}>
                  {editSaving ? <><span className="cdp__spinner"/> Saving…</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ADD ADDRESS MODAL ═══════════════════════════════════════ */}
      {showAddAddr && (
        <div className="cdp__modal-overlay" onClick={() => setShowAddAddr(false)}>
          <div className="cdp__modal" onClick={e => e.stopPropagation()}>
            <div className="cdp__modal-head">
              <h3>Add New Address</h3>
              <button className="cdp__modal-close" onClick={() => setShowAddAddr(false)}><Ic.X /></button>
            </div>
            <form onSubmit={addAddress} className="cdp__modal-body">
              <div className="cdp__form-grid">
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Address Title</label>
                  <input
                    type="text"
                    className="cdp__form-input"
                    placeholder="e.g. Home, Office"
                    value={addrForm.address_title}
                    onChange={e => setAddrForm({ ...addrForm, address_title: e.target.value })}
                    required
                    disabled={addrSaving}
                  />
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Full Address</label>
                  <input
                    type="text"
                    className="cdp__form-input"
                    placeholder="Street, building..."
                    value={addrForm.address}
                    onChange={e => setAddrForm({ ...addrForm, address: e.target.value })}
                    required
                    disabled={addrSaving}
                  />
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Division</label>
                  <select
                    className="cdp__form-select"
                    value={addrForm.division_id}
                    onChange={e => {
                      const val = e.target.value;
                      setAddrForm({ ...addrForm, division_id: val, district: '' });
                      loadDistrictsByDivision(val, setAddrDistricts);
                    }}
                    required
                    disabled={addrSaving}
                  >
                    <option value="">Select Division</option>
                    {allDivisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">District</label>
                  <select
                    className="cdp__form-select"
                    value={addrForm.district}
                    onChange={e => setAddrForm({ ...addrForm, district: e.target.value })}
                    required
                    disabled={addrSaving || !addrForm.division_id}
                  >
                    <option value="">Select District</option>
                    {addrDistricts.map((d, i) => (
                      <option key={i} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="cdp__modal-actions">
                <button type="button" className="cdp__btn-outline" onClick={() => setShowAddAddr(false)} disabled={addrSaving}>Cancel</button>
                <button type="submit" className="cdp__btn-primary" disabled={addrSaving}>
                  {addrSaving ? <><span className="cdp__spinner"/> Saving…</> : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT ADDRESS MODAL ══════════════════════════════════════ */}
      {showEditAddr && (
        <div className="cdp__modal-overlay" onClick={() => !editAddrSaving && setShowEditAddr(false)}>
          <div className="cdp__modal" onClick={e => e.stopPropagation()}>
            <div className="cdp__modal-head">
              <h3>Edit Address</h3>
              <button className="cdp__modal-close" onClick={() => !editAddrSaving && setShowEditAddr(false)}><Ic.X /></button>
            </div>
            <form onSubmit={saveEditAddress} className="cdp__modal-body">

              <div className="cdp__form-grid">
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Address Title</label>
                  <input
                    type="text"
                    className="cdp__form-input"
                    placeholder="e.g. Home, Office"
                    value={editAddrForm.address_title}
                    onChange={e => setEditAddrForm({ ...editAddrForm, address_title: e.target.value })}
                    required
                    disabled={editAddrSaving}
                  />
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Full Address</label>
                  <input
                    type="text"
                    className="cdp__form-input"
                    placeholder="Street, building..."
                    value={editAddrForm.address}
                    onChange={e => setEditAddrForm({ ...editAddrForm, address: e.target.value })}
                    required
                    disabled={editAddrSaving}
                  />
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">Division</label>
                  <select
                    className="cdp__form-select"
                    value={editAddrForm.division_id}
                    onChange={e => {
                      const val = e.target.value;
                      setEditAddrForm({ ...editAddrForm, division_id: val, district: '' });
                      loadDistrictsByDivision(val, setEditAddrDistricts);
                    }}
                    required
                    disabled={editAddrSaving}
                  >
                    <option value="">Select Division</option>
                    {allDivisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="cdp__form-field">
                  <label className="cdp__form-label">District</label>
                  <select
                    className="cdp__form-select"
                    value={editAddrForm.district}
                    onChange={e => setEditAddrForm({ ...editAddrForm, district: e.target.value })}
                    required
                    disabled={editAddrSaving || !editAddrForm.division_id}
                  >
                    <option value="">Select District</option>
                    {editAddrDistricts.map((d, i) => (
                      <option key={i} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cdp__modal-actions">
                <button type="button" className="cdp__btn-outline" onClick={() => !editAddrSaving && setShowEditAddr(false)} disabled={editAddrSaving}>Cancel</button>
                <button type="submit" className="cdp__btn-primary" disabled={editAddrSaving}>
                  {editAddrSaving ? <><span className="cdp__spinner"/> Updating…</> : 'Update Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboardPage;