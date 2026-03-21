import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems, deleteMenuItem, reorderMenuItems } from '../api/menuItems'
import { getLocations, deleteLocation } from '../api/locations'
import { getSpecials, updateSpecial, deleteSpecial } from '../api/specials'
import { getBanners, updateBanner, deleteBanner } from '../api/banners'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const API = 'http://localhost:3001/api'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', accBg:'#2A1200',
  green:'#22C55E', greenBg:'#052010',
  amber:'#F59E0B', red:'#EF4444',
}

const inp = {
  width:'100%', padding:'9px 11px', fontSize:13, background:'#111827',
  border:'1px solid #1E2D4A', borderRadius:7, color:'#F1F5FF',
  fontFamily:'inherit', outline:'none', boxSizing:'border-box'
}

// ── Helper — authenticated fetch ──────────────────────────────
async function apiFetch(path, method = 'GET', body = null) {
  const token = localStorage.getItem('dd_token')
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

function DragHandle({ listeners, attributes }) {
  return (
    <span {...attributes} {...listeners}
      style={{ cursor:'grab', color:C.t3, display:'inline-flex', flexDirection:'column', gap:2 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ display:'block', width:14, height:1.5, background:C.t3, borderRadius:1 }}/>
      ))}
    </span>
  )
}

function SortableRow({ id, cells }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <tr ref={setNodeRef}
      style={{ transform:CSS.Transform.toString(transform), transition, opacity:isDragging ? 0.5 : 1 }}
      onMouseEnter={e => e.currentTarget.style.background = C.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding:'11px 8px', width:32 }}>
        <DragHandle listeners={listeners} attributes={attributes}/>
      </td>
      {cells.map((cell, i) => (
        <td key={i} style={{ padding:'11px 14px', fontSize:13, color:C.t1 }}>{cell}</td>
      ))}
    </tr>
  )
}

