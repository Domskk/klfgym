import React, { useState } from 'react';
import { loginUser, forgotPassword } from '../services/api';
import { signInWithGoogle } from '../supabase';
import './Login.css';

// ─── Eye icons ────────────────────────────────────────────────────────────────
const EyeOpen  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClosed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ─── Google button ────────────────────────────────────────────────────────────
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
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  );
}

// ─── Forgot Password modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleReset(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      const data = await forgotPassword(email);
      if (data.error) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-overlay" onClick={onClose}>
      <div className="forgot-modal" onClick={e => e.stopPropagation()}>
        <button className="forgot-close" onClick={onClose}>×</button>

        {sent ? (
          <div className="forgot-success">
            <div className="forgot-success__icon">📧</div>
            <h3>Check your inbox!</h3>
            <p>We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.</p>
            <button className="login-cta" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h3 className="forgot-title">Reset your password</h3>
            <p className="forgot-sub">Enter your account email and we'll send you a reset link.</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleReset} className="forgot-form">
              <label className="forgot-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="login-input"
                disabled={loading}
              />
              <button className="login-cta" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onClose, onSwitchToSignup, onLoginSuccess }) {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot,  setShowForgot]  = useState(false);

  // ── Email / password login ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!email || !password) { setError('Please enter email and password.'); setLoading(false); return; }
    try {
      const res = await loginUser(email, password);
      if (res?.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setEmail(''); setPassword('');
        onClose(); onLoginSuccess?.();
      } else {
        setError(res?.error || 'Invalid email or password.');
      }
    } catch { setError('Server error. Please try again later.'); }
    finally   { setLoading(false); }
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try {
      const { error: err } = await signInWithGoogle();
      if (err) { setError(err.message || 'Google login failed.'); setGoogleLoading(false); }
      // On success Supabase redirects — no need to handle further here
    } catch { setError('Google login error.'); setGoogleLoading(false); }
  }

  return (
    <>
      <div className="login-overlay">
        <div className="login-modal">
          <button className="login-close" type="button" onClick={onClose}>×</button>

          <div className="login-card">
            {/* Left panel */}
            <div className="login-left">
              <h1>Welcome Back!</h1>
              <p>Sign in to access your fitness dashboard, track progress, and manage your membership.</p>
            </div>

            {/* Right panel */}
            <div className="login-right">
              <div className="login-inner">
                <div className="login-header">
                  <div className="login-brand">KL FITNESS</div>
                  <div className="login-title">Log in to your account</div>
                  <div className="login-subtitle">Enter your credentials below</div>
                </div>

                {/* Google button */}
                <GoogleBtn onClick={handleGoogle} loading={googleLoading} />

                <div className="login-divider"><span>or continue with email</span></div>

                <form className="login-form" onSubmit={handleSubmit}>
                  {error && <div className="login-error">{error}</div>}

                  <div className="login-form-group">
                    <label htmlFor="login-email">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@gmail.com"
                      className="login-input"
                      disabled={loading}
                    />
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="login-password">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        id="login-password"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="login-input"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPw(p => !p)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOpen /> : <EyeClosed />}
                      </button>
                    </div>
                  </div>

                  <div className="login-forgot">
                    <button type="button" className="login-small-link" onClick={() => setShowForgot(true)}>
                      Forgot Password?
                    </button>
                  </div>

                  <button className="login-cta" type="submit" disabled={loading || googleLoading}>
                    {loading ? 'Logging in…' : 'Login'}
                  </button>
                </form>

                <div className="login-footer">
                  Don't have an account?{' '}
                  <button type="button" className="login-link-btn" onClick={onSwitchToSignup}>
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}

export default Login;