import { useState, useEffect } from 'react';
import { C, T } from '../../../theme';
import { SectionLabel, NotifCard } from '../../shared';

function TopBar({ name, onNotif }) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{
      background: C.bgPrimary, padding: '12px 20px 10px',
      borderBottom: `0.5px solid ${C.border}`, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: T.display, color: C.gold, fontSize: 22, letterSpacing: 2 }}>KL FITNESS</span>
        <button
          onClick={onNotif}
          style={{
            width: 32, height: 32, background: '#1a1a1a',
            border: `0.5px solid ${C.borderMid}`, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.textMuted}>
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: C.gold, borderRadius: '50%' }} />
        </button>
      </div>
      <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{greeting},</div>
      <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 15 }}>{name} 👋</div>
    </div>
  );
}

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return (
    <div style={{
      background: C.bgSecondary, border: `0.5px solid ${C.border}`,
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: T.display, fontSize: 38, color: C.gold, letterSpacing: 2, lineHeight: 1 }}>
          {h}:{m}<span style={{ fontSize: 22, opacity: 0.6 }}>{s}</span>
        </div>
        <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>Live Time</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 14 }}>{DAYS[now.getDay()]}</div>
        <div style={{ color: C.textMuted, fontSize: 12 }}>
          {MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
        </div>
      </div>
    </div>
  );
}

function MembershipCard({ plan, expires, daysLeft, name }) {
  const hasExpiry    = expires instanceof Date && !isNaN(expires);
  const expiryColor  = daysLeft <= 7 ? '#ef4444' : daysLeft <= 14 ? '#f0a500' : C.gold;
  const pct          = hasExpiry ? Math.max(0, Math.min(100, Math.round((daysLeft / 30) * 100))) : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg,#1a1a00 0%,#2a2000 100%)',
      border: `1px solid ${C.gold}`, borderRadius: 16, padding: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, border: '1px solid rgba(240,192,64,0.2)', borderRadius: '50%' }} />
      <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Active Plan</div>
      <div style={{ color: C.gold, fontSize: 18, fontWeight: 600, margin: '2px 0' }}>
        {plan || 'No Active Plan'}
      </div>
      <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 14 }}>{name}</div>

      {hasExpiry ? (
        <>
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>
            Expires on{' '}
            <span style={{ color: expiryColor }}>
              {expires.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div style={{ background: '#1e1e1e', height: 4, borderRadius: 4, marginTop: 10 }}>
            <div style={{ background: expiryColor, height: 4, borderRadius: 4, width: `${pct}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ color: expiryColor, fontSize: 11, textAlign: 'right', marginTop: 4 }}>
            {daysLeft} days left
          </div>
        </>
      ) : (
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>
          No membership assigned yet. Visit the front desk.
        </div>
      )}
    </div>
  );
}

function WeekCalendar() {
  const DN    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date();
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - 3));
    return d;
  });
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div key={i} style={{
            flexShrink: 0, width: 44,
            background: isToday ? C.goldBg : C.bgSecondary,
            border: `0.5px solid ${isToday ? C.gold : C.border}`,
            borderRadius: 10, padding: '8px 4px', textAlign: 'center',
          }}>
            <div style={{ color: C.textMuted, fontSize: 10 }}>{DN[d.getDay()]}</div>
            <div style={{ color: isToday ? C.gold : C.textPrimary, fontSize: 16, fontWeight: 500 }}>{d.getDate()}</div>
          </div>
        );
      })}
    </div>
  );
}

function QuickStats({ sessionsThisMonth = 0 }) {
  const stats = [
    { label: 'Sessions This Month', value: sessionsThisMonth || '—', color: C.gold },
    { label: 'Upcoming Classes',    value: '—',                       color: C.gold },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: C.bgSecondary, border: `0.5px solid ${C.border}`,
          borderRadius: 12, padding: 12,
        }}>
          <div style={{ color: s.color, fontSize: 22, fontWeight: 600 }}>{s.value}</div>
          <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function NotifModal({ onClose, expires }) {
  const hasExpiry = expires instanceof Date && !isNaN(expires);
  const items = [
    hasExpiry
      ? `Your membership expires on ${expires.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.`
      : 'You have no active membership. Visit the front desk to avail a plan.',
    'Check the Classes tab for upcoming schedules and promos.',
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: '#111', borderRadius: '16px 16px 0 0', padding: '16px 20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ color: C.textPrimary, fontWeight: 600, fontSize: 15 }}>Notifications</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((n, i) => (
            <NotifCard key={i}>
              <span style={{ color: C.gold, fontWeight: 500 }}>Alert: </span>{n}
            </NotifCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomeTab({ profileData, membership }) {
  const [showNotif, setShowNotif] = useState(false);

  const name     = profileData?.name     || 'Member';
  const plan     = membership?.plan      || '';
  const expires  = membership?.expires;
  const daysLeft = expires instanceof Date && !isNaN(expires)
    ? Math.max(0, Math.ceil((expires - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <TopBar name={name} onNotif={() => setShowNotif(true)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 0' }}>

        <ClockWidget />

        <SectionLabel>My Membership</SectionLabel>
        <MembershipCard
          plan={plan}
          expires={expires}
          daysLeft={daysLeft}
          name={name}
        />

        {expires instanceof Date && !isNaN(expires) && daysLeft <= 14 && (
          <div style={{ marginTop: 8 }}>
            <NotifCard>
              <strong style={{ color: C.gold }}>Reminder:</strong>{' '}
              Your membership expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew now!
            </NotifCard>
          </div>
        )}

        <SectionLabel>This Week</SectionLabel>
        <WeekCalendar />

        <SectionLabel>Quick Stats</SectionLabel>
        <QuickStats />

        <div style={{ height: 20 }} />
      </div>

      {showNotif && <NotifModal onClose={() => setShowNotif(false)} expires={expires} />}
    </div>
  );
}