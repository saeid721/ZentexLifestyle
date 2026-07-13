import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import './ForgotPasswordPage.scss';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Contact Input, 2: OTP Verify, 3: New Password
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [formData, setFormData] = useState({
    contact: '',           // email or mobile
    contactType: '',       // 'email' or 'mobile'
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const otpInputRefs = useRef([]);

  // Validate email format
  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate mobile number (10-15 digits)
  const isValidMobile = (mobile) => {
    const regex = /^[0-9]{10,15}$/;
    return regex.test(mobile);
  };

  // Detect contact type and validate
  const validateContact = (contact) => {
    if (isValidEmail(contact)) return 'email';
    if (isValidMobile(contact)) return 'mobile';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Handle OTP input change (auto-focus next box)
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    
    const otpArray = formData.otp.split('');
    otpArray[index] = value;
    const newOtp = otpArray.join('');
    setFormData((prev) => ({ ...prev, otp: newOtp }));
    
    // Auto focus next input
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle OTP input paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (paste.length === 6) {
      setFormData((prev) => ({ ...prev, otp: paste }));
      // Focus last input for submission
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus();
      }
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const contactType = validateContact(formData.contact);
    
    if (!contactType) {
      setError('Please enter a valid email address or mobile number');
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await api.sendOtp({ contact: formData.contact, type: contactType });
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setFormData((prev) => ({ ...prev, contactType }));
      setStep(2);
      setTimer(30); // 30 seconds cooldown for resend
      setSuccessMsg(`OTP sent to ${formData.contact}`);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      // await api.verifyOtp({ contact: formData.contact, otp: formData.otp });
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setStep(3);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      // await api.resetPassword({ 
      //   contact: formData.contact, 
      //   otp: formData.otp, 
      //   newPassword: formData.newPassword 
      // });
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSuccessMsg('Password reset successful! Redirecting to sign in...');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setError('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Replace with actual API call
      // await api.sendOtp({ contact: formData.contact, type: formData.contactType });
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setTimer(30);
      setSuccessMsg('OTP resent successfully!');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Contact Input
  const renderContactStep = () => (
    <Form onSubmit={handleSendOtp}>
      <Row className="g-3">
        <Col xs={12}>
          <Form.Label>Enter Email or Mobile Number</Form.Label>
          <Form.Control
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="example@email.com or 017XXXXXXXX"
            required
            disabled={loading}
            isInvalid={!!error && !validateContact(formData.contact) && formData.contact !== ''}
          />
          <Form.Text className="text-muted">
            We'll send a verification code to this contact
          </Form.Text>
          <Form.Control.Feedback type="invalid">
            Please enter a valid email or 10-15 digit mobile number
          </Form.Control.Feedback>
        </Col>

        {error && (
          <Col xs={12}>
            <div className="alert alert-danger mb-0 py-2" role="alert">
              {error}
            </div>
          </Col>
        )}

        <Col xs={12}>
          <button 
            type="submit" 
            className="forgot-password-page__submit-btn mt-3 w-100"
            disabled={loading || !formData.contact.trim()}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </Col>
      </Row>
    </Form>
  );

  // Render Step 2: OTP Verification
  const renderOtpStep = () => (
    <Form onSubmit={handleVerifyOtp}>
      <Row className="g-3">
        <Col xs={12}>
          <Form.Label>Enter 6-Digit OTP</Form.Label>
          <div className="otp-inputs d-flex justify-content-center gap-2 my-3">
            {[...Array(6)].map((_, index) => (
              <Form.Control
                key={index}
                ref={(el) => (otpInputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-input text-center"
                value={formData.otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                disabled={loading}
              />
            ))}
          </div>
          <div className="text-center">
            <small className="text-muted">
              Didn't receive code?{' '}
              {timer > 0 ? (
                <span>Resend in {timer}s</span>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-link p-0" 
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </small>
          </div>
        </Col>

        {error && (
          <Col xs={12}>
            <div className="alert alert-danger mb-0 py-2" role="alert">
              {error}
            </div>
          </Col>
        )}

        {successMsg && step === 2 && (
          <Col xs={12}>
            <div className="alert alert-success mb-0 py-2" role="alert">
              {successMsg}
            </div>
          </Col>
        )}

        <Col xs={12}>
          <button 
            type="submit" 
            className="forgot-password-page__submit-btn mt-3 w-100"
            disabled={loading || formData.otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </Col>

        <Col xs={12} className="text-center">
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => {
              setStep(1);
              setFormData((prev) => ({ ...prev, otp: '' }));
              setError('');
            }}
            disabled={loading}
          >
            ← Change contact method
          </button>
        </Col>
      </Row>
    </Form>
  );

  // Render Step 3: New Password
  const renderPasswordStep = () => (
    <Form onSubmit={handleResetPassword}>
      <Row className="g-3">
        <Col xs={12}>
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            minLength={6}
            required
            disabled={loading}
          />
        </Col>

        <Col xs={12}>
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            minLength={6}
            required
            disabled={loading}
            isInvalid={formData.confirmPassword && formData.newPassword !== formData.confirmPassword}
          />
          <Form.Control.Feedback type="invalid">
            Passwords do not match
          </Form.Control.Feedback>
        </Col>

        {error && (
          <Col xs={12}>
            <div className="alert alert-danger mb-0 py-2" role="alert">
              {error}
            </div>
          </Col>
        )}

        {successMsg && step === 3 && (
          <Col xs={12}>
            <div className="alert alert-success" role="alert">
              {successMsg}
            </div>
          </Col>
        )}

        <Col xs={12}>
          <button 
            type="submit" 
            className="forgot-password-page__submit-btn mt-3 w-100"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </Col>
      </Row>
    </Form>
  );

  return (
    <main className="pdp">
      <Container className="container-1500 py-3">
        
        {/* ── Breadcrumb + Back ── */}
        <div className="pdp__topbar d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb pdp__breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">Forgot Password</li>
            </ol>
          </nav>
          <Link to="/" className="pdp__back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back To Home
          </Link>
        </div>
        
        <div className="forgot-password-page__header text-center">
          <h2 className="forgot-password-page__title">
            {step === 1 && 'Reset your password'}
            {step === 2 && 'Verify your identity'}
            {step === 3 && 'Create new password'}
          </h2>
          <p className="forgot-password-page__subtitle">
            {step === 1 && 'Enter your email or mobile number to receive an OTP'}
            {step === 2 && `Enter the 6-digit code sent to ${formData.contact}`}
            {step === 3 && 'Enter your new password below'}
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          <Col xs={12} lg={6}>
            <div className="forgot-password-page__form-card">
              
              {/* Progress Steps */}
              <div className="forgot-password-steps d-flex justify-content-center mb-4">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div className={`step-circle ${step >= s ? 'active' : ''}`}>
                      {step > s ? '✓' : s}
                    </div>
                    {s < 3 && <div className={`step-line ${step > s ? 'active' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>

              {step === 1 && renderContactStep()}
              {step === 2 && renderOtpStep()}
              {step === 3 && renderPasswordStep()}
              
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default ForgotPasswordPage;