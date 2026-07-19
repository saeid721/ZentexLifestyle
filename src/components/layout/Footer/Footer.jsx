import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import OptimizedImage from '../../../components/ui/OptimizedImage';
import './Footer.scss';

// Social Icons (Static)
import fbIcon from '../../../assets/icons/facebook.png';
import igIcon from '../../../assets/icons/instagram.png';
import liIcon from '../../../assets/icons/linkedin.png';
import ttIcon from '../../../assets/icons/tiktok.png';
import ytIcon from '../../../assets/icons/youtube.png';

// Payments
import sslCommerzIcon from '../../../assets/icons/sslcommerz.png';
import visaIcon from '../../../assets/icons/visa.png';
import mastercardIcon from '../../../assets/icons/mastercard.png';
import americanExpressIcon from '../../../assets/icons/american-express.png';
import bracBankIcon from '../../../assets/icons/brac-bank.png';
import cityBankIcon from '../../../assets/icons/citybank.png';
import dbblIcon from '../../../assets/icons/dbbl.png';
import bKashIcon from '../../../assets/icons/bkash.png';
import nagadIcon from '../../../assets/icons/nogod.png';
import rocketIcon from '../../../assets/icons/rocket.png';

import { useGeneralSettings } from '../../../hooks/useGeneralSettings';
import { BASE_IMAGE_URL, API_BASE_URL, getSiteBaseUrl, SCHEMA_ORG_URL, STITBD_URL, PLACEHOLDER_LOGO } from '../../../utils';

const SOCIAL_ICON_MAP = {
  facebook: fbIcon,
  instagram: igIcon,
  linkedin: liIcon,
  tiktok: ttIcon,
  youtube: ytIcon,
};

const PAYMENTS = [
  { name: 'Visa', icon: visaIcon },
  { name: 'Mastercard', icon: mastercardIcon },
  { name: 'AmericanExpress', icon: americanExpressIcon },
  // { name: 'BracBank',        icon: bracBankIcon },
  { name: 'CityBank', icon: cityBankIcon },
  { name: 'Dbbl', icon: dbblIcon },
  { name: 'bKash', icon: bKashIcon },
  { name: 'Nagad', icon: nagadIcon },
  // { name: 'Rocket',          icon: rocketIcon },
];

