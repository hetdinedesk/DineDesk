import { Container } from './Components/Layout'
import { TopNav, SiteActionBar } from './Components/Navigation'
import GlobalHome from './pages/GlobalHome'
import SitesList from './pages/SitesList'
import SiteAdminApp from './SiteAdminApp'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from './stores/authStore'
import LoginPage     from './pages/LoginPage'
import ItemsSection  from './pages/ItemsSection'
import CmsSection    from './pages/CmsSection'
import ConfigSection from './pages/ConfigSection'
import DashboardSection from './pages/DashboardSection'
import { C } from './theme'

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
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isManager = user?.role === 'MANAGER'
  const canManageAll = isSuperAdmin || isManager
  const [buildMenu,    setBuildMenu]    = useState(false)
  const [deploying,    setDeploying]    = useState(false)
  const [deployStatus, setDeployStatus] = useState(null) // 'success'|'error'|null
  const [globalNav,  setGlobalNav]  = useState(() => {
    const user = useAuthStore.getState().user
    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const isManager = user?.role === 'MANAGER'
    return (isSuperAdmin || isManager) ? 'home' : 'sites'
  })
  const [activeSite, setActiveSite] = useState(null)
  const [siteNav,    setSiteNav]    = useState('dashboard')

  // ── Ref so event listener always sees latest activeSite ──
  const activeSiteRef = useRef(null)
  activeSiteRef.current = activeSite

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
        const token = localStorage.getItem('dd_token')
        const h = { Authorization: 'Bearer ' + token }

        Promise.all([
          fetch(`http://localhost:3001/api/clients/${site.id}`, { headers: h }).then(r => {
            if (r.status === 404) throw new Error('Client not found')
            return r.json()
          }),
          fetch(`http://localhost:3001/api/clients/${site.id}/config`, { headers: h }).then(r => r.json()),
        ]).then(([fresh, cfg]) => {
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
          if (err.message === 'Client not found') {
            sessionStorage.removeItem('dd_active_site')
            sessionStorage.removeItem('dd_site_nav')
            setActiveSite(null)
            setSiteNav('dashboard')
            return
          }
          setActiveSite({ ...site, indexing: site.indexing || 'blocked' })
          setSiteNav(savedNav || 'dashboard')
        })
      } catch {}
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
        `http://localhost:3001/api/clients/${client.id}/config`,
        { headers: { Authorization: 'Bearer ' + token } }
      ).then(r => r.json())
      const merged = {
        ...client,
        siteType: cfg?.settings?.siteType || 'restaurant',
        indexing: cfg?.settings?.indexing || 'blocked'
      }
      setActiveSite(merged)
      sessionStorage.setItem('dd_active_site', JSON.stringify(merged))
    } catch {
      setActiveSite({ ...client, indexing: 'blocked' })
      sessionStorage.setItem('dd_active_site', JSON.stringify({ ...client, indexing: 'blocked' }))
    }
  }

  const closeSite = () => {
    setActiveSite(null)
    setSiteNav('dashboard')
    sessionStorage.removeItem('dd_active_site')
    sessionStorage.removeItem('dd_site_nav')
    sessionStorage.removeItem('dd_cms_lnav')
    sessionStorage.removeItem('dd_cms_rnav')
    setGlobalNav(canManageAll ? 'home' : 'sites')
  }

  const globalNavItems = canManageAll
    ? [{ key:'home', label:'Home' }, { key:'sites', label:'Sites' }, ...(isSuperAdmin ? [{ key:'users', label:'Users' }] : [])]
    : [{ key:'sites', label:'My Sites' }]

  const getSiteNavItems = (site) => {
    const items = [
      { key: 'dashboard', label: 'Home' },
      { key: 'items', label: 'Items' },
      { key: 'cms', label: 'CMS' },
      { key: 'config', label: 'Config' },
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
        />
      )}

      <Container fill>
        <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column', width:'100%' }}>
          {!activeSite && canManageAll && globalNav === 'home' && (
            <GlobalHome onOpenSite={openSite} isSuperAdmin={isSuperAdmin} />
          )}
          {!activeSite && isSuperAdmin && globalNav === 'users' && (
            <div style={{ padding:40, color:C.t2 }}>Users management — coming soon.</div>
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
          {activeSite && siteNav === 'cms'    && <CmsSection    clientId={activeSite.id} />}
          {activeSite && siteNav === 'config' && <ConfigSection clientId={activeSite.id} />}
          {activeSite && siteNav === 'dashboard' && <DashboardSection clientId={activeSite.id} />}
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
