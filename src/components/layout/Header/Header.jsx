import axios from 'axios';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Offcanvas, Form, InputGroup, Button } from 'react-bootstrap';
import useCartStore from '../../../app/store';
import useDebounce from '../../../hooks/useDebounce';
import { PHONE, BASE_IMAGE_URL, API_BASE_URL, getSiteBaseUrl, SCHEMA_ORG_URL } from '../../../utils';
import { useGeneralSettings } from '../../../hooks/useGeneralSettings';
import { setAuth, getAuth, removeAuth } from '../../../utils/auth';
import ProductCard from '../../../components/ui/ProductCard/ProductCard';
import { apiGet } from '../../../utils/api';
import CartDrawer from './CartDrawer';
import './Header.scss';
import { Heart, Home, LayoutGrid, ShoppingCart, User, Search, ChevronDown, 
  ArrowLeft, ArrowRight, X, Eye, EyeOff } from "lucide-react";


// ─── Icons ───────────────────────────────────────────────────────

const WishlistIcon = () => <Heart size={22} strokeWidth={2} />;

const HomeIcon = () => <Home size={24} strokeWidth={2} />;

const CategoryIcon = () => <LayoutGrid size={24} strokeWidth={2} />;

const CartIcon = () => <ShoppingCart size={24} strokeWidth={2} />;

const LoginIcon = () => <User size={24} strokeWidth={2} />;

const SearchIcon = () => <Search size={22} strokeWidth={2.5} />;

const ChevronDownIcon = () => <ChevronDown size={12} strokeWidth={2.5} />;

const ArrowLeftIcon = () => <ArrowLeft size={18} strokeWidth={2.5} />;

const ArrowRightIcon = () => <ArrowRight size={18} strokeWidth={2.5} />;

const CloseIcon = () => <X size={20} strokeWidth={2.5} />;

const EyeOpenIcon = () => <Eye size={16} strokeWidth={1.5} />;

const EyeClosedIcon = () => <EyeOff size={16} strokeWidth={1.5} />;

// ─── Module-level category cache ─────────────────────────────────
let _navLinksCache = null;
let _navLinksFetchPromise = null;

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : str;

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = getKey(item, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ✅ FIXED: Sub-categories & child-categories sorted alphabetically (A-Z)
const buildNavLinks = (categories) =>
  uniqueBy(
    [...categories].sort((a, b) => Number(a.serial_no) - Number(b.serial_no)),
    (cat, index) => cat.id ?? `${cat.slug}-${index}`
  ).map((cat, catIndex) => ({
    key: `cat-${cat.id ?? cat.slug ?? catIndex}`,
    label: cat.name.toUpperCase(),
    href: `/categories/${cat.slug}`,
    slug: cat.slug,
    children: uniqueBy(
      [...(cat.subcategories || [])].sort((a, b) =>
        (a.subcategoryName || '').localeCompare(b.subcategoryName || '', 'en', { sensitivity: 'base' })
      ),
      (sub, subIndex) => `${cat.slug}-${sub.id ?? sub.slug ?? subIndex}`
    ).map((sub, subIndex) => ({
      key: `sub-${cat.id ?? cat.slug ?? catIndex}-${sub.id ?? sub.slug ?? subIndex}`,
      label: toTitleCase(sub.subcategoryName),
      href: `/categories/${cat.slug}/${sub.slug}`,
      slug: sub.slug,
      catSlug: cat.slug,
      children: uniqueBy(
        [...(sub.childcategories || [])].sort((a, b) =>
          (a.childcategoryName || '').localeCompare(b.childcategoryName || '', 'en', { sensitivity: 'base' })
        ),
        (child, childIndex) =>
          `${cat.slug}-${sub.slug}-${child.id ?? child.slug ?? child.childcategoryName ?? childIndex}`
      ).map((child, childIndex) => ({
        key: `child-${cat.id ?? cat.slug ?? catIndex}-${sub.id ?? sub.slug ?? subIndex}-${child.id ?? child.slug ?? childIndex}`,
        label: child.childcategoryName,
        href: `/categories/${cat.slug}/${child.slug}`,
        slug: child.slug,
        catSlug: cat.slug,
      })),
    })),
  }));

// ─── Hook: fetch categories once, cache at module level ──────────
const useNavLinks = () => {
  const [navLinks, setNavLinks] = useState(() => _navLinksCache || []);
  const [loading, setLoading] = useState(!_navLinksCache);

  useEffect(() => {
    if (_navLinksCache) {
      setNavLinks(_navLinksCache);
      setLoading(false);
      return;
    }

    if (_navLinksFetchPromise) {
      _navLinksFetchPromise.then((links) => {
        setNavLinks(links);
        setLoading(false);
      });
      return;
    }

    _navLinksFetchPromise = apiGet('/categories')
      .then((res) => {
        if (res.data.success) {
          const links = buildNavLinks(res.data.data);
          _navLinksCache = links;
          return links;
        }
        return [];
      })
      .catch((err) => {
        console.error('Nav categories error:', err);
        return [];
      })
      .finally(() => {
        _navLinksFetchPromise = null;
      });

    _navLinksFetchPromise.then((links) => {
      setNavLinks(links);
      setLoading(false);
    });
  }, []);

  return { navLinks, loading };
};

// ─── Hook: Live search with debounce ─────────────────────────────
const useSearchSuggestions = (query) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);

    const url = `${API_BASE_URL}/products/search?query=${encodeURIComponent(q)}&page=1`;

    axios
      .get(url, {
        headers: { Accept: 'application/json' },
        signal: abortRef.current.signal,
      })
      .then((res) => {
        const items = res.data?.data?.data ?? [];
        setSuggestions(items.slice(0, 6));
      })
      .catch((err) => {
        if (axios.isCancel(err) || err?.name === 'CanceledError') return;
        setSuggestions([]);
      })
      .finally(() => setLoading(false));

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
    }
  }, [query]);

  return { suggestions, loading };
};

