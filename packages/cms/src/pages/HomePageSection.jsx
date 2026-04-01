import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import LoadingSpinner from '../Components/LoadingSpinner'
import { getHomeSections, saveHomeSections } from '../api/homepage.js'
import { C } from '../theme'

// Sidebar tabs for Homepage
const HOMEPAGE_SIDEBAR = [
  { key: 'hero', label: 'Hero Section', icon: '✨' },
  { key: 'promo-tile', label: 'Promo Tiles', icon: '🏷️' },
  { key: 'specials', label: 'Specials Section', icon: '🔥' },
  { key: 'about', label: 'Meet Our Team', icon: '👥' },
  { key: 'locations', label: 'Locations Section', icon: '📍' },
  { key: 'reviews', label: 'Reviews Section', icon: '⭐' },
  { key: 'homepage-banners', label: 'Homepage Banners', icon: '🖼️' },
  { key: 'content', label: 'Content Sections', icon: '📝' }
]

// Reusable Components (from NavbarSection pattern)
const ToggleSwitch = memo(({ checked, onChange, size = 'small', label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: 8,
      background: C.card,
      border: `1px solid ${C.border}`
    }}
  >
    <div
      style={{
        width: size === 'small' ? 36 : 44,
        height: size === 'small' ? 20 : 24,
        borderRadius: size === 'small' ? 10 : 12,
        background: checked ? C.green : C.border,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0
      }}
    >
      <div style={{
        width: size === 'small' ? 14 : 18,
        height: size === 'small' ? 14 : 18,
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: size === 'small' ? 3 : 3,
        left: checked ? (size === 'small' ? 19 : 23) : 3,
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
    {label && <span style={{ fontSize: 13, color: C.t1 }}>{label}</span>}
  </div>
))

const SectionHeader = memo(({ title, icon, onAdd, addLabel = 'Add' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${C.border}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: C.t2,
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>{title}</span>
    </div>
    {onAdd && (
      <button
        onClick={onAdd}
        style={{
          padding: '6px 14px',
          background: C.acc,
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        + {addLabel}
      </button>
    )}
  </div>
))

// Main Homepage Section
export default function HomePageSection({ clientId, activeKey = 'promo-tiles' }) {
  const qc = useQueryClient()
  const [localActiveKey, setLocalActiveKey] = useState(activeKey)

  // Session storage for active tab
  useEffect(() => {
    try {
      sessionStorage.setItem(`homepage_active_${clientId}`, localActiveKey)
    } catch {}
  }, [localActiveKey, clientId])

  // Fetch homepage sections
  const { data: sections, isLoading } = useQuery({
    queryKey: ['homepage', clientId],
    queryFn: () => getHomeSections(clientId),
    staleTime: 60000
  })

  const groupedSections = useMemo(() => {
    const groups = {}
    HOMEPAGE_SIDEBAR.forEach(tab => {
      groups[tab.key] = sections?.filter(s => s.type === tab.key) || []
    })
    return groups
  }, [sections])

  // Save mutation
  const saveHomepage = useMutation({
    mutationFn: (data) => saveHomeSections(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries(['homepage', clientId])
      alert('Homepage saved successfully!')
    }
  })

  const renderTab = () => {
    const currentSections = groupedSections[localActiveKey] || []

    switch(localActiveKey) {
      case 'hero':
        return <HeroTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'promo-tile':
        return <PromoTilesTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'specials':
        return <SpecialsTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'about':
        return <AboutTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'locations':
        return <LocationsTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'reviews':
        return <ReviewsTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'homepage-banners':
        return <HomepageBannersTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      case 'content':
        return <ContentTab sections={currentSections} onSave={saveHomepage.mutate} clientId={clientId} />
      default:
        return <div style={{color:C.t3}}>Select a tab.</div>
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:220, minWidth:220, background:C.panel, borderRight:`1px solid ${C.border}`, overflowY:'auto' }}>
        {HOMEPAGE_SIDEBAR.map(item => (
          <button key={item.key} onClick={() => setLocalActiveKey(item.key)}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'11px 14px', border:'none',
              background: localActiveKey===item.key ? '#1F2D4A' : 'transparent',
              color: localActiveKey===item.key ? C.t0 : C.t2,
              fontWeight: localActiveKey===item.key ? 700 : 400,
              fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
              borderLeft:`2px solid ${localActiveKey===item.key ? C.acc : 'transparent'}` }}>
            <span style={{fontSize:16}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:'28px 36px', overflowY:'auto', background:C.page }}>
        {renderTab()}
      </div>
    </div>
  )
}

// ── Hero Tab ─────────────────────────────────────────────
function HeroTab({ sections, onSave, clientId }) {
  return <GenericSectionTab 
    title="Hero Section" 
    icon="✨" 
    sections={sections} 
    sectionType="hero"
    onSave={onSave} 
    clientId={clientId} 
  />
}

// ── Promo Tiles Tab ──────────────────────────────────────────
function PromoTilesTab({ sections, onSave, clientId }) {
  const section = sections[0] || {
    id: `temp-promo-${Date.now()}`,
    type: 'promo-tile',
    title: "Chef's Recommendations",
    content: JSON.stringify({
      description: 'Hand-picked seasonal delights from our kitchen',
      items: [],
      globalCta: { label: '', link: '' }
    }),
    isActive: true
  }

  const content = useMemo(() => {
    try {
      const parsed = typeof section.content === 'string' ? JSON.parse(section.content) : (section.content || {})
      console.log('[ReviewsTab] Raw section.content:', section.content);
      console.log('[ReviewsTab] Parsed content:', parsed);
      return parsed
    } catch {
      console.log('[ReviewsTab] Error parsing content, returning {}');
      return {}
    }
  }, [section.content])

  const updateContent = (updates) => {
    const nextContent = { ...content, ...updates }
    onSave(sections.map(s => s.id === section.id ? { ...s, content: JSON.stringify(nextContent) } : s).length > 0 
      ? sections.map(s => s.id === section.id ? { ...s, content: JSON.stringify(nextContent) } : s)
      : [{ ...section, content: JSON.stringify(nextContent) }])
  }

  const [itemModal, setItemModal] = useState(null)

  const saveItem = (item) => {
    const items = [...(content.items || [])]
    if (item.id) {
      const idx = items.findIndex(i => i.id === item.id)
      items[idx] = item
    } else {
      items.push({ ...item, id: Date.now().toString() })
    }
    updateContent({ items })
    setItemModal(null)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <SectionHeader title="Promo Tiles" icon="🏷️" />
      
      {/* 1. Page Header */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Page Header</div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Title</label>
          <input value={section.title} onChange={e => onSave([{ ...section, title: e.target.value }])} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={content.description} onChange={e => updateContent({ description: e.target.value })} style={inputStyle} rows={2} />
        </div>
      </div>

      {/* 2. Content (Promo Items) */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>Promo Items</div>
          <button onClick={() => setItemModal({})} style={{ padding:'4px 12px', background:C.acc, border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add Item</button>
        </div>
        
        <div style={{ display:'grid', gap:10 }}>
          {(content.items || []).map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:10 }}>
              <img src={item.image} style={{ width:40, height:40, borderRadius:6, objectFit:'cover', background:C.card }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>{item.title}</div>
                <div style={{ fontSize:11, color:C.t2 }}>{item.description}</div>
              </div>
              <button onClick={() => setItemModal(item)} style={{ padding:'4px 8px', background:'transparent', border:`1px solid ${C.border2}`, borderRadius:4, color:C.t2, fontSize:11, cursor:'pointer' }}>Edit</button>
              <button onClick={() => updateContent({ items: content.items.filter(i => i.id !== item.id) })} style={{ padding:'4px 8px', background:'transparent', border:`1px solid ${C.red}40`, borderRadius:4, color:C.red, fontSize:11, cursor:'pointer' }}>Delete</button>
            </div>
          ))}
          {(content.items || []).length === 0 && <div style={{ textAlign:'center', padding:20, color:C.t3, fontSize:12 }}>No items added yet.</div>}
        </div>
      </div>

      {/* 3. CTA Section */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Global CTA (Optional)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>Button Label</label>
            <input value={content.globalCta?.label || ''} onChange={e => updateContent({ globalCta: { ...content.globalCta, label: e.target.value } })} style={inputStyle} placeholder="e.g. View All Recommendations" />
          </div>
          <div>
            <label style={labelStyle}>Button Link</label>
            <input value={content.globalCta?.link || ''} onChange={e => updateContent({ globalCta: { ...content.globalCta, link: e.target.value } })} style={inputStyle} placeholder="/menu" />
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
        <ToggleSwitch checked={section.isActive} onChange={() => onSave([{ ...section, isActive: !section.isActive }])} />
        <span style={{ color:C.t1, fontSize:13 }}>Section Visible on Homepage</span>
      </div>

      {itemModal && (
        <PromoItemModal
          item={itemModal}
          onSave={saveItem}
          onClose={() => setItemModal(null)}
        />
      )}
    </div>
  )
}

function PromoItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    ctaLabel: 'Order Now',
    ctaLink: '/menu',
    ...item
  })
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, width:'100%', maxWidth:480 }}>
        <div style={{ padding:24, borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0, color:C.t0, fontSize:18 }}>{item.id ? 'Edit' : 'Add'} Promo Item</h3>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} rows={2} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Image URL</label>
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>CTA Label</label>
              <input value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CTA Link</label>
              <input value={form.ctaLink} onChange={e => setForm({ ...form, ctaLink: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ padding:24, borderTop:`1px solid ${C.border}`, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save Item</button>
        </div>
      </div>
    </div>
  )
}

// ── Specials Tab ──────────────────────────────────────────
function SpecialsTab({ sections, onSave, clientId }) {
  const section = sections[0] || {
    id: `temp-specials-${Date.now()}`,
    type: 'specials',
    title: "Current Specials",
    content: JSON.stringify({
      description: 'Check out our latest offers and limited-time dishes',
      items: [],
    }),
    isActive: true
  }

  const content = useMemo(() => {
    try {
      const parsed = typeof section.content === 'string' ? JSON.parse(section.content) : (section.content || {})
      console.log('[ReviewsTab] Raw section.content:', section.content);
      console.log('[ReviewsTab] Parsed content:', parsed);
      return parsed
    } catch {
      console.log('[ReviewsTab] Error parsing content, returning {}');
      return {}
    }
  }, [section.content])

  const updateContent = (updates) => {
    const nextContent = { ...content, ...updates }
    onSave(sections.map(s => s.id === section.id ? { ...s, content: JSON.stringify(nextContent) } : s).length > 0 
      ? sections.map(s => s.id === section.id ? { ...s, content: JSON.stringify(nextContent) } : s)
      : [{ ...section, content: JSON.stringify(nextContent) }])
  }

  const [itemModal, setItemModal] = useState(null)

  const saveItem = (item) => {
    const items = [...(content.items || [])]
    if (item.id) {
      const idx = items.findIndex(i => i.id === item.id)
      items[idx] = item
    } else {
      items.push({ ...item, id: Date.now().toString() })
    }
    updateContent({ items })
    setItemModal(null)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <SectionHeader title="Specials Section" icon="🔥" />
      
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Section Header</div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Title</label>
          <input value={section.title} onChange={e => onSave([{ ...section, title: e.target.value }])} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={content.description} onChange={e => updateContent({ description: e.target.value })} style={inputStyle} rows={2} />
        </div>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>Specials</div>
          <button onClick={() => setItemModal({})} style={{ padding:'4px 12px', background:C.acc, border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add Special</button>
        </div>
        
        <div style={{ display:'grid', gap:10 }}>
          {(content.items || []).map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:10, opacity: item.isActive ? 1 : 0.6 }}>
              <img src={item.image} style={{ width:40, height:40, borderRadius:6, objectFit:'cover', background:C.card }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>{item.title}</div>
                <div style={{ fontSize:11, color:C.t2 }}>{item.description}</div>
              </div>
              <ToggleSwitch checked={item.isActive} onChange={() => {
                const nextItems = content.items.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i)
                updateContent({ items: nextItems })
              }} />
              <button onClick={() => setItemModal(item)} style={{ padding:'4px 8px', background:'transparent', border:`1px solid ${C.border2}`, borderRadius:4, color:C.t2, fontSize:11, cursor:'pointer' }}>Edit</button>
              <button onClick={() => updateContent({ items: content.items.filter(i => i.id !== item.id) })} style={{ padding:'4px 8px', background:'transparent', border:`1px solid ${C.red}40`, borderRadius:4, color:C.red, fontSize:11, cursor:'pointer' }}>Delete</button>
            </div>
          ))}
          {(content.items || []).length === 0 && <div style={{ textAlign:'center', padding:20, color:C.t3, fontSize:12 }}>No specials added yet.</div>}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
        <ToggleSwitch checked={section.isActive} onChange={() => onSave([{ ...section, isActive: !section.isActive }])} />
        <span style={{ color:C.t1, fontSize:13 }}>Section Visible on Homepage</span>
      </div>

      {itemModal && (
        <SpecialItemModal
          item={itemModal}
          onSave={saveItem}
          onClose={() => setItemModal(null)}
        />
      )}
    </div>
  )
}

function SpecialItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    ctaLabel: 'Order Now',
    ctaLink: '/menu',
    isActive: true,
    ...item
  })
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, width:'100%', maxWidth:480 }}>
        <div style={{ padding:24, borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0, color:C.t0, fontSize:18 }}>{item.id ? 'Edit' : 'Add'} Special</h3>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} rows={2} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Image URL</label>
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>CTA Label</label>
              <input value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CTA Link</label>
              <input value={form.ctaLink} onChange={e => setForm({ ...form, ctaLink: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:C.card, borderRadius:8 }}>
            <ToggleSwitch checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
            <span style={{ color:C.t1, fontSize:13 }}>Active</span>
          </div>
        </div>
        <div style={{ padding:24, borderTop:`1px solid ${C.border}`, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save Special</button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display:'block', fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }
const inputStyle = { width:'100%', padding:'10px 12px', background:C.input, border:`1px solid ${C.border}`, borderRadius:8, color:C.t0, fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }
const btnCancel = { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, color: C.t2, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
const btnSave = { padding: '10px 24px', background: C.green, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

// ── About / Team Tab ───────────────────────────────────────
function AboutTab({ sections, onSave, clientId }) {
  return <GenericSectionTab 
    title="Meet Our Team" 
    icon="👥" 
    sections={sections} 
    sectionType="about"
    onSave={onSave} 
    clientId={clientId} 
  />
}

// ── Locations Tab ──────────────────────────────────────────
function LocationsTab({ sections, onSave, clientId }) {
  return <GenericSectionTab 
    title="Locations Section" 
    icon="📍" 
    sections={sections} 
    sectionType="locations"
    onSave={onSave} 
    clientId={clientId} 
  />
}

// ── Reviews Tab ──────────────────────────────────────────
function ReviewsTab({ sections, onSave, clientId }) {
  const section = sections[0] || {
    id: `temp-reviews-${Date.now()}`,
    type: 'reviews',
    title: "Customer Reviews",
    content: JSON.stringify({
      subtitle: 'What our customers are saying about us',
      showGoogleReviews: true,
      showRegularReviews: false,
      alternateStyle: false,
      cta: {
        active: true,
        label: 'Leave a Review',
        variant: 'primary',
        url: ''
      }
    }),
    isActive: true
  }

  const content = useMemo(() => {
    try {
      const parsed = typeof section.content === 'string' ? JSON.parse(section.content) : (section.content || {})
      console.log('[ReviewsTab] Raw section.content:', section.content);
      console.log('[ReviewsTab] Parsed content:', parsed);
      return parsed
    } catch {
      console.log('[ReviewsTab] Error parsing content, returning {}');
      return {}
    }
  }, [section.content])

  const updateContent = (updates) => {
    const nextContent = { ...content, ...updates }
    const updatedSections = sections.length > 0 
      ? sections.map(s => s.id === section.id ? { ...s, content: JSON.stringify(nextContent) } : s)
      : [{ ...section, content: JSON.stringify(nextContent) }]
    onSave(updatedSections)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <SectionHeader title="Reviews Section" icon="⭐" />
      
      {/* Section Header */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Section Header</div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Title</label>
          <input 
            value={section.title} 
            onChange={e => onSave([{ ...section, title: e.target.value }])} 
            style={inputStyle} 
            placeholder="Customer Reviews"
          />
        </div>
        <div>
          <label style={labelStyle}>Subtitle</label>
          <textarea 
            value={content.subtitle || ''} 
            onChange={e => updateContent({ subtitle: e.target.value })} 
            style={inputStyle} 
            rows={2}
            placeholder="What our customers are saying about us"
          />
        </div>
      </div>

      {/* Reviews Summary Section */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Reviews Summary Section</div>
        
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:C.panel, borderRadius:8 }}>
            <ToggleSwitch 
              checked={content.showGoogleReviews !== false} 
              onChange={() => updateContent({ showGoogleReviews: !content.showGoogleReviews })} 
            />
            <div>
              <div style={{ color:C.t1, fontSize:13, fontWeight:600 }}>Show Google Reviews</div>
              <div style={{ color:C.t3, fontSize:11 }}>Display Google reviews with rating and count</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:C.panel, borderRadius:8 }}>
            <ToggleSwitch 
              checked={content.showRegularReviews !== false} 
              onChange={() => updateContent({ showRegularReviews: !content.showRegularReviews })} 
            />
            <div>
              <div style={{ color:C.t1, fontSize:13, fontWeight:600 }}>Show Regular Reviews</div>
              <div style={{ color:C.t3, fontSize:11 }}>Display manually added reviews</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:C.panel, borderRadius:8 }}>
            <ToggleSwitch 
              checked={content.alternateStyle === true} 
              onChange={() => updateContent({ alternateStyle: !content.alternateStyle })} 
            />
            <div>
              <div style={{ color:C.t1, fontSize:13, fontWeight:600 }}>Alternate Styles</div>
              <div style={{ color:C.t3, fontSize:11 }}>Use dark background to stand out on homepage</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t3, textTransform:'uppercase', marginBottom:14 }}>Call-to-Action (CTA)</div>
        
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:C.panel, borderRadius:8, marginBottom:16 }}>
          <ToggleSwitch 
            checked={content.cta?.active !== false} 
            onChange={() => updateContent({ cta: { ...content.cta, active: !content.cta?.active } })} 
          />
          <div>
            <div style={{ color:C.t1, fontSize:13, fontWeight:600 }}>Show CTA Button</div>
            <div style={{ color:C.t3, fontSize:11 }}>Display call-to-action button below reviews</div>
          </div>
        </div>

        {content.cta?.active !== false && (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Button Label</label>
              <input 
                value={content.cta?.label || ''} 
                onChange={e => updateContent({ cta: { ...content.cta, label: e.target.value } })} 
                style={inputStyle} 
                placeholder="Leave a Review"
              />
            </div>
            
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Button URL (optional)</label>
              <input 
                value={content.cta?.url || ''} 
                onChange={e => updateContent({ cta: { ...content.cta, url: e.target.value } })} 
                style={inputStyle} 
                placeholder="https://search.google.com/local/writereview?placeid=..."
              />
            </div>

            <div>
              <label style={labelStyle}>Button Style</label>
              <select 
                value={content.cta?.variant || 'primary'} 
                onChange={e => updateContent({ cta: { ...content.cta, variant: e.target.value } })} 
                style={{ ...inputStyle, padding:'10px 12px' }}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="text">Text Link</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Section Visibility */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
        <ToggleSwitch 
          checked={section.isActive} 
          onChange={() => onSave([{ ...section, isActive: !section.isActive }])} 
        />
        <span style={{ color:C.t1, fontSize:13 }}>Reviews Section Visible on Homepage</span>
      </div>
    </div>
  )
}

