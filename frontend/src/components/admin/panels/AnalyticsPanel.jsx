import { useState, useEffect, useCallback } from 'react';
import { C } from '../../../theme';
import { MetricCard, StatusPill, PanelCard, AdminTable } from '../../shared';
import { getAtRiskMembers, getAnalyticsStats } from '../../../services/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Attendance Pattern ────────────────────────────────────────────────────────
function AttendancePattern({ data, loading }) {
  if (loading) return (
    <PanelCard title="Attendance Pattern" badge="30 Days">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  const peakDay = data.reduce((a, b) => a.pct > b.pct ? a : b, data[0] || { label: '—', pct: 0 });

  return (
    <PanelCard title="Attendance Pattern" badge="30 Days">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.textMuted, fontSize: 11, width: 28 }}>{d.label}</span>
            <div style={{ flex: 1, background: '#1e1e1e', height: 6, borderRadius: 3 }}>
              <div style={{
                background: d.pct === peakDay.pct ? C.green : C.gold,
                height: 6, borderRadius: 3, width: `${d.pct}%`, transition: 'width 0.5s',
              }} />
            </div>
            <span style={{
              color: d.pct === peakDay.pct ? C.green : C.textSecondary,
              fontSize: 11, width: 32, textAlign: 'right',
            }}>{d.pct}%</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, padding: '10px 12px', background: C.goldBg,
        border: '0.5px solid rgba(240,192,64,0.3)', borderRadius: 8,
      }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 500 }}>
          Peak Day: {peakDay.label} ({peakDay.count} check-ins)
        </div>
        <div style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>
          Consider adding an extra trainer or class on {peakDay.label}s.
        </div>
      </div>
    </PanelCard>
  );
}

// ── Dropout Risk ──────────────────────────────────────────────────────────────
function DropoutRisk({ members, loading, error, lastUpdated }) {
  const getRiskColor = (score = 0) => {
    const pct = Math.round(score * 100);
    return pct >= 75 ? C.orange : pct >= 50 ? C.gold : C.green;
  };

  return (
    <PanelCard title="Dropout Risk" badge="AI Flagged">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '6px 10px', background: '#1a0a00', borderRadius: 6,
        border: `0.5px solid ${C.orangeBorder}`,
      }}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span style={{ color: C.textSecondary, fontSize: 11 }}>
          {loading ? 'Loading…' : error ? 'Failed to load members' : `${members.length} members flagged as potential dropouts`}
        </span>
      </div>

      {lastUpdated && (
        <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 12, textAlign: 'right' }}>
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {!loading && !error && members.map(m => {
        const riskScore = m.riskScore || 0;
        const pct = Math.round(riskScore * 100);
        return (
          <div key={m.userId} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: '0.5px solid #131313',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.textSecondary, fontSize: 12 }}>{m.full_name}</div>
              <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{m.explanation}</div>
            </div>
            <div style={{ flex: 2, background: '#1e1e1e', height: 4, borderRadius: 3 }}>
              <div style={{ background: getRiskColor(riskScore), height: 4, borderRadius: 3, width: `${pct}%` }} />
            </div>
            <span style={{ color: getRiskColor(riskScore), fontSize: 11, width: 30, textAlign: 'right', fontWeight: 600 }}>
              {pct}%
            </span>
          </div>
        );
      })}

      {!loading && !error && members.length === 0 && (
        <div style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', padding: '40px 0' }}>
          No at-risk members found.
        </div>
      )}
    </PanelCard>
  );
}

