import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems, deleteMenuItem, reorderMenuItems } from '../api/menuItems'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { apiFetch } from '../api/utils'
import { C } from '../theme'

const inp = {
  width:'100%', padding:'9px 11px', fontSize:13, background:'#111827',
  border:'1px solid #1E2D4A', borderRadius:7, color:'#F1F5FF',
  fontFamily:'inherit', outline:'none', boxSizing:'border-box'
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
const SITE_TABS = {
  restaurant: ['menu'],
  finedine:   ['menu'],
  cafe:       ['menu'],
  foodtruck:  ['menu'],
  delivery:   ['menu'],
  quickserve: ['menu'],
  catering:   [],
  mealprep:   ['menu'],
}

const TAB_META = {
  menu:      { label:'Menu Items', component: (id) => <MenuItemsTab clientId={id}/> },
}

export default function ItemsSection({ clientId, siteType='restaurant' }) {
  const allowedKeys = SITE_TABS[siteType] || SITE_TABS.restaurant
  const tabs        = allowedKeys.map(k => ({ key:k, ...TAB_META[k] }))
  const [tab, setTab] = useState(tabs[0]?.key || 'menu')

  // Reset to first tab if current tab not in allowed list
  useEffect(() => {
    if (!allowedKeys.includes(tab)) setTab(tabs[0]?.key || 'menu')
  }, [siteType])

  return (
    <div style={{ padding:'28px 32px', flex:1, overflowY:'auto' }}>
      <div style={{ display:'flex', gap:0, marginBottom:24,
        borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'10px 20px', border:'none',
              borderBottom: tab===key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===key ? C.t0 : C.t2,
              fontWeight: tab===key ? 700 : 400, fontSize:13, cursor:'pointer',
              fontFamily:'inherit', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>
      {tabs.map(({ key, component }) => (
        tab === key && <div key={key}>{component(clientId)}</div>
      ))}
    </div>
  )
}

// ── Menu Items Tab ────────────────────────────────────────────
function MenuItemsTab({ clientId }) {
  const qc = useQueryClient()
  const [catFilter, setCatFilter] = useState('All')
  const [search,    setSearch]    = useState('')
  const [ordered,   setOrdered]   = useState([])
  const [adding,    setAdding]    = useState(() => sessionStorage.getItem(`items_adding_${clientId}`) === 'true')
  const [newItem,   setNewItem]   = useState(() => {
    try {
      const saved = sessionStorage.getItem(`items_draft_${clientId}`)
      return saved ? JSON.parse(saved) : { name:'', price:'', description:'', categoryName:'', isFeatured:false }
    } catch {
      return { name:'', price:'', description:'', categoryName:'', isFeatured:false }
    }
  })
  const [formErr, setFormErr] = useState('')

  useEffect(() => {
    sessionStorage.setItem(`items_adding_${clientId}`, adding)
    sessionStorage.setItem(`items_draft_${clientId}`, JSON.stringify(newItem))
  }, [adding, newItem, clientId])

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
      sessionStorage.removeItem(`items_adding_${clientId}`)
      sessionStorage.removeItem(`items_draft_${clientId}`)
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