import React, { useState } from 'react';
import { registerUser } from '../services/api';
import { signInWithGoogle } from '../supabase';
import './Signup.css';

const EyeOpen  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClosed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

function GoogleBtn({ onClick, loading }) {
  return (
    <button type="button" className="google-btn" onClick={onClick} disabled={loading}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {loading ? 'Redirecting…' : 'Sign up with Google'}
    </button>
  );
}

// ─── Terms Modal ──────────────────────────────────────────────────────────────
function TermsModal({ onClose, onAccept }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: '#111', border: '1px solid #333', borderRadius: 14,
        width: '100%', maxWidth: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #222',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#F0C040', fontWeight: 700, fontSize: 16 }}>Terms & Conditions</div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>KL Fitness Gym Management System</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, color: '#aaa', fontSize: 13, lineHeight: 1.8 }}>
          <p><strong style={{ color: '#fff' }}>1. Membership Agreement</strong><br />
          By registering, you agree to abide by KL Fitness gym rules and policies. Membership is personal and non-transferable.</p>

          <p><strong style={{ color: '#fff' }}>2. Use of Facilities</strong><br />
          Members must use gym equipment responsibly and safely. KL Fitness is not liable for injuries resulting from improper use of equipment.</p>

          <p><strong style={{ color: '#fff' }}>3. Personal Data</strong><br />
          We collect your name, email, and attendance data to manage your membership and improve our services. Your data will not be shared with third parties without your consent.</p>

          <p><strong style={{ color: '#fff' }}>4. QR Code Check-in</strong><br />
          Your QR code is personal and must not be shared. Misuse of QR codes may result in membership suspension.</p>

          <p><strong style={{ color: '#fff' }}>5. Membership Cancellation</strong><br />
          Memberships may be cancelled by admin in cases of rule violations. Refunds are subject to gym policy.</p>

          <p><strong style={{ color: '#fff' }}>6. Trainer Bookings</strong><br />
          Booking a trainer session is subject to availability. Cancellations must be made 24 hours in advance.</p>

          <p><strong style={{ color: '#fff' }}>7. Account Security</strong><br />
          You are responsible for maintaining the confidentiality of your account credentials. Report any unauthorized access immediately.</p>

          <p><strong style={{ color: '#fff' }}>8. Changes to Terms</strong><br />
          KL Fitness reserves the right to update these terms at any time. Continued use of the system constitutes acceptance of updated terms.</p>

          <p style={{ color: '#555', fontSize: 11, marginTop: 16 }}>Last updated: June 2026</p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #222',
          display: 'flex', gap: 10,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: '1px solid #333',
            color: '#666', fontSize: 13,
          }}>Decline</button>
          <button onClick={onAccept} style={{
            flex: 2, padding: '10px', borderRadius: 8, cursor: 'pointer',
            background: '#F0C040', color: '#000',
            fontSize: 13, fontWeight: 700, border: 'none',
          }}>I Accept the Terms</button>
        </div>
      </div>
    </div>
  );
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateSignup({ username, email, password, confirmPassword, agree }) {
  if (!username.trim())
    return 'Full name is required.';
  if (username.trim().length < 2)
    return 'Full name must be at least 2 characters.';
  if (!/^[a-zA-Z\s'-]+$/.test(username.trim()))
    return 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
  if (!email.trim())
    return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Please enter a valid email address.';
  if (!password)
    return 'Password is required.';
  if (password.length < 8)
    return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password))
    return 'Password must contain at least one number.';
  if (password !== confirmPassword)
    return 'Passwords do not match.';
  if (!agree)
    return 'Please agree to the Terms & Conditions to continue.';
  return null;
}

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= strength ? colors[strength] : '#2a2a2a',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[strength] }}>
        {labels[strength]}
      </div>
    </div>
  );
}

