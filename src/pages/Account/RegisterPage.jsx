import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './RegisterPage.scss';
import { API_BASE_URL } from '../../utils';
import { setAuth } from '../../utils/auth';


const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const errorMsg = params.get('error');
  
      if (errorMsg) {
        setError('Google authentication failed. Please try again.');
        navigate('/register', { replace: true });
        return;
      }
  
      if (token) {
        try {
          // Fetch user profile using the token
          const API = API_BASE_URL;
          const profileRes = await fetch(`${API}/customer/profile`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          const profileData = await profileRes.json();
          const userData = profileData?.data || profileData?.user || null;
      
          // Use setAuth so header + session work correctly
          setAuth(token, { ...userData, provider: 'google' }, true); // rememberMe=true for Google users
      
          setSuccessMessage('Successfully signed in with Google!');
          window.history.replaceState({}, document.title, '/');
          setTimeout(() => {
            navigate('/my-account', { replace: true });
          }, 1000);
        } catch (err) {
          console.error(err);
          setError('Failed to complete Google sign in.');
        }
      }
    };
  
    handleGoogleCallback();
  }, [location.search]); // ✅ THIS IS KEY

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!/^\d{10,15}$/.test(formData.mobile)) {
      setError('Please enter a valid mobile number (10-15 digits)');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.mobile);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);

      const response = await fetch(`${API_BASE_URL}/customer/register`, {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      setSuccessMessage('Account created successfully! Redirecting…');
      setFormData({ name: '', mobile: '', email: '', password: '' });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <main className="rp">
      {/* Ambient background blobs */}
      <div className="rp__blob rp__blob--1" />
      <div className="rp__blob rp__blob--2" />

      <Container className="container-1500 rp__container">
        {/* Topbar */}
        <div className="rp__topbar">
          <nav aria-label="breadcrumb">
            <ol className="rp__breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li className="rp__breadcrumb-sep">›</li>
              <li className="rp__breadcrumb-active">Register</li>
            </ol>
          </nav>
          <Link to="/" className="rp__back-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="rp__card-wrap">
          <div className="rp__card">

            {/* Header */}
            <div className="rp__card-header">
              <h1 className="rp__title">Create Account</h1>
              <p className="rp__subtitle">Join Elonis — shop smarter, live better</p>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="rp__alert rp__alert--success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {successMessage}
              </div>
            )}
            {error && (
              <div className="rp__alert rp__alert--error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Google Button */}
            <button
              type="button"
              className={`rp__google-btn ${googleLoading ? 'rp__google-btn--loading' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span className="rp__spinner" />
              ) : (
                <svg className="rp__google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Connecting…' : 'Continue with Google'}</span>
              {!googleLoading && (
                <span className="rp__google-badge">Sign in or Register</span>
              )}
            </button>

            <p className="rp__google-hint">
              Instantly sign in or create a new account with your Google email — no password needed
            </p>

            {/* Divider */}
            <div className="rp__divider">
              <span>or register with phone & email</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="rp__form" noValidate>

              {/* Full Name */}
              <div className={`rp__field ${focusedField === 'name' ? 'rp__field--focused' : ''} ${formData.name ? 'rp__field--filled' : ''}`}>
                <label className="rp__label" htmlFor="reg-name">Full Name</label>
                <div className="rp__input-wrap">
                  <svg className="rp__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your full name"
                    required
                    disabled={loading || googleLoading}
                    className="rp__input"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className={`rp__field ${focusedField === 'mobile' ? 'rp__field--focused' : ''} ${formData.mobile ? 'rp__field--filled' : ''}`}>
                <label className="rp__label" htmlFor="reg-mobile">Mobile Number</label>
                <div className="rp__input-wrap">
                  <svg className="rp__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/>
                  </svg>
                  <input
                    id="reg-mobile"
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('mobile')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="01XXXXXXXXX"
                    pattern="[0-9]{10,15}"
                    required
                    disabled={loading || googleLoading}
                    className="rp__input"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Email */}
              <div className={`rp__field ${focusedField === 'email' ? 'rp__field--focused' : ''} ${formData.email ? 'rp__field--filled' : ''}`}>
                <label className="rp__label" htmlFor="reg-email">Email Address</label>
                <div className="rp__input-wrap">
                  <svg className="rp__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    required
                    disabled={loading || googleLoading}
                    className="rp__input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`rp__field ${focusedField === 'password' ? 'rp__field--focused' : ''} ${formData.password ? 'rp__field--filled' : ''}`}>
                <label className="rp__label" htmlFor="reg-password">Password</label>
                <div className="rp__input-wrap">
                  <svg className="rp__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                  </svg>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                    disabled={loading || googleLoading}
                    className="rp__input rp__input--pw"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="rp__pw-toggle"
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {/* Password strength */}
                {formData.password.length > 0 && (
                  <div className="rp__pw-strength">
                    {[1,2,3,4].map(i => {
                      let score = 0;
                      if (formData.password.length >= 6) score++;
                      if (formData.password.length >= 10) score++;
                      if (/[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password)) score++;
                      if (/[^A-Za-z0-9]/.test(formData.password)) score++;
                      return (
                        <div key={i} className={`rp__pw-bar ${i <= score ? `rp__pw-bar--${score}` : ''}`} />
                      );
                    })}
                    <span className="rp__pw-label">
                      {(() => {
                        let score = 0;
                        if (formData.password.length >= 6) score++;
                        if (formData.password.length >= 10) score++;
                        if (/[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password)) score++;
                        if (/[^A-Za-z0-9]/.test(formData.password)) score++;
                        return ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || 'Weak';
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rp__submit-btn"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <><span className="rp__spinner rp__spinner--sm" /> Creating Account…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            {/* <p className="rp__footer-text">
              Already have an account?{' '}
              <Link to="/login" className="rp__footer-link">Sign In</Link>
            </p> */}

            {/* <p className="rp__terms">
              By creating an account you agree to our{' '}
              <Link to="/page/terms-and-conditions">Terms</Link>
              {' '}and{' '}
              <Link to="/page/privacy-policy">Privacy Policy</Link>
            </p> */}
          </div>
        </div>
      </Container>
    </main>
  );
};

export default RegisterPage;