import React, { useState } from 'react';
import { loginUser } from '../services/api'; // NEW
import './AdminLogin.css';

function AdminLogin({ onClose, onAdminSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await loginUser(email, password);

      // backend must return role
      if (res.token && res.user) {
        if (res.user.role !== 'admin') {
          setError('Unauthorized admin account.');
          setLoading(false);
          return;
        }

        // store auth
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        alert(`Admin logged in as ${res.user.email}`);

        setEmail('');
        setPassword('');

        onClose();
        onAdminSuccess?.();
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <button className="admin-login-close" type="button" onClick={onClose}>×</button>
        
        <div className="login-card">
          <div className="login-right">
            <div className="login-inner">
              <div className="login-header">
                <div className="login-brand">KL FITNESS</div>
                <div className="login-title">Log in to Admin Account</div>
                <div className="login-subtitle">Enter your email and password</div>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                {error && <div className="login-error">{error}</div>}

                <div className="login-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="login-input"
                    disabled={loading}
                  />
                </div>

                <div className="login-form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    disabled={loading}
                  />
                </div>

                <div className="login-forgot">
                  <a href="#" className="login-small-link">
                    Forgot Password?
                  </a>
                </div>

                <button className="login-cta" type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>

          <div className="login-left">
            <h1>Welcome Back Admin!</h1>
            <p>You can login to access with your existing account.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;