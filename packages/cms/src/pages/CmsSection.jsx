import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Menu, Home, Users, Tag, ShoppingCart, Layout, Image, PanelBottom, Building2, Megaphone, Store, CreditCard, Bell, Server } from 'lucide-react'
import SectionShell from '../Components/SectionShell'
import LocationsList from '../Components/LocationsList'
import NavbarSection from '../pages/NavbarSection'
import TeamSection from '../pages/TeamSection'
import HomepageBanners from './HomepageBanners'
import PromoTiles from './PromoTiles'
import WelcomeContent from './WelcomeContent'
import Specials from '../pages/Specials'
import OnlineOrderingSection from '../pages/OnlineOrderingSection'
import HomepageBuilder from './HomepageBuilder'
import { C } from '../theme'

const LEFT = [
  { key:'ordering', label:'Online Ordering', Icon: ShoppingCart },
  { key:'locations', label:'Locations', Icon: MapPin },
  { key:'homepage', label:'Homepage', Icon: Home },
  { key:'navigation', label:'Site Navigation', Icon: Menu },
  { key:'team', label:'Meet the Team', Icon: Users },
  { key:'specials', label:'Specials & Promos', Icon: Tag },
]

const RIGHT = {
  ordering: [
    { key:'ordering-config', label:'Order Settings', Icon: Store },
    { key:'payment-settings', label:'Payment', Icon: CreditCard },
    { key:'notifications', label:'Notifications', Icon: Bell },
    { key:'pos-integration', label:'POS Integration', Icon: Server },
  ],
  locations: [{ key:'locations', label:'Locations', Icon: MapPin }],
  homepage: [
    { key:'homepage-builder', label:'Page Builder', Icon: Layout },
    { key:'homepage-banners', label:'Banners', Icon: Image },
    { key:'promo-tiles', label:'Promo Tiles', Icon: Tag },
    { key:'content', label:'Welcome Section', Icon: Home },
  ],
  navigation: [
    { key:'header-sections', label:'Header', Icon: Layout },
    { key:'banners', label:'Page Banners', Icon: Image },
    { key:'footer-sections', label:'Footer', Icon: PanelBottom }
  ],
  team: [
    { key:'team-members', label:'Team Members', Icon: Users },
    { key:'departments', label:'Departments', Icon: Building2 }
  ],
  specials: [
    { key:'specials-list', label:'Specials', Icon: Megaphone },
    { key:'promo-tiles', label:'Promo Tiles', Icon: Tag },
  ],
}

export default function CmsSection({ clientId, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine user access level for CMS section
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isManager = user?.role === 'MANAGER'
  const hasFullCmsAccess = isSuperAdmin || isManager
  const rawCmsAccess = user?.clientAccess
  const cmsAccessMap = (rawCmsAccess && typeof rawCmsAccess === 'object' && !Array.isArray(rawCmsAccess)) ? rawCmsAccess : {}
  const cmsEntry = cmsAccessMap[clientId]
  const userCmsAccess = Array.isArray(cmsEntry) ? cmsEntry : (Array.isArray(cmsEntry?.tabs) ? cmsEntry.tabs : [])
  const hasCmsAccess = userCmsAccess.includes('cms')
  
  // Filter navigation based on access level
  const getFilteredLeftNav = () => {
    if (hasFullCmsAccess) {
      return LEFT // Full access for super admins and managers
    }
    
    if (hasCmsAccess) {
      // Limited access - only locations, specials, team, and online ordering
      return [
        { key:'ordering', label:'Online Ordering', Icon: ShoppingCart },
        { key:'locations', label:'Locations', Icon: MapPin },
        { key:'team', label:'Meet the Team', Icon: Users },
        { key:'specials', label:'Specials & Promos', Icon: Tag },
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
        ordering: [
          { key:'ordering-config', label:'Order Settings', Icon: Store },
          { key:'payment-settings', label:'Payment', Icon: CreditCard },
          { key:'notifications', label:'Notifications', Icon: Bell },
          { key:'pos-integration', label:'POS Integration', Icon: Server },
        ],
        locations: [{ key:'locations', label:'Locations', Icon: MapPin }],
        team: [
          { key:'team-members', label:'Team Members', Icon: Users },
          { key:'departments', label:'Departments', Icon: Building2 }
        ],
        specials: [
          { key:'specials-list', label:'Specials', Icon: Megaphone },
          { key:'promo-tiles', label:'Promo Tiles', Icon: Tag },
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
    // Version-keyed nav reset — bump NAV_VER to force fresh defaults after reorder
    const NAV_VER = 'v2'
    if (sessionStorage.getItem('dd_cms_nav_ver') !== NAV_VER) {
      sessionStorage.removeItem('dd_cms_lnav')
      sessionStorage.removeItem('dd_cms_rnav')
      sessionStorage.setItem('dd_cms_nav_ver', NAV_VER)
    }
    const storedLeft = sessionStorage.getItem('dd_cms_lnav')
    const storedRight = sessionStorage.getItem('dd_cms_rnav')
    const validLeft = storedLeft && LEFT.some(i => i.key === storedLeft) ? storedLeft : LEFT[0].key
    const defaultRight = RIGHT[validLeft]?.[0]?.key || validLeft
    const validRight = storedRight && RIGHT[validLeft]?.some(i => i.key === storedRight) ? storedRight : defaultRight
    return { left: validLeft, right: validRight }
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
      if(rnav==='homepage-builder') return <HomepageBuilder clientId={clientId} />
      if(rnav==='promo-tiles') return <PromoTiles clientId={clientId} />
      if(rnav==='homepage-banners') return <HomepageBanners clientId={clientId} />
      if(rnav==='content') return <WelcomeContent clientId={clientId} />
      return <div style={{color:C.t2,fontSize:14}}>Homepage section - Select a subsection from the sidebar.</div>
    }
    if(lnav==='specials') {
      if(rnav==='promo-tiles') return <PromoTiles clientId={clientId} />
      return <Specials clientId={clientId} />
    }
    if(lnav==='ordering') return <OnlineOrderingSection clientId={clientId} subsection={rnav} />
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
          <div style={{ fontSize:12, marginTop:8, color:C.t3 }}>
            Please contact your administrator for access to Locations, Specials, Team, or Online Ordering management.
          </div>
        </div>
      </div>
    )
  }

  return (
    <SectionShell
      railItems={FILTERED_LEFT}
      flyoutMap={FILTERED_RIGHT}
      activeRail={lnav}
      activeFlyout={rnav}
      onRailChange={handleLeft}
      onFlyoutChange={setRnav}
    >
      <div style={{ padding:'24px 32px' }}>{render()}</div>
    </SectionShell>
  )
}

import LocationForm from '../Components/LocationForm'

// Button styles
const btnBase = { padding:'6px 12px', border:'none', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'all 0.15s', display:'inline-flex', alignItems:'center', gap:6 }
const btnCyan = { ...btnBase, background:C.acc+'18', color:C.acc, border:`1px solid ${C.acc}35` }
const btnDanger = { ...btnBase, background:C.red+'14', color:C.red, border:`1px solid ${C.red}35` }
const btnGhost = { ...btnBase, background:'transparent', color:C.t2, border:`1px solid ${C.border}` }
