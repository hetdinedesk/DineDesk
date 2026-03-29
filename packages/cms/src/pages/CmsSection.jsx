import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Table from '../Components/Table'
import NavbarSection from './NavbarSection'
import HomePageSection from './HomePageSection'
import { getLocations, updateLocation, deleteLocation } from '../api/locations'
import { getPages, updatePage, deletePage } from '../api/pages'
import { getBanners, updateBanner, deleteBanner } from '../api/banners'
import { getSpecials } from '../api/specials'

const C = { page:'#080C14',panel:'#0E1420',card:'#141C2E',hover:'#1A2540',border:'#1E2D4A',border2:'#2A3F63',t0:'#F1F5FF',t1:'#B8C5E0',t2:'#7A8BAD',t3:'#445572',acc:'#FF6B2B',cyan:'#00D4FF',green:'#22C55E',amber:'#F59E0B',red:'#EF4444' }

const LEFT = [
  { key:'locations', label:'Locations', icon:'📍' },
  { key:'navigation', label:'Navigation', icon:'☰' },
  { key:'homepage', label:'Homepage', icon:'🏠' },
  { key:'specials', label:'Specials', icon:'🏷️' },
  { key:'settings', label:'Settings', icon:'⚙️' },
]
const RIGHT = {
  locations: [{ key:'loc-list', label:'Locations', icon:'📍' }],
  navigation: [
    { key:'header-sections', label:'Header Sections', icon:'☰' },
    { key:'banners', label:'Banners', icon:'🖼️' },
    { key:'footer-sections', label:'Footer Sections', icon:'🦶' }
  ],
  homepage: [
    { key:'promo-tiles', label:'Promo Tiles (Coming Soon)', icon:'🏷️' },
    { key:'homepage-banners', label:'Homepage Banners (Coming Soon)', icon:'🖼️' },
    { key:'content', label:'Content (Coming Soon)', icon:'📝' }
  ],
  specials:  [{ key:'specials-list', label:'Specials (Coming Soon)', icon:'🏷️' }],
  settings: [
    { key:'toolbox', label:'Toolbox (Coming Soon)', icon:'🔧' },
    { key:'mobile-ctas', label:'Mobile CTAs (Coming Soon)', icon:'📱' }
  ]
}

