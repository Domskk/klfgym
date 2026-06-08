import { useContext } from 'react';
import './index.css';
import LandingPage from './components/LandingPage';
import MobileApp from './components/mobile/MobileApp';
import AdminDashboard from './components/admin/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import { AuthContext } from './AuthContext';

export default function App() {
  const { user, role, loading, logout } = useContext(AuthContext);

  // ── Check for reset-password token in URL first ──────────────────────────
  const params = new URLSearchParams(window.location.search);
  if (params.get('token') && window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (loading) return null;

  return (
    <>
      {/* NOT LOGGED IN */}
      {!user && (
        <LandingPage
          onLoginSuccess={() => window.location.reload()}
          onAdminLoginSuccess={() => window.location.reload()}
        />
      )}

      {/* MEMBER VIEW */}
      {user && role === 'member' && <MobileApp onLogout={logout} />}

      {/* ADMIN VIEW */}
      {user && role === 'admin' && <AdminDashboard onLogout={logout} />}

      {/* TRAINER VIEW */}
      {user && role === 'trainer' && <AdminDashboard onLogout={logout} />}
    </>
  );
}