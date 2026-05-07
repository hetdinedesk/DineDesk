import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Menu, Home, Users, Tag, ShoppingCart, Settings, Layout, Image, PanelBottom, Building2, Megaphone, Store, CreditCard, Bell, Server, Wrench, Smartphone } from 'lucide-react'
import LocationsList from '../Components/LocationsList'
import NavbarSection from '../Components/NavbarSection'
import TeamSection from '../Components/TeamSection'
import Specials from '../pages/Specials'
import OnlineOrderingSection from '../Components/OnlineOrderingSection'
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
  ordering: [
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

export default function CmsSection({ clientId, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine user access level for CMS section
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isManager = user?.role === 'MANAGER'
  const hasFullCmsAccess = isSuperAdmin || isManager
  const userCmsAccess = user?.clientAccess?.[clientId] || []
  const hasCmsAccess = userCmsAccess.includes('cms')
  
  // Filter navigation based on access level
  const getFilteredLeftNav = () => {
    if (hasFullCmsAccess) {
      return LEFT // Full access for super admins and managers
    }
    
    if (hasCmsAccess) {
      // Limited access - only locations, specials, team, and online ordering (first 3 parts)
      return [
        { key:'locations', label:'Locations', Icon: MapPin },
        { key:'team', label:'Meet the Team', Icon: Users },
        { key:'specials', label:'Specials', Icon: Tag },
        { key:'ordering', label:'Online Ordering', Icon: ShoppingCart },
      ]
    }
    
    return [] // No access
  }
  
  const getFilteredRightNav = () => {
    if (hasFullCmsAccess) {
      return RIGHT // Full access for super admins and managers
    }
    
    if (hasCmsAccess) {
      // Limited access - only specific sections
      return {
        locations: [{ key:'locations', label:'Locations', Icon: MapPin }],
        team: [
          { key:'team-members', label:'Team Members', Icon: Users },
          { key:'departments', label:'Departments', Icon: Building2 }
        ],
        specials:  [{ key:'specials-list', label:'Specials', Icon: Megaphone }],
        ordering: [
          { key:'ordering-config', label:'Ordering Config', Icon: Store },
          { key:'payment-settings', label:'Payment Settings', Icon: CreditCard },
          { key:'notifications', label:'Notifications', Icon: Bell },
          // POS Integration excluded for limited access
        ],
      }
    }
    
    return {} // No access
  }
  
  const FILTERED_LEFT = getFilteredLeftNav()
  const FILTERED_RIGHT = getFilteredRightNav()
  
  // Get subsection from URL or sessionStorage
  const getSubsectionFromURL = () => {
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 4 && pathParts[0] === 'site' && pathParts[2] === 'cms') {
      const subsection = pathParts[3]
      // Map subsection to left/right navigation using filtered navigation
      for (const leftKey of Object.keys(FILTERED_RIGHT)) {
        const rightItem = FILTERED_RIGHT[leftKey].find(item => item.key === subsection)
        if (rightItem) {
          return { left: leftKey, right: subsection }
        }
      }
      // If subsection matches a left key
      const leftItem = FILTERED_LEFT.find(item => item.key === subsection)
      if (leftItem) {
        const firstRight = FILTERED_RIGHT[leftItem.key]?.[0]?.key
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
      // Clear stored target section
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
    const firstRight = FILTERED_RIGHT[key]?.[0]?.key || key
    setRnav(firstRight)
  }
  const render = () => {
    if(lnav==='locations') return <LocationsList clientId={clientId}/>
    if(lnav==='navigation') {
      return <NavbarSection clientId={clientId} subsection={rnav} />
    }
    if(lnav==='team') return <TeamSection clientId={clientId} subsection={rnav} />
    if(lnav==='homepage') {
      if(rnav==='homepage-builder') return <div style={{color:C.t2,fontSize:14}}>Homepage Builder - Content coming soon.</div>
      if(rnav==='promo-tiles') return <div style={{color:C.t2,fontSize:14}}>Promo Tiles - Content coming soon.</div>
      if(rnav==='homepage-banners') return <div style={{color:C.t2,fontSize:14}}>Homepage Banners - Content coming soon.</div>
      if(rnav==='content') return <div style={{color:C.t2,fontSize:14}}>Content - Content coming soon.</div>
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

  // If user has no access to CMS section
  if (FILTERED_LEFT.length === 0) {
    return (
      <div style={{ 
        display:'flex', 
        alignItems:'center', 
        justifyContent:'center', 
        flex:1, 
        minHeight:0, 
        padding:40,
        textAlign:'center',
        color:C.t3,
        fontSize:14
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color:C.t2 }}>
            Access Restricted
          </div>
          <div>
            You don't have permission to access CMS section.
          </div>
          <div style={{ fontSize:12, marginTop:8, color:C.t4 }}>
            Please contact your administrator for access to Locations, Specials, Team, or Online Ordering management.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex',flex:1,minHeight:0,overflow:'hidden' }}>
      <div style={{ width:160,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column' }}>
        {FILTERED_LEFT.map(item => {
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
      {FILTERED_RIGHT[lnav]&&<div style={{ width:200,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column' }}>
        {FILTERED_RIGHT[lnav].map(item => {
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
