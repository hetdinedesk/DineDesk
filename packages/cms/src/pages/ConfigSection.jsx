import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, saveConfig } from '../api/config'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { deployClient, getDeploys, createNetlifySite, getNetlifyDeploys } from '../api/deployment'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Settings, Palette, Code, FileText, Layout, Share2, Star, Calendar, BarChart3, Globe, ShoppingCart, CreditCard, Bell, Store } from 'lucide-react'
import { C } from '../theme'
import OnlineOrderingSection from './OnlineOrderingSection'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Sidebar groups — Clean 3-layer structure:
// General (Site identity) | Design (Visual layer) | Deploy (Publishing)
const SIDEBAR = [
  { group:'General', Icon: Settings, items:[
    { key:'site-settings',  label:'Site Settings', Icon: Settings },
    { key:'site-branding',  label:'Branding', Icon: Palette },
    { key:'shortcodes',     label:'Shortcodes', Icon: Code },
    { key:'site-notes',     label:'Notes', Icon: FileText },
  ]},
  { group:'Online Ordering', Icon: ShoppingCart, items:[
    { key:'ordering-config', label:'General', Icon: Store },
    { key:'payment-settings', label:'Payment Settings', Icon: CreditCard },
    { key:'notifications', label:'Notifications', Icon: Bell },
  ]},
  { group:'Design', Icon: Layout, items:[
    { key:'themes',         label:'Theme', Icon: Palette },
    { key:'header-config',  label:'Header', Icon: Layout },
    { key:'social-links',   label:'Social Links', Icon: Share2 },
    { key:'reviews',        label:'Reviews', Icon: Star },
    { key:'booking',        label:'Booking', Icon: Calendar },
  ]},
  { group:'Deploy', Icon: Globe, items:[
    { key:'analytics',      label:'Analytics', Icon: BarChart3 },
    { key:'netlify',        label:'Deployment', Icon: Globe },
  ]},
]

// Reusable input matching prototype Inp component
function Inp({ label, value, onChange, placeholder, type='text', mono, hint }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      <input type={type} value={value || ''} onChange={onChange}
        placeholder={placeholder}
        style={{ padding:'9px 11px', fontSize:13, background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontFamily: mono ? "'Fira Code',monospace" : 'inherit',
          outline:'none', width:'100%', boxSizing:'border-box' }}/>
      {hint && <span style={{ fontSize:11, color:C.t3 }}>{hint}</span>}
    </div>
  )
}

function SaveBtn({ onClick, saving }) {
  return (
    <button onClick={onClick}
      style={{ marginTop:20, padding:'9px 22px', background:C.acc, border:'none',
        borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
        cursor:'pointer', fontFamily:'inherit' }}>
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  )
}

export default function ConfigSection({ clientId }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Restore activeKey from sessionStorage on page refresh
  const getSavedActiveKey = () => {
    try {
      const saved = sessionStorage.getItem(`config_active_${clientId}`)
      return saved || 'site-settings'
    } catch {
      return 'site-settings'
    }
  }
  
  // Get subsection from URL or sessionStorage
  const getSubsectionFromURL = () => {
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 4 && pathParts[0] === 'site' && pathParts[2] === 'config') {
      return pathParts[3]
    }
    return getSavedActiveKey()
  }
  
  const [activeKey, setActiveKey] = useState(getSubsectionFromURL)
  const [collapsed, setCollapsed] = useState({})
  const [client,    setClient]    = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)

  // Update URL when activeKey changes (but only if we're not already on the right URL)
  useEffect(() => {
    try {
      sessionStorage.setItem(`config_active_${clientId}`, activeKey)
      // Only update URL if we're not already on the correct URL
      const currentPath = window.location.pathname
      const pathParts = currentPath.split('/').filter(Boolean)
      if (pathParts.length >= 3 && pathParts[2] === 'config') {
        const expectedUrl = `/site/${pathParts[1]}/config/${activeKey}`
        if (currentPath !== expectedUrl) {
          navigate(expectedUrl, { replace: true })
        }
      }
    } catch (err) {
      console.warn('[Config] Failed to save active tab to sessionStorage:', err)
    }
  }, [activeKey, clientId, navigate])

  useEffect(() => {                                   // ← moved inside
    if (!clientId) return
    fetch(`${API_URL}/clients/${clientId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
    }).then(r => r.json()).then(setClient).catch(() => {})
  }, [clientId])

  const { data: config = {} } = useQuery({
    queryKey: ['config', clientId],
    queryFn: () => getConfig(clientId),
    enabled: !!clientId
  })

  const handleActiveKeyChange = (key) => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        setHasUnsavedChanges(false)
        setActiveKey(key)
      }
    } else {
      setActiveKey(key)
    }
  }

  const renderConfig = () => {
    try {
      const common = { clientId, config, setHasUnsavedChanges, activeKey }

      switch(activeKey) {
        case 'site-settings':  return <SiteSettings   {...common} client={client} />
        case 'site-notes':     return <SiteNotes       {...common} />
        case 'analytics':      return <AnalyticsConfig {...common} />
        case 'site-branding':  return <BrandingConfig  {...common} />
        case 'shortcodes':     return <ShortcodesConfig {...common} client={client} />
        case 'themes':         return <ThemesConfig    {...common} />
        case 'header-config':  return <HeaderConfig    {...common} onNavigate={setActiveKey} />
        case 'social-links':   return <SocialLinksConfig {...common} />
        case 'reviews':        return <ReviewsConfig   {...common} />
        case 'footer':         return <FooterConfig    {...common} />
        case 'booking':        return <BookingConfig   {...common} />
        case 'netlify':        return <NetlifyConfig   {...common} client={client} />
        case 'ordering-config': return <OnlineOrderingSection clientId={clientId} subsection='ordering-config' />
        case 'payment-settings': return <OnlineOrderingSection clientId={clientId} subsection='payment-settings' />
        case 'notifications': return <OnlineOrderingSection clientId={clientId} subsection='notifications' />
        default: return <div style={{color:C.t3}}>Coming soon.</div>
      }
    } catch (err) {
      console.error('Render config error:', err)
      return (
        <div style={{ padding:40, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
          <h3 style={{ color:C.acc, marginBottom:10 }}>Section Error</h3>
          <p style={{ color:C.t2, fontSize:14 }}>There was an error rendering this section. Try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload() }
            style={{ marginTop:20, padding:'8px 16px', background:C.acc, color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      )
    }
  }

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
      {/* Config sidebar */}
      <div style={{ width:210, minWidth:210, background:C.panel,
        borderRight:`1px solid ${C.border}`, overflowY:'auto' }}>
        {SIDEBAR.map(grp => {
          const GroupIcon = grp.Icon
          return (
            <div key={grp.group}>
              <button onClick={() => setCollapsed(p => ({...p, [grp.group]: !p[grp.group]}))}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', padding:'10px 14px', background:'none', border:'none',
                  borderBottom:`1px solid ${C.border}`, cursor:'pointer',
                  color:C.t3, fontSize:11, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.07em', fontFamily:'inherit' }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <GroupIcon size={14} />
                  {grp.group}
                </span>
                <span style={{ fontSize:10 }}>{collapsed[grp.group] ? '▶' : '▼'}</span>
              </button>
              {!collapsed[grp.group] && grp.items.map(item => {
                const ItemIcon = item.Icon
                return (
                  <button key={item.key} onClick={() => handleActiveKeyChange(item.key)}
                    style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                      padding:'8px 14px 8px 20px', border:'none',
                      background: activeKey===item.key ? '#1F2D4A' : 'transparent',
                      color: activeKey===item.key ? C.t0 : C.t2,
                      fontWeight: activeKey===item.key ? 700 : 400,
                      fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                      borderLeft:`2px solid ${activeKey===item.key ? C.acc : 'transparent'}` }}>
                    <ItemIcon size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Config content */}
      <div style={{ flex:1, padding:'28px 36px', overflowY:'auto', background:C.page }}>
        {renderConfig()}
      </div>
    </div>
  )
}


// Site Settings
const TIMEZONES = [
  'Australia/Sydney','Australia/Melbourne','Australia/Brisbane',
  'Australia/Perth','Australia/Adelaide','Australia/Darwin',
  'Australia/Hobart','Pacific/Auckland','Asia/Singapore',
  'Asia/Tokyo','Europe/London','America/New_York','America/Los_Angeles','UTC'
]

const COUNTRIES = [
  'Australia','New Zealand','United States','United Kingdom',
  'Canada','Singapore','Japan','Other'
]

const SITE_TYPES = [
  { key:'restaurant',  label:'Full-Service Restaurant', desc:'Dine-in + takeaway + reservations'    },
  { key:'cafe',        label:'Cafe / Coffee Shop',      desc:'Order ahead + loyalty + brunch'       },
  { key:'foodtruck',   label:'Food Truck',              desc:'Location-based + quick ordering'      },
  { key:'delivery',    label:'Cloud Kitchen',           desc:'Delivery only + multi-brand'          },
  { key:'quickserve',  label:'Quick Service',           desc:'Fast food + combos + high volume'     },
  { key:'catering',    label:'Catering',                desc:'Events + quotes + packages'           },
  { key:'mealprep',    label:'Meal Prep',               desc:'Subscriptions + scheduled delivery'   },
  { key:'finedine',    label:'Fine Dining',             desc:'Tasting menus + reservations + cellar'},
]

function SiteSettings({ clientId, config, client, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [form,   setForm]   = useState(config.settings || {})
  const [errors, setErrors] = useState({})
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(client?.groupId || '')
  const savedFormRef = useRef(config.settings || {})

  useEffect(() => {
  setSelectedGroupId(client?.groupId || '')
}, [client])

  useEffect(() => { 
    setForm(config.settings || {})
    savedFormRef.current = config.settings || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  // Track unsaved changes
  useEffect(() => {
    const saved = savedFormRef.current
    const hasChanges = JSON.stringify(form) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [form, setHasUnsavedChanges])

  useEffect(() => {
    fetch(`${API_URL}/groups`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
    }).then(r => r.json()).then(d => setGroups(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const set = (k, v) => {
    setForm(p => ({...p, [k]: v}))
    setErrors(p => ({...p, [k]: ''}))
  }

  // Validators
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const validateABN = (v) => {
    const digits = v.replace(/\s/g, '')
    return digits.length === 11 && /^\d+$/.test(digits)
  }

  const validate = () => {
    const e = {}
    if (!form.restaurantName?.trim()) e.restaurantName = 'Restaurant name is required'
    if (form.defaultEmail && !validateEmail(form.defaultEmail))
      e.defaultEmail = 'Enter a valid email address'
    if (form.abn && !validateABN(form.abn))
      e.abn = 'ABN must be 11 digits e.g. 51 824 753 556'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
  mutationFn: async () => {
    await saveConfig(clientId, { settings: form })
    const updates = {}
    if (form.restaurantName && form.restaurantName !== client?.name) {
      updates.name = form.restaurantName
    }
    if (selectedGroupId !== (client?.groupId || '')) {
      updates.groupId = selectedGroupId || null
    }

    updates.status = form.indexing === 'allowed' ? 'live' : 'draft'

    if (Object.keys(updates).length > 0) {
      await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('dd_token')
        },
        body: JSON.stringify(updates)
      })
    }
  },
  onSuccess: () => {
    qc.invalidateQueries(['config', clientId])
    setHasUnsavedChanges(false)
    fetch(`${API_URL}/clients/${clientId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
    }).then(r => r.json()).then(d => {
      window.dispatchEvent(new CustomEvent('client-updated', {
  detail: {
    id:       clientId,
    name:     form.restaurantName || d.name,
    status:   form.indexing === 'allowed' ? 'live' : 'draft',
    indexing: form.indexing || 'blocked',
    siteType: form.siteType || 'restaurant',
  }
}))
    }).catch(() => {})
  },
  onError: (err) => {
    console.error('Save failed:', err)
    console.error('Error details:', err.response?.data)
    
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`Save failed: ${errorMsg}\n\nPlease try again.`)
  }
})

const handleSave = () => {
  if (validate()) mutation.mutate()
}

const handleKey = (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA'
      && e.target.tagName !== 'SELECT') {
    e.preventDefault()
    handleSave()
  }
}

  const assignedGroup = groups.find(g => g.id === client?.groupId)

  const field = (label, key, opts = {}) => {
    const { type='text', placeholder='', hint='', mono=false } = opts
    const hasError = !!errors[key]
    return (
      <div key={key}>
        <label style={{ fontSize:11, fontWeight:700, color: hasError ? '#EF4444' : C.t3,
          textTransform:'uppercase', letterSpacing:'0.06em',
          display:'block', marginBottom:5 }}>{label}</label>
        <input
          type={type}
          value={form[key] || ''}
          onChange={e => set(key, e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ width:'100%', padding:'9px 11px', background:C.input,
            border:`1px solid ${hasError ? '#EF4444' : C.border}`,
            borderRadius:7, color:C.t0, fontSize:13,
            fontFamily: mono ? "'Fira Code',monospace" : 'inherit',
            outline:'none', boxSizing:'border-box' }}
          onFocus={e => e.target.style.borderColor = hasError ? '#EF4444' : C.acc}
          onBlur={e  => e.target.style.borderColor = hasError ? '#EF4444' : C.border}
        />
        {hasError && (
          <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠️ {errors[key]}</div>
        )}
        {hint && !hasError && (
          <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{hint}</div>
        )}
      </div>
    )
  }

  return (
    <div onKeyDown={handleKey}>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Site Settings
      </h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:C.t3 }}>
        Core identity for your website — name, contact details, and regional settings.
      </p>

      {/* ── Section: Identity ── */}
<div style={{ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:12, padding:20, marginBottom:16 }}>
  <div style={{ fontSize:12, fontWeight:700, color:C.t3,
    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
    Identity
  </div>
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

    {field('Restaurant Name (CMS only) *', 'restaurantName',
      { placeholder:'e.g. Urban Eats Melbourne',
        hint:'Updates the site name across the CMS when saved' })}

    {field('Public Display Name', 'displayName',
      { placeholder:'e.g. Urban Eats',
        hint:'The name shown to visitors on your website' })}

    {/* Group — changeable dropdown */}
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>Group</label>
      <select
        value={selectedGroupId}
        onChange={e => setSelectedGroupId(e.target.value)}
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontSize:13, fontFamily:'inherit', outline:'none' }}>
        <option value="">No group</option>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      {selectedGroupId && (() => {
        const g = groups.find(x => x.id === selectedGroupId)
        return g ? (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6,
            marginTop:6, padding:'3px 10px',
            background: g.color + '20', border:`1px solid ${g.color}40`,
            borderRadius:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:g.color }}/>
            <span style={{ fontSize:11, fontWeight:700, color:g.color }}>{g.name}</span>
          </div>
        ) : null
      })()}
    </div>
  </div>

</div>

      {/* ── Section: Contact ── */}
<div style={{ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:12, padding:20, marginBottom:16 }}>
  <div style={{ fontSize:12, fontWeight:700, color:C.t3,
    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
    Contact
  </div>
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
    {field('Email Address', 'defaultEmail',
      { type:'email', placeholder:'hello@urbaneatsmcl.com.au' })}
    {field('ABN', 'abn',
      { placeholder:'e.g. 51 824 753 556',
        hint:'11 digits — spaces allowed',
        mono: true })}
  </div>
</div>

      {/* ── Section: Regional ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Regional
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Country */}
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.06em',
              display:'block', marginBottom:5 }}>Country</label>
            <select value={form.country || ''}
              onChange={e => set('country', e.target.value)}
              style={{ width:'100%', padding:'9px 11px', background:C.input,
                border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                fontSize:13, fontFamily:'inherit', outline:'none' }}>
              <option value="">Select country…</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.06em',
              display:'block', marginBottom:5 }}>Timezone</label>
            <select value={form.timezone || ''}
              onChange={e => set('timezone', e.target.value)}
              style={{ width:'100%', padding:'9px 11px', background:C.input,
                border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                fontSize:13, fontFamily:'inherit', outline:'none' }}>
              <option value="">Select timezone…</option>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section: Search Indexing ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
          Search Indexing
        </div>
        <div style={{ fontSize:13, color:C.t2, marginBottom:14 }}>
          Controls whether search engines like Google can index this site.
          Keep blocked until the site is live.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={() => set('indexing', 'blocked')}
            style={{ padding:'9px 20px', borderRadius:8, fontSize:13,
              fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              border:`2px solid ${form.indexing !== 'allowed' ? '#EF4444' : C.border}`,
              background: form.indexing !== 'allowed' ? '#1A0505' : 'transparent',
              color: form.indexing !== 'allowed' ? '#EF4444' : C.t3 }}>
            🚫 Blocked {form.indexing !== 'allowed' && '✓'}
          </button>
          <button
            onClick={() => set('indexing', 'allowed')}
            style={{ padding:'9px 20px', borderRadius:8, fontSize:13,
              fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              border:`2px solid ${form.indexing === 'allowed' ? C.green : C.border}`,
              background: form.indexing === 'allowed' ? '#052010' : 'transparent',
              color: form.indexing === 'allowed' ? C.green : C.t3 }}>
            ✅ Allowed {form.indexing === 'allowed' && '✓'}
          </button>
        </div>
        {form.indexing === 'allowed' && (
          <div style={{ marginTop:10, padding:'8px 12px',
            background:'#1A1000', border:'1px solid #F59E0B40',
            borderRadius:7, fontSize:12, color:'#F59E0B' }}>
            ⚠️ Make sure the site is fully live before allowing indexing.
          </div>
        )}
      </div>

      {/* ── Save ── */}
<div style={{ display:'flex', alignItems:'center', gap:12 }}>
  <button
    onClick={handleSave}
    disabled={mutation.isPending}
    style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
      border:'none', borderRadius:8, color:'#fff', fontWeight:700,
      fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
      fontFamily:'inherit', boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
    {mutation.isPending ? 'Saving…' : 'Save Changes'}
  </button>
  {mutation.isSuccess && (
    <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>
  )}
  {Object.keys(errors).length > 0 && (
    <span style={{ fontSize:13, color:'#EF4444' }}>
      ⚠️ Fix the errors above before saving
    </span>
  )}
</div>
    </div>
  )
}

// ── Site Notes ───────────────────────────────────────────────
// ── Editor CSS ───────────────────────────────────────────────
const editorCSS = `
  .tiptap { outline:none; text-align:left; }
  .tiptap p { margin:0 0 8px; text-align:left; }
  .tiptap h2 { font-size:16px; font-weight:700; margin:12px 0 6px; color:#F1F5FF; }
  .tiptap h3 { font-size:14px; font-weight:700; margin:10px 0 4px; color:#B8C5E0; }
  .tiptap ul, .tiptap ol { padding-left:20px; margin:6px 0; }
  .tiptap li { margin:2px 0; }
  .tiptap a { color:#00D4FF; text-decoration:underline; cursor:pointer; }
  .tiptap code { background:#1F2D4A; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:12px; }
  .tiptap pre { background:#1F2D4A; padding:12px; border-radius:8px; overflow-x:auto; }
  .tiptap img { max-width:100%; border-radius:6px; margin:8px 0; display:block; }
  .tiptap p.is-editor-empty:first-child::before { content:attr(data-placeholder); float:left; color:#445572; pointer-events:none; height:0; }
  .note-drop-active { border-color:#FF6B2B !important; background:#2A1200 !important; }
  .source-textarea { width:100%; min-height:200px; padding:14px 16px; background:#0A0F1A; border:none; border-radius:0 0 9px 9px; color:#00D4FF; font-family:'Fira Code',monospace; font-size:12px; line-height:1.7; outline:none; resize:vertical; box-sizing:border-box; }
`

