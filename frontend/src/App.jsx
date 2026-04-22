import { useContext } from 'react';
import './index.css';

import LandingPage from './components/LandingPage';
import MobileApp from './components/mobile/MobileApp';
import AdminDashboard from './components/admin/AdminDashboard';

import { AuthContext } from './AuthContext';

export default function App() {
  const { user, role, loading, logout } = useContext(AuthContext);

  if (loading) return null;

  return (
    <>
      {/* NOT LOGGED IN */}
      {!user && (
        <LandingPage
          onLoginSuccess={() => {
            // AuthProvider reads from localStorage automatically on reload
            // Force re-render by reloading — simple and reliable
            window.location.reload();
          }}
          onAdminLoginSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* MEMBER VIEW */}
      {user && role === 'member' && (
        <MobileApp onLogout={logout} />
      )}

      {/* ADMIN VIEW */}
      {user && role === 'admin' && (
        <AdminDashboard onLogout={logout} />
      )}

      {/* TRAINER VIEW - fallback so trainers don't get white screen */}
      {user && role === 'trainer' && (
        <AdminDashboard onLogout={logout} />
      )}
    </>
  );
}