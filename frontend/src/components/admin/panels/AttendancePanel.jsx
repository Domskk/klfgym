import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { C } from '../../../theme';
import { PanelCard } from '../../shared';
import { scanAttendance, getTodayAttendance } from '../../../services/api';

// ── Helper Functions ──────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatDuration(mins) {
  if (mins === null || mins === undefined) return null;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const [active, setActive]   = useState(false);
  const [error, setError]     = useState('');

  const startScanner = () => {
    setError('');
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 12, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true, showTorchButton: true },
      false
    );
    scannerRef.current = scanner;
    scanner.render(
      (decodedText) => { onScan(decodedText); stopScanner(); },
      (scanError)   => { if (!scanError.includes('No QR code')) console.warn(scanError); }
    );
    setActive(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => () => stopScanner(), []);

  return (
    <div style={{ textAlign: 'center' }}>
      <div id="reader" style={{ width: '100%', maxWidth: 380, margin: '0 auto' }} />
      {error && <p style={{ color: '#ff6666', marginTop: 10 }}>{error}</p>}
      <button
        onClick={active ? stopScanner : startScanner}
        style={{
          marginTop: 16, padding: '12px 36px',
          background: active ? '#991b1b' : C.gold,
          color: active ? '#ffdddd' : '#000',
          border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {active ? '⏹ Stop Scanner' : '📷 Start QR Scanner'}
      </button>
    </div>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────────
function LogRow({ log, index }) {
  const isLatest       = index === 0;
  const isCheckedOut   = !!log.checked_out_at;
  const durationMins   = log.gym_duration_mins ?? (
    isCheckedOut
      ? Math.round((new Date(log.checked_out_at) - new Date(log.scanned_at)) / 60000)
      : null
  );

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 12px',
        background: isLatest ? 'rgba(240,192,64,0.08)' : '#111',
        borderRadius: 10,
        border: isLatest ? '1px solid rgba(240,192,64,0.3)' : '1px solid #222',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', background: '#222',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color: C.gold, flexShrink: 0,
      }}>
        {(log.users?.full_name || '?')[0].toUpperCase()}
      </div>

      {/* Name + times */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#eee', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {log.users?.full_name || 'Unknown Member'}
        </div>
        <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
          In: {formatTime(log.scanned_at)}
          {isCheckedOut && (
            <span style={{ marginLeft: 8 }}>· Out: {formatTime(log.checked_out_at)}</span>
          )}
        </div>
      </div>

      {/* Right column: duration + status */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {durationMins !== null ? (
          <div style={{ color: '#a3e635', fontSize: 13, fontWeight: 600 }}>
            ⏱ {formatDuration(durationMins)}
          </div>
        ) : (
          <div style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            ● IN GYM
          </div>
        )}
        {isLatest && (
          <div style={{ color: C.gold, fontSize: 10, marginTop: 4 }}>LATEST</div>
        )}
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function AttendancePanel({ token }) {
  const [manualToken, setManualToken] = useState('');
  const [result, setResult]           = useState(null);
  const [todayLogs, setTodayLogs]     = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Derived stats
  const checkedInNow  = todayLogs.filter(l => !l.checked_out_at).length;
  const checkedOutNow = todayLogs.filter(l =>  l.checked_out_at).length;
  const avgDuration   = (() => {
    const completed = todayLogs.filter(l => l.checked_out_at);
    if (!completed.length) return null;
    const total = completed.reduce((sum, l) => {
      return sum + Math.round((new Date(l.checked_out_at) - new Date(l.scanned_at)) / 60000);
    }, 0);
    return Math.round(total / completed.length);
  })();

  const fetchToday = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await getTodayAttendance(token);
      setTodayLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch today logs:', err);
      setTodayLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [token]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleScan = async (qrToken) => {
    if (!qrToken?.trim()) return;
    try {
      const data = await scanAttendance(qrToken.trim(), token);

      if (data.success) {
        const isCheckout = data.action === 'checkout';
        const durationText = isCheckout && data.gym_duration_mins !== undefined
          ? ` · Gym time: ${formatDuration(data.gym_duration_mins)}`
          : '';

        setResult({
          type:    'success',
          action:  data.action,
          message: (data.message || (isCheckout ? '✅ Checked Out!' : '✅ Checked In!')) + durationText,
        });
        fetchToday(); // refresh list immediately after scan
      } else {
        setResult({ type: 'error', message: data.error || 'Invalid QR Code' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Network error. Please try again.' });
    }

    setManualToken('');
    setTimeout(() => setResult(null), 5000);
  };

  const handleManualSubmit = () => {
    if (manualToken.trim()) handleScan(manualToken.trim());
  };

  // Result banner colors per action
  const resultStyle = (() => {
    if (!result) return {};
    if (result.type === 'error')
      return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#ef4444' };
    if (result.action === 'checkout')
      return { bg: 'rgba(163,230,53,0.12)', border: '#a3e635', color: '#a3e635' };
    return { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', color: '#22c55e' };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats Row — now 5 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Today',   value: todayLogs.length, color: C.gold },
          { label: 'Currently In',  value: checkedInNow,     color: '#22c55e' },
          { label: 'Checked Out',   value: checkedOutNow,    color: '#a3e635' },
          { label: 'Avg Gym Time',  value: avgDuration !== null ? formatDuration(avgDuration) : '—', color: '#60a5fa' },
          { label: 'Date',          value: formatDate(),      color: '#eee', small: true },
        ].map(({ label, value, color, small }) => (
          <div key={label} style={{ background: '#1a1a1a', borderRadius: 12, padding: 16 }}>
            <div style={{ color: '#888', fontSize: 12 }}>{label}</div>
            <div style={{
              fontSize: small ? 14 : 28, fontWeight: small ? 500 : 700,
              color, marginTop: 6, lineHeight: 1.2,
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* QR Scanner Panel */}
        <PanelCard title="QR SCANNER" badge="Live">
          <QRScanner onScan={handleScan} />

          <div style={{ marginTop: 24 }}>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Manual QRCode Entry</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Paste QR code here..."
                style={{
                  flex: 1, padding: '12px 14px',
                  background: '#111', border: '1px solid #333',
                  borderRadius: 8, color: '#fff', fontSize: 14,
                }}
              />
              <button
                onClick={handleManualSubmit}
                style={{
                  background: C.gold, color: '#000', border: 'none',
                  borderRadius: 8, padding: '0 28px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Scan
              </button>
            </div>
          </div>

          {result && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: resultStyle.bg,
              border: `1px solid ${resultStyle.border}`,
              color: resultStyle.color, textAlign: 'center', fontSize: 14,
            }}>
              {result.message}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: 'Check-in' },
              { color: '#a3e635', label: 'Check-out + duration' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>
        </PanelCard>

        {/* Today's Log */}
        <PanelCard
          title="TODAY'S CHECK-INS"
          badge={`${todayLogs.length} total · ${checkedInNow} in gym`}
        >
          {loadingLogs ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>Loading...</div>
          ) : todayLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
              No check-ins yet today
            </div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayLogs.map((log, i) => (
                <LogRow key={log.id || i} log={log} index={i} />
              ))}
            </div>
          )}

          <button
            onClick={fetchToday}
            style={{
              marginTop: 16, width: '100%', padding: 10,
              background: 'transparent', border: '1px solid #333',
              color: '#888', borderRadius: 8, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </PanelCard>
      </div>
    </div>
  );
}