import { useState, useEffect } from 'react';
import { C, T } from '../../theme';
import DashboardPanel     from './panels/DashboardPanel';
import AnalyticsPanel     from './panels/AnalyticsPanel';
import TrainersPanel      from './panels/TrainersPanel';
import AnnouncementsPanel from './panels/AnnouncementsPanel';
import InventoryPanel     from './panels/InventoryPanel';
import AddMemberModal     from './AddMemberModal'; 
import AttendancePanel    from './panels/AttendancePanel';

const NAV = [
  { id:'dashboard',     label:'Dashboard',     badge:null, title:'Overview Dashboard',        sub:'Tuesday, March 17, 2026',        btn:'+ Add Member',   showAddMember:true,  Component:DashboardPanel,     iconPath:'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id:'analytics',     label:'Analytics',     badge:'AI', title:'Analytics & Insights',      sub:'AI-powered predictive analytics', btn:'Export Report',  showAddMember:false, Component:AnalyticsPanel,     iconPath:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
  { id:'trainers',      label:'Trainers',      badge:null, title:'Trainer Management',         sub:'Add, edit, or remove coaches',   btn:'+ Add Trainer',  showAddMember:false, Component:TrainersPanel,      iconPath:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { id:'announcements', label:'Announcements', badge:'3',  title:'Announcements',              sub:'Notify all gym members',          btn:'+ New Post',     showAddMember:false, Component:AnnouncementsPanel, iconPath:'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z' },
  { id:'inventory',     label:'Inventory',     badge:null, title:'Inventory Management',       sub:'Track gym equipment and supplies', btn:'+ Add Item',    showAddMember:false, Component:InventoryPanel,     iconPath:'M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-8 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-9h-4V5h4v2z' },
  { id:'attendance', label:'Attendance', badge:null, title:'Attendance Scanner', sub:'Scan member QR codes', btn:'↻ Refresh', showAddMember:false, Component:AttendancePanel,
  iconPath:'M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z' },
];

function SidebarItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', cursor: 'pointer',
        background: active ? '#0f0f00' : hov ? '#0f0f0f' : 'transparent',
        border: 'none', borderLeft: `2px solid ${active ? C.gold : 'transparent'}`,
        color: active ? C.gold : hov ? C.textSecondary : '#666',
        fontSize: 13, fontFamily: T.body, textAlign: 'left', transition: 'all 0.15s',
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={item.iconPath} /></svg>
      {item.label}
      {item.badge && (
        <span style={{
          marginLeft: 'auto', background: C.gold, color: C.bgPrimary,
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
        }}>{item.badge}</span>
      )}
    </button>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [activeId, setActiveId]         = useState('dashboard');
  const [time, setTime]                 = useState('--:--');
  const [showAddMember, setShowAddMember] = useState(false); // ← NEW
  const token = localStorage.getItem('token');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const panel = NAV.find(p => p.id === activeId);
  const Comp  = panel.Component;

  // ── header button handler ──────────────────────────────────────────────────
  const handleHeaderBtn = () => {
    if (panel.showAddMember) {
      setShowAddMember(true); // open modal on Dashboard panel
    } else {
      alert(panel.btn);       // placeholder for other panels
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bgPrimary, overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 210, background: '#080808', borderRight: `0.5px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontFamily: T.display, color: C.gold, fontSize: 20, letterSpacing: 2 }}>KL FITNESS</div>
          <div style={{ color: '#333', fontSize: 9, letterSpacing: 1.5, marginTop: 2 }}>GYM MANAGEMENT SYSTEM</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div style={{ color: '#333', fontSize: 10, letterSpacing: 1.5, padding: '8px 16px 4px' }}>MAIN</div>
          {NAV.slice(0, 2).map(p => <SidebarItem key={p.id} item={p} active={activeId === p.id} onClick={() => setActiveId(p.id)} />)}
          <div style={{ color: '#333', fontSize: 10, letterSpacing: 1.5, padding: '12px 16px 4px' }}>MANAGEMENT</div>
          {NAV.slice(2).map(p => <SidebarItem key={p.id} item={p} active={activeId === p.id} onClick={() => setActiveId(p.id)} />)}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, background: C.goldBg,
              border: `1px solid ${C.gold}`, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.gold, fontSize: 11, fontWeight: 600,
            }}>RA</div>
            <div>
              <div style={{ color: C.textPrimary, fontSize: 12, fontWeight: 500 }}>R. Aguila</div>
              <div style={{ color: C.textMuted, fontSize: 10 }}>Gym Owner</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Nav */}
        <div style={{
          background: C.bgPrimary, borderBottom: `0.5px solid ${C.border}`,
          padding: '12px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 500 }}>{panel.title}</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{panel.sub}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 12 }}>{time}</div>
            <div style={{
              width: 32, height: 32, background: C.bgSecondary,
              border: `0.5px solid ${C.borderMid}`, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={C.textMuted}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, background: C.gold, borderRadius: '50%' }} />
            </div>

            {/* ← This now opens AddMemberModal on the Dashboard panel */}
            <button
              onClick={handleHeaderBtn}
              style={{
                background: C.gold, color: C.bgPrimary, fontWeight: 600,
                fontSize: 12, padding: '7px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontFamily: T.body,
              }}
            >{panel.btn}</button>

            <button
              onClick={onLogout}
              style={{
                background: 'transparent', border: '1px solid rgba(240,192,64,0.5)',
                color: C.gold, fontSize: 12, padding: '7px 14px',
                borderRadius: 8, cursor: 'pointer', fontFamily: T.body,
              }}
            >Logout</button>
          </div>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <Comp token={token} onAddMember={() => setShowAddMember(true)} />
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            // Optional: trigger a refresh of the member list in DashboardPanel
            setShowAddMember(false);
          }}
        />
      )}
    </div>
  );
}