const Footer = () => {
  const { settings, contact, socials, loading } = useGeneralSettings();

  // ── Newsletter state ──
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subMessage, setSubMessage] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Pages (Company menu) state ──
  const [pages, setPages] = useState([]);

  const logo = settings?.dark_logo
    ? `${BASE_IMAGE_URL}/${settings.dark_logo}`
    : PLACEHOLDER_LOGO;

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const SOCIALS = socials.map((s) => {
    const key = s.title?.toLowerCase();
    return { href: s.href, label: s.title, icon: SOCIAL_ICON_MAP[key] || fbIcon };
  });

  // ── Fetch pages list from API ──
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/pages`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const sortedPages = [...res.data.data].sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
          });
          setPages(sortedPages);
        }
      })
      .catch(() => { });
  }, []);

  // ── Subscribe handler ──
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('warning', 'Please enter your email.');
      return;
    }
    setSubLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim());
      const res = await axios.post(`${API_BASE_URL}/subscribe`, formData);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Subscribed successfully!');
        setEmail('');
      } else {
        showToast('warning', res.data?.message || 'This email is already subscribed.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      showToast('error', msg);
    } finally {
      setSubLoading(false);
    }
  };

  // ── ✅ LINE 110: Build Organization + LocalBusiness JSON-LD ──
  const baseUrl = getSiteBaseUrl();

  const organizationSchema = !loading ? {
    '@context': SCHEMA_ORG_URL,
    '@type': ['Organization', 'LocalBusiness'], // ✅ both types in one schema
    name: settings?.name || 'Zentex',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: logo.startsWith('http') ? logo : `${baseUrl}${logo}`,
      name: `${settings?.name || 'Zentex'} Logo`,
    },
    // ✅ Contact info for Google Knowledge Panel
    contactPoint: contact?.phone ? {
      '@type': 'ContactPoint',
      telephone: contact.phone,
      contactType: 'customer service',
      availableLanguage: ['English', 'Bengali'],
    } : undefined,
    // ✅ Address for LocalBusiness
    address: contact?.address ? {
      '@type': 'PostalAddress',
      streetAddress: contact.address,
      addressCountry: 'BD',
    } : undefined,
    email: contact?.email || undefined,
    telephone: contact?.phone || undefined,
    // ✅ Social media sameAs — helps Google link your profiles
    sameAs: SOCIALS.filter((s) => s.href).map((s) => s.href),
  } : null;

  if (loading) return null;

  return (
    <footer className="site-footer">

      {/* ✅ LINE 145: Inject Organization + LocalBusiness schema via Helmet */}
      {organizationSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(organizationSchema)}
          </script>
        </Helmet>
      )}

      <div className="site-footer__main">
        <Container className="container-1500">
          <Row className="gy-4 py-5">

            {/* Brand + Contact */}
            <Col xs={12} sm={6} lg={3}>
              <Link to="/" className="site-footer__logo">
                {/* ✅ LINE 160: Added width/height + loading=lazy for image SEO */}
                <OptimizedImage
                  src={logo}
                  alt={`${settings?.name || 'Zentex'} logo`}
                  className="site-footer__logo-img"
                  height={48}
                  objectFit="contain"
                  objectPosition="left"
                  fallbackSrc={PLACEHOLDER_LOGO}
                  wrapperStyle={{ height: '48px', display: 'inline-block' }}
                />
              </Link>
              <ul className="site-footer__contact list-unstyled mt-3">
                {/* ✅ LINE 169: Wrapped contact in semantic microdata attributes */}
                {contact?.phone && (
                  <li>
                    <a href={`tel:${contact.phone}`} className="site-footer__contact-link">
                      📞 {contact.phone}
                    </a>
                  </li>
                )}
                {contact?.email && (
                  <li>
                    <a href={`mailto:${contact.email}`} className="site-footer__contact-link">
                      📧 {contact.email}
                    </a>
                  </li>
                )}
                {contact?.address && <li>📍 {contact.address}</li>}
              </ul>

              {/* Social */}
              <div className="site-footer__social-bottom">
                {SOCIALS.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noreferrer noopener"
                    className="site-footer__social-link-bottom"
                    aria-label={`Follow us on ${s.label}`}  // ✅ LINE 278: aria-label for accessibility + SEO
                  >
                    {/* ✅ LINE 280: Added width/height + loading=lazy to social icons */}
                    <OptimizedImage
                      src={s.icon}
                      alt={`${s.label} icon`}
                      className="site-footer__social-icon-bottom"
                      width={28}
                      height={28}
                      wrapperStyle={{ width: '28px', height: '28px', display: 'inline-block' }}
                    />
                  </a>
                ))}
              </div>
            </Col>

            {/* Useful Links */}
            <Col xs={12} sm={6} lg={3}>
              <h6 className="site-footer__heading">Useful Links</h6>
              <ul className="site-footer__links list-unstyled">
                <li><Link to="/register">Create Account</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </Col>

            {/* Help */}
            <Col xs={12} sm={6} lg={3}>
              <h6 className="site-footer__heading">Help</h6>
              <ul className="site-footer__links list-unstyled">
                {pages.map((page) => (
                  <li key={page.id}>
                    <Link to={`/page/${page.slug}`}>{page.name}</Link>
                  </li>
                ))}
              </ul>
            </Col>

            {/* Newsletter */}
            <Col xs={12} sm={6} lg={3}>
              <h6 className="site-footer__heading">Newsletter Signup</h6>
              <p className="site-footer__newsletter-text">
                Subscribe with email for exclusive offers
              </p>
              <form className="site-footer__newsletter-form" onSubmit={handleSubscribe}>
                <div className="site-footer__newsletter-input-wrapper">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSubMessage(null); }}
                    placeholder="Enter your email here..."
                    className="site-footer__newsletter-input"
                    disabled={subLoading}
                  />
                </div>
                <button
                  className="site-footer__newsletter-btn"
                  type="submit"
                  disabled={subLoading}
                >
                  {subLoading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                </button>
                {toast && (
                  <div className={`site-footer__newsletter-toast site-footer__newsletter-toast--${toast.type}`}>
                    <span className="site-footer__newsletter-toast-icon">
                      {toast.type === 'success' ? '✔' : toast.type === 'warning' ? '⚠' : '✖'}
                    </span>
                    <span className="site-footer__newsletter-toast-text">{toast.text}</span>
                  </div>
                )}
              </form>
            </Col>

            {/* Payments */}
            {/* <Col xs={12} sm={6} lg={2}>
              <div className="site-footer__heading-wrapper">
                <h6 className="site-footer__heading">Secure Payments</h6>
                <img
                  src={sslCommerzIcon}
                  alt="SSLCommerz Secured Payment"
                  className="site-footer__sslcommerz-logo"
                  width="100"
                  height="32"
                  loading="lazy"
                />
              </div>
              <div className="site-footer__payments">
                {PAYMENTS.map((p) => (
                  <span key={p.name} className="site-footer__payment-badge">
                    <img
                      src={p.icon}
                      alt={`${p.name} payment accepted`}
                      className="site-footer__payment-img"
                      width="40"
                      height="24"
                      loading="lazy"
                    />
                  </span>
                ))}
              </div>
            </Col> */}

          </Row>
        </Container>
      </div>

      {/* Bottom */}
      <div className="site-footer__bottom">
        <Container className="container-1500">
          <div className="site-footer__bottom-content">


            {/* Copyright */}
            <p className="site-footer__copyright">
              {settings?.copyright
                ? settings.copyright
                : `© ${new Date().getFullYear()} ${settings?.name || 'Zentex'} | All rights reserved`
              }{' '}
              | Powered by{' '}
              <Link to={STITBD_URL} className="site-footer__brand" target="_blank" rel="noopener noreferrer">
                STITBD
              </Link>
            </p>
            <div className="site-footer__payments">
              {PAYMENTS.map((p) => (
                <span key={p.name} className="site-footer__payment-badge">
                  {/* ✅ LINE 252: Added width/height + loading=lazy to each payment icon */}
                  <OptimizedImage
                    src={p.icon}
                    alt={`${p.name} payment accepted`}
                    className="site-footer__payment-img"
                    width={40}
                    height={24}
                    wrapperStyle={{ width: '40px', height: '24px', display: 'inline-block' }}
                  />
                </span>
              ))}
            </div>

          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;