// ── Main section ──────────────────────────────────────────────
export default function ItemsSection({ clientId }) {
  const [tab, setTab] = useState(0)
  return (
    <div style={{ padding:'28px 32px', flex:1, overflowY:'auto' }}>
      <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:`1px solid ${C.border}` }}>
        {[['🍽️ Menu Items'],['📍 Locations'],['🏷️ Specials'],['🖼️ Banners']].map(([label], i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding:'10px 20px', border:'none',
              borderBottom: tab===i ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===i ? C.t0 : C.t2,
              fontWeight: tab===i ? 700 : 400, fontSize:13, cursor:'pointer',
              fontFamily:'inherit', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>
      {tab===0 && <MenuItemsTab clientId={clientId}/>}
      {tab===1 && <LocationsTab clientId={clientId}/>}
      {tab===2 && <SpecialsTab  clientId={clientId}/>}
      {tab===3 && <BannersTab   clientId={clientId}/>}
    </div>
  )
}

// ── Menu Items Tab ────────────────────────────────────────────
function MenuItemsTab({ clientId }) {
  const qc = useQueryClient()
  const [catFilter, setCatFilter] = useState('All')
  const [search,    setSearch]    = useState('')
  const [ordered,   setOrdered]   = useState([])
  const [adding,    setAdding]    = useState(false)
  const [newItem,   setNewItem]   = useState({
    name:'', price:'', description:'', categoryName:'', isFeatured:false
  })
  const [formErr, setFormErr] = useState('')

  const { data: items=[], isLoading } = useQuery({
    queryKey: ['menu-items', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/menu-items`)
  })

  useEffect(() => {
    setOrdered(items.filter(i =>
      (catFilter==='All' || i.category?.name===catFilter) &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ))
  }, [items, catFilter, search])

  const createMut = useMutation({
    mutationFn: async () => {
      setFormErr('')
      let categoryId = null
      if (newItem.categoryName.trim()) {
        const cats = await apiFetch(`/clients/${clientId}/menu-categories`)
        const existing = cats.find(c =>
          c.name.toLowerCase() === newItem.categoryName.trim().toLowerCase()
        )
        if (existing) {
          categoryId = existing.id
        } else {
          const created = await apiFetch(`/clients/${clientId}/menu-categories`, 'POST', {
            name: newItem.categoryName.trim(),
            sortOrder: 0
          })
          categoryId = created.id
        }
      }
      return apiFetch(`/clients/${clientId}/menu-items`, 'POST', {
        name:        newItem.name.trim(),
        description: newItem.description.trim() || null,
        price:       newItem.price ? parseFloat(newItem.price) : null,
        isFeatured:  newItem.isFeatured,
        isAvailable: true,
        sortOrder:   0,
        ...(categoryId ? { categoryId } : {})
      })
    },
    onSuccess: () => {
      qc.invalidateQueries(['menu-items', clientId])
      setNewItem({ name:'', price:'', description:'', categoryName:'', isFeatured:false })
      setAdding(false)
      setFormErr('')
    },
    onError: (err) => setFormErr(err.message)
  })

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/clients/${clientId}/menu-items/${id}`, 'DELETE'),
    onSuccess:  () => qc.invalidateQueries(['menu-items', clientId])
  })

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const reordered = arrayMove(
      ordered,
      ordered.findIndex(i => i.id === active.id),
      ordered.findIndex(i => i.id === over.id)
    )
    setOrdered(reordered)
    await apiFetch(`/clients/${clientId}/menu-items/reorder`, 'PUT', {
      items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    })
  }

  if (isLoading) return <div style={{color:C.t3,padding:20}}>Loading...</div>

  const cats = ['All', ...new Set(items.map(i => i.category?.name).filter(Boolean))]

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
                border:`1px solid ${catFilter===c ? C.acc : C.border}`,
                background: catFilter===c ? C.accBg : 'transparent',
                color: catFilter===c ? C.acc : C.t2, fontWeight:600 }}>
              {c}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ padding:'6px 12px', fontSize:12, background:C.card,
              border:`1px solid ${C.border2}`, borderRadius:6, color:C.t0,
              fontFamily:'inherit', outline:'none', width:160 }}/>
        </div>
        <button onClick={() => { setAdding(!adding); setFormErr('') }}
          style={{ padding:'8px 16px', background:C.acc, border:'none', borderRadius:7,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Menu Item
        </button>
      </div>

      {adding && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
          padding:16, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Item Name *</label>
              <input value={newItem.name}
                onChange={e => setNewItem(p => ({...p, name:e.target.value}))}
                placeholder="e.g. Wagyu Beef Cheek" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Price *</label>
              <input value={newItem.price}
                onChange={e => setNewItem(p => ({...p, price:e.target.value}))}
                placeholder="e.g. 42" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Category</label>
              <input value={newItem.categoryName}
                onChange={e => setNewItem(p => ({...p, categoryName:e.target.value}))}
                placeholder="e.g. Mains" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Description</label>
              <input value={newItem.description}
                onChange={e => setNewItem(p => ({...p, description:e.target.value}))}
                placeholder="e.g. 12hr braised, truffle jus..." style={inp}/>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <input type="checkbox" id="isFeatured"
              checked={newItem.isFeatured}
              onChange={e => setNewItem(p => ({...p, isFeatured: e.target.checked}))}
              style={{ width:16, height:16, cursor:'pointer', accentColor:C.acc }}/>
            <label htmlFor="isFeatured"
              style={{ fontSize:13, color:C.t1, cursor:'pointer', fontWeight:600 }}>
              ⭐ Featured on homepage — shows in Best Selling Dishes section on the website
            </label>
          </div>
          {formErr && (
            <div style={{ background:'#2A0A0A', border:'1px solid #EF444440', borderRadius:7,
              padding:'8px 12px', fontSize:12, color:C.red, marginBottom:10 }}>
              ❌ {formErr}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => createMut.mutate()}
              disabled={!newItem.name || !newItem.price || createMut.isPending}
              style={{ padding:'9px 18px', background:C.acc, border:'none', borderRadius:7,
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                opacity: (!newItem.name || !newItem.price || createMut.isPending) ? 0.5 : 1 }}>
              {createMut.isPending ? 'Saving...' : 'Save Item'}
            </button>
            <button onClick={() => {
              setAdding(false)
              setFormErr('')
              setNewItem({ name:'', price:'', description:'', categoryName:'', isFeatured:false })
            }}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:C.card }}>
              {['','Item Name','Category','Price','Featured','Status','Actions'].map((h, i) => (
                <th key={i} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700,
                  color:C.t3, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase',
                  letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ordered.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {ordered.map(item => (
                  <SortableRow key={item.id} id={item.id} cells={[
                    <span style={{ fontWeight:700, color:C.t0 }}>{item.name}</span>,
                    <span style={{ background:C.card, color:C.t2, padding:'2px 8px',
                      borderRadius:4, fontSize:11, fontWeight:700 }}>
                      {item.category?.name || '—'}
                    </span>,
                    <span style={{ fontFamily:'monospace', color:C.amber, fontWeight:700 }}>
                      ${item.price}
                    </span>,
                    <span style={{ fontSize:16 }}>{item.isFeatured ? '⭐' : '—'}</span>,
                    <span style={{ background:item.isAvailable ? C.greenBg : '#1A0505',
                      color:item.isAvailable ? C.green : C.red,
                      padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>
                      {item.isAvailable ? 'active' : 'unavailable'}
                    </span>,
                    <button onClick={() => window.confirm(`Delete "${item.name}"?`) && deleteMut.mutate(item.id)}
                      style={{ padding:'4px 8px', background:'transparent',
                        border:`1px solid ${C.red}40`, borderRadius:4,
                        color:C.red, fontSize:11, cursor:'pointer' }}>Remove</button>
                  ]}/>
                ))}
                {ordered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:28, textAlign:'center',
                    color:C.t3, fontSize:13, fontStyle:'italic' }}>
                    No items yet. Click + Add Menu Item above.
                  </td></tr>
                )}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
    </>
  )
}

// ── Locations Tab ─────────────────────────────────────────────
function LocationsTab({ clientId }) {
  const qc = useQueryClient()
  const [adding,  setAdding]  = useState(false)
  const [newLoc,  setNewLoc]  = useState({ name:'', address:'', phone:'', hours:'' })
  const [formErr, setFormErr] = useState('')

  const { data: locations=[], isLoading } = useQuery({
    queryKey: ['locations', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/locations`)
  })

  const createMut = useMutation({
    mutationFn: () => apiFetch(`/clients/${clientId}/locations`, 'POST', {
      name:    newLoc.name.trim(),
      address: newLoc.address.trim() || null,
      phone:   newLoc.phone.trim()   || null,
      hours:   newLoc.hours.trim()   || null
    }),
    onSuccess: () => {
      qc.invalidateQueries(['locations', clientId])
      setNewLoc({ name:'', address:'', phone:'', hours:'' })
      setAdding(false)
      setFormErr('')
    },
    onError: (err) => setFormErr(err.message)
  })

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/clients/${clientId}/locations/${id}`, 'DELETE'),
    onSuccess:  () => qc.invalidateQueries(['locations', clientId])
  })

  if (isLoading) return <div style={{color:C.t3,padding:20}}>Loading...</div>

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.t0 }}>
          Locations ({locations.length})
        </h3>
        <button onClick={() => { setAdding(!adding); setFormErr('') }}
          style={{ padding:'8px 16px', background:C.acc, border:'none', borderRadius:7,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Location
        </button>
      </div>

      {adding && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
          padding:16, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {[
              ['Location Name *', 'name',    'e.g. Melbourne CBD'],
              ['Address',         'address', 'e.g. 123 Collins St, Melbourne VIC 3000'],
              ['Phone',           'phone',   'e.g. +61 3 9123 4567'],
              ['Opening Hours',   'hours',   'e.g. Mon-Sat 11:30am-10pm, Sun 12pm-9pm'],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                  letterSpacing:'0.06em', display:'block', marginBottom:6 }}>{label}</label>
                <input value={newLoc[key]}
                  onChange={e => setNewLoc(p => ({...p, [key]: e.target.value}))}
                  placeholder={ph} style={inp}/>
              </div>
            ))}
          </div>
          {formErr && (
            <div style={{ background:'#2A0A0A', border:'1px solid #EF444440', borderRadius:7,
              padding:'8px 12px', fontSize:12, color:C.red, marginBottom:10 }}>
              ❌ {formErr}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => createMut.mutate()}
              disabled={!newLoc.name || createMut.isPending}
              style={{ padding:'9px 18px', background:C.acc, border:'none', borderRadius:7,
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                opacity: (!newLoc.name || createMut.isPending) ? 0.5 : 1 }}>
              {createMut.isPending ? 'Saving...' : 'Save Location'}
            </button>
            <button onClick={() => {
              setAdding(false)
              setFormErr('')
              setNewLoc({ name:'', address:'', phone:'', hours:'' })
            }}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {locations.map(loc => (
          <div key={loc.id} style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`,
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:C.t0 }}>{loc.name}</span>
            </div>
            <div style={{ padding:18 }}>
              {[['📍', loc.address], ['📞', loc.phone], ['🕐', loc.hours]].map(([icon, val]) => val && (
                <div key={icon} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13, color:C.t1 }}>
                  <span>{icon}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ marginTop:12 }}>
                <button onClick={() => window.confirm(`Delete "${loc.name}"?`) && deleteMut.mutate(loc.id)}
                  style={{ padding:'5px 10px', background:'transparent',
                    border:`1px solid ${C.red}50`, borderRadius:7,
                    color:C.red, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div style={{ color:C.t3, fontSize:13, padding:24, background:C.panel,
            border:`1px solid ${C.border}`, borderRadius:10 }}>
            No locations yet. Click + Add Location above.
          </div>
        )}
      </div>
    </>
  )
}

// ── Specials Tab ──────────────────────────────────────────────
function SpecialsTab({ clientId }) {
  const qc = useQueryClient()
  const [adding,     setAdding]     = useState(false)
  const [newSpecial, setNewSpecial] = useState({ title:'', price:'', description:'' })
  const [formErr,    setFormErr]    = useState('')

  const { data: specials=[], isLoading } = useQuery({
    queryKey: ['specials', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/specials`)
  })

  const createMut = useMutation({
    mutationFn: () => apiFetch(`/clients/${clientId}/specials`, 'POST', {
      title:       newSpecial.title.trim(),
      description: newSpecial.description.trim() || null,
      price:       newSpecial.price ? parseFloat(newSpecial.price) : null,
      isActive:    true
    }),
    onSuccess: () => {
      qc.invalidateQueries(['specials', clientId])
      setNewSpecial({ title:'', price:'', description:'' })
      setAdding(false)
      setFormErr('')
    },
    onError: (err) => setFormErr(err.message)
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => apiFetch(`/clients/${clientId}/specials/${id}`, 'PUT', { isActive }),
    onSuccess:  () => qc.invalidateQueries(['specials', clientId])
  })

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/clients/${clientId}/specials/${id}`, 'DELETE'),
    onSuccess:  () => qc.invalidateQueries(['specials', clientId])
  })

  if (isLoading) return <div style={{color:C.t3,padding:20}}>Loading...</div>

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.t0 }}>
          Specials ({specials.length})
        </h3>
        <button onClick={() => { setAdding(!adding); setFormErr('') }}
          style={{ padding:'8px 16px', background:C.acc, border:'none', borderRadius:7,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Special
        </button>
      </div>

      {adding && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
          padding:16, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 3fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Title *</label>
              <input value={newSpecial.title}
                onChange={e => setNewSpecial(p => ({...p, title:e.target.value}))}
                placeholder="e.g. Sunday Roast Special" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Price</label>
              <input value={newSpecial.price}
                onChange={e => setNewSpecial(p => ({...p, price:e.target.value}))}
                placeholder="e.g. 45" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Description</label>
              <input value={newSpecial.description}
                onChange={e => setNewSpecial(p => ({...p, description:e.target.value}))}
                placeholder="e.g. 3-course feast every Sunday" style={inp}/>
            </div>
          </div>
          {formErr && (
            <div style={{ background:'#2A0A0A', border:'1px solid #EF444440', borderRadius:7,
              padding:'8px 12px', fontSize:12, color:C.red, marginBottom:10 }}>
              ❌ {formErr}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => createMut.mutate()}
              disabled={!newSpecial.title || createMut.isPending}
              style={{ padding:'9px 18px', background:C.acc, border:'none', borderRadius:7,
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                opacity: (!newSpecial.title || createMut.isPending) ? 0.5 : 1 }}>
              {createMut.isPending ? 'Saving...' : 'Save Special'}
            </button>
            <button onClick={() => {
              setAdding(false)
              setFormErr('')
              setNewSpecial({ title:'', price:'', description:'' })
            }}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:C.card }}>
              {['Title','Price','Active','Delete'].map((h, i) => (
                <th key={i} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700,
                  color:C.t3, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase',
                  letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specials.map((s, i) => (
              <tr key={s.id}
                style={{ borderBottom: i < specials.length-1 ? `1px solid ${C.border}15` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = C.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'11px 14px', fontWeight:700, color:C.t0 }}>
                  <div>{s.title}</div>
                  {s.description && (
                    <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{s.description}</div>
                  )}
                </td>
                <td style={{ padding:'11px 14px', fontFamily:'monospace', color:C.amber, fontWeight:700 }}>
                  {s.price ? `$${s.price}` : '—'}
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <div onClick={() => toggleMut.mutate({ id:s.id, isActive:!s.isActive })}
                    style={{ width:36, height:20, borderRadius:10, cursor:'pointer', position:'relative',
                      background: s.isActive ? C.acc : '#1F2D4A',
                      border:`1px solid ${s.isActive ? C.acc : C.border2}` }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff',
                      position:'absolute', top:2, left:s.isActive ? 18 : 2, transition:'left 0.15s' }}/>
                  </div>
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <button onClick={() => window.confirm(`Delete "${s.title}"?`) && deleteMut.mutate(s.id)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:`1px solid ${C.red}40`, borderRadius:4,
                      color:C.red, fontSize:11, cursor:'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
            {specials.length === 0 && (
              <tr><td colSpan={4} style={{ padding:28, textAlign:'center',
                color:C.t3, fontSize:13, fontStyle:'italic' }}>
                No specials yet. Click + Add Special above.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Banners Tab ───────────────────────────────────────────────
function BannersTab({ clientId }) {
  const qc = useQueryClient()
  const [adding,  setAdding]  = useState(false)
  const [text,    setText]    = useState('')
  const [formErr, setFormErr] = useState('')

  const { data: banners=[], isLoading } = useQuery({
    queryKey: ['banners', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/banners`)
  })

  const createMut = useMutation({
    mutationFn: () => apiFetch(`/clients/${clientId}/banners`, 'POST', {
      text: text.trim(),
      isActive: true
    }),
    onSuccess: () => {
      qc.invalidateQueries(['banners', clientId])
      setText('')
      setAdding(false)
      setFormErr('')
    },
    onError: (err) => setFormErr(err.message)
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => apiFetch(`/clients/${clientId}/banners/${id}`, 'PUT', { isActive }),
    onSuccess:  () => qc.invalidateQueries(['banners', clientId])
  })

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/clients/${clientId}/banners/${id}`, 'DELETE'),
    onSuccess:  () => qc.invalidateQueries(['banners', clientId])
  })

  if (isLoading) return <div style={{color:C.t3,padding:20}}>Loading...</div>

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.t0 }}>
          Banners ({banners.length})
        </h3>
        <button onClick={() => { setAdding(!adding); setFormErr('') }}
          style={{ padding:'8px 16px', background:C.acc, border:'none', borderRadius:7,
            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          + Add Banner
        </button>
      </div>

      {adding && (
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
          padding:16, marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Banner Text</label>
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="e.g. 🥩 Sunday Roast Special — 3 courses for $45"
              style={inp}/>
          </div>
          {formErr && (
            <div style={{ background:'#2A0A0A', border:'1px solid #EF444440', borderRadius:7,
              padding:'8px 12px', fontSize:12, color:C.red }}>
              ❌ {formErr}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => createMut.mutate()}
              disabled={!text || createMut.isPending}
              style={{ padding:'9px 18px', background:C.acc, border:'none', borderRadius:7,
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                opacity: (!text || createMut.isPending) ? 0.5 : 1 }}>
              {createMut.isPending ? 'Saving...' : 'Save Banner'}
            </button>
            <button onClick={() => { setAdding(false); setText(''); setFormErr('') }}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:C.card }}>
              {['Banner Text', 'Active', 'Delete'].map(h => (
                <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700,
                  color:C.t3, borderBottom:`1px solid ${C.border}`, textTransform:'uppercase',
                  letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banners.map((b, i) => (
              <tr key={b.id}
                style={{ borderBottom: i < banners.length-1 ? `1px solid ${C.border}20` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1A2540'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'11px 14px', fontSize:13, color:C.t0, fontWeight:600 }}>
                  {b.text}
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <div onClick={() => toggleMut.mutate({ id:b.id, isActive:!b.isActive })}
                    style={{ width:36, height:20, borderRadius:10, cursor:'pointer', position:'relative',
                      background: b.isActive ? C.acc : '#1F2D4A',
                      border:`1px solid ${b.isActive ? C.acc : C.border2}` }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff',
                      position:'absolute', top:2, left:b.isActive ? 18 : 2, transition:'left 0.15s' }}/>
                  </div>
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <button onClick={() => window.confirm('Delete this banner?') && deleteMut.mutate(b.id)}
                    style={{ padding:'4px 8px', background:'transparent',
                      border:`1px solid ${C.red}40`, borderRadius:4,
                      color:C.red, fontSize:11, cursor:'pointer' }}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr><td colSpan={3} style={{ padding:28, textAlign:'center',
                color:C.t3, fontSize:13, fontStyle:'italic' }}>
                No banners yet. Click + Add Banner above.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}