// ── Homepage Banners Tab ─────────────────────────────────────
function HomepageBannersTab({ sections, onSave, clientId }) {
  return <GenericSectionTab 
    title="Homepage Banners" 
    icon="🖼️" 
    sections={sections} 
    sectionType="banner"
    onSave={onSave} 
    clientId={clientId} 
  />
}

// ── Content Tab ──────────────────────────────────────────────
function ContentTab({ sections, onSave, clientId }) {
  return <GenericSectionTab 
    title="Content Sections" 
    icon="📝" 
    sections={sections} 
    sectionType="content"
    onSave={onSave} 
    clientId={clientId} 
  />
}

// ── Generic Section Tab (Reusable for all homepage subs) ─────
function GenericSectionTab({ title, icon, sections, sectionType, onSave, clientId }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [localSections, setLocalSections] = useState(sections)

  useEffect(() => {
    setLocalSections(sections)
  }, [sections])

  const handleAdd = () => {
    setEditingSection({
      id: `temp-${Date.now()}`,
      type: sectionType,
      title: '',
      content: '',
      imageUrl: '',
      buttonText: '',
      buttonUrl: '',
      isActive: true
    })
    setModalOpen(true)
  }

  const handleEdit = (section) => {
    setEditingSection({ ...section })
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this section?')) {
      const updated = localSections.filter(s => s.id !== id)
      setLocalSections(updated)
      onSave(updated)
    }
  }

  const handleToggle = (id) => {
    const updated = localSections.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    )
    setLocalSections(updated)
    onSave(updated)
  }

  const handleSaveSection = () => {
    if (!editingSection.title.trim()) return alert('Title is required')
    
    const exists = localSections.find(s => s.id === editingSection.id)
    let updated
    
    if (exists) {
      updated = localSections.map(s =>
        s.id === editingSection.id ? editingSection : s
      )
    } else {
      updated = [...localSections, editingSection]
    }
    
    setLocalSections(updated)
    onSave(updated)
    setModalOpen(false)
  }

  return (
    <div>
      <SectionHeader title={title} icon={icon} onAdd={handleAdd} addLabel="Add Section" />
      
      {localSections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.t3 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
          <div>No {title.toLowerCase()} yet. Add your first section.</div>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter}>
          <SortableContext items={localSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {localSections.map(section => (
              <SortableItem
                key={section.id}
                id={section.id}
                isActive={section.isActive}
                onToggle={() => handleToggle(section.id)}
                onEdit={() => handleEdit(section)}
                onDelete={() => handleDelete(section.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, color: section.isActive ? C.t0 : C.t3 }}>
                    {section.title}
                  </div>
                  <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
                    Type: {section.type}
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      )}
      
      <EditSectionModal
        section={editingSection}
        onSave={handleSaveSection}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

// ── Reusable SortableItem, Modal (from NavbarSection) ────────
const SortableItem = memo(({ id, children, onEdit, onDelete, onToggle, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  
  return (
    <div ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      <div {...attributes} {...listeners}
        style={{
          cursor: 'grab',
          color: C.t3,
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 2,
          marginRight: 8
        }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ display:'block', width:14, height:1.5, background:C.t3, borderRadius:1 }}/>
        ))}
      </div>
      
      <div style={{ flex: 1 }}>{children}</div>
      
      <ToggleSwitch checked={isActive} onChange={onToggle} size="small" />
      
      <button onClick={onEdit}
        style={{
          padding: '6px 12px',
          background: C.cyan,
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}>
        Edit
      </button>
      
      <button onClick={onDelete}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: `1px solid ${C.red}40`,
          borderRadius: 6,
          color: C.red,
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}>
        Delete
      </button>
    </div>
  )
})

