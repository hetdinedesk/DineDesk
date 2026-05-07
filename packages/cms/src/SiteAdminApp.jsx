import { useState, useEffect } from 'react'
import { DDLogo } from './Components/Layout'
import { apiFetch as baseApiFetch } from './api/utils'

const SA_TOKEN_KEY = 'dd_sa_token'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', accHov:'#E85A1A', accBg:'#2A1200',
  green:'#22C55E', greenBg:'#052010',
  red:'#EF4444', redBg:'#1A0505',
  amber:'#F59E0B', amberBg:'#1A1000',
  cyan:'#00D4FF', cyanBg:'#001A22',
  purple:'#A78BFA', input:'#111827',
}

const apiFetch = (path, method = 'GET', body = null) => baseApiFetch(path, method, body, SA_TOKEN_KEY)
const API = import.meta.env.VITE_CMS_API_URL || import.meta.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'

// ── Login Page ──────────────────────────────────────────────────
function SALogin({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async () => {
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      const data = await baseApiFetch('/auth/login', 'POST', { email, password })

      if (data.error) { setError('Invalid credentials.'); setLoading(false); return }
      if (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'MANAGER') {
        setError('Access denied. This portal is for staff only.'); setLoading(false); return
      }
      localStorage.setItem(SA_TOKEN_KEY, data.token)
      onLogin(data.user)
    } catch {
      setError('Connection error. Is the API running?')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.page, display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',system-ui,sans-serif", padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

      <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)',
        width:600, height:300, borderRadius:'50%', pointerEvents:'none',
        background:`radial-gradient(ellipse, ${C.acc}15 0%, transparent 70%)` }}/>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:36, position:'relative', zIndex:1 }}>
        <DDLogo size={48}/>
        <div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.04em' }}>
            <span style={{ color:C.t0 }}>Dine</span>
            <span style={{ color:C.acc }}>Desk</span>
          </div>
          <div style={{ fontSize:11, color:C.t3, marginTop:2, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Site Admin Portal
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:400, background:C.panel,
        border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)', position:'relative', zIndex:1 }}>
        <div style={{ height:3, background:`linear-gradient(90deg, ${C.acc}, ${C.cyan})` }}/>
        <div style={{ padding:'32px 32px 28px' }}>
          <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:C.t0 }}>Staff Sign In</h2>
          <p style={{ margin:'0 0 24px', fontSize:13, color:C.t2 }}>
            Access restricted to DineDesk staff only.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && submit()}
                placeholder="you@dinedesk.io"
                style={{ width:'100%', padding:'11px 14px', fontSize:14, background:C.input,
                  border:`1px solid ${C.border}`, borderRadius:9, color:C.t0,
                  fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor=C.acc}
                onBlur={e => e.target.style.borderColor=C.border}
              />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>
                Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && submit()}
                placeholder="••••••••"
                style={{ width:'100%', padding:'11px 14px', fontSize:14, background:C.input,
                  border:`1px solid ${C.border}`, borderRadius:9, color:C.t0,
                  fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor=C.acc}
                onBlur={e => e.target.style.borderColor=C.border}
              />
            </div>

            {error && (
              <div style={{ padding:'10px 14px', background:C.redBg,
                border:`1px solid ${C.red}40`, borderRadius:8, fontSize:13, color:C.red }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={submit} disabled={loading}
              style={{ width:'100%', padding:13,
                background:loading ? C.card : `linear-gradient(135deg,${C.acc},${C.accHov})`,
                border:'none', borderRadius:9, fontSize:15, fontWeight:800, color:'#fff',
                cursor:loading?'not-allowed':'pointer', fontFamily:'inherit',
                boxShadow:loading?'none':`0 4px 20px ${C.acc}50` }}>
              {loading ? '⏳ Signing in…' : 'Sign In →'}
            </button>
          </div>

          <div style={{ marginTop:20, padding:'14px 0 0', borderTop:`1px solid ${C.border}`,
            fontSize:12, color:C.t3, textAlign:'center' }}>
            Client portal is at{' '}
            <a href="/" style={{ color:C.acc, textDecoration:'none' }}>cms.dinedesk.io</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Site Admin Shell ───────────────────────────────────────
function SAShell({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  const tabs = [
    { key:'dashboard', label:'Dashboard',         icon:'📊' },
    ...(isSuperAdmin ? [{ key:'users',     label:'Users',             icon:'👥' }] : []),
    ...(isSuperAdmin ? [{ key:'activity',  label:'Activity Log',      icon:'📋' }] : []),
    ...(isSuperAdmin ? [{ key:'settings',  label:'Platform Settings', icon:'⚙️' }] : []),
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.page,
      fontFamily:"'DM Sans',system-ui,sans-serif",
      display:'flex', flexDirection:'column', color:C.t0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

      {/* Top nav */}
      <div style={{ height:52, background:C.panel, borderBottom:`2px solid ${C.acc}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 32px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
            <DDLogo size={28}/>
            <span style={{ fontWeight:900, fontSize:15, letterSpacing:'-0.03em' }}>
              <span style={{ color:C.t0 }}>Dine</span>
              <span style={{ color:C.acc }}>Desk</span>
            </span>
            <span style={{ fontSize:11, color:C.t3, background:C.card,
              border:`1px solid ${C.border}`, borderRadius:4,
              padding:'2px 8px', fontWeight:700, marginLeft:4,
              textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Site Admin
            </span>
          </div>

          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ display:'flex', alignItems:'center', gap:6,
                padding:'7px 12px', border:'none',
                borderBottom: tab===key ? `2px solid ${C.acc}` : '2px solid transparent',
                background: tab===key ? C.hover : 'transparent',
                color: tab===key ? C.t0 : C.t2,
                fontWeight: tab===key ? 700 : 400,
                fontSize:13, cursor:'pointer', fontFamily:'inherit', marginBottom:-2 }}>
              <span style={{ fontSize:14 }}>{icon}</span>{label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <a href="/" style={{ padding:'6px 14px', background:'transparent',
            border:`1px solid ${C.border}`, borderRadius:6,
            color:C.t2, fontSize:12, cursor:'pointer', fontFamily:'inherit',
            textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
            ← Client CMS
          </a>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, color:C.t0, fontWeight:600 }}>{user.name}</div>
            <div style={{ fontSize:11, color:C.t3 }}>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Manager'}</div>
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%',
            background:`linear-gradient(135deg,${C.acc},${C.accHov})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:800, color:'#fff' }}>
            {user.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <button onClick={onLogout}
            style={{ padding:'6px 14px', background:'transparent',
              border:`1px solid ${C.border}`, borderRadius:6,
              color:C.t2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {tab==='dashboard' && <SADashboard />}
        {tab==='users'     && isSuperAdmin && <SAUsers     />}
        {tab==='activity'  && isSuperAdmin && <SAActivity  />}
        {tab==='settings'  && isSuperAdmin && <SASettings  />}
      </div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────
function SADashboard() {
  const [stats,    setStats]    = useState(null)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    Promise.all([
      apiFetch('/clients'),
      apiFetch('/users'),
      apiFetch('/groups'),
      apiFetch('/activity'),
    ]).then(([clients, users, groups, logs]) => {
      setStats({
        sites:   Array.isArray(clients) ? clients.length : 0,
        live:    Array.isArray(clients) ? clients.filter(c=>c.status==='live').length : 0,
        users:   Array.isArray(users)   ? users.length   : 0,
        groups:  Array.isArray(groups)  ? groups.length  : 0,
      })
      setActivity(Array.isArray(logs) ? logs.slice(0,8) : [])
    })
  }, [])

  const actionColor = (action) => {
    if (action.includes('LOGIN'))    return C.cyan
    if (action.includes('DEPLOY'))   return C.amber
    if (action.includes('DELETED'))  return C.red
    if (action.includes('CREATED'))  return C.green
    if (action.includes('EDITED') || action.includes('SAVED')) return C.purple
    return C.t2
  }

  const actionIcon = (action) => {
    if (action.includes('LOGIN'))    return '🔑'
    if (action.includes('DEPLOY'))   return '🚀'
    if (action.includes('DELETED'))  return '🗑️'
    if (action.includes('CREATED'))  return '✅'
    if (action.includes('EDITED') || action.includes('SAVED')) return '✏️'
    return '📋'
  }

  const metricCards = stats ? [
    { label:'Total Sites',   value:stats.sites,  icon:'🌐', color:C.acc    },
    { label:'Live Sites',    value:stats.live,   icon:'✅', color:C.green  },
    { label:'Total Users',   value:stats.users,  icon:'👥', color:C.cyan   },
    { label:'Groups',        value:stats.groups, icon:'📁', color:C.purple },
  ] : []

  return (
    <div style={{ padding:'28px 36px', overflowY:'auto', height:'100%', boxSizing:'border-box' }}>
      <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:800, color:C.t0 }}>Dashboard</h2>

      {/* Metric cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {metricCards.map(({ label, value, icon, color }) => (
          <div key={label} style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:12, padding:'18px 20px', borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <span style={{ fontSize:30, fontWeight:900, color:C.t0,
                letterSpacing:'-0.03em' }}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <h3 style={{ fontSize:14, fontWeight:700, color:C.t2,
        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
        Recent Activity
      </h3>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`,
        borderRadius:10, overflow:'hidden' }}>
        {activity.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
            No activity logged yet.
          </div>
        ) : activity.map((log, i) => (
          <div key={log.id} style={{ display:'flex', alignItems:'center', gap:14,
            padding:'11px 16px',
            borderBottom: i < activity.length-1 ? `1px solid ${C.border}20` : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background=C.hover}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <span style={{ fontSize:18, flexShrink:0 }}>{actionIcon(log.action)}</span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:12, fontWeight:700,
                color:actionColor(log.action),
                background:actionColor(log.action)+'20',
                padding:'1px 7px', borderRadius:4 }}>
                {log.action.replace(/_/g,' ')}
              </span>
              {log.entityName && (
                <span style={{ fontSize:13, color:C.t1, marginLeft:8 }}>
                  {log.entityName}
                </span>
              )}
              {log.userName && (
                <span style={{ fontSize:12, color:C.t3, marginLeft:6 }}>
                  by {log.userName}
                </span>
              )}
            </div>
            <span style={{ fontSize:11, color:C.t3, flexShrink:0 }}>
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Users ───────────────────────────────────────────────────────
function SAUsers() {
  const [users,    setUsers]    = useState([])
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(() => sessionStorage.getItem('sa_users_show_add') === 'true')
  const [editUser, setEditUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sa_users_edit_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  // New user form
  const [newName,     setNewName]     = useState(() => sessionStorage.getItem('sa_users_new_name') || '')
  const [newEmail,    setNewEmail]    = useState(() => sessionStorage.getItem('sa_users_new_email') || '')
  const [newPassword, setNewPassword] = useState('')
  const [newRole,     setNewRole]     = useState(() => sessionStorage.getItem('sa_users_new_role') || 'EDITOR')
  // clientAccess: { siteId: ['items','cms','config','dashboard'], ... }
  const [newAccess,   setNewAccess]   = useState(() => {
    try {
      const saved = sessionStorage.getItem('sa_users_new_access')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  useEffect(() => {
    sessionStorage.setItem('sa_users_show_add', showAdd)
    sessionStorage.setItem('sa_users_edit_user', JSON.stringify(editUser))
    sessionStorage.setItem('sa_users_new_name', newName)
    sessionStorage.setItem('sa_users_new_email', newEmail)
    // Never persist passwords to sessionStorage
    sessionStorage.setItem('sa_users_new_role', newRole)
    sessionStorage.setItem('sa_users_new_access', JSON.stringify(newAccess))
  }, [showAdd, editUser, newName, newEmail, newPassword, newRole, newAccess])

  const TABS = ['items', 'cms', 'config', 'dashboard', 'operations']

  const load = () => {
    setLoading(true)
    Promise.all([apiFetch('/users'), apiFetch('/clients')])
      .then(([u, c]) => {
        setUsers(Array.isArray(u) ? u : [])
        setClients(Array.isArray(c) ? c : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleTab = (access, setAccess, siteId, tab) => {
    const current = access[siteId] || []
    const updated  = current.includes(tab)
      ? current.filter(t => t !== tab)
      : [...current, tab]
    setAccess({ ...access, [siteId]: updated })
  }

  const toggleAllSite = (access, setAccess, siteId) => {
    const current = access[siteId] || []
    setAccess({
      ...access,
      [siteId]: current.length === TABS.length ? [] : [...TABS]
    })
  }

  const createUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      setError('Name, email and password are required.'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch(API + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem(SA_TOKEN_KEY) },
        body: JSON.stringify({
          name: newName, email: newEmail, password: newPassword,
          role: newRole, clientAccess: newAccess
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('EDITOR'); setNewAccess({})
      setShowAdd(false); setSaving(false);
      sessionStorage.removeItem('sa_users_show_add')
      sessionStorage.removeItem('sa_users_new_name')
      sessionStorage.removeItem('sa_users_new_email')
      // password not persisted
      sessionStorage.removeItem('sa_users_new_role')
      sessionStorage.removeItem('sa_users_new_access')
      load()
    } catch (err) {
      setError('Connection error: ' + err.message)
      setSaving(false)
    }
  }

  const saveEdit = async () => {
    setSaving(true)
    await apiFetch(`/users/${editUser.id}`, 'PUT', {
      name: editUser.name,
      email: editUser.email,
      clientAccess: editUser.clientAccess || {}
    })
    setSaving(false); setEditUser(null); load()
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    await apiFetch(`/users/${id}`, 'DELETE')
    load()
  }

  // Reusable per-site access picker
  const AccessPicker = ({ access, setAccess }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em' }}>
        Site Access — tick tabs per site
      </label>
      {clients.length === 0 && (
        <div style={{ fontSize:13, color:C.t3 }}>No sites yet.</div>
      )}
      {clients.map(cl => {
        const siteTabs = access[cl.id] || []
        const allTicked = siteTabs.length === TABS.length
        return (
          <div key={cl.id} style={{ background:C.card,
            border:`1px solid ${siteTabs.length > 0 ? C.acc+'40' : C.border}`,
            borderRadius:10, overflow:'hidden' }}>
            {/* Site header row */}
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between', padding:'10px 14px',
              borderBottom: siteTabs.length > 0 ? `1px solid ${C.border}` : 'none',
              background: siteTabs.length > 0 ? C.accBg+'80' : 'transparent' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700,
                  color: siteTabs.length > 0 ? C.acc : C.t1 }}>
                  {cl.name}
                </span>
                <span style={{ fontSize:11, color:C.t3, fontFamily:'monospace' }}>
                  {cl.domain}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {siteTabs.length > 0 && (
                  <span style={{ fontSize:11, color:C.acc, fontWeight:600 }}>
                    {siteTabs.length} tab{siteTabs.length!==1?'s':''} enabled
                  </span>
                )}
                <label style={{ display:'flex', alignItems:'center', gap:5,
                  cursor:'pointer', fontSize:12, color:C.t2 }}>
                  <input type="checkbox" checked={allTicked}
                    onChange={() => toggleAllSite(access, setAccess, cl.id)}
                    style={{ accentColor:C.acc, width:14, height:14 }}/>
                  All
                </label>
              </div>
            </div>
            {/* Tab checkboxes */}
            {siteTabs.length > 0 || true ? (
              <div style={{ display:'flex', gap:0, padding:'10px 14px', flexWrap:'wrap', gap:8 }}>
                {TABS.map(tab => {
                  const has = siteTabs.includes(tab)
                  return (
                    <label key={tab} style={{ display:'flex', alignItems:'center', gap:6,
                      padding:'5px 12px', borderRadius:7, cursor:'pointer',
                      background: has ? C.acc+'20' : 'transparent',
                      border:`1px solid ${has ? C.acc : C.border}`,
                      fontSize:12, fontWeight: has ? 700 : 400,
                      color: has ? C.acc : C.t3,
                      textTransform:'capitalize', transition:'all 0.15s' }}>
                      <input type="checkbox" checked={has}
                        onChange={() => toggleTab(access, setAccess, cl.id, tab)}
                        style={{ accentColor:C.acc, width:13, height:13 }}/>
                      {tab}
                    </label>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ padding:'28px 36px', overflowY:'auto',
      height:'100%', boxSizing:'border-box' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:'0 0 2px', fontSize:18, fontWeight:800, color:C.t0 }}>
            Users
          </h2>
          <div style={{ fontSize:13, color:C.t3 }}>{users.length} total</div>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setEditUser(null); setError('') }}
          style={{ padding:'9px 18px', background:C.acc, border:'none',
            borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
            cursor:'pointer', fontFamily:'inherit' }}>
          + Add User
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`,
          borderRadius:12, padding:24, marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.t0, marginBottom:18 }}>
            New User
          </div>

          {/* Basic fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',
            gap:12, marginBottom:20 }}>
            {[['Full Name','text',newName,setNewName,'e.g. Marco Rossi'],
              ['Email Address','email',newEmail,setNewEmail,'marco@restaurant.com'],
              ['Password','password',newPassword,setNewPassword,'Temporary password'],
            ].map(([lbl,type,val,set,ph]) => (
              <div key={lbl}>
                <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  display:'block', marginBottom:5 }}>{lbl}</label>
                <input type={type} value={val}
                  onChange={e => set(e.target.value)} placeholder={ph}
                  style={{ width:'100%', padding:'9px 11px', background:C.input,
                    border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                    fontSize:13, fontFamily:'inherit', outline:'none',
                    boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor=C.acc}
                  onBlur={e  => e.target.style.borderColor=C.border}
                />
              </div>
            ))}
            {/* Role selector */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:5 }}>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                style={{ width:'100%', padding:'9px 11px', background:C.input,
                  border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                  fontSize:13, fontFamily:'inherit', outline:'none',
                  boxSizing:'border-box', cursor:'pointer' }}
                onFocus={e => e.target.style.borderColor=C.acc}
                onBlur={e  => e.target.style.borderColor=C.border}>
                <option value="EDITOR">Editor (Limited access)</option>
                <option value="MANAGER">Manager (Full client access)</option>
              </select>
            </div>
          </div>

          {/* Site access picker */}
          <div style={{ marginBottom:20 }}>
            <AccessPicker access={newAccess} setAccess={setNewAccess}/>
          </div>

          {error && (
            <div style={{ padding:'8px 12px', background:C.redBg,
              border:`1px solid ${C.red}40`, borderRadius:7,
              fontSize:13, color:C.red, marginBottom:14 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createUser} disabled={saving}
              style={{ padding:'10px 24px', background:C.acc, border:'none',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
            <button onClick={() => { setShowAdd(false); setError('') }}
              style={{ padding:'10px 16px', background:'transparent',
                border:`1px solid ${C.border}`, borderRadius:8,
                color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit user panel */}
      {editUser && (
        <div style={{ background:C.panel, border:`1px solid ${C.acc}40`,
          borderRadius:12, padding:24, marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.t0, marginBottom:18 }}>
            Editing — {editUser.name}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:12, marginBottom:20 }}>
            {[['Full Name', editUser.name, v => setEditUser(p=>({...p,name:v}))],
              ['Email', editUser.email, v => setEditUser(p=>({...p,email:v}))],
            ].map(([lbl, val, onChange]) => (
              <div key={lbl}>
                <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  display:'block', marginBottom:5 }}>{lbl}</label>
                <input value={val || ''} onChange={e => onChange(e.target.value)}
                  style={{ width:'100%', padding:'9px 11px', background:C.input,
                    border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                    fontSize:13, fontFamily:'inherit', outline:'none',
                    boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor=C.acc}
                  onBlur={e  => e.target.style.borderColor=C.border}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom:20 }}>
            <AccessPicker
              access={editUser.clientAccess || {}}
              setAccess={v => setEditUser(p => ({...p, clientAccess: v}))}
            />
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={saveEdit} disabled={saving}
              style={{ padding:'10px 24px', background:C.acc, border:'none',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setEditUser(null)}
              style={{ padding:'10px 16px', background:'transparent',
                border:`1px solid ${C.border}`, borderRadius:8,
                color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div style={{ padding:32, textAlign:'center', color:C.t3 }}>Loading...</div>
      ) : users.filter(u => u.role !== 'SUPER_ADMIN').length === 0 ? (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`,
          borderRadius:10, padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
          No client users yet. Click + Add User to create one.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {users.filter(u => u.role !== 'SUPER_ADMIN').map(u => {
            const access = u.clientAccess || {}
            const siteCount = Object.keys(access).filter(k => (access[k]||[]).length > 0).length
            return (
              <div key={u.id} style={{ background:C.panel,
                border:`1px solid ${C.border}`, borderRadius:12,
                padding:'14px 18px', display:'flex',
                alignItems:'center', justifyContent:'space-between' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=C.border2}
                onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>

                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%',
                    background:`linear-gradient(135deg,${C.acc},${C.accHov})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {u.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize:12, color:C.t3 }}>{u.email}</div>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  {/* Show which sites + tabs they have */}
                  <div style={{ display:'flex', flexDirection:'column',
                    gap:4, alignItems:'flex-end' }}>
                    {siteCount === 0 ? (
                      <span style={{ fontSize:12, color:C.t3 }}>No access granted</span>
                    ) : (
                      Object.entries(access)
                        .filter(([,tabs]) => tabs.length > 0)
                        .map(([siteId, tabs]) => {
                          const site = clients.find(c => c.id === siteId)
                          if (!site) return null
                          return (
                            <div key={siteId} style={{ display:'flex',
                              alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:11, color:C.t1,
                                fontWeight:600 }}>{site.name}:</span>
                              <div style={{ display:'flex', gap:4 }}>
                                {tabs.map(tab => (
                                  <span key={tab} style={{ fontSize:10,
                                    fontWeight:700, textTransform:'uppercase',
                                    background:C.acc+'20', color:C.acc,
                                    padding:'1px 6px', borderRadius:3 }}>
                                    {tab}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>

                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setEditUser({...u}); setShowAdd(false) }}
                      style={{ padding:'6px 14px', background:'transparent',
                        border:`1px solid ${C.border2}`, borderRadius:6,
                        color:C.t2, fontSize:12, cursor:'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteUser(u.id)}
                      style={{ padding:'6px 14px', background:'transparent',
                        border:`1px solid ${C.red}40`, borderRadius:6,
                        color:C.red, fontSize:12, cursor:'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Groups ──────────────────────────────────────────────────────
function SAGroups() {
  const [groups,  setGroups]  = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name,    setName]    = useState('')
  const [color,   setColor]   = useState('#FF6B2B')
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([apiFetch('/groups'), apiFetch('/clients')])
      .then(([g,c]) => { setGroups(Array.isArray(g)?g:[]); setClients(Array.isArray(c)?c:[]); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addGroup = async () => {
    if (!name) return
    setSaving(true)
    await apiFetch('/groups', 'POST', { name, color })
    setName(''); setColor('#FF6B2B'); setShowAdd(false); setSaving(false); load()
  }

  const deleteGroup = async (id) => {
    if (!window.confirm('Delete group? Sites will be unassigned.')) return
    await apiFetch(`/groups/${id}`, 'DELETE')
    load()
  }

  return (
    <div style={{ padding:'28px 36px', overflowY:'auto', height:'100%', boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:'0 0 2px', fontSize:18, fontWeight:800, color:C.t0 }}>Groups</h2>
          <div style={{ fontSize:13, color:C.t3 }}>{groups.length} total</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding:'9px 18px', background:C.acc, border:'none', borderRadius:8,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Group
        </button>
      </div>

      {showAdd && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12,
          padding:20, marginBottom:20, display:'flex', gap:12, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Urban Eats Group"
              style={{ width:'100%', padding:'9px 11px', background:C.input,
                border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Colour</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width:48, height:38, border:'none', borderRadius:7, cursor:'pointer' }}/>
          </div>
          <button onClick={addGroup} disabled={saving}
            style={{ padding:'9px 20px', background:C.acc, border:'none', borderRadius:7,
              color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setShowAdd(false)}
            style={{ padding:'9px 16px', background:'transparent', border:`1px solid ${C.border}`,
              borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
        </div>
      )}

      {loading ? <div style={{ padding:32, textAlign:'center', color:C.t3 }}>Loading...</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups.length===0 ? (
            <div style={{ background:C.panel, border:`1px solid ${C.border}`,
              borderRadius:10, padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
              No groups yet.
            </div>
          ) : groups.map(g => {
            const gc = clients.filter(c => c.groupId===g.id)
            return (
              <div key={g.id} style={{ background:C.panel, border:`1px solid ${C.border}`,
                borderRadius:12, overflow:'hidden', borderLeft:`4px solid ${g.color}` }}>
                <div style={{ padding:'14px 18px', display:'flex',
                  alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:12, height:12, borderRadius:'50%',
                      background:g.color, boxShadow:`0 0 8px ${g.color}80` }}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>{g.name}</div>
                      <div style={{ fontSize:11, color:C.t3 }}>{gc.length} site{gc.length!==1?'s':''}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteGroup(g.id)}
                    style={{ padding:'5px 12px', background:'transparent',
                      border:`1px solid ${C.red}40`, borderRadius:6,
                      color:C.red, fontSize:12, cursor:'pointer' }}>Delete</button>
                </div>
                {gc.length > 0 && (
                  <div style={{ padding:'0 18px 14px', display:'flex', flexWrap:'wrap', gap:6 }}>
                    {gc.map(cl => (
                      <span key={cl.id} style={{ fontSize:11, fontWeight:600,
                        background:g.color+'20', color:g.color,
                        padding:'3px 10px', borderRadius:5,
                        border:`1px solid ${g.color}30` }}>{cl.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Activity Log ────────────────────────────────────────────────
function SAActivity() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')

  useEffect(() => {
    apiFetch('/activity').then(d => { setLogs(Array.isArray(d)?d:[]); setLoading(false) })
  }, [])

  const categories = ['ALL','LOGIN','DEPLOY','CREATED','DELETED','EDITED','SAVED']

  const filtered = filter==='ALL' ? logs : logs.filter(l => l.action.includes(filter))

  const actionColor = (a) => {
    if (a.includes('LOGIN'))  return C.cyan
    if (a.includes('DEPLOY')) return C.amber
    if (a.includes('DELETE')) return C.red
    if (a.includes('CREATE')) return C.green
    return C.purple
  }
  const actionIcon = (a) => {
    if (a.includes('LOGIN'))  return '🔑'
    if (a.includes('DEPLOY')) return '🚀'
    if (a.includes('DELETE')) return '🗑️'
    if (a.includes('CREATE')) return '✅'
    if (a.includes('EDIT') || a.includes('SAVE')) return '✏️'
    return '📋'
  }

  return (
    <div style={{ padding:'28px 36px', overflowY:'auto', height:'100%', boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:'0 0 2px', fontSize:18, fontWeight:800, color:C.t0 }}>Activity Log</h2>
          <div style={{ fontSize:13, color:C.t3 }}>{filtered.length} of {logs.length} entries</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
                fontFamily:'inherit', fontWeight: filter===cat ? 700 : 400,
                background: filter===cat ? C.accBg : 'transparent',
                color: filter===cat ? C.acc : C.t3,
                border:`1px solid ${filter===cat ? C.acc : C.border}` }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ padding:32, textAlign:'center', color:C.t3 }}>Loading...</div> : (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'40px 160px 1fr 140px 180px',
            padding:'9px 16px', background:C.card, borderBottom:`1px solid ${C.border}` }}>
            {['','Action','Details','User','Time'].map(h => (
              <span key={h} style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
            ))}
          </div>
          {filtered.length===0 ? (
            <div style={{ padding:28, textAlign:'center', color:C.t3, fontSize:13 }}>
              No activity matching this filter.
            </div>
          ) : filtered.map((log, i) => (
            <div key={log.id} style={{ display:'grid', gridTemplateColumns:'40px 160px 1fr 140px 180px',
              padding:'10px 16px', alignItems:'center',
              borderBottom: i<filtered.length-1 ? `1px solid ${C.border}15` : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background=C.hover}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontSize:16 }}>{actionIcon(log.action)}</span>
              <span style={{ fontSize:11, fontWeight:700,
                background:actionColor(log.action)+'20',
                color:actionColor(log.action),
                padding:'2px 8px', borderRadius:4, display:'inline-block' }}>
                {log.action.replace(/_/g,' ')}
              </span>
              <div>
                {log.entityName && <span style={{ fontSize:13, color:C.t0, fontWeight:600 }}>{log.entityName}</span>}
                {log.clientName && <span style={{ fontSize:12, color:C.t3, marginLeft:8 }}>· {log.clientName}</span>}
              </div>
              <span style={{ fontSize:12, color:C.t2 }}>{log.userName || '—'}</span>
              <span style={{ fontSize:11, color:C.t3 }}>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Platform Settings ───────────────────────────────────────────
function SASettings() {
  const [form, setForm] = useState({
    companyName:'DineDesk', logoUrl:'', website:'https://dinedesk.io',
    supportEmail:'support@dinedesk.io', contactPhone:'',
    smtpHost:'', smtpPort:'587', smtpUser:'', smtpPassword:'',
    defaultFromEmail:'', defaultTimezone:'Australia/Melbourne',
  })
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(SA_TOKEN_KEY)
    fetch(API + '/platform', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        if (d && d.settings) setForm(prev => ({ ...prev, ...d.settings }))
      })
      .catch(err => console.error('Load platform settings failed:', err))
  }, [])

  const save = async () => {
    setSaving(true)
    const token = localStorage.getItem(SA_TOKEN_KEY)
    try {
      const res = await fetch(API + '/platform', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true); setTimeout(()=>setSaved(false),3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    {
      title:'Branding',
      fields: [
        { key:'companyName', label:'Company Name', type:'text', ph:'DineDesk' },
        { key:'logoUrl',     label:'Logo URL',      type:'url',  ph:'https://example.com/logo.png' },
        { key:'website',     label:'Website URL',   type:'url',  ph:'https://dinedesk.io' },
      ]
    },
    {
      title:'Contact Information',
      fields: [
        { key:'supportEmail', label:'Support Email', type:'email', ph:'support@dinedesk.io' },
        { key:'contactPhone', label:'Contact Phone', type:'text',  ph:'+61 400 000 000' },
      ]
    },
    {
      title:'Email Configuration',
      fields: [
        { key:'smtpHost',         label:'SMTP Host',         type:'text', ph:'smtp.example.com' },
        { key:'smtpPort',         label:'SMTP Port',         type:'text', ph:'587' },
        { key:'smtpUser',         label:'SMTP User',         type:'text', ph:'user@example.com' },
        { key:'smtpPassword',     label:'SMTP Password',     type:'password', ph:'••••••••' },
        { key:'defaultFromEmail', label:'Default From Email',type:'email', ph:'noreply@dinedesk.io' },
      ]
    },
    {
      title:'General',
      fields: [
        { key:'defaultTimezone', label:'Default Timezone', type:'text', ph:'Australia/Melbourne' },
      ]
    },
  ]

  return (
    <div style={{ padding:'28px 36px', overflowY:'auto', height:'100%', boxSizing:'border-box' }}>
      <h2 style={{ margin:'0 0 4px', fontSize:18, fontWeight:800, color:C.t0 }}>Platform Settings</h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:C.t3 }}>Global settings for the DineDesk platform.</p>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {sections.map((section, si) => (
          <div key={si} style={{ maxWidth:640, background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:C.t0, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {section.title}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {section.fields.map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                    letterSpacing:'0.06em', display:'block', marginBottom:6 }}>{label}</label>
                  <input type={type} value={form[key]} placeholder={ph}
                    onChange={e => setForm(p=>({...p,[key]:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', background:C.input,
                      border:`1px solid ${C.border}`, borderRadius:8, color:C.t0,
                      fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor=C.acc}
                    onBlur={e => e.target.style.borderColor=C.border}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'10px 24px', background:C.acc, border:'none', borderRadius:8,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
      </div>
    </div>
  )
}

// ── Root export ─────────────────────────────────────────────────
export default function SiteAdminApp() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem(SA_TOKEN_KEY)
    if (token) {
      fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(u => {
          if (u.role === 'SUPER_ADMIN' || u.role === 'MANAGER') {
            setUser(u)
          } else {
            localStorage.removeItem(SA_TOKEN_KEY)
          }
        })
        .catch(() => {})
    }
  }, [])

  const logout = () => {
    localStorage.removeItem(SA_TOKEN_KEY)
    setUser(null)
  }

  if (!user) return <SALogin onLogin={setUser} />
  return <SAShell user={user} onLogout={logout} />
}