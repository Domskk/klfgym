import { useState } from 'react';
import { C, T, pillStyles } from '../../theme';

export function StatusPill({ status }) {
  const s = pillStyles[status?.toLowerCase()] || pillStyles.info;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
      background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}

export function MetricCard({ label, value, delta, deltaType = 'neutral', accent }) {
  const dc = deltaType === 'up' ? C.green : deltaType === 'down' ? C.red : C.textMuted;
  return (
    <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent || C.textPrimary, fontSize: 24, fontWeight: 600 }}>{value}</div>
      {delta && <div style={{ color: dc, fontSize: 11, marginTop: 4 }}>{delta}</div>}
    </div>
  );
}

export function GoldButton({ children, onClick, style = {}, small = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.goldDark : C.gold, color: C.bgPrimary, fontWeight: 600,
        fontSize: small ? 11 : 13, padding: small ? '5px 12px' : '8px 16px', borderRadius: 8,
        border: 'none', cursor: 'pointer', fontFamily: T.body, whiteSpace: 'nowrap',
        transition: 'background 0.15s', ...style }}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, danger = false, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'transparent', border: `0.5px solid ${hov ? (danger ? C.red : C.gold) : C.borderMid}`,
        color: hov ? (danger ? C.red : C.gold) : C.textSecondary, fontSize: 11, padding: '5px 10px',
        borderRadius: 6, cursor: 'pointer', fontFamily: T.body, transition: 'all 0.15s',
        whiteSpace: 'nowrap', ...style }}>
      {children}
    </button>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 10px' }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.gold }}>{children}</span>
      {action}
    </div>
  );
}

export function FormInput({ placeholder, value, onChange, type = 'text', style = {} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ background: '#0f0f0f', border: `0.5px solid ${C.borderMid}`, color: C.textPrimary,
        padding: '9px 12px', borderRadius: 8, fontSize: 13, fontFamily: T.body, ...style }} />
  );
}

export function FormSelect({ value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={onChange}
      style={{ background: '#0f0f0f', border: `0.5px solid ${C.borderMid}`, color: C.textPrimary,
        padding: '9px 12px', borderRadius: 8, fontSize: 13, fontFamily: T.body,
        WebkitAppearance: 'none', ...style }}>
      {children}
    </select>
  );
}

export function PanelCard({ title, badge, children, style = {}, action }) {
  return (
    <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 16, ...style }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ color: C.textSecondary, fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</span>
          {badge && <span style={{ color: C.gold, fontSize: 11 }}>{badge}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Avatar({ initials, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.goldBg,
      border: `1.5px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.gold, fontSize: size * 0.32, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function NotifCard({ children }) {
  return (
    <div style={{ background: '#0f1500', border: `0.5px solid rgba(240,192,64,0.3)`, borderRadius: 10,
      padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 6, height: 6, background: C.gold, borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />
      <div style={{ color: '#ccc', fontSize: 12, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function AdminTable({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{ color: C.textMuted, fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.5px', fontWeight: 500, padding: '6px 8px', textAlign: 'left',
              borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '9px 8px', fontSize: 12, color: C.textSecondary,
                borderBottom: `0.5px solid #131313` }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}