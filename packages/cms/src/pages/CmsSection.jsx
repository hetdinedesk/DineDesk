import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Menu, Home, Users, Tag, Settings, Layout, Image, PanelBottom, Megaphone, Wrench, Smartphone, Check, Star, Building2, ShoppingCart, CreditCard, Bell, Store, Server } from 'lucide-react'
import Table from '../Components/Table'
import NavbarSection from './NavbarSection'
import TeamSection from './TeamSection'
import HomepageBanners from './HomepageBanners'
import PromoTiles from './PromoTiles'
import WelcomeContent from './WelcomeContent'
import Specials from './Specials'
import OnlineOrderingSection from './OnlineOrderingSection'
import HomepageBuilder from './HomepageBuilder'
import { getLocations, updateLocation, deleteLocation } from '../api/locations'
import { C } from '../theme'

const LEFT = [
  { key:'locations', label:'Locations', Icon: MapPin },
  { key:'navigation', label:'Navigation', Icon: Menu },
  { key:'homepage', label:'Homepage', Icon: Home },
  { key:'team', label:'Meet the Team', Icon: Users },
  { key:'specials', label:'Specials', Icon: Tag },
  { key:'ordering', label:'Online Ordering', Icon: ShoppingCart },
  { key:'settings', label:'Settings', Icon: Settings },
]
const RIGHT = {
  locations: [{ key:'locations', label:'Locations', Icon: MapPin }],
  navigation: [
    { key:'header-sections', label:'Header Sections', Icon: Layout },
    { key:'banners', label:'Banners', Icon: Image },
    { key:'footer-sections', label:'Footer Sections', Icon: PanelBottom }
  ],
  team: [
    { key:'team-members', label:'Team Members', Icon: Users },
    { key:'departments', label:'Departments', Icon: Building2 }
  ],
  homepage: [
    { key:'homepage-builder', label:'Homepage Builder', Icon: Layout },
    { key:'promo-tiles', label:'Promo Tiles', Icon: Tag },
    { key:'homepage-banners', label:'Homepage Banners', Icon: Image },
    { key:'content', label:'Content', Icon: Layout }
  ],
  specials:  [{ key:'specials-list', label:'Specials', Icon: Megaphone }],
  ordering:  [
    { key:'ordering-config', label:'Ordering Config', Icon: Store },
    { key:'payment-settings', label:'Payment Settings', Icon: CreditCard },
    { key:'notifications', label:'Notifications', Icon: Bell },
    { key:'pos-integration', label:'POS Integration', Icon: Server }
  ],
  settings: [
    { key:'toolbox', label:'Toolbox (Coming Soon)', Icon: Wrench },
    { key:'mobile-ctas', label:'Mobile CTAs (Coming Soon)', Icon: Smartphone }
  ]
}