export default function CmsSection({ clientId }) {
  const [lnav, setLnav] = useState('locations')
  const [rnav, setRnav] = useState('loc-list')
  const handleLeft = key => { setLnav(key); setRnav(RIGHT[key]?.[0]?.key || key) }
  const render = () => {
    if(lnav==='locations') return <LocationsList clientId={clientId}/>
    if(lnav==='navigation') {
      return <NavbarSection clientId={clientId} subsection={rnav} />
    }
    if(lnav==='homepage') {
      if(rnav==='promo-tiles') return <div style={{color:C.t2,fontSize:14}}>Promo Tiles - Content coming soon.</div>
      if(rnav==='homepage-banners') return <div style={{color:C.t2,fontSize:14}}>Homepage Banners - Content coming soon.</div>
      if(rnav==='content') return <div style={{color:C.t2,fontSize:14}}>Content - Content coming soon.</div>
      return <div style={{color:C.t2,fontSize:14}}>Homepage section - Select a subsection from the sidebar.</div>
    }
    if(lnav==='specials') return <div style={{color:C.t2,fontSize:14}}>Specials management coming soon.</div>
    if(lnav==='settings') {
      if(rnav==='toolbox') return <div style={{color:C.t2,fontSize:14}}>Toolbox - Content coming soon.</div>
      if(rnav==='mobile-ctas') return <div style={{color:C.t2,fontSize:14}}>Mobile CTAs - Content coming soon.</div>
      return <div style={{color:C.t2,fontSize:14}}>Settings section - Select a subsection from the sidebar.</div>
    }
    return <div style={{color:C.t3}}>Select a main section.</div>
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



import LocationForm from '../Components/LocationForm'

function LocationsList({ clientId }) {
  const qc = useQueryClient()
  const { data:locations=[] } = useQuery({ queryKey:['locations',clientId], queryFn:()=>getLocations(clientId) })
  const [editModal, setEditModal] = useState(false)
  const [editLocation, setEditLocation] = useState(null)
  
  const del = useMutation({ 
    mutationFn:id=>deleteLocation(clientId,id), 
    onSuccess:()=>qc.invalidateQueries(['locations',clientId]) 
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => updateLocation(clientId, id, { isActive }),
    onSuccess: () => qc.invalidateQueries(['locations', clientId])
  })
  
  const handleAdd = () => {
    setEditLocation({})
    setEditModal(true)
  }
  
  const handleEdit = (row) => {
    setEditLocation(row)
    setEditModal(true)
  }
  
  const handleFormClose = () => {
    setEditModal(false)
    setEditLocation(null)
  }
  
  const handleFormSave = () => {
    qc.invalidateQueries(['locations',clientId])
    handleFormClose()
  }
  
  return (
    <div>
      <h2 style={{ margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0 }} >Locations ({locations.length})</h2>
      <button onClick={handleAdd}
        style={{ display:'flex',alignItems:'center',gap:7,background:'none',border:'none',color:C.acc,fontSize:13,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',marginBottom:16,fontWeight:600 }}>
        ＋ Add a Location
      </button>
      <Table 
        title="Locations" 
        headers={[
          { key: 'name', label: 'Name' },
          { key: 'address', label: 'Address' },
          { key: 'phone', label: 'Phone' },
          { key: 'isPrimary', label: 'Header', render: v => v ? '⭐' : '' },
          { key: 'showInFooter', label: 'Footer', render: v => v ? '📋' : '' },
          { 
            key: 'isActive', 
            label: 'Active', 
            render: (val, row) => (
              <div 
                onClick={() => !toggleActive.isPending && toggleActive.mutate({ id: row.id, isActive: !val })}
                style={{
                  width: 44, 
                  height: 24, 
                  borderRadius: 12, 
                  background: val ? '#22C55E' : '#1F2D4A', 
                  cursor: toggleActive.isPending ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  border: `1px solid ${val ? '#22C55E' : C.border2}`,
                  opacity: toggleActive.isPending ? 0.6 : 1
                }}
              >
                <div 
                  style={{
                    width: 18, 
                    height: 18, 
                    borderRadius: '50%', 
                    background: '#fff', 
                    position: 'absolute', 
                    top: 2, 
                    left: val ? 22 : 2, 
                    transition: 'left 0.2s'
                  }}
                />
              </div>
            )
          }
        ]} 
        data={locations}
        empty="No locations yet"
        onDelete={(row) => window.confirm(`Delete "${row.name}"?`) && del.mutate(row.id)}
        onEdit={handleEdit}
        showSearch={false}
      />
      {editModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, maxWidth:'90vw', maxHeight:'90vh', overflow:'auto' }}>
            <LocationForm
              key={editLocation?.id || 'new-location'}
              location={editLocation}
              isEdit={!!editLocation.id}
              clientId={clientId}
              onSave={handleFormSave}
              onClose={handleFormClose}
            />

          </div>
        </div>
      )}
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
      <Table 
        title="Pages" 
        headers={[
          { key: 'title', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status', render: (val) => (
            <span style={{
              background: val==='published'?'#052010':'#1A1000',
              color: val==='published'?C.green:C.amber,
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700
            }}>{val}</span>
          )}
        ]} 
        data={pages}
        empty="No pages yet"
        onDelete={(row) => window.confirm(`Delete "${row.title}"?`) && del.mutate(row.id)}
        onEdit={(row) => alert(`Edit page ${row.title} (TODO)`)}
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
      <Table 
        title="Banners" 
        headers={[
          { key: 'text', label: 'Text' },
          { key: 'isActive', label: 'Active', render: (val, row) => (
            <div onClick={() => toggle.mutate({id: row.id, isActive: !val})}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: val ? '#FF6B2B' : '#1F2D4A', cursor: 'pointer', position: 'relative',
                border: `1px solid ${val ? '#FF6B2B' : C.border2}`
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, left: val ? 18 : 2, transition: 'left 0.15s'
              }}/>
            </div>
          )}
        ]}
        data={banners}
        empty="No banners yet"
        onDelete={(row) => window.confirm('Delete banner?') && del.mutate(row.id)}
      />
    </div>
  )
}

