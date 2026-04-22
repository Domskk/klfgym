import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { C } from '../../../theme';
import { PanelCard } from '../../shared';
import { scanAttendance, getTodayAttendance } from '../../../services/api';

// ── Helper Functions ─────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── QR Scanner Component (Using html5-qrcode) ─────────────────────────────
function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const startScanner = () => {
    setError('');

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 12,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
        showTorchButton: true,
      },
      false // verbose = false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        stopScanner(); // Auto stop after successful scan
      },
      (scanError) => {
        // Ignore "No QR code found" errors
        if (!scanError.includes('No QR code')) {
          console.warn(scanError);
        }
      }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        id="reader"
        style={{
          width: '100%',
          maxWidth: 380,
          margin: '0 auto',
        }}
      />

      {error && <p style={{ color: '#ff6666', marginTop: 10 }}>{error}</p>}

      <button
        onClick={active ? stopScanner : startScanner}
        style={{
          marginTop: 16,
          padding: '12px 36px',
          background: active ? '#991b1b' : C.gold,
          color: active ? '#ffdddd' : '#000',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {active ? '⏹ Stop Scanner' : '📷 Start QR Scanner'}
      </button>
    </div>
  );
}

// ── Main Attendance Panel ─────────────────────────────────────────────────
export default function AttendancePanel({ token }) {
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleScan = async (qrToken) => {
  if (!qrToken?.trim()) return;

  try {
    const data = await scanAttendance(qrToken.trim(), token);

    if (data.success) {
      setResult({ 
        type: 'success', 
        message: data.message || '✅ Check-in Successful!' 
      });
    } else {
      setResult({ 
        type: 'error', 
        message: data.error || 'Invalid QR Code' 
      });
    }
  } catch (err) {
    setResult({ 
      type: 'error', 
      message: err.message || 'Network error. Please try again.' 
    });
  }

  setManualToken('');
  setTimeout(() => setResult(null), 5000); // shorter timeout
};

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      handleScan(manualToken.trim());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <div style={{ color: '#888', fontSize: 12 }}>Check-ins Today</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.gold }}>
            {todayLogs.length}
          </div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <div style={{ color: '#888', fontSize: 12 }}>Last Scan</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>
            {formatTime(todayLogs[0]?.scanned_at)}
          </div>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16 }}>
          <div style={{ color: '#888', fontSize: 12 }}>Date</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>
            {formatDate()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* QR Scanner Panel */}
        <PanelCard title="QR SCANNER" badge="Live">
          <QRScanner onScan={handleScan} />

          {/* Manual Token Input */}
          <div style={{ marginTop: 24 }}>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Manual QRCode Entry</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Paste QRcode here..."
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: '#111',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                }}
              />
              <button
                onClick={handleManualSubmit}
                style={{
                  background: C.gold,
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 28px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log In
              </button>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                background: result.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${result.type === 'success' ? '#22c55e' : '#ef4444'}`,
                color: result.type === 'success' ? '#22c55e' : '#ef4444',
                textAlign: 'center',
              }}
            >
              {result.message}
            </div>
          )}
        </PanelCard>

        {/* Today's Check-ins */}
        <PanelCard title="TODAY'S CHECK-INS" badge={`${todayLogs.length} total`}>
          {loadingLogs ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>Loading...</div>
          ) : todayLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
              No check-ins yet today
            </div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayLogs.map((log, i) => (
                <div
                  key={log.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 12px',
                    background: i === 0 ? 'rgba(240,192,64,0.08)' : '#111',
                    borderRadius: 10,
                    border: i === 0 ? '1px solid rgba(240,192,64,0.3)' : '1px solid #222',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: C.gold,
                    }}
                  >
                    {(log.users?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#eee' }}>{log.users?.full_name || 'Unknown Member'}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>{formatTime(log.scanned_at)}</div>
                  </div>
                  {i === 0 && <span style={{ color: C.gold, fontSize: 11 }}>● LATEST</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={fetchToday}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid #333',
              color: '#888',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            ↻ Refresh List
          </button>
        </PanelCard>
      </div>
    </div>
  );
}