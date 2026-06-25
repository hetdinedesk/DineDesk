import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { getBanners, createBanner, updateBanner, deleteBanner, reorderBanners } from '../api/banners'
import ImageUpload from '../Components/ImageUpload'
import ConfirmationModal from '../Components/ConfirmationModal'
import { C } from '../theme'

const ToggleSwitch = ({ checked, onChange, label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`
    }}
  >
    <div style={{
      width: 36, height: 20,
      borderRadius: 10, background: checked ? C.green : C.border,
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', position: 'absolute', top: 3,
        left: checked ? 19 : 3, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
    {label && <span style={{ fontSize: 13, color: C.t1 }}>{label}</span>}
  </div>
)

const InputField = ({ label, value, onChange, placeholder, type = 'text', required, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
    }}>{label} {required && <span style={{ color: C.red }}>*</span>}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
        borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box'
      }}
    />
    {hint && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>}
  </div>
)

const btnCyan = { padding: '6px 12px', background: C.acc+'18', border: `1px solid ${C.acc}35`, borderRadius: 7, color: C.acc, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display:'inline-flex', alignItems:'center' }
const btnDanger = { padding: '6px 12px', background: C.red+'14', border: `1px solid ${C.red}35`, borderRadius: 7, color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display:'inline-flex', alignItems:'center' }

function SortableBannerRow({ b, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id })
  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.4 : (b.isActive === false ? 0.65 : 1),
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
      background: C.panel, border: `1px solid ${isDragging ? C.acc : C.border}`,
      borderRadius: 12, boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
    }}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <GripVertical size={16} />
      </span>
      {b.imageUrl
        ? <img src={b.imageUrl} alt="" style={{ width: 110, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
        : <div style={{ width: 110, height: 52, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: C.t3 }}>No image</span>
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: C.t0, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.title || <em style={{ color: C.t3, fontWeight: 400 }}>Untitled</em>}
        </div>
        {b.subtitle && <div style={{ fontSize: 12, color: C.t2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.subtitle}</div>}
        <div style={{ fontSize: 11, color: C.t3, marginTop: 4, display: 'flex', gap: 10 }}>
          {b.buttonText && <span style={{ color: C.acc }}>→ {b.buttonText}</span>}
          {b.buttonUrl && <span style={{ color: b.isExternal ? C.red : C.green }}>{b.isExternal ? 'External link' : 'Internal link'}</span>}
        </div>
      </div>
      <ToggleSwitch checked={b.isActive !== false} onChange={() => onToggle(b)} />
      <button type="button" onClick={() => onEdit(b)} style={btnCyan}>Edit</button>
      <button type="button" onClick={() => onDelete(b.id)} style={btnDanger}>Delete</button>
    </div>
  )
}

export default function HomepageBanners({ clientId }) {
  const [modal, setModal] = useState(null)
  const [delId, setDelId] = useState(null)

  const { data: banners = [] } = useQuery({
    queryKey: ['banners', clientId],
    queryFn: () => getBanners(clientId),
    staleTime: Infinity,
  })

  // Filter for homepage banners only and sort by sortOrder
  const homepageBanners = banners
    .filter(b => b.location === 'home' || b.location === 'both')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  const qc = useQueryClient()

  const mCreate = useMutation({
    mutationFn: (body) => createBanner(clientId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners', clientId] }); qc.invalidateQueries({ queryKey: ['navbar', clientId] }) }
  })
  const mUpdate = useMutation({
    mutationFn: ({ id, body }) => updateBanner(clientId, id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners', clientId] }); qc.invalidateQueries({ queryKey: ['navbar', clientId] }) }
  })
  const mDelete = useMutation({
    mutationFn: (id) => deleteBanner(clientId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banners', clientId] }); qc.invalidateQueries({ queryKey: ['navbar', clientId] }) }
  })
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const all = qc.getQueryData(['banners', clientId]) || []
    const fromIdx = all.findIndex(b => b.id === active.id)
    const toIdx   = all.findIndex(b => b.id === over.id)
    const reordered = arrayMove(all, fromIdx, toIdx)
    qc.setQueryData(['banners', clientId], reordered)
    reorderBanners(clientId, reordered.map(b => b.id)).catch(() => {
      qc.setQueryData(['banners', clientId], all)
    })
  }

  const openAdd = () => setModal({
    title: '', subtitle: '', text: '', imageUrl: '', buttonText: '', buttonUrl: '', 
    widthPx: '', heightPx: '', isActive: true, isExternal: false, location: 'home'
  })
  
  const openEdit = (b) => setModal({ 
    ...b, 
    widthPx: b.widthPx ?? '', 
    heightPx: b.heightPx ?? '',
    subtitle: b.subtitle || '',
    buttonText: b.buttonText || '',
    buttonUrl: b.buttonUrl || '',
    isExternal: b.isExternal || false,
    location: b.location || 'home'
  })

  const save = () => {
    if (!modal?.title?.trim()) return
    const body = {
      title: modal.title || null,
      subtitle: modal.subtitle || null,
      text: modal.text?.trim() || null,
      imageUrl: modal.imageUrl || null,
      buttonText: modal.buttonText || null,
      buttonUrl: modal.buttonUrl || null,
      isExternal: modal.isExternal || false,
      location: 'home', // Force to home for homepage banners
      widthPx: modal.widthPx === '' || modal.widthPx == null ? null : Number(modal.widthPx),
      heightPx: modal.heightPx === '' || modal.heightPx == null ? null : Number(modal.heightPx),
      isActive: modal.isActive !== false
    }
    if (modal.id && !String(modal.id).startsWith('temp')) mUpdate.mutate({ id: modal.id, body })
    else mCreate.mutate(body)
    setModal(null)
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: C.t0 }}>
        Homepage Banners
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: C.t2 }}>
        Manage banners displayed in the homepage carousel. These appear at the top of your homepage with auto-scroll.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <button
          type="button"
          onClick={openAdd}
          style={{
            padding: '10px 20px', background: C.acc, border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          + Add Homepage Banner
        </button>
      </div>

      {homepageBanners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No homepage banners yet</div>
          <div style={{ fontSize: 13 }}>Add your first banner to appear in the homepage carousel</div>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={homepageBanners.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {homepageBanners.map(b => (
                <SortableBannerRow
                  key={b.id} b={b}
                  onEdit={openEdit}
                  onDelete={(id) => setDelId(id)}
                  onToggle={(b) => mUpdate.mutate({ id: b.id, body: { isActive: !b.isActive } })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit/Add Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16,
            width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.t0 }}>
                {modal.id && !String(modal.id).startsWith('temp') ? 'Edit Banner' : 'Add Banner'}
              </h3>
              <button
                onClick={() => setModal(null)}
                style={{ background: 'none', border: 'none', color: C.t3, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: 20, overflow: 'auto' }}>
              <InputField label="Heading" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="Welcome to Our Restaurant" required />
              <InputField label="Subheading" value={modal.subtitle} onChange={(e) => setModal({ ...modal, subtitle: e.target.value })} placeholder="Where tradition meets innovation" />
              <InputField label="Additional text" value={modal.text} onChange={(e) => setModal({ ...modal, text: e.target.value })} placeholder="Optional extra text" hint="Shown below subheading if needed" />
              
              <div style={{ marginBottom: 16 }}>
                <ImageUpload
                  clientId={clientId}
                  label="Banner Image"
                  value={modal.imageUrl}
                  onChange={(url) => setModal({ ...modal, imageUrl: url })}
                  displayDimensions={{ width: 1920, height: 600 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <InputField
                    label="Width (px)"
                    type="number"
                    value={modal.widthPx}
                    onChange={(e) => setModal({ ...modal, widthPx: e.target.value })}
                    placeholder="e.g. 1920"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <InputField
                    label="Height (px)"
                    type="number"
                    value={modal.heightPx}
                    onChange={(e) => setModal({ ...modal, heightPx: e.target.value })}
                    placeholder="e.g. 600"
                  />
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontWeight: 600, color: C.t0, marginBottom: 12 }}>Call-to-Action Button</div>
                <InputField label="Button text" value={modal.buttonText} onChange={(e) => setModal({ ...modal, buttonText: e.target.value })} placeholder="e.g. View Menu, Book Now" />
                <InputField label="Button link URL" value={modal.buttonUrl} onChange={(e) => setModal({ ...modal, buttonUrl: e.target.value })} placeholder="/menu or https://external.com" hint="Internal: /page-path | External: https://..." />
                <div style={{ marginTop: 12 }}>
                  <ToggleSwitch
                    checked={modal.isExternal || false}
                    onChange={() => setModal({ ...modal, isExternal: !modal.isExternal })}
                    label="External link (opens in new tab)"
                  />
                </div>
              </div>

              <div style={{ padding: 16, background: C.card, borderRadius: 8, marginTop: 20 }}>
                <ToggleSwitch
                  checked={modal.isActive !== false}
                  onChange={() => setModal({ ...modal, isActive: !modal.isActive })}
                  label="Active (visible on homepage)"
                />
              </div>
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                style={{ padding: '10px 20px', background: C.acc, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Save Banner
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!delId}
        onClose={() => setDelId(null)}
        title="Delete banner"
        message="Remove this banner from the homepage carousel?"
        onConfirm={() => { mDelete.mutate(delId); setDelId(null) }}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
