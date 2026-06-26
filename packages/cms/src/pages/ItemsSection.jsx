import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Utensils, Trash, Upload, Loader2, Plus, Search, Pencil, Star, GripVertical, X, ChevronDown } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { apiFetch } from '../api/utils'
import ImageUpload from '../Components/ImageUpload'
import { SkeletonPage } from '../Components/Skeleton'
import { C } from '../theme'

const inp = {
  width:'100%', padding:'9px 11px', fontSize:13, background: C.input,
  border:`1px solid ${C.border}`, borderRadius:7, color:C.t0,
  fontFamily:'inherit', outline:'none', boxSizing:'border-box'
}

const lbl = {
  fontSize:11, fontWeight:700, color:C.t3,
  textTransform:'uppercase', letterSpacing:'0.06em',
  display:'block', marginBottom:6
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )
}

function SortableCard({ item, onEdit, onDelete, onToggle, isPendingToggle, onToggleFeatured }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'center', gap: 12,
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '10px 14px',
        boxShadow: isDragging ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
      }}
    >
      {/* Drag handle */}
      <span {...attributes} {...listeners}
        style={{ cursor:'grab', color:C.t3, flexShrink:0, display:'flex', alignItems:'center' }}>
        <GripVertical size={16} />
      </span>

      {/* Thumbnail */}
      <div style={{
        width: 44, height: 44, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: C.card, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <Utensils size={18} style={{ color: C.t3 }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.t0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {item.name}
          </span>
          <Star
            size={11}
            fill={item.isFeatured ? '#F59E0B' : 'none'}
            style={{ color:'#F59E0B', flexShrink:0, cursor:'pointer', opacity: item.isFeatured ? 1 : 0.25, transition:'all 0.15s' }}
            onClick={e => { e.stopPropagation(); onToggleFeatured(item) }}
            title={item.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {item.category?.name && (
            <span style={{ fontSize:11, color:C.t3, background:C.card, border:`1px solid ${C.border}`, padding:'1px 7px', borderRadius:99, fontWeight:600 }}>
              {item.category.name}
            </span>
          )}
          {item.price != null && (
            <span style={{ fontSize:12, fontWeight:700, color:C.amber }}>
              ${item.price}
            </span>
          )}
          {item.description && (
            <span style={{ fontSize:11, color:C.t3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>
              {item.description}
            </span>
          )}
        </div>
      </div>

      {/* Availability toggle */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:11, color: item.isAvailable ? C.green : C.t3, fontWeight:600 }}>
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </span>
        <div
          onClick={() => !isPendingToggle && onToggle(item)}
          style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
            background: item.isAvailable ? C.green : C.border2, position:'relative',
            transition:'background 0.2s', opacity: isPendingToggle ? 0.5 : 1 }}
        >
          <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff',
            position:'absolute', top:3, left: item.isAvailable ? 19 : 3, transition:'left 0.2s' }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(item)}
          style={{ padding:'5px 11px', background:C.acc+'18', border:`1px solid ${C.acc}35`,
            borderRadius:7, color:C.acc, fontSize:12, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
          <Pencil size={11} /> Edit
        </button>
        <button onClick={() => onDelete(item.id, item.name)}
          style={{ padding:'5px 10px', background:C.red+'14', border:`1px solid ${C.red}35`,
            borderRadius:7, color:C.red, fontSize:12, cursor:'pointer',
            display:'flex', alignItems:'center', fontFamily:'inherit' }}>
          <Trash size={13} />
        </button>
      </div>
    </div>
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
  menu:      { label:'Menu Items', Icon: Utensils, component: (id) => <MenuItemsTab clientId={id}/> },
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
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', border:'none',
              borderBottom: tab===key ? `2px solid ${C.acc}` : '2px solid transparent',
              background:'none', color: tab===key ? C.t0 : C.t2,
              fontWeight: tab===key ? 700 : 400, fontSize:13, cursor:'pointer',
              fontFamily:'inherit', marginBottom:-1 }}>
            {Icon && <Icon size={14} />}
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

// ── Item Drawer (slide-in right panel) ───────────────────────
function ItemDrawer({ clientId, editingItem, onClose, onSaved }) {
  const isEdit = !!editingItem?.id
  const blank = { name:'', price:'', description:'', categoryName:'', isFeatured:false, imageUrl:'', sizes:[], addons:[] }
  const [form, setForm] = useState(blank)
  const [formErr, setFormErr] = useState('')
  const [open, setOpen] = useState(false)
  const [catInput, setCatInput] = useState('')
  const [catDropOpen, setCatDropOpen] = useState(false)
  const qc = useQueryClient()

  const { data: allCategories = [] } = useQuery({
    queryKey: ['menu-categories', clientId],
    queryFn: () => apiFetch(`/clients/${clientId}/menu-categories`),
    enabled: !!clientId,
    staleTime: Infinity,
  })

  useEffect(() => {
    // animate in
    const t = setTimeout(() => setOpen(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (editingItem) {
      const catName = editingItem.category?.name || ''
      setForm({
        name: editingItem.name || '',
        price: editingItem.price?.toString() || '',
        description: editingItem.description || '',
        categoryName: catName,
        isFeatured: editingItem.isFeatured || false,
        imageUrl: editingItem.imageUrl || '',
        sizes: editingItem.sizes || [],
        addons: editingItem.addons || [],
      })
      setCatInput(catName)
    } else {
      setForm(blank)
      setCatInput('')
    }
  }, [editingItem])

  const handleClose = () => {
    setOpen(false)
    setTimeout(onClose, 200)
  }

  const resolveCategory = async () => {
    if (!form.categoryName.trim()) return null
    const cats = await apiFetch(`/clients/${clientId}/menu-categories`)
    const existing = cats.find(c => c.name.toLowerCase() === form.categoryName.trim().toLowerCase())
    if (existing) return existing.id
    const created = await apiFetch(`/clients/${clientId}/menu-categories`, 'POST', { name: form.categoryName.trim(), sortOrder: 0 })
    return created.id
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      setFormErr('')
      const categoryId = await resolveCategory()
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        imageUrl: form.imageUrl || null,
        isFeatured: form.isFeatured,
        sizes: form.sizes || [],
        addons: form.addons || [],
        hasVariants: (form.sizes?.length > 0) || (form.addons?.length > 0),
        ...(categoryId ? { categoryId } : {}),
      }
      if (isEdit) return apiFetch(`/clients/${clientId}/menu-items/${editingItem.id}`, 'PUT', body)
      return apiFetch(`/clients/${clientId}/menu-items`, 'POST', { ...body, isAvailable: true, sortOrder: 0 })
    },
    onSuccess: () => {
      qc.invalidateQueries(['menu-items', clientId])
      qc.invalidateQueries(['menu-categories', clientId])
      onSaved()
      handleClose()
    },
    onError: (err) => setFormErr(err.message),
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
          opacity: open ? 1 : 0, transition:'opacity 0.2s' }} />

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:480,
        background:C.panel, borderLeft:`1px solid ${C.border}`,
        zIndex:1001, display:'flex', flexDirection:'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Drawer header */}
        <div style={{ padding:'18px 20px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.t0 }}>
              {isEdit ? 'Edit Item' : 'Add Menu Item'}
            </div>
            {isEdit && <div style={{ fontSize:12, color:C.t3, marginTop:2 }}>{editingItem.name}</div>}
          </div>
          <button onClick={handleClose}
            style={{ background:'transparent', border:'none', color:C.t3, cursor:'pointer', padding:4,
              borderRadius:6, display:'flex', alignItems:'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 0' }}>

          {/* Image */}
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Item Image</label>
            <ImageUpload clientId={clientId} value={form.imageUrl || ''} onChange={url => set('imageUrl', url)} />
          </div>

          <Field label="Item Name *">
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Wagyu Beef Cheek" style={inp} autoFocus />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Price *">
              <input value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="e.g. 42" style={inp} type="number" />
            </Field>
            <Field label="Category">
              <div style={{ position:'relative' }}>
                <input
                  value={catInput}
                  onChange={e => { setCatInput(e.target.value); set('categoryName', e.target.value); setCatDropOpen(true) }}
                  onFocus={() => setCatDropOpen(true)}
                  onBlur={() => setTimeout(() => setCatDropOpen(false), 150)}
                  placeholder="Select or type a category…"
                  style={inp}
                />
                {catDropOpen && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100,
                    background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                    boxShadow:'0 8px 24px rgba(0,0,0,0.4)', overflow:'hidden', maxHeight:200, overflowY:'auto'
                  }}>
                    {allCategories
                      .filter(c => !catInput || c.name.toLowerCase().includes(catInput.toLowerCase()))
                      .map(c => (
                        <div key={c.id}
                          onMouseDown={() => { set('categoryName', c.name); setCatInput(c.name); setCatDropOpen(false) }}
                          style={{ padding:'9px 12px', fontSize:13, color:C.t1, cursor:'pointer',
                            background: form.categoryName === c.name ? C.acc+'18' : 'transparent',
                            borderBottom:`1px solid ${C.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.hover}
                          onMouseLeave={e => e.currentTarget.style.background = form.categoryName === c.name ? C.acc+'18' : 'transparent'}
                        >
                          {c.name}
                          <span style={{ fontSize:11, color:C.t3, marginLeft:8 }}>{c._count?.items ?? ''}</span>
                        </div>
                      ))}
                    {catInput && !allCategories.some(c => c.name.toLowerCase() === catInput.toLowerCase()) && (
                      <div
                        onMouseDown={() => { set('categoryName', catInput); setCatDropOpen(false) }}
                        style={{ padding:'9px 12px', fontSize:13, color:C.acc, cursor:'pointer',
                          borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:6 }}
                      >
                        <Plus size={12} /> Create "{catInput}"
                      </div>
                    )}
                    {allCategories.length === 0 && !catInput && (
                      <div style={{ padding:'9px 12px', fontSize:12, color:C.t3, fontStyle:'italic' }}>No categories yet — type to create one</div>
                    )}
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="e.g. 12hr braised, truffle jus, seasonal greens…"
              rows={3}
              style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />
          </Field>

          {/* Featured toggle */}
          <div onClick={() => set('isFeatured', !form.isFeatured)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
              background: form.isFeatured ? C.acc+'14' : C.card,
              border:`1px solid ${form.isFeatured ? C.acc+'40' : C.border}`,
              borderRadius:8, cursor:'pointer', marginBottom:20, transition:'all 0.15s' }}>
            <Star size={14} style={{ color: form.isFeatured ? '#F59E0B' : C.t3, fill: form.isFeatured ? '#F59E0B' : 'none' }} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, color: form.isFeatured ? C.t0 : C.t2 }}>Featured Item</div>
              <div style={{ fontSize:11, color:C.t3 }}>Appears in the "Best Selling" homepage section &amp; shows a Featured badge on the menu page</div>
            </div>
            <div style={{ marginLeft:'auto', width:32, height:18, borderRadius:9,
              background: form.isFeatured ? C.acc : C.border2, position:'relative', transition:'background 0.2s' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#fff',
                position:'absolute', top:3, left: form.isFeatured ? 17 : 3, transition:'left 0.2s' }} />
            </div>
          </div>

          {/* Sizes */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <label style={lbl}>Sizes / Variants</label>
              <button onClick={() => set('sizes', [...(form.sizes||[]), { name:'', priceAdjustment:0 }])}
                style={{ padding:'3px 10px', background:C.acc+'18', border:`1px solid ${C.acc}35`,
                  borderRadius:6, color:C.acc, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                + Add Size
              </button>
            </div>
            {(form.sizes||[]).length === 0
              ? <div style={{ fontSize:12, color:C.t3, fontStyle:'italic' }}>No sizes added yet.</div>
              : (form.sizes||[]).map((size, idx) => (
                <div key={idx} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <input value={size.name}
                    onChange={e => { const s=[...(form.sizes||[])]; s[idx]={...s[idx],name:e.target.value}; set('sizes',s) }}
                    placeholder="Small / Medium / Large" style={{ ...inp, flex:2 }} />
                  <input type="number" value={size.priceAdjustment||''}
                    onChange={e => { const s=[...(form.sizes||[])]; s[idx]={...s[idx],priceAdjustment:e.target.value===''?0:parseFloat(e.target.value)}; set('sizes',s) }}
                    placeholder="+/- price" style={{ ...inp, flex:1 }} />
                  <button onClick={() => set('sizes',(form.sizes||[]).filter((_,i)=>i!==idx))}
                    style={{ padding:'6px 9px', background:C.red+'14', border:`1px solid ${C.red}35`, borderRadius:6, color:C.red, cursor:'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ))
            }
          </div>

          {/* Add-ons */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <label style={lbl}>Add-ons / Extras</label>
              <button onClick={() => set('addons', [...(form.addons||[]), { name:'', price:0 }])}
                style={{ padding:'3px 10px', background:C.acc+'18', border:`1px solid ${C.acc}35`,
                  borderRadius:6, color:C.acc, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                + Add Extra
              </button>
            </div>
            {(form.addons||[]).length === 0
              ? <div style={{ fontSize:12, color:C.t3, fontStyle:'italic' }}>No add-ons added yet.</div>
              : (form.addons||[]).map((addon, idx) => (
                <div key={idx} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <input value={addon.name}
                    onChange={e => { const a=[...(form.addons||[])]; a[idx]={...a[idx],name:e.target.value}; set('addons',a) }}
                    placeholder="e.g. Extra Cheese, Bacon" style={{ ...inp, flex:2 }} />
                  <input type="number" value={addon.price||''}
                    onChange={e => { const a=[...(form.addons||[])]; a[idx]={...a[idx],price:e.target.value===''?0:parseFloat(e.target.value)}; set('addons',a) }}
                    placeholder="Price" style={{ ...inp, flex:1 }} />
                  <button onClick={() => set('addons',(form.addons||[]).filter((_,i)=>i!==idx))}
                    style={{ padding:'6px 9px', background:C.red+'14', border:`1px solid ${C.red}35`, borderRadius:6, color:C.red, cursor:'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ))
            }
          </div>

          {formErr && (
            <div style={{ background:C.red+'14', border:`1px solid ${C.red}35`, borderRadius:8,
              padding:'10px 14px', fontSize:12, color:C.red, marginBottom:16 }}>
              {formErr}
            </div>
          )}

          <div style={{ height:20 }} />
        </div>

        {/* Sticky footer */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`,
          display:'flex', gap:10, flexShrink:0, background:C.panel }}>
          <button onClick={handleClose}
            style={{ flex:1, padding:'10px 0', background:'transparent', border:`1px solid ${C.border}`,
              borderRadius:8, color:C.t2, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={!form.name || !form.price || saveMut.isPending}
            style={{ flex:2, padding:'10px 0', background:C.acc, border:'none',
              borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              opacity:(!form.name || !form.price || saveMut.isPending) ? 0.5 : 1,
              boxShadow: saveMut.isPending ? 'none' : `0 4px 14px ${C.acc}40` }}>
            {saveMut.isPending ? 'Saving…' : (isEdit ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Menu Items Tab ────────────────────────────────────────────
function MenuItemsTab({ clientId }) {
  const qc = useQueryClient()
  const [catFilter, setCatFilter] = useState('All')
  const [search,    setSearch]    = useState('')
  const [drawer,    setDrawer]    = useState(null) // null | {} (new) | item (edit)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [formErr, setFormErr] = useState('')

  const { data: items=[], isLoading } = useQuery({
    queryKey: ['menu-items', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/menu-items`),
    enabled: !!clientId,
    staleTime: 30_000,
  })

  const ordered = useMemo(() =>
    items.filter(i =>
      (catFilter === 'All' || i.category?.name === catFilter) &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ), [items, catFilter, search])

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/clients/${clientId}/menu-items/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries(['menu-items', clientId])
  })

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }) => apiFetch(`/clients/${clientId}/menu-items/${id}`, 'PUT', { isAvailable }),
    onSuccess: () => qc.invalidateQueries(['menu-items', clientId])
  })

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }) => apiFetch(`/clients/${clientId}/menu-items/${id}`, 'PUT', { isFeatured }),
    onMutate: async ({ id, isFeatured }) => {
      const prev = qc.getQueryData(['menu-items', clientId])
      qc.setQueryData(['menu-items', clientId], old => (old || []).map(i => i.id === id ? { ...i, isFeatured } : i))
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['menu-items', clientId], ctx.prev),
    onSettled: () => qc.invalidateQueries(['menu-items', clientId])
  })

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    // Optimistic update — move in cache immediately so UI is instant
    const allItems = qc.getQueryData(['menu-items', clientId]) || []
    const fromIdx = allItems.findIndex(i => i.id === active.id)
    const toIdx   = allItems.findIndex(i => i.id === over.id)
    const reordered = arrayMove(allItems, fromIdx, toIdx)
    qc.setQueryData(['menu-items', clientId], reordered)
    // Fire API in background — no await, no loading spinner
    apiFetch(`/clients/${clientId}/menu-items/reorder`, 'PUT', {
      items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    }).catch(() => {
      // Rollback on error
      qc.setQueryData(['menu-items', clientId], allItems)
    })
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"?`)) deleteMut.mutate(id)
  }

  const saveMenuItemDirectly = async (itemData) => {
    let categoryId = null
    if (itemData.categoryName?.trim()) {
      const cats = await apiFetch(`/clients/${clientId}/menu-categories`)
      const existing = cats.find(c => c.name.toLowerCase() === itemData.categoryName.trim().toLowerCase())
      if (existing) { categoryId = existing.id }
      else {
        const created = await apiFetch(`/clients/${clientId}/menu-categories`, 'POST', { name: itemData.categoryName.trim(), sortOrder: 0 })
        categoryId = created.id
      }
    }
    return apiFetch(`/clients/${clientId}/menu-items`, 'POST', {
      name: itemData.name.trim(), description: itemData.description?.trim() || null,
      price: itemData.price ? parseFloat(itemData.price) : null,
      imageUrl: itemData.imageUrl || null, isFeatured: itemData.isFeatured || false,
      isAvailable: true, sortOrder: 0, ...(categoryId ? { categoryId } : {})
    })
  }

  const handleJsonUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsProcessing(true)
    setFormErr('')
    try {
      setProcessingStatus('Reading JSON file…')
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of menu items')
      setProcessingStatus(`Saving ${parsed.length} items…`)
      for (let i = 0; i < parsed.length; i++) {
        setProcessingStatus(`Saving item ${i + 1} of ${parsed.length}: ${parsed[i].name}`)
        await saveMenuItemDirectly({ name: parsed[i].name, price: parsed[i].price,
          description: parsed[i].description, categoryName: parsed[i].category,
          isFeatured: parsed[i].isFeatured || false, imageUrl: parsed[i].imageUrl || null })
      }
      qc.invalidateQueries(['menu-items', clientId])
      setProcessingStatus(`Successfully added ${parsed.length} items!`)
      setTimeout(() => { setProcessingStatus(''); setIsProcessing(false) }, 2000)
    } catch (err) {
      setFormErr(err.message || 'Failed to process JSON file.')
      setIsProcessing(false); setProcessingStatus('')
    }
    e.target.value = ''
  }

  if (isLoading) return <SkeletonPage cards={4} />

  const cats = ['All', ...new Set(items.map(i => i.category?.name).filter(Boolean))]

  return (
    <>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:16, gap:12, flexWrap:'wrap' }}>

        {/* Left: search + category chips */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flex:1, minWidth:0 }}>
          {/* Search */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:C.t3, pointerEvents:'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
              style={{ ...inp, width:180, paddingLeft:28, padding:'7px 11px 7px 28px' }} />
          </div>
          {/* Category chips */}
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 13px', borderRadius:99, fontSize:12, cursor:'pointer', fontWeight:600, fontFamily:'inherit',
                border:`1px solid ${catFilter===c ? C.acc : C.border}`,
                background: catFilter===c ? C.acc+'18' : 'transparent',
                color: catFilter===c ? C.acc : C.t3, transition:'all 0.12s' }}>
              {c}
              {c !== 'All' && <span style={{ marginLeft:5, fontSize:10, opacity:0.7 }}>
                {items.filter(i => i.category?.name === c).length}
              </span>}
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => document.getElementById('menu-json-upload').click()}
            disabled={isProcessing}
            style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:7,
              color:C.t2, fontWeight:600, fontSize:12, cursor:isProcessing ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, opacity:isProcessing ? 0.5 : 1 }}>
            {isProcessing ? <Loader2 size={13} /> : <Upload size={13} />}
            {isProcessing ? 'Processing…' : 'Import JSON'}
          </button>
          <input id="menu-json-upload" type="file" accept=".json" style={{ display:'none' }} onChange={handleJsonUpload} />
          <button onClick={() => setDrawer({})}
            style={{ padding:'7px 16px', background:C.acc, border:'none', borderRadius:7,
              color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:6, boxShadow:`0 4px 14px ${C.acc}40` }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Processing status */}
      {processingStatus && (
        <div style={{ background:C.acc+'14', border:`1px solid ${C.acc}35`, borderRadius:10,
          padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <Loader2 size={14} style={{ color:C.acc }} />
          <span style={{ fontSize:13, color:C.acc, fontWeight:600 }}>{processingStatus}</span>
        </div>
      )}
      {formErr && (
        <div style={{ background:C.red+'14', border:`1px solid ${C.red}35`, borderRadius:10,
          padding:'10px 14px', marginBottom:14, fontSize:12, color:C.red }}>
          {formErr}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {[
          { label:'Total Items', value: items.length },
          { label:'Available',   value: items.filter(i => i.isAvailable).length, color: C.green },
          { label:'Featured',    value: items.filter(i => i.isFeatured).length, color: '#F59E0B' },
          { label:'Categories',  value: cats.length - 1 },
        ].map(s => (
          <div key={s.label} style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:8, padding:'8px 16px', display:'flex', flexDirection:'column', gap:2 }}>
            <span style={{ fontSize:18, fontWeight:800, color: s.color || C.t0 }}>{s.value}</span>
            <span style={{ fontSize:10, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Item list */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ordered.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {ordered.length === 0 ? (
              <div style={{ padding:'48px 32px', textAlign:'center', background:C.panel,
                border:`1px dashed ${C.border}`, borderRadius:12, color:C.t3 }}>
                <Utensils size={32} style={{ marginBottom:12, opacity:0.3 }} />
                <div style={{ fontSize:14, fontWeight:600, color:C.t2, marginBottom:4 }}>No items yet</div>
                <div style={{ fontSize:12 }}>Click <strong style={{ color:C.acc }}>Add Item</strong> to get started</div>
              </div>
            ) : ordered.map(item => (
              <SortableCard
                key={item.id} item={item}
                onEdit={(item) => setDrawer(item)}
                onDelete={handleDelete}
                onToggle={(item) => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                isPendingToggle={toggleAvailability.isPending}
                onToggleFeatured={(item) => toggleFeatured.mutate({ id: item.id, isFeatured: !item.isFeatured })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Slide-in drawer */}
      {drawer !== null && (
        <ItemDrawer
          clientId={clientId}
          editingItem={drawer?.id ? drawer : null}
          onClose={() => setDrawer(null)}
          onSaved={() => {}}
        />
      )}
    </>
  )
}