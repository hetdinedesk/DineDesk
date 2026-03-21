import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLocations, deleteLocation } from '../api/locations'
import { getPages, updatePage, deletePage } from '../api/pages'
import { getBanners, updateBanner, deleteBanner } from '../api/banners'
import { getSpecials } from '../api/specials'

const C = { page:'#080C14',panel:'#0E1420',card:'#141C2E',hover:'#1A2540',border:'#1E2D4A',border2:'#2A3F63',t0:'#F1F5FF',t1:'#B8C5E0',t2:'#7A8BAD',t3:'#445572',acc:'#FF6B2B',cyan:'#00D4FF',green:'#22C55E',amber:'#F59E0B',red:'#EF4444' }

const LEFT = [
  { key:'locations', label:'Locations',  icon:'📍' },
  { key:'content',   label:'Content',    icon:'📝' },
  { key:'specials',  label:'Specials',   icon:'🏷️' },
]
const RIGHT = {
  locations: [{ key:'loc-list', label:'Locations', icon:'📍' }],
  content:   [{ key:'pages',    label:'Pages',     icon:'📄' }, { key:'banners', label:'Banners', icon:'🖼️' }],
  specials:  [{ key:'specials-list', label:'Specials', icon:'🏷️' }],
}

export default function CmsSection({ clientId }) {
  const [lnav, setLnav] = useState('locations')
  const [rnav, setRnav] = useState('loc-list')
  const handleLeft = key => { setLnav(key); setRnav(RIGHT[key]?.[0]?.key || key) }
  const render = () => {
    if(rnav==='loc-list')     return <LocationsList clientId={clientId}/>
    if(rnav==='pages')       return <PagesManager  clientId={clientId}/>
    if(rnav==='banners')     return <BannersManager clientId={clientId}/>
    if(rnav==='specials-list') return <div style={{color:C.t2,fontSize:14}}>Same data as Items → Specials tab.</div>
    return <div style={{color:C.t3}}>Select a section.</div>
  }
  return (
    <div style={{ display:'flex',flex:1,minHeight:0,overflow:'hidden' }}>
      <div style={{ width:160,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column' }}>
        {LEFT.map(item=><button key={item.key} onClick={()=>handleLeft(item.key)}
          style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',border:'none',
            background:lnav===item.key?'#1F2D4A':'transparent',color:lnav===item.key?C.t0:C.t2,
            fontWeight:lnav===item.key?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'left',
            borderLeft:`2px solid ${lnav===item.key?C.acc:'transparent'}` }}>
          <span style={{fontSize:16}}>{item.icon}</span>{item.label}</button>)}
      </div>
      {RIGHT[lnav]&&<div style={{ width:200,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column' }}>
        {RIGHT[lnav].map(item=><button key={item.key} onClick={()=>setRnav(item.key)}
          style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:'none',
            background:rnav===item.key?'#1F2D4A':'transparent',color:rnav===item.key?C.t0:C.t2,
            fontWeight:rnav===item.key?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'left',
            borderLeft:`2px solid ${rnav===item.key?C.cyan:'transparent'}` }}>
          <span style={{fontSize:14}}>{item.icon}</span>{item.label}</button>)}
      </div>}
      <div style={{ flex:1,padding:'24px 32px',overflowY:'auto',background:C.page }}>{render()}</div>
    </div>
  )
}

