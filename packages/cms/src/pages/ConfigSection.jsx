import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, saveConfig } from '../api/config'
import { useState, useEffect } from 'react'
import { deployClient, getDeploys, createNetlifySite, getNetlifyDeploys } from '../api/deployment'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', green:'#22C55E', amber:'#F59E0B', input:'#111827'
}

// Sidebar groups — matching prototype CONFIG_SIDEBAR exactly
const SIDEBAR = [
  { group:'Restaurant Settings', icon:'', items:[
    { key:'site-settings',  label:'Site Settings'  },
    { key:'site-notes',     label:'Site Notes'     },
    { key:'analytics',      label:'Analytics'      },
    { key:'site-branding',  label:'Site Branding'  },
    { key:'shortcodes',     label:'Shortcodes'     },
  ]},
  { group:'Content Settings', icon:'', items:[
    { key:'themes',         label:'Themes'         },
    { key:'header-config',  label:'Header'         },
    { key:'reviews',        label:'Reviews'        },
    { key:'booking',        label:'Booking'        },
  ]},
  { group:'Publishing', icon:'', items:[
    { key:'netlify',        label:'Netlify Setup'  },
    { key:'deploy',         label:'Deploy'         },
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
  const [activeKey, setActiveKey] = useState('site-settings')
  const [collapsed, setCollapsed] = useState({})
  const [client,    setClient]    = useState(null)   // ← moved inside

  useEffect(() => {                                   // ← moved inside
    fetch(`http://localhost:3001/api/clients/${clientId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
    }).then(r => r.json()).then(setClient).catch(() => {})
  }, [clientId])

  const { data: config = {} } = useQuery({
    queryKey: ['config', clientId],
    queryFn: () => getConfig(clientId)
  })

  const renderConfig = () => {
  switch(activeKey) {
    case 'site-settings':  return <SiteSettings   clientId={clientId} config={config} client={client} />
    case 'site-notes':     return <SiteNotes       clientId={clientId} config={config} />
    case 'analytics':      return <AnalyticsConfig clientId={clientId} config={config} />
    case 'site-branding':  return <BrandingConfig  clientId={clientId} config={config} />
    case 'shortcodes':     return <ShortcodesConfig clientId={clientId} config={config} client={client} />
    case 'themes':         return <ThemesConfig    clientId={clientId} config={config} />
    case 'header-config':  return <HeaderConfig    clientId={clientId} config={config} onNavigate={setActiveKey} />
    case 'reviews':        return <ReviewsConfig   clientId={clientId} config={config} />
    case 'booking':        return <BookingConfig   clientId={clientId} config={config} />
    case 'netlify':        return <NetlifyConfig   clientId={clientId} config={config} />
    case 'deploy':         return <DeployConfig    clientId={clientId} config={config} />
    default: return <div style={{color:C.t3}}>Coming soon.</div>
  }
}

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
      {/* Config sidebar */}
      <div style={{ width:210, minWidth:210, background:C.panel,
        borderRight:`1px solid ${C.border}`, overflowY:'auto' }}>
        {SIDEBAR.map(grp => (
          <div key={grp.group}>
            <button onClick={() => setCollapsed(p => ({...p, [grp.group]: !p[grp.group]}))}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                width:'100%', padding:'10px 14px', background:'none', border:'none',
                borderBottom:`1px solid ${C.border}`, cursor:'pointer',
                color:C.t3, fontSize:11, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'0.07em', fontFamily:'inherit' }}>
              <span>{grp.icon} {grp.group}</span>
              <span style={{ fontSize:10 }}>{collapsed[grp.group] ? '▶' : '▼'}</span>
            </button>
            {!collapsed[grp.group] && grp.items.map(item => (
              <button key={item.key} onClick={() => setActiveKey(item.key)}
                style={{ display:'flex', alignItems:'center', width:'100%',
                  padding:'8px 14px 8px 20px', border:'none',
                  background: activeKey===item.key ? '#1F2D4A' : 'transparent',
                  color: activeKey===item.key ? C.t0 : C.t2,
                  fontWeight: activeKey===item.key ? 700 : 400,
                  fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                  borderLeft:`2px solid ${activeKey===item.key ? C.acc : 'transparent'}` }}>
                {item.label}
              </button>
            ))}
          </div>
        ))}
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

function SiteSettings({ clientId, config, client }) {
  const qc = useQueryClient()
  const [form,   setForm]   = useState(config.settings || {})
  const [errors, setErrors] = useState({})
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(client?.groupId || '')

  useEffect(() => {
  setSelectedGroupId(client?.groupId || '')
}, [client])

  useEffect(() => { setForm(config.settings || {}) }, [config])

  useEffect(() => {
    fetch('http://localhost:3001/api/groups', {
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
      await fetch(`http://localhost:3001/api/clients/${clientId}`, {
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
    fetch(`http://localhost:3001/api/clients/${clientId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
    }).then(r => r.json()).then(d => {
      window.dispatchEvent(new CustomEvent('client-updated', {
  detail: {
    id:     clientId,
    name:   form.restaurantName || d.name,
    status: form.indexing === 'allowed' ? 'live' : 'draft',
  }
}))
    }).catch(() => {})
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
        Core details for this restaurant.
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
function SiteNotes({ clientId, config }) {
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

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      notes: {
        general: generalEditor?.getHTML() || '',
        stock:   stockEditor?.getHTML()   || '',
      }
    }),
    onSuccess: () => qc.invalidateQueries(['config', clientId])
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

    // Upload to R2 in background and replace src when done
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('dd_token')
    try {
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      })
      const data = await res.json()
      if (data.url) {
        // Replace the local blob URL with the real R2 URL in the HTML
        const current = editor?.getHTML() || ''
        const updated = current.replace(localUrl, data.url)
        editor?.commands.setContent(updated, false)
      }
    } catch {
      // R2 not set up — local preview stays, will need to re-upload later
      console.warn('R2 upload failed — image shown as local preview only')
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
function AnalyticsConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [form,   setForm]   = useState(config.analytics || {})
  const [errors, setErrors] = useState({})

  useEffect(() => { setForm(config.analytics || {}) }, [config])

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
    onSuccess:  () => qc.invalidateQueries(['config', clientId])
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

  const upload = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') },
        body: formData
      })
      const data = await res.json()
      if (data.url) onChange(data.url)
      else setError('Upload failed — check R2 settings')
    } catch {
      setError('Upload failed — check R2 settings')
    } finally {
      setUploading(false)
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
        onClick={openPicker}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          upload(e.dataTransfer.files[0])
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
        <div>
          <div style={{ fontSize:13, color: dragging ? C.acc : C.t1, fontWeight:600 }}>
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Click to upload or drag & drop'}
          </div>
          <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>
            {accept === '.svg' ? 'SVG only' : 'PNG, JPG, WEBP — max 5MB'}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding:'8px 18px', background:'#1A0505',
          borderTop:'1px solid #EF444430',
          fontSize:12, color:'#EF4444' }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ── Branding Config ──────────────────────────────────────────
function BrandingConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(config.settings || {})

  useEffect(() => { setForm(config.settings || {}) }, [config])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const mutation = useMutation({
  mutationFn: () => saveConfig(clientId, { settings: form }),
  onSuccess: () => {
    qc.invalidateQueries(['config', clientId])
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
function ShortcodesConfig({ clientId, config, client }) {
  const qc = useQueryClient()
  const [form,      setForm]      = useState({})
  const [overrides, setOverrides] = useState({})
  const [groups,    setGroups]    = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('dd_token')
    const h = { Authorization: 'Bearer ' + token }
    fetch('http://localhost:3001/api/groups', { headers: h })
      .then(r => r.json()).then(d => setGroups(Array.isArray(d) ? d : [])).catch(() => {})
    fetch(`http://localhost:3001/api/clients/${clientId}/locations`, { headers: h })
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
      suburb:         settings.suburb         || '',
      state:          '',  // TODO — add state field to location form
      phone:          primary?.phone          || settings.phone || '',
      primaryEmail:   settings.defaultEmail   || '',
      abn:            settings.abn            || '',
    }

    // Saved overrides win over auto
    setForm({ ...auto, ...savedOver })
    setOverrides(savedOver)
  }, [config, groups, locations, client])

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
      suburb:         settings.suburb       || '',
      state:          '',
      phone:          primary?.phone        || settings.phone || '',
      primaryEmail:   settings.defaultEmail || '',
      abn:            settings.abn          || '',
    }
    setForm(p => ({...p, [key]: auto[key] || ''}))
  }

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      shortcodes: { ...form, _overrides: overrides }
    }),
    onSuccess: () => qc.invalidateQueries(['config', clientId])
  })

  const codes = [
    { key:'restaurantName', label:'Restaurant Name', source:'Site Settings → Display Name'    },
    { key:'group',          label:'Group',           source:'Group assigned in Site Settings'  },
    { key:'address',        label:'Address',         source:'Locations → Primary location'    },
    { key:'suburb',         label:'Suburb',          source:'Site Settings → Suburb'           },
    { key:'state',          label:'State',           source:'Locations — add later'            },
    { key:'phone',          label:'Phone',           source:'Locations → Primary location'    },
    { key:'primaryEmail',   label:'Email',           source:'Site Settings → Email'            },
    { key:'abn',            label:'ABN',             source:'Site Settings → ABN'              },
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
          <span>Source</span>
          <span>Value</span>
          <span></span>
        </div>

        {codes.map((c, i) => {
          const isOverridden = overrides[c.key] !== undefined
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

              <span style={{ fontSize:11, color: isOverridden ? C.acc : C.t3 }}>
                {isOverridden ? 'Manually overridden' : c.source}
              </span>

              <input
                value={form[c.key] || ''}
                onChange={e => handleChange(c.key, e.target.value)}
                placeholder={c.key === 'state' ? 'Add state field to locations first' : `Auto — ${c.source}`}
                disabled={c.key === 'state' && !overrides['state']}
                style={{ padding:'7px 10px', fontSize:13, background:C.input,
                  border:`1px solid ${isOverridden ? C.acc+'60' : C.border}`,
                  borderRadius:7,
                  color: c.key === 'state' && !overrides['state'] ? C.t3 : isOverridden ? C.t0 : C.t1,
                  fontFamily:'inherit', outline:'none',
                  width:'100%', boxSizing:'border-box',
                  opacity: c.key === 'state' && !overrides['state'] ? 0.5 : 1 }}
                onFocus={e => { if (c.key !== 'state' || overrides['state']) e.target.style.borderColor = C.acc }}
                onBlur={e  => e.target.style.borderColor = isOverridden ? C.acc+'60' : C.border}
              />

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

// ── Theme previews ───────────────────────────────────────────
const THEMES = [
  {
    key:   'none',
    label: 'None',
    desc:  'Build your own styles from scratch using Theme Colours below',
    preview: null,
    defaults: { primary:'#FF6B2B', secondary:'#1C2B1A', headerBg:'#ffffff',
                headerText:'#1A1A1A', navBg:'#1C2B1A', navText:'#ffffff',
                bodyBg:'#ffffff', bodyText:'#1A1A1A',
                ctaBg:'#FF6B2B', ctaText:'#ffffff', accentBg:'#F5F0EA' }
  },
  {
    key:   'urban-bistro',
    label: 'Urban Bistro',
    desc:  'Warm modern Australian — earthy tones, clean layout',
    defaults: { primary:'#C8823A', secondary:'#1C2B1A', headerBg:'#ffffff',
                headerText:'#1A1A1A', navBg:'#1C2B1A', navText:'#ffffff',
                bodyBg:'#ffffff', bodyText:'#1A1A1A',
                ctaBg:'#C8823A', ctaText:'#ffffff', accentBg:'#F7F2EA' }
  },
  {
    key:   'noir-fine-dine',
    label: 'Noir Fine Dine',
    desc:  'Dark luxury editorial — gold accents, dramatic contrast',
    defaults: { primary:'#D4AF37', secondary:'#0A0A0A', headerBg:'#0A0A0A',
                headerText:'#ffffff', navBg:'#111111', navText:'#D4AF37',
                bodyBg:'#0A0A0A', bodyText:'#E0E0E0',
                ctaBg:'#D4AF37', ctaText:'#0A0A0A', accentBg:'#1A1A1A' }
  },
  {
    key:   'garden-fresh',
    label: 'Garden Fresh',
    desc:  'Bright clean plant-forward — sage greens, light and airy',
    defaults: { primary:'#4A7C59', secondary:'#F0F7F1', headerBg:'#ffffff',
                headerText:'#1A1A1A', navBg:'#4A7C59', navText:'#ffffff',
                bodyBg:'#F8FBF8', bodyText:'#1A1A1A',
                ctaBg:'#4A7C59', ctaText:'#ffffff', accentBg:'#E8F5EC' }
  },
]

const COLOUR_GROUPS = [
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
    { key:'bodyText',    label:'Body Text'         },
    { key:'accentBg',    label:'Accent Background' },
  ]},
  { section:'CTAs',       fields:[
    { key:'ctaBg',       label:'Button Background' },
    { key:'ctaText',     label:'Button Text'       },
  ]},
]

function ThemesConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [saved,    setSaved]    = useState(false)
  const [tab,      setTab]      = useState('selection')
  const [selected, setSelected] = useState(config.colours?.theme || 'none')
  const [colours,  setColours]  = useState(() => {
    const c     = config.colours || {}
    const theme = THEMES.find(t => t.key === (c.theme || 'none')) || THEMES[0]
    return { ...theme.defaults, ...c }
  })

  useEffect(() => {
    if (config.colours) {
      const c     = config.colours
      const theme = THEMES.find(t => t.key === (c.theme || 'none')) || THEMES[0]
      setSelected(c.theme || 'none')
      setColours({ ...theme.defaults, ...c })
    }
  }, [config])

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      colours: { ...colours, theme: selected }
    }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
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
      {saved && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
    </div>
  )

  return (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
        Themes
      </h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:C.t3 }}>
        Choose a theme and customise the colours for this restaurant site.
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
                  onClick={() => selectTheme(theme.key)}
                  style={{ background:C.card,
                    border:`2px solid ${isSelected ? C.acc : C.border}`,
                    borderRadius:12, overflow:'hidden', cursor:'pointer',
                    transition:'border-color 0.15s',
                    boxShadow: isSelected ? `0 0 0 1px ${C.acc}` : 'none' }}>

                  {/* Preview area */}
                  <div style={{ height:160, position:'relative', overflow:'hidden',
                    background: theme.defaults.bodyBg }}>
                    {theme.key === 'none' ? (
                      <div style={{ height:'100%', display:'flex', alignItems:'center',
                        justifyContent:'center', flexDirection:'column', gap:8 }}>
                        <div style={{ width:48, height:48, borderRadius:12,
                          border:`2px dashed ${C.border2}`, display:'flex',
                          alignItems:'center', justifyContent:'center',
                          fontSize:20, color:C.t3 }}>+</div>
                        <span style={{ fontSize:12, color:C.t3 }}>Custom styles</span>
                      </div>
                    ) : (
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
                    )}
                    {isSelected && (
                      <div style={{ position:'absolute', top:8, right:8,
                        width:22, height:22, borderRadius:'50%', background:C.acc,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, color:'#fff', fontWeight:700 }}>✓</div>
                    )}
                  </div>

                  {/* Label */}
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontSize:13, fontWeight:700,
                        color: isSelected ? C.acc : C.t0 }}>
                        {theme.label}
                      </div>
                      {isSelected && (
                        <span style={{ fontSize:10, fontWeight:700, color:C.acc,
                          background:C.accBg, padding:'1px 7px', borderRadius:4,
                          border:`1px solid ${C.acc}40` }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>
                      {theme.desc}
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
            {saved && (
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
                  {group.fields.map(({ key, label }) => (
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="color"
                        value={colours[key] || '#000000'}
                        onChange={e => setColour(key, e.target.value)}
                        style={{ width:40, height:36, border:'none', borderRadius:6,
                          cursor:'pointer', background:'none', flexShrink:0 }}/>
                      <input
                        value={colours[key] || ''}
                        onChange={e => {
                          const v = e.target.value
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColour(key, v)
                        }}
                        maxLength={7}
                        style={{ width:100, padding:'7px 9px', background:C.input,
                          border:`1px solid ${C.border}`, borderRadius:7,
                          color:C.t0, fontSize:12, fontFamily:'monospace',
                          outline:'none', boxSizing:'border-box', flexShrink:0 }}
                        onFocus={e => e.target.style.borderColor = C.acc}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                      <span style={{ fontSize:13, color:C.t1 }}>{label}</span>
                      <div style={{ width:28, height:28, borderRadius:6, flexShrink:0,
                        background: colours[key] || '#000',
                        border:`1px solid ${C.border2}`, marginLeft:'auto' }}/>
                    </div>
                  ))}
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

              <div style={{ background: colours.secondary || '#1C2B1A',
                padding:'20px 14px' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:6 }}>
                  Welcome to Our Restaurant
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                  Fresh ingredients, crafted with care
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
  { key:'reviews',      label:'Reviews',      editKey:'reviews'  },
  { key:'header-ctas',  label:'Header CTAs',  editKey:null       },
  { key:'locations',    label:'Locations',    editKey:null, cmsNav:true },
  { key:'social-links', label:'Social Links', editKey:null, cmsNav:true },
]

function HeaderConfig({ clientId, config, onNavigate }) {
  const qc      = useQueryClient()
  const [saved,  setSaved]  = useState(false)
  const [tab,    setTab]    = useState('header')
  const [form,   setForm]   = useState(config.header || {
    type:        'standard-full',
    utilityBelt: true,
    utilityItems:{ reviews:true, 'header-ctas':true, locations:true, 'social-links':true },
    headerTheme: 'not-set',
  })
  const [ctas,   setCtas]   = useState(config.headerCtas || [])
  const [ctaModal, setCtaModal] = useState(null) // null | 'new' | { ...cta }

  useEffect(() => {
    if (config.header)     setForm(config.header)
    if (config.headerCtas) setCtas(config.headerCtas)
  }, [config])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  const setUtil = (k, v) => setForm(p => ({
    ...p, utilityItems: {...(p.utilityItems||{}), [k]: v}
  }))

  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, {
      header:     form,
      headerCtas: ctas,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['config', clientId])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  })

  // ── CTA helpers ──
  const saveCta = (cta) => {
    if (cta.id) {
      setCtas(prev => prev.map(c => c.id === cta.id ? cta : c))
    } else {
      setCtas(prev => [...prev, { ...cta, id: Date.now().toString(), active: true }])
    }
    setCtaModal(null)
  }

  const deleteCta = (id) => {
    if (!window.confirm('Delete this CTA?')) return
    setCtas(prev => prev.filter(c => c.id !== id))
  }

  const toggleCta = (id) => {
    setCtas(prev => prev.map(c => c.id === id ? {...c, active: !c.active} : c))
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
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t3,
                  textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                  Utility Belt Components
                </div>
                <div style={{ background:C.panel, border:`1px solid ${C.border}`,
                  borderRadius:9, overflow:'hidden' }}>
                  {/* Table header */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 60px',
                    padding:'7px 14px', background:'#0A0F1A',
                    borderBottom:`1px solid ${C.border}`,
                    fontSize:11, fontWeight:700, color:C.t3,
                    textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    <span>Component</span>
                    <span>Active</span>
                    <span>Edit</span>
                    <span></span>
                  </div>
                  {UTILITY_ITEMS.map((item, i) => {
                    const isOn = form.utilityItems?.[item.key] !== false
                    return (
                      <div key={item.key}
                        style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 60px',
                          padding:'11px 14px', alignItems:'center',
                          borderBottom: i < UTILITY_ITEMS.length-1
                            ? `1px solid ${C.border}20` : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background=C.hover}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.t0 }}>
                          {item.label}
                        </span>
                        {/* Toggle */}
                        <div onClick={() => setUtil(item.key, !isOn)}
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
                          onClick={() => {
                            if (item.editKey) {
                              onNavigate(item.editKey)
                            } else if (item.key === 'header-ctas') {
                              setTab('ctas')
                            } else if (item.cmsNav) {
                              // Dispatch event to switch to CMS tab
                              window.dispatchEvent(new CustomEvent('cms-navigate', {
                                detail: { section: item.key }
                              }))
                            }
                          }}
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
            {saved && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
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

            {ctas.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:C.t3, fontSize:13 }}>
                No CTAs yet. Click + Add CTA to create one.
              </div>
            ) : ctas.map((cta, i) => (
              <div key={cta.id}
                style={{ display:'grid',
                  gridTemplateColumns:'1fr 130px 180px 70px 70px 60px',
                  padding:'11px 16px', alignItems:'center',
                  borderBottom: i < ctas.length-1 ? `1px solid ${C.border}15` : 'none' }}
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
            {saved && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Saved</span>}
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
function ReviewsConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [f, setF] = useState(config.reviews || {})
  useEffect(() => { setF(config.reviews || {}) }, [config])
  const s = (k, v) => setF(p => ({...p, [k]: v}))
  const sr = (idx, field, val) => {
    const arr = [...(f.items || [{},{},{}])]
    arr[idx] = {...arr[idx], [field]: val}
    setF(p => ({...p, items: arr}))
  }
  const mut = useMutation({
    mutationFn: () => saveConfig(clientId, { reviews: f }),
    onSuccess:  () => qc.invalidateQueries(['config', clientId])
  })

  const items = f.items || [{},{},{}]

  return (
    <div>
      <h2 style={{margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0}}>Reviews Settings</h2>

      <div style={{fontSize:12,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Overall Scores</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:24}}>
        <Inp label="Overall Score"      value={f.overallScore}   onChange={e=>s('overallScore',e.target.value)}   placeholder="e.g. 4.8"/>
        <Inp label="Total Reviews"     value={f.totalReviews}   onChange={e=>s('totalReviews',e.target.value)}   placeholder="e.g. 312"/>
        <Inp label="Google Score"       value={f.googleScore}    onChange={e=>s('googleScore',e.target.value)}    placeholder="e.g. 4.8"/>
        <Inp label="Google Count"       value={f.googleCount}    onChange={e=>s('googleCount',e.target.value)}    placeholder="e.g. 198"/>
        <Inp label="TripAdvisor Score"  value={f.tripScore}      onChange={e=>s('tripScore',e.target.value)}      placeholder="e.g. 4.7"/>
        <Inp label="TripAdvisor Count"  value={f.tripCount}      onChange={e=>s('tripCount',e.target.value)}      placeholder="e.g. 87"/>
        <Inp label="Facebook Score"     value={f.fbScore}        onChange={e=>s('fbScore',e.target.value)}        placeholder="e.g. 4.9"/>
        <Inp label="Facebook Count"     value={f.fbCount}        onChange={e=>s('fbCount',e.target.value)}        placeholder="e.g. 27"/>
        <Inp label="Leave Review URL"   value={f.leaveReviewUrl} onChange={e=>s('leaveReviewUrl',e.target.value)} placeholder="https://g.page/r/..."/>
      </div>

      <div style={{fontSize:12,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:16}}>Review Cards (shown on website — add up to 3)</div>
      {items.slice(0,3).map(function(item, idx) { return (
        <div key={idx} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:10}}>Review #{idx+1}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Inp label="Reviewer Name" value={item.name}   onChange={e=>sr(idx,'name',e.target.value)}   placeholder="e.g. Sarah L."/>
            <Inp label="Stars (1-5)"    value={item.stars}  onChange={e=>sr(idx,'stars',e.target.value)}  placeholder="5"/>
            <Inp label="Date"           value={item.date}   onChange={e=>sr(idx,'date',e.target.value)}   placeholder="e.g. 2 weeks ago"/>
            <Inp label="Platform"       value={item.source} onChange={e=>sr(idx,'source',e.target.value)} placeholder="Google / TripAdvisor"/>
          </div>
          <textarea value={item.text||''} onChange={e=>sr(idx,'text',e.target.value)} rows={3}
            placeholder="The review text shown on the website..."
            style={{width:'100%',padding:'8px 11px',fontSize:13,background:'#111827',
              border:`1px solid ${C.border}`,borderRadius:7,color:C.t0,
              fontFamily:'inherit',resize:'vertical',outline:'none',marginTop:10}}/>
        </div>
      )})}

      <SaveBtn onClick={()=>mut.mutate()} saving={mut.isPending}/>
    </div>
  )
}

// ── Booking Config ────────────────────────────────────────────
function BookingConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [f, setF] = useState(config.booking || {})
  useEffect(() => { setF(config.booking || {}) }, [config])
  const s = (k, v) => setF(p => ({...p, [k]: v}))
  const mut = useMutation({
    mutationFn: () => saveConfig(clientId, { booking: f }),
    onSuccess:  () => qc.invalidateQueries(['config', clientId])
  })

  return (
    <div>
      <h2 style={{margin:'0 0 16px',fontSize:17,fontWeight:700,color:C.t0}}>Booking Settings</h2>
      <div style={{background:C.card,borderLeft:'3px solid #00D4FF',padding:'9px 14px',borderRadius:'0 7px 7px 0',fontSize:12,color:C.t2,marginBottom:20}}>
        Set ONE booking method. The website will use whichever field you fill in, in this order: Booking URL first, then phone.
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:560}}>
        <Inp label="Booking URL (OpenTable / ResDiary / Quandoo / custom)"
          value={f.bookingUrl} onChange={e=>s('bookingUrl',e.target.value)} mono
          hint="External link opened when customer clicks Book a Table"
          placeholder="https://www.opentable.com.au/..."/>
        <Inp label="Phone Booking Number"
          value={f.bookingPhone} onChange={e=>s('bookingPhone',e.target.value)}
          placeholder="+61 3 9123 4567"/>
        <Inp label="Book Button Label"
          value={f.bookLabel} onChange={e=>s('bookLabel',e.target.value)}
          placeholder="Book a Table" hint="Text shown on the booking CTA button"/>
        <Inp label="Order Online URL"
          value={f.orderUrl} onChange={e=>s('orderUrl',e.target.value)} mono
          hint="DoorDash / UberEats / your own ordering system"
          placeholder="https://www.ubereats.com/..."/>
        <Inp label="Order Button Label"
          value={f.orderLabel} onChange={e=>s('orderLabel',e.target.value)}
          placeholder="Order Online"/>
      </div>
      <SaveBtn onClick={()=>mut.mutate()} saving={mut.isPending}/>
    </div>
  )
}

// ── Netlify Config ───────────────────────────────────────────
function NetlifyConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(config.netlify || {})
  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  useEffect(() => { setForm(config.netlify||{}) }, [config])
  const mutation = useMutation({
    mutationFn: () => saveConfig(clientId, { netlify: form }),
    onSuccess: () => qc.invalidateQueries(['config', clientId])
  })

  return (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:700, color:C.t0 }}>Netlify Setup</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:560 }}>
        <Inp label="Netlify Site ID" value={form.siteId} mono
          placeholder="e.g. abc-def-123"
          onChange={e => set('siteId', e.target.value)} />
        <Inp label="Build Hook URL" value={form.buildHook} mono
          placeholder="https://api.netlify.com/build_hooks/..."
          hint="Netlify → Site Settings → Build Hooks → copy URL here"
          onChange={e => set('buildHook', e.target.value)} />
        <Inp label="Live Site URL" value={form.siteUrl} mono
          placeholder="https://yourrestaurant.com.au"
          onChange={e => set('siteUrl', e.target.value)} />
      </div>

      <div style={{marginTop:16}}>
        <label style={{fontSize:11,fontWeight:700,color:C.t3,textTransform:'uppercase',
          letterSpacing:'0.06em',display:'block',marginBottom:8}}>Site Template</label>
        <select value={form.template||'urban-bistro'} onChange={e=>set('template',e.target.value)}
          style={{padding:'9px 11px',fontSize:13,background:'#111827',border:`1px solid ${C.border}`,
            borderRadius:7,color:C.t0,fontFamily:'inherit',outline:'none',width:'100%',maxWidth:560}}>
          <option value="urban-bistro">🍽️ Urban Bistro — Warm modern Australian</option>
          <option value="noir-fine-dine">🥂 Noir Fine Dine — Dark luxury editorial</option>
          <option value="garden-fresh">🌿 Garden Fresh — Bright clean plant-forward</option>
        </select>
        <span style={{fontSize:11,color:C.t3,marginTop:5,display:'block'}}>
          Changes template on next Deploy Live
        </span>
      </div>

      <SaveBtn onClick={() => mutation.mutate()} saving={mutation.isPending} />
    </div>
  )
}

