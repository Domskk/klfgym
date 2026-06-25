import { useContext } from 'react';
import './index.css';
import LandingPage from './components/LandingPage';
import MobileApp from './components/mobile/MobileApp';
import AdminDashboard from './components/admin/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import AuthCallback from './components/AuthCallback';
import { AuthContext } from './AuthContext';

export default function App() {
  const { user, role, loading, logout } = useContext(AuthContext);

  const params   = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;

  // ── Reset password page ───────────────────────────────────────────────────
  if (params.get('token') && pathname === '/reset-password') {
    return <ResetPassword />;
  }

  // ── Google OAuth callback ─────────────────────────────────────────────────
  if (pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  if (loading) return null;

  return (
    <>
      {!user && (
        <LandingPage
          onLoginSuccess={() => window.location.reload()}
          onAdminLoginSuccess={() => window.location.reload()}
        />
      )}
      {user && role === 'member'  && <MobileApp onLogout={logout} />}
      {user && role === 'admin'   && <AdminDashboard onLogout={logout} />}
      {user && role === 'trainer' && <AdminDashboard onLogout={logout} />}
    </>
  );
}