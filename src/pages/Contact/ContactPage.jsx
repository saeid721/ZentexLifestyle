import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import axios from 'axios';
import './ContactPage.scss';
import { API_BASE_URL } from '../../utils';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
    <path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.01l-2.2 2.21z" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────
const Spinner = () => <span className="cp-spinner" />;

const InfoItem = ({ icon, label, value, loading }) => (
  <div className="cp-info-item">
    <div className="cp-info-icon">{icon}</div>
    <div>
      <p className="cp-info-label">{label}</p>
      <p className="cp-info-value">
        {loading ? <span className="cp-info-loading">Loading…</span> : value || '—'}
      </p>
    </div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div className="cp-field">
    <label className="cp-field-label">
      {label} {required && <span className="cp-required">*</span>}
    </label>
    {children}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [focused, setFocused] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', text: '' }

  // ── Fetch contact info on mount ──
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/contact`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setContactInfo(res.data.data);
        }
      })
      .catch(() => {
        setContactInfo({
          hotline: '+88 01886 899103',
          hotmail: 'info@elonis.com.bd',
          address: 'Dhaka, Bangladesh',
        });
      })
      .finally(() => setInfoLoading(false));
  }, []);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (alert) setAlert(null);
  };

  const handleFocus = (name) => setFocused((prev) => ({ ...prev, [name]: true }));
  const handleBlur  = (name) => setFocused((prev) => ({ ...prev, [name]: false }));

  const validate = () => {
    const { name, phone, email, subject, message } = form;
    if (!name.trim() || !phone.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setAlert({ type: 'error', text: 'Please fill in all required fields.' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlert({ type: 'error', text: 'Please enter a valid email address.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));

      const res  = await axios.post(`${API_BASE_URL}/contact-message`, fd);
      const data = res.data;

      if (data?.success) {
        setAlert({
          type: 'success',
          text: data.message || "Message sent successfully! We'll be in touch soon.",
        });
        setForm({ name: '', phone: '', email: '', subject: '', message: '' });
      } else {
        setAlert({ type: 'error', text: data?.message || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Network error. Please check your connection and try again.';
      setAlert({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <main className="pdp">
      <Container className="container-1500 py-3">

        {/* Breadcrumb + Back */}
        <div className="pdp__topbar d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="pdp__breadcrumb">
              <li className="pdp__bc-item">
                <Link to="/">Home</Link>
              </li>
              <li className="pdp__bc-item">
                <span className="pdp__bc-sep">&gt;</span>
                <span className="pdp__bc-active">Contact Us</span>
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

        {/* Contact Content */}
        <div className="contact-page">

          {/* Header */}
          <div className="contact-header">
            <p className="contact-eyebrow">Get in touch</p>
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-description">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="contact-divider" />
          </div>

          {/* Grid */}
          <div className="contact-grid">

            {/* Info Card */}
            <div className="cp-info-card">
              <div className="cp-deco cp-deco--tr" />
              <div className="cp-deco cp-deco--bl" />
              <p className="cp-info-card-title">Let's talk</p>
              <p className="cp-info-card-sub">
                Reach out through any channel below — we're always happy to help.
              </p>
              <div className="cp-info-items">
                <InfoItem
                  icon={<PhoneIcon />}
                  label="Phone / Hotline"
                  value={contactInfo?.hotline || contactInfo?.phone}
                  loading={infoLoading}
                />
                <InfoItem
                  icon={<EmailIcon />}
                  label="Email"
                  value={contactInfo?.hotmail || contactInfo?.email}
                  loading={infoLoading}
                />
                <InfoItem
                  icon={<MapPinIcon />}
                  label="Address"
                  value={contactInfo?.address}
                  loading={infoLoading}
                />
              </div>
            </div>

            {/* Form Card */}
            <div className="cp-form-card">
              <form onSubmit={handleSubmit} noValidate>

                <div className="cp-form-row">
                  <Field label="Name" required>
                    <input
                      type="text"
                      name="name"
                      placeholder="Write Your full name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      className={`cp-input${focused.name ? ' cp-input--focus' : ''}`}
                    />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={handleChange}
                      onFocus={() => handleFocus('phone')}
                      onBlur={() => handleBlur('phone')}
                      className={`cp-input${focused.phone ? ' cp-input--focus' : ''}`}
                    />
                  </Field>
                </div>

                <Field label="Email" required>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    className={`cp-input${focused.email ? ' cp-input--focus' : ''}`}
                  />
                </Field>

                <Field label="Subject" required>
                  <input
                    type="text"
                    name="subject"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={handleChange}
                    onFocus={() => handleFocus('subject')}
                    onBlur={() => handleBlur('subject')}
                    className={`cp-input${focused.subject ? ' cp-input--focus' : ''}`}
                  />
                </Field>

                <Field label="Message" required>
                  <textarea
                    name="message"
                    placeholder="Write your message here…"
                    value={form.message}
                    onChange={handleChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                    className={`cp-textarea${focused.message ? ' cp-textarea--focus' : ''}`}
                  />
                </Field>

                <button type="submit" className="cp-submit-btn" disabled={submitting}>
                  {submitting && <Spinner />}
                  {submitting ? 'Sending…' : 'Send Message'}
                  {!submitting && <SendIcon />}
                </button>

                {alert && (
                  <div className={`cp-alert cp-alert--${alert.type}`}>
                    {alert.type === 'success' ? <CheckIcon /> : <AlertIcon />}
                    {alert.text}
                  </div>
                )}

              </form>
            </div>

          </div>

        </div>
      </Container>
    </main>
  );
};

export default ContactPage;