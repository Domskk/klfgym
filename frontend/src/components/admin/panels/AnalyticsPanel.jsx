import { useState, useEffect, useCallback } from 'react';
import { C } from '../../../theme';
import { MetricCard, PanelCard } from '../../shared';
import { getAtRiskMembers, getAnalyticsStats } from '../../../services/api';

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(mins) {
  if (mins === null || mins === undefined) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const up    = pct >= 0;
  const color = up ? '#22c55e' : '#ef4444';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: up ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color, border: `1px solid ${color}33`, marginLeft: 8,
    }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs prior week
    </span>
  );
}

// ── Reusable Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color, height = 120, showValues = false, formatValue }) {
  const values = data.map(d => d[valueKey] ?? 0);
  const max    = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const val = d[valueKey] ?? 0;
        const pct = Math.max(val === null ? 0 : 3, val === null ? 0 : (val / max) * 100);
        const bg  = val === null || val === 0 ? '#2a2a2a' : (typeof color === 'function' ? color(d, i) : color);
        return (
          <div
            key={d[labelKey] || i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 3 }}
          >
            {showValues && val > 0 && (
              <span style={{ color: typeof color === 'function' ? color(d, i) : color, fontSize: 9, fontWeight: 600 }}>
                {formatValue ? formatValue(val) : val}
              </span>
            )}
            <div
              title={`${d[labelKey]}: ${formatValue ? formatValue(val) : val}`}
              style={{
                width: '100%',
                height: `${pct}%`,
                minHeight: val > 0 ? 8 : 3,
                background: bg,
                borderRadius: '2px 2px 0 0',
                transition: 'height 0.4s ease',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ChartXAxis({ data, labelKey, sparse = false }) {
  const labels = sparse
    ? data.filter((_, i) => i === 0 || i === Math.floor(data.length / 3) || i === Math.floor(2 * data.length / 3) || i === data.length - 1)
    : data;
  return (
    <div style={{
      display: 'flex', justifyContent: sparse ? 'space-between' : 'space-around',
      borderTop: '1px solid #1e1e1e', paddingTop: 6, marginTop: 8,
    }}>
      {labels.map((d, i) => (
        <span key={i} style={{ color: '#555', fontSize: 9, textAlign: 'center' }}>
          {d[labelKey]?.split(' ')[0]}
        </span>
      ))}
    </div>
  );
}

function ChartSummary({ label, value, color }) {
  return (
    <div style={{
      marginTop: 10, padding: '8px 12px',
      background: `${color}0d`, border: `0.5px solid ${color}33`, borderRadius: 8,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ color: '#555', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ── Time Series Chart — tabbed (Daily / Weekly / Monthly) ────────────────────
function TimeSeriesChart({ timeSeries, weeklySeries, monthSeries, trendPct, loading }) {
  const [tab, setTab] = useState('daily');

  const tabs = [
    { key: 'daily',   label: 'Daily',   badge: '30 Days' },
    { key: 'weekly',  label: 'Weekly',  badge: '12 Weeks' },
    { key: 'monthly', label: 'Monthly', badge: '12 Months' },
  ];

  const active = tab === 'daily' ? timeSeries : tab === 'weekly' ? weeklySeries : monthSeries;
  const total  = (active || []).reduce((s, d) => s + (d.count || 0), 0);
  const color  = tab === 'monthly' ? '#4a9af0' : tab === 'weekly' ? '#a78bfa' : '#F0C040';
  const summaryLabel = tab === 'daily' ? 'Total (30 days)' : tab === 'weekly' ? 'Total (12 weeks)' : 'Total (12 months)';

  if (loading) return (
    <PanelCard title="Check-in Trends" badge="Time Series">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  return (
    <PanelCard
      title="Check-in Trends"
      badge={
        <span>
          {tabs.find(t => t.key === tab)?.badge}
          {tab === 'daily' && <TrendBadge pct={trendPct} />}
        </span>
      }
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${tab === t.key ? color : '#333'}`,
              background: tab === t.key ? `${color}18` : 'transparent',
              color: tab === t.key ? color : '#555',
              fontWeight: tab === t.key ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(!active || active.length === 0) ? (
        <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No data yet.</div>
      ) : (
        <>
          <BarChart data={active} valueKey="count" labelKey="label" color={color} showValues={tab === 'monthly'} />
          <ChartXAxis data={active} labelKey="label" sparse={tab === 'daily'} />
          <ChartSummary label={summaryLabel} value={`${total} check-ins`} color={color} />
        </>
      )}
    </PanelCard>
  );
}

// ── Membership Growth Chart ───────────────────────────────────────────────────
function MemberGrowthChart({ data, loading }) {
  const [view, setView] = useState('new'); // 'new' | 'cumulative'

  if (loading) return (
    <PanelCard title="Membership Growth" badge="Last 12 Months">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  if (!data || data.length === 0) return (
    <PanelCard title="Membership Growth" badge="Last 12 Months">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No data yet.</div>
    </PanelCard>
  );

  const valueKey = view === 'new' ? 'newCount' : 'cumulative';
  const color    = view === 'new' ? '#34d399' : '#60a5fa';
  const total    = data[data.length - 1]?.cumulative || 0;
  const newThisMonth = data[data.length - 1]?.newCount || 0;

  return (
    <PanelCard title="Membership Growth" badge="Last 12 Months">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ key: 'new', label: 'New / Month' }, { key: 'cumulative', label: 'Cumulative' }].map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${view === v.key ? color : '#333'}`,
              background: view === v.key ? `${color}18` : 'transparent',
              color: view === v.key ? color : '#555',
              fontWeight: view === v.key ? 600 : 400,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <BarChart data={data} valueKey={valueKey} labelKey="label" color={color} showValues height={110} />
      <ChartXAxis data={data} labelKey="label" />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <ChartSummary label="New this month"   value={`+${newThisMonth}`} color="#34d399" />
        <ChartSummary label="Total registered" value={total}               color="#60a5fa" />
      </div>
    </PanelCard>
  );
}

// ── Avg Gym Duration Chart ────────────────────────────────────────────────────
function DurationChart({ data, loading }) {
  if (loading) return (
    <PanelCard title="Avg Gym Duration" badge="Last 30 Days">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  const withData  = (data || []).filter(d => d.avgMins !== null);
  const avgAll    = withData.length
    ? Math.round(withData.reduce((s, d) => s + d.avgMins, 0) / withData.length)
    : null;
  const color = '#f472b6';

  if (!data || withData.length === 0) return (
    <PanelCard title="Avg Gym Duration" badge="Last 30 Days">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
        No checkout data yet. Members need to scan out to track duration.
      </div>
    </PanelCard>
  );

  return (
    <PanelCard title="Avg Gym Duration" badge="Last 30 Days">
      <BarChart
        data={data}
        valueKey="avgMins"
        labelKey="label"
        color={(d) => d.avgMins === null ? '#2a2a2a' : color}
        height={110}
        showValues
        formatValue={formatDuration}
      />
      <ChartXAxis data={data} labelKey="label" sparse />
      <ChartSummary
        label={`Overall avg (${withData.length} days with data)`}
        value={formatDuration(avgAll)}
        color={color}
      />
    </PanelCard>
  );
}

// ── Attendance Pattern ────────────────────────────────────────────────────────
function AttendancePattern({ data, loading }) {
  if (loading) return (
    <PanelCard title="Attendance by Day" badge="30 Days">
      <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
    </PanelCard>
  );

  const peakDay = data.reduce((a, b) => a.count > b.count ? a : b, data[0] || { label: '—', count: 0, pct: 0 });

  return (
    <PanelCard title="Attendance by Day" badge="30 Days">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.textMuted, fontSize: 11, width: 28 }}>{d.label}</span>
            <div style={{ flex: 1, background: '#1e1e1e', height: 6, borderRadius: 3 }}>
              <div style={{
                background: (d.count === peakDay.count && d.count > 0) ? C.green : C.gold,
                height: 6, borderRadius: 3, width: `${d.pct || 0}%`, transition: 'width 0.5s',
              }} />
            </div>
            <span style={{ color: C.textSecondary, fontSize: 11, width: 32, textAlign: 'right' }}>
              {d.count}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, padding: '10px 12px',
        background: C.goldBg, border: '0.5px solid rgba(240,192,64,0.3)', borderRadius: 8,
      }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 500 }}>
          Peak Day: {peakDay.label} ({peakDay.count} check-ins)
        </div>
        <div style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>
          {peakDay.count > 0
            ? `Consider adding an extra trainer on ${peakDay.label}s.`
            : 'No attendance data recorded yet this month.'}
        </div>
      </div>
    </PanelCard>
  );
}

// ── Dropout Risk ──────────────────────────────────────────────────────────────
function DropoutRisk({ members, loading, error, lastUpdated }) {
  const getRiskColor = (level) => {
    if (level === 'Vigorous') return C.orange;
    if (level === 'Moderate') return C.gold;
    return C.green;
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
          {loading ? 'Loading…' : error ? 'Failed to load' : `${members.length} members flagged`}
        </span>
      </div>

      {lastUpdated && (
        <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 12, textAlign: 'right' }}>
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {!loading && !error && members.map(m => {
        const pct = Math.round((m.riskScore || 0) * 100);
        return (
          <div key={m.userId} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: '0.5px solid #131313',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.textSecondary, fontSize: 12 }}>{m.full_name}</div>
              <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{m.explanation}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
                background: getRiskColor(m.riskLevel) + '22',
                color: getRiskColor(m.riskLevel), marginBottom: 4,
              }}>
                {m.riskLevel}
              </div>
              <div style={{ background: '#1e1e1e', height: 4, borderRadius: 3, width: 60 }}>
                <div style={{
                  background: getRiskColor(m.riskLevel),
                  height: 4, borderRadius: 3, width: `${pct}%`,
                }} />
              </div>
              <div style={{ color: getRiskColor(m.riskLevel), fontSize: 10, marginTop: 2, fontWeight: 600 }}>
                {pct}%
              </div>
            </div>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsPanel({ token }) {
  const [atRisk,      setAtRisk]      = useState([]);
  const [stats,       setStats]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading,     setLoading]     = useState({ risk: true, stats: true });
  const [error,       setError]       = useState({ risk: '', stats: '' });

  const fetchAtRisk = useCallback(async () => {
    setLoading(p => ({ ...p, risk: true }));
    try {
      const data = await getAtRiskMembers(token);
      setAtRisk(Array.isArray(data) ? data : []);
      if (data?.[0]?.lastUpdated) setLastUpdated(data[0].lastUpdated);
    } catch (err) {
      setError(p => ({ ...p, risk: err.message }));
    } finally {
      setLoading(p => ({ ...p, risk: false }));
    }
  }, [token]);

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

  const attendancePattern  = stats?.attendancePattern  || DAY_LABELS.map(label => ({ label, count: 0, pct: 0 }));
  const timeSeries         = stats?.timeSeries         || [];
  const weeklySeries       = stats?.weeklySeries       || [];
  const monthSeries        = stats?.monthSeries        || [];
  const memberGrowthSeries = stats?.memberGrowthSeries || [];
  const durationSeries     = stats?.durationSeries     || [];
  const weekSessions       = stats?.week_sessions      ?? 0;
  const trendPct           = stats?.trend_pct          ?? null;
  const peakDay = attendancePattern.reduce((a, b) => a.count > b.count ? a : b, attendancePattern[0] || {});

  const metrics = [
    { label: 'Check-ins This Week',  value: String(weekSessions),         delta: trendPct !== null ? `${trendPct >= 0 ? '+' : ''}${trendPct}% vs last week` : 'Live from DB', deltaType: trendPct >= 0 ? 'up' : 'down', accent: C.gold   },
    { label: 'Dropout Risk Members', value: String(atRisk.length),        delta: atRisk.length > 0 ? 'Needs attention' : 'All good', deltaType: atRisk.length > 0 ? 'down' : 'neutral', accent: C.orange },
    { label: 'Top Performing Day',   value: peakDay.label || '—',         delta: `${peakDay.count || 0} check-ins (30 days)`, deltaType: 'neutral' },
    { label: 'Active Members',       value: String(stats?.active_members ?? '—'), delta: 'Current', deltaType: 'neutral', accent: C.green },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Row 1: Tabbed time series + Membership growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <TimeSeriesChart
          timeSeries={timeSeries}
          weeklySeries={weeklySeries}
          monthSeries={monthSeries}
          trendPct={trendPct}
          loading={loading.stats}
        />
        <MemberGrowthChart data={memberGrowthSeries} loading={loading.stats} />
      </div>

      {/* Row 2: Avg gym duration + Attendance by day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DurationChart     data={durationSeries}    loading={loading.stats} />
        <AttendancePattern data={attendancePattern}  loading={loading.stats} />
      </div>

      {/* Row 3: Dropout risk (full width) */}
      <DropoutRisk
        members={atRisk}
        loading={loading.risk}
        error={error.risk}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}