function Row({ cells, onHover }) {
  return (
    <tr onMouseEnter={e=>e.currentTarget.style.background='#1A2540'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      {cells.map((cell,i)=><td key={i} style={{ padding:'11px 14px',fontSize:13,color:'#B8C5E0' }}>{cell}</td>)}
    </tr>
  )
}

function Table({ headers, rows, empty }) {
  return (
    <div style={{ background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden' }}>
      <table style={{ width:'100%',borderCollapse:'collapse' }}>
        <thead><tr style={{ background:C.card }}>
          {headers.map((h,i)=><th key={i} style={{ padding:'9px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:C.t3,borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length===0?<tr><td colSpan={headers.length} style={{ padding:28,textAlign:'center',color:C.t3,fontSize:13,fontStyle:'italic' }}>{empty||'No items.'}</td></tr>:rows}
        </tbody>
      </table>
    </div>
  )
}

function LocationsList({ clientId }) {
  const qc = useQueryClient()
  const { data:locations=[] } = useQuery({ queryKey:['locations',clientId], queryFn:()=>getLocations(clientId) })
  const del = useMutation({ mutationFn:id=>deleteLocation(clientId,id), onSuccess:()=>qc.invalidateQueries(['locations',clientId]) })
  return (
    <div>
      <h2 style={{ margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0 }}>Locations ({locations.length})</h2>
      <button style={{ display:'flex',alignItems:'center',gap:7,background:'none',border:'none',color:C.acc,fontSize:13,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',marginBottom:16,fontWeight:600 }}>
        ＋ Add a Location
      </button>
      <Table headers={['Name','Address','Phone','Edit','Delete']} empty="No locations yet."
        rows={locations.map(loc=>(
          <Row key={loc.id} cells={[
            <span style={{fontWeight:600,color:C.t0}}>{loc.name}</span>,
            <span style={{fontSize:12,color:C.t2}}>{loc.address}</span>,
            <span style={{fontSize:12,color:C.t2}}>{loc.phone||'—'}</span>,
            <button style={{padding:'4px 8px',background:'transparent',border:`1px solid ${C.border2}`,borderRadius:4,color:C.t2,fontSize:11,cursor:'pointer'}}>✏️</button>,
            <button onClick={()=>window.confirm(`Delete "${loc.name}"?`)&&del.mutate(loc.id)} style={{padding:'4px 8px',background:'transparent',border:`1px solid ${C.red}40`,borderRadius:4,color:C.red,fontSize:11,cursor:'pointer'}}>🗑️</button>
          ]}/>
        ))}
      />
    </div>
  )
}

function PagesManager({ clientId }) {
  const qc = useQueryClient()
  const { data:pages=[] } = useQuery({ queryKey:['pages',clientId], queryFn:()=>getPages(clientId) })
  const del = useMutation({ mutationFn:id=>deletePage(clientId,id), onSuccess:()=>qc.invalidateQueries(['pages',clientId]) })
  return (
    <div>
      <h2 style={{ margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0 }}>Pages ({pages.length})</h2>
      <button style={{ display:'flex',alignItems:'center',gap:7,background:'none',border:'none',color:C.acc,fontSize:13,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',marginBottom:16,fontWeight:600 }}>
        ＋ Add a Page
      </button>
      <Table headers={['Title','Slug','Status','Edit','Delete']} empty="No pages yet."
        rows={pages.map(pg=>(
          <Row key={pg.id} cells={[
            <span style={{fontWeight:600,color:C.t0}}>{pg.title}</span>,
            <span style={{fontSize:12,color:'#00D4FF',fontFamily:'monospace'}}>{pg.slug}</span>,
            <span style={{background:pg.status==='published'?'#052010':'#1A1000',color:pg.status==='published'?C.green:C.amber,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:700}}>{pg.status}</span>,
            <button style={{padding:'4px 8px',background:'transparent',border:`1px solid ${C.border2}`,borderRadius:4,color:C.t2,fontSize:11,cursor:'pointer'}}>✏️</button>,
            <button onClick={()=>window.confirm(`Delete "${pg.title}"?`)&&del.mutate(pg.id)} style={{padding:'4px 8px',background:'transparent',border:`1px solid ${C.red}40`,borderRadius:4,color:C.red,fontSize:11,cursor:'pointer'}}>🗑️</button>
          ]}/>
        ))}
      />
    </div>
  )
}

function BannersManager({ clientId }) {
  const qc = useQueryClient()
  const { data:banners=[] } = useQuery({ queryKey:['banners',clientId], queryFn:()=>getBanners(clientId) })
  const toggle = useMutation({ mutationFn:({id,isActive})=>updateBanner(clientId,id,{isActive}), onSuccess:()=>qc.invalidateQueries(['banners',clientId]) })
  const del = useMutation({ mutationFn:id=>deleteBanner(clientId,id), onSuccess:()=>qc.invalidateQueries(['banners',clientId]) })
  return (
    <div>
      <h2 style={{ margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0 }}>Banners ({banners.length})</h2>
      <Table headers={['Text','Active','Delete']} empty="No banners yet."
        rows={banners.map(b=>(
          <Row key={b.id} cells={[
            <span style={{fontWeight:600,color:C.t0}}>{b.text}</span>,
            <div onClick={()=>toggle.mutate({id:b.id,isActive:!b.isActive})}
              style={{width:36,height:20,borderRadius:10,background:b.isActive?'#FF6B2B':'#1F2D4A',cursor:'pointer',position:'relative',border:`1px solid ${b.isActive?'#FF6B2B':C.border2}`}}>
              <div style={{width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:b.isActive?18:2,transition:'left 0.15s'}}/></div>,
            <button onClick={()=>window.confirm('Delete banner?')&&del.mutate(b.id)} style={{padding:'4px 8px',background:'transparent',border:`1px solid ${C.red}40`,borderRadius:4,color:C.red,fontSize:11,cursor:'pointer'}}>🗑️</button>
          ]}/>
        ))}
      />
    </div>
  )
}