// ─── Search Dropdown ──────────────────────────────────────────────
const SearchDropdown = ({ suggestions, loading, query, onSelect, activeIndex }) => {
  if (!query.trim() || query.trim().length < 2) return null;
  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="search-dropdown">
      {loading && (
        <div className="search-dropdown__loading">
          <span className="search-dropdown__spinner" />
          <span>Searching…</span>
        </div>
      )}
      {!loading && suggestions.map((product, i) => {
        const thumb = product.images?.[0]?.image
          ? `${BASE_IMAGE_URL}${product.images[0].image}`
          : null;

        const discount =
          product.old_price && product.new_price && product.old_price > product.new_price
            ? Math.round(((product.old_price - product.new_price) / product.old_price) * 100)
            : null;

        return (
          <button
            key={product.id}
            className={`search-dropdown__item ${activeIndex === i ? 'search-dropdown__item--active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); onSelect(product); }}
            type="button"
          >
            <div className="search-dropdown__thumb">
              {thumb
                ? <img src={thumb} alt={product.name} />
                : <div className="search-dropdown__thumb-placeholder"><SearchIcon /></div>
              }
            </div>
            <div className="search-dropdown__info">
              <span className="search-dropdown__name">{highlightMatch(product.name, query)}</span>
              <div className="search-dropdown__price-row">
                <span className="search-dropdown__price">৳{Number(product.new_price).toLocaleString('en-US')}</span>
                {product.old_price && product.old_price > product.new_price && (
                  <span className="search-dropdown__old-price">৳{Number(product.old_price).toLocaleString('en-US')}</span>
                )}
                {discount && (
                  <span className="search-dropdown__badge">{discount}% off</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {!loading && suggestions.length > 0 && (
        <div className="search-dropdown__footer">
          <SearchIcon />
          <span>Press Enter to see all results for "<strong>{query}</strong>"</span>
        </div>
      )}
    </div>
  );
};

const highlightMatch = (text, query) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="search-dropdown__highlight">{part}</mark>
      : part
  );
};

// ─── Desktop Search Box with live suggestions ─────────────────────
const DesktopSearchBox = ({ searchQuery, setSearchQuery, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActive] = useState(-1);
  const { suggestions, loading } = useSearchSuggestions(searchQuery);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const showDropdown = open && searchQuery.trim().length >= 2 && (loading || suggestions.length > 0);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showDropdown]);

  useEffect(() => { setActive(-1); }, [suggestions]);

  const handleSelect = (product) => {
    setOpen(false);
    setSearchQuery('');
    navigate(`/product/${product.slug}`);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((v) => Math.min(v + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((v) => Math.max(v - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="site-header__search-wrap flex-grow-1" style={{ position: 'relative' }}>
      <Form onSubmit={(e) => { e.preventDefault(); setOpen(false); onSubmit(e); }} className="site-header__search">
        <InputGroup>
          <Form.Control
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="site-header__search-input"
            autoComplete="off"
          />
          <Button type="submit" className="site-header__search-btn" aria-label="Search"><SearchIcon /></Button>
        </InputGroup>
      </Form>
      {showDropdown && (
        <SearchDropdown
          suggestions={suggestions}
          loading={loading}
          query={searchQuery}
          onSelect={handleSelect}
          activeIndex={activeIndex}
        />
      )}
    </div>
  );
};

// ─── Desktop Hover Nav ────────────────────────────────────────────
const DesktopNav = ({ navLinks }) => {
  const navigate = useNavigate();
  const [activeTop, setActiveTop] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [subBarTop, setSubBarTop] = useState(0);
  const [childBarTop, setChildBarTop] = useState(0);
  const navRef = useRef(null);
  const topBarRef = useRef(null);
  const subBarRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const location = useLocation();

  useEffect(() => { setActiveTop(null); setActiveSub(null); }, [location]);

  const scheduleClose = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => { setActiveTop(null); setActiveSub(null); }, 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const measureSubBarTop = useCallback(() => {
  const headerEl = document.querySelector('.site-header');
  if (headerEl) setSubBarTop(headerEl.getBoundingClientRect().bottom);
}, []);

  useEffect(() => {
    measureSubBarTop();
    window.addEventListener('scroll', measureSubBarTop, { passive: true });
    window.addEventListener('resize', measureSubBarTop);
    return () => {
      window.removeEventListener('scroll', measureSubBarTop);
      window.removeEventListener('resize', measureSubBarTop);
    };
  }, [measureSubBarTop]);

  const activeTopItem = navLinks.find((n) => n.label === activeTop);
  const activeSubItem = activeTopItem?.children?.find((c) => c.label === activeSub);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (subBarRef.current) setChildBarTop(subBarRef.current.getBoundingClientRect().bottom);
    });
    return () => cancelAnimationFrame(id);
  }, [activeSub, activeTop, subBarTop]);

  const handleTopEnter = (item) => {
    cancelClose(); measureSubBarTop();
    setActiveTop(item.children?.length ? item.label : null);
    setActiveSub(null);
  };

  const handleSubEnter = (sub) => {
    cancelClose();
    setActiveSub(sub.children?.length ? sub.label : null);
  };

  const closeAll = () => { setActiveTop(null); setActiveSub(null); };

  return (
    <div ref={navRef} className="desktop-nav" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
      <nav className="desktop-nav__list" ref={topBarRef}>
        {navLinks.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className={`desktop-nav__top-item ${activeTop === item.label ? 'desktop-nav__top-item--active' : ''}`}
            onMouseEnter={() => handleTopEnter(item)}
            onClick={() => { closeAll(); }}
          >
            {item.label}
            {item.children?.length > 0 && (
              <span className={`desktop-nav__chevron ${activeTop === item.label ? 'desktop-nav__chevron--open' : ''}`}>
                <ChevronDown />
              </span>
            )}
          </Link>
        ))}
      </nav>

      {activeTopItem?.children?.length > 0 && (
        <div ref={subBarRef} className="desktop-nav__sub-bar" style={{ top: subBarTop }} onMouseEnter={cancelClose}>
          <Container className="container-1500">
            <div className="d-flex align-items-center flex-wrap">
              {activeTopItem.children.map((sub) => (
                <Link
                  key={sub.key}
                  to={sub.href}
                  className={`desktop-nav__sub-item ${activeSub === sub.label ? 'desktop-nav__sub-item--active' : ''} ${sub.children?.length ? 'desktop-nav__sub-item--has-child' : ''}`}
                  onMouseEnter={() => handleSubEnter(sub)}
                  onClick={(e) => {
                    if (sub.children?.length) {
                      e.preventDefault();
                    } else {
                      closeAll();
                    }
                  }}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </Container>
        </div>
      )}

      {activeSubItem?.children?.length > 0 && (
        <div className="desktop-nav__child-bar" style={{ top: childBarTop }} onMouseEnter={cancelClose}>
          <Container className="container-1500">
            <div className="d-flex align-items-center flex-wrap">
              {activeSubItem.children.map((child) => (
                <Link
                  key={child.key}
                  to={child.href}
                  className="desktop-nav__child-item"
                  onClick={() => { closeAll(); }}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};


// ─── Login Form ───────────────────────────────────────────────────
const LoginForm = ({ onClose, position = 'desktop' }) => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginData.phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!loginData.password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('phone', loginData.phone.trim());
      formData.append('password', loginData.password);

      const res = await axios.post(`${API_BASE_URL}/customer/login`, formData, {
        headers: { Accept: 'application/json' },
      });

      if (res.data.success) {
        const { token, data } = res.data;
        setAuth(token, data, rememberMe);
        setSuccess('Login successful! Redirecting…');

        setTimeout(() => {
          onClose();
          navigate('/my-account');
        }, 1000);
      } else {
        setError(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422) {
        setError('Invalid phone number or password.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-dropdown login-dropdown--${position}`}>
      {position === 'mobile' && (
        <button className="login-dropdown__mobile-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      )}

      <h3 className="login-dropdown__title">Login to My Account</h3>

      {error && (
        <div className="login-dropdown__alert login-dropdown__alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="login-dropdown__alert login-dropdown__alert--success" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleLogin} noValidate>
        <div className="login-dropdown__field">
          <label className="login-dropdown__label">Mobile Number</label>
          <input
            type="tel"
            placeholder="e.g. 01886 899103"
            className="login-dropdown__input"
            value={loginData.phone}
            onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
            disabled={loading}
            autoComplete="tel"
          />
        </div>

        <div className="login-dropdown__field">
          <label className="login-dropdown__label">Password</label>
          <div className="login-dropdown__input-wrap">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Write your password"
              className="login-dropdown__input"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-dropdown__eye"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        <div className="login-dropdown__remember">
          <label className="login-dropdown__remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span> Remember me</span>
          </label>
        </div>

        <button type="submit" className="login-dropdown__btn" disabled={loading}>
          {loading ? (
            <span className="login-dropdown__spinner" aria-label="Logging in…" />
          ) : (
            'Login'
          )}
        </button>

        <div className="login-dropdown__forgot">
          <Link to="/forgot-password" onClick={onClose}>Forgot Password?</Link>
        </div>
      </form>

      <div className="login-dropdown__meta">
        <span>New customer?</span>
        <Link to="/register" onClick={onClose}>Create your account</Link>
      </div>
    </div>
  );
};


// ─── Logged-In User Menu ──────────────────────────────────────────
const UserMenu = ({ onClose, position = 'desktop' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuth();
    onClose();
    navigate('/');
  };

  const { user } = getAuth();

  return (
    <div className={`login-dropdown login-dropdown--${position}`}>
      {position === 'mobile' && (
        <button className="login-dropdown__mobile-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      )}
      <h3 className="login-dropdown__title">My Account</h3>
      <p className="login-dropdown__user-name">Hi, {user?.name || 'User'} 👋</p>
      <div className="login-dropdown__user-actions">
        <Link
          to="/my-account"
          onClick={onClose}
          className="login-dropdown__btn"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="login-dropdown__btn login-dropdown__btn--outline"
          style={{ marginTop: 8 }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};


// ─── Mobile Bottom Nav ────────────────────────────────────────────
const MobileBottomNav = ({ showMobileLogin, onMobileLoginToggle, onMobileLoginClose }) => {
  const totalItems = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const location = useLocation();
  const navigate = useNavigate();
  const loginBtnRef = useRef(null);
  const panelRef = useRef(null);

  const { isAuthenticated } = getAuth();

  useEffect(() => {
    if (!showMobileLogin) return;
    const handler = (e) => {
      const clickedBtn = loginBtnRef.current?.contains(e.target);
      const clickedPanel = panelRef.current?.contains(e.target);
      if (!clickedBtn && !clickedPanel) onMobileLoginClose();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showMobileLogin, onMobileLoginClose]);

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.search;
    return (location.pathname + location.search) === href;
  };

  const links = [
    { icon: <HomeIcon />, label: 'Home', href: '/', onClick: () => { navigate('/'); onMobileLoginClose(); } },
    { icon: <CategoryIcon />, label: 'Category', href: '/category', onClick: () => { navigate('/category'); onMobileLoginClose(); } },
    { icon: <CartIcon />, label: 'Cart', href: '/cart', badge: totalItems, onClick: () => onMobileLoginClose() },
  ];

  return (
    <>
      {showMobileLogin && <div className="mobile-login-backdrop" onClick={onMobileLoginClose} />}
      {showMobileLogin && (
        <div className="mobile-login-panel" ref={panelRef}>
          {isAuthenticated
            ? <UserMenu onClose={onMobileLoginClose} position="mobile" />
            : <LoginForm onClose={onMobileLoginClose} position="mobile" />
          }
        </div>
      )}
      <nav className="mobile-bottom-nav">
        {links.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            onClick={item.onClick}
            className={`mobile-bottom-nav__item ${isActive(item.href) ? 'mobile-bottom-nav__item--active' : ''}`}
          >
            <div className="mobile-bottom-nav__icon-wrap">
              {item.icon}
              {item.badge > 0 && <span className="mobile-bottom-nav__badge">{item.badge}</span>}
            </div>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </Link>
        ))}
        <button
          ref={loginBtnRef}
          className={`mobile-bottom-nav__item mobile-bottom-nav__btn ${showMobileLogin ? 'mobile-bottom-nav__item--active' : ''}`}
          onClick={onMobileLoginToggle}
          aria-label="Login"
        >
          <div className="mobile-bottom-nav__icon-wrap"><LoginIcon /></div>
          <span className="mobile-bottom-nav__label">{getAuth().isAuthenticated ? 'Account' : 'Login'}</span>
        </button>
      </nav>
    </>
  );
};

// ─── Mobile Accordion Item ────────────────────────────────────────
const MobileNavItem = ({ item, depth = 0, onClose }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;

  const handleLabelClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setOpen((v) => !v);
    } else {
      onClose();
    }
  };

  return (
    <div className={`mobile-nav__item mobile-nav__item--d${depth}`}>
      <div className="mobile-nav__row">
        <Link
          to={item.href}
          className="mobile-nav__link"
          onClick={handleLabelClick}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            className={`mobile-nav__toggle ${open ? 'mobile-nav__toggle--open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="expand"
          >
            <ChevronDown />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="mobile-nav__children">
          {item.children.map((child) => (
            <MobileNavItem key={child.key} item={child} depth={depth + 1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Mobile Search Overlay (Full-Screen Search Modal) ─────────────
const MobileSearchOverlay = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActive] = useState(-1);
  const { suggestions, loading } = useSearchSuggestions(query);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const trackRef = useRef(null);

  const [inspirationProducts, setInspirationProducts] = useState([]);
  const [inspirationLoading, setInspirationLoading] = useState(true);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => { setActive(-1); }, [suggestions]);

  // ✅ NEW: fetch "inspiration" (new arrival) products once, on open
  useEffect(() => {
    let cancelled = false;
    setInspirationLoading(true);

    axios
      .get(`${API_BASE_URL}/products?per_page=8`, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (cancelled) return;
        const items = res.data?.data?.data ?? res.data?.data ?? [];
        setInspirationProducts(items.slice(0, 8));
      })
      .catch(() => { if (!cancelled) setInspirationProducts([]); })
      .finally(() => { if (!cancelled) setInspirationLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const handleSelect = (product) => {
    onClose();
    navigate(`/product/${product.slug}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((v) => Math.min(v + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((v) => Math.max(v - 1, -1)); }
    else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') { onClose(); }
  };

  const showDropdown = query.trim().length >= 2 && (loading || suggestions.length > 0);

  const scrollTrack = (dir) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="search-modal">
      <button type="button" className="search-modal__close" onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className="search-modal__inner">
        <h2 className="search-modal__title">Search our site</h2>

        <form onSubmit={handleSubmit} className="search-modal__form">
          <span className="search-modal__form-icon"><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-modal__input"
            autoComplete="off"
          />
        </form>

        {showDropdown ? (
          <div className="search-modal__suggestions">
            <SearchDropdown
              suggestions={suggestions}
              loading={loading}
              query={query}
              onSelect={handleSelect}
              activeIndex={activeIndex}
            />
          </div>
        ) : (
          <div className="search-modal__inspiration">
            <h3 className="search-modal__inspiration-title">Need some inspiration?</h3>

            {!inspirationLoading && inspirationProducts.length > 0 && (
              <div className="search-modal__carousel">
                <button
                  type="button"
                  className="search-modal__nav search-modal__nav--prev"
                  onClick={() => scrollTrack(-1)}
                  aria-label="Previous"
                >
                  <ArrowLeftIcon />
                </button>

                <div className="search-modal__track" ref={trackRef}>
                  {inspirationProducts.map((product) => (
                    <div className="search-modal__card" key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="search-modal__nav search-modal__nav--next"
                  onClick={() => scrollTrack(1)}
                  aria-label="Next"
                >
                  <ArrowRightIcon />
                </button>
              </div>
            )}

            {inspirationLoading && (
              <div className="search-modal__carousel search-modal__carousel--loading">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="search-modal__card search-modal__card--skeleton" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// ─── Main Header ──────────────────────────────────────────────────
const Header = () => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerElRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDesktopLogin, setShowDesktopLogin] = useState(false);
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const wishlistCount = 0;

  const [authState, setAuthState] = useState(() => getAuth());

  const desktopLoginRef = useRef(null);
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const { navLinks } = useNavLinks();
const { settings, contact } = useGeneralSettings();

useEffect(() => {
  const setOffset = () => {
    if (isHome) {
      document.body.style.paddingTop = '';
    } else if (headerElRef.current) {
      document.body.style.paddingTop = `${headerElRef.current.offsetHeight}px`;
    }
  };
  setOffset();
  window.addEventListener('resize', setOffset);
  return () => window.removeEventListener('resize', setOffset);
}, [isHome, navLinks]);

  const logoSrc = settings?.dark_logo
    ? `${BASE_IMAGE_URL}${settings.dark_logo}`
    : settings?.white_logo
      ? `${BASE_IMAGE_URL}${settings.white_logo}`
      : null;

  const siteName = settings?.name || 'Elonis';
  const phoneDisplay = contact?.hotline || contact?.phone || PHONE;
  const phoneHref = `tel:${(contact?.hotline || contact?.phone || PHONE).replace(/\s/g, '')}`;

  // ✅ NEW LINE: baseUrl helper for schema
  const baseUrl = getSiteBaseUrl();

  const refreshAuth = useCallback(() => {
    setAuthState(getAuth());
  }, []);

  useEffect(() => {
    if (!settings?.favicon) return;
    const url = `${BASE_IMAGE_URL}${settings.favicon}`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
    const apple = document.querySelector("link[rel='apple-touch-icon']");
    if (apple) apple.href = url;
  }, [settings?.favicon]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!showDesktopLogin) return;
    const handler = (e) => {
      if (desktopLoginRef.current && !desktopLoginRef.current.contains(e.target)) {
        setShowDesktopLogin(false);
        refreshAuth();
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showDesktopLogin, refreshAuth]);

  useEffect(() => {
    document.body.style.overflow = (showMobileSearch || showCart) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileSearch, showCart]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleDesktopLoginToggle = () => { setShowDesktopLogin((v) => !v); refreshAuth(); };
  const handleDesktopLoginClose = () => { setShowDesktopLogin(false); refreshAuth(); };
  const handleMobileLoginToggle = () => { setShowMobileLogin((v) => !v); refreshAuth(); };
  const handleMobileLoginClose = () => { setShowMobileLogin(false); refreshAuth(); };

  useEffect(() => {
    const onStorage = () => refreshAuth();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshAuth]);

  // ✅ UPDATED LogoImg — added descriptive alt, width, height, fetchpriority
  const LogoImg = ({ style = {} }) =>
    logoSrc ? (
      <img
        src={logoSrc}
        alt={`${siteName} - Official Store`}
        className="site-header__logo-img"
        style={style}
        width="160"
        height="48"
        fetchpriority="high"
      />
    ) : (
      <span
        className="site-header__logo-skeleton"
        style={{ display: 'inline-block', width: 100, height: 36, background: '#eee', borderRadius: 4, ...style }}
      />
    );

  return (
    <>
      {/* ✅ NEW: Helmet — WebSite schema + SearchAction + og:site_name */}
      <Helmet>
        <meta property="og:site_name" content={siteName} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': SCHEMA_ORG_URL,
            '@type': 'WebSite',
            name: siteName,
            url: baseUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          })}
        </script>
      </Helmet>

      {showMobileSearch && <MobileSearchOverlay onClose={() => setShowMobileSearch(false)} />}

      <header
        ref={headerElRef}
        className={`site-header ${scrolled ? 'site-header--scrolled' : ''} ${isHome ? 'site-header--transparent' : ''}`}
      >

        {/* ══ MOBILE TOP BAR ══ */}
        <div className="site-header__mobile-top d-lg-none">
          <Container>
            <div className="site-header__mobile-row">
              <button className="site-header__hamburger" onClick={() => setShowOffcanvas(true)} aria-label="Open menu">
                <span /><span /><span />
              </button>
              <Link to="/" className="site-header__logo site-header__logo--mobile">
                <LogoImg />
              </Link>
              <button className="site-header__search-toggle" onClick={() => setShowMobileSearch(true)} aria-label="Search">
                <SearchIcon />
              </button>
            </div>
          </Container>
        </div>

        {/* ══ DESKTOP HEADER ══ */}
        <div className="site-header__desktop d-none d-lg-block">
          <div className="site-header__main">
            <Container className="container-1500">
              <div className="site-header__row">

                <Link to="/" className="site-header__logo" aria-label={`${siteName} home`}>
                  <LogoImg />
                </Link>

                <DesktopNav navLinks={navLinks} />

                <div className="site-header__icons">
                  <button
                    className="site-header__icon-btn"
                    onClick={() => setShowMobileSearch(true)}
                    aria-label="Search"
                  >
                    <SearchIcon />
                  </button>

                  <div className="site-header__login-wrap" ref={desktopLoginRef}>
                    <button
                      className="site-header__icon-btn"
                      onClick={handleDesktopLoginToggle}
                      aria-label={authState.isAuthenticated ? 'My Account' : 'Login or Sign Up'}
                    >
                      <LoginIcon />
                    </button>
                    {showDesktopLogin && (
                      authState.isAuthenticated
                        ? <UserMenu onClose={handleDesktopLoginClose} position="desktop" />
                        : <LoginForm onClose={handleDesktopLoginClose} position="desktop" />
                    )}
                  </div>

                  <Link to="/wishlist" className="site-header__icon-btn site-header__icon-btn--badge" aria-label="Wishlist">
                    <WishlistIcon />
                    <span className="site-header__icon-badge">{wishlistCount}</span>
                  </Link>

                  <button
                    className="site-header__icon-btn site-header__icon-btn--badge"
                    onClick={() => setShowCart(true)}
                    aria-label={`Cart (${totalItems} items)`}
                  >
                    <CartIcon />
                    <span className="site-header__icon-badge">{totalItems}</span>
                  </button>
                </div>
              </div>
            </Container>
          </div>
        </div>

        {/* ══ MOBILE OFFCANVAS ══ */}
        <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} className="site-header__offcanvas">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <LogoImg style={{ height: '36px', width: 'auto' }} />
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); setShowOffcanvas(false); }
              }}
              className="mb-3"
            >
              <InputGroup>
                <Form.Control
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="site-header__search-input"
                />
                <Button type="submit" className="site-header__search-btn" aria-label="Search"><SearchIcon /></Button>
              </InputGroup>
            </Form>
            <div className="mobile-nav">
              {navLinks.map((link) => (
                <MobileNavItem key={link.key} item={link} onClose={() => setShowOffcanvas(false)} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-top">
              {authState.isAuthenticated ? (
                <>
                  <Link to="/my-account" className="site-header__offcanvas-link d-block mb-2" onClick={() => setShowOffcanvas(false)}>
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => { removeAuth(); refreshAuth(); setShowOffcanvas(false); navigate('/'); }}
                    className="site-header__offcanvas-link d-block mb-2 btn btn-link p-0 text-start"
                    style={{ border: 'none', background: 'none' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="site-header__offcanvas-link d-block mb-2" onClick={() => setShowOffcanvas(false)}>
                  Login | Sign Up
                </Link>
              )}
            </div>
          </Offcanvas.Body>
        </Offcanvas>

      </header>

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}

      <MobileBottomNav
        showMobileLogin={showMobileLogin}
        onMobileLoginToggle={handleMobileLoginToggle}
        onMobileLoginClose={handleMobileLoginClose}
      />
    </>
  );
};

export default Header;