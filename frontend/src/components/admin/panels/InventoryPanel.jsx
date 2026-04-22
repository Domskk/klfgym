import { useState } from 'react';
import { C, T, INVENTORY_DATA } from '../../../theme';
import { StatusPill, GoldButton, OutlineButton, PanelCard, FormInput, FormSelect } from '../../shared';

const CATEGORIES=['Cardio','Free Weights','Machines','Accessories','Supplies'];
const CONDITIONS=['Good','Needs Repair','Out of Stock'];

function AddItemForm({ onAdd }) {
  const [form,setForm]=useState({name:'',category:CATEGORIES[0],qty:'',condition:'Good'});
  const [error,setError]=useState('');
  const up=(k,v)=>setForm(f=>({...f,[k]:v}));
  function submit() {
    if(!form.name.trim()||form.qty===''){setError('Item name and quantity are required.');return;}
    // TODO: await addDoc(collection(db,'inventory'),{...form,qty:Number(form.qty),updatedAt:serverTimestamp()});
    onAdd({...form,id:Date.now(),qty:Number(form.qty)}); setForm({name:'',category:CATEGORIES[0],qty:'',condition:'Good'}); setError('');
  }
  return (
    <PanelCard title="Add Inventory Item">
      {error&&<div style={{ background:'#1f0f0f',border:'0.5px solid #5a2a2a',borderRadius:6,padding:'8px 12px',marginBottom:12,color:'#aa5a5a',fontSize:12 }}>{error}</div>}
      <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 80px 1fr auto',gap:10,alignItems:'flex-end' }}>
        <div>
          <div style={{ color:'#555',fontSize:11,marginBottom:5 }}>Equipment / Item *</div>
          <FormInput placeholder="e.g. Treadmill" value={form.name} onChange={e=>up('name',e.target.value)} style={{ width:'100%' }} />
        </div>
        <div>
          <div style={{ color:'#555',fontSize:11,marginBottom:5 }}>Category</div>
          <FormSelect value={form.category} onChange={e=>up('category',e.target.value)} style={{ width:'100%' }}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </FormSelect>
        </div>
        <div>
          <div style={{ color:'#555',fontSize:11,marginBottom:5 }}>Qty *</div>
          <FormInput type="number" placeholder="0" value={form.qty} onChange={e=>up('qty',e.target.value)} style={{ width:'100%' }} />
        </div>
        <div>
          <div style={{ color:'#555',fontSize:11,marginBottom:5 }}>Condition</div>
          <FormSelect value={form.condition} onChange={e=>up('condition',e.target.value)} style={{ width:'100%' }}>
            {CONDITIONS.map(c=><option key={c}>{c}</option>)}
          </FormSelect>
        </div>
        <GoldButton onClick={submit}>Add Item</GoldButton>
      </div>
    </PanelCard>
  );
}

function InventoryRow({ item, onEdit, onDelete }) {
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({...item});
  function save() {
    // TODO: await updateDoc(doc(db,'inventory',item.id),{...form,qty:Number(form.qty)});
    onEdit({...item,...form,qty:Number(form.qty)}); setEditing(false);
  }
  if(editing) return (
    <tr><td colSpan={5} style={{ padding:'8px 8px' }}>
      <div style={{ display:'flex',gap:8,alignItems:'center',background:'#0f0f0f',borderRadius:8,padding:'8px 12px' }}>
        <FormInput value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ flex:2 }} />
        <FormSelect value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ flex:1 }}>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </FormSelect>
        <FormInput type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} style={{ width:70 }} />
        <FormSelect value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} style={{ flex:1 }}>
          {CONDITIONS.map(c=><option key={c}>{c}</option>)}
        </FormSelect>
        <GoldButton small onClick={save}>Save</GoldButton>
        <OutlineButton onClick={()=>setEditing(false)}>Cancel</OutlineButton>
      </div>
    </td></tr>
  );
  return (
    <tr style={{ borderBottom:'0.5px solid #131313' }}>
      <td style={{ padding:'10px 8px' }}><span style={{ color:'#fff',fontWeight:500,fontSize:13 }}>{item.name}</span></td>
      <td style={{ padding:'10px 8px',fontSize:12,color:'#555' }}>{item.category}</td>
      <td style={{ padding:'10px 8px' }}><span style={{ color:item.qty===0?'#aa5a5a':'#F0C040',fontWeight:600,fontSize:15 }}>{item.qty}</span></td>
      <td style={{ padding:'10px 8px' }}><StatusPill status={item.condition} /></td>
      <td style={{ padding:'10px 8px' }}>
        <div style={{ display:'flex',gap:6 }}>
          <OutlineButton onClick={()=>setEditing(true)}>Edit</OutlineButton>
          {item.qty===0&&<OutlineButton onClick={()=>onEdit({...item,qty:1,condition:'Good'})}>Restock</OutlineButton>}
          <OutlineButton danger onClick={()=>onDelete(item.id)}>Delete</OutlineButton>
        </div>
      </td>
    </tr>
  );
}