// Footer CMS Section - Quick editor for footer content
function FooterCmsSection({ clientId }) {
  const qc = useQueryClient()
  const { data: config = {} } = useQuery({
    queryKey: ['config', clientId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/config`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
      })
      return res.json()
    }
  })

  const [footer, setFooter] = useState(config.footer || {})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFooter(config.footer || {})
  }, [config])

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('dd_token')
        },
        body: JSON.stringify({ footer })
      })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  })

  const set = (k, v) => setFooter(prev => ({ ...prev, [k]: v }))
  const setSocial = (platform, url) => setFooter(prev => ({
    ...prev, socialLinks: { ...(prev.socialLinks || {}), [platform]: url }
  }))

  const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'google', label: 'Google', placeholder: 'https://g.page/r/...' },
    { key: 'tripadvisor', label: 'TripAdvisor', placeholder: 'https://tripadvisor.com/...' },
  ]

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.t0 }}>Footer Content</h2>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ padding:'8px 20px', background: mutation.isPending ? C.card : C.acc,
            border:'none', borderRadius:6, color:'#fff', fontWeight:600, fontSize:13,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer' }}>
          {mutation.isPending ? 'Saving...' : 'Save Footer'}
        </button>
      </div>

      {saved && (
        <div style={{ marginBottom:16, padding:'10px 14px', background:'#052010', border:'1px solid #22C55E40',
          borderRadius:8, color:C.green, fontSize:13 }}>
          Footer saved successfully!
        </div>
      )}

      {/* Brand Section */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          Brand
        </h3>
        <div style={{ display:'grid', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em',
              display:'block', marginBottom:5 }}>Tagline</label>
            <input
              value={footer.tagline || ''}
              onChange={e => set('tagline', e.target.value)}
              placeholder="e.g. Proudly serving Melbourne since 2012"
              style={{ width:'100%', padding:'9px 11px', background:C.input, border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t0, fontSize:13, fontFamily:'inherit', outline:'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em',
              display:'block', marginBottom:5 }}>Copyright Text</label>
            <input
              value={footer.copyrightText || ''}
              onChange={e => set('copyrightText', e.target.value)}
              placeholder={`e.g. © ${new Date().getFullYear()} Restaurant Name. All rights reserved.`}
              style={{ width:'100%', padding:'9px 11px', background:C.input, border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t0, fontSize:13, fontFamily:'inherit', outline:'none' }}
            />
            <span style={{ fontSize:11, color:C.t3, marginTop:4, display:'block' }}>
              Leave blank to auto-generate from restaurant name
            </span>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          Social Links
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:5 }}>{label}</label>
              <input
                value={footer.socialLinks?.[key] || ''}
                onChange={e => setSocial(key, e.target.value)}
                placeholder={placeholder}
                style={{ width:'100%', padding:'9px 11px', background:C.input, border:`1px solid ${C.border}`,
                  borderRadius:7, color:C.t0, fontSize:13, fontFamily:'inherit', outline:'none' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preview Note */}
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:14 }}>
        <div style={{ fontSize:12, color:C.t2, lineHeight:1.6 }}>
          <strong style={{ color:C.t1 }}>Note:</strong> Footer content is also editable in Config → Footer section.
          Changes here will be reflected on the live site after the next deploy.
        </div>
      </div>
    </div>
  )
}