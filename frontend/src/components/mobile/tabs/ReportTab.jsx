import { useState } from 'react';
import { C, T } from '../../../theme';
import { StatusPill, GoldButton } from '../../shared';

const EQUIPMENT_LIST=['Cable Machine','Weight Plates','Treadmill','Bench Press','Rowing Machine','Squat Rack','Pull-up Bar','Spin Bike','Dumbbells','Other'];
const ISSUE_TYPES=['Faulty cable / mechanism','Broken plates / weights','Dirty / needs cleaning','Safety hazard','Missing parts','Electrical issue','Noise / vibration','Other'];
const PRIORITY=[{label:'Low',color:'#5aaa5a',bg:'#0f1f0f'},{label:'Medium',color:'#F0C040',bg:'#1a1a00'},{label:'High',color:'#e07020',bg:'#1a0a00'}];

function ReportForm({ onSubmit }) {
  const [equipment,setEquipment]=useState('Cable Machine');
  const [issue,setIssue]=useState('Faulty cable / mechanism');
  const [desc,setDesc]=useState('');
  const [priority,setPriority]=useState('Medium');
  const [submitted,setSubmitted]=useState(false);
  const selStyle={width:'100%',background:'#0f0f0f',border:`0.5px solid #2a2a2a`,color:'#fff',
    padding:'10px 12px',borderRadius:8,fontSize:13,fontFamily:T.body,marginBottom:12,WebkitAppearance:'none'};
  function submit() {
    if(!equipment||!issue) return;
    // TODO: await addDoc(collection(db,'equipmentReports'),{equipment,issue,description:desc,priority,reportedBy:uid,date:serverTimestamp(),status:'pending'});
    setSubmitted(true); onSubmit({equipment,issue,desc,priority});
  }
  if(submitted) return (
    <div style={{ textAlign:'center',padding:'24px 0' }}>
      <div style={{ fontSize:40 }}>✅</div>
      <div style={{ color:'#fff',fontWeight:600,fontSize:16,marginTop:12 }}>Report Submitted!</div>
      <div style={{ color:'#555',fontSize:13,marginTop:6 }}>Our staff will review and address your report shortly.</div>
      <button onClick={()=>setSubmitted(false)} style={{ marginTop:18,background:'#1a1a00',border:'0.5px solid #F0C040',
        color:'#F0C040',padding:'10px 24px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:T.body }}>
        Report Another Issue
      </button>
    </div>
  );
  return (
    <div>
      <div style={{ color:'#555',fontSize:12,marginBottom:6 }}>Equipment</div>
      <select value={equipment} onChange={e=>setEquipment(e.target.value)} style={selStyle}>
        {EQUIPMENT_LIST.map(eq=><option key={eq}>{eq}</option>)}
      </select>
      <div style={{ color:'#555',fontSize:12,marginBottom:6 }}>Issue Type</div>
      <select value={issue} onChange={e=>setIssue(e.target.value)} style={selStyle}>
        {ISSUE_TYPES.map(it=><option key={it}>{it}</option>)}
      </select>
      <div style={{ color:'#555',fontSize:12,marginBottom:6 }}>Priority Level</div>
      <div style={{ display:'flex',gap:8,marginBottom:12 }}>
        {PRIORITY.map(p=>(
          <button key={p.label} onClick={()=>setPriority(p.label)}
            style={{ flex:1,background:priority===p.label?p.bg:'transparent',border:`0.5px solid ${priority===p.label?p.color:'#2a2a2a'}`,
              color:priority===p.label?p.color:'#555',padding:'7px 0',borderRadius:8,fontSize:12,
              fontWeight:500,cursor:'pointer',fontFamily:T.body }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ color:'#555',fontSize:12,marginBottom:6 }}>Description (optional)</div>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
        placeholder="Describe the issue in more detail..."
        style={{ width:'100%',background:'#0f0f0f',border:`0.5px solid #2a2a2a`,color:'#fff',
          padding:'10px 12px',borderRadius:8,fontSize:13,fontFamily:T.body,resize:'none',marginBottom:16 }} />
      <GoldButton onClick={submit} style={{ width:'100%',padding:12,fontSize:14,borderRadius:10 }}>Submit Report</GoldButton>
    </div>
  );
}

export default function ReportTab() {
  const [reports,setReports]=useState([
    {id:1,equipment:'Cable Machine #2',issue:'Faulty cable',date:'March 14, 2026',status:'In Review'},
    {id:2,equipment:'Treadmill #3',issue:'Dirty / cleaning',date:'March 8, 2026',status:'Resolved'},
  ]);
  function onSubmit(data) {
    setReports(r=>[{id:r.length+1,equipment:data.equipment,issue:data.issue,date:'Just now',status:'Pending'},...r]);
  }
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{ padding:'14px 20px 0',flexShrink:0 }}>
        <div style={{ color:'#fff',fontSize:18,fontWeight:600 }}>Equipment Report</div>
        <div style={{ color:'#555',fontSize:12,marginTop:2 }}>Help us keep the gym in top shape</div>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'14px 20px 0' }}>
        <div style={{ background:C.bgSecondary,border:`0.5px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:16 }}>
          <ReportForm onSubmit={onSubmit} />
        </div>
        <div style={{ color:'#F0C040',fontSize:11,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:10 }}>My Recent Reports</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {reports.map(r=>(
            <div key={r.id} style={{ background:C.bgSecondary,border:`0.5px solid ${C.border}`,borderRadius:10,padding:12,
              display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ color:'#fff',fontWeight:500,fontSize:13 }}>{r.equipment}</div>
                <div style={{ color:'#555',fontSize:12,marginTop:2 }}>{r.issue}</div>
                <div style={{ color:'#555',fontSize:11,marginTop:2 }}>{r.date}</div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
        <div style={{ height:20 }} />
      </div>
    </div>
  );
}