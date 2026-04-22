import { useState, useEffect } from 'react';
import { API_URL } from '../../../services/api';

export default function QRCodeTab() {
  const [qrImage, setQrImage]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [userName, setUserName] = useState('');
  const [memberPlan, setMemberPlan] = useState('');
  const [memberEnd, setMemberEnd]   = useState('');
  const [lastScan, setLastScan]     = useState(null);
  const [qrToken, setQrToken] = useState('');

  useEffect(() => {
    fetchQR();
  }, []);

  const fetchQR = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const user  = JSON.parse(localStorage.getItem('user') || '{}');
      setUserName(user.full_name || 'Member');

      // Fetch fresh profile (includes QR + membership info)
      const res  = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load QR');
  
      setQrImage(data.qrImage || '');
      setMemberPlan(data.membership_plan || '');
      setMemberEnd(data.membership_end || '');
      setQrToken(data.qr_token || '');

      // Check last attendance scan
      const attRes  = await fetch(`${API_URL}/attendance/my?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attData = await attRes.json();
      if (attData.records?.length > 0) {
        setLastScan(new Date(attData.records[0].scanned_at));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = memberEnd
    ? Math.max(0, Math.ceil((new Date(memberEnd) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const membershipActive = daysLeft !== null && daysLeft > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 20px', gap: 20, minHeight: '100%',
      background: 'transparent',
    }}>

      {/* ── Title ── */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ color: '#F0C040', fontSize: 13, letterSpacing: 2, fontWeight: 600, textTransform: 'uppercase' }}>
          Attendance QR
        </div>
        <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
          Show this to staff to check in
        </div>
      </div>

      {/* ── QR Card ── */}
      {loading ? (
        <div style={{
          width: 220, height: 220, background: '#1a1a1a', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#444', fontSize: 12,
        }}>
          Loading QR...
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)',
          borderRadius: 12, padding: '16px 20px', color: '#ff6b6b',
          fontSize: 12, textAlign: 'center', width: '100%',
        }}>
          {error}
          <button
            onClick={fetchQR}
            style={{
              display: 'block', margin: '10px auto 0', background: 'none',
              border: '1px solid rgba(255,100,100,0.4)', color: '#ff6b6b',
              borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer',
            }}
          >Retry</button>
        </div>
      ) : qrImage ? (
        <div style={{
          background: '#fff', padding: 16, borderRadius: 16,
          border: '3px solid rgba(240,192,64,0.5)',
          boxShadow: '0 0 40px rgba(240,192,64,0.15)',
          position: 'relative',
        }}>
          {qrToken && (
            <div style={{
              width: '100%',
              background: '#0a0a0a',
              border: '1px dashed #333',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 11,
              color: '#aaa',
              textAlign: 'center',
              wordBreak: 'break-all'
            }}>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
                Manual Check-in Code
              </div>
              <div style={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                {qrToken}
              </div>
            </div>
          )}
          {/* Active/expired badge on QR */}
          <div style={{
            position: 'absolute', top: -10, right: -10,
            background: membershipActive ? '#22c55e' : '#ef4444',
            color: '#fff', fontSize: 9, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20, letterSpacing: 0.5,
          }}>
            {membershipActive ? '● ACTIVE' : '● EXPIRED'}
          </div>
          <img src={qrImage} alt="My QR Code" style={{ width: 180, height: 180, display: 'block' }} />
        </div>
      ) : (
        <div style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>
          QR code not available. Contact the front desk.
        </div>
      )}

      {/* ── Member Info ── */}
      <div style={{
        width: '100%', background: '#111', border: '1px solid #222',
        borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{userName}</div>
            {memberPlan && (
              <div style={{ color: '#F0C040', fontSize: 11, marginTop: 2 }}>{memberPlan}</div>
            )}
          </div>
          {daysLeft !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: daysLeft <= 7 ? '#ef4444' : daysLeft <= 14 ? '#f0a500' : '#22c55e',
                fontSize: 20, fontWeight: 700, lineHeight: 1,
              }}>{daysLeft}</div>
              <div style={{ color: '#555', fontSize: 10 }}>days left</div>
            </div>
          )}
        </div>

        {memberEnd && (
          <div style={{
            background: '#1a1a1a', borderRadius: 8, padding: '8px 10px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#555', fontSize: 11 }}>Expires</span>
            <span style={{ color: '#ccc', fontSize: 11 }}>
              {new Date(memberEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}

        {lastScan && (
          <div style={{
            background: '#1a1a1a', borderRadius: 8, padding: '8px 10px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#555', fontSize: 11 }}>Last Check-in</span>
            <span style={{ color: '#ccc', fontSize: 11 }}>
              {lastScan.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
              {lastScan.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* ── Refresh button ── */}
      <button
        onClick={fetchQR}
        style={{
          background: 'transparent', border: '1px solid #333',
          color: '#666', fontSize: 12, padding: '8px 20px',
          borderRadius: 8, cursor: 'pointer', width: '100%',
        }}
      >
        ↻ Refresh QR Code
      </button>

      <div style={{ color: '#333', fontSize: 10, textAlign: 'center', paddingBottom: 8 }}>
        Your QR code is unique to your account.<br />Do not share it with others.
      </div>
    </div>
  );
}