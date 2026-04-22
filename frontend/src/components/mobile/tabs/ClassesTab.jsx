import { useState } from 'react';
import { C, T, EVENTS_DATA } from '../../../theme';
import { NotifCard } from '../../shared';

const TYPE_META = {
  class:{ label:'Class', bg:'#0f1a2a', color:'#4a9af0' },
  event:{ label:'Event', bg:'#1a0f2a', color:'#aa4af0' },
  promo:{ label:'Promo', bg:'#1a1a00', color:'#F0C040' },
};

function EventCard({ event }) {
  const [notified,setNotified] = useState(false);
  const meta = TYPE_META[event.type];
  return (
    <div style={{ background:C.bgSecondary, border:`0.5px solid ${event.type==='promo'?'rgba(240,192,64,0.35)':C.border}`,
      borderRadius:14, padding:14, position:'relative' }}>
      <span style={{ display:'inline-block', fontSize:10, fontWeight:600, letterSpacing:'0.8px',
        textTransform:'uppercase', padding:'2px 8px', borderRadius:999, background:meta.bg, color:meta.color, marginBottom:8 }}>
        {meta.label}
      </span>
      <button onClick={()=>setNotified(n=>!n)} style={{ position:'absolute', top:14, right:14,
        background:notified?C.goldBg:'transparent', border:`0.5px solid ${notified?C.gold:C.borderMid}`,
        color:notified?C.gold:C.textMuted, fontSize:10, padding:'3px 8px', borderRadius:8,
        cursor:'pointer', fontFamily:T.body, display:'flex', alignItems:'center', gap:4 }}>
        {notified?'🔔 On':'🔕 Notify'}
      </button>
      <div style={{ color:C.textPrimary, fontWeight:500, fontSize:14 }}>{event.title}</div>
      <div style={{ color:C.textMuted, fontSize:12, marginTop:4 }}>{event.date}</div>
      {event.info && <div style={{ color:event.type==='promo'?C.gold:C.textMuted, fontSize:12, marginTop:6, fontWeight:event.type==='promo'?500:400 }}>{event.info}</div>}
    </div>
  );
}

export default function ClassesTab() {
  const [filter,setFilter] = useState('All');
  const filters = ['All','Classes','Events','Promos'];
  const filtered = filter==='All' ? EVENTS_DATA : EVENTS_DATA.filter(e=>{
    if(filter==='Classes') return e.type==='class';
    if(filter==='Events')  return e.type==='event';
    if(filter==='Promos')  return e.type==='promo';
    return true;
  });
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'14px 20px 0', flexShrink:0 }}>
        <div style={{ color:C.textPrimary, fontSize:18, fontWeight:600 }}>Classes & Events</div>
        <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>Stay updated on what's coming</div>
      </div>
      <div style={{ display:'flex', gap:8, padding:'10px 20px 0', overflowX:'auto', flexShrink:0 }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ flexShrink:0, padding:'5px 14px', borderRadius:999,
            fontSize:12, fontWeight:500, cursor:'pointer', border:`0.5px solid ${filter===f?C.gold:C.borderMid}`,
            background:filter===f?C.gold:C.bgSecondary, color:filter===f?C.bgPrimary:C.textMuted,
            fontFamily:T.body, whiteSpace:'nowrap' }}>{f}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 0' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(e=><EventCard key={e.id} event={e} />)}
        </div>
        <div style={{ marginTop:10 }}>
          <NotifCard><span style={{ color:C.gold, fontWeight:500 }}>Upcoming:</span> Training session with Coach Marco Cruz on March 19, 2026 at 6:00 PM.</NotifCard>
        </div>
        <div style={{ height:20 }} />
      </div>
    </div>
  );
}