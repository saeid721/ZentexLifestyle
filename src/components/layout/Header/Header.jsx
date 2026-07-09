import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Offcanvas, Form, InputGroup, Button } from 'react-bootstrap';
import useCartStore from '../../../app/store';
import useDebounce from '../../../hooks/useDebounce';
import { PHONE, BASE_IMAGE_URL, API_BASE_URL, getSiteBaseUrl, SCHEMA_ORG_URL } from '../../../utils';
import { useGeneralSettings } from '../../../hooks/useGeneralSettings';
import { setAuth, getAuth, removeAuth } from '../../../utils/auth';
import axios from 'axios';
import { apiGet } from '../../../utils/api';
import './Header.scss';


// ─── Icons ───────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CategoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const CartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const LoginIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

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
    if (topBarRef.current) setSubBarTop(topBarRef.current.getBoundingClientRect().bottom);
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
      <div className="desktop-nav__top-bar" ref={topBarRef}>
        <Container fluid="xl">
          <div className="d-flex align-items-center">
            <Link
              to="/"
              className="desktop-nav__home"
              onClick={() => { closeAll(); }}
            >
              <HomeIcon />
            </Link>
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
          </div>
        </Container>
      </div>

      {activeTopItem?.children?.length > 0 && (
        <div ref={subBarRef} className="desktop-nav__sub-bar" style={{ top: subBarTop }} onMouseEnter={cancelClose}>
          <Container fluid="xl">
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
          <Container fluid="xl">
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



      {/* Divider */}
      {/* <div className="divider">
        <span>or login with Gmail</span>
      </div> */}
      {/* Google Button */}
      {/* <button
        type="button"
        className={`google-btn ${googleLoading ? 'google-btn--loading' : ''}`}
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <span className="spinner" />
        ) : (
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span>{googleLoading ? 'Connecting…' : 'Continue with Google'}</span>
      </button> */}

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

// ─── Mobile Search Overlay ────────────────────────────────────────
const MobileSearchOverlay = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActive] = useState(-1);
  const { suggestions, loading } = useSearchSuggestions(query);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => { setActive(-1); }, [suggestions]);

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

  return (
    <div className="mobile-search-overlay">
      <form onSubmit={handleSubmit} className="mobile-search-overlay__form">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mobile-search-overlay__input"
          autoComplete="off"
        />
        <button type="submit" className="mobile-search-overlay__submit" aria-label="Search"><SearchIcon /></button>
        <button type="button" className="mobile-search-overlay__close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
      </form>
      {showDropdown && (
        <div className="mobile-search-overlay__suggestions">
          <SearchDropdown
            suggestions={suggestions}
            loading={loading}
            query={query}
            onSelect={handleSelect}
            activeIndex={activeIndex}
          />
        </div>
      )}
    </div>
  );
};

// ─── Hook: fetch announcements ────────────────────────────────────
let _announcementsCache = null;
let _announcementsFetchPromise = null;

const useAnnouncements = () => {
  const [messages, setMessages] = useState(() =>
    _announcementsCache ? _announcementsCache.map((a) => a.announcement) : []
  );

  useEffect(() => {
    if (_announcementsCache) {
      setMessages(_announcementsCache.map((a) => a.announcement));
      return;
    }

    if (_announcementsFetchPromise) {
      _announcementsFetchPromise.then((msgs) => setMessages(msgs));
      return;
    }

    _announcementsFetchPromise = apiGet('/announcement')
      .then((res) => {
        if (res.data?.status && Array.isArray(res.data.data)) {
          const sorted = [...res.data.data].sort(
            (a, b) => Number(a.sl_no) - Number(b.sl_no)
          );
          _announcementsCache = sorted;
          return sorted.map((a) => a.announcement);
        }
        _announcementsCache = [];
        return [];
      })
      .catch((err) => {
        console.error('Announcements error:', err);
        _announcementsCache = [];
        return [];
      })
      .finally(() => {
        _announcementsFetchPromise = null;
      });

    _announcementsFetchPromise.then((msgs) => setMessages(msgs));
  }, []);

  return messages;
};

