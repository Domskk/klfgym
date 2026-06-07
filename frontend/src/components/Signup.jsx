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

function Signup({ onClose, onSwitchToLogin }) {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree,           setAgree]           = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!agree) { setError('Please agree to the terms & conditions.'); return; }
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

  return (
    <div className="signup-overlay">
      <div className="signup-modal">
        <button className="signup-close" type="button" onClick={onClose}>×</button>

        <div className="signup-card">
          {/* Left panel */}
          <div className="signup-left">
            <h1>Welcome to KL FITNESS!</h1>
            <p>Sign up to start your fitness journey, book trainers, and manage your membership — all in one place.</p>
          </div>

          {/* Right panel */}
          <div className="signup-right">
            <div className="signup-inner">
              <div className="signup-header">
                <div className="signup-brand">KL FITNESS</div>
                <div className="signup-title">Create your account</div>
                <div className="signup-subtitle">Enter your information below</div>
              </div>

              {/* Google button */}
              <GoogleBtn onClick={handleGoogle} loading={googleLoading} />

              <div className="signup-divider"><span>or sign up with email</span></div>

              <form className="signup-form" onSubmit={handleSubmit}>
                {error && <div className="signup-error">{error}</div>}

                <div className="signup-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Your full name"
                    className="signup-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="signup-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="signup-input"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="signup-form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="signup-input"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>

                <div className="signup-form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="signup-input"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirm(p => !p)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOpen /> : <EyeClosed />}
                    </button>
                  </div>
                </div>

                <div className="signup-actions">
                  <input
                    type="checkbox"
                    id="agree-checkbox"
                    checked={agree}
                    onChange={() => setAgree(a => !a)}
                  />
                  <label htmlFor="agree-checkbox">
                    I agree to the <span className="signup-link">terms &amp; conditions</span>
                  </label>
                </div>

                <button type="submit" className="signup-cta" disabled={loading || googleLoading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="signup-footer">
                Already have an account?{' '}
                <button type="button" className="signup-link-btn" onClick={onSwitchToLogin}>
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;