import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Utensils, Trash2, Image as ImageIcon, Upload, Loader2 } from 'lucide-react'
import { getMenuItems, deleteMenuItem, reorderMenuItems } from '../api/menuItems'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { apiFetch } from '../api/utils'
import ImageUpload from '../Components/ImageUpload'
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

// ── Menu Items Tab ────────────────────────────────────────────
function MenuItemsTab({ clientId }) {
  const qc = useQueryClient()
  const [catFilter, setCatFilter] = useState('All')
  const [search,    setSearch]    = useState('')
  const [adding,    setAdding]    = useState(false)
  const [newItem,   setNewItem]   = useState({ name:'', price:'', description:'', categoryName:'', isFeatured:false, imageUrl:'' })
  const [formErr, setFormErr] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initialNewItem = useMemo(() => ({ name:'', price:'', description:'', categoryName:'', isFeatured:false, imageUrl:'' }), [])
  useEffect(() => {
    const hasChanges = JSON.stringify(newItem) !== JSON.stringify(initialNewItem)
    setHasUnsavedChanges(hasChanges)
  }, [newItem, initialNewItem])

  const { data: items=[], isLoading } = useQuery({
    queryKey: ['menu-items', clientId],
    queryFn:  () => apiFetch(`/clients/${clientId}/menu-items`),
    enabled: !!clientId
  })

  const ordered = useMemo(() => 
    items.filter(i =>
      (catFilter==='All' || i.category?.name===catFilter) &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ), [items, catFilter, search])

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
        imageUrl:    newItem.imageUrl || null,
        isFeatured:  newItem.isFeatured,
        isAvailable: true,
        sortOrder:   0,
        ...(categoryId ? { categoryId } : {})
      })
    },
    onSuccess: () => {
      qc.invalidateQueries(['menu-items', clientId])
      setNewItem({ name:'', price:'', description:'', categoryName:'', isFeatured:false, imageUrl:'' })
      setAdding(false)
      setHasUnsavedChanges(false)
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
    await apiFetch(`/clients/${clientId}/menu-items/reorder`, 'PUT', {
      items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    })
    qc.invalidateQueries(['menu-items', clientId])
  }

  const extractMenuItemsFromImages = async (imageFiles) => {
    const allItems = []

    // Convert all images to base64 with mime type
    const images = await Promise.all(imageFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result) // Keep full data URL with mime type
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }))

    setProcessingStatus('Analyzing menu photos with AI...')
    
    // Call backend API which handles Hugging Face
    const result = await apiFetch(`/clients/${clientId}/extract-menu-items`, 'POST', { images })
    
    return result.items || []
  }

  const saveMenuItemDirectly = async (itemData) => {
    let categoryId = null
    if (itemData.categoryName?.trim()) {
      const cats = await apiFetch(`/clients/${clientId}/menu-categories`)
      const existing = cats.find(c =>
        c.name.toLowerCase() === itemData.categoryName.trim().toLowerCase()
      )
      if (existing) {
        categoryId = existing.id
      } else {
        const created = await apiFetch(`/clients/${clientId}/menu-categories`, 'POST', {
          name: itemData.categoryName.trim(),
          sortOrder: 0
        })
        categoryId = created.id
      }
    }

    return apiFetch(`/clients/${clientId}/menu-items`, 'POST', {
      name: itemData.name.trim(),
      description: itemData.description?.trim() || null,
      price: itemData.price ? parseFloat(itemData.price) : null,
      imageUrl: itemData.imageUrl || null,
      isFeatured: itemData.isFeatured || false,
      isAvailable: true,
      sortOrder: 0,
      ...(categoryId ? { categoryId } : {})
    })
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsProcessing(true)
    setFormErr('')
    
    try {
      setProcessingStatus('Analyzing menu photos with AI...')
      const extractedItems = await extractMenuItemsFromImages(files)
      
      if (extractedItems.length === 0) {
        setFormErr('No menu items could be extracted from the photos. Please try clearer images.')
        setIsProcessing(false)
        setProcessingStatus('')
        return
      }

      setProcessingStatus(`Saving ${extractedItems.length} menu items...`)
      
      for (let i = 0; i < extractedItems.length; i++) {
        setProcessingStatus(`Saving item ${i + 1} of ${extractedItems.length}: ${extractedItems[i].name}`)
        await saveMenuItemDirectly({
          name: extractedItems[i].name,
          price: extractedItems[i].price,
          description: extractedItems[i].description,
          categoryName: extractedItems[i].category,
          isFeatured: false,
          imageUrl: null
        })
      }

      qc.invalidateQueries(['menu-items', clientId])
      setProcessingStatus(`Successfully added ${extractedItems.length} items!`)
      
      setTimeout(() => {
        setProcessingStatus('')
        setIsProcessing(false)
      }, 2000)
      
    } catch (err) {
      console.error('Photo upload error:', err)
      setFormErr(err.message || 'Failed to process photos. Please check your API key and try again.')
      setIsProcessing(false)
      setProcessingStatus('')
    }
    
    // Reset file input
    e.target.value = ''
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
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => { setAdding(!adding); setFormErr('') }}
            style={{ padding:'8px 16px', background:C.acc, border:'none', borderRadius:7,
              color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            + Add Menu Item
          </button>
          <button onClick={() => document.getElementById('menu-photo-upload').click()}
            disabled={isProcessing}
            style={{ padding:'8px 16px', background:C.card, border:`1px solid ${C.border}`, borderRadius:7,
              color:C.t1, fontWeight:700, fontSize:13, cursor:isProcessing ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:6, opacity:isProcessing ? 0.5 : 1 }}>
            {isProcessing ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
            {isProcessing ? 'Processing...' : 'Upload Menu Photos'}
          </button>
          <input
            id="menu-photo-upload"
            type="file"
            accept="image/*"
            multiple
            style={{ display:'none' }}
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      {processingStatus && (
        <div style={{ background:C.accBg, border:`1px solid ${C.acc}40`, borderRadius:10,
          padding:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <Loader2 size={16} className="spin" style={{ color:C.acc }} />
          <span style={{ fontSize:13, color:C.acc, fontWeight:600 }}>{processingStatus}</span>
        </div>
      )}

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
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Item Image</label>
            <ImageUpload
              clientId={clientId}
              value={newItem.imageUrl || ''}
              onChange={(url) => setNewItem(p => ({...p, imageUrl: url}))}
            />
            <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>
              Optional image for this menu item. If not provided, a default image will be used.
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
              setNewItem({ name:'', price:'', description:'', categoryName:'', isFeatured:false, imageUrl:'' })
            }}
              style={{ padding:'9px 14px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t2, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordered.map(i => i.id)} strategy={verticalListSortingStrategy}>
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
                    <div
                      title={item.isAvailable ? 'Click to mark unavailable' : 'Click to mark available'}
                      onClick={() => !toggleAvailability.isPending && toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                      style={{ width: 40, height: 20, borderRadius: 10, cursor: 'pointer', background: item.isAvailable ? C.green : C.border2, position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: toggleAvailability.isPending ? 0.5 : 1 }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: item.isAvailable ? 21 : 2, transition: 'left 0.2s' }} />
                    </div>,
                    <button onClick={() => window.confirm(`Delete "${item.name}"?`) && deleteMut.mutate(item.id)}
                      style={{ padding:'4px 8px', background:'transparent',
                        border:`1px solid ${C.red}40`, borderRadius:4,
                        color:C.red, fontSize:11, cursor:'pointer' }} title="Delete"><Trash2 size={14} /></button>
                  ]}/>
                ))}
                {ordered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:28, textAlign:'center',
                    color:C.t3, fontSize:13, fontStyle:'italic' }}>
                    No items yet. Click + Add Menu Item above.
                  </td></tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
    </>
  )
}