// ─── Announcement Top Bar ─────────────────────────────────────────
const AnnouncementBar = ({ messages = [] }) => {
  if (!messages.length) return null;

  if (messages.length === 1) {
    return (
      <div className="announcement-bar">
        <span className="announcement-bar__text">{messages[0]}</span>
      </div>
    );
  }

  return (
    <div className="announcement-bar">
      <div className="announcement-bar__track">
        {/* Duplicate for seamless loop */}
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="announcement-bar__slide">{msg}</span>
        ))}
      </div>
    </div>
  );
};


// ─── Main Header ──────────────────────────────────────────────────
const Header = () => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDesktopLogin, setShowDesktopLogin] = useState(false);
  const [showMobileLogin, setShowMobileLogin] = useState(false);

  const [authState, setAuthState] = useState(() => getAuth());

  const desktopLoginRef = useRef(null);
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const { navLinks } = useNavLinks();
  const { settings, contact } = useGeneralSettings();

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

  // ✅ REMOVED: document.title useEffect — Helmet handles this now

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
    document.body.style.overflow = showMobileSearch ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileSearch]);

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

  const announcementMessages = useAnnouncements();

  return (
    <>
      {/* ✅ NEW: Helmet — WebSite schema + SearchAction + og:site_name */}
      <Helmet>
        {/* <title>{siteName}</title> */}
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

      {/* ── Announcement Bar ── */}
      <AnnouncementBar messages={announcementMessages} />

      {showMobileSearch && <MobileSearchOverlay onClose={() => setShowMobileSearch(false)} />}

      <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>

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
            <Container>
              <div className="d-flex align-items-center justify-content-between gap-3 py-2">

                <Link to="/" className="site-header__logo" aria-label={`${siteName} home`}>
                  <LogoImg />
                </Link>

                <DesktopSearchBox
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSubmit={handleSearch}
                />

                <div className="d-flex align-items-center gap-2">
                  {/* ✅ UPDATED: phone link fixed — was linking to tel: inside <Link to=> */}
                  <a href={phoneHref} className="site-header__phone-link d-flex align-items-center gap-1">
                    📞<span className="fw-bold">{phoneDisplay}</span>
                  </a>

                  <div className="site-header__login-wrap" ref={desktopLoginRef}>
                    {authState.isAuthenticated ? (
                      <>
                        <button className="site-header__login-btn" onClick={handleDesktopLoginToggle} aria-label="My Account">
                          <LoginIcon />
                          <span className="site-header__login-label">
                            {authState.user?.name?.split(' ')[0] || 'Account'}
                          </span>
                          <svg className={`site-header__login-chevron ${showDesktopLogin ? 'site-header__login-chevron--open' : ''}`}
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {showDesktopLogin && <UserMenu onClose={handleDesktopLoginClose} position="desktop" />}
                      </>
                    ) : (
                      <>
                        <button className="site-header__login-btn" onClick={handleDesktopLoginToggle} aria-label="Login or Sign Up">
                          <LoginIcon />
                          <span className="site-header__login-label">Login | Sign Up</span>
                          <svg className={`site-header__login-chevron ${showDesktopLogin ? 'site-header__login-chevron--open' : ''}`}
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {showDesktopLogin && <LoginForm onClose={handleDesktopLoginClose} position="desktop" />}
                      </>
                    )}
                  </div>

                  <Link to="/cart" className="site-header__action site-header__cart" aria-label={`Cart (${totalItems} items)`}>
                    <CartIcon />
                    {totalItems > 0 && <span className="site-header__cart-badge">{totalItems}</span>}
                  </Link>
                </div>
              </div>
            </Container>
          </div>
          <DesktopNav navLinks={navLinks} />
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
              <p className="fw-bold mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                <a href={phoneHref}>📞 {phoneDisplay}</a>
              </p>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

      </header>

      <MobileBottomNav
        showMobileLogin={showMobileLogin}
        onMobileLoginToggle={handleMobileLoginToggle}
        onMobileLoginClose={handleMobileLoginClose}
      />
    </>
  );
};

export default Header;