// ── Session Trend ─────────────────────────────────────────────────────────────
function SessionTrend({ labels, counts, loading }) {
  if (loading) return (
    <PanelCard title="Session Trend" badge="6 Months">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  const max = Math.max(...counts, 1);
  const pairs = labels.map((l, i) => [l, counts[i]]);

  return (
    <PanelCard title="Session Trend" badge="6 Months">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
        {pairs.map(([m, v], i) => (
          <div key={m} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end',
          }}>
            <div style={{ color: C.textMuted, fontSize: 10 }}>{v}</div>
            <div style={{
              width: '100%',
              height: `${Math.round((v / max) * 100)}%`,
              background: i === pairs.length - 1 ? C.gold : 'rgba(240,192,64,0.3)',
              borderRadius: '3px 3px 0 0', minHeight: 4,
            }} />
            <span style={{ color: C.textMuted, fontSize: 10 }}>{m}</span>
          </div>
        ))}
      </div>
      {counts.every(c => c === 0) && (
        <div style={{ color: '#444', textAlign: 'center', fontSize: 12, marginTop: 12 }}>
          No attendance data yet.
        </div>
      )}
    </PanelCard>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function AnalyticsPanel({ token }) {
  const [atRisk,      setAtRisk]      = useState([]);
  const [stats,       setStats]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading,     setLoading]     = useState({ risk: true, stats: true });
  const [error,       setError]       = useState({ risk: '', stats: '' });

  // Fetch at-risk members
  const fetchAtRisk = useCallback(async () => {
    setLoading(p => ({ ...p, risk: true }));
    try {
      const data = await getAtRiskMembers(token);
      const members = Array.isArray(data) ? data : [];
      setAtRisk(members);
      if (members[0]?.lastUpdated) setLastUpdated(members[0].lastUpdated);
    } catch (err) {
      setError(p => ({ ...p, risk: err.message }));
    } finally {
      setLoading(p => ({ ...p, risk: false }));
    }
  }, [token]);

  // Fetch attendance stats
  const fetchStats = useCallback(async () => {
    setLoading(p => ({ ...p, stats: true }));
    try {
      const data = await getAnalyticsStats(token);
      setStats(data);
    } catch (err) {
      setError(p => ({ ...p, stats: err.message }));
    } finally {
      setLoading(p => ({ ...p, stats: false }));
    }
  }, [token]);

  useEffect(() => {
    if (token) { fetchAtRisk(); fetchStats(); }
  }, [token, fetchAtRisk, fetchStats]);

  const highRiskCount = atRisk.filter(m => m.riskLevel === 'High').length;

  // Attendance pattern — fallback to zeros while loading
  const attendancePattern = stats?.attendancePattern || DAY_LABELS.map(label => ({ label, pct: 0, count: 0 }));
  const sessionLabels     = stats?.sessionTrend?.labels || [];
  const sessionCounts     = stats?.sessionTrend?.counts || [];
  const weekSessions      = stats?.weekSessions ?? '…';

  // Peak day
  const peakDay = attendancePattern.reduce((a, b) => a.count > b.count ? a : b, attendancePattern[0] || {});

  const metrics = [
    {
      label: 'Sessions This Week',
      value: loading.stats ? '…' : String(weekSessions),
      delta: 'Live from DB',
      deltaType: 'up',
      accent: C.gold,
    },
    {
      label: 'Dropout Risk Members',
      value: loading.risk ? '…' : String(atRisk.length),
      delta: highRiskCount > 0 ? `${highRiskCount} high risk` : 'All good',
      deltaType: highRiskCount > 0 ? 'down' : 'neutral',
      accent: C.orange,
    },
    {
      label: 'Top Performing Day',
      value: loading.stats ? '…' : (peakDay.label || '—'),
      delta: peakDay.count ? `${peakDay.count} check-ins` : 'No data yet',
      deltaType: 'neutral',
    },
    {
      label: 'Equipment Reports',
      value: '7',
      delta: '3 pending resolution',
      deltaType: 'down',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Attendance + Dropout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AttendancePattern data={attendancePattern} loading={loading.stats} />
        <DropoutRisk members={atRisk} loading={loading.risk} error={error.risk} lastUpdated={lastUpdated} />
      </div>

      {/* Session Trend */}
      <SessionTrend labels={sessionLabels} counts={sessionCounts} loading={loading.stats} />

      {/* Equipment Reports — static until you build that endpoint */}
      <PanelCard title="Equipment Reports" badge="Pending">
        <AdminTable
          headers={['Equipment', 'Issue', 'Reporter', 'Date', 'Status']}
          rows={[
            ['Cable Machine #2', 'Faulty cable',  'Alex Santos', 'Mar 14', <StatusPill status="In Review" />],
            ['Treadmill #4',     'Belt slipping', 'Maria S.',    'Mar 15', <StatusPill status="In Review" />],
            ['Bench Press #1',   'Missing bolt',  'Diego R.',    'Mar 10', <StatusPill status="Resolved"  />],
          ]}
        />
      </PanelCard>

    </div>
  );
}