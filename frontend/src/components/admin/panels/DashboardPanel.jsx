import { useState, useEffect, useCallback } from 'react';
import { C } from '../../../theme';
import { MetricCard, PanelCard, AdminTable } from '../../shared';
import { API_URL } from '../../../services/api';
import { cancelMembership } from '../../../services/api';

function AttendanceChart() {
  const [hov, setHov] = useState(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [42, 38, 44, 35, 51, 62, 28];
  const max  = Math.max(...data);

  return (
    <PanelCard title="Weekly Attendance" badge="This Month">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {data.map((v, i) => (
          <div
            key={i}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
          >
            {hov === i && <div style={{ color: C.gold, fontSize: 10, fontWeight: 600 }}>{v}</div>}
            <div style={{
              width: '100%',
              height: `${Math.round((v / max) * 100)}%`,
              background: hov === i ? C.gold : i === 5 ? 'rgba(240,192,64,0.6)' : '#1e1e1e',
              borderRadius: '3px 3px 0 0', cursor: 'pointer',
              transition: 'background 0.15s', minHeight: 4,
            }} />
            <span style={{ color: hov === i ? C.gold : C.textMuted, fontSize: 10 }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function MembershipDonut() {
  const gradient = `conic-gradient(${C.gold} 0% 51%, ${C.green} 51% 82%, ${C.red} 82% 100%)`;
  return (
    <PanelCard title="Membership Plans">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: gradient }} />
          <div style={{
            position: 'absolute', inset: 12, borderRadius: '50%', background: C.bgSecondary,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 600 }}>312</div>
            <div style={{ color: C.textMuted, fontSize: 9 }}>members</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Monthly',   count: 160, color: C.gold  },
            { label: 'Quarterly', count: 98,  color: C.green },
            { label: 'Expired',   count: 54,  color: C.red   },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ color: C.textSecondary, fontSize: 12 }}>{s.label}</span>
              <span style={{ color: s.color, fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </PanelCard>
  );
}

export default function DashboardPanel({ token }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchRecentActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // ── Group by user_id, keep only the latest scanned_at per member ──────
      const grouped = {};
      (data || []).forEach(log => {
        const uid      = log.user_id;
        const scannedAt = new Date(log.scanned_at);
        if (!grouped[uid] || scannedAt > grouped[uid].scanned_at) {
          grouped[uid] = {
            id:             log.id,
            user_id:        uid,
            full_name:      log.users?.full_name    || 'Unknown Member',
            scanned_at:     scannedAt,
            is_active:      log.users?.is_active    !== false,
            membership_end: log.users?.membership_end || null,
          };
        }
      });

      // Sort by latest check-in first, take top 8
      const activity = Object.values(grouped)
        .sort((a, b) => b.scanned_at - a.scanned_at)
        .slice(0, 8);

      setRecentActivity(activity);
    } catch (err) {
      console.error('Failed to load recent activity:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchRecentActivity();
  }, [fetchRecentActivity, token]);

  // Auto-refresh every 30 seconds so membership updates appear without manual reload
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchRecentActivity(), 30_000);
    return () => clearInterval(interval);
  }, [fetchRecentActivity, token]);

  const handleCancelMembership = async (userId, fullName) => {
    if (!window.confirm(`Cancel membership for ${fullName}? This cannot be undone.`)) return;
    try {
      const data = await cancelMembership(userId, token, 'admin_cancelled');
      if (data.error) throw new Error(data.error);

      setSuccessMessage(`Membership for ${fullName} has been successfully cancelled.`);

      // Optimistically update the row so UI reflects cancel immediately
      setRecentActivity(prev =>
        prev.map(item =>
          item.user_id === userId ? { ...item, is_active: false } : item
        )
      );

      setTimeout(() => {
        fetchRecentActivity(); // re-fetch for full accuracy
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      alert('Failed to cancel membership: ' + err.message);
    }
  };

  const getStatus = (item) => {
    if (!item.is_active) {
      return { label: 'Canceled', color: '#ef4444', bg: '#3a0000' };
    }
    if (!item.membership_end) {
      return { label: 'No Membership', color: '#888', bg: '#1f1f1f' };
    }
    const daysLeft = Math.ceil((new Date(item.membership_end) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)  return { label: 'Expired',              color: '#ef4444', bg: '#3a0000' };
    if (daysLeft <= 7) return { label: `Expiring in ${daysLeft}d`, color: '#f59e0b', bg: '#3f2a00' };
    return { label: 'Active', color: '#22c55e', bg: '#052e16' };
  };

  const metrics = [
    { label: 'Active Members',     value: '248',    delta: '+12 this month',   deltaType: 'up',      accent: C.gold  },
    { label: 'Total Registered',   value: '312',    delta: 'All time',         deltaType: 'neutral'                  },
    { label: 'Total Earnings',     value: '₱84,500',delta: '+8.4% vs last mo', deltaType: 'up',      accent: C.green },
    { label: 'Available Trainers', value: '4 / 6',  delta: '2 on session',     deltaType: 'neutral'                  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16 }}>
        <AttendanceChart />
        <MembershipDonut />
      </div>

      {/* Recent Member Activity */}
      <PanelCard
        title="Recent Member Activity"
        badge="Live"
        // Refresh button in the card header area
        action={
          <button
            onClick={fetchRecentActivity}
            style={{
              background: 'transparent', border: `0.5px solid ${C.border}`,
              color: C.textMuted, fontSize: 11, padding: '4px 10px',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        }
      >
        {loading ? (
          <div style={{ color: '#555', padding: '40px', textAlign: 'center' }}>
            Loading recent check-ins...
          </div>
        ) : recentActivity.length > 0 ? (
          <AdminTable
            headers={['Member', 'Checked In', 'Status', 'Action']}
            rows={recentActivity.map(item => {
              const status     = getStatus(item);
              const isCanceled = !item.is_active;

              return [
                <span style={{ color: C.textPrimary, fontWeight: 500 }}>{item.full_name}</span>,

                item.scanned_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),

                <span style={{
                  color: status.color, background: status.bg,
                  padding: '4px 10px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600,
                }}>
                  {status.label}
                </span>,

                <button
                  onClick={() => !isCanceled && handleCancelMembership(item.user_id, item.full_name)}
                  disabled={isCanceled}
                  style={{
                    background:  isCanceled ? '#1f1f1f' : '#3a0000',
                    color:       isCanceled ? '#666'    : '#ff6b6b',
                    border:      `1px solid ${isCanceled ? '#333' : '#5a2a2a'}`,
                    padding: '6px 12px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600,
                    cursor: isCanceled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isCanceled ? 'Already Canceled' : 'Cancel Membership'}
                </button>,
              ];
            })}
          />
        ) : (
          <div style={{ color: '#555', textAlign: 'center', padding: '40px 0' }}>
            No check-ins today yet.
          </div>
        )}
      </PanelCard>

      {/* Success Modal */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#0f0f0f', border: `1px solid ${C.gold}`,
          borderRadius: 12, padding: '24px 32px',
          zIndex: 2000, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          textAlign: 'center', minWidth: 320,
        }}>
          <div style={{ color: '#22c55e', fontSize: 48, marginBottom: 12 }}>✓</div>
          <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Success</div>
          <div style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5 }}>{successMessage}</div>
        </div>
      )}
    </div>
  );
}