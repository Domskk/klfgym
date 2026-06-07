import { useEffect, useMemo, useState } from 'react';
import { C, T } from '../../theme';
import TrainersTab from './tabs/TrainersTab';
import ClassesTab  from './tabs/ClassesTab';
import ProgressTab  from './tabs/ProgressTab';
import ReportTab   from './tabs/ReportTab';
import QRCodeTab   from './tabs/QrcodeTab';
import './MobileApp.css';
import { API_URL, getAnnouncements } from '../../services/api';

const MENU = [
  {
    id: 'home', label: 'Home',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: 'qr', label: 'My QR',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm-2 4h2v2h-2zm2 0h2v2h-2zm2-4h2v2h-2z"/>
      </svg>
    ),
  },
  {
    id: 'notification', label: 'Alerts',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V9c0-3.07-1.63-5.64-4.5-6.32V2a1.5 1.5 0 0 0-3 0v.68C7.63 3.36 6 5.92 6 9v7l-2 2v1h16v-1l-2-2z" />
      </svg>
    ),
  },
  {
    id: 'progress', label: 'Progress',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M4 18h16v2H4zm2-4h3v4H6zm5-6h3v10h-3zm5 3h3v7h-3z" />
      </svg>
    ),
  },
  {
    id: 'trainers', label: 'Trainers',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Profile',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#F0C040' : '#777'}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
];

// Tabs that require an active membership
const MEMBERSHIP_GATED_TABS = ['qr', 'trainers', 'progress'];

// helpers
function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function getWeekDays() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}

