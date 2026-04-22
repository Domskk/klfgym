import { useState, useEffect, useCallback } from 'react';
import { C } from '../../../theme';
import { MetricCard, StatusPill, PanelCard, AdminTable } from '../../shared';
import { getAtRiskMembers } from '../../../services/api';

function AttendancePattern() {
  const days = [
    { label: 'Mon', pct: 72 }, { label: 'Tue', pct: 60 }, { label: 'Wed', pct: 65 },
    { label: 'Thu', pct: 55 }, { label: 'Fri', pct: 80 }, { label: 'Sat', pct: 95 },
    { label: 'Sun', pct: 40 },
  ];

  return (
    <PanelCard title="Attendance Pattern" badge="30 Days">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.textMuted, fontSize: 11, width: 28 }}>{d.label}</span>
            <div style={{ flex: 1, background: '#1e1e1e', height: 6, borderRadius: 3 }}>
              <div style={{
                background: d.pct === 95 ? C.green : C.gold,
                height: 6, borderRadius: 3, width: `${d.pct}%`, transition: 'width 0.5s',
              }} />
            </div>
            <span style={{
              color: d.pct === 95 ? C.green : C.textSecondary,
              fontSize: 11, width: 32, textAlign: 'right',
            }}>{d.pct}%</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, padding: '10px 12px', background: C.goldBg,
        border: '0.5px solid rgba(240,192,64,0.3)', borderRadius: 8,
      }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 500 }}>Peak Day: Saturday (95% capacity)</div>
        <div style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>
          Consider adding an extra trainer or class on Saturdays.
        </div>
      </div>
    </PanelCard>
  );
}

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

      {!loading && !error && members.length > 0 && members.map(m => {
        const riskScore = m.riskScore || m.dropout_risk_score || 0;
        const pct = Math.round(riskScore * 100);

        return (
          <div key={m.userId || m.user_id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: '0.5px solid #131313',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.textSecondary, fontSize: 12 }}>{m.full_name}</div>
              <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{m.explanation}</div>
            </div>
            <div style={{ flex: 2, background: '#1e1e1e', height: 4, borderRadius: 3 }}>
              <div style={{
                background: getRiskColor(riskScore),
                height: 4, borderRadius: 3, width: `${pct}%`
              }} />
            </div>
            <span style={{
              color: getRiskColor(riskScore),
              fontSize: 11, width: 30, textAlign: 'right', fontWeight: 600,
            }}>{pct}%</span>
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

export default function AnalyticsPanel({ token }) {
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Memoized fetch function
  const fetchAtRisk = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAtRiskMembers(token);
      const members = Array.isArray(data) ? data : [];
      
      setAtRisk(members);

      if (members.length > 0 && members[0].lastUpdated) {
        setLastUpdated(members[0].lastUpdated);
      } else {
        setLastUpdated(null);
      }
    } catch (err) {
      console.error('Failed to fetch at-risk members:', err);
      setError(err.message || 'Failed to load at-risk members');
      setAtRisk([]);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch when token changes
  useEffect(() => {
    if (token) {
      fetchAtRisk();
    }
  }, [fetchAtRisk, token]);

  const highRiskCount = atRisk.filter(m => 
    (m.riskLevel || m.risk_level) === 'High'
  ).length;

  const metrics = [
    { label: 'Avg. Sessions / Week', value: '38', delta: '+5 vs last week', deltaType: 'up', accent: C.gold },
    { 
      label: 'Dropout Risk Members', 
      value: loading ? '…' : String(atRisk.length), 
      delta: highRiskCount > 0 ? `${highRiskCount} high risk` : 'All good', 
      deltaType: highRiskCount > 0 ? 'down' : 'neutral', 
      accent: C.orange 
    },
    { label: 'Top Performing Day', value: 'Saturday', delta: 'Avg 52 check-ins', deltaType: 'neutral' },
    { label: 'Equipment Reports', value: '7', delta: '3 pending resolution', deltaType: 'down' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AttendancePattern />
        <DropoutRisk 
          members={atRisk} 
          loading={loading} 
          error={error}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Session Trend & Equipment Reports (still static for now) */}
      <PanelCard title="Session Trend" badge="6 Months">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
          {[['Oct', 28], ['Nov', 34], ['Dec', 31], ['Jan', 40], ['Feb', 37], ['Mar', 44]].map(([m, v], i, a) => (
            <div key={m} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end',
            }}>
              <div style={{ color: C.textMuted, fontSize: 10 }}>{v}</div>
              <div style={{
                width: '100%',
                height: `${Math.round((v / Math.max(...a.map(x => x[1]))) * 100)}%`,
                background: i === a.length - 1 ? C.gold : 'rgba(240,192,64,0.3)',
                borderRadius: '3px 3px 0 0', minHeight: 4,
              }} />
              <span style={{ color: C.textMuted, fontSize: 10 }}>{m}</span>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Equipment Reports" badge="Pending">
        <AdminTable
          headers={['Equipment', 'Issue', 'Reporter', 'Date', 'Status']}
          rows={[
            ['Cable Machine #2', 'Faulty cable', 'Alex Santos', 'Mar 14', <StatusPill status="In Review" />],
            ['Treadmill #4', 'Belt slipping', 'Maria S.', 'Mar 15', <StatusPill status="In Review" />],
            ['Bench Press #1', 'Missing bolt', 'Diego R.', 'Mar 10', <StatusPill status="Resolved" />],
          ]}
        />
      </PanelCard>
    </div>
  );
}