import { Container } from './Components/Layout'
import { TopNav, SiteActionBar } from './Components/Navigation'
import GlobalHome from './pages/GlobalHome'
import SitesList from './pages/SitesList'
import SiteAdminApp from './SiteAdminApp'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from './stores/authStore'
import { LayoutDashboard, ClipboardList, Pencil, Settings2, Home, Building2, Users, Image, ShoppingCart } from 'lucide-react'
import LoginPage     from './pages/LoginPage'
import ItemsSection  from './pages/ItemsSection'
import CmsSection    from './pages/CmsSection'
import ConfigSection from './pages/ConfigSection'
import DashboardSection from './pages/DashboardSection'
import OperationsSection from './pages/OperationsSection'
import HomepageBanners from './pages/HomepageBanners'
import { C } from './theme'

const API_URL = import.meta.env.VITE_CMS_API_URL || import.meta.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" />
}

function MainApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isManager = user?.role === 'MANAGER'
  const canManageAll = isSuperAdmin || isManager
  const [buildMenu,    setBuildMenu]    = useState(false)
  const [deploying,    setDeploying]    = useState(false)
  const [deployStatus, setDeployStatus] = useState(null) // 'success'|'error'|null
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [globalNav,  setGlobalNav]  = useState(() => {
    const user = useAuthStore.getState().user
    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const isManager = user?.role === 'MANAGER'
    return (isSuperAdmin || isManager) ? 'home' : 'sites'
  })
  const [activeSite, setActiveSite] = useState(null)
  const [siteNav,    setSiteNav]    = useState('dashboard')
  const [dashboardSubsection, setDashboardSubsection] = useState('analytics')

  // ── Ref so event listener always sees latest activeSite ──
  const activeSiteRef = useRef(null)
  activeSiteRef.current = activeSite

  // ── Parse URL on mount and navigation changes ──
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean)

    if (pathParts.length >= 2 && pathParts[0] === 'site') {
      const siteId = pathParts[1]
      const section = pathParts[2] || 'dashboard'
      const subsection = pathParts[3] || 'analytics'

      // Update dashboard subsection state
      if (section === 'dashboard') {
        setDashboardSubsection(subsection)
      }

      // Store subsection in sessionStorage if present
      if (subsection) {
        sessionStorage.setItem(`dd_${section}_subsection`, subsection)
      }

      // Load site if not already loaded (use ref to avoid dependency loop)
      const current = activeSiteRef.current
      if (!current || current.id !== siteId) {
        const token = localStorage.getItem('dd_token')
        if (token) {
          fetch(`${API_URL}/clients/${siteId}`, { headers: { Authorization: 'Bearer ' + token } })
            .then(r => {
              if (!r.ok) throw new Error(r.status === 404 ? 'Client not found' : 'Failed to load client')
              return r.json()
            })
            .then(async (site) => {
              if (!site || !site.id) throw new Error('Invalid client data')
              const cfgRes = await fetch(`${API_URL}/clients/${siteId}/config`, { headers: { Authorization: 'Bearer ' + token } })
              const cfg = cfgRes.ok ? await cfgRes.json() : {}
              const merged = {
                ...site,
                siteType: cfg?.settings?.siteType || 'restaurant',
                indexing: cfg?.settings?.indexing || 'blocked'
              }
              setActiveSite(merged)
              setSiteNav(section)
              sessionStorage.setItem('dd_active_site', JSON.stringify(merged))
              sessionStorage.setItem('dd_site_nav', section)
              if (subsection) {
                sessionStorage.setItem(`dd_${section}_subsection`, subsection)
              }
            })
            .catch((err) => {
              console.error('Load site error:', err.message)
              if (err.message === 'Client not found') {
                navigate('/sites')
              }
            })
        }
      } else {
        setSiteNav(section)
        if (section === 'dashboard') {
          setDashboardSubsection(subsection)
        }
        if (subsection) {
          sessionStorage.setItem(`dd_${section}_subsection`, subsection)
        }
      }
    } else if (pathParts.length === 1) {
      const section = pathParts[0]
      if (['home', 'sites', 'users', 'operations'].includes(section)) {
        setGlobalNav(section)
        setActiveSite(null)
      }
    }
  }, [location.pathname, navigate])

  // ── Sync globalNav with user role when user loads ──
  useEffect(() => {
    if (user && !activeSite) {
      const isSuperAdmin = user?.role === 'SUPER_ADMIN'
      const isManager = user?.role === 'MANAGER'
      const canSeeHome = isSuperAdmin || isManager
      if (!canSeeHome && globalNav === 'home') {
        setGlobalNav('sites')
      }
    }
  }, [user])

  // ── Restore active site and navigation on page refresh ──
  useEffect(() => {
    const saved = sessionStorage.getItem('dd_active_site')
    const savedNav = sessionStorage.getItem('dd_site_nav')
    if (saved) {
      try {
        const site = JSON.parse(saved)
        if (!site || !site.id) throw new Error('Invalid saved site')
        const token = localStorage.getItem('dd_token')
        const h = { Authorization: 'Bearer ' + token }

        Promise.all([
          fetch(`${API_URL}/clients/${site.id}`, { headers: h }).then(r => {
            if (!r.ok) throw new Error(r.status === 404 ? 'Client not found' : 'Failed to load client')
            return r.json()
          }),
          fetch(`${API_URL}/clients/${site.id}/config`, { headers: h }).then(r => r.ok ? r.json() : {}),
        ]).then(([fresh, cfg]) => {
          if (!fresh || !fresh.id) throw new Error('Invalid client data')
          const merged = {
            ...site, ...fresh,
            siteType: cfg?.settings?.siteType || 'restaurant',
            indexing: cfg?.settings?.indexing || 'blocked'
          }
          setActiveSite(merged)
          setSiteNav(savedNav || 'dashboard')
          sessionStorage.setItem('dd_active_site', JSON.stringify(merged))
        }).catch((err) => {
          console.error('Restore site error:', err.message)
          if (err.message === 'Client not found' || err.message === 'Invalid client data') {
            sessionStorage.removeItem('dd_active_site')
            sessionStorage.removeItem('dd_site_nav')
            setActiveSite(null)
            setSiteNav('dashboard')
            return
          }
          // Fallback: use cached data from sessionStorage
          if (site.id) {
            setActiveSite({ ...site, indexing: site.indexing || 'blocked' })
            setSiteNav(savedNav || 'dashboard')
          }
        })
      } catch {
        sessionStorage.removeItem('dd_active_site')
        sessionStorage.removeItem('dd_site_nav')
      }
    }
  }, [])

  // ── Listen for name updates from ConfigSection ──
  useEffect(() => {
    const handler = (e) => {
      if (activeSiteRef.current && e.detail?.id === activeSiteRef.current.id) {
        setActiveSite(prev => ({
          ...prev,
          name: e.detail.name || prev.name,
          status: e.detail.status || prev.status,
          indexing: e.detail.indexing || prev.indexing,
        }))
        const updated = {
          ...activeSiteRef.current,
          name: e.detail.name || activeSiteRef.current.name,
          status: e.detail.status || activeSiteRef.current.status,
          indexing: e.detail.indexing || activeSiteRef.current.indexing,
        }
        activeSiteRef.current = updated
        sessionStorage.setItem('dd_active_site', JSON.stringify(updated))
      }
    }
    window.addEventListener('client-updated', handler)
    return () => window.removeEventListener('client-updated', handler)
  }, [])

  // ── Listen for CMS navigation from ConfigSection ──
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.section && activeSite) {
        // Navigate to CMS section and set the correct subsection
        setSiteNav('cms')
        // Store the target section in sessionStorage so CmsSection can pick it up
        sessionStorage.setItem('dd_cms_target_section', e.detail.section)
      }
    }
    window.addEventListener('cms-navigate', handler)
    return () => window.removeEventListener('cms-navigate', handler)
  }, [activeSite, setSiteNav])

  // ── Save navigation state when it changes ──
  useEffect(() => {
    if (activeSite && siteNav) {
      sessionStorage.setItem('dd_site_nav', siteNav)
    }
  }, [siteNav, activeSite])

  const openSite = async (client) => {
    setSiteNav('dashboard')
    try {
      const token = localStorage.getItem('dd_token')
      const cfg = await fetch(
        `${API_URL}/clients/${client.id}/config`,
        { headers: { Authorization: 'Bearer ' + token } }
      ).then(r => r.json())
      const merged = {
        ...client,
        siteType: cfg?.settings?.siteType || 'restaurant',
        indexing: cfg?.settings?.indexing || 'blocked'
      }
      setActiveSite(merged)
      sessionStorage.setItem('dd_active_site', JSON.stringify(merged))
      // Clear any existing subsection state
      sessionStorage.removeItem('dd_dashboard_subsection')
      sessionStorage.removeItem('dd_items_subsection')
      sessionStorage.removeItem('dd_cms_subsection')
      sessionStorage.removeItem('dd_config_subsection')
      // Navigate to site dashboard
      navigate(`/site/${client.id}/dashboard`)
    } catch {
      setActiveSite({ ...client, indexing: 'blocked' })
      sessionStorage.setItem('dd_active_site', JSON.stringify({ ...client, indexing: 'blocked' }))
      navigate(`/site/${client.id}/dashboard`)
    }
  }

  const closeSite = () => {
    setActiveSite(null)
    setSiteNav('dashboard')
    sessionStorage.removeItem('dd_active_site')
    sessionStorage.removeItem('dd_site_nav')
    sessionStorage.removeItem('dd_cms_lnav')
    sessionStorage.removeItem('dd_cms_rnav')
    // Clear all subsection states
    sessionStorage.removeItem('dd_dashboard_subsection')
    sessionStorage.removeItem('dd_items_subsection')
    sessionStorage.removeItem('dd_cms_subsection')
    sessionStorage.removeItem('dd_config_subsection')
    setGlobalNav(canManageAll ? 'home' : 'sites')
    // Navigate back to appropriate global section
    navigate(canManageAll ? '/home' : '/sites')
  }

  const deleteSite = async (clientId) => {
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete client')
      }
      closeSite()
    } catch (err) {
      alert(err.message)
    }
  }

  const globalNavItems = canManageAll
    ? [{ key:'home', label:'Home', Icon: Home }, { key:'sites', label:'Sites', Icon: Building2 }, { key:'operations', label:'Operations', Icon: ShoppingCart }, ...(isSuperAdmin ? [{ key:'users', label:'Users', Icon: Users }] : [])]
    : [{ key:'sites', label:'My Sites', Icon: Building2 }, { key:'operations', label:'Operations', Icon: ShoppingCart }]

  const getSiteNavItems = (site) => {
    const items = [
      { key: 'dashboard', label: 'Home', Icon: LayoutDashboard },
      { key: 'items', label: 'Items', Icon: ClipboardList },
      { key: 'operations', label: 'Operations', Icon: ShoppingCart },
      { key: 'cms', label: 'CMS', Icon: Pencil },
      { key: 'config', label: 'Config', Icon: Settings2 },
    ]

    if (canManageAll || !site) return items

    const allowed = user?.clientAccess?.[site.id] || []
    return items.filter(t => allowed.includes(t.key))
  }

  return (
    <div style={{ minHeight:'100vh', background:C.page,
      fontFamily:"'DM Sans',system-ui,sans-serif", color:C.t0,
      display:'flex', flexDirection:'column', width:'100%', overflow:'hidden' }}>

      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(-4px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

      <TopNav
        user={user}
        activeSite={activeSite}
        globalNav={globalNav}
        setGlobalNav={setGlobalNav}
        siteNav={siteNav}
        setSiteNav={setSiteNav}
        closeSite={closeSite}
        setActiveSite={setActiveSite}
        logout={logout}
        globalNavItems={globalNavItems}
        getSiteNavItems={getSiteNavItems}
        canManageAll={canManageAll}
        isSuperAdmin={isSuperAdmin}
        isManager={isManager}
        navigate={navigate}
      />

      {activeSite && (
        <SiteActionBar
          activeSite={activeSite}
          siteNav={siteNav}
          setSiteNav={setSiteNav}
          deployStatus={deployStatus}
          setBuildMenu={setBuildMenu}
          buildMenu={buildMenu}
          setDeploying={setDeploying}
          setDeployStatus={setDeployStatus}
          deploying={deploying}
          navigate={navigate}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
        />
      )}

      <Container fill>
        <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column', width:'100%' }}>
          {!activeSite && globalNav === 'home' && (
            <GlobalHome onOpenSite={openSite} isSuperAdmin={isSuperAdmin} />
          )}
          {!activeSite && isSuperAdmin && globalNav === 'users' && (
            <div style={{ padding:40, color:C.t2 }}>Users management — coming soon.</div>
          )}
          {!activeSite && globalNav === 'operations' && (
            <div style={{ padding:40, textAlign:'center', color:C.t2 }}>
              <div style={{ fontSize:18, fontWeight:'bold', marginBottom:16, color:C.t0 }}>Operations</div>
              <div style={{ maxWidth:400, margin:'0 auto', textAlign:'left' }}>
                <p style={{ marginBottom:12, color:C.t1 }}>Access your restaurant operations dashboard to manage orders, view analytics, and manage customer loyalty programs.</p>
                <div style={{ 
                  background:C.panel, 
                  border:`1px solid ${C.border}`, 
                  borderRadius:8, 
                  padding:16,
                  marginBottom:12 
                }}>
                  <h4 style={{ margin:'0 0 8px 0', fontSize:14, fontWeight:600, color:C.t0 }}>Quick Access</h4>
                  <ul style={{ margin:0, paddingLeft:16, color:C.t1 }}>
                    <li style={{ marginBottom:8 }}>• <strong>Order Management:</strong> Live orders, status tracking, and history</li>
                    <li style={{ marginBottom:8 }}>• <strong>Analytics:</strong> Daily revenue, top items, and performance metrics</li>
                    <li style={{ marginBottom:8 }}>• <strong>Customer Loyalty:</strong> Points tracking and order history</li>
                    <li style={{ marginBottom:8 }}>• <strong>Payment Tracking:</strong> Paid/unpaid order status</li>
                  </ul>
                </div>
                <p style={{ fontSize:12, color:C.t2 }}>Select a site from the <strong>Sites</strong> tab to access the Operations dashboard.</p>
              </div>
            </div>
          )}
          {!activeSite && (canManageAll ? globalNav === 'sites' : true) && (
            <SitesList
              onOpenSite={openSite}
              isSuperAdmin={canManageAll}
              clientAccess={user?.clientAccess || {}}
              show={canManageAll
                ? globalNav === 'sites'
                : globalNav === 'sites' || globalNav === 'home'}
            />
          )}

          {activeSite && siteNav === 'items' && (
            <ItemsSection
              clientId={activeSite.id}
              siteType={activeSite.siteConfig?.settings?.siteType || 'restaurant'}
            />
          )}
          {activeSite && siteNav === 'operations' && <OperationsSection clientId={activeSite.id} />}
          {activeSite && siteNav === 'cms'    && <CmsSection    clientId={activeSite.id} />}
          {activeSite && siteNav === 'config' && <ConfigSection clientId={activeSite.id} />}
          {activeSite && siteNav === 'dashboard' && <DashboardSection key={location.pathname} clientId={activeSite.id} onDeleteSite={deleteSite} subNav={dashboardSubsection} setSubNav={setDashboardSubsection} />}
        </div>
      </Container>
    </div>
  )
}

export default function App() {
  const token    = useAuthStore(s => s.token)
  const loadUser = useAuthStore(s => s.loadUser)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token) loadUser().finally(() => setReady(true))
    else setReady(true)
  }, [])

  if (!ready) return <div className="cms-app" style={{ padding:40, color:C.t2 }}>Loading...</div>

  return (
    <div className="cms-app" style={{ width:'100%', flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/site-admin/*" element={<SiteAdminApp />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  )
}