export default function CmsSection({ clientId }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get subsection from URL or sessionStorage
  const getSubsectionFromURL = () => {
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 4 && pathParts[0] === 'site' && pathParts[2] === 'cms') {
      const subsection = pathParts[3]
      // Map subsection to left/right navigation
      for (const leftKey of Object.keys(RIGHT)) {
        const rightItem = RIGHT[leftKey].find(item => item.key === subsection)
        if (rightItem) {
          return { left: leftKey, right: subsection }
        }
      }
      // If subsection matches a left key
      const leftItem = LEFT.find(item => item.key === subsection)
      if (leftItem) {
        const firstRight = RIGHT[leftItem.key]?.[0]?.key
        return { left: subsection, right: firstRight }
      }
    }
    return null
  }
  // Check for target section from cms-navigate event
  const getInitialNav = () => {
    const urlNav = getSubsectionFromURL()
    if (urlNav) {
      return urlNav
    }
    
    const targetSection = sessionStorage.getItem('dd_cms_target_section')
    if (targetSection) {
      // Clear the stored target section
      sessionStorage.removeItem('dd_cms_target_section')
      // Map section keys to navigation
      if (targetSection === 'contact-info') {
        return { left: 'locations', right: 'locations' }
      }
      // Add more mappings here as needed
    }
    // Default navigation
    return {
      left: sessionStorage.getItem('dd_cms_lnav') || 'locations',
      right: sessionStorage.getItem('dd_cms_rnav') || 'locations'
    }
  }
  
  const initialNav = getInitialNav()
  const [lnav, setLnav] = useState(initialNav.left)
  const [rnav, setRnav] = useState(initialNav.right)

  useEffect(() => {
    sessionStorage.setItem('dd_cms_lnav', lnav)
    sessionStorage.setItem('dd_cms_rnav', rnav)
    // Only update URL if we're not already on the correct URL
    const currentPath = window.location.pathname
    const pathParts = currentPath.split('/').filter(Boolean)
    if (pathParts.length >= 3 && pathParts[2] === 'cms') {
      const expectedUrl = `/site/${pathParts[1]}/cms/${rnav}`
      if (currentPath !== expectedUrl) {
        navigate(expectedUrl, { replace: true })
      }
    }
  }, [lnav, rnav, navigate])

  const handleLeft = key => {
    setLnav(key)
    const firstRight = RIGHT[key]?.[0]?.key || key
    setRnav(firstRight)
  }
  const render = () => {
    if(lnav==='locations') return <LocationsList clientId={clientId}/>
    if(lnav==='navigation') {
      return <NavbarSection clientId={clientId} subsection={rnav} />
    }
    if(lnav==='team') return <TeamSection clientId={clientId} subsection={rnav} />
    if(lnav==='homepage') {
      if(rnav==='homepage-builder') return <HomepageBuilder clientId={clientId} />
      if(rnav==='promo-tiles') return <PromoTiles clientId={clientId} />
      if(rnav==='homepage-banners') return <HomepageBanners clientId={clientId} />
      if(rnav==='content') return <WelcomeContent clientId={clientId} />
      return <div style={{color:C.t2,fontSize:14}}>Homepage section - Select a subsection from the sidebar.</div>
    }
    if(lnav==='specials') return <Specials clientId={clientId} />
    if(lnav==='ordering') return <OnlineOrderingSection clientId={clientId} subsection={rnav} />
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
        {LEFT.map(item => {
          const Icon = item.Icon
          return (
            <button key={item.key} onClick={()=>handleLeft(item.key)}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',border:'none',
                background:lnav===item.key?'#1F2D4A':'transparent',color:lnav===item.key?C.t0:C.t2,
                fontWeight:lnav===item.key?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'left',
                borderLeft:`2px solid ${lnav===item.key?C.acc:'transparent'}` }}>
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </div>
      {RIGHT[lnav]&&<div style={{ width:200,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column' }}>
        {RIGHT[lnav].map(item => {
          const Icon = item.Icon
          return (
            <button key={item.key} onClick={()=>setRnav(item.key)}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:'none',
                background:rnav===item.key?'#1F2D4A':'transparent',color:rnav===item.key?C.t0:C.t2,
                fontWeight:rnav===item.key?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'left',
                borderLeft:`2px solid ${rnav===item.key?C.cyan:'transparent'}` }}>
              <Icon size={14} />
              {item.label}
            </button>
          )
        })}
      </div>}
      <div style={{ flex:1,padding:'24px 32px',overflowY:'auto',background:C.page }}>{render()}</div>
    </div>
  )
}


import LocationForm from '../Components/LocationForm'

// Button styles matching NavbarSection
const btnBase = { padding:'6px 12px', border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'all 0.15s' }
const btnCyan = { ...btnBase, background:C.cyan+'20', color:C.cyan, border:`1px solid ${C.cyan}40` }
const btnDanger = { ...btnBase, background:C.red+'15', color:C.red, border:`1px solid ${C.red}40` }
const btnGhost = { ...btnBase, background:'transparent', color:C.t2, border:`1px solid ${C.border}` }

// Small toggle switch component
function SmallToggle({ checked, onChange }) {
  return (
    <div 
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? C.green : C.border,
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  )
}

function LocationsList({ clientId }) {
  const qc = useQueryClient()
  const { data: rawLocations = [] } = useQuery({ queryKey: ['locations', clientId], queryFn: () => getLocations(clientId), enabled: !!clientId })
  
  // Sort locations by name to maintain stable order
  const locations = useMemo(() => {
    return [...rawLocations].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [rawLocations])
  const [editModal, setEditModal] = useState(false)
  const [editLocation, setEditLocation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
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

  const handleDeleteClick = (loc) => {
    setDeleteConfirm(loc)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      del.mutate(deleteConfirm.id)
      setDeleteConfirm(null)
    }
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
      {/* Header - similar to Navigation section */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.t0 }}>Locations ({locations.length})</h2>
        <button onClick={handleAdd} style={{ ...btnCyan, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14 }}>+</span> Add Location
        </button>
      </div>

      {/* Location List - similar to Navigation headers list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {locations.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:C.t3, background:C.card, border:`1px dashed ${C.border}`, borderRadius:12 }}>
            No locations yet — click <strong style={{ color:C.acc }}>Add Location</strong> to get started.
          </div>
        ) : (
          locations.map(loc => (
            <div 
              key={loc.id}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'12px 14px', background:C.card,
                border:`1px solid ${C.border}`, borderRadius:10,
                transition:'all 0.15s'
              }}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:loc.isActive!==false ? C.t0 : C.t3, fontSize:14 }}>
                  {loc.name}
                  {loc.isPrimary && <Star size={14} style={{ color:C.acc, marginLeft:8, verticalAlign:'middle' }} />}
                </div>
                <div style={{ fontSize:12, color:C.t2, marginTop:4 }}>
                  {loc.address || 'No address'} · {loc.phone || 'No phone'}
                  {loc.showInFooter && <span style={{ color:C.green, marginLeft:8 }}>· Footer</span>}
                </div>
              </div>
              
              {/* Active Toggle */}
              <SmallToggle 
                checked={loc.isActive!==false} 
                onChange={() => !toggleActive.isPending && toggleActive.mutate({ id: loc.id, isActive: loc.isActive===false })}
              />
              
              {/* Edit Button */}
              <button onClick={() => handleEdit(loc)} style={btnCyan}>Edit</button>
              
              {/* Delete Button */}
              <button onClick={() => handleDeleteClick(loc)} style={btnDanger}>Delete</button>
            </div>
          ))
        )}
      </div>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, maxWidth:400, width:'100%', padding:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:C.t0 }}>Delete Location</h3>
            <p style={{ margin:'0 0 20px', fontSize:14, color:C.t2 }}>
              Permanently delete "{deleteConfirm.name}"? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...btnGhost, padding:'8px 16px' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ ...btnDanger, padding:'8px 16px' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}