function DeployConfig({ clientId, config }) {
  const qc = useQueryClient()
  const [deployResult, setDeployResult] = useState(null)
  const [creating,     setCreating]     = useState(false)
  const [createResult, setCreateResult] = useState(null)

  const netlifyConfig = config.netlify || {}

  // Deploy history from our own database
  const { data: deploys = [] } = useQuery({
    queryKey: ['deploys', clientId],
    queryFn:  () => getDeploys(clientId),
    refetchInterval: deployResult === 'triggering' ? 5000 : false
  })

  // Trigger deploy mutation
  const deployMutation = useMutation({
    mutationFn: () => deployClient(clientId),
    onMutate:   () => setDeployResult('triggering'),
    onSuccess:  () => {
      setDeployResult('success')
      qc.invalidateQueries(['deploys', clientId])
    },
    onError: (err) => setDeployResult('error:' + (err.response?.data?.error || err.message))
  })

  // Create Netlify site mutation
  const createMutation = useMutation({
    mutationFn: () => createNetlifySite(clientId),
    onMutate:   () => { setCreating(true); setCreateResult(null) },
    onSuccess:  (data) => {
      setCreating(false)
      setCreateResult('✅ Netlify site created! Site ID: ' + data.id)
      qc.invalidateQueries(['config', clientId])
    },
    onError: (err) => {
      setCreating(false)
      setCreateResult('❌ ' + (err.response?.data?.error || err.message))
    }
  })

  const C2 = { panel:'#0E1420',card:'#141C2E',border:'#1E2D4A',t0:'#F1F5FF',t1:'#B8C5E0',t2:'#7A8BAD',t3:'#445572',acc:'#FF6B2B',green:'#22C55E',amber:'#F59E0B',red:'#EF4444' }

  return (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:700, color:C2.t0 }}>Deploy Live</h2>

      {/* Info box */}
      <div style={{ background:C2.card, borderLeft:'3px solid #00D4FF', padding:'9px 14px',
        borderRadius:'0 7px 7px 0', fontSize:12, color:C2.t2, marginBottom:20 }}>
        Clicking Deploy Live sends a webhook to Netlify which triggers a full site rebuild.
        The live site updates within 30–90 seconds.
      </div>

      {/* Site details row */}
      {netlifyConfig.siteUrl && (
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20,
          padding:'12px 16px', background:C2.card, border:`1px solid ${C2.border}`, borderRadius:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C2.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Live URL</div>
            <a href={netlifyConfig.siteUrl} target="_blank" rel="noreferrer"
              style={{ fontSize:13, color:'#00D4FF', fontFamily:'monospace' }}>
              {netlifyConfig.siteUrl}
            </a>
          </div>
          {netlifyConfig.siteId && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C2.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Site ID</div>
              <span style={{ fontSize:12, color:C2.t2, fontFamily:'monospace' }}>{netlifyConfig.siteId}</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>

        {/* Deploy Live button */}
        <button
          onClick={() => { setDeployResult(null); deployMutation.mutate() }}
          disabled={deployMutation.isPending || !netlifyConfig.buildHook}
          style={{ padding:'12px 28px',
            background: deployMutation.isPending ? C2.card : '#1A3FAB',
            border:'1px solid #3B6FF0', borderRadius:8, color:'#fff',
            fontWeight:700, fontSize:14, fontFamily:'inherit',
            cursor: (deployMutation.isPending || !netlifyConfig.buildHook) ? 'not-allowed' : 'pointer',
            opacity: !netlifyConfig.buildHook ? 0.5 : 1 }}>
          {deployMutation.isPending ? '⏳ Deploying...' : '🚀 Deploy Live'}
        </button>

        {/* Create Netlify Site button — shown when no site ID yet */}
        {!netlifyConfig.siteId && (
          <button
            onClick={() => createMutation.mutate()}
            disabled={creating}
            style={{ padding:'12px 22px', background:'transparent',
              border:`1px solid ${C2.border}`, borderRadius:8, color:C2.t1,
              fontWeight:600, fontSize:13, fontFamily:'inherit',
              cursor: creating ? 'not-allowed' : 'pointer' }}>
            {creating ? 'Creating...' : '+ Create Netlify Site'}
          </button>
        )}
      </div>

      {/* No build hook warning */}
      {!netlifyConfig.buildHook && (
        <div style={{ background:'#1C1000', border:`1px solid ${C2.amber}40`,
          borderRadius:8, padding:'11px 16px', marginBottom:16, fontSize:13, color:C2.amber }}>
          ⚠️ No build hook URL saved. Go to Config → Netlify Setup and paste your Build Hook URL first.
        </div>
      )}

      {/* Deploy result message */}
      {deployResult && deployResult !== 'triggering' && (
        <div style={{ padding:'11px 16px', borderRadius:8, marginBottom:16,
          background: deployResult === 'success' ? '#052010' : '#1A0505',
          border:`1px solid ${deployResult === 'success' ? C2.green : C2.red}40`,
          fontSize:13,
          color: deployResult === 'success' ? C2.green : C2.red }}>
          {deployResult === 'success'
            ? '✅ Deploy triggered! Check your Netlify dashboard — the build should start within 10 seconds.'
            : deployResult}
        </div>
      )}

      {/* Create site result message */}
      {createResult && (
        <div style={{ padding:'11px 16px', borderRadius:8, marginBottom:16,
          background: createResult.startsWith('✅') ? '#052010' : '#1A0505',
          border:`1px solid ${createResult.startsWith('✅') ? C2.green : C2.red}40`,
          fontSize:13,
          color: createResult.startsWith('✅') ? C2.green : C2.red }}>
          {createResult}
        </div>
      )}

      {/* Deployment history table */}
      {deploys.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C2.t0, marginBottom:10 }}>
            Recent Deployments
          </div>
          <div style={{ background:C2.panel, border:`1px solid ${C2.border}`, borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:C2.card }}>
                  {['Time','Status','Triggered By'].map(h => (
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:C2.t3, borderBottom:`1px solid ${C2.border}`,
                      textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deploys.map((d, i) => (
                  <tr key={d.id}
                    style={{ borderBottom: i < deploys.length-1 ? `1px solid ${C2.border}20` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1A2540'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 14px', fontSize:12, color:C2.t3 }}>
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{
                        background: d.status === 'triggered' ? '#052010' : '#141C2E',
                        color: d.status === 'triggered' ? C2.green : C2.t2,
                        padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:13, color:C2.t1 }}>
                      {d.triggeredBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}