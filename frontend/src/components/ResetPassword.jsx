import { useState, useEffect } from 'react';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [token,    setToken]    = useState('');
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) setError('Invalid reset link.');
    else setToken(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Min 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const data = await resetPassword(token, password);
      if (data.error) throw new Error(data.error);
      setMsg('✓ Password reset! You can now log in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 32, width: '100%', maxWidth: 400 }}>
        <div style={{ color: '#F0C040', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>KL FITNESS</div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Set New Password</div>
        <div style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>Enter your new password below.</div>

        {msg   && <div style={{ color: '#5aaa5a', marginBottom: 16, fontSize: 13, background: 'rgba(90,170,90,0.1)', padding: '10px 14px', borderRadius: 8 }}>{msg}</div>}
        {error && <div style={{ color: '#ff6b6b', marginBottom: 16, fontSize: 13, background: 'rgba(220,50,50,0.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

        {!msg && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>New Password</label>
              <input type="password" placeholder="Min. 6 characters" value={password}
                onChange={e => setPassword(e.target.value)} disabled={loading}
                style={{ marginTop: 6, width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Confirm Password</label>
              <input type="password" placeholder="Repeat password" value={confirm}
                onChange={e => setConfirm(e.target.value)} disabled={loading}
                style={{ marginTop: 6, width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading || !token}
              style={{ background: loading ? '#333' : '#F0C040', color: '#000', fontWeight: 700, padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        {msg && (
          <button onClick={() => window.location.href = '/'}
            style={{ marginTop: 16, width: '100%', background: '#F0C040', color: '#000', fontWeight: 700, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}