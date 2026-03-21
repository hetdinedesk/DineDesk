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

const queryClient = new QueryClient()
const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', accHov:'#E85A1A', accBg:'#2A1200',
  green:'#22C55E', amber:'#F59E0B', red:'#EF4444',
  cyan:'#00D4FF', input:'#111827',
}

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" />
}

function MainApp() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [buildMenu,    setBuildMenu]    = useState(false)
  const [deploying,    setDeploying]    = useState(false)
  const [deployStatus, setDeployStatus] = useState(null) // 'success'|'error'|null
  const [globalNav,  setGlobalNav]  = useState('home')
  const [activeSite, setActiveSite] = useState(null)
  const [siteNav,    setSiteNav]    = useState('config')

  // ── Ref so event listener always sees latest activeSite ──
  const activeSiteRef = useRef(null)
  activeSiteRef.current = activeSite

  // ── Restore active site on page refresh ──
  useEffect(() => {
  const saved = sessionStorage.getItem('dd_active_site')
  if (saved) {
    try {
      const site = JSON.parse(saved)
      // Always re-fetch fresh client data to get current status
      fetch(`http://localhost:3001/api/clients/${site.id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
      }).then(r => r.json()).then(fresh => {
        setActiveSite({ ...site, ...fresh })
        setSiteNav('config')
        sessionStorage.setItem('dd_active_site', JSON.stringify({ ...site, ...fresh }))
      }).catch(() => {
        setActiveSite(site)
        setSiteNav('config')
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
      name:   e.detail.name   || prev.name,
      status: e.detail.status || prev.status,
    }))
    const updated = {
  ...activeSiteRef.current,
  name:   e.detail.name   || activeSiteRef.current.name,
  status: e.detail.status || activeSiteRef.current.status,
}
activeSiteRef.current = updated
sessionStorage.setItem('dd_active_site', JSON.stringify(updated))
  }
}
    window.addEventListener('client-updated', handler)
    return () => window.removeEventListener('client-updated', handler)
  }, [])

  const openSite = (client) => {
    setActiveSite(client)
    setSiteNav('config')
    sessionStorage.setItem('dd_active_site', JSON.stringify(client))
  }

  const closeSite = () => {
    setActiveSite(null)
    setSiteNav('config')
    sessionStorage.removeItem('dd_active_site')
    setGlobalNav(isSuperAdmin ? 'home' : 'sites')
  }

  const globalNavItems = isSuperAdmin
    ? [{ key:'home', label:'Home' }, { key:'sites', label:'Sites' }, { key:'users', label:'Users' }]
    : [{ key:'sites', label:'My Sites' }]

  const getSiteNavItems = (site) => {
    if (isSuperAdmin || !site) {
      return [
        { key:'items',  label:'Items'  },
        { key:'cms',    label:'CMS'    },
        { key:'config', label:'Config' },
      ]
    }
    const allowed = user?.clientAccess?.[site.id] || []
    return [
      { key:'items',     label:'Items'     },
      { key:'cms',       label:'CMS'       },
      { key:'config',    label:'Config'    },
      { key:'dashboard', label:'Dashboard' },
    ].filter(t => allowed.includes(t.key))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080C14',
      fontFamily:"'DM Sans',system-ui,sans-serif", color:'#F1F5FF',
      display:'flex', flexDirection:'column' }}>

        <style>{`
      @keyframes fadeIn {
        from { opacity:0; transform:translateY(-4px) }
        to   { opacity:1; transform:translateY(0) }
      }
    `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

      {/* ── Top nav ── */}
      <div style={{ height:52, background:'#0E1420',
        borderBottom:'1px solid #1E2D4A', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', flexShrink:0 }}>

        <div style={{ display:'flex', alignItems:'center', gap:24 }}>

          {/* Logo — always goes home */}
          <div
            onClick={() => {
              setActiveSite(null)
              setGlobalNav('home')
              sessionStorage.removeItem('dd_active_site')
            }}
            style={{ display:'flex', alignItems:'center', gap:10,
              marginRight:8, cursor:'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA733"/>
                  <stop offset="100%" stopColor="#C0310A"/>
                </linearGradient>
              </defs>
              <path d="M8 15 L8 85 L32 85 Q60 85 60 50 Q60 15 32 15 Z M22 30 L30 30 Q44 30 44 50 Q44 70 30 70 L22 70 Z" fill="url(#navGrad)"/>
              <rect x="16" y="46" width="18" height="8" rx="4" fill="url(#navGrad)"/>
              <path d="M54 22 L54 78 L72 78 Q94 78 94 50 Q94 22 72 22 Z M66 35 L71 35 Q80 35 80 50 Q80 65 71 65 L66 65 Z" fill="url(#navGrad)"/>
            </svg>
            <span style={{ fontWeight:900, fontSize:15, letterSpacing:'-0.03em' }}>
              <span style={{ color:'#F1F5FF' }}>Dine</span>
              <span style={{ color:'#FF6B2B' }}>Desk</span>
            </span>
          </div>

          {/* Global nav */}
          {!activeSite && globalNavItems.map(({ key, label }) => (
            <button key={key} onClick={() => setGlobalNav(key)}
              style={{ background:'none', border:'none', cursor:'pointer',
                color: globalNav===key ? '#FF6B2B' : '#7A8BAD',
                fontWeight: globalNav===key ? 700 : 400,
                fontSize:13, fontFamily:'inherit',
                borderBottom: globalNav===key ? '2px solid #FF6B2B' : '2px solid transparent',
                padding:'14px 4px' }}>
              {label}
            </button>
          ))}

          {/* Site nav */}
          {activeSite && (
            <>
              <button onClick={closeSite}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'#7A8BAD', fontSize:13, fontFamily:'inherit' }}>
                ← {isSuperAdmin ? 'All Sites' : 'My Sites'}
              </button>
              <span style={{ color:'#FF6B2B', fontWeight:700, fontSize:14,
                maxWidth:200, overflow:'hidden', textOverflow:'ellipsis',
                whiteSpace:'nowrap' }}>
                {activeSite.name}
              </span>
              {getSiteNavItems(activeSite).map(({ key, label }) => (
                <button key={key} onClick={() => setSiteNav(key)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    color: siteNav===key ? '#FF6B2B' : '#7A8BAD',
                    fontWeight: siteNav===key ? 700 : 400,
                    fontSize:13, fontFamily:'inherit',
                    borderBottom: siteNav===key ? '2px solid #FF6B2B' : '2px solid transparent',
                    padding:'14px 4px' }}>
                  {label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, color:'#F1F5FF', fontWeight:600 }}>
              {user?.name}
            </div>
            <div style={{ fontSize:11, color:'#445572' }}>
              {isSuperAdmin ? 'Staff' : 'Client'}
            </div>
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%',
            background:'linear-gradient(135deg, #FF6B2B, #E85A1A)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:800, color:'#fff' }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <button onClick={logout}
            style={{ padding:'6px 14px', background:'transparent',
              border:'1px solid #1E2D4A', borderRadius:6,
              color:'#7A8BAD', fontSize:12, cursor:'pointer',
              fontFamily:'inherit' }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Site action bar — shown when a site is open ── */}
{activeSite && (
  <div style={{ height:44, background:'#0A0F1A',
    borderBottom:`1px solid ${C.border}`,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 24px', flexShrink:0, position:'relative', zIndex:100 }}>

    {/* Left — site name + status */}
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:13, fontWeight:700, color:'#F1F5FF' }}>
        {activeSite.name}
      </span>
      <span style={{ fontSize:11, fontWeight:700,
        color: activeSite.status === 'live' ? '#22C55E' : '#F59E0B',
        background: activeSite.status === 'live' ? '#05201080' : '#1A100080',
        border: `1px solid ${activeSite.status === 'live' ? '#22C55E40' : '#F59E0B40'}`,
        padding:'2px 8px', borderRadius:4 }}>
        {activeSite.status === 'live' ? 'Live' : 'Draft'}
      </span>
      {deployStatus === 'success' && (
        <span style={{ fontSize:11, color:'#22C55E' }}>
          Build triggered successfully
        </span>
      )}
      {deployStatus === 'error' && (
        <span style={{ fontSize:11, color:'#EF4444' }}>
          Build failed — check Netlify settings
        </span>
      )}
    </div>

    {/* Right — action buttons */}
    <div style={{ display:'flex', alignItems:'center', gap:8, position:'relative' }}>

      {/* Preview Site button */}
      <button
        onClick={() => {
          const previewUrl = `http://localhost:3000?site=${activeSite.id}`
          window.open(previewUrl, '_blank')
        }}
        style={{ padding:'6px 14px', background:'transparent',
          border:`1px solid #2A3F63`, borderRadius:6,
          color:'#7A8BAD', fontSize:12, cursor:'pointer',
          fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
        Preview
        <span style={{ fontSize:10 }}>↗</span>
      </button>

      {/* Start Build hover dropdown */}
<div
  style={{ position:'relative' }}
  onMouseEnter={() => setBuildMenu(true)}
  onMouseLeave={() => setBuildMenu(false)}>

  {/* Main button — Deploy Live */}
  <button
    onClick={async () => {
      setDeploying(true)
      setDeployStatus(null)
      try {
        const res = await fetch(
          `http://localhost:3001/api/clients/${activeSite.id}/deploy`,
          { method:'POST',
            headers:{ Authorization:'Bearer '+localStorage.getItem('dd_token') } }
        )
        const data = await res.json()
        setDeployStatus(data.success ? 'success' : 'error')
      } catch { setDeployStatus('error') }
      finally {
        setDeploying(false)
        setTimeout(() => setDeployStatus(null), 5000)
      }
    }}
    disabled={deploying}
    style={{ padding:'6px 18px', background: deploying ? '#1F2D4A' : '#FF6B2B',
      border:`1px solid ${deploying ? '#2A3F63' : '#FF6B2B'}`,
      borderRadius:7, color:'#fff', fontWeight:700, fontSize:12,
      cursor: deploying ? 'not-allowed' : 'pointer',
      fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
      transition:'all 0.15s' }}>
    {deploying ? 'Building…' : 'Deploy Live'}
    <span style={{ fontSize:10, opacity:0.7 }}>▾</span>
  </button>

  {/* Hover dropdown */}
  {buildMenu && (
    <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)',
      zIndex:99, background:'#0E1420',
      border:`1px solid #1E2D4A`, borderRadius:10,
      boxShadow:'0 16px 48px rgba(0,0,0,0.6)',
      minWidth:210, overflow:'hidden',
      animation:'fadeIn 0.1s ease' }}>

      <div style={{ padding:'8px 14px', fontSize:10, fontWeight:700,
        color:'#445572', textTransform:'uppercase',
        letterSpacing:'0.08em', borderBottom:'1px solid #1E2D4A' }}>
        Publish
      </div>

      {[
        { label:'Deploy Live',        hint:'Trigger a Netlify build',
          onClick: async () => {
            setBuildMenu(false); setDeploying(true); setDeployStatus(null)
            try {
              const res = await fetch(
                `http://localhost:3001/api/clients/${activeSite.id}/deploy`,
                { method:'POST',
                  headers:{ Authorization:'Bearer '+localStorage.getItem('dd_token') } }
              )
              const data = await res.json()
              setDeployStatus(data.success ? 'success' : 'error')
            } catch { setDeployStatus('error') }
            finally {
              setDeploying(false)
              setTimeout(() => setDeployStatus(null), 5000)
            }
          }
        },
        { label:'Preview Site',       hint:'Open local preview in new tab',
          onClick: () => {
            window.open(`http://localhost:3000?site=${activeSite.id}`, '_blank')
          }
        },
        { label:'View Live Site',     hint:'Open published Netlify site',
          onClick: async () => {
            const res = await fetch(
              `http://localhost:3001/api/clients/${activeSite.id}/config`,
              { headers:{ Authorization:'Bearer '+localStorage.getItem('dd_token') } }
            )
            const cfg = await res.json()
            const url = cfg.netlify?.siteUrl
            if (url) window.open(url, '_blank')
            else alert('No live site URL — add it in Config → Netlify Setup')
          }
        },
      ].map(({ label, hint, onClick }) => (
        <div key={label} onClick={onClick}
          style={{ padding:'10px 14px', cursor:'pointer',
            borderBottom:'1px solid #1E2D4A15',
            transition:'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background='#1A2540'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div style={{ fontSize:13, fontWeight:600, color:'#F1F5FF' }}>{label}</div>
          <div style={{ fontSize:11, color:'#445572', marginTop:2 }}>{hint}</div>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  </div>
)}

      {/* ── Page content ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

        {!activeSite && isSuperAdmin && globalNav === 'home' && (
          <GlobalHome onOpenSite={openSite} isSuperAdmin={isSuperAdmin} />
        )}
        {!activeSite && isSuperAdmin && globalNav === 'users' && (
          <div style={{ padding:40, color:'#7A8BAD' }}>Users management — coming soon.</div>
        )}
        {!activeSite && (isSuperAdmin ? globalNav === 'sites' : true) && (
          <SitesList
            onOpenSite={openSite}
            isSuperAdmin={isSuperAdmin}
            clientAccess={user?.clientAccess || {}}
            show={isSuperAdmin
              ? globalNav === 'sites'
              : globalNav === 'sites' || globalNav === 'home'}
          />
        )}

        {activeSite && siteNav === 'items'  && <ItemsSection  clientId={activeSite.id} />}
        {activeSite && siteNav === 'cms'    && <CmsSection    clientId={activeSite.id} />}
        {activeSite && siteNav === 'config' && <ConfigSection clientId={activeSite.id} />}
      </div>
    </div>
  )
}

const C_GLOBAL = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', accHov:'#E85A1A', accBg:'#2A1200',
  green:'#22C55E', amber:'#F59E0B', input:'#111827',
}

function HomeInp({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div style={{ flex:1 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:C_GLOBAL.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'9px 11px', background:C_GLOBAL.input,
          border:`1px solid ${C_GLOBAL.border}`, borderRadius:7, color:C_GLOBAL.t0,
          fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = C_GLOBAL.acc}
        onBlur={e => e.target.style.borderColor = C_GLOBAL.border}
      />
    </div>
  )
}

function GlobalHome({ onOpenSite, isSuperAdmin }) {
  const [clients, setClients] = useState([])
  const [groups,  setGroups]  = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingGroups,  setLoadingGroups]  = useState(true)
  const [addingClient, setAddingClient] = useState(false)
  const [addingGroup,  setAddingGroup]  = useState(false)
  const [clientName,   setClientName]   = useState('')
  const [clientDomain, setClientDomain] = useState('')
  const [clientDomainError, setClientDomainError] = useState('')
  const [groupName,    setGroupName]    = useState('')
  const [groupColor,   setGroupColor]   = useState('#FF6B2B')
  const [search,       setSearch]       = useState('')
  const [openGroup,    setOpenGroup]    = useState(null)   // group detail modal
  const [editingGroup, setEditingGroup] = useState(null)   // group being edited

  const C = C_GLOBAL
  const token = () => localStorage.getItem('dd_token')

  const loadClients = () => {
    setLoadingClients(true)
    fetch('http://localhost:3001/api/clients', {
      headers: { Authorization: 'Bearer ' + token() }
    }).then(r => r.json())
      .then(d => { setClients(Array.isArray(d) ? d : []); setLoadingClients(false) })
      .catch(() => setLoadingClients(false))
  }

  const loadGroups = () => {
    setLoadingGroups(true)
    fetch('http://localhost:3001/api/groups', {
      headers: { Authorization: 'Bearer ' + token() }
    }).then(r => r.json())
      .then(d => { setGroups(Array.isArray(d) ? d : []); setLoadingGroups(false) })
      .catch(() => setLoadingGroups(false))
  }

  useEffect(() => { loadClients(); loadGroups() }, [])

  const addClient = async () => {
  if (!clientName || !clientDomain) return

  // Validate domain — strip http/https if pasted, then check format
  const rawDomain = clientDomain.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()

  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/
  if (!domainRegex.test(rawDomain)) {
    setClientDomainError('Please enter a valid domain e.g. urbaneatsmcl.com.au')
    return
  }

  setClientDomainError('')
  await fetch('http://localhost:3001/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    body: JSON.stringify({ name: clientName, domain: rawDomain, status: 'draft' })
  })
  setClientName(''); setClientDomain(''); setAddingClient(false); loadClients()
}

const addGroup = async () => {
  if (!groupName) return
  await fetch('http://localhost:3001/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    body: JSON.stringify({ name: groupName, color: groupColor })
  })
  setGroupName(''); setGroupColor('#FF6B2B'); setAddingGroup(false); loadGroups()
}

  const saveGroupEdit = async () => {
    if (!editingGroup) return
    await fetch(`http://localhost:3001/api/groups/${editingGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ name: editingGroup.name, color: editingGroup.color })
    })
    setEditingGroup(null)
    loadGroups()
    // refresh openGroup with updated data
    setOpenGroup(g => g ? { ...g, name: editingGroup.name, color: editingGroup.color } : null)
  }

  const assignSiteToGroup = async (clientId, groupId) => {
    await fetch(`http://localhost:3001/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ groupId: groupId || null })
    })
    loadClients()
  }

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group? Sites will be unassigned.')) return
    await fetch(`http://localhost:3001/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token() }
    })
    setOpenGroup(null)
    loadGroups(); loadClients()
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  )

  const metrics = [
    { label:'Total Sites',  value: clients.length,                              icon:'🌐', color: C.acc    },
    { label:'Live',         value: clients.filter(c=>c.status==='live').length, icon:'✅', color: C.green  },
    { label:'Draft',        value: clients.filter(c=>c.status==='draft').length,icon:'📝', color: C.amber  },
    { label:'Total Groups', value: groups.length,                               icon:'📁', color: '#A78BFA'},
  ]

  return (
    <div style={{ flex:1, overflowY:'auto', background:C.page,
      fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── Group detail modal ── */}
      {openGroup && (
        <div style={{ position:'fixed', inset:0, zIndex:400,
          background:'rgba(0,0,0,0.7)', display:'flex',
          alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ width:'100%', maxWidth:560, background:C.panel,
            border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden',
            boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>

            {/* Modal header */}
            <div style={{ height:4, background: openGroup.color }}/>
            <div style={{ padding:'20px 24px 0', display:'flex',
              alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:14, height:14, borderRadius:'50%',
                  background:openGroup.color,
                  boxShadow:`0 0 10px ${openGroup.color}90` }}/>
                {editingGroup ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input value={editingGroup.name}
                      onChange={e => setEditingGroup(p => ({...p, name: e.target.value}))}
                      style={{ padding:'6px 10px', fontSize:16, fontWeight:700,
                        background:C.card, border:`1px solid ${C.border}`,
                        borderRadius:7, color:C.t0, fontFamily:'inherit', outline:'none' }}/>
                    <input type="color" value={editingGroup.color}
                      onChange={e => setEditingGroup(p => ({...p, color: e.target.value}))}
                      style={{ width:36, height:34, border:'none',
                        borderRadius:6, cursor:'pointer' }}/>
                    <button onClick={saveGroupEdit}
                      style={{ padding:'6px 14px', background:C.acc, border:'none',
                        borderRadius:6, color:'#fff', fontWeight:700, fontSize:12,
                        cursor:'pointer', fontFamily:'inherit' }}>Save</button>
                    <button onClick={() => setEditingGroup(null)}
                      style={{ padding:'6px 10px', background:'transparent',
                        border:`1px solid ${C.border}`, borderRadius:6,
                        color:C.t2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.t0 }}>
                      {openGroup.name}
                    </div>
                    <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>
                      {clients.filter(c => c.groupId === openGroup.id).length} sites in this group
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {!editingGroup && (
                  <>
                    <button onClick={() => setEditingGroup({ ...openGroup })}
                      style={{ padding:'6px 14px', background:'transparent',
                        border:`1px solid ${C.border2}`, borderRadius:6,
                        color:C.t2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => deleteGroup(openGroup.id)}
                      style={{ padding:'6px 14px', background:'transparent',
                        border:'1px solid #EF444440', borderRadius:6,
                        color:'#EF4444', fontSize:12, cursor:'pointer',
                        fontFamily:'inherit' }}>
                      🗑️ Delete
                    </button>
                  </>
                )}
                <button onClick={() => { setOpenGroup(null); setEditingGroup(null) }}
                  style={{ padding:'6px 12px', background:'transparent',
                    border:`1px solid ${C.border}`, borderRadius:6,
                    color:C.t2, fontSize:16, cursor:'pointer', lineHeight:1 }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Sites in this group */}
            <div style={{ padding:'16px 24px 8px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                Sites in this group
              </div>
              <div style={{ maxHeight:180, overflowY:'auto',
                display:'flex', flexDirection:'column', gap:6 }}>
                {clients.filter(c => c.groupId === openGroup.id).length === 0 ? (
                  <div style={{ fontSize:13, color:C.t3, padding:'8px 0' }}>
                    No sites assigned yet.
                  </div>
                ) : clients.filter(c => c.groupId === openGroup.id).map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center',
                    justifyContent:'space-between', padding:'8px 12px',
                    background:C.card, borderRadius:8,
                    border:`1px solid ${C.border}` }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:600,
                        color:openGroup.color }}>{c.name}</span>
                      <span style={{ fontSize:11, color:C.t3,
                        marginLeft:8, fontFamily:'monospace' }}>{c.domain}</span>
                    </div>
                    <button onClick={() => assignSiteToGroup(c.id, null)}
                      style={{ fontSize:11, color:'#EF4444', background:'transparent',
                        border:'1px solid #EF444430', borderRadius:5,
                        padding:'3px 8px', cursor:'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign sites to group */}
            <div style={{ padding:'8px 24px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                Assign sites to this group
              </div>
              <div style={{ maxHeight:160, overflowY:'auto',
                display:'flex', flexDirection:'column', gap:6 }}>
                {clients.filter(c => c.groupId !== openGroup.id).length === 0 ? (
                  <div style={{ fontSize:13, color:C.t3 }}>All sites are already in this group.</div>
                ) : clients.filter(c => c.groupId !== openGroup.id).map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center',
                    justifyContent:'space-between', padding:'8px 12px',
                    background:C.card, borderRadius:8,
                    border:`1px solid ${C.border}` }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.t1 }}>
                        {c.name}
                      </span>
                      {c.groupId && (
                        <span style={{ fontSize:11, color:C.t3, marginLeft:8 }}>
                          (in {groups.find(g => g.id === c.groupId)?.name || 'another group'})
                        </span>
                      )}
                    </div>
                    <button onClick={() => assignSiteToGroup(c.id, openGroup.id)}
                      style={{ fontSize:11, color:C.acc, background:C.accBg,
                        border:`1px solid ${C.acc}40`, borderRadius:5,
                        padding:'3px 8px', cursor:'pointer', fontWeight:600 }}>
                      + Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search strip ── */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`,
        padding:'12px 28px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexShrink:0 }}>
        <h1 style={{ margin:0, fontSize:15, fontWeight:800, color:C.t0 }}>Home</h1>
        <div style={{ position:'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sites..."
            style={{ padding:'7px 36px 7px 12px', fontSize:13, background:C.card,
              border:`1px solid ${C.border2}`, borderRadius:7, color:C.t0,
              fontFamily:'inherit', outline:'none', width:240 }}
            onFocus={e => e.target.style.borderColor = C.acc}
            onBlur={e => e.target.style.borderColor = C.border2}
          />
          <span style={{ position:'absolute', right:11, top:'50%',
            transform:'translateY(-50%)', color:C.t3, fontSize:14,
            pointerEvents:'none' }}>🔍</span>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div style={{ padding:'20px 28px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          gap:12, marginBottom:24 }}>
          {metrics.map(({ label, value, icon, color }) => (
            <div key={label} style={{ background:C.panel, border:`1px solid ${C.border}`,
              borderRadius:12, padding:'18px 20px', borderTop:`3px solid ${color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                {label}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <span style={{ fontSize:30, fontWeight:900, color:C.t0,
                  letterSpacing:'-0.03em' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ padding:'0 28px 40px',
        display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

        {/* ═══ LEFT — Sites list ═══ */}
        <div>
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <span style={{ fontSize:20, fontWeight:800, color:C.t0 }}>
                {filteredClients.length}
              </span>
              <span style={{ fontSize:14, color:C.t2, marginLeft:6 }}>
                of {clients.length} Sites
              </span>
            </div>
            <button onClick={() => { setAddingClient(!addingClient); setAddingGroup(false) }}
              style={{ padding:'7px 16px', background:C.acc, border:'none',
                borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              + Add Client
            </button>
          </div>

          {addingClient && (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`,
    borderRadius:10, padding:16, marginBottom:16,
    display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
    <HomeInp label="Restaurant Name" value={clientName}
      onChange={setClientName} placeholder="e.g. Urban Eats Melbourne"/>
    <div style={{ flex:1 }}>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>Domain</label>
      <input value={clientDomain}
        onChange={e => { setClientDomain(e.target.value); setClientDomainError('') }}
        placeholder="e.g. urbaneatsmcl.com.au"
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${clientDomainError ? '#EF4444' : C.border}`,
          borderRadius:7, color:C.t0, fontSize:13, fontFamily:'inherit',
          outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = clientDomainError ? '#EF4444' : C.acc}
        onBlur={e => e.target.style.borderColor = clientDomainError ? '#EF4444' : C.border}
      />
      {clientDomainError && (
        <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>
          ⚠️ {clientDomainError}
        </div>
      )}
    </div>
    <div style={{ display:'flex', gap:8, alignSelf: clientDomainError ? 'center' : 'flex-end' }}>
      <button onClick={addClient}
        style={{ padding:'9px 18px', background:C.acc, border:'none',
          borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
          cursor:'pointer', fontFamily:'inherit' }}>Save</button>
      <button onClick={() => { setAddingClient(false); setClientDomainError('') }}
        style={{ padding:'9px 14px', background:'transparent',
          border:`1px solid ${C.border}`, borderRadius:7,
          color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
        Cancel
      </button>
    </div>
  </div>
)}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 80px 100px',
            padding:'7px 14px', borderBottom:`1px solid ${C.border}`,
            fontSize:11, fontWeight:700, color:C.t3,
            textTransform:'uppercase', letterSpacing:'0.05em' }}>
            <span>Client Name</span>
            <span>Group</span>
            <span>Status</span>
            <span>Updated</span>
          </div>

          <div style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'hidden' }}>
            {loadingClients ? (
              <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                Loading...
              </div>
            ) : filteredClients.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                {search ? `No sites matching "${search}"` : 'No clients yet. Click + Add Client.'}
              </div>
            ) : filteredClients.map((cl, i) => {
              const group = groups.find(g => g.id === cl.groupId)
              return (
                <div key={cl.id}
                  style={{ display:'grid', gridTemplateColumns:'1fr 130px 80px 100px',
                    padding:'11px 14px', cursor:'pointer', alignItems:'center',
                    borderBottom: i < filteredClients.length-1
                      ? `1px solid ${C.border}20` : 'none' }}
                  onClick={() => onOpenSite(cl)}
                  onMouseEnter={e => e.currentTarget.style.background = C.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight:600, color:C.acc, fontSize:14 }}>
                    {cl.name}
                  </span>
                  <span onClick={e => { e.stopPropagation(); if (group) setOpenGroup(group) }}>
                    {group ? (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                        fontSize:11, fontWeight:700,
                        background: group.color + '20', color: group.color,
                        padding:'2px 8px', borderRadius:4,
                        border:`1px solid ${group.color}40`,
                        cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
                        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                        <span style={{ width:6, height:6, borderRadius:'50%',
                          background:group.color, flexShrink:0 }}/>
                        {group.name}
                      </span>
                    ) : (
                      <span style={{ fontSize:11, color:C.t3 }}>—</span>
                    )}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700,
                    color: cl.status==='live' ? C.green : C.amber }}>
                    {cl.status}
                  </span>
                  <span style={{ fontSize:11, color:C.t3 }}>
                    {new Date(cl.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ RIGHT — Groups list ═══ */}
        <div>
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <span style={{ fontSize:20, fontWeight:800, color:C.t0 }}>
                {groups.length}
              </span>
              <span style={{ fontSize:14, color:C.t2, marginLeft:6 }}>Groups</span>
            </div>
            <button onClick={() => { setAddingGroup(!addingGroup); setAddingClient(false) }}
              style={{ padding:'7px 16px', background:'transparent',
                border:`1px solid ${C.border2}`, borderRadius:7,
                color:C.t2, fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              + Add Group
            </button>
          </div>

          {addingGroup && (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`,
    borderRadius:10, padding:16, marginBottom:16 }}>
    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
      <HomeInp label="Group Name" value={groupName}
        onChange={setGroupName} placeholder="e.g. Urban Eats Group"/>
      <div style={{ flexShrink:0 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.06em',
          display:'block', marginBottom:5 }}>Colour</label>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="color" value={groupColor}
            onChange={e => setGroupColor(e.target.value)}
            style={{ width:36, height:36, border:'none',
              borderRadius:6, cursor:'pointer', background:'none', flexShrink:0 }}/>
          <input value={groupColor}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setGroupColor(v)
            }}
            maxLength={7}
            placeholder="#FF6B2B"
            style={{ width:90, padding:'7px 9px', background:C.input,
              border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
              fontSize:12, fontFamily:'monospace', outline:'none',
              boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor = C.acc}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
      </div>
    </div>
    <div style={{ display:'flex', gap:8 }}>
      <button onClick={addGroup}
        style={{ padding:'8px 18px', background:C.acc, border:'none',
          borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
          cursor:'pointer', fontFamily:'inherit' }}>Save</button>
      <button onClick={() => setAddingGroup(false)}
        style={{ padding:'8px 14px', background:'transparent',
          border:`1px solid ${C.border}`, borderRadius:7,
          color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
        Cancel
      </button>
    </div>
  </div>
)}

          <div style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:10, overflow:'hidden' }}>
            {loadingGroups ? (
              <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                Loading...
              </div>
            ) : groups.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                No groups yet. Click + Add Group.
              </div>
            ) : groups.map((g, i) => {
              const siteCount = clients.filter(c => c.groupId === g.id).length
              return (
                <div key={g.id}
                  onClick={() => setOpenGroup(g)}
                  style={{ padding:'13px 16px', display:'flex',
                    alignItems:'center', justifyContent:'space-between',
                    borderBottom: i < groups.length-1
                      ? `1px solid ${C.border}20` : 'none',
                    cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%',
                      background:g.color, flexShrink:0,
                      boxShadow:`0 0 8px ${g.color}80` }}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.t0 }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize:11, color:C.t3, marginTop:1 }}>
                        {siteCount} site{siteCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column',
                    gap:3, alignItems:'flex-end', maxWidth:160 }}>
                    {clients.filter(c => c.groupId === g.id).slice(0,3).map(c => (
                      <span key={c.id}
                        onClick={e => { e.stopPropagation(); onOpenSite(c) }}
                        style={{ fontSize:11, color:g.color, cursor:'pointer',
                          background: g.color + '15',
                          padding:'1px 7px', borderRadius:4, fontWeight:600,
                          maxWidth:150, overflow:'hidden',
                          textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        onMouseEnter={e => e.target.style.textDecoration='underline'}
                        onMouseLeave={e => e.target.style.textDecoration='none'}>
                        {c.name}
                      </span>
                    ))}
                    {clients.filter(c => c.groupId === g.id).length > 3 && (
                      <span style={{ fontSize:10, color:C.t3 }}>
                        +{clients.filter(c => c.groupId === g.id).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SitesList({ onOpenSite, isSuperAdmin, clientAccess = {}, show = true }) {
  const [clients, setClients] = useState([])
  const [name,    setName]    = useState('')
  const [domain,  setDomain]  = useState('')
  const [adding,  setAdding]  = useState(false)

  if (!show) return null

  const reload = () => fetch('http://localhost:3001/api/clients', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
  }).then(r => r.json()).then(data => {
    if (!Array.isArray(data)) { setClients([]); return }
    if (isSuperAdmin) {
      setClients(data)
    } else {
      // Editor — only show sites where they have at least 1 tab granted
      setClients(data.filter(c => {
        const tabs = clientAccess[c.id] || []
        return tabs.length > 0
      }))
    }
  }).catch(() => {})

  useEffect(() => { reload() }, [])

  const add = async () => {
    if (!name || !domain) return
    await fetch('http://localhost:3001/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('dd_token') },
      body: JSON.stringify({ name, domain, status: 'draft' })
    })
    setName(''); setDomain(''); setAdding(false); reload()
  }

  const C2 = {
    panel:'#0E1420', border:'#1E2D4A', card:'#141C2E', hover:'#1A2540',
    t0:'#F1F5FF', t2:'#7A8BAD', t3:'#445572', acc:'#FF6B2B',
    green:'#22C55E', amber:'#F59E0B', input:'#111827', border2:'#2A3F63'
  }

  return (
    <div style={{ padding:'32px 40px', overflowY:'auto', flex:1 }}>

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:'0 0 2px', fontSize:22, fontWeight:800, color:C2.t0 }}>
            {isSuperAdmin ? 'All Sites' : 'My Sites'}
          </h1>
          <div style={{ fontSize:13, color:C2.t3 }}>
            {clients.length} site{clients.length !== 1 ? 's' : ''}
          </div>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setAdding(!adding)}
            style={{ padding:'9px 18px', background:C2.acc, border:'none',
              borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
              cursor:'pointer', fontFamily:'inherit' }}>
            + New Client
          </button>
        )}
      </div>

      {/* Add client form — Super Admin only */}
      {adding && isSuperAdmin && (
        <div style={{ background:C2.panel, border:`1px solid ${C2.border}`,
          borderRadius:10, padding:20, marginBottom:20,
          display:'flex', gap:12, alignItems:'flex-end' }}>
          {[
            ['Restaurant Name', name,   setName,   'e.g. Urban Eats Melbourne'],
            ['Domain',          domain, setDomain, 'e.g. urbaneatsmcl.com.au'],
          ].map(([lbl, val, set, ph]) => (
            <div key={lbl} style={{ flex:1 }}>
              <label style={{ fontSize:11, fontWeight:700, color:C2.t3,
                textTransform:'uppercase', display:'block', marginBottom:5 }}>{lbl}</label>
              <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width:'100%', padding:'9px 11px', background:C2.input,
                  border:`1px solid ${C2.border}`, borderRadius:7, color:C2.t0,
                  fontSize:13, fontFamily:'inherit', outline:'none',
                  boxSizing:'border-box' }}/>
            </div>
          ))}
          <button onClick={add}
            style={{ padding:'9px 20px', background:C2.acc, border:'none',
              borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
              cursor:'pointer', fontFamily:'inherit' }}>Save</button>
          <button onClick={() => setAdding(false)}
            style={{ padding:'9px 16px', background:'transparent',
              border:`1px solid ${C2.border}`, borderRadius:7,
              color:C2.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background:C2.panel, border:`1px solid ${C2.border}`,
        borderRadius:10, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 200px 100px 120px',
          padding:'9px 18px', background:C2.card,
          borderBottom:`1px solid ${C2.border}` }}>
          {['Client', 'Domain', 'Status', 'Updated'].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, color:C2.t3,
              textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>

        {clients.map((c, i) => (
          <div key={c.id} onClick={() => onOpenSite(c)}
            style={{ display:'grid', gridTemplateColumns:'1fr 200px 100px 120px',
              padding:'12px 18px',
              borderBottom: i < clients.length - 1
                ? `1px solid ${C2.border}20` : 'none',
              cursor:'pointer', alignItems:'center' }}
            onMouseEnter={e => e.currentTarget.style.background = C2.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
              <span style={{ fontWeight:600, color:C2.acc }}>{c.name}</span>
              {/* Show granted tabs for editors */}
              {!isSuperAdmin && (
                <div style={{ display:'flex', gap:4, marginTop:3 }}>
                  {(clientAccess[c.id] || []).map(tab => (
                    <span key={tab} style={{ fontSize:10, fontWeight:700,
                      textTransform:'uppercase', background:'#FF6B2B20',
                      color:'#FF6B2B', padding:'1px 5px', borderRadius:3 }}>
                      {tab}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize:12, color:C2.t3, fontFamily:'monospace' }}>
              {c.domain}
            </span>
            <span style={{ fontSize:11, fontWeight:700,
              color: c.status === 'live' ? C2.green : C2.amber }}>
              {c.status}
            </span>
            <span style={{ fontSize:11, color:C2.t3 }}>
              {new Date(c.updatedAt).toLocaleDateString()}
            </span>
          </div>
        ))}

        {clients.length === 0 && (
          <div style={{ padding:32, textAlign:'center', color:C2.t3, fontSize:13 }}>
            {isSuperAdmin
              ? 'No clients yet. Click + New Client to add one.'
              : 'No sites have been assigned to your account yet. Contact your administrator.'}
          </div>
        )}
      </div>
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

  if (!ready) return <div style={{ padding:40, color:'#7A8BAD' }}>Loading...</div>

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
  <Route path="/site-admin/*" element={<SiteAdminApp />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
</Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}