// ─── Signup ───────────────────────────────────────────────────────────────────
function Signup({ onClose, onSwitchToLogin }) {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree,           setAgree]           = useState(false);
  const [error,           setError]           = useState('');
  const [fieldErrors,     setFieldErrors]     = useState({});
  const [loading,         setLoading]         = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [showTerms,       setShowTerms]       = useState(false);

  // ── Real-time field validation ──────────────────────────────────────────────
  const validateField = (name, value) => {
    let err = '';
    if (name === 'username') {
      if (!value.trim()) err = 'Full name is required.';
      else if (value.trim().length < 2) err = 'Min 2 characters.';
      else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) err = 'Letters only.';
    }
    if (name === 'email') {
      if (!value.trim()) err = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) err = 'Invalid email.';
    }
    if (name === 'password') {
      if (!value) err = 'Password is required.';
      else if (value.length < 8) err = 'Min 8 characters.';
      else if (!/[A-Z]/.test(value)) err = 'Needs uppercase letter.';
      else if (!/[0-9]/.test(value)) err = 'Needs a number.';
    }
    if (name === 'confirmPassword') {
      if (value !== password) err = 'Passwords do not match.';
    }
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validationError = validateSignup({ username, email, password, confirmPassword, agree });
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const res = await registerUser(username, email, password);
      if (res.user || res.token) {
        alert('Account created successfully! Please log in.');
        onClose();
        onSwitchToLogin();
      } else {
        setError(res.error || res.message || 'Signup failed. Try again.');
      }
    } catch { setError('Server error. Please try again.'); }
    finally   { setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try {
      const { error: err } = await signInWithGoogle();
      if (err) { setError(err.message || 'Google signup failed.'); setGoogleLoading(false); }
    } catch { setError('Google signup error.'); setGoogleLoading(false); }
  }

  const inputStyle = (fieldName) => ({
    width: '100%',
    boxSizing: 'border-box',
    border: fieldErrors[fieldName] ? '1px solid #ef4444' : undefined,
  });

  return (
    <>
      <div className="signup-overlay">
        <div className="signup-modal">
          <button className="signup-close" type="button" onClick={onClose}>×</button>

          <div className="signup-card">
            <div className="signup-left">
              <h1>Welcome to KL FITNESS!</h1>
              <p>Sign up to start your fitness journey, book trainers, and manage your membership — all in one place.</p>
            </div>

            <div className="signup-right">
              <div className="signup-inner">
                <div className="signup-header">
                  <div className="signup-brand">KL FITNESS</div>
                  <div className="signup-title">Create your account</div>
                  <div className="signup-subtitle">Enter your information below</div>
                </div>

                <GoogleBtn onClick={handleGoogle} loading={googleLoading} />
                <div className="signup-divider"><span>or sign up with email</span></div>

                <form className="signup-form" onSubmit={handleSubmit}>
                  {error && <div className="signup-error">{error}</div>}

                  {/* Full Name */}
                  <div className="signup-form-group">
                    <label>Full Name</label>
                    <input
                      type="text" value={username}
                      onChange={e => { setUsername(e.target.value); validateField('username', e.target.value); }}
                      placeholder="Your full name"
                      className="signup-input" style={inputStyle('username')}
                      disabled={loading}
                    />
                    {fieldErrors.username && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{fieldErrors.username}</div>}
                  </div>

                  {/* Email */}
                  <div className="signup-form-group">
                    <label>Email</label>
                    <input
                      type="email" value={email}
                      onChange={e => { setEmail(e.target.value); validateField('email', e.target.value); }}
                      placeholder="user@gmail.com"
                      className="signup-input" style={inputStyle('email')}
                      disabled={loading}
                    />
                    {fieldErrors.email && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{fieldErrors.email}</div>}
                  </div>

                  {/* Password */}
                  <div className="signup-form-group">
                    <label>Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); validateField('password', e.target.value); }}
                        placeholder="••••••••"
                        className="signup-input" style={inputStyle('password')}
                        disabled={loading}
                      />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <EyeOpen /> : <EyeClosed />}
                      </button>
                    </div>
                    {fieldErrors.password && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{fieldErrors.password}</div>}
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm Password */}
                  <div className="signup-form-group">
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
                        placeholder="••••••••"
                        className="signup-input" style={inputStyle('confirmPassword')}
                        disabled={loading}
                      />
                      <button type="button" className="password-toggle-btn" onClick={() => setShowConfirm(p => !p)}>
                        {showConfirm ? <EyeOpen /> : <EyeClosed />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{fieldErrors.confirmPassword}</div>}
                  </div>

                  {/* Terms checkbox */}
                  <div className="signup-actions">
                    <input
                      type="checkbox" id="agree-checkbox"
                      checked={agree} onChange={() => setAgree(a => !a)}
                    />
                    <label htmlFor="agree-checkbox">
                      I agree to the{' '}
                      <span
                        className="signup-link"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                      >
                        Terms &amp; Conditions
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="signup-cta" disabled={loading || googleLoading}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>

                <div className="signup-footer">
                  Already have an account?{' '}
                  <button type="button" className="signup-link-btn" onClick={onSwitchToLogin}>Log In</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTerms && (
        <TermsModal
          onClose={() => setShowTerms(false)}
          onAccept={() => { setAgree(true); setShowTerms(false); }}
        />
      )}
    </>
  );
}

export default Signup;