import { useEffect } from 'react';
import { supabase } from '../supabase';
import { API_URL } from '../services/api';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          window.location.href = '/';
          return;
        }

        const googleUser = session.user;

        // Try to login first (user may already exist)
        const loginRes = await fetch(`${API_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:     googleUser.email,
            full_name: googleUser.user_metadata?.full_name || googleUser.email,
            google_id: googleUser.id,
          }),
        });

        const data = await loginRes.json();

        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        } else {
          console.error('Google login failed:', data.error);
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        window.location.href = '/';
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ color: '#F0C040', fontSize: 20, fontWeight: 700 }}>KL FITNESS</div>
      <div style={{ color: '#666', fontSize: 13 }}>Signing you in with Google…</div>
    </div>
  );
}