function EditSectionModal({ section, onSave, onClose }) {
  const [form, setForm] = useState(section || {
    title: '',
    content: '',
    imageUrl: '',
    buttonText: '',
    buttonUrl: '',
    isActive: true
  })

  const handleSave = () => {
    if (!form.title.trim()) return alert('Title is required')
    onSave(form)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, color: C.t0, fontSize: 18 }}>
            {section?.id ? 'Edit' : 'Add'} Section
          </h3>
        </div>
        
        <div style={{ padding: 24 }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: C.t3,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              Title *
            </label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Section title"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.t0,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Content */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: C.t3,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              Content (HTML)
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Section content (supports HTML)"
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.t0,
                fontSize: 14,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Image */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: C.t3,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              Image URL
            </label>
            <input
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="/images/hero.jpg or https://..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.t0,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Button */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: C.t3,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              Button Text
            </label>
            <input
              value={form.buttonText}
              onChange={e => setForm({ ...form, buttonText: e.target.value })}
              placeholder="e.g. Learn More"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.t0,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              color: C.t3,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              Button URL
            </label>
            <input
              value={form.buttonUrl}
              onChange={e => setForm({ ...form, buttonUrl: e.target.value })}
              placeholder="/menu or https://..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.t0,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Active toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px',
            background: C.card,
            borderRadius: 8
          }}>
            <ToggleSwitch 
              checked={form.isActive} 
              onChange={() => setForm({ ...form, isActive: !form.isActive })} 
              size="medium"
            />
            <span style={{ color: C.t1, fontSize: 14 }}>
              {form.isActive ? 'Active (visible on homepage)' : 'Inactive (hidden)'}
            </span>
          </div>
        </div>
        
        <div style={{
          padding: 24,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${C.border2}`,
              borderRadius: 8,
              color: C.t2,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: C.green,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Save Section
          </button>
        </div>
      </div>
    </div>
  )
}