export default function InventoryPanel() {
  // TODO: Replace with Firebase inventory collection
  const [items,setItems]=useState(INVENTORY_DATA);
  const [filter,setFilter]=useState('All');
  function addItem(item){setItems(p=>[...p,item]);}
  function editItem(u){setItems(p=>p.map(i=>i.id===u.id?u:i));}
  function deleteItem(id){if(!window.confirm('Remove this item?'))return; setItems(p=>p.filter(i=>i.id!==id));}
  const metrics=[
    {label:'Total Items',       value:items.length,                                            accent:'#F0C040'},
    {label:'In Good Condition', value:items.filter(i=>i.condition==='Good').length,             accent:'#5aaa5a'},
    {label:'Needs Repair',      value:items.filter(i=>i.condition==='Needs Repair').length,     accent:'#e07020'},
    {label:'Out of Stock',      value:items.filter(i=>i.condition==='Out of Stock').length,     accent:'#aa5a5a'},
  ];
  const displayed=filter==='All'?items:items.filter(i=>i.category===filter);
  const filterOpts=['All',...CATEGORIES];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12 }}>
        {metrics.map((m,i)=>(
          <div key={i} style={{ background:C.bgSecondary,border:`0.5px solid ${C.border}`,borderRadius:10,padding:'14px 16px' }}>
            <div style={{ color:'#555',fontSize:11,marginBottom:6 }}>{m.label}</div>
            <div style={{ color:m.accent,fontSize:26,fontWeight:600 }}>{m.value}</div>
          </div>
        ))}
      </div>
      <PanelCard title="Stock Overview">
        <div style={{ display:'flex',height:8,borderRadius:8,overflow:'hidden' }}>
          {[{color:'#5aaa5a',n:items.filter(i=>i.condition==='Good').length},
            {color:'#e07020',n:items.filter(i=>i.condition==='Needs Repair').length},
            {color:'#aa5a5a',n:items.filter(i=>i.condition==='Out of Stock').length}]
            .map((s,i)=><div key={i} style={{ flex:s.n,background:s.color,minWidth:s.n>0?4:0 }} />)}
        </div>
        <div style={{ display:'flex',gap:20,marginTop:10 }}>
          {[{label:'Good',color:'#5aaa5a'},{label:'Needs Repair',color:'#e07020'},{label:'Out of Stock',color:'#aa5a5a'}].map(l=>(
            <div key={l.label} style={{ display:'flex',alignItems:'center',gap:6 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:l.color }} />
              <span style={{ color:'#555',fontSize:12 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </PanelCard>
      <AddItemForm onAdd={addItem} />
      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
        {filterOpts.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'5px 14px',borderRadius:999,fontSize:12,fontWeight:500,cursor:'pointer',
              border:`0.5px solid ${filter===f?'#F0C040':'#2a2a2a'}`,background:filter===f?'#1a1a00':C.bgSecondary,
              color:filter===f?'#F0C040':'#555',fontFamily:T.body,transition:'all 0.15s' }}>
            {f}
          </button>
        ))}
      </div>
      <PanelCard title="Inventory List" badge={`${displayed.length} items`}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr>{['Equipment / Item','Category','Qty','Condition','Actions'].map((h,i)=>(
            <th key={i} style={{ color:'#555',fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px',
              fontWeight:500,padding:'6px 8px',textAlign:'left',borderBottom:`0.5px solid ${C.border}` }}>{h}</th>
          ))}</tr></thead>
          <tbody>{displayed.map(item=><InventoryRow key={item.id} item={item} onEdit={editItem} onDelete={deleteItem} />)}</tbody>
        </table>
        {displayed.length===0&&<div style={{ color:'#555',textAlign:'center',padding:'40px 0',fontSize:13 }}>No items in this category.</div>}
      </PanelCard>
    </div>
  );
}