// ── Link Modal ───────────────────────────────────────────────
function LinkModal({ onConfirm, onClose, initial='' }) {
  const [url, setUrl] = useState(initial)
  return (
    <div style={{ position:'fixed', inset:0, zIndex:700,
      background:'rgba(0,0,0,0.75)', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#0E1420', border:'1px solid #1E2D4A',
        borderRadius:12, padding:24, width:400,
        boxShadow:'0 24px 60px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#F1F5FF', marginBottom:14 }}>
          Insert Link
        </div>
        <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') onConfirm(url); if(e.key==='Escape') onClose() }}
          placeholder="https://example.com"
          style={{ width:'100%', padding:'9px 11px', background:'#111827',
            border:'1px solid #1E2D4A', borderRadius:7, color:'#F1F5FF',
            fontSize:13, fontFamily:'inherit', outline:'none',
            boxSizing:'border-box', marginBottom:14 }}/>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          {initial && (
            <button onClick={() => onConfirm('')}
              style={{ padding:'7px 14px', background:'transparent',
                border:'1px solid #EF444440', borderRadius:7,
                color:'#EF4444', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              Remove
            </button>
          )}
          <button onClick={onClose}
            style={{ padding:'7px 14px', background:'transparent',
              border:'1px solid #1E2D4A', borderRadius:7,
              color:'#7A8BAD', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(url)}
            style={{ padding:'7px 16px', background:'#FF6B2B', border:'none',
              borderRadius:7, color:'#fff', fontWeight:700, fontSize:12,
              cursor:'pointer', fontFamily:'inherit' }}>
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Image Modal ──────────────────────────────────────────────
function ImageModal({ onInsertUrl, onInsertFile, onClose }) {
  const [url,      setUrl]      = useState('')
  const [preview,  setPreview]  = useState(null)
  const [dragging, setDragging] = useState(false)
  const [pending,  setPending]  = useState(null) // { file, localUrl } waiting for Insert

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setPending({ file, localUrl })
    setUrl('')
  }

  const handleInsert = () => {
    if (pending) {
      onInsertFile(pending.file, pending.localUrl)
    } else if (url.trim()) {
      onInsertUrl(url.trim())
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700,
      background:'rgba(0,0,0,0.75)', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0E1420', border:'1px solid #1E2D4A',
        borderRadius:14, padding:24, width:460,
        boxShadow:'0 24px 60px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#F1F5FF', marginBottom:18 }}>
          Insert Image
        </div>

        {/* Preview area */}
        {preview && (
          <div style={{ marginBottom:16, position:'relative' }}>
            <img src={preview} alt="preview"
              style={{ width:'100%', maxHeight:160, objectFit:'contain',
                borderRadius:8, border:'1px solid #1E2D4A', background:'#111827' }}/>
            <button onClick={() => { setPreview(null); setPending(null) }}
              style={{ position:'absolute', top:6, right:6, width:24, height:24,
                borderRadius:'50%', background:'#EF4444', border:'none',
                color:'#fff', cursor:'pointer', fontSize:12, lineHeight:1 }}>
              ✕
            </button>
          </div>
        )}

        {/* URL input */}
        {!pending && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#445572',
              textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Paste image URL
            </div>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleInsert()}
              placeholder="https://example.com/image.jpg"
              style={{ width:'100%', padding:'9px 11px', background:'#111827',
                border:'1px solid #1E2D4A', borderRadius:7, color:'#F1F5FF',
                fontSize:13, fontFamily:'inherit', outline:'none',
                boxSizing:'border-box', marginBottom:14 }}/>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:'#1E2D4A' }}/>
              <span style={{ fontSize:11, color:'#445572' }}>or upload</span>
              <div style={{ flex:1, height:1, background:'#1E2D4A' }}/>
            </div>
          </>
        )}

        {/* Drop zone */}
        {!pending && (
          <div
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.multiple = true
              input.onchange = (e) => {
                // Handle multiple — insert each one
                Array.from(e.target.files).forEach(f => handleFileSelect(f))
              }
              input.click()
            }}
            onDrop={e => {
              e.preventDefault(); setDragging(false)
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
              if (files.length > 0) handleFileSelect(files[0])
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            style={{ border:`2px dashed ${dragging ? '#FF6B2B' : '#2A3F63'}`,
              borderRadius:10, padding:'20px', textAlign:'center',
              cursor:'pointer', background: dragging ? '#2A1200' : '#141C2E',
              transition:'all 0.15s', marginBottom:16 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
            <div style={{ fontSize:13, color:'#7A8BAD' }}>
              Click to select or drag & drop
            </div>
            <div style={{ fontSize:11, color:'#445572', marginTop:3 }}>
              PNG, JPG, WEBP
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ padding:'8px 16px', background:'transparent',
              border:'1px solid #1E2D4A', borderRadius:7,
              color:'#7A8BAD', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!pending && !url.trim()}
            style={{ padding:'8px 20px', background: (!pending && !url.trim()) ? '#1F2D4A' : '#FF6B2B',
              border:'none', borderRadius:7, color:'#fff', fontWeight:700,
              fontSize:13, cursor: (!pending && !url.trim()) ? 'not-allowed' : 'pointer',
              fontFamily:'inherit' }}>
            Insert Image
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toolbar ──────────────────────────────────────────────────
function NoteToolbar({ editor, onLinkClick, onImageClick, sourceMode, onToggleSource }) {
  if (!editor && !sourceMode) return null

  const btn = (active, onClick, label, title='') => (
    <button key={label}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title || label}
      style={{ padding:'4px 8px', borderRadius:5, border:'none',
        background: active ? '#1F2D4A' : 'transparent',
        color: active ? '#FF6B2B' : '#7A8BAD',
        cursor:'pointer', fontSize:13, fontWeight:600 }}
      onMouseEnter={e => e.currentTarget.style.background='#1F2D4A'}
      onMouseLeave={e => e.currentTarget.style.background=active?'#1F2D4A':'transparent'}>
      {label}
    </button>
  )

  const sep = <div style={{ width:1, height:18, background:'#1E2D4A', margin:'0 4px', flexShrink:0 }}/>

  // Source mode — show minimal toolbar
  if (sourceMode) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:2,
        padding:'6px 10px', background:'#141C2E',
        borderBottom:'1px solid #1E2D4A', borderRadius:'9px 9px 0 0' }}>
        <span style={{ fontSize:11, color:'#445572', marginRight:8 }}>
          Source Code
        </span>
        <div style={{ marginLeft:'auto' }}>
          {btn(true, onToggleSource, '</>', 'Toggle source code')}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:2,
      padding:'6px 10px', background:'#141C2E',
      borderBottom:'1px solid #1E2D4A', borderRadius:'9px 9px 0 0' }}>
      {btn(editor.isActive('bold'),      () => editor.chain().focus().toggleBold().run(),      'B')}
      {btn(editor.isActive('italic'),    () => editor.chain().focus().toggleItalic().run(),    'I')}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
      {btn(editor.isActive('strike'),    () => editor.chain().focus().toggleStrike().run(),    'S')}
      {sep}
      {btn(editor.isActive('heading',{level:2}), () => editor.chain().focus().toggleHeading({level:2}).run(), 'H2')}
      {btn(editor.isActive('heading',{level:3}), () => editor.chain().focus().toggleHeading({level:3}).run(), 'H3')}
      {sep}
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  '• List')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. List')}
      {sep}
      {btn(editor.isActive({textAlign:'left'}),   () => editor.chain().focus().setTextAlign('left').run(),   '⬅')}
      {btn(editor.isActive({textAlign:'center'}),  () => editor.chain().focus().setTextAlign('center').run(), '⬛')}
      {btn(editor.isActive({textAlign:'right'}),   () => editor.chain().focus().setTextAlign('right').run(),  '➡')}
      {sep}
      {btn(editor.isActive('link'),  () => onLinkClick(editor),  '🔗 Link')}
      {btn(false,                    () => onImageClick(editor), '🖼 Image')}
      {sep}
      <div style={{ marginLeft:'auto', display:'flex', gap:2 }}>
        {btn(false, () => editor.chain().focus().undo().run(), '↩', 'Undo')}
        {btn(false, () => editor.chain().focus().redo().run(), '↪', 'Redo')}
        {sep}
        {btn(false, onToggleSource, '</>', 'Toggle source code')}
      </div>
    </div>
  )
}

// ── Rich Editor Block (reusable for general + operational) ───
function RichEditorBlock({ label, hint, editor, onLinkClick, onImageClick }) {
  const [sourceMode,  setSourceMode]  = useState(false)
  const [sourceValue, setSourceValue] = useState('')

  const enterSource = () => {
    setSourceValue(editor?.getHTML() || '')
    setSourceMode(true)
  }

  const exitSource = () => {
    editor?.commands.setContent(sourceValue, false)
    setSourceMode(false)
  }

  const handleSourceChange = (e) => {
    setSourceValue(e.target.value)
  }

  return (
    <div style={{ background:'#141C2E', border:'1px solid #1E2D4A',
      borderRadius:12, padding:20, marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#445572',
        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize:12, color:'#445572', marginBottom:12 }}>{hint}</div>
      )}

      <NoteToolbar
        editor={editor}
        onLinkClick={onLinkClick}
        onImageClick={onImageClick}
        sourceMode={sourceMode}
        onToggleSource={sourceMode ? exitSource : enterSource}
      />

      {sourceMode ? (
        <textarea
          className="source-textarea"
          value={sourceValue}
          onChange={handleSourceChange}
          spellCheck={false}
        />
      ) : (
        <div
          style={{ minHeight:200, padding:'14px 16px', background:'#111827',
            border:'1px solid #1E2D4A', borderTop:'none',
            borderRadius:'0 0 9px 9px', color:'#F1F5FF',
            fontSize:13, lineHeight:1.7, outline:'none', cursor:'text',
            transition:'border-color 0.15s' }}
          onClick={() => editor?.commands.focus()}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('note-drop-active')
            const file = e.dataTransfer.files[0]
            if (file?.type.startsWith('image/')) onImageClick(editor, file)
          }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('note-drop-active') }}
          onDragLeave={e => e.currentTarget.classList.remove('note-drop-active')}>
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}

// ── Site Notes ───────────────────────────────────────────────
function SiteNotes({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [linkModal,  setLinkModal]  = useState(null)
  const [imageModal, setImageModal] = useState(null) // { editor, dropFile? }

  const makeExtensions = (placeholder) => [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading','paragraph'] }),
    Link.configure({ openOnClick: false }),
    Image,
    Placeholder.configure({ placeholder }),
  ]

  const generalEditor = useEditor({
    extensions: makeExtensions('Add general notes — analytics IDs, scripts, developer contacts…'),
    content: config.notes?.general || '',
    editorProps: { attributes: { style:'text-align:left' } }
  })

  const stockEditor = useEditor({
    extensions: makeExtensions('Add operational notes…'),
    content: config.notes?.stock || '',
    editorProps: { attributes: { style:'text-align:left' } }
  })

  // Sync when config loads from server
  useEffect(() => {
    if (generalEditor && config.notes?.general !== undefined)
      generalEditor.commands.setContent(config.notes.general || '', false)
  }, [config.notes?.general])

  useEffect(() => {
    if (stockEditor && config.notes?.stock !== undefined)
      stockEditor.commands.setContent(config.notes.stock || '', false)
  }, [config.notes?.stock])

  // Track unsaved changes
  useEffect(() => {
    if (!generalEditor || !stockEditor) return
    const update = () => {
      const general = generalEditor.getHTML()
      const stock = stockEditor.getHTML()
      const saved = config.notes || {}
      const hasChanges = general !== (saved.general || '') || stock !== (saved.stock || '')
      setHasUnsavedChanges(hasChanges)
    }
    generalEditor.on('update', update)
    stockEditor.on('update', update)
    return () => {
      generalEditor.off('update', update)
      stockEditor.off('update', update)
    }
  }, [config.notes, setHasUnsavedChanges])

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      notes: {
        general: generalEditor?.getHTML() || '',
        stock:   stockEditor?.getHTML()   || '',
      }
    }),
    onSuccess: (data) => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
      // Update editors with saved data
      if (data?.notes) {
        generalEditor?.commands.setContent(data.notes.general || '')
        stockEditor?.commands.setContent(data.notes.stock || '')
      }
    }
  })

  // Insert image into editor — show preview in modal first, then insert on confirm
  const handleLinkClick = (editor) => {
    setLinkModal({ editor, initial: editor.getAttributes('link').href || '' })
  }

  const handleImageClick = (editor, dropFile = null) => {
    setImageModal({ editor, dropFile })
  }

  // Called when user confirms image in modal
  const handleImageInsertUrl = (url) => {
    imageModal?.editor.chain().focus().setImage({ src: url }).run()
    setImageModal(null)
  }

  const handleImageInsertFile = async (file, localUrl) => {
    const editor = imageModal?.editor
    setImageModal(null)
    // Insert local preview immediately so user sees it
    editor?.chain().focus().setImage({ src: localUrl }).run()

    // Upload to storage in background and replace src when done
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('dd_token')
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      })
      const data = await res.json()
      if (data.url) {
        // Replace the local blob URL with the real URL in the HTML
        const current = editor?.getHTML() || ''
        const updated = current.replace(localUrl, data.url)
        editor?.commands.setContent(updated, false)
        console.log(`✅ Image uploaded: ${data.storage === 'local' ? 'Local storage' : 'R2'}`)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err) {
      // Show error but keep local preview
      console.error('Image upload failed:', err.message)
      // Don't replace the local URL - it will show as broken but that's better than nothing
    }
  }

  return (
    <div>
      <style>{editorCSS}</style>

      {linkModal && (
        <LinkModal
          initial={linkModal.initial}
          onConfirm={(url) => {
            const { editor } = linkModal
            if (!url) editor.chain().focus().unsetLink().run()
            else editor.chain().focus().setLink({ href: url }).run()
            setLinkModal(null)
          }}
          onClose={() => setLinkModal(null)}
        />
      )}

      {imageModal && (
        <ImageModal
          onInsertUrl={handleImageInsertUrl}
          onInsertFile={handleImageInsertFile}
          onClose={() => setImageModal(null)}
        />
      )}

      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:'#F1F5FF' }}>
        Site Notes
      </h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:'#445572' }}>
        Internal notes only — not visible on the live site.
      </p>

      <RichEditorBlock
        label="General Notes"
        hint="Analytics IDs, scripts, developer contacts, migration history, credentials."
        editor={generalEditor}
        onLinkClick={handleLinkClick}
        onImageClick={handleImageClick}
      />

      <RichEditorBlock
        label="Operational Notes"
        hint="Menu setup, stock notes, special instructions from the client."
        editor={stockEditor}
        onLinkClick={handleLinkClick}
        onImageClick={handleImageClick}
      />

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ padding:'10px 28px',
            background: mutation.isPending ? '#141C2E' : '#FF6B2B',
            border:'none', borderRadius:8, color:'#fff', fontWeight:700,
            fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily:'inherit',
            boxShadow: mutation.isPending ? 'none' : '0 4px 16px #FF6B2B50' }}>
          {mutation.isPending ? 'Saving…' : 'Save Notes'}
        </button>
        {mutation.isSuccess && (
          <span style={{ fontSize:13, color:'#22C55E', fontWeight:600 }}>✅ Saved</span>
        )}
      </div>
    </div>
  )
}