// ─────────────────────────────────────────────
// Locked screen (module-level — stable identity)
// ─────────────────────────────────────────────
function LockedScreen({ tabLabel, membershipStatus }) {
  const messages = {
    no_membership: {
      icon: '🔒', title: 'Membership Required',
      body: "You don't have an active membership yet. Visit the front desk to avail a plan and unlock all features.",
    },
    expired: {
      icon: '⏰', title: 'Membership Expired',
      body: 'Your membership has expired. Please renew at the front desk to regain access.',
    },
    cancelled: {
      icon: '❌', title: 'Membership Cancelled',
      body: 'Your membership has been cancelled. Please visit the front desk for assistance.',
    },
  };
  const msg = messages[membershipStatus] || messages.no_membership;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%',
      padding: '32px 24px', textAlign: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>{msg.icon}</div>
      <div style={{ color: '#F0C040', fontSize: 16, fontWeight: 700 }}>{msg.title}</div>
      <div style={{ color: '#666', fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>{msg.body}</div>
      <div style={{
        marginTop: 8, background: 'rgba(240,192,64,0.07)',
        border: '1px solid rgba(240,192,64,0.2)',
        borderRadius: 10, padding: '12px 16px',
        color: '#888', fontSize: 12, lineHeight: 1.6,
      }}>
        Once your membership is activated by an admin,{' '}
        <span style={{ color: '#F0C040' }}>{tabLabel}</span> will be available automatically.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProfilePanel (module-level — stable identity)
// Fixes scroll/reset bug caused by re-defining
// this component inside MobileApp every render.
// ─────────────────────────────────────────────
function ProfilePanel({ profileData, setProfileData, membershipActive, membership }) {
  const [editedData, setEditedData] = useState(profileData);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwFields, setShowPwFields] = useState({ current: false, new: false, confirm: false });

  useEffect(() => { setEditedData(profileData); }, [profileData]);

  const handleSave = () => { setProfileData(editedData); alert('Profile updated!'); };
  const handlePwChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { alert('Passwords do not match!'); return; }
    if (passwordData.newPassword.length < 6) { alert('Min 6 characters.'); return; }
    alert('Password updated!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  return (
    <div className="mobile-app-profile-panel">
      <h1 className="mobile-app-profile-title">Profile Settings</h1>

      {/* Membership status banner */}
      {!membershipActive && (
        <div style={{
          background: 'rgba(240,192,64,0.07)', border: '1px solid rgba(240,192,64,0.2)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ color: '#F0C040', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            {membership.status === 'no_membership' ? '⚠️ No Active Membership' :
             membership.status === 'expired' ? '⏰ Membership Expired' :
             '❌ Membership Cancelled'}
          </div>
          <div style={{ color: '#666', fontSize: 11 }}>
            Visit the front desk to avail or renew a membership plan.
          </div>
        </div>
      )}

      <div className="mobile-app-profile-section mobile-app-profile-picture">
        <div className="mobile-app-profile-avatar">
          <img src={editedData.profileImage} alt="Profile" />
        </div>
        <input type="file" id="profile-pic-input" accept="image/*" style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = ev => setEditedData({ ...editedData, profileImage: ev.target?.result || '' });
            r.readAsDataURL(file);
          }} />
        <button onClick={() => document.getElementById('profile-pic-input')?.click()} className="mobile-app-btn">
          Change Picture
        </button>
      </div>

      <div className="mobile-app-profile-section">
        <h2 className="mobile-app-profile-section-title">Personal Information</h2>
        <div className="mobile-app-form-group">
          <label className="mobile-app-form-label">Full Name</label>
          <input type="text" value={editedData.name}
            onChange={e => setEditedData({ ...editedData, name: e.target.value })}
            className="mobile-app-form-input" />
        </div>
        <div className="mobile-app-form-group">
          <label className="mobile-app-form-label">Email</label>
          <input type="email" value={editedData.email}
            onChange={e => setEditedData({ ...editedData, email: e.target.value })}
            className="mobile-app-form-input" />
        </div>
        <button onClick={handleSave} className="mobile-app-btn">Save Changes</button>
      </div>

      <div className="mobile-app-profile-section">
        <h2 className="mobile-app-profile-section-title">Security</h2>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="mobile-app-btn mobile-app-btn-secondary">
            Change Password
          </button>
        ) : (
          <div className="mobile-app-password-form">
            {['current', 'new', 'confirm'].map(key => (
              <div key={key} className="mobile-app-form-group">
                <label className="mobile-app-form-label">
                  {key === 'current' ? 'Current' : key === 'new' ? 'New' : 'Confirm'} Password
                </label>
                <div className="mobile-app-password-wrapper">
                  <input type={showPwFields[key] ? 'text' : 'password'}
                    value={passwordData[`${key}Password`]}
                    onChange={e => setPasswordData({ ...passwordData, [`${key}Password`]: e.target.value })}
                    className="mobile-app-form-input mobile-app-form-input-with-toggle" />
                  <button onClick={() => setShowPwFields({ ...showPwFields, [key]: !showPwFields[key] })}
                    className="mobile-app-password-toggle">
                    {showPwFields[key] ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            ))}
            <div className="mobile-app-btn-group">
              <button onClick={handlePwChange} className="mobile-app-btn">Update Password</button>
              <button onClick={() => setShowPasswordForm(false)} className="mobile-app-btn mobile-app-btn-cancel">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NotificationsTab (module-level — stable identity)
// ─────────────────────────────────────────────
function NotificationsTab({ announcements, loadingNotifications }) {
  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Notifications & Announcements</div>
      {loadingNotifications ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>Loading announcements...</div>
      ) : announcements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map(ann => (
            <div key={ann.id} style={{
              background: '#1a1a1a', borderRadius: 12,
              padding: '16px', borderLeft: '4px solid #F0C040',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{ann.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {new Date(ann.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ marginTop: 8, color: '#ccc', lineHeight: 1.5, fontSize: 14 }}>{ann.body}</div>
              {ann.start_date && ann.end_date && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                  Valid: {new Date(ann.start_date).toLocaleDateString()} — {new Date(ann.end_date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#666' }}>
          No announcements at the moment.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LogoutModal (module-level — stable identity)
// ─────────────────────────────────────────────
function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="mobile-app-modal-overlay">
      <div className="mobile-app-modal-content">
        <h2 className="mobile-app-modal-title">Confirm Logout</h2>
        <p className="mobile-app-modal-text">Are you sure you want to logout?</p>
        <div className="mobile-app-modal-actions">
          <button onClick={onCancel} className="mobile-app-modal-cancel">Cancel</button>
          <button onClick={onConfirm} className="mobile-app-modal-confirm">Logout</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar (module-level — stable identity)
// ─────────────────────────────────────────────
function Sidebar({ active, setActive, membershipActive, onLogoutRequest }) {
  return (
    <div className="mobile-app-sidebar">
      <div>
        <div className="mobile-app-brand">KL FITNESS</div>
        <div className="mobile-app-menu">
          {MENU.map(({ id, label, icon }) => {
            const isActive = id === active;
            const isLocked = MEMBERSHIP_GATED_TABS.includes(id) && !membershipActive;
            return (
              <button key={id} type="button" onClick={() => setActive(id)}
                className={`mobile-app-menu-btn ${isActive ? 'active' : ''}`}
                style={{ opacity: isLocked ? 0.5 : 1 }}
              >
                {icon(isActive)}
                <span>{label}</span>
                {isLocked && <span style={{ marginLeft: 'auto', fontSize: 10 }}>🔒</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button type="button" onClick={onLogoutRequest} className="mobile-app-logout-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#F0C040">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        Logout
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard (module-level — stable identity)
// ─────────────────────────────────────────────
function Dashboard({ now, profileData, membership, membershipActive, daysLeft, weekDays, onGoToQR }) {
  const todayIndex = now.getDay();
  return (
    <div className="mobile-app-dashboard">
      <div className="mobile-app-cards-row">
        <div className="mobile-app-card">
          <div className="mobile-app-card-header">
            <div>
              <div className="mobile-app-card-title">
                Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
                {profileData.name.split(' ')[0]}! 👋
              </div>
              <div className="mobile-app-card-subtitle">{formatDayLabel(now)}</div>
            </div>
            <div className="mobile-app-card-time">
              <div className="mobile-app-card-time-large">{formatTime(now)}</div>
              <div className="mobile-app-card-time-small">Local Time</div>
            </div>
          </div>
          <div className="mobile-app-card-bg-blur" />
        </div>

        <div className="mobile-app-card">
          <div className="mobile-app-card-header">
            <div>
              <div className="mobile-app-membership-header">
                {membershipActive ? 'ACTIVE PLAN' : 'NO MEMBERSHIP'}
              </div>
              <div className="mobile-app-membership-plan">
                {membership.plan || 'No plan yet'}
              </div>
            </div>
            <div className="mobile-app-membership-info-right">
              {membershipActive ? (
                <>
                  <div className="mobile-app-membership-days">{daysLeft} days left</div>
                  <div className="mobile-app-membership-expires">
                    Expires {membership.expires.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </>
              ) : (
                <div style={{ color: '#ef4444', fontSize: 11 }}>
                  {membership.status === 'expired' ? 'Expired' :
                   membership.status === 'cancelled' ? 'Cancelled' : 'Not activated'}
                </div>
              )}
            </div>
          </div>
          {membershipActive && (
            <div className="mobile-app-progress-bar">
              <div className="mobile-app-progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, 100 - (daysLeft / 30) * 100))}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* QR shortcut */}
      {membershipActive ? (
        <button
          onClick={onGoToQR}
          style={{
            width: '100%', background: 'rgba(240,192,64,0.07)',
            border: '1px solid rgba(240,192,64,0.25)', borderRadius: 10,
            padding: '12px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}
        >
          <div style={{
            width: 36, height: 36, background: 'rgba(240,192,64,0.12)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F0C040">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#F0C040', fontSize: 13, fontWeight: 600 }}>Show My QR Code</div>
            <div style={{ color: '#666', fontSize: 11, marginTop: 1 }}>Tap to check in at the gym entrance</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#444', fontSize: 18 }}>›</div>
        </button>
      ) : (
        <div style={{
          width: '100%', background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 24 }}>🔒</div>
          <div>
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>QR Code Unavailable</div>
            <div style={{ color: '#666', fontSize: 11, marginTop: 1 }}>
              Avail a membership plan at the front desk to unlock check-in.
            </div>
          </div>
        </div>
      )}

      {/* Expiry reminder */}
      {membershipActive && daysLeft <= 7 && (
        <div className="mobile-app-reminder">
          <strong>Reminder:</strong> Membership expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew now!
        </div>
      )}

      <div className="mobile-app-week-grid">
        {weekDays.map((day, index) => (
          <div key={day.toDateString()} className={`mobile-app-day-card ${index === todayIndex ? 'today' : ''}`}>
            <div className="mobile-app-day-label">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <div className="mobile-app-day-number">{day.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="mobile-app-stats-grid">
        <div className="mobile-app-stat-card">
          <div className="mobile-app-stat-label">Sessions This Month</div>
          <div className="mobile-app-stat-value">—</div>
        </div>
        <div className="mobile-app-stat-card">
          <div className="mobile-app-stat-label">Upcoming Classes</div>
          <div className="mobile-app-stat-value">—</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MobileApp — main component
// ─────────────────────────────────────────────
export default function MobileApp({ onLogout }) {
  const [active, setActive] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [profileData, setProfileData] = useState({
    name: 'Member',
    email: '',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Member',
  });
  const [membership, setMembership] = useState({
    plan: '',
    expires: null,
    status: 'no_membership', // 'active' | 'expired' | 'cancelled' | 'no_membership'
  });

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfileData({
          name: data.full_name || 'Member',
          email: data.email || '',
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.full_name}`,
        });
        setMembership({
          plan: data.membership_plan || '',
          expires: data.membership_end ? new Date(data.membership_end) : null,
          status: data.membership_status || 'no_membership',
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load announcements:', err);
        setAnnouncements([]);
      } finally {
        setLoadingNotifications(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // Clock + responsive
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); mq.removeEventListener?.('change', update); };
  }, []);

  const membershipActive = membership.status === 'active';
  const daysLeft = membership.expires
    ? Math.max(0, Math.ceil((membership.expires - now) / (1000 * 60 * 60 * 24)))
    : 0;
  const weekDays = useMemo(() => getWeekDays(), []);

  // Render active tab
  const renderContent = () => {
    // Gate membership-required tabs
    if (MEMBERSHIP_GATED_TABS.includes(active) && !membershipActive) {
      const tabLabel = MENU.find(m => m.id === active)?.label || active;
      return <LockedScreen tabLabel={tabLabel} membershipStatus={membership.status} />;
    }
    if (active === 'home') return (
      <Dashboard
        now={now}
        profileData={profileData}
        membership={membership}
        membershipActive={membershipActive}
        daysLeft={daysLeft}
        weekDays={weekDays}
        onGoToQR={() => setActive('qr')}
      />
    );
    if (active === 'qr') return <QRCodeTab />;
    if (active === 'progress') return <ProgressTab />;
    if (active === 'trainers') return <TrainersTab />;
    if (active === 'classes') return <ClassesTab />;
    if (active === 'report') return <ReportTab />;
    if (active === 'profile') return (
      <ProfilePanel
        profileData={profileData}
        setProfileData={setProfileData}
        membershipActive={membershipActive}
        membership={membership}
      />
    );
    if (active === 'notification') return (
      <NotificationsTab
        announcements={announcements}
        loadingNotifications={loadingNotifications}
      />
    );
    return (
      <Dashboard
        now={now}
        profileData={profileData}
        membership={membership}
        membershipActive={membershipActive}
        daysLeft={daysLeft}
        weekDays={weekDays}
        onGoToQR={() => setActive('qr')}
      />
    );
  };

  return (
    <div className="mobile-app-wrapper">
      <div className={`mobile-app-container ${isMobile ? 'mobile' : ''}`}>
        {!isMobile && <div className="mobile-app-notch"><div className="mobile-app-notch-inner" /></div>}
        <div className={`mobile-app-screen ${isMobile ? 'mobile' : ''}`}>
          <div className="mobile-app-content">
            {!isMobile && (
              <Sidebar
                active={active}
                setActive={setActive}
                membershipActive={membershipActive}
                onLogoutRequest={() => setShowLogoutConfirm(true)}
              />
            )}
            <div className="mobile-app-inner">{renderContent()}</div>
          </div>
          {isMobile && (
            <div className="mobile-app-bottom-menu">
              {MENU.map(({ id, label, icon }) => {
                const isLocked = MEMBERSHIP_GATED_TABS.includes(id) && !membershipActive;
                return (
                  <button key={id} onClick={() => setActive(id)}
                    className={`mobile-app-bottom-menu-btn ${active === id ? 'active' : ''}`}
                    style={{ opacity: isLocked ? 0.5 : 1, position: 'relative' }}
                  >
                    {icon(active === id)}
                    <span className="mobile-app-bottom-menu-label">{label}</span>
                    {isLocked && (
                      <span style={{ position: 'absolute', top: 2, right: 6, fontSize: 8, color: '#F0C040' }}>🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showLogoutConfirm && (
        <LogoutModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => { setShowLogoutConfirm(false); onLogout?.(); setActive('home'); }}
        />
      )}
    </div>
  );
}