//-------Analytics Config ─────────────────────────────────────────────
function AnalyticsConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [form,   setForm]   = useState(config.analytics || {})
  const [errors, setErrors] = useState({})
  const savedFormRef = useRef(config.analytics || {})

  useEffect(() => { 
    setForm(config.analytics || {})
    savedFormRef.current = config.analytics || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFormRef.current
    const hasChanges = JSON.stringify(form) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [form, setHasUnsavedChanges])

  const set = (k, v) => {
    setForm(p => ({...p, [k]: v}))
    setErrors(p => ({...p, [k]: ''}))
  }

  const validate = () => {
    const e = {}
    if (form.ga4MeasurementId && !/^G-[A-Z0-9]+$/.test(form.ga4MeasurementId.trim()))
      e.ga4MeasurementId = 'Format: G-XXXXXXXXXX'
    if (form.gtmId && !/^GTM-[A-Z0-9]+$/.test(form.gtmId.trim()))
      e.gtmId = 'Format: GTM-XXXXXXX'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { analytics: form }),
    onSuccess:  () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
    }
  })

  const handleSave = () => { if (validate()) mutation.mutate() }
  const handleKey  = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'SELECT') {
      e.preventDefault(); handleSave()
    }
  }

  const fields = [
    { key:'ga4MeasurementId',    label:'GA4 Measurement ID',           placeholder:'G-XXXXXXXXXX',          hint:'Goes in the site <head> — enables pageview tracking' },
    { key:'ga4PropertyId',       label:'GA4 Property ID',              placeholder:'e.g. 458846477',        hint:'From GA4 Admin → Property Settings — needed for the Dashboard' },
    { key:'gtmId',               label:'GTM Container ID',             placeholder:'GTM-XXXXXXX',           hint:'Google Tag Manager — use instead of GA4 if tags are managed in GTM' },
    { key:'googleVerification',  label:'Google Site Verification Code',placeholder:'e.g. abc123xyz...',     hint:'Search Console → Settings → Ownership verification → copy content="" value only' },
    { key:'fbPixelId',           label:'Facebook Pixel ID',            placeholder:'e.g. 1234567890123',    hint:'From Meta Events Manager — tracks visitors for ad retargeting' },
    { key:'fbDomainVerification',label:'Facebook Domain Verification', placeholder:'e.g. abc123xyz...',     hint:'Meta Business → Brand Safety → Domains → copy content="" value only' },
  ]

  return (
    <div onKeyDown={handleKey}>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Analytics
      </h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:C.t3 }}>
        Tracking and verification codes for this restaurant site.
      </p>

      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {fields.map(({ key, label, placeholder, hint }) => {
            const hasError = !!errors[key]
            return (
              <div key={key}>
                <label style={{ fontSize:11, fontWeight:700,
                  color: hasError ? '#EF4444' : C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  display:'block', marginBottom:5 }}>
                  {label}
                </label>
                <input
                  value={form[key] || ''}
                  onChange={e => set(key, e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={placeholder}
                  style={{ width:'100%', padding:'9px 11px', background:C.input,
                    border:`1px solid ${hasError ? '#EF4444' : C.border}`,
                    borderRadius:7, color:C.t0, fontSize:13,
                    fontFamily:"'Fira Code',monospace",
                    outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = hasError ? '#EF4444' : C.acc}
                  onBlur={e  => e.target.style.borderColor = hasError ? '#EF4444' : C.border}
                />
                {hasError
                  ? <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠️ {errors[key]}</div>
                  : <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{hint}</div>
                }
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          style={{ padding:'10px 28px',
            background: mutation.isPending ? C.card : C.acc,
            border:'none', borderRadius:8, color:'#fff', fontWeight:700,
            fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily:'inherit',
            boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {mutation.isSuccess && (
          <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>
        )}
        {Object.keys(errors).length > 0 && (
          <span style={{ fontSize:13, color:'#EF4444' }}>Fix the errors above</span>
        )}
      </div>
    </div>
  )
}

// ── Branding Upload Field ────────────────────────────────────
function BrandUpload({ clientId, label, hint, accept='image/*', value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const [error,     setError]     = useState('')
  const [progress,  setProgress]  = useState(0)

  const upload = async (file) => {
    if (!file) return
    setUploading(true); setError(''); setProgress(0)
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large — max 5MB')
      setUploading(false)
      return
    }
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type — use PNG, JPG, WEBP, or SVG')
      setUploading(false)
      return
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setProgress(30)
      const res = await fetch(`${API_URL}/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') },
        body: formData
      })
      
      setProgress(70)
      const data = await res.json()
      
      if (!res.ok) {
        // Show detailed error from server
        throw new Error(data.details || data.error || 'Upload failed')
      }
      
      if (data.url) {
        setProgress(100)
        onChange(data.url)
        // Show which storage was used
        if (data.storage === 'local') {
          console.log('✅ Image saved locally — configure R2 for production')
        } else {
          console.log('✅ Image uploaded to R2')
        }
      } else {
        throw new Error('No URL returned from server')
      }
    } catch (err) {
      const errorMsg = err.message || 'Upload failed'
      if (errorMsg.includes('R2')) {
        setError('R2 storage not configured — image saved locally')
      } else if (errorMsg.includes('permission')) {
        setError('Permission denied — check R2 bucket settings')
      } else if (errorMsg.includes('credentials')) {
        setError('Invalid R2 credentials — check API keys')
      } else {
        setError(errorMsg)
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const openPicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = e => upload(e.target.files[0])
    input.click()
  }

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`,
      borderRadius:12, overflow:'hidden', marginBottom:16 }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.t0 }}>{label}</div>
        <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>{hint}</div>
      </div>

      {/* Current image */}
      {value && (
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:80, height:48, background:'#1A2540',
            borderRadius:6, display:'flex', alignItems:'center',
            justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <img src={value} alt={label}
              style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:C.cyan, fontFamily:'monospace',
              wordBreak:'break-all', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {value}
            </div>
          </div>
          <button onClick={() => onChange('')}
            style={{ padding:'5px 12px', background:'transparent',
              border:'1px solid #EF444440', borderRadius:6,
              color:'#EF4444', fontSize:12, cursor:'pointer',
              fontFamily:'inherit', flexShrink:0 }}>
            Remove
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && openPicker()}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          if (!uploading) upload(e.dataTransfer.files[0])
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        style={{ padding:'20px 18px', display:'flex', alignItems:'center',
          gap:14, cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragging ? '#2A1200' : 'transparent',
          borderTop: value ? `1px solid ${C.border}` : 'none',
          transition:'background 0.15s' }}>
        <div style={{ width:44, height:44, borderRadius:8,
          background: dragging ? C.acc+'30' : C.hover,
          border:`1px dashed ${dragging ? C.acc : C.border2}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, flexShrink:0, transition:'all 0.15s' }}>
          {uploading ? '⏳' : '↑'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, color: dragging ? C.acc : C.t1, fontWeight:600 }}>
            {uploading ? `Uploading… ${progress}%` : value ? 'Replace image' : 'Click to upload or drag & drop'}
          </div>
          <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>
            {accept === '.svg' ? 'SVG only' : 'PNG, JPG, WEBP, SVG — max 5MB'}
          </div>
          {/* Progress bar */}
          {uploading && (
            <div style={{ marginTop:8, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
              <div style={{ 
                width:`${progress}%`, 
                height:'100%', 
                background:C.acc,
                transition:'width 0.3s' 
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ padding:'10px 18px', background:'#1A0505',
          borderTop:'1px solid #EF444430',
          fontSize:12, color:'#EF4444', display:'flex', alignItems:'center', gap:8 }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            style={{ marginLeft:'auto', background:'none', border:'none', color:'#EF4444', cursor:'pointer', padding:4 }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ── Branding Config ──────────────────────────────────────────
function BrandingConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(config.settings || {})
  const savedFormRef = useRef(config.settings || {})

  useEffect(() => { 
    setForm(config.settings || {})
    savedFormRef.current = config.settings || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFormRef.current
    const hasChanges = JSON.stringify(form) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [form, setHasUnsavedChanges])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { settings: form }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
    },
    onError: (err) => {
      console.error('Branding save failed:', err)
      console.error('Error details:', err.response?.data)
      
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
      alert(`Save failed: ${errorMsg}\n\nPlease try again.`)
    }
})

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Site Branding
      </h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:C.t3 }}>
        Logos and icons used across the restaurant website.
      </p>

      {/* ── Display Name ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Display Name
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:C.t3,
            textTransform:'uppercase', letterSpacing:'0.06em',
            display:'block', marginBottom:5 }}>
            Website Header Name
          </label>
          <input
            value={form.displayName || ''}
            onChange={e => set('displayName', e.target.value)}
            placeholder="e.g. Urban Eats Melbourne"
            style={{ width:'100%', padding:'9px 11px', background:C.input,
              border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
              fontSize:13, fontFamily:'inherit', outline:'none',
              boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor = C.acc}
            onBlur={e  => e.target.style.borderColor = C.border}
          />
          <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>
            Shown in the website header if no logo is uploaded
          </div>
        </div>
      </div>

      {/* ── Logos ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Logos
        </div>

        <BrandUpload
          clientId={clientId}
          label="Header Logo — Light"
          hint="Used on light-coloured headers. Dark version of the logo."
          value={form.logoLight || ''}
          onChange={v => set('logoLight', v)}
        />

        <BrandUpload
          clientId={clientId}
          label="Header Logo — Dark"
          hint="Used on dark-coloured headers. White or light version of the logo."
          value={form.logoDark || ''}
          onChange={v => set('logoDark', v)}
        />
      </div>

      {/* ── Icons ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Icons
        </div>

        <BrandUpload
          clientId={clientId}
          label="Favicon"
          hint="Browser tab icon. PNG recommended — 32×32px or 64×64px."
          value={form.favicon || ''}
          onChange={v => set('favicon', v)}
        />

        <BrandUpload
          clientId={clientId}
          label="Map Marker"
          hint="Custom pin shown on maps. PNG with transparent background — 188×260px ideal. The point of the pin should be at the bottom centre."
          value={form.mapMarker || ''}
          onChange={v => set('mapMarker', v)}
        />
      </div>

      {/* ── Save ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ padding:'10px 28px',
            background: mutation.isPending ? C.card : C.acc,
            border:'none', borderRadius:8, color:'#fff', fontWeight:700,
            fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily:'inherit',
            boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {mutation.isSuccess && (
          <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>
        )}
      </div>
    </div>
  )
}

// ── Shortcodes Config ───────────────────────────────────────
function ShortcodesConfig({ clientId, config, client, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [form,      setForm]      = useState({})
  const [overrides, setOverrides] = useState({})
  const [groups,    setGroups]    = useState([])
  const [locations, setLocations] = useState([])
  const [autoValues, setAutoValues] = useState({})
  const savedOverridesRef = useRef({})

  useEffect(() => {
    if (!clientId) return
    const token = localStorage.getItem('dd_token')
    const h = { Authorization: 'Bearer ' + token }
    fetch(`${API_URL}/groups`, { headers: h })
      .then(r => r.json()).then(d => setGroups(Array.isArray(d) ? d : [])).catch(() => {})
    fetch(`${API_URL}/clients/${clientId}/locations`, { headers: h })
      .then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : [])).catch(() => {})
  }, [clientId])

  useEffect(() => {
    if (!groups.length && !locations.length && !config.settings) return
    
    const settings  = config.settings  || {}
    const savedOver = config.shortcodes?._overrides || {}

    // Group — read from client.groupId directly
    const group   = groups.find(g => g.id === client?.groupId)

    // Primary location
    const primary = locations.find(l => l.isPrimary) || locations[0]

    const auto = {
      restaurantName: settings.displayName    || settings.restaurantName || '',
      group:          group?.name             || '',
      address:        primary?.address        || '',
      suburb:         primary?.suburb         || settings.suburb || '',
      state:          primary?.state          || '', 
      phone:          primary?.phone          || settings.phone || '',
      primaryEmail:   settings.defaultEmail   || '',
      custom:         '',
    }

    setAutoValues(auto)
    setForm({ ...auto, ...savedOver })
    setOverrides(savedOver)
    savedOverridesRef.current = savedOver
    setHasUnsavedChanges(false)
  }, [config, groups, locations, client, setHasUnsavedChanges])

  // Track unsaved changes
  useEffect(() => {
    const saved = savedOverridesRef.current
    const hasChanges = JSON.stringify(overrides) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [overrides, setHasUnsavedChanges])

  const handleChange = (key, value) => {
    setForm(p    => ({...p,    [key]: value}))
    setOverrides(p => ({...p, [key]: value}))
  }

  const clearOverride = (key) => {
    const newOver = { ...overrides }
    delete newOver[key]
    setOverrides(newOver)

    // Recalculate auto for this key only
    const settings = config.settings || {}
    const group    = groups.find(g => g.id === client?.groupId)
    const primary  = locations.find(l => l.isPrimary) || locations[0]
    const auto = {
      restaurantName: settings.displayName  || settings.restaurantName || '',
      group:          group?.name           || '',
      address:        primary?.address      || '',
      suburb:         primary?.suburb       || settings.suburb || '',
      state:          primary?.state        || '',
      phone:          primary?.phone        || settings.phone || '',
      primaryEmail:   settings.defaultEmail || '',
      custom:         '',
    }
    setForm(p => ({...p, [key]: auto[key] || ''}))
  }

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      shortcodes: { ...form, _overrides: overrides }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          }
  })

  const codes = [
    { key:'restaurantName', label:'Restaurant Name', source:'Site Settings → Display Name'    },
    { key:'group',          label:'Group',           source:'Group assigned in Site Settings'  },
    { key:'address',        label:'Address',         source:'Locations → Primary location'    },
    { key:'suburb',         label:'Suburb',          source:'Locations → Primary location'    },
    { key:'state',          label:'State',           source:'Locations → Primary location'    },
    { key:'phone',          label:'Phone',           source:'Locations → Primary location'    },
    { key:'primaryEmail',   label:'Email',           source:'Site Settings → Email'            },
    { key:'custom',         label:'Custom',          source:'Custom code or text'              },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Shortcodes
      </h2>
      <p style={{ margin:'0 0 8px', fontSize:13, color:C.t3 }}>
        Use these in content fields — replaced with real values on the live site.
      </p>

      <div style={{ background:C.card, borderLeft:`3px solid ${C.cyan}`,
        padding:'9px 14px', borderRadius:'0 7px 7px 0',
        fontSize:12, color:C.t2, marginBottom:20 }}>
        Values are auto-pulled from Site Settings and Locations. Type to override — click{' '}
        <span style={{ color:C.acc, fontWeight:700 }}>Reset</span> to restore the auto value.
        Use <span style={{ color:C.amber, fontFamily:'monospace' }}>{'{{shortcode}}'}</span> in
        any content field — replaced with real values on the live site.
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, overflow:'hidden', marginBottom:24 }}>

        {/* Header row */}
        <div style={{ display:'grid', gridTemplateColumns:'160px 220px 1fr 70px',
          padding:'8px 16px', background:'#0A0F1A',
          borderBottom:`1px solid ${C.border}`,
          fontSize:11, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.05em' }}>
          <span>Shortcode</span>
          <span>Source Data</span>
          <span>Actual Value (Edit to Override)</span>
          <span></span>
        </div>

        {codes.map((c, i) => {
          const isOverridden = overrides[c.key] !== undefined
          const autoVal = autoValues[c.key] || ''
          
          return (
            <div key={c.key}
              style={{ display:'grid', gridTemplateColumns:'160px 220px 1fr 70px',
                padding:'10px 16px', alignItems:'center',
                borderBottom: i < codes.length-1 ? `1px solid ${C.border}20` : 'none',
                background: isOverridden ? '#1A2540' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = isOverridden ? '#1A2540' : C.hover}
              onMouseLeave={e => e.currentTarget.style.background = isOverridden ? '#1A2540' : 'transparent'}>

              <span style={{ fontSize:12, color:C.amber, fontFamily:'monospace',
                background:C.card, border:`1px solid ${C.border2}`,
                borderRadius:4, padding:'3px 8px', display:'inline-block' }}>
                {`{{${c.key}}}`}
              </span>

              <span style={{ fontSize:10, color:C.t4, textTransform:'uppercase', letterSpacing:'0.02em' }}>
                {c.source}
              </span>

              <div style={{ position:'relative' }}>
                <input
                  value={form[c.key] || ''}
                  onChange={e => handleChange(c.key, e.target.value)}
                  placeholder={autoVal ? `Auto: ${autoVal}` : `Pulled from: ${c.source}`}
                  style={{ padding:'7px 10px', fontSize:13, background:C.input,
                    border:`1px solid ${isOverridden ? C.acc+'60' : C.border}`,
                    borderRadius:7,
                    color: isOverridden ? C.t0 : C.t1,
                    fontFamily:'inherit', outline:'none',
                    width:'100%', boxSizing:'border-box' }}
                  onFocus={e => { e.target.style.borderColor = C.acc }}
                  onBlur={e  => e.target.style.borderColor = isOverridden ? C.acc+'60' : C.border}
                />
              </div>

              <div style={{ display:'flex', justifyContent:'center' }}>
                {isOverridden && (
                  <button onClick={() => clearOverride(c.key)}
                    style={{ padding:'4px 10px', background:'transparent',
                      border:`1px solid ${C.border2}`, borderRadius:5,
                      color:C.t2, fontSize:11, cursor:'pointer',
                      fontFamily:'inherit' }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ padding:'10px 28px',
            background: mutation.isPending ? C.card : C.acc,
            border:'none', borderRadius:8, color:'#fff', fontWeight:700,
            fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontFamily:'inherit',
            boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
          {mutation.isPending ? 'Saving…' : 'Save Shortcodes'}
        </button>
        {mutation.isSuccess && (
          <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>
        )}
      </div>
    </div>
  )
}

// ── Theme System ───────────────────────────────────────────
// Generic theme system - themes can be added without core logic changes
const THEMES = [
  {
    key:   'theme-d1',
    label: 'Modern Restaurant (D1)',
    target: 'Full-service restaurants, Cafes, Fine dining',
    sellAngle: 'Clean, modern, and highly configurable',
    style: 'Modern layout with focus on imagery and clear CTAs',
    features: ['Utility belt', 'Dynamic sections', 'Reviews carousel', 'Responsive header'],
    hasSeparateNav: false, // Combined header and navigation
    defaults: { primary:'#C8823A', secondary:'#1C2B1A', headerBg:'#ffffff',
                headerText:'#1A1A1A', navBg:'#1C2B1A', navText:'#ffffff',
                bodyBg:'#ffffff', bodyText:'#1A1A1A',
                ctaBg:'#C8823A', ctaText:'#ffffff', accentBg:'#F7F2EA',
                utilityBeltBg:'#C8823A', utilityBeltText:'#ffffff' }
  },
  {
    key:   'theme-v2',
    label: 'Classic Bistro',
    target: 'Traditional venues',
    sellAngle: 'Timeless and elegant',
    style: 'Classic layout with separate header and navigation',
    features: ['Separate header and navigation'],
    hasSeparateNav: true, // Separate header and navigation
    comingSoon: true,
    defaults: { primary:'#D4AF37', secondary:'#0A0A0A' }
  },
  {
    key:   'theme-v3',
    label: 'Urban Minimal',
    target: 'Trendy spots',
    sellAngle: 'Sleek and modern',
    style: 'Minimalist layout with separate header and navigation',
    features: ['Separate header and navigation'],
    hasSeparateNav: true, // Separate header and navigation
    comingSoon: true,
    defaults: { primary:'#1A1A1A', secondary:'#ffffff' }
  }
]

const COLOUR_GROUPS = [
  { section:'Utility Belt', fields:[
    { key:'utilityBeltBg',    label:'Utility Belt Background' },
    { key:'utilityBeltText',  label:'Utility Belt Text'       },
  ]},
  { section:'Header',     fields:[
    { key:'headerBg',    label:'Header Background' },
    { key:'headerText',  label:'Header Text'       },
  ]},
  { section:'Navigation', fields:[
    { key:'navBg',       label:'Nav Background'   },
    { key:'navText',     label:'Nav Text'          },
  ]},
  { section:'Brand',      fields:[
    { key:'primary',     label:'Primary Colour'   },
    { key:'secondary',   label:'Secondary Colour' },
  ]},
  { section:'Body',       fields:[
    { key:'bodyBg',      label:'Page Background'  },
    { key:'bodyText',    label:'Body Text'        },
  ]},
  { section:'Buttons',    fields:[
    { key:'ctaBg',       label:'Button Background' },
    { key:'ctaText',     label:'Button Text'       },
  ]},
]

function ThemesConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [tab,      setTab]      = useState('selection')
  const [selected, setSelected] = useState(config.colours?.theme || 'theme-v1')
  const [colours,  setColours]  = useState(() => {
    const c     = config.colours || {}
    const theme = THEMES.find(t => t.key === (c.theme || 'theme-v1')) || THEMES[0]
    return { ...theme.defaults, ...c }
  })
  const savedColoursRef = useRef(config.colours || {})
  const savedSelectedRef = useRef(config.colours?.theme || 'theme-v1')

  // Get utility belt state from header config
  const isUtilityBeltEnabled = config.header?.utilityBelt !== false
  
  // Get current theme configuration to check if it has separate navigation
  const currentTheme = THEMES.find(t => t.key === selected) || THEMES[0]
  const hasSeparateNav = currentTheme.hasSeparateNav || false

  useEffect(() => {
    if (config.colours) {
      const c     = config.colours
      const theme = THEMES.find(t => t.key === (c.theme || 'theme-v1')) || THEMES[0]
      setSelected(c.theme || 'theme-v1')
      setColours({ ...theme.defaults, ...c })
      savedColoursRef.current = c
      savedSelectedRef.current = c.theme || 'theme-v1'
      setHasUnsavedChanges(false)
    }
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const savedSelected = savedSelectedRef.current
    const savedColours  = savedColoursRef.current
    const hasChanges = selected !== savedSelected || JSON.stringify(colours) !== JSON.stringify(savedColours)
    setHasUnsavedChanges(hasChanges)
  }, [selected, colours, setHasUnsavedChanges])

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      colours: { ...colours, theme: selected }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          }
  })

  // Fully replace colours with theme defaults when switching theme
  const selectTheme = (themeKey) => {
    setSelected(themeKey)
    const theme = THEMES.find(t => t.key === themeKey)
    if (theme) setColours({ ...theme.defaults, theme: themeKey })
  }

  const setColour = (key, value) => setColours(prev => ({ ...prev, [key]: value }))

  const tabs = [
    { key:'selection', label:'Theme Selection' },
    { key:'colours',   label:'Theme Colours'   },
  ]

  const SaveRow = ({ label='Save' }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        style={{ padding:'10px 28px',
          background: mutation.isPending ? C.card : C.acc,
          border:'none', borderRadius:8, color:'#fff', fontWeight:700,
          fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          fontFamily:'inherit',
          boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
        {mutation.isPending ? 'Saving…' : label}
      </button>
      {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
    </div>
  )

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Theme
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Controls how your site looks — layout, colors, and visual style. 
        This only affects the design, not your content.
      </p>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:0, marginBottom:24,
        borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', border:'none',
              borderBottom: tab===t.key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===t.key ? C.t0 : C.t2,
              fontWeight: tab===t.key ? 700 : 400, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Theme Selection ── */}
      {tab === 'selection' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)',
            gap:16, marginBottom:24 }}>
            {THEMES.map(theme => {
              const isSelected = selected === theme.key
              return (
                <div key={theme.key}
                  onClick={() => !theme.comingSoon && selectTheme(theme.key)}
                  style={{ background:C.card,
                    border:`2px solid ${isSelected ? C.acc : C.border}`,
                    borderRadius:12, overflow:'hidden', cursor: theme.comingSoon ? 'not-allowed' : 'pointer',
                    transition:'border-color 0.15s',
                    position: 'relative',
                    opacity: theme.comingSoon ? 0.7 : 1,
                    boxShadow: isSelected ? `0 0 0 1px ${C.acc}` : 'none' }}>

                  {theme.comingSoon && (
                    <div style={{
                      position:'absolute', top:8, left:8, zIndex:10,
                      background:'#eee', color:'#666', padding:'2px 8px',
                      borderRadius:4, fontSize:10, fontWeight:700
                    }}>COMING SOON</div>
                  )}

                  {/* Preview area */}
                  <div style={{ height:160, position:'relative', overflow:'hidden',
                    background: theme.defaults.bodyBg }}>
                    <>
                      <div style={{ height:28, background:theme.defaults.headerBg,
                        borderBottom:`1px solid ${theme.defaults.navBg}20`,
                        display:'flex', alignItems:'center', padding:'0 12px', gap:8 }}>
                        <div style={{ width:40, height:8, borderRadius:4,
                          background:theme.defaults.primary }}/>
                        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{ width:20, height:5, borderRadius:3,
                              background:theme.defaults.headerText+'40' }}/>
                          ))}
                        </div>
                      </div>
                      <div style={{ height:20, background:theme.defaults.navBg,
                        display:'flex', alignItems:'center', padding:'0 12px', gap:6 }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ width:18, height:4, borderRadius:2,
                            background:theme.defaults.navText+'60' }}/>
                        ))}
                      </div>
                      <div style={{ height:60, background:theme.defaults.secondary,
                        display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
                        <div>
                          <div style={{ width:70, height:7, borderRadius:3,
                            background:'#ffffff60', marginBottom:5 }}/>
                          <div style={{ width:50, height:5, borderRadius:3,
                            background:'#ffffff40' }}/>
                        </div>
                        <div style={{ marginLeft:'auto', width:36, height:16,
                          borderRadius:4, background:theme.defaults.ctaBg,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ width:20, height:4, borderRadius:2,
                            background:theme.defaults.ctaText }}/>
                        </div>
                      </div>
                      <div style={{ padding:'8px 12px', background:theme.defaults.bodyBg,
                        display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ background:theme.defaults.accentBg,
                            borderRadius:4, height:24 }}/>
                        ))}
                      </div>
                    </>
                    {isSelected && (
                      <div style={{ position:'absolute', top:8, right:8,
                        width:22, height:22, borderRadius:'50%', background:C.acc,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, color:'#fff', fontWeight:700 }}>✓</div>
                    )}
                  </div>

                  {/* Label & Info */}
                  <div style={{ padding:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ fontSize:14, fontWeight:800,
                        color: isSelected ? C.acc : C.t0 }}>
                        {theme.label}
                      </div>
                      {isSelected && (
                        <span style={{ fontSize:10, fontWeight:700, color:C.acc,
                          background:C.accBg, padding:'2px 8px', borderRadius:4,
                          border:`1px solid ${C.acc}40` }}>
                          Active
                        </span>
                      )}
                    </div>
                    
                    {/* Target audience */}
                    <div style={{ fontSize:11, color:C.t3, marginBottom:4 }}>
                      🎯 {theme.target}
                    </div>
                    
                    {/* Sell angle */}
                    <div style={{ fontSize:10, color:C.t2, fontStyle:'italic', marginBottom:6 }}>
                      💡 {theme.sellAngle}
                    </div>
                    
                    {/* Features */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {theme.features?.slice(0, 3).map((f, i) => (
                        <span key={i} style={{ 
                          fontSize:9, 
                          color:C.t3, 
                          background:C.input,
                          padding:'2px 6px', 
                          borderRadius:3 
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              style={{ padding:'10px 28px',
                background: mutation.isPending ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700,
                fontSize:14, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                fontFamily:'inherit',
                boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
              {mutation.isPending ? 'Saving…' : 'Save Theme'}
            </button>
            <button onClick={() => { mutation.mutate(); setTab('colours') }}
              disabled={mutation.isPending}
              style={{ padding:'10px 20px', background:'transparent',
                border:`1px solid ${C.border2}`, borderRadius:8,
                color:C.t2, fontWeight:600, fontSize:14,
                cursor:'pointer', fontFamily:'inherit' }}>
              Save & Customise Colours →
            </button>
            {mutation.isSuccess && (
              <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Theme Colours ── */}
      {tab === 'colours' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>

          {/* Left — colour fields */}
          <div>
            {COLOUR_GROUPS.map(group => (
              <div key={group.section} style={{ background:C.card,
                border:`1px solid ${C.border}`, borderRadius:12,
                padding:20, marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
                  {group.section}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {group.fields.map(({ key, label }) => {
                    // Check if this field should be disabled
                    const isUtilityBeltField = group.section === 'Utility Belt'
                    const isNavigationField = group.section === 'Navigation'
                    const isDisabled = (isUtilityBeltField && !isUtilityBeltEnabled) || 
                                     (isNavigationField && !hasSeparateNav)
                    
                    return (
                      <div key={key} style={{ 
                        display:'flex', 
                        alignItems:'center', 
                        gap:12,
                        opacity: isDisabled ? 0.5 : 1,
                        position: 'relative'
                      }}>
                        {isDisabled && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            zIndex: 1,
                            cursor: 'not-allowed'
                          }} />
                        )}
                        <input 
                          type="color"
                          value={colours[key] || '#000000'}
                          onChange={e => !isDisabled && setColour(key, e.target.value)}
                          disabled={isDisabled}
                          style={{ 
                            width:40, 
                            height:36, 
                            border:'none', 
                            borderRadius:6,
                            cursor: isDisabled ? 'not-allowed' : 'pointer', 
                            background:'none', 
                            flexShrink:0,
                            zIndex: 2
                          }}
                        />
                        <input
                          value={colours[key] || ''}
                          onChange={e => {
                            if (!isDisabled) {
                              const v = e.target.value
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColour(key, v)
                            }
                          }}
                          maxLength={7}
                          disabled={isDisabled}
                          style={{ 
                            width:100, 
                            padding:'7px 9px', 
                            background: isDisabled ? C.hover : C.input,
                            border:`1px solid ${isDisabled ? C.border2 : C.border}`, 
                            borderRadius:7,
                            color: isDisabled ? C.t3 : C.t0, 
                            fontSize:12, 
                            fontFamily:'monospace',
                            outline:'none', 
                            boxSizing:'border-box', 
                            flexShrink:0,
                            cursor: isDisabled ? 'not-allowed' : 'text',
                            zIndex: 2
                          }}
                          onFocus={e => !isDisabled && (e.target.style.borderColor = C.acc)}
                          onBlur={e  => !isDisabled && (e.target.style.borderColor = C.border)}
                        />
                        <span style={{ fontSize:13, color: isDisabled ? C.t3 : C.t1 }}>
                          {label}
                          {isDisabled && (
                            isUtilityBeltField ? ' (Utility Belt Disabled)' : 
                            isNavigationField ? ' (Combined with Header)' : 
                            ' (Disabled)'
                          )}
                        </span>
                        <div style={{ 
                          width:28, 
                          height:28, 
                          borderRadius:6, 
                          flexShrink:0,
                          background: colours[key] || '#000',
                          border:`1px solid ${C.border2}`, 
                          marginLeft:'auto',
                          zIndex: 2
                        }}/>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <SaveRow label="Save Colours" />
          </div>

          {/* Right — live preview */}
          <div style={{ position:'sticky', top:0, alignSelf:'start' }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
              Live Preview
            </div>
            <div style={{ borderRadius:12, overflow:'hidden',
              border:`1px solid ${C.border}`,
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>

              {/* Utility Belt Preview - On Top */}
              {isUtilityBeltEnabled && (
                <div style={{ 
                  background: colours.utilityBeltBg || colours.primary || '#C8823A',
                  padding:'4px 14px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  fontSize:'8px',
                  fontWeight:'600',
                  color: colours.utilityBeltText || '#ffffff',
                  borderBottom: `1px solid rgba(0,0,0,0.1)`
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span>📍 123 Main St</span>
                    <span>📞 (555) 123-4567</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span>⭐ 4.8</span>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding:'1px 4px', 
                      borderRadius:'2px',
                      fontSize:'7px'
                    }}>Book Now</span>
                  </div>
                </div>
              )}

              <div style={{ background: colours.headerBg || '#fff',
                padding:'10px 14px', display:'flex', alignItems:'center',
                justifyContent:'space-between',
                borderBottom:`1px solid ${colours.navBg}30` }}>
                <div style={{ fontSize:12, fontWeight:800,
                  color: colours.headerText || '#1A1A1A' }}>
                  Restaurant Name
                </div>
                <div style={{ padding:'4px 10px', borderRadius:5,
                  background: colours.ctaBg || '#FF6B2B',
                  color: colours.ctaText || '#fff',
                  fontSize:10, fontWeight:700 }}>
                  Book Now
                </div>
              </div>

              <div style={{ background: colours.navBg || '#1C2B1A',
                padding:'7px 14px', display:'flex', gap:12 }}>
                {['Home','Menu','About','Contact'].map(item => (
                  <span key={item} style={{ fontSize:10, fontWeight:600,
                    color: colours.navText || '#fff' }}>{item}</span>
                ))}
              </div>

              <div style={{
                background: `url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding:'20px 14px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 1
                }} />
                <div style={{ position:'relative', zIndex:2 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:6 }}>
                    Hero Banner Preview
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                    This is a simulation of the hero section.
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ padding:'6px 14px', borderRadius:6,
                      background: colours.ctaBg || '#FF6B2B',
                      color: colours.ctaText || '#fff', fontSize:10, fontWeight:700 }}>
                      Book a Table
                    </div>
                    <div style={{ padding:'6px 14px', borderRadius:6, background:'transparent',
                      border:'1px solid rgba(255,255,255,0.4)',
                      color:'#fff', fontSize:10, fontWeight:600 }}>
                      View Menu
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: colours.bodyBg || '#fff', padding:'14px' }}>
                <div style={{ fontSize:11, fontWeight:700,
                  color: colours.primary || '#FF6B2B', marginBottom:6 }}>
                  Our Menu
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['Wagyu Beef','Truffle Pasta','Salmon','Dessert'].map(item => (
                    <div key={item} style={{ background: colours.accentBg || '#F5F0EA',
                      borderRadius:6, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, fontWeight:700,
                        color: colours.bodyText || '#1A1A1A', marginBottom:2 }}>
                        {item}
                      </div>
                      <div style={{ fontSize:9,
                        color: (colours.bodyText || '#1A1A1A') + '80' }}>$38</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, textAlign:'center' }}>
                  <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:6,
                    background: colours.ctaBg || '#FF6B2B',
                    color: colours.ctaText || '#fff', fontSize:10, fontWeight:700 }}>
                    View Full Menu
                  </div>
                </div>
              </div>

              <div style={{ background: colours.navBg || '#1C2B1A', padding:'10px 14px' }}>
                <div style={{ fontSize:9, textAlign:'center',
                  color: (colours.navText || '#ffffff') + '80' }}>
                  © 2025 Restaurant Name · All rights reserved
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const theme = THEMES.find(t => t.key === selected) || THEMES[0]
                setColours({ ...theme.defaults, theme: selected })
              }}
              style={{ marginTop:12, width:'100%', padding:'8px',
                background:'transparent', border:`1px solid ${C.border2}`,
                borderRadius:8, color:C.t2, fontSize:12, cursor:'pointer',
                fontFamily:'inherit' }}>
              Reset to {THEMES.find(t => t.key === selected)?.label || 'theme'} defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Social Links Config ──────────────────────────────────────
function SocialLinksConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
    
  // Default form state
  const defaultForm = {
    facebook: '',
    instagram: '',
    twitter: '',
    showInFooter: true,
    showInUtility: true,
  }
  
  // Merge config.social with defaults
  const [form, setForm] = useState(() => {
    return {
      ...defaultForm,
      ...(config.social || {})
    }
  })
  const savedFormRef = useRef({ ...defaultForm, ...(config.social || {}) })

  // Update form when config changes
  useEffect(() => {
    if (config.social) {
      const newForm = { ...defaultForm, ...config.social }
      setForm(newForm)
      savedFormRef.current = newForm
      setHasUnsavedChanges(false)
    }
  }, [config.social, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFormRef.current
    const hasChanges = JSON.stringify(form) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [form, setHasUnsavedChanges])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const mutation = useMutation({
    mutationFn: async () => {
      // Filter out empty strings and clean up the data
      const cleanedSocial = {
        showInFooter: form.showInFooter,
        showInUtility: form.showInUtility,
      }
      
      // Only include non-empty URLs
      socialPlatforms.forEach(platform => {
        const value = form[platform.key]
        if (value && value.trim() !== '') {
          cleanedSocial[platform.key] = value.trim()
        }
      })
      
      const result = await saveConfig(clientId, { social: cleanedSocial })
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config', clientId] })
      setHasUnsavedChanges(false)
          },
    onError: (err) => {
      console.error('Save failed:', err)
      console.error('Error details:', err.response?.data)
      alert('Failed to save. Please try again.')
    }
  })

  // SVG Icons for social platforms
  const socialIcons = {
    facebook: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
    instagram: <svg width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#833AB4"/><stop offset="50%" stopColor="#E1306C"/><stop offset="100%" stopColor="#FCAF45"/></linearGradient></defs><circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="white"/></svg>,
    twitter: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    tiktok: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/></svg>,
    youtube: <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>,
    linkedin: <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  }

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
  ]

  // Handle Enter key to save
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      mutation.mutate()
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Social Links
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Add your social media profiles. They can be displayed in the footer.
        <span style={{ color:C.t2, marginLeft:8 }}>(Ctrl+Enter to save)</span>
      </p>

      {/* Social Links */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Social Media Profiles
        </div>
        
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {socialPlatforms.map(platform => (
            <div key={platform.key} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ 
                width:44, 
                height:44, 
                borderRadius:8, 
                background:C.hover,
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center',
                flexShrink:0,
                marginTop:20
              }}>
                {socialIcons[platform.key]}
              </div>
              <div style={{ flex:1 }}>
                <Inp
                  label={platform.label}
                  value={form[platform.key]}
                  onChange={e => set(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  style={{ marginBottom:0 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Display Options
        </div>
        
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Show in Footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.t0 }}>Show in Footer</span>
              <span style={{ fontSize:11, color:C.t3, marginTop:2 }}>Display social icons in the site footer</span>
            </div>
            <button
              type="button"
              onClick={() => set('showInFooter', !form.showInFooter)}
              style={{ 
                width:48, 
                height:26, 
                borderRadius:13, 
                cursor:'pointer',
                background: form.showInFooter ? C.acc : C.hover, 
                flexShrink:0,
                border:`1px solid ${form.showInFooter ? C.acc : C.border2}`,
                transition:'background 0.15s',
                padding:0,
                position:'relative'
              }}
            >
              <span style={{ 
                width:20, 
                height:20, 
                borderRadius:'50%', 
                background:'#fff',
                position:'absolute', 
                top:2,
                left: form.showInFooter ? 24 : 2, 
                transition:'left 0.15s',
                display:'block'
              }}/>
            </button>
          </div>

          {/* Show in Utility Belt */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.t0 }}>Show in Utility Belt</span>
              <span style={{ fontSize:11, color:C.t3, marginTop:2 }}>Display social icons in the header utility belt</span>
            </div>
            <button
              type="button"
              onClick={() => set('showInUtility', !form.showInUtility)}
              style={{ 
                width:48, 
                height:26, 
                borderRadius:13, 
                cursor:'pointer',
                background: form.showInUtility ? C.acc : C.hover, 
                flexShrink:0,
                border:`1px solid ${form.showInUtility ? C.acc : C.border2}`,
                transition:'background 0.15s',
                padding:0,
                position:'relative'
              }}
            >
              <span style={{ 
                width:20, 
                height:20, 
                borderRadius:'50%', 
                background:'#fff',
                position:'absolute', 
                top:2,
                left: form.showInUtility ? 24 : 2, 
                transition:'left 0.15s',
                display:'block'
              }}/>
            </button>
          </div>
        </div>
      </div>

      <SaveBtn onClick={() => mutation.mutate()} saving={mutation.isPending || mutation.isLoading} />
      {mutation.isSuccess && <span style={{ marginLeft:12, color:C.acc, fontSize:13 }}>✅ Saved</span>}
    </div>
  )
}

// ── Header Config ─────────────────────────────────────────────
const HEADER_TYPES = [
  { key:'standard-full', label:'Standard Full',  desc:'Logo left, nav centre, CTA right'         },
  { key:'sticky',        label:'Sticky',         desc:'Stays fixed at top while scrolling'        },
  { key:'minimal',       label:'Minimal',        desc:'Logo + hamburger menu only'                },
  { key:'split',         label:'Split',          desc:'Logo centre, nav split left and right'     },
]

const CTA_TYPES = [
  { key:'internal', label:'Internal Link', hint:'Page on your site — must start with /'  },
  { key:'external', label:'External Link', hint:'Full URL, tel:, mailto: or #anchor'      },
]

const CTA_VARIANTS = [
  { key:'primary',  label:'Primary Button'  },
  { key:'secondary',label:'Secondary Button'},
  { key:'outline',  label:'Outline Button'  },
  { key:'text',     label:'Text Link'       },
]

const UTILITY_ITEMS = [
  { key:'contact-info', label:'Contact Info', editKey:null, cmsNav:true, description:'Address, Phone, Hours' },
  { key:'social-links', label:'Social Links', editKey:'social-links', description:'Facebook, Instagram, etc.' },
  { key:'reviews',      label:'Reviews',      editKey:'reviews', description:'Star rating & review count' },
  { key:'header-ctas',  label:'Header CTAs',  editKey:null, description:'Custom call-to-action buttons' },
]

// ── Utility Belt Order Component (Drag & Drop) ───────────────
function UtilityBeltOrder({ items, utilityItems, onReorder, onToggle, onEdit }) {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  
  // Get current order or default
  const order = Array.isArray(utilityItems?.order) ? utilityItems.order : items.map(i => i.key)
  
  // Sort items based on order
  const sortedItems = order.map(key => items.find(i => i.key === key)).filter(Boolean)
  
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    // Set drag image
    const rect = e.target.getBoundingClientRect()
    e.dataTransfer.setDragImage(e.target, rect.width / 2, 20)
  }
  
  const handleDragOver = (e, item) => {
    e.preventDefault()
    if (draggedItem && draggedItem.key !== item.key) {
      setDragOverItem(item)
    }
  }
  
  const handleDragLeave = () => {
    setDragOverItem(null)
  }
  
  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.key === targetItem.key) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }
    
    const newOrder = [...order]
    const draggedIndex = newOrder.indexOf(draggedItem.key)
    const targetIndex = newOrder.indexOf(targetItem.key)
    
    // Remove dragged item
    newOrder.splice(draggedIndex, 1)
    // Insert at new position
    newOrder.splice(targetIndex, 0, draggedItem.key)
    
    onReorder(newOrder)
    setDraggedItem(null)
    setDragOverItem(null)
  }
  
  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }
  
  return (
    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Utility Belt Components
        <span style={{ fontSize:10, fontWeight:400, color:C.t2, marginLeft:8 }}>
          (Drag to reorder)
        </span>
      </div>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`,
        borderRadius:9, overflow:'hidden' }}>
        {/* Table header */}
        <div style={{ display:'grid', gridTemplateColumns:'30px 1fr 80px 80px',
          padding:'7px 14px', background:'#0A0F1A',
          borderBottom:`1px solid ${C.border}`,
          fontSize:11, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.05em' }}>
          <span></span>
          <span>Component</span>
          <span>Active</span>
          <span>Edit</span>
        </div>
        {sortedItems.map((item, i) => {
          const isOn = utilityItems?.[item.key] !== false
          const isDragging = draggedItem?.key === item.key
          const isDragOver = dragOverItem?.key === item.key
          
          return (
            <div 
              key={item.key}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item)}
              onDragEnd={handleDragEnd}
              style={{ 
                display:'grid', 
                gridTemplateColumns:'30px 1fr 80px 80px',
                padding:'11px 14px', 
                alignItems:'center',
                borderBottom: i < sortedItems.length-1 ? `1px solid ${C.border}20` : 'none',
                background: isDragging ? C.accBg : isDragOver ? C.hover : 'transparent',
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                if (!draggedItem) e.currentTarget.style.background=C.hover
              }}
              onMouseLeave={e => {
                if (!draggedItem && !isDragOver) e.currentTarget.style.background='transparent'
              }}>
              {/* Drag handle */}
              <div style={{ cursor: 'grab', color: C.t2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              {/* Label & description */}
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>
                  {item.label}
                </div>
                <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>
                  {item.description}
                </div>
              </div>
              {/* Toggle */}
              <div onClick={() => onToggle(item.key, !isOn)}
                style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
                  background: isOn ? C.acc : C.hover, position:'relative',
                  border:`1px solid ${isOn ? C.acc : C.border2}`,
                  transition:'background 0.15s' }}>
                <div style={{ width:14, height:14, borderRadius:'50%',
                  background:'#fff', position:'absolute', top:2,
                  left: isOn ? 18 : 2, transition:'left 0.15s' }}/>
              </div>
              {/* Edit button */}
              <button
                onClick={() => onEdit(item)}
                style={{ padding:'4px 10px', background:'transparent',
                  border:`1px solid ${C.border2}`, borderRadius:5,
                  color:C.t2, fontSize:11, cursor:'pointer',
                  fontFamily:'inherit' }}>
                Edit
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeaderConfig({ clientId, config, onNavigate, setHasUnsavedChanges }) {
  const qc      = useQueryClient()
  const [saved,  setSaved]  = useState(false)
  const [tab,    setTab]    = useState('header')
  const savedFormRef = useRef(null)
  const savedCtasRef = useRef([])
  
  // Default structure for header configuration
  const defaultHeader = {
    type:        'standard-full',
    utilityBelt: true,
    utilityItems:{
      order: ['contact-info', 'social-links', 'reviews', 'header-ctas'],
      'contact-info': true,
      'social-links': true,
      reviews: true,
      'header-ctas': true
    },
    headerTheme: 'not-set',
  }

  // Helper to sanitize utilityItems before putting into state or saving
  const sanitizeHeader = (header) => {
    if (!header) return defaultHeader
    
    const rawUtil = header.utilityItems || {}
    const items = {}
    
    // 1. Ensure order is an array of valid keys
    let order = Array.isArray(rawUtil.order) ? rawUtil.order : []
    // Filter out keys that aren't in our current UTILITY_ITEMS or are the 'order' key itself
    const validKeys = UTILITY_ITEMS.map(i => i.key)
    order = order.filter(key => validKeys.includes(key))
    
    // 2. Add missing valid keys to the end of order if they're not there
    validKeys.forEach(key => {
      if (!order.includes(key)) order.push(key)
    })
    
    // 3. Build the utilityItems object with only valid keys as booleans
    items.order = order
    validKeys.forEach(key => {
      // Convert object { active:true } or similar to boolean if needed
      const val = rawUtil[key]
      if (typeof val === 'object' && val !== null) {
        items[key] = val.active !== false
      } else if (typeof val === 'boolean') {
        items[key] = val
      } else {
        items[key] = defaultHeader.utilityItems[key] !== false
      }
    })
    
    return {
      ...defaultHeader,
      ...header,
      utilityItems: items
    }
  }

  const [form,   setForm]   = useState(() => {
    if (config?.header) return sanitizeHeader(config.header)
    return defaultHeader
  })

  const [ctas,   setCtas]   = useState(() => {
    const initialCtas = config?.headerCtas || [];
    return Array.isArray(initialCtas) ? initialCtas : [];
  })
  const [ctaModal, setCtaModal] = useState(null) // null | 'new' | { ...cta }

  useEffect(() => {
    if (config.header) {
      setForm(sanitizeHeader(config.header))
      savedFormRef.current = sanitizeHeader(config.header)
    }
    if (config.headerCtas) {
      const headerCtas = Array.isArray(config.headerCtas) ? config.headerCtas : [];
      setCtas(headerCtas)
      savedCtasRef.current = headerCtas
    }
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const savedForm = savedFormRef.current
    const savedCtas = savedCtasRef.current
    const hasChanges = tab !== 'header' || JSON.stringify(form) !== JSON.stringify(savedForm) || JSON.stringify(ctas) !== JSON.stringify(savedCtas)
    setHasUnsavedChanges(hasChanges)
  }, [tab, form, ctas, setHasUnsavedChanges])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  const setUtil = (k, v) => setForm(p => ({
    ...p, utilityItems: {...(p.utilityItems||{}), [k]: v}
  }))

  const mutation = useMutation({
    mutationFn: () => {
      // Final sanitize before save
      const cleanHeader = sanitizeHeader(form)
      return saveConfig(clientId, {
        header:     cleanHeader,
        headerCtas: ctas,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          },
    onError: (err) => {
      console.error('Save failed:', err)
      alert('Failed to save: ' + (err.response?.data?.error || err.message))
    }
  })

  // ── CTA helpers ──
  const saveCta = (cta) => {
    if (cta.id) {
      setCtas(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return current.map(c => c.id === cta.id ? cta : c)
      })
    } else {
      setCtas(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return [...current, { ...cta, id: Date.now().toString(), active: true }]
      })
    }
    setCtaModal(null)
  }

  const deleteCta = (id) => {
    if (!window.confirm('Delete this CTA?')) return
    setCtas(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.filter(c => c.id !== id)
    })
  }

  const toggleCta = (id) => {
    setCtas(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.map(c => c.id === id ? {...c, active: !c.active} : c)
    })
  }

  const tabs = [
    { key:'header', label:'Header Configuration' },
    { key:'ctas',   label:'Header CTAs'          },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Header
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Configure the site header layout, utility belt and call-to-action buttons.
      </p>

      {/* Tab bar */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', border:'none',
              borderBottom: tab===t.key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===t.key ? C.t0 : C.t2,
              fontWeight: tab===t.key ? 700 : 400, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Header Configuration ── */}
      {tab === 'header' && (
        <div>

          {/* Header Type */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Header Type
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {HEADER_TYPES.map(ht => {
                const isActive = form.type === ht.key
                return (
                  <div key={ht.key} onClick={() => set('type', ht.key)}
                    style={{ padding:'12px 14px', borderRadius:9, cursor:'pointer',
                      border:`2px solid ${isActive ? C.acc : C.border}`,
                      background: isActive ? C.accBg : 'transparent',
                      transition:'all 0.15s' }}>
                    <div style={{ fontSize:13, fontWeight:700,
                      color: isActive ? C.acc : C.t0 }}>
                      {ht.label}
                      {isActive && <span style={{ marginLeft:8, fontSize:10,
                        background:C.acc, color:'#fff', padding:'1px 6px',
                        borderRadius:3 }}>Active</span>}
                    </div>
                    <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>{ht.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Utility Belt toggle */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between', marginBottom: form.utilityBelt ? 16 : 0 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                  Header Utility Belt
                </div>
                <div style={{ fontSize:12, color:C.t3 }}>
                  Top bar above the header with quick-access info and links
                </div>
              </div>
              {/* Toggle */}
              <div onClick={() => set('utilityBelt', !form.utilityBelt)}
                style={{ width:44, height:24, borderRadius:12, cursor:'pointer',
                  background: form.utilityBelt ? C.acc : C.hover, flexShrink:0,
                  position:'relative', border:`1px solid ${form.utilityBelt ? C.acc : C.border2}`,
                  transition:'background 0.15s' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:2,
                  left: form.utilityBelt ? 22 : 2, transition:'left 0.15s' }}/>
              </div>
            </div>

            {/* Utility belt items */}
            {form.utilityBelt && (
              <UtilityBeltOrder 
                items={UTILITY_ITEMS}
                utilityItems={form.utilityItems || {}}
                onReorder={(newOrder) => setForm(p => ({
                  ...p, 
                  utilityItems: { ...p.utilityItems, order: newOrder }
                }))}
                onToggle={(key, value) => setUtil(key, value)}
                onEdit={(item) => {
                  if (item.editKey) {
                    onNavigate(item.editKey)
                  } else if (item.key === 'header-ctas') {
                    setTab('ctas')
                  } else if (item.cmsNav) {
                    window.dispatchEvent(new CustomEvent('cms-navigate', {
                      detail: { section: item.key }
                    }))
                  }
                }}
              />
            )}
          </div>

          {/* Header Theme */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Header Theme
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[
                { key:'not-set', label:'Not Set'  },
                { key:'light',   label:'Light'    },
                { key:'dark',    label:'Dark'     },
              ].map(({ key, label }) => {
                const isActive = form.headerTheme === key
                return (
                  <button key={key} onClick={() => set('headerTheme', key)}
                    style={{ padding:'8px 20px', borderRadius:8, fontSize:13,
                      fontWeight: isActive ? 700 : 400, cursor:'pointer',
                      fontFamily:'inherit',
                      border:`2px solid ${isActive ? C.acc : C.border}`,
                      background: isActive ? C.accBg : 'transparent',
                      color: isActive ? C.acc : C.t2 }}>
                    {label}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize:11, color:C.t3, marginTop:8 }}>
              Controls whether the header uses light or dark colours from your theme palette.
              Not Set inherits from the selected theme.
            </div>
          </div>

          {/* Save */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
              {mutation.isPending ? 'Saving…' : 'Save Header Config'}
            </button>
            {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
          </div>
        </div>
      )}

      {/* ── Tab: Header CTAs ── */}
      {tab === 'ctas' && (
        <div>
          {/* CTA Modal */}
          {ctaModal && (
            <CtaModal
              cta={ctaModal === 'new' ? null : ctaModal}
              onSave={saveCta}
              onClose={() => setCtaModal(null)}
            />
          )}

          {/* Header + Add button */}
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Header CTAs</div>
              <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>
                Buttons and links shown in the site header
              </div>
            </div>
            <button onClick={() => setCtaModal('new')}
              style={{ padding:'8px 18px', background:C.acc, border:'none',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              + Add CTA
            </button>
          </div>

          {/* CTAs table */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 130px 180px 70px 70px 60px',
              padding:'8px 16px', background:'#0A0F1A',
              borderBottom:`1px solid ${C.border}`,
              fontSize:11, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.05em' }}>
              <span>Label</span>
              <span>Type</span>
              <span>Link / Value</span>
              <span>Variant</span>
              <span>Active</span>
              <span></span>
            </div>

            {(!Array.isArray(ctas) || ctas.length === 0) ? (
              <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
                No CTAs yet. Click + Add CTA to create one.
              </div>
            ) : ctas.map((cta, i) => (
              <div key={cta.id}
                style={{ display:'grid',
                  gridTemplateColumns:'1fr 130px 180px 70px 70px 60px',
                  padding:'11px 16px', alignItems:'center',
                  borderBottom: i < (Array.isArray(ctas) ? ctas.length - 1 : 0) ? `1px solid ${C.border}15` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background=C.hover}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>
                    {cta.label || cta.workingTitle}
                  </div>
                  {cta.workingTitle && cta.label && (
                    <div style={{ fontSize:11, color:C.t3 }}>{cta.workingTitle}</div>
                  )}
                </div>

                <span style={{ fontSize:11, color:C.t2 }}>
                  {CTA_TYPES.find(t => t.key === cta.type)?.label || cta.type}
                </span>

                <span style={{ fontSize:11, color:C.cyan, fontFamily:'monospace',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {cta.value}
                </span>

                <span style={{ fontSize:11, color:C.t3, textTransform:'capitalize' }}>
                  {cta.variant || 'primary'}
                </span>

                {/* Active toggle */}
                <div onClick={() => toggleCta(cta.id)}
                  style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
                    background: cta.active ? C.acc : C.hover, position:'relative',
                    border:`1px solid ${cta.active ? C.acc : C.border2}`,
                    transition:'background 0.15s' }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff',
                    position:'absolute', top:2,
                    left: cta.active ? 18 : 2, transition:'left 0.15s' }}/>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => setCtaModal(cta)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:`1px solid ${C.border2}`, borderRadius:4,
                      color:C.t2, fontSize:11, cursor:'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteCta(cta.id)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:'1px solid #EF444440', borderRadius:4,
                      color:'#EF4444', fontSize:11, cursor:'pointer' }}>
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
              {mutation.isPending ? 'Saving…' : 'Save CTAs'}
            </button>
            {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CTA Modal ─────────────────────────────────────────────────
function CtaModal({ cta, onSave, onClose }) {
  const [form, setForm] = useState(cta || {
    workingTitle: '', label: '', type: 'internal',
    value: '', variant: 'primary', active: true
  })
  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const [error, setError] = useState('')

  const validate = () => {
    if (!form.workingTitle?.trim()) { setError('Working title is required'); return false }
    if (!form.label?.trim())        { setError('Label text is required');    return false }
    if (!form.value?.trim())        { setError('Link / value is required');  return false }
    if (form.type === 'internal' && !form.value.startsWith('/')) {
      setError('Internal links must start with /'); return false
    }
    if (form.type === 'external' &&
    !/^(https?:\/\/|tel:|mailto:|#)/.test(form.value)) {
  setError('Must start with https://, tel:, mailto:, or #')
  return false
}
    if (form.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value)) {
      setError('Enter a valid email address'); return false
    }
    setError('')
    return true
  }

  const handleSave = () => { if (validate()) onSave(form) }

  const typeHints = {
  internal: 'e.g. /menu or /contact-us',
  external: 'e.g. https://opentable.com or tel:+61391234567 or mailto:hello@rest.com or #reviews',
}

  const inp = (label, key, placeholder, opts={}) => (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>{label}</label>
      <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder={placeholder}
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontSize:13, fontFamily: opts.mono ? 'monospace' : 'inherit',
          outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = C.acc}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600,
      background:'rgba(0,0,0,0.75)', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:520, background:C.panel,
        border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${C.acc},${C.cyan})` }}/>
        <div style={{ padding:'24px 24px 20px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.t0, marginBottom:20 }}>
            {cta ? 'Edit CTA' : 'Add CTA'}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Working title + Label */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {inp('Working Title (CMS only) *', 'workingTitle', 'e.g. Book A Service')}
              {inp('Label Text *', 'label', 'e.g. Book Now')}
            </div>

            {/* CTA Type */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:8 }}>CTA Type *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
                {CTA_TYPES.map(({ key, label, hint }) => (
                  <div key={key} onClick={() => set('type', key)}
                    style={{ padding:'8px 10px', borderRadius:7, cursor:'pointer',
                      border:`1px solid ${form.type===key ? C.acc : C.border}`,
                      background: form.type===key ? C.accBg : 'transparent' }}>
                    <div style={{ fontSize:12, fontWeight:700,
                      color: form.type===key ? C.acc : C.t1 }}>{label}</div>
                    <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link / Value */}
            {inp('Link / Value *', 'value',
              typeHints[form.type] || '', { mono: true })}

            {/* CTA Variant */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:8 }}>CTA Variant</label>
              <div style={{ display:'flex', gap:8 }}>
                {CTA_VARIANTS.map(({ key, label }) => (
                  <button key={key} onClick={() => set('variant', key)}
                    style={{ flex:1, padding:'7px', borderRadius:7, cursor:'pointer',
                      fontFamily:'inherit', fontSize:12, fontWeight:600,
                      border:`1px solid ${form.variant===key ? C.acc : C.border}`,
                      background: form.variant===key ? C.accBg : 'transparent',
                      color: form.variant===key ? C.acc : C.t2 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding:'8px 12px', background:'#1A0505',
                border:'1px solid #EF444440', borderRadius:7,
                fontSize:12, color:'#EF4444' }}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
              <button onClick={onClose}
                style={{ padding:'9px 18px', background:'transparent',
                  border:`1px solid ${C.border}`, borderRadius:7,
                  color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                style={{ padding:'9px 22px', background:C.acc, border:'none',
                  borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
                  cursor:'pointer', fontFamily:'inherit' }}>
                {cta ? 'Save Changes' : 'Add CTA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reviews Config ───────────────────────────────────────────
function ReviewsConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [tab,   setTab]   = useState('summary')
  const [f,     setF]     = useState(config.reviews || {})
    const [ctaModal, setCtaModal] = useState(null)
  const savedFRef = useRef(config.reviews || {})

  useEffect(() => { 
    setF(config.reviews || {})
    savedFRef.current = config.reviews || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFRef.current
    const hasChanges = tab !== 'summary' || JSON.stringify(f) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [tab, f, setHasUnsavedChanges])

  const s = (k, v) => setF(p => ({...p, [k]: v}))

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { reviews: f }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          },
    onError: (err) => {
      console.error('Reviews save failed:', err)
      console.error('Error details:', err.response?.data)
      
      // Show user-friendly error message
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
      alert(`Reviews save failed: ${errorMsg}\n\nPlease try again.`)
    }
  })

  // CTA helpers — same pattern as HeaderConfig
  const ctas      = f.ctas || []
  const saveCta   = (cta) => {
    if (cta.id) {
      s('ctas', ctas.map(c => c.id === cta.id ? cta : c))
    } else {
      s('ctas', [...ctas, { ...cta, id: Date.now().toString(), active: true }])
    }
    setCtaModal(null)
  }
  const deleteCta = (id) => {
    if (!window.confirm('Delete this CTA?')) return
    s('ctas', ctas.filter(c => c.id !== id))
  }
  const toggleCta = (id) => {
    s('ctas', ctas.map(c => c.id === id ? {...c, active: !c.active} : c))
  }

  const tabs = [
    { key:'summary', label:'Summary'       },
    { key:'ctas',    label:'Calls To Action'},
  ]

  const field = (label, key, placeholder, opts={}) => (
    <div key={key}>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>{label}</label>
      <input
        value={f[key] || ''}
        onChange={e => s(key, e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontSize:13, fontFamily: opts.mono ? 'monospace' : 'inherit',
          outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = C.acc}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
      {opts.hint && (
        <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{opts.hint}</div>
      )}
    </div>
  )

  const SaveRow = () => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:24 }}>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
          border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
          cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
        {mutation.isPending ? 'Saving…' : 'Save'}
      </button>
      {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
      {mutation.isError && (
        <span style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>❌ Save Failed</span>
      )}
    </div>
  )

  return (
    <div>
      {ctaModal && (
        <CtaModal
          cta={ctaModal === 'new' ? null : ctaModal}
          onSave={saveCta}
          onClose={() => setCtaModal(null)}
        />
      )}

      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Reviews
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Configure how reviews are displayed on the restaurant site.
      </p>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', border:'none',
              borderBottom: tab===t.key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===t.key ? C.t0 : C.t2,
              fontWeight: tab===t.key ? 700 : 400, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Summary tab ── */}
      {tab === 'summary' && (
        <div>

          {/* Google Place ID */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Google Reviews (Automatic)
            </div>
            {field('Google Place ID', 'googlePlaceId', 'e.g. ChIJN1t_tDeuEmsRUsoyG83frY4',
              { mono: true,
                hint: 'Find at maps.google.com → search your restaurant → share → copy the Place ID. Reviews will be fetched automatically.' })}
            <div style={{ marginTop:14, display:'flex', gap:10, alignItems:'center' }}>
              <input type="checkbox"
                checked={f.enableHeader !== false}
                onChange={e => s('enableHeader', e.target.checked)}
                style={{ accentColor: C.acc, width:14, height:14 }}/>
              <label style={{ fontSize:13, color:C.t1 }}>Enable Reviews in Header</label>
            </div>
            <div style={{ marginTop:8, display:'flex', gap:10, alignItems:'center' }}>
              <input type="checkbox"
                checked={f.enableFooter === true}
                onChange={e => s('enableFooter', e.target.checked)}
                style={{ accentColor: C.acc, width:14, height:14 }}/>
              <label style={{ fontSize:13, color:C.t1 }}>Enable Reviews in Footer</label>
            </div>
            <div style={{ marginTop:8, display:'flex', gap:10, alignItems:'center' }}>
              <input type="checkbox"
                checked={f.enableFloating === true}
                onChange={e => s('enableFloating', e.target.checked)}
                style={{ accentColor: C.acc, width:14, height:14 }}/>
              <label style={{ fontSize:13, color:C.t1 }}>Enable Floating Reviews Widget</label>
            </div>
          </div>

          {/* Minimum Star Rating */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
              Minimum Star Rating
            </div>
            <div style={{ fontSize:12, color:C.t3, marginBottom:14 }}>
              Only show reviews with this rating or above.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[1,2,3,4,5].map(star => {
                const isSelected = (f.minStars || 3) === star
                return (
                  <button key={star} onClick={() => s('minStars', star)}
                    style={{ width:44, height:44, borderRadius:8, cursor:'pointer',
                      fontFamily:'inherit', fontSize:16, fontWeight:700,
                      border:`2px solid ${isSelected ? '#F5A623' : C.border}`,
                      background: isSelected ? '#2A1A00' : 'transparent',
                      color: isSelected ? '#F5A623' : C.t2,
                      transition:'all 0.15s' }}>
                    {star}★
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reviews carousel section heading */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Reviews Carousel Content
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {field('Heading',     'carouselHeading',    'e.g. What Our Customers Say')}
              {field('Sub Heading', 'carouselSubHeading', 'e.g. Real reviews from real customers')}
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:5 }}>Content</label>
              <textarea
                value={f.carouselContent || ''}
                onChange={e => s('carouselContent', e.target.value)}
                rows={4}
                placeholder="Optional introductory text shown above the reviews carousel..."
                style={{ width:'100%', padding:'9px 11px', fontSize:13,
                  background:C.input, border:`1px solid ${C.border}`,
                  borderRadius:7, color:C.t0, fontFamily:'inherit',
                  resize:'vertical', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = C.acc}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
            
            {/* Reviews display options */}
            <div style={{ marginTop:16, padding:12, background:C.panel, borderRadius:8, border:`1px solid ${C.border}20` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:10 }}>Display Options</div>
              
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                <input type="checkbox"
                  checked={f.showReviewsCarousel === true}
                  onChange={e => s('showReviewsCarousel', e.target.checked)}
                  style={{ accentColor: C.acc, width:14, height:14 }}/>
                <label style={{ fontSize:13, color:C.t1 }}>Show Reviews Carousel</label>
              </div>
              
              <div style={{ fontSize:11, color:C.t3, marginTop:8, marginBottom:4 }}>When enabled, displays real-time Google reviews on the homepage</div>
              
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <input type="checkbox"
                  checked={f.alternateStyles === true}
                  onChange={e => s('alternateStyles', e.target.checked)}
                  style={{ accentColor: C.acc, width:14, height:14 }}/>
                <label style={{ fontSize:13, color:C.t1 }}>Use Alternate Styles (Dark Background)</label>
              </div>
            </div>
          </div>

          <SaveRow/>
        </div>
      )}

      {/* ── CTAs tab ── */}
      {tab === 'ctas' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>
                Reviews CTAs
              </div>
              <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>
                Buttons shown in the reviews section — e.g. Leave a Review, Read More
              </div>
            </div>
            <button onClick={() => setCtaModal('new')}
              style={{ padding:'8px 18px', background:C.acc, border:'none',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', fontFamily:'inherit' }}>
              + Add CTA
            </button>
          </div>

          {/* CTAs table */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 130px 180px 70px 70px 60px',
              padding:'8px 16px', background:'#0A0F1A',
              borderBottom:`1px solid ${C.border}`,
              fontSize:11, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.05em' }}>
              <span>Label</span>
              <span>Type</span>
              <span>Link</span>
              <span>Variant</span>
              <span>Active</span>
              <span></span>
            </div>

            {(!Array.isArray(ctas) || ctas.length === 0) ? (
              <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
                No CTAs yet. Click + Add CTA to create one.
              </div>
            ) : ctas.map((cta, i) => (
              <div key={cta.id}
                style={{ display:'grid',
                  gridTemplateColumns:'1fr 130px 180px 70px 70px 60px',
                  padding:'11px 16px', alignItems:'center',
                  borderBottom: i < (Array.isArray(ctas) ? ctas.length - 1 : 0) ? `1px solid ${C.border}15` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background=C.hover}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>
                    {cta.label || cta.workingTitle}
                  </div>
                  {cta.workingTitle && cta.label && (
                    <div style={{ fontSize:11, color:C.t3 }}>{cta.workingTitle}</div>
                  )}
                </div>
                <span style={{ fontSize:11, color:C.t2 }}>
                  {CTA_TYPES.find(t => t.key === cta.type)?.label || cta.type}
                </span>
                <span style={{ fontSize:11, color:C.cyan, fontFamily:'monospace',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {cta.value}
                </span>
                <span style={{ fontSize:11, color:C.t3, textTransform:'capitalize' }}>
                  {cta.variant || 'primary'}
                </span>
                <div onClick={() => toggleCta(cta.id)}
                  style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
                    background: cta.active ? C.acc : C.hover, position:'relative',
                    border:`1px solid ${cta.active ? C.acc : C.border2}`,
                    transition:'background 0.15s' }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff',
                    position:'absolute', top:2,
                    left: cta.active ? 18 : 2, transition:'left 0.15s' }}/>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => setCtaModal(cta)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:`1px solid ${C.border2}`, borderRadius:4,
                      color:C.t2, fontSize:11, cursor:'pointer' }}>Edit</button>
                  <button onClick={() => deleteCta(cta.id)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:'1px solid #EF444440', borderRadius:4,
                      color:'#EF4444', fontSize:11, cursor:'pointer' }}>Del</button>
                </div>
              </div>
            ))}
          </div>

          <SaveRow/>
        </div>
      )}
    </div>
  )
}

// ── Footer Config ───────────────────────────────────────────
function FooterConfig({ clientId, config, setHasUnsavedChanges }) {
  const qc = useQueryClient()
  const [f,     setF]     = useState(config.footer || {})
    const savedFRef = useRef(config.footer || {})

  useEffect(() => { 
    setF(config.footer || {})
    savedFRef.current = config.footer || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFRef.current
    const hasChanges = JSON.stringify(f) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [f, setHasUnsavedChanges])

  const s = (k, v) => setF(p => ({...p, [k]: v}))

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { footer: f }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          }
  })

  const inp = (label, key, placeholder, hint='') => (
    <div key={key}>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>{label}</label>
      <input value={f[key] || ''} onChange={e => s(key, e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = C.acc}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
      {hint && <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{hint}</div>}
    </div>
  )

  const setSocial = (k, v) => setF(p => ({
    ...p, 
    socialLinks: { ...(p.socialLinks || {}), [k]: v }
  }))

  const SOCIAL_PLATFORMS = [
    { key:'facebook',    label:'Facebook',    placeholder:'https://facebook.com/yourpage'    },
    { key:'instagram',   label:'Instagram',   placeholder:'https://instagram.com/yourhandle' },
    { key:'google',      label:'Google',      placeholder:'https://g.page/r/...'             },
    { key:'tripadvisor', label:'TripAdvisor', placeholder:'https://tripadvisor.com/...'      },
    { key:'twitter',     label:'X / Twitter', placeholder:'https://twitter.com/yourhandle'  },
    { key:'youtube',     label:'YouTube',     placeholder:'https://youtube.com/...'          },
    { key:'tiktok',      label:'TikTok',      placeholder:'https://tiktok.com/@yourhandle'  },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Footer
      </h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:C.t3 }}>
        Footer content, social links and legal links for the restaurant site.
      </p>

      {/* Brand */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Brand
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {inp('Tagline', 'tagline',
            'e.g. Proudly serving Melbourne since 2012',
            'Shown below the logo in the footer')}
          {inp('Copyright Text', 'copyrightText',
            `e.g. © ${new Date().getFullYear()} Urban Eats Melbourne. All rights reserved.`,
            'Leave blank to auto-generate from restaurant name')}
        </div>
      </div>

      {/* Social Links */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Social Links
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.06em',
                display:'block', marginBottom:5 }}>{label}</label>
              <input
                value={f.socialLinks?.[key] || ''}
                onChange={e => setSocial(key, e.target.value)}
                placeholder={placeholder}
                style={{ width:'100%', padding:'9px 11px', background:C.input,
                  border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                  fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = C.acc}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Legal Links */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3,
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Legal Links
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {(f.legalLinks || [
            { label:'Privacy Policy', href:'/privacy' },
            { label:'Terms',          href:'/terms'   },
          ]).map((link, i) => (
            <div key={i} style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  display:'block', marginBottom:5 }}>Label</label>
                <input
                  value={link.label || ''}
                  onChange={e => {
                    const links = [...(f.legalLinks || [
                      { label:'Privacy Policy', href:'/privacy' },
                      { label:'Terms',          href:'/terms'   },
                    ])]
                    links[i] = { ...links[i], label: e.target.value }
                    s('legalLinks', links)
                  }}
                  style={{ width:'100%', padding:'9px 11px', background:C.input,
                    border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                    fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.acc}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                  display:'block', marginBottom:5 }}>URL</label>
                <input
                  value={link.href || ''}
                  onChange={e => {
                    const links = [...(f.legalLinks || [
                      { label:'Privacy Policy', href:'/privacy' },
                      { label:'Terms',          href:'/terms'   },
                    ])]
                    links[i] = { ...links[i], href: e.target.value }
                    s('legalLinks', links)
                  }}
                  style={{ width:'100%', padding:'9px 11px', background:C.input,
                    border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                    fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.acc}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
            border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
          {mutation.isPending ? 'Saving…' : 'Save Footer'}
        </button>
        {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
      </div>
    </div>
  )
}

// ── Booking & Ordering Config ───────────────────────────────────────────
function BookingConfig({ clientId, config, setHasUnsavedChanges, activeKey }) {
  const qc = useQueryClient()
  const [tab,   setTab]   = useState('booking')
  const [f,     setF]     = useState(config.booking || {})
    const savedFRef = useRef(config.booking || {})

  useEffect(() => { 
    setF(config.booking || {})
    savedFRef.current = config.booking || {}
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const saved = savedFRef.current
    const hasChanges = tab !== 'booking' || JSON.stringify(f) !== JSON.stringify(saved)
    setHasUnsavedChanges(hasChanges)
  }, [tab, f, setHasUnsavedChanges])

  const s = (k, v) => setF(p => ({...p, [k]: v}))

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { booking: f }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setHasUnsavedChanges(false)
          },
    onError: (err) => {
      console.error('[Booking Save Error]', err.response?.data || err.message)
      alert('Save failed: ' + (err.response?.data?.error || err.message))
    }
  })

  const tabs = [
    { key:'booking',  label:'Table Booking'  },
    { key:'ordering', label:'Online Ordering' },
    { key:'display',  label:'Display Options' },
  ]

  const inp = (label, key, placeholder, opts={}) => (
    <div key={key}>
      <label style={{ fontSize:11, fontWeight:700, color:C.t3,
        textTransform:'uppercase', letterSpacing:'0.06em',
        display:'block', marginBottom:5 }}>{label}</label>
      <input
        value={f[key] || ''}
        onChange={e => s(key, e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'9px 11px', background:C.input,
          border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
          fontSize:13,
          fontFamily: opts.mono ? "'Fira Code',monospace" : 'inherit',
          outline:'none', boxSizing:'border-box' }}
        onFocus={e => e.target.style.borderColor = C.acc}
        onBlur={e  => e.target.style.borderColor = C.border}
      />
      {opts.hint && (
        <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>{opts.hint}</div>
      )}
    </div>
  )

  const toggle = (label, key, hint='') => (
    <div style={{ display:'flex', alignItems:'center',
      justifyContent:'space-between', padding:'12px 0',
      borderBottom:`1px solid ${C.border}20` }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>{label}</div>
        {hint && <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{hint}</div>}
      </div>
      <div onClick={() => s(key, !f[key])}
        style={{ width:44, height:24, borderRadius:12, cursor:'pointer',
          background: f[key] ? C.acc : C.hover, flexShrink:0,
          position:'relative',
          border:`1px solid ${f[key] ? C.acc : C.border2}`,
          transition:'background 0.15s' }}>
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff',
          position:'absolute', top:2,
          left: f[key] ? 22 : 2, transition:'left 0.15s' }}/>
      </div>
    </div>
  )

  const SaveRow = () => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:24 }}>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        style={{ padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
          border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
          cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
          boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50` }}>
        {mutation.isPending ? 'Saving…' : 'Save'}
      </button>
      {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
    </div>
  )

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Booking & Ordering
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Controls every booking and order button across the entire site.
        Change once — updates everywhere instantly.
      </p>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`,
        marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', border:'none',
              borderBottom: tab===t.key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===t.key ? C.t0 : C.t2,
              fontWeight: tab===t.key ? 700 : 400, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Table Booking ── */}
      {tab === 'booking' && (
        <div>
          {/* Booking method */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
              Booking Method
            </div>
            <div style={{ fontSize:12, color:C.t3, marginBottom:14 }}>
              The site uses whichever you fill in — URL takes priority over phone.
            </div>

            {/* Platform selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
              gap:8, marginBottom:16 }}>
              {[
                { key:'opentable',  label:'OpenTable'   },
                { key:'resdiary',   label:'ResDiary'    },
                { key:'quandoo',    label:'Quandoo'     },
                { key:'nowbookit',  label:'NowBookIt'   },
                { key:'custom',     label:'Custom URL'  },
                { key:'phone',      label:'Phone Only'  },
              ].map(p => {
                const isSelected = (f.bookingPlatform || 'custom') === p.key
                return (
                  <button key={p.key}
                    onClick={() => s('bookingPlatform', p.key)}
                    style={{ padding:'8px', borderRadius:7, cursor:'pointer',
                      fontFamily:'inherit', fontSize:12, fontWeight:600,
                      border:`1px solid ${isSelected ? C.acc : C.border}`,
                      background: isSelected ? C.accBg : 'transparent',
                      color: isSelected ? C.acc : C.t2 }}>
                    {p.label}
                    {isSelected && ' ✓'}
                  </button>
                )
              })}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {inp('Booking URL', 'bookingUrl',
                'https://www.opentable.com.au/...',
                { mono: true,
                  hint: 'Paste your OpenTable, ResDiary, Quandoo or custom booking page URL' })}
              {inp('Phone Booking Number', 'bookingPhone',
                '+61 3 9123 4567',
                { hint: 'Used as fallback if no URL — clicking Book a Table will call this number' })}
            </div>
          </div>

          {/* Button labels */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Button Labels
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {inp('Book Button Text', 'bookLabel', 'e.g. Book a Table',
                { hint: 'Shown on every booking CTA across the site' })}
              {inp('Confirmation Message', 'bookConfirmMsg',
                'e.g. Thanks! We\'ll see you soon.',
                { hint: 'Shown after a booking is made (if using direct form)' })}
            </div>
          </div>

          {/* Direct booking form settings */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between', marginBottom: f.useDirectForm ? 16 : 0 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                  Direct Booking Form
                </div>
                <div style={{ fontSize:12, color:C.t3 }}>
                  Use a built-in form instead of an external platform
                </div>
              </div>
              <div onClick={() => s('useDirectForm', !f.useDirectForm)}
                style={{ width:44, height:24, borderRadius:12, cursor:'pointer',
                  background: f.useDirectForm ? C.acc : C.hover, flexShrink:0,
                  position:'relative',
                  border:`1px solid ${f.useDirectForm ? C.acc : C.border2}`,
                  transition:'background 0.15s' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:2,
                  left: f.useDirectForm ? 22 : 2, transition:'left 0.15s' }}/>
              </div>
            </div>

            {f.useDirectForm && (
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {inp('Min Party Size', 'minParty', 'e.g. 1')}
                  {inp('Max Party Size', 'maxParty', 'e.g. 20')}
                  {inp('Advance Notice (hours)', 'advanceNotice', 'e.g. 2',
                    { hint: 'How many hours ahead a booking can be made' })}
                  {inp('Max Days Ahead', 'maxDaysAhead', 'e.g. 60',
                    { hint: 'How far in advance customers can book' })}
                  {inp('Time Slot Interval (mins)', 'slotInterval', 'e.g. 30',
                    { hint: '30 = slots at 6:00, 6:30, 7:00 etc' })}
                  {inp('Notification Email', 'notifyEmail',
                    'e.g. bookings@restaurant.com',
                    { hint: 'Where booking notifications are sent' })}
                </div>
              </div>
            )}
          </div>

          <SaveRow/>
        </div>
      )}

      {/* ── Online Ordering ── */}
      {tab === 'ordering' && (
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Ordering Platforms
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {inp('Uber Eats URL', 'uberEatsUrl',
                'https://www.ubereats.com/...',
                { mono:true, hint:'Your restaurant\'s Uber Eats page' })}
              {inp('DoorDash URL', 'doorDashUrl',
                'https://www.doordash.com/...',
                { mono:true, hint:'Your restaurant\'s DoorDash page' })}
              {inp('Menulog URL', 'menulogUrl',
                'https://www.menulog.com.au/...',
                { mono:true, hint:'Your restaurant\'s Menulog page' })}
              {inp('Custom Order URL', 'orderUrl',
                'https://order.yourrestaurant.com.au',
                { mono:true, hint:'Your own ordering system — overrides platform links if set' })}
              {inp('Order Button Label', 'orderLabel', 'e.g. Order Online',
                { hint:'Text shown on the Order Online button' })}
            </div>
          </div>

          {/* Pickup / Delivery toggle */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Service Types
            </div>
            {toggle('Pickup Available',  'pickupEnabled',
              'Customers can order for pickup')}
            {toggle('Delivery Available', 'deliveryEnabled',
              'Customers can order for delivery')}
            {toggle('Dine-in Ordering',  'dineInEnabled',
              'Customers can order from table via QR code')}

            {f.pickupEnabled && (
              <div style={{ marginTop:14 }}>
                {inp('Estimated Pickup Time', 'pickupTime',
                  'e.g. 15-20 minutes',
                  { hint:'Shown to customer after ordering' })}
              </div>
            )}
            {f.deliveryEnabled && (
              <div style={{ marginTop:14,
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {inp('Minimum Order ($)', 'minOrder', 'e.g. 30')}
                {inp('Delivery Fee ($)',  'deliveryFee', 'e.g. 5')}
                {inp('Estimated Delivery Time', 'deliveryTime', 'e.g. 30-45 minutes')}
                {inp('Free Delivery Over ($)', 'freeDeliveryOver',
                  'e.g. 60', { hint:'Leave blank to always charge delivery fee' })}
              </div>
            )}
          </div>

          <SaveRow/>
        </div>
      )}

      {/* ── Display Options ── */}
      {tab === 'display' && (
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t3,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
              Show / Hide Booking Elements
            </div>
            {toggle('Show Book Button in Header',
              'showInHeader', 'CTA button in the site header')}
            {toggle('Show Book Button in Utility Belt',
              'showInUtility', 'Quick book link in the top bar')}
            {toggle('Show Book Button in Hero',
              'showInHero', 'CTA on the homepage hero section')}
            {toggle('Show Book Button on Location Cards',
              'showOnLocations', 'Book button on each location card')}
            {toggle('Show Book Button in Footer',
              'showInFooter', 'CTA in the site footer')}
            {toggle('Show Order Online Button',
              'showOrderBtn', 'Show or hide the Order Online button globally')}
          </div>

          <SaveRow/>
        </div>
      )}
    </div>
  )
}

// ── Netlify Config ─────────────────────────────────────────
function NetlifyConfig({ clientId, config, setHasUnsavedChanges, client }) {
  const qc = useQueryClient()
  const [tab,      setTab]      = useState('site')
  const [form,     setForm]     = useState(config.netlify || {})
  const [saved,    setSaved]    = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg,setCreateMsg]= useState('')
  const [deploys,  setDeploys]  = useState([])
  const [loadingD, setLoadingD] = useState(false)
  const savedFormRef = useRef(config.netlify || {})
  const [domainVal,setDomainVal]= useState('')
  const [addingDomain, setAddingDomain] = useState(false)
  
  // Build status tracking
  const [buildStatus, setBuildStatus] = useState(null) // null | 'creating' | 'building' | 'ready' | 'error'
  const [buildStartTime, setBuildStartTime] = useState(null)
  const [actualPreviewUrl, setActualPreviewUrl] = useState(null)
  
  // Live build timer (seconds elapsed, updated every second while building)
  const [buildElapsed, setBuildElapsed] = useState(0)

  // Site verification
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState(null) // null | 'exists' | 'not_found' | 'error'
  const [verifyMessage, setVerifyMessage] = useState('')
  const [rebuilding, setRebuilding] = useState(false)

  // Repo / setup status
  const [setupStatus,   setSetupStatus]   = useState(null)
  const [linkingRepo,   setLinkingRepo]   = useState(false)
  const [linkRepoMsg,   setLinkRepoMsg]   = useState('')
  const [linkRepoBranch, setLinkRepoBranch] = useState('main')

  // Environment variables tab
  const [envVars,    setEnvVars]    = useState([])
  const [loadingEnv, setLoadingEnv] = useState(false)
  const [savingEnv,  setSavingEnv]  = useState(false)
  const [envMsg,     setEnvMsg]     = useState('')
  const [newEnvKey,  setNewEnvKey]  = useState('')
  const [newEnvVal,  setNewEnvVal]  = useState('')
  const [deletingEnvKey, setDeletingEnvKey] = useState(null)

  // Rollback
  const [rollingBack, setRollingBack] = useState(null) // deployId being rolled back

  useEffect(() => { 
    if (config.netlify) {
      setForm(config.netlify)
      savedFormRef.current = config.netlify
    }
    setHasUnsavedChanges(false)
  }, [config, setHasUnsavedChanges])

  useEffect(() => {
    const savedForm = savedFormRef.current
    const hasChanges = tab !== 'site' || JSON.stringify(form) !== JSON.stringify(savedForm)
    setHasUnsavedChanges(hasChanges)
  }, [tab, form, setHasUnsavedChanges])

  // Live build timer — ticks every second while building
  useEffect(() => {
    if (buildStatus !== 'building') { setBuildElapsed(0); return }
    setBuildElapsed(buildStartTime ? Math.floor((Date.now() - buildStartTime) / 1000) : 0)
    const id = setInterval(() => {
      setBuildElapsed(buildStartTime ? Math.floor((Date.now() - buildStartTime) / 1000) : 0)
    }, 1000)
    return () => clearInterval(id)
  }, [buildStatus, buildStartTime])

  const s = (k, v) => setForm(p => ({...p, [k]: v}))
  const token = () => localStorage.getItem('dd_token')
  const fmtTime = (sec) => sec >= 60 ? `${Math.floor(sec/60)}m ${sec%60}s` : `${sec}s`

  // Computed: expected preview URL based on clientId + restaurant name
  const restaurantSlug = (client?.name || 'restaurant')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const expectedSiteName = `${clientId}-${restaurantSlug}`
  const expectedPreviewUrl = form.previewUrl || `https://${expectedSiteName}.netlify.app`
  const expectedDomain = form.customDomain || `${expectedSiteName}.com.au`
  const siteExists = !!form.siteId

  // Step indicator: 0=Create, 1=Building, 2=Preview, 3=Live
  const currentStep = !siteExists ? 0
    : (buildStatus === 'building' || buildStatus === 'creating') ? 1
    : (form.primaryDomain && form.domainLive) ? 3
    : 2

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { netlify: form }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
          }
  })

  const createNetlifySite = async () => {
    setCreating(true)
    setCreateMsg('⏳ Creating Netlify site...')
    setBuildStatus('creating') // creating | building | ready | error
    setBuildStartTime(Date.now())
    
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/create`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token() },
        body: JSON.stringify({ template: form.template || 'urban-bistro' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      
      // Site created successfully
      setCreateMsg(data.repoLinked
        ? '✅ Site created & repo linked! Build in progress…'
        : '⚠️ Site created but repo not linked — see Setup warning above.')
      setBuildStatus(data.repoLinked ? 'building' : 'error')

      // Update form with site details
      setForm(p => ({
        ...p,
        siteId:       data.siteId,
        previewUrl:   data.netlifyAppUrl || data.previewUrl,
        buildHook:    data.buildHook,
        customDomain: data.customDomain,
      }))

      await loadSetupStatus()

      if (data.repoLinked) {
        pollDeployStatus(data.siteId, data.netlifyAppUrl || data.previewUrl)
      } else {
        setCreating(false)
      }

      qc.invalidateQueries(['config', clientId])
    } catch (err) {
      setCreateMsg('❌ Error: ' + err.message)
      setBuildStatus('error')
      setCreating(false)
    }
  }
  
  // Poll Netlify deploy status
  const pollDeployStatus = async (siteId, previewUrl) => {
    const maxAttempts = 30 // 5 minutes max (30 * 10s)
    let attempts = 0
    
    const checkStatus = async () => {
      attempts++
      try {
        const res = await fetch(`${API_URL}/clients/${clientId}/netlify/deploys`, {
          headers: { Authorization: 'Bearer ' + token() }
        })
        const deploys = await res.json()
        
        if (deploys && deploys.length > 0) {
          const latestDeploy = deploys[0]
          const state = latestDeploy.state // 'building' | 'ready' | 'error' | 'enqueued' | 'processing'

          if (state === 'ready') {
            // Use Netlify's actual reported deploy_time (seconds) if available
            const actualSecs = latestDeploy.deploy_time
              || Math.floor((Date.now() - buildStartTime) / 1000)
            setBuildStatus('ready')
            setCreateMsg(`✅ Done! Built in ${fmtTime(actualSecs)}`)
            setActualPreviewUrl(previewUrl)
            setCreating(false)
            setRebuilding(false)
          } else if (state === 'building' || state === 'enqueued' || state === 'processing') {
            setBuildStatus('building')
            // createMsg not needed — live counter handles display
            setTimeout(checkStatus, 10000)
          } else if (state === 'error') {
            setBuildStatus('error')
            setCreateMsg('❌ Build failed. Check Netlify dashboard for logs.')
            setCreating(false)
            setRebuilding(false)
          } else {
            // Unknown state, keep polling
            setTimeout(checkStatus, 10000)
          }
        } else {
          // No deploys yet, keep polling
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 10000)
          } else {
            setCreateMsg('⏱️ Build taking longer than expected. Check Netlify dashboard.')
            setCreating(false)
            setRebuilding(false)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000)
        } else {
          setCreateMsg('⚠️ Could not track build status. Site may still be building.')
          setCreating(false)
          setRebuilding(false)
        }
      }
    }
    
    // Start polling after 10 seconds (give Netlify time to start build)
    setTimeout(checkStatus, 10000)
  }
  
  // Verify if site actually exists on Netlify
  const verifySiteExists = async () => {
    setVerifying(true)
    setVerifyStatus(null)
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/verify`, {
        headers: { Authorization: 'Bearer ' + token() }
      })
      const data = await res.json()
      
      if (data.exists) {
        setVerifyStatus('exists')
        setVerifyMessage('✅ Site exists on Netlify and is accessible')
      } else {
        setVerifyStatus('not_found')
        setVerifyMessage('❌ Site not found on Netlify. It may have been deleted.')
      }
    } catch (err) {
      setVerifyStatus('error')
      setVerifyMessage(`❌ Verification failed: ${err.message}`)
    } finally {
      setVerifying(false)
    }
  }
  
  // Trigger Netlify rebuild
  const triggerRebuild = async () => {
    setRebuilding(true)
    setBuildStatus('building')
    setBuildStartTime(Date.now())
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/rebuild`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token() }
      })
      const data = await res.json()
      
      if (res.ok) {
        setCreateMsg('🔄 Rebuild triggered! Building...')
        // Reset rebuilding flag since polling will handle completion
        setRebuilding(false)
        // Start polling for deploy status
        pollDeployStatus(form.siteId, form.previewUrl)
      } else {
        throw new Error(data.error || 'Failed to trigger rebuild')
      }
    } catch (err) {
      setCreateMsg(`❌ Rebuild failed: ${err.message}`)
      setBuildStatus('error')
      setRebuilding(false)
    }
  }

  const loadEnvVars = async () => {
    if (!form.siteId) return
    setLoadingEnv(true)
    setEnvMsg('')
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/env`,
        { headers: { Authorization: 'Bearer ' + token() } })
      const data = await res.json()
      if (res.ok) {
        const mapped = Array.isArray(data)
          ? data.map(v => ({ key: v.key, value: v.values?.[0]?.value ?? '', id: v.key }))
          : []
        setEnvVars(mapped)
      } else {
        setEnvMsg('⚠️ ' + (data.error || 'Failed to load env vars'))
      }
    } catch (err) {
      setEnvMsg('❌ ' + err.message)
    } finally {
      setLoadingEnv(false)
    }
  }

  const saveEnvVars = async (triggerRebuildAfter = false) => {
    const toSave = [...envVars]
    if (newEnvKey.trim()) toSave.push({ key: newEnvKey.trim(), value: newEnvVal })
    if (toSave.length === 0) return
    setSavingEnv(true)
    setEnvMsg('')
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/env`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
        body: JSON.stringify({ vars: toSave.map(({ key, value }) => ({ key, value })) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setEnvMsg(`✅ ${data.updated} variable${data.updated !== 1 ? 's' : ''} updated`)
      setNewEnvKey('')
      setNewEnvVal('')
      await loadEnvVars()
      if (triggerRebuildAfter) {
        setTimeout(() => {
          setEnvMsg(prev => prev + ' — triggering rebuild…')
          triggerRebuild()
        }, 800)
      }
    } catch (err) {
      setEnvMsg('❌ ' + err.message)
    } finally {
      setSavingEnv(false)
    }
  }

  const deleteEnvVarFn = async (key) => {
    setDeletingEnvKey(key)
    try {
      const res = await fetch(
        `${API_URL}/clients/${clientId}/netlify/env/${encodeURIComponent(key)}`,
        { method: 'DELETE', headers: { Authorization: 'Bearer ' + token() } }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      setEnvVars(prev => prev.filter(v => v.key !== key))
      setEnvMsg(`✅ Deleted "${key}"`)
    } catch (err) {
      setEnvMsg('❌ ' + err.message)
    } finally {
      setDeletingEnvKey(null)
    }
  }

  const rollback = async (deployId) => {
    setRollingBack(deployId)
    try {
      const res = await fetch(
        `${API_URL}/clients/${clientId}/netlify/rollback/${deployId}`,
        { method: 'POST', headers: { Authorization: 'Bearer ' + token() } }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      await loadDeploys()
    } catch (err) {
      alert('Rollback failed: ' + err.message)
    } finally {
      setRollingBack(null)
    }
  }

  useEffect(() => { if (tab === 'env') loadEnvVars() }, [tab])

  const loadSetupStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/setup-status`,
        { headers: { Authorization: 'Bearer ' + token() } })
      if (res.ok) setSetupStatus(await res.json())
    } catch { /* non-critical */ }
  }

  const linkRepo = async () => {
    setLinkingRepo(true)
    setLinkRepoMsg('')
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/link-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
        body: JSON.stringify({ branch: linkRepoBranch.trim() || 'main' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setLinkRepoMsg('✅ ' + data.message)
      await loadSetupStatus()
    } catch (err) {
      setLinkRepoMsg('❌ ' + err.message)
    } finally {
      setLinkingRepo(false)
    }
  }

  useEffect(() => { loadSetupStatus() }, [])

  const attachDomain = async () => {
    if (!domainVal.trim()) return
    setAddingDomain(true)
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/domain`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', Authorization:'Bearer '+token() },
        body: JSON.stringify({ domain: domainVal.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setForm(p => ({...p, primaryDomain: domainVal.trim(), domainLive: false}))
      qc.invalidateQueries(['config', clientId])
      setDomainVal('')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setAddingDomain(false)
    }
  }

  const loadDeploys = async () => {
    setLoadingD(true)
    try {
      const res = await fetch(`${API_URL}/clients/${clientId}/netlify/deploys`,
        { headers: { Authorization:'Bearer '+token() } })
      const data = await res.json()
      setDeploys(Array.isArray(data) ? data : [])
    } catch { setDeploys([]) }
    finally { setLoadingD(false) }
  }

  useEffect(() => { if (tab === 'deploys') loadDeploys() }, [tab])

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Deployment
      </h2>
      <p style={{ margin:'0 0 12px', fontSize:13, color:C.t3 }}>
        Create, build, and manage your live website.
      </p>

      {/* ── Step Indicator ── */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24,
        background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 20px' }}>
        {[
          { label:'Create Site', step:0 },
          { label:'Building',    step:1 },
          { label:'Preview Ready', step:2 },
          { label:'Live',        step:3 },
        ].map((s, i) => {
          const done = currentStep > s.step
          const active = currentStep === s.step
          const dotColor = done ? C.green : active ? '#3B82F6' : C.border
          return (
            <div key={s.step} style={{ display:'flex', alignItems:'center', flex:1 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:'0 0 auto' }}>
                <div style={{ width:24, height:24, borderRadius:'50%',
                  background: done ? C.green : active ? '#3B82F6' : 'transparent',
                  border: `2px solid ${dotColor}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, color: (done || active) ? '#fff' : C.t3,
                  transition:'all 0.3s' }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500,
                  color: done ? C.green : active ? '#3B82F6' : C.t3,
                  whiteSpace:'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div style={{ flex:1, height:2, margin:'0 8px',
                  background: done ? C.green : C.border, borderRadius:1,
                  transition:'background 0.3s', marginBottom:16 }}/>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
        {[
          { key:'site',    label:'Site'           },
          { key:'domain',  label:'Domain'         },
          { key:'deploys', label:'Deploys'        },
          { key:'env',     label:'Env Vars'       },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', border:'none',
              borderBottom: tab===t.key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===t.key ? C.t0 : C.t2,
              fontWeight: tab===t.key ? 700 : 400, fontSize:13,
              cursor:'pointer', fontFamily:'inherit', marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ SITE TAB ════════════════ */}
      {tab === 'site' && (
        <div>

          {/* ── BUILDING STATE — full-attention card ── */}
          {(buildStatus === 'creating' || buildStatus === 'building') && (
            <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid #3B82F650',
              borderRadius:12, padding:24, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:'#3B82F6',
                  flexShrink:0, animation:'pulse 1.5s infinite' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#3B82F6' }}>
                    {buildStatus === 'creating' ? 'Creating Netlify Site...' : 'Building Your Site...'}
                  </div>
                  <div style={{ fontSize:12, color:C.t3, marginTop:3 }}>
                    {buildStatus === 'creating'
                      ? 'Setting up site, environment variables, and build hooks...'
                      : 'Netlify is building and deploying — usually takes 2–5 minutes'}
                  </div>
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:'#60A5FA',
                  fontVariantNumeric:'tabular-nums', fontFamily:'monospace', minWidth:70, textAlign:'right' }}>
                  {fmtTime(buildElapsed)}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg, #3B82F6, #60A5FA)',
                  width:`${Math.min(95, (buildElapsed / 300) * 100)}%`, transition:'width 1s linear' }}/>
              </div>

              {/* URL preview during build */}
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                background:'rgba(0,0,0,0.2)', borderRadius:8, marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>Preview URL</span>
                <code style={{ fontSize:12, color:C.cyan, fontFamily:'monospace' }}>
                  {form.previewUrl || expectedPreviewUrl}
                </code>
              </div>

              <div style={{ padding:'8px 12px', background:'rgba(251,191,36,0.06)',
                border:'1px solid #FBBF2430', borderRadius:7, fontSize:11, color:'#FBBF24', lineHeight:1.6 }}>
                "Page not found" is normal while building. The URL goes live automatically once the build completes.
              </div>

              <button onClick={() => pollDeployStatus(form.siteId, form.previewUrl || expectedPreviewUrl)}
                style={{ marginTop:12, padding:'6px 14px', background:'transparent',
                  border:`1px solid ${C.border2}`, borderRadius:6,
                  color:C.t2, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                Refresh Status
              </button>
            </div>
          )}

          {/* ── READY STATE — success banner after build ── */}
          {buildStatus === 'ready' && (
            <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid #22C55E50',
              borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#22C55E', marginBottom:8 }}>
                {createMsg || 'Site is ready!'}
              </div>
              <a href={form.previewUrl || expectedPreviewUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8,
                  padding:'10px 20px', background:'#22C55E', borderRadius:8,
                  color:'#fff', textDecoration:'none', fontWeight:700, fontSize:13 }}>
                Open Preview Site →
              </a>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {buildStatus === 'error' && createMsg && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid #EF444450',
              borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#EF4444' }}>{createMsg}</div>
            </div>
          )}

          {/* ── NO SITE YET — Create section ── */}
          {!siteExists && buildStatus !== 'creating' && buildStatus !== 'building' && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:12, padding:24, marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.t0, marginBottom:6 }}>
                Create Netlify Site
              </div>
              <div style={{ fontSize:12, color:C.t3, marginBottom:16, lineHeight:1.7 }}>
                This will create a Netlify site, configure environment variables, link the GitHub
                repository, create a build hook, and trigger the first build — all automatically.
              </div>

              {/* URL Preview */}
              <div style={{ background:'#0A0F1A', borderRadius:8, padding:14, marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                  letterSpacing:'0.06em', marginBottom:8 }}>Your site will be at</div>
                <div style={{ fontSize:14, fontWeight:600, color:C.cyan, fontFamily:'monospace',
                  marginBottom:6 }}>
                  {expectedPreviewUrl}
                </div>
                <div style={{ fontSize:11, color:C.t3 }}>
                  Custom domain: <span style={{ color:C.t2 }}>{expectedDomain}</span>
                  <span style={{ color:C.t3 }}> (configure in Domain tab after creation)</span>
                </div>
              </div>

              {/* Client ID */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>Client ID</span>
                <code style={{ fontSize:12, color:C.cyan, fontFamily:'monospace',
                  background:'#0A0F1A', padding:'5px 10px', borderRadius:5 }}>{clientId}</code>
                <button onClick={() => navigator.clipboard.writeText(clientId)}
                  style={{ padding:'4px 10px', background:'transparent',
                    border:`1px solid ${C.border2}`, borderRadius:5,
                    color:C.t3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                  Copy
                </button>
              </div>

              <button onClick={createNetlifySite} disabled={creating}
                style={{ padding:'12px 32px', background: creating ? C.card : C.acc,
                  border:'none', borderRadius:8, color:'#fff', fontWeight:700,
                  fontSize:14, cursor: creating ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', opacity: creating ? 0.6 : 1,
                  boxShadow: creating ? 'none' : `0 4px 16px ${C.acc}50` }}>
                {creating ? 'Creating…' : 'Create Netlify Site'}
              </button>
            </div>
          )}

          {/* ── SITE EXISTS — details + Build & Deploy ── */}
          {siteExists && buildStatus !== 'creating' && buildStatus !== 'building' && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:12, padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:C.green }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Site Connected</div>
                    <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>
                      Site ID: <code style={{ color:C.cyan, fontFamily:'monospace' }}>{form.siteId}</code>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={verifySiteExists} disabled={verifying}
                    style={{ padding:'8px 14px', background:'transparent',
                      border:`1px solid ${C.border2}`, borderRadius:6,
                      color: verifying ? C.t3 : C.t2, fontWeight:600, fontSize:12,
                      cursor: verifying ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                    {verifying ? 'Checking...' : 'Verify'}
                  </button>
                  <button onClick={triggerRebuild}
                    disabled={rebuilding || buildStatus === 'building'}
                    style={{ padding:'8px 18px', background:'#22C55E', border:'none',
                      borderRadius:6, color:'#fff', fontWeight:700, fontSize:12,
                      cursor: (rebuilding || buildStatus === 'building') ? 'not-allowed' : 'pointer',
                      fontFamily:'inherit',
                      boxShadow:'0 4px 16px rgba(34,197,94,0.3)',
                      opacity: (rebuilding || buildStatus === 'building') ? 0.6 : 1 }}>
                    {rebuilding ? 'Starting...' : 'Build & Deploy'}
                  </button>
                </div>
              </div>

              {/* Verification message */}
              {verifyMessage && (
                <div style={{ marginBottom:14, padding:10, borderRadius:7, fontSize:12,
                  background: verifyStatus === 'exists' ? 'rgba(34,197,94,0.08)' :
                    verifyStatus === 'not_found' ? 'rgba(239,68,68,0.08)' : 'rgba(255,165,0,0.08)',
                  border: `1px solid ${verifyStatus === 'exists' ? '#22C55E40' :
                    verifyStatus === 'not_found' ? '#EF444440' : '#FFA50040'}`,
                  color: verifyStatus === 'exists' ? C.green :
                    verifyStatus === 'not_found' ? '#EF4444' : '#FFA500' }}>
                  {verifyMessage}
                  {verifyStatus === 'not_found' && (
                    <div style={{ marginTop:6 }}>
                      <button onClick={createNetlifySite} disabled={creating}
                        style={{ padding:'6px 14px', background:'#EF4444', border:'none',
                          borderRadius:5, color:'#fff', fontWeight:600, fontSize:11,
                          cursor: creating ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                        Recreate Site
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Site URLs */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                    textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                    Preview URL
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <code style={{ fontSize:12, color:C.cyan, fontFamily:'monospace',
                      background:'#0A0F1A', padding:'7px 12px', borderRadius:6,
                      flex:1, wordBreak:'break-all' }}>
                      {form.previewUrl}
                    </code>
                    <a href={form.previewUrl} target="_blank" rel="noreferrer"
                      style={{ padding:'7px 14px', background:'transparent',
                        border:`1px solid ${C.border2}`, borderRadius:6,
                        color:C.t2, fontSize:12, textDecoration:'none',
                        whiteSpace:'nowrap' }}>
                      Open ↗
                    </a>
                  </div>
                </div>
                {form.primaryDomain && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                      textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                      Live Domain
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%',
                        background: form.domainLive ? C.green : C.amber }}/>
                      <code style={{ fontSize:12, color: form.domainLive ? C.green : C.amber,
                        fontFamily:'monospace' }}>
                        {form.primaryDomain}
                      </code>
                      <span style={{ fontSize:10, color:C.t3 }}>
                        {form.domainLive ? 'Live' : 'Pending DNS'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Client ID */}
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>Client ID</span>
                  <code style={{ fontSize:12, color:C.cyan, fontFamily:'monospace',
                    background:'#0A0F1A', padding:'5px 10px', borderRadius:5 }}>{clientId}</code>
                  <button onClick={() => navigator.clipboard.writeText(clientId)}
                    style={{ padding:'4px 10px', background:'transparent',
                      border:`1px solid ${C.border2}`, borderRadius:5,
                      color:C.t3, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Repo warning — only if site exists but repo not linked */}
          {setupStatus && siteExists && !setupStatus.repoLinked && (
            <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid #EF444440',
              borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#EF4444' }}>
                  GitHub repo not linked
                </span>
              </div>
              <div style={{ fontSize:12, color:C.t3, lineHeight:1.7, marginBottom:10 }}>
                Builds require a linked GitHub repo. 
                {setupStatus.hasRepo
                  ? <span> Click below to link <code style={{ color:C.cyan }}>{setupStatus.repoPath}</code>.</span>
                  : <span> Add <code style={{ color:C.cyan }}>SITE_TEMPLATE_REPO</code> to your API .env file.</span>}
              </div>
              {setupStatus.hasRepo && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input value={linkRepoBranch} onChange={e => setLinkRepoBranch(e.target.value)}
                    placeholder="main"
                    style={{ padding:'5px 10px', background:C.input, border:`1px solid ${C.border}`,
                      borderRadius:6, color:C.t0, fontSize:12, fontFamily:'monospace', width:100 }}/>
                  <button onClick={linkRepo} disabled={linkingRepo}
                    style={{ padding:'7px 16px', background:'#EF4444', border:'none',
                      borderRadius:6, color:'#fff', fontWeight:700, fontSize:12,
                      cursor: linkingRepo ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                    {linkingRepo ? 'Linking…' : 'Link Repo'}
                  </button>
                  {linkRepoMsg && <span style={{ fontSize:12,
                    color: linkRepoMsg.startsWith('✅') ? C.green : '#EF4444' }}>{linkRepoMsg}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Domain Tab ── */}
      {tab === 'domain' && (
        <div>
          {!siteExists && (
            <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13,
              background:C.card, border:`1px solid ${C.border}`, borderRadius:12 }}>
              Create a Netlify site in the Site tab first.
            </div>
          )}

          {siteExists && (
            <>
              {/* Current domain status */}
              {form.primaryDomain && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.t3,
                    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
                    Current Domain
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%',
                      background: form.domainLive ? C.green : C.amber }}/>
                    <span style={{ fontSize:14, fontWeight:700,
                      color: form.domainLive ? C.green : C.amber }}>
                      {form.primaryDomain}
                    </span>
                    <span style={{ fontSize:11, color:C.t3 }}>
                      {form.domainLive ? 'Live' : 'Pending DNS'}
                    </span>
                    <button onClick={() => { s('domainLive', !form.domainLive); mutation.mutate() }}
                      style={{ marginLeft:'auto', padding:'5px 12px', background:'transparent',
                        border:`1px solid ${C.border2}`, borderRadius:6,
                        color:C.t2, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                      {form.domainLive ? 'Mark Pending' : 'Mark Live'}
                    </button>
                    <a href={`https://${form.primaryDomain}`} target="_blank" rel="noreferrer"
                      style={{ padding:'5px 12px', background:'transparent',
                        border:`1px solid ${C.border2}`, borderRadius:6,
                        color:C.t2, fontSize:11, textDecoration:'none' }}>
                      Open ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Add domain */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:12, padding:20, marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  {form.primaryDomain ? 'Change Domain' : 'Add Live Domain'}
                </div>
                <div style={{ fontSize:12, color:C.t3, marginBottom:14, lineHeight:1.7 }}>
                  After adding the domain here, give the client these DNS instructions:
                  point their domain's CNAME record to <code style={{ color:C.cyan }}>
                  {form.previewUrl?.replace('https://', '') || 'yoursite.netlify.app'}</code>.
                  Netlify handles SSL automatically once DNS propagates (up to 24h).
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <input value={domainVal} onChange={e => setDomainVal(e.target.value)}
                    placeholder="e.g. www.urbaneatsmcl.com.au"
                    onKeyDown={e => e.key === 'Enter' && attachDomain()}
                    style={{ flex:1, padding:'9px 11px', background:C.input,
                      border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
                      fontSize:13, fontFamily:'monospace', outline:'none' }}
                    onFocus={e => e.target.style.borderColor = C.acc}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                  <button onClick={attachDomain} disabled={addingDomain || !domainVal.trim()}
                    style={{ padding:'9px 20px', background: C.acc, border:'none',
                      borderRadius:7, color:'#fff', fontWeight:700, fontSize:13,
                      cursor: addingDomain ? 'not-allowed' : 'pointer',
                      fontFamily:'inherit', opacity: addingDomain ? 0.7 : 1 }}>
                    {addingDomain ? 'Adding…' : 'Add Domain'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Env Vars Tab ── */}
      {tab === 'env' && (
        <div>
          {!siteExists && (
            <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13,
              background:C.card, border:`1px solid ${C.border}`, borderRadius:12 }}>
              Create a Netlify site in the Site tab first.
            </div>
          )}

          {siteExists && (
            <>
              {/* Header row */}
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Environment Variables</div>
                  <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>
                    Variables are injected at build time. Save changes then rebuild to apply them.
                  </div>
                </div>
                <button onClick={loadEnvVars} disabled={loadingEnv}
                  style={{ padding:'7px 14px', background:'transparent',
                    border:`1px solid ${C.border2}`, borderRadius:7,
                    color: loadingEnv ? C.t3 : C.t2, fontSize:12,
                    cursor: loadingEnv ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  {loadingEnv ? 'Loading…' : '↻ Refresh'}
                </button>
              </div>

              {/* Existing variables */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                {/* Column headers */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 48px',
                  padding:'8px 16px', background:'#0A0F1A',
                  borderBottom:`1px solid ${C.border}`,
                  fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  <span>Key</span><span>Value</span><span></span>
                </div>

                {loadingEnv ? (
                  <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                    Loading variables…
                  </div>
                ) : envVars.length === 0 ? (
                  <div style={{ padding:24, textAlign:'center', color:C.t3, fontSize:13 }}>
                    No variables found. Add one below.
                  </div>
                ) : envVars.map((v, i) => (
                  <div key={v.key} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 48px',
                    padding:'8px 12px', alignItems:'center',
                    borderBottom: i < envVars.length - 1 ? `1px solid ${C.border}20` : 'none',
                    gap:8 }}>
                    <code style={{ fontSize:12, color:C.cyan, fontFamily:'monospace',
                      background:'#0A0F1A', padding:'5px 8px', borderRadius:4 }}>
                      {v.key}
                    </code>
                    <input
                      value={v.value}
                      onChange={e => setEnvVars(prev => prev.map(x =>
                        x.key === v.key ? { ...x, value: e.target.value } : x))}
                      style={{ padding:'5px 8px', fontSize:12, background:C.input,
                        border:`1px solid ${C.border}`, borderRadius:5, color:C.t0,
                        fontFamily:'monospace', outline:'none', width:'100%', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor = C.acc}
                      onBlur={e  => e.target.style.borderColor = C.border}
                    />
                    <button onClick={() => deleteEnvVarFn(v.key)}
                      disabled={deletingEnvKey === v.key}
                      title="Delete variable"
                      style={{ width:32, height:32, display:'flex', alignItems:'center',
                        justifyContent:'center', background:'transparent',
                        border:`1px solid ${C.border}`, borderRadius:5,
                        color: deletingEnvKey === v.key ? C.t3 : '#EF4444',
                        cursor: deletingEnvKey === v.key ? 'not-allowed' : 'pointer',
                        fontSize:14, fontFamily:'inherit' }}>
                      {deletingEnvKey === v.key ? '…' : '✕'}
                    </button>
                  </div>
                ))}

                {/* Add new variable row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 48px',
                  padding:'8px 12px', alignItems:'center',
                  borderTop:`1px solid ${C.border}`, gap:8,
                  background:'#0A0F1A08' }}>
                  <input value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)}
                    placeholder="NEW_VARIABLE_KEY"
                    style={{ padding:'5px 8px', fontSize:12, background:C.input,
                      border:`1px solid ${C.border}`, borderRadius:5, color:C.t0,
                      fontFamily:'monospace', outline:'none', width:'100%', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                  <input value={newEnvVal} onChange={e => setNewEnvVal(e.target.value)}
                    placeholder="value"
                    style={{ padding:'5px 8px', fontSize:12, background:C.input,
                      border:`1px solid ${C.border}`, borderRadius:5, color:C.t0,
                      fontFamily:'monospace', outline:'none', width:'100%', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                  <div style={{ width:32, height:32, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:18, color:C.t3 }}>+</div>
                </div>
              </div>

              {/* Status message */}
              {envMsg && (
                <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:7, fontSize:13,
                  background: envMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' :
                              envMsg.startsWith('❌') ? 'rgba(239,68,68,0.1)' :
                              'rgba(245,158,11,0.1)',
                  border:`1px solid ${
                    envMsg.startsWith('✅') ? C.green :
                    envMsg.startsWith('❌') ? '#EF4444' : C.amber}`,
                  color: envMsg.startsWith('✅') ? C.green :
                         envMsg.startsWith('❌') ? '#EF4444' : C.amber }}>
                  {envMsg}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={() => saveEnvVars(false)} disabled={savingEnv}
                  style={{ padding:'10px 22px', background: savingEnv ? C.card : C.acc,
                    border:'none', borderRadius:8, color:'#fff', fontWeight:700,
                    fontSize:13, cursor: savingEnv ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', opacity: savingEnv ? 0.7 : 1 }}>
                  {savingEnv ? 'Saving…' : 'Update Environment Variables'}
                </button>
                <button onClick={() => saveEnvVars(true)} disabled={savingEnv}
                  style={{ padding:'10px 22px', background:'transparent',
                    border:`1px solid ${C.border2}`, borderRadius:8,
                    color:C.t2, fontWeight:600, fontSize:13,
                    cursor: savingEnv ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  Save & Rebuild
                </button>
              </div>

              {/* Info box */}
              <div style={{ marginTop:20, padding:'12px 16px', background:C.card,
                border:`1px solid ${C.border}`, borderRadius:10, fontSize:12, color:C.t3, lineHeight:1.7 }}>
                <strong style={{ color:C.t2 }}>Protected variables</strong> (set automatically):<br/>
                <code style={{ color:C.cyan }}>NEXT_PUBLIC_SITE_ID</code> · <code style={{ color:C.cyan }}>SITE_TEMPLATE</code> · <code style={{ color:C.cyan }}>NEXT_PUBLIC_CMS_API_URL</code>
                <br/>Do not delete these — they are required for the site to function.
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Deploys Tab ── */}
      {tab === 'deploys' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Recent Deploys</div>
            <button onClick={loadDeploys}
              style={{ padding:'7px 16px', background:'transparent',
                border:`1px solid ${C.border2}`, borderRadius:7,
                color:C.t2, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              Refresh
            </button>
          </div>

          {!siteExists && (
            <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13,
              background:C.card, border:`1px solid ${C.border}`, borderRadius:12 }}>
              Create a Netlify site first to see deploy history.
            </div>
          )}

          {siteExists && loadingD && (
            <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
              Loading…
            </div>
          )}

          {siteExists && !loadingD && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'110px 80px 1fr 150px 140px',
                padding:'8px 16px', background:'#0A0F1A',
                borderBottom:`1px solid ${C.border}`,
                fontSize:11, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'0.05em' }}>
                <span>Status</span><span>Duration</span><span>Branch / ID</span><span>Time</span><span>Actions</span>
              </div>
              {deploys.length === 0 ? (
                <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
                  No deploys yet — click Build &amp; Deploy in the Site tab.
                </div>
              ) : deploys.map((d, i) => {
                const col = { ready:C.green, building:C.amber,
                  error:'#EF4444', failed:'#EF4444' }[d.state] || C.t3
                const adminUrl = form.siteId
                  ? `https://app.netlify.com/sites/${form.siteId}/deploys/${d.id}`
                  : null
                return (
                  <div key={d.id || i} style={{ display:'grid',
                    gridTemplateColumns:'110px 80px 1fr 150px 140px',
                    padding:'10px 16px', alignItems:'center', gap:8,
                    borderBottom: i < deploys.length-1
                      ? `1px solid ${C.border}20` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background=C.hover}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <span style={{ fontSize:11, fontWeight:700, color:col,
                      background:col+'20', padding:'2px 8px',
                      borderRadius:4, display:'inline-block', whiteSpace:'nowrap' }}>
                      {d.state || 'unknown'}
                    </span>
                    <span style={{ fontSize:11, color:C.t3 }}>
                      {d.deploy_time ? `${d.deploy_time}s` : '—'}
                    </span>
                    <div>
                      <div style={{ fontSize:12, color:C.t1 }}>{d.branch || 'main'}</div>
                      <div style={{ fontSize:10, color:C.t3, fontFamily:'monospace', marginTop:2 }}>
                        {d.id ? d.id.slice(0,8) : '—'}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:C.t3 }}>
                      {d.created_at
                        ? new Date(d.created_at).toLocaleString('en-AU',
                            { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                        : '—'}
                    </span>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      {adminUrl && (
                        <a href={adminUrl} target="_blank" rel="noreferrer"
                          title="View build logs"
                          style={{ padding:'4px 10px', background:'transparent',
                            border:`1px solid ${C.border2}`, borderRadius:5,
                            color:C.t2, fontSize:11, textDecoration:'none',
                            whiteSpace:'nowrap' }}>
                          Logs ↗
                        </a>
                      )}
                      {d.state === 'ready' && i > 0 && (
                        <button
                          onClick={() => rollback(d.id)}
                          disabled={rollingBack === d.id}
                          title="Rollback to this deploy"
                          style={{ padding:'4px 10px', background:'transparent',
                            border:`1px solid ${C.amber}`, borderRadius:5,
                            color: rollingBack === d.id ? C.t3 : C.amber,
                            fontSize:11, cursor: rollingBack === d.id ? 'not-allowed' : 'pointer',
                            fontFamily:'inherit', whiteSpace:'nowrap' }}>
                          {rollingBack === d.id ? '…' : '↩ Rollback'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {(form.previewUrl || form.primaryDomain) && (
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              {form.previewUrl && (
                <a href={form.previewUrl} target="_blank" rel="noreferrer"
                  style={{ padding:'8px 16px', background:'transparent',
                    border:`1px solid ${C.border2}`, borderRadius:7,
                    color:C.t2, fontSize:12, textDecoration:'none' }}>
                  Open Preview ↗
                </a>
              )}
              {form.primaryDomain && (
                <a href={`https://${form.primaryDomain}`} target="_blank" rel="noreferrer"
                  style={{ padding:'8px 16px', background:C.acc, border:'none',
                    borderRadius:7, color:'#fff', fontSize:12,
                    textDecoration:'none', fontWeight:700 }}>
                  Open Live Site ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}



