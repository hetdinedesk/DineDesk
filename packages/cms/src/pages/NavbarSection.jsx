import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { API } from '../api/utils'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Menu, ImageIcon, PanelBottom, FileText, Plus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../Components/LoadingSpinner'
import ImageUpload from '../Components/ImageUpload'
import ConfirmationModal from '../Components/ConfirmationModal'
import { getNavbar, saveNavbar as saveNavbarApi } from '../api/navbar'
import { getPages, createPage, updatePage, deletePage } from '../api/pages'
import { getBanners, createBanner, updateBanner, deleteBanner } from '../api/banners'
import PageEditor from '../Components/PageEditor'
import { C } from '../theme'

const ToggleSwitch = memo(({ checked, onChange, size = 'small', label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`
    }}
  >
    <div style={{
      width: size === 'small' ? 36 : 44, height: size === 'small' ? 20 : 24,
      borderRadius: size === 'small' ? 10 : 12, background: checked ? C.green : C.border,
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: size === 'small' ? 14 : 18, height: size === 'small' ? 14 : 18, borderRadius: '50%',
        background: '#fff', position: 'absolute', top: 3,
        left: checked ? (size === 'small' ? 19 : 23) : 3, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
    {label && <span style={{ fontSize: 13, color: C.t1 }}>{label}</span>}
  </div>
))

const SectionHeader = memo(({ title, Icon, onAdd, addLabel = 'Add' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {Icon && <Icon size={16} style={{ color: C.t2 }} />}
      <span style={{ fontSize: 13, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
    </div>
    {onAdd && (
      <button type="button" onClick={onAdd} style={{
        padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6,
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
      }}>+ {addLabel}</button>
    )}
  </div>
))

const InputField = memo(({ label, value, onChange, placeholder, type = 'text', required, hint }) => (
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
))

const TextArea = memo(({ label, value, onChange, placeholder, rows = 4, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
    }}>{label}</label>
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
        borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box',
        resize: 'vertical', fontFamily: 'inherit'
      }}
    />
    {hint && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>}
  </div>
))

const Modal = memo(({ isOpen, onClose, title, children, onSave, saveLabel = 'Save' }) => {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16,
        width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto'
      }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, color: C.t0, fontSize: 18 }}>{title}</h3>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
        <div style={{
          padding: 24, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end'
        }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border2}`,
            borderRadius: 8, color: C.t2, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
          }}>Cancel</button>
          <button type="button" onClick={onSave} style={{
            padding: '10px 24px', background: C.green, border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}>{saveLabel}</button>
        </div>
      </div>
    </div>
  )
})

function slugify (title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const isTempId = (id) => !id || String(id).startsWith('temp-')

/** Navbar PUT payload — include stable ids for upsert */
function serializeHeaderSections (sections) {
  return sections.map((row) => ({
    id: row.id,
    label: row.label,
    url: row.url || null,
    imageUrl: row.imageUrl || null,
    pageId: row.pageId || null,
    isActive: row.isActive !== false,
    children: (row.children || []).map((c) => {
      const child = {
        label: c.label,
        url: c.url || '',
        imageUrl: c.imageUrl || null,
        isActive: c.isActive !== false,
        pageId: c.pageId || null
      }
      // Use c.id if it's not a temp-h- or temp-pg- id
      if (c.id && !String(c.id).startsWith('temp-')) child.id = c.id
      return child
    })
  }))
}

function serializeFooterSections (sections) {
  return sections.map((s) => ({
    title: s.title,
    isActive: s.isActive !== false,
    links: (s.links || []).map((l) => ({
      label: l.label,
      pageId: l.pageId || null,
      externalUrl: l.externalUrl || null
    }))
  }))
}

export default function NavbarSection ({ clientId, subsection = 'header-sections' }) {
  useEffect(() => {
    // Component mounted
  }, [clientId])

  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['navbar', clientId],
    queryFn: () => getNavbar(clientId),
    staleTime: 30_000
  })

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: C.t2 }}>
        <LoadingSpinner />
        <div style={{ marginTop: 16, fontSize: 13 }}>Loading navigation…</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {subsection === 'header-sections' && (
        <HeaderSectionsPanel clientId={clientId} data={data} qc={qc} />
      )}
      {subsection === 'banners' && (
        <BannersPanel clientId={clientId} data={data} qc={qc} />
      )}
      {subsection === 'footer-sections' && (
        <FooterSectionsPanel clientId={clientId} data={data} qc={qc} />
      )}
    </div>
  )
}

function SortableHeadingRow ({ h, pages, onEdit, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: h.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 12
  }
  const childCount = (h.children || []).length
  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, fontSize: 18 }}>⋮⋮</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: h.isActive ? C.t0 : C.t3 }}>{h.label}</div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
          {h.pageId
            ? (pages.find((p) => p.id === h.pageId)?.title || 'Linked page')
            : (h.url || 'Heading only (no link)')}
          {' · '}
          <span style={{ color: C.t3 }}>{childCount} page{childCount === 1 ? '' : 's'} in menu</span>
        </div>
      </div>
      <ToggleSwitch checked={h.isActive !== false} onChange={() => onToggle(h.id)} size="small" />
      <button type="button" onClick={() => onEdit(h)} style={btnCyan}>Edit</button>
      <button type="button" onClick={() => onDelete(h.id)} style={btnDanger} title="Delete"><Trash2 size={16} /></button>
    </div>
  )
}

function HeaderSectionsPanel ({ clientId, data, qc }) {
  const [headerSubTab, setHeaderSubTab] = useState('headings')
  const [sections, setSections] = useState(data?.headerSections || [])
  const [headerModal, setHeaderModal] = useState(null)
  const [pageModal, setPageModal] = useState(null)
  const [pageHeaderId, setPageHeaderId] = useState(null)
  const [navError, setNavError] = useState('')

  useEffect(() => {
    setSections(data?.headerSections || [])
  }, [data?.headerSections])

  const saveNav = useMutation({
    mutationFn: (next) => saveNavbarApi(clientId, { headerSections: serializeHeaderSections(next) }),
    onSuccess: () => {
      setNavError('')
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    },
    onError: (e) => {
      const msg = e?.response?.data?.error || e?.message || 'Save failed'
      setNavError(msg)
    }
  })

  const persist = useCallback((next) => {
    setSections(next)
    setNavError('')
    saveNav.mutate(next)
  }, [saveNav])

  const onHeadingReorder = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    persist(arrayMove(sections, oldIndex, newIndex))
  }

  const onPageDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (!draggableId.startsWith('pg-')) return
    const childId = draggableId.slice(3)
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const next = sections.map((h) => ({
      ...h,
      children: [...(h.children || [])]
    }))

    let moved = null
    for (const h of next) {
      const i = h.children.findIndex((c) => c.id === childId)
      if (i >= 0) {
        moved = h.children.splice(i, 1)[0]
        break
      }
    }
    if (!moved) return

    const dest = next.find((h) => h.id === destination.droppableId)
    if (!dest) return
    dest.children.splice(destination.index, 0, moved)
    persist(next)
  }

  const openAddHeader = () => {
    setHeaderModal({
      label: '',
      linkType: 'none',
      pageId: '',
      externalUrl: '',
      imageUrl: '',
      isActive: true
    })
  }

  const saveHeaderModal = () => {
    if (!headerModal?.label?.trim()) return
    let url = ''
    let pageId = null
    if (headerModal.linkType === 'internal' && headerModal.pageId) {
      pageId = headerModal.pageId
      const p = (data?.pages || []).find((x) => x.id === pageId)
      url = p ? `/${String(p.slug || '').replace(/^\//, '')}` : ''
    } else if (headerModal.linkType === 'external') {
      url = headerModal.externalUrl || ''
    }
    const row = {
      id: `temp-h-${Date.now()}`,
      label: headerModal.label.trim(),
      url,
      imageUrl: headerModal.imageUrl || null,
      pageId,
      isActive: headerModal.isActive !== false,
      children: []
    }
    persist([...sections, row])
    setHeaderModal(null)
  }

  const saveEditHeader = () => {
    if (!headerModal?.label?.trim()) return
    let url = ''
    let pageId = null
    if (headerModal.linkType === 'internal' && headerModal.pageId) {
      pageId = headerModal.pageId
      const p = (data?.pages || []).find((x) => x.id === pageId)
      url = p ? `/${String(p.slug || '').replace(/^\//, '')}` : ''
    } else if (headerModal.linkType === 'external') {
      url = headerModal.externalUrl || ''
    }
    const next = sections.map((s) => {
      if (s.id !== headerModal.id) return s
      return {
        ...s,
        label: headerModal.label.trim(),
        url,
        imageUrl: headerModal.imageUrl || null,
        pageId,
        isActive: headerModal.isActive !== false
      }
    })
    persist(next)
    setHeaderModal(null)
  }

  const editHeader = (h) => {
    const linkType = h.pageId ? 'internal' : h.url && /^https?:/i.test(h.url) ? 'external' : 'none'
    setHeaderModal({
      id: h.id,
      label: h.label,
      linkType,
      pageId: h.pageId || '',
      externalUrl: linkType === 'external' ? h.url : '',
      imageUrl: h.imageUrl || '',
      isActive: h.isActive !== false
    })
  }

  const deleteHeader = async (id) => {
    const h = sections.find((s) => s.id === id)
    if (!window.confirm('Delete this header and all pages listed under it? This removes those pages from the site.')) return
    try {
      for (const c of (h?.children || [])) {
        if (c.pageId) await deletePage(clientId, c.pageId)
      }
      persist(sections.filter((s) => s.id !== id))
    } catch (e) {
      setNavError(e?.response?.data?.error || e?.message || 'Delete failed')
    }
  }

  const toggleHeader = (id) => {
    const next = sections.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    persist(next)
  }

  const openAddPage = (headerId) => {
    if (isTempId(headerId)) {
      setNavError('This header is still saving. Wait a moment, then try again.')
      return
    }
    setPageHeaderId(headerId)
    setPageModal({
      pageId: '',
      label: '',
      imageUrl: ''
    })
  }

  const saveAddNavPage = async () => {
    if (!pageModal?.pageId) return alert('Select a page')
    const p = (data?.pages || []).find(x => x.id === pageModal.pageId)
    if (!p) return

    const label = pageModal.label?.trim() || p.title
    const url = `/${String(p.slug || '').replace(/^\//, '')}`

    const next = sections.map((h) => {
      if (h.id !== pageHeaderId) return h
      const children = [...(h.children || [])]
      children.push({
        id: `temp-pg-${Date.now()}`,
        label,
        url,
        imageUrl: pageModal.imageUrl || null,
        pageId: p.id,
        isActive: true
      })
      return { ...h, children }
    })
    
    persist(next)
    setPageModal(null)
    setPageHeaderId(null)
  }

  const editPage = (child, headerId) => {
    setPageHeaderId(headerId)
    setPageModal({ ...child, _editing: true })
  }

  const saveEditPage = async () => {
    if (!pageModal?.pageId) return
    const p = (data?.pages || []).find(x => x.id === pageModal.pageId)
    
    const label = pageModal.label?.trim() || (p ? p.title : pageModal.label)
    const url = p ? `/${String(p.slug || '').replace(/^\//, '')}` : pageModal.url

    const next = sections.map((s) => ({
      ...s,
      children: (s.children || []).map((c) =>
        c.id === pageModal.id
          ? { ...c, label, url, imageUrl: pageModal.imageUrl || null, pageId: pageModal.pageId }
          : c
      )
    }))
    persist(next)
    setPageModal(null)
    setPageHeaderId(null)
  }

  const deletePageFull = async (child) => {
    if (!window.confirm('Delete this page? It will be removed from the site.')) return
    setNavError('')
    try {
      await deletePage(clientId, child.pageId)
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    } catch (e) {
      setNavError(e?.response?.data?.error || e?.message || 'Delete failed')
    }
  }

  const pages = data?.pages || []
  const banners = data?.banners || []
  const headingIds = sections.map((s) => s.id)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
        {[
          { key: 'headings', label: '1. Navigation headings' },
          { key: 'pages', label: '2. All Pages' }
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setHeaderSubTab(t.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: headerSubTab === t.key ? 700 : 500,
              background: headerSubTab === t.key ? '#1F2D4A' : 'transparent',
              color: headerSubTab === t.key ? C.t0 : C.t2,
              borderBottom: headerSubTab === t.key ? `2px solid ${C.acc}` : '2px solid transparent'
            }}
          >{t.label}</button>
        ))}
      </div>

      {headerSubTab === 'headings' && (
        <>
          <SectionHeader title="Navigation headings" Icon={Menu} onAdd={openAddHeader} addLabel="Add heading" />
          <p style={{ fontSize: 13, color: C.t2, marginBottom: 16, lineHeight: 1.5 }}>
            These are the main navbar items. If a heading has no pages in the menu, it can link directly (internal page or external URL). If it has pages, the site typically shows them in a dropdown.
          </p>
          {sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
              No headings yet. Add one (for example &ldquo;Menu&rdquo; or &ldquo;About&rdquo;).
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onHeadingReorder}>
              <SortableContext items={headingIds} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {sections.map((h) => (
                    <SortableHeadingRow
                      key={h.id}
                      h={h}
                      pages={pages}
                      onEdit={editHeader}
                      onToggle={toggleHeader}
                      onDelete={deleteHeader}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {headerSubTab === 'pages' && (
        <PagesListPanel clientId={clientId} data={data} qc={qc} />
      )}

      {(saveNav.isError || navError) && (
        <div style={{ marginTop: 12, fontSize: 12, color: C.red }}>
          {navError || 'Save failed. Check the API and try again.'}
        </div>
      )}

      <Modal
        isOpen={!!headerModal && !headerModal.id}
        onClose={() => setHeaderModal(null)}
        title="Add navigation heading"
        onSave={saveHeaderModal}
      >
        <HeaderModalFields
          headerModal={headerModal}
          setHeaderModal={setHeaderModal}
          pages={pages}
          clientId={clientId}
        />
      </Modal>

      <Modal
        isOpen={!!headerModal && !!headerModal.id}
        onClose={() => setHeaderModal(null)}
        title="Edit navigation heading"
        onSave={saveEditHeader}
      >
        <HeaderModalFields
          headerModal={headerModal}
          setHeaderModal={setHeaderModal}
          pages={pages}
          clientId={clientId}
        />
      </Modal>

      <Modal
        isOpen={!!pageModal && !pageModal._editing}
        onClose={() => { setPageModal(null); setPageHeaderId(null) }}
        title="Add page under heading"
        onSave={saveAddNavPage}
        saveLabel="Add to Menu"
      >
        <PageModalFields
          clientId={clientId}
          pageModal={pageModal}
          setPageModal={setPageModal}
          pages={pages}
        />
      </Modal>

      <Modal
        isOpen={!!pageModal && pageModal._editing}
        onClose={() => setPageModal(null)}
        title="Edit menu item"
        onSave={saveEditPage}
        saveLabel="Save changes"
      >
        <PageModalFields
          clientId={clientId}
          pageModal={pageModal}
          setPageModal={setPageModal}
          pages={pages}
        />
      </Modal>
    </div>
  )
}

function HeaderModalFields ({ headerModal, setHeaderModal, pages, clientId }) {
  if (!headerModal) return null
  const linkType = headerModal.linkType || 'none'
  return (
    <>
      <InputField
        label="Title (display name)"
        value={headerModal.label}
        onChange={(e) => setHeaderModal({ ...headerModal, label: e.target.value })}
        placeholder="e.g. Menus"
        required
      />
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Link type</label>
        <select
          value={linkType}
          onChange={(e) => setHeaderModal({ ...headerModal, linkType: e.target.value, pageId: '', externalUrl: '' })}
          style={selectStyle}
        >
          <option value="none">No link (dropdown only, or label only)</option>
          <option value="internal">Internal page</option>
          <option value="external">External URL</option>
        </select>
      </div>
      {linkType === 'internal' && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Page</label>
          <select
            value={headerModal.pageId || ''}
            onChange={(e) => setHeaderModal({ ...headerModal, pageId: e.target.value })}
            style={selectStyle}
          >
            <option value="">Select page…</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}
      {linkType === 'external' && (
        <InputField
          label="URL"
          value={headerModal.externalUrl}
          onChange={(e) => setHeaderModal({ ...headerModal, externalUrl: e.target.value })}
          placeholder="https://…"
        />
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Item Image</label>
        <ImageUpload
          clientId={clientId}
          value={headerModal.imageUrl || ''}
          onChange={(url) => setHeaderModal({ ...headerModal, imageUrl: url })}
        />
        <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
          Optional image for this navigation item. If not provided, a default image will be used.
        </div>
      </div>
      <div style={{ padding: 16, background: C.card, borderRadius: 8 }}>
        <ToggleSwitch
          checked={headerModal.isActive !== false}
          onChange={() => setHeaderModal({ ...headerModal, isActive: !headerModal.isActive })}
          label="Visible in navigation"
        />
      </div>
    </>
  )
}

function PageModalFields ({ clientId, pageModal, setPageModal, pages }) {
  if (!pageModal) return null
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Select Page *</label>
        <select
          value={pageModal.pageId || ''}
          onChange={(e) => setPageModal({ ...pageModal, pageId: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select a page...</option>
          {pages.map(p => (
            <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
          ))}
        </select>
      </div>
      <InputField
        label="Custom Label (leave blank to use page title)"
        value={pageModal.label}
        onChange={(e) => setPageModal({ ...pageModal, label: e.target.value })}
        placeholder="e.g. Our History"
      />
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Item Image</label>
        <ImageUpload
          clientId={clientId}
          value={pageModal.imageUrl || ''}
          onChange={(url) => setPageModal({ ...pageModal, imageUrl: url })}
        />
        <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
          Optional image for this navigation item. If not provided, a default image will be used.
        </div>
      </div>
    </>
  )
}

function PageContentEditor ({ clientId, value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Write your page content…' }),
    ],
    content: value || '',
    editorProps: { attributes: { style: 'text-align:left' } }
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML() || ''
    if (value !== undefined && value !== null && value !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    const update = () => onChange?.(editor.getHTML() || '')
    editor.on('update', update)
    return () => editor.off('update', update)
  }, [editor, onChange])

  const insertImageFile = async (file) => {
    const localUrl = URL.createObjectURL(file)
    editor?.chain().focus().setImage({ src: localUrl }).run()

    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('dd_token')
    try {
      const res = await fetch(`${API}/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      })
      const data = await res.json()
      if (data?.url) {
        const current = editor?.getHTML() || ''
        const updated = current.replace(localUrl, data.url)
        editor?.commands.setContent(updated, false)
      }
    } catch {}
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>Content</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} style={btnSmGhost}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} style={btnSmGhost}>I</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} style={btnSmGhost}>U</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} style={btnSmGhost}>• List</button>
        <button
          type="button"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = () => {
              const f = input.files?.[0]
              if (f) insertImageFile(f)
            }
            input.click()
          }}
          style={btnSmGhost}
        >
          + Image
        </button>
      </div>
      <div
        style={{
          minHeight: 220,
          padding: '12px 14px',
          background: C.input,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          color: C.t0,
          fontSize: 13,
          lineHeight: 1.7,
          cursor: 'text'
        }}
        onClick={() => editor?.commands.focus()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file?.type?.startsWith('image/')) insertImageFile(file)
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <EditorContent editor={editor} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.t3 }}>
        Tip: drag & drop images into the editor.
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
}
const selectStyle = {
  width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.t0, fontSize: 13, boxSizing: 'border-box'
}
const btnCyan = { padding: '6px 12px', background: C.cyan, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost = { padding: '6px 12px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 6, color: C.t1, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
const btnDanger = { padding: '6px 12px', background: 'transparent', border: `1px solid ${C.red}55`, borderRadius: 6, color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
const btnSmCyan = { ...btnCyan, padding: '4px 10px', fontSize: 11 }
const btnSmGhost = { ...btnGhost, padding: '4px 10px', fontSize: 11 }
const btnSmDanger = { ...btnDanger, padding: '4px 10px', fontSize: 11 }

function BannersPanel ({ clientId, data, qc }) {
  const [modal, setModal] = useState(null)
  const [delId, setDelId] = useState(null)
  const banners = (data?.banners || []).filter(b => b.location === 'pages' || !b.location)

  const mCreate = useMutation({
    mutationFn: (body) => createBanner(clientId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['navbar', clientId] }); qc.invalidateQueries({ queryKey: ['banners', clientId] }) }
  })
  const mUpdate = useMutation({
    mutationFn: ({ id, body }) => updateBanner(clientId, id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['navbar', clientId] }); qc.invalidateQueries({ queryKey: ['banners', clientId] }) }
  })
  const mDelete = useMutation({
    mutationFn: (id) => deleteBanner(clientId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['navbar', clientId] }); qc.invalidateQueries({ queryKey: ['banners', clientId] }) }
  })

  const openAdd = () => setModal({
    title: '', subtitle: '', text: '', imageUrl: '', 
    widthPx: '', heightPx: '', isActive: true
  })
  const openEdit = (b) => setModal({ 
    ...b, 
    widthPx: b.widthPx ?? '', 
    heightPx: b.heightPx ?? '',
    subtitle: b.subtitle || ''
  })

  const save = () => {
    if (!modal?.title?.trim() && !modal?.text?.trim()) return
    const body = {
      title: modal.title || null,
      subtitle: modal.subtitle || null,
      text: modal.text?.trim() || null,
      imageUrl: modal.imageUrl || null,
      location: 'pages', // Force to pages for navigation banners
      widthPx: modal.widthPx === '' || modal.widthPx == null ? null : Number(modal.widthPx),
      heightPx: modal.heightPx === '' || modal.heightPx == null ? null : Number(modal.heightPx),
      isActive: modal.isActive !== false
    }
    if (modal.id && !String(modal.id).startsWith('temp')) mUpdate.mutate({ id: modal.id, body })
    else mCreate.mutate(body)
    setModal(null)
  }

  return (
    <div>
      <SectionHeader title="Banner library" Icon={ImageIcon} onAdd={openAdd} addLabel="Add banner" />
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
        Upload or link images with optional dimensions. Pages can reference these banners so the same creative is reused across the site.
      </p>

      {banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          No banners yet. Add one for the homepage carousel or page headers.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {banners.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 14, background: C.panel,
                border: `1px solid ${b.isActive === false ? C.border2 : C.border}`, 
                borderRadius: 10,
                opacity: b.isActive === false ? 0.7 : 1
              }}
            >
              {b.imageUrl && (
                <img src={b.imageUrl} alt="" style={{ width: 120, height: 48, objectFit: 'cover', borderRadius: 6 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: C.t0 }}>
                  {b.title || <em style={{ color: C.t3 }}>Untitled</em>}
                </div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.widthPx && b.heightPx && (
                    <span>{b.widthPx}×{b.heightPx}px</span>
                  )}
                </div>
              </div>
              <ToggleSwitch checked={b.isActive !== false} onChange={() => mUpdate.mutate({ id: b.id, body: { isActive: !b.isActive } })} size="small" />
              <button type="button" onClick={() => openEdit(b)} style={btnCyan}>Edit</button>
              <button type="button" onClick={() => setDelId(b.id)} style={btnDanger}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id && !String(modal.id).startsWith('temp') ? 'Edit banner' : 'Add banner'} onSave={save}>
        {modal && (
          <>
            {/* Header */}
            <InputField label="Heading (displayed on banner)" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="Welcome to Our Restaurant" />
            <InputField label="Subheading" value={modal.subtitle} onChange={(e) => setModal({ ...modal, subtitle: e.target.value })} placeholder="Where tradition meets innovation" />
            <InputField label="Additional text / caption" value={modal.text} onChange={(e) => setModal({ ...modal, text: e.target.value })} placeholder="Optional extra text" hint="Shown below subheading if needed" />
            
            {/* Image */}
            <div style={{ marginBottom: 16 }}>
              <ImageUpload
                clientId={clientId}
                label="Banner Image"
                value={modal.imageUrl}
                onChange={(url) => setModal({ ...modal, imageUrl: url })}
              />
            </div>

            {/* Dimensions */}
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

            {/* Active Toggle */}
            <div style={{ padding: 16, background: C.card, borderRadius: 8, marginTop: 20 }}>
              <ToggleSwitch
                checked={modal.isActive !== false}
                onChange={() => setModal({ ...modal, isActive: !modal.isActive })}
                label="Active (visible on site)"
              />
            </div>
          </>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={!!delId}
        onClose={() => setDelId(null)}
        title="Delete banner"
        message="Remove this banner from the library? Pages that reference it may lose the image."
        onConfirm={() => { mDelete.mutate(delId); setDelId(null) }}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

function SortableFooterLink ({ link, pages, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const target = link.pageId ? (pages.find(p => p.id === link.pageId)?.title || 'page') : (link.externalUrl || '—')
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.card, border: `1px solid ${C.border2}`, borderRadius: 8, marginBottom: 6 }}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, fontSize: 14, userSelect: 'none', flexShrink: 0 }}>⠿</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t0 }}>{link.label || <em style={{ color: C.t3 }}>Untitled</em>}</div>
        <div style={{ fontSize: 11, color: C.t2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target}</div>
      </div>
      <button type="button" onClick={() => onUpdate(link)} style={{ ...btnCyan, padding: '3px 8px', fontSize: 11 }}>Edit</button>
      <button type="button" onClick={onRemove} style={{ ...btnDanger, padding: '3px 8px', fontSize: 11 }} title="Remove"><Trash2 size={14} /></button>
    </div>
  )
}

function SortableUnassignedLink ({ link, pages, sections, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const target = link.pageId ? (pages.find(p => p.id === link.pageId)?.title || 'page') : (link.externalUrl || '—')
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: C.panel, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, fontSize: 14, userSelect: 'none', flexShrink: 0 }}>⠿</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: C.t0 }}>{link.label}</div>
        <div style={{ fontSize: 11, color: C.t2 }}>
          {target}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{ ...btnDanger, padding: '4px 8px', fontSize: 11 }}
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function SortableFooterSection ({ section, pages, onToggle, onAddLink, onEditLink, onRemoveLink, onReorderLinks, onDelete, onUpdateTitle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const { setNodeRef: setDroppableRef } = useDroppable({ id: section.id })
  const [expanded, setExpanded] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(section.title || '')
  const isActive = section.isActive !== false
  const links = section.links || []

  const saveTitle = () => {
    onUpdateTitle(section.id, titleValue.trim())
    setEditingTitle(false)
  }

  const onDragEndLinks = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = links.findIndex(l => l.id === active.id)
    const newIdx = links.findIndex(l => l.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    onReorderLinks(section.id, arrayMove(links, oldIdx, newIdx))
  }

  return (
    <div ref={(node) => { setNodeRef(node); setDroppableRef(node); }} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, background: C.panel, border: `1px solid ${isActive ? C.border : C.border2}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: C.card, borderBottom: expanded ? `1px solid ${C.border}` : 'none' }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, fontSize: 15, flexShrink: 0, userSelect: 'none' }}>⠿</div>
        {editingTitle ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(section.title || '') } }}
              onBlur={saveTitle}
              placeholder="Column name"
              style={{ flex: 1, padding: '6px 10px', background: C.input, border: `1px solid ${C.acc}`, borderRadius: 6, color: C.t0, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={saveTitle} style={{ ...btnCyan, padding: '4px 10px', fontSize: 11 }}>Save</button>
          </div>
        ) : (
          <div
            onClick={() => setExpanded(e => !e)}
            style={{ flex: 1, fontWeight: 700, color: isActive ? C.t0 : C.t2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {section.title || <em style={{ color: C.t3 }}>Untitled</em>}
            <span style={{ fontSize: 11, color: C.t3 }}>({links.length})</span>
            <span style={{ fontSize: 11, color: C.t3, marginLeft: 'auto' }}>{expanded ? '▲' : '▼'}</span>
          </div>
        )}
        <div
          title={isActive ? 'Visible in footer' : 'Hidden from footer'}
          onClick={() => onToggle(section.id)}
          style={{ width: 38, height: 20, borderRadius: 10, cursor: 'pointer', background: isActive ? C.green : C.border2, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
        >
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isActive ? 21 : 2, transition: 'left 0.2s' }} />
        </div>
        {!editingTitle && (
          <button type="button" onClick={() => setEditingTitle(true)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11, flexShrink: 0 }}>Edit</button>
        )}
        <button type="button" onClick={() => onAddLink(section.id)} style={{ ...btnCyan, padding: '4px 10px', fontSize: 11, flexShrink: 0 }}>+ Link</button>
        <button type="button" onClick={() => onDelete(section.id)} style={{ ...btnDanger, padding: '4px 8px', fontSize: 11, flexShrink: 0 }} title="Delete"><Trash2 size={14} /></button>
      </div>
      {expanded && (
        <div style={{ padding: links.length ? 10 : '8px 12px' }}>
          {links.length === 0 ? (
            <div style={{ fontSize: 12, color: C.t3, padding: '6px 4px', fontStyle: 'italic' }}>No links yet — click "+ Link" to add one.</div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEndLinks}>
              <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                {links.map(link => (
                  <SortableFooterLink
                    key={link.id}
                    link={link}
                    pages={pages}
                    onUpdate={onEditLink}
                    onRemove={() => onRemoveLink(section.id, link.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

function FooterSectionsPanel ({ clientId, data, qc }) {
  const [sections, setSections] = useState(data?.footerSections || [])
  const [unassignedLinks, setUnassignedLinks] = useState(data?.unassignedFooterLinks || [])
  const [linkModal, setLinkModal] = useState(null)

  useEffect(() => {
    setSections(data?.footerSections || [])
    setUnassignedLinks(data?.unassignedFooterLinks || [])
  }, [data?.footerSections, data?.unassignedFooterLinks])

  const saveFt = useMutation({
    mutationFn: (next) => saveNavbarApi(clientId, { footerSections: serializeFooterSections(next) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navbar', clientId] })
  })

  const persist = useCallback((next) => { setSections(next); saveFt.mutate(next) }, [saveFt])

  const pages = data?.pages || []

  const onDragEndSections = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oi = sections.findIndex(s => s.id === active.id)
    const ni = sections.findIndex(s => s.id === over.id)
    if (oi < 0 || ni < 0) return
    persist(arrayMove(sections, oi, ni))
  }

  const handleToggle = (id) => persist(sections.map(s => s.id === id ? { ...s, isActive: s.isActive === false } : s))
  const handleDelete = (id) => { if (!window.confirm('Delete this footer column?')) return; persist(sections.filter(s => s.id !== id)) }
  const handleReorderLinks = (sectionId, newLinks) => persist(sections.map(s => s.id === sectionId ? { ...s, links: newLinks } : s))
  const handleUpdateTitle = (id, title) => persist(sections.map(s => s.id === id ? { ...s, title } : s))

  const handleAddLink = (sectionId) => {
    setLinkModal({ sectionId, id: `l-${Date.now()}`, label: '', pageId: '', externalUrl: '', isNew: true })
  }

  const handleEditLink = (link) => {
    const sec = sections.find(s => (s.links || []).some(l => l.id === link.id))
    setLinkModal({ ...link, sectionId: sec?.id, isNew: false })
  }

  const handleRemoveLink = (sectionId, linkId) => {
    persist(sections.map(s => s.id === sectionId ? { ...s, links: (s.links || []).filter(l => l.id !== linkId) } : s))
  }

  const saveLinkModal = () => {
    if (!linkModal.label.trim()) return
    const { sectionId, isNew, ...link } = linkModal
    persist(sections.map(s => {
      if (s.id !== sectionId) return s
      const links = isNew ? [...(s.links || []), link] : (s.links || []).map(l => l.id === link.id ? link : l)
      return { ...s, links }
    }))
    setLinkModal(null)
  }

  const handleAssignLink = async (linkId, sectionId) => {
    const link = unassignedLinks.find(l => l.id === linkId)
    if (!link) return

    try {
      await fetch(`${import.meta.env.VITE_CMS_API_URL || import.meta.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'}/clients/${clientId}/navbar/footer-links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footerSectionId: sectionId })
      })

      // Reload data to get updated state
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    } catch (err) {
      console.error('Failed to assign link:', err)
      alert('Failed to assign link. Please try again.')
    }
  }

  const handleDeleteUnassignedLink = (linkId) => {
    if (!window.confirm('Delete this unassigned footer link?')) return
    fetch(`${import.meta.env.VITE_CMS_API_URL || import.meta.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'}/clients/${clientId}/navbar/footer-links/${linkId}`, {
      method: 'DELETE'
    }).then(() => {
      setUnassignedLinks(unassignedLinks.filter(l => l.id !== linkId))
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    })
  }

  const handleDragEndUnassigned = async (event) => {
    const { active, over } = event
    if (!over) return

    const linkId = active.id
    const sectionId = over.id

    // Check if dropped on a section
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      await handleAssignLink(linkId, sectionId)
    }
  }

  const handleDragEndGlobal = (event) => {
    // Check if this is an unassigned link being dragged
    const unassignedLink = unassignedLinks.find(l => l.id === event.active.id)
    if (unassignedLink) {
      handleDragEndUnassigned(event)
      return
    }

    // Otherwise handle section reordering
    onDragEndSections(event)
  }

  return (
    <div>
      <SectionHeader title="Footer columns" Icon={PanelBottom} onAdd={() => { const id = `temp-${Date.now()}`; persist([...sections, { id, title: 'New Column', isActive: true, links: [] }]) }} addLabel="Add column" />
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
        Drag columns to reorder. Toggle to show/hide in the footer. Drag links within a column to reorder them.
      </p>

      {unassignedLinks && unassignedLinks.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Unassigned Footer Links
          </div>
          <p style={{ fontSize: 12, color: C.t2, marginBottom: 12 }}>
            These links were automatically created when pages were added. Drag them into a column below or delete them.
          </p>
          <SortableContext items={unassignedLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unassignedLinks.map(link => (
                <SortableUnassignedLink
                  key={link.id}
                  link={link}
                  pages={pages}
                  sections={sections}
                  onDelete={() => handleDeleteUnassignedLink(link.id)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {!sections || sections.length === 0 ? (
        <EmptyState
          message="No footer columns yet"
          hint="Add a column to start organizing your footer links"
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEndGlobal}>
          <SortableContext items={[...sections.map(s => s.id), ...unassignedLinks.map(l => l.id)]} strategy={verticalListSortingStrategy}>
            {sections.map(s => (
              <SortableFooterSection
                key={s.id}
                section={s}
                pages={pages}
                onToggle={handleToggle}
                onAddLink={handleAddLink}
                onEditLink={handleEditLink}
                onRemoveLink={handleRemoveLink}
                onReorderLinks={handleReorderLinks}
                onDelete={handleDelete}
                onUpdateTitle={handleUpdateTitle}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Link edit modal */}
      <Modal isOpen={!!linkModal} onClose={() => setLinkModal(null)} title={linkModal?.isNew ? 'Add link' : 'Edit link'} onSave={saveLinkModal}>
        {linkModal && (
          <>
            <InputField label="Label" value={linkModal.label} onChange={e => setLinkModal(m => ({ ...m, label: e.target.value }))} required />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Page</label>
              <select value={linkModal.pageId || ''} onChange={e => { const v = e.target.value || null; setLinkModal(m => ({ ...m, pageId: v, externalUrl: v ? null : (m.externalUrl || '') })) }} style={selectStyle}>
                <option value="">— none —</option>
                {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <InputField label="Or external URL" value={linkModal.externalUrl || ''} onChange={e => { const v = e.target.value; setLinkModal(m => ({ ...m, externalUrl: v || null, pageId: v ? null : (m.pageId || null) })) }} placeholder="https://…" />
          </>
        )}
      </Modal>
    </div>
  )
}

const PAGE_TYPES = [
  { type: 'home',      label: 'Home Page',       icon: '🏠', color: '#8B5CF6', desc: 'The main landing page. Add to navigation or keep unassigned.' },
  { type: 'menu',      label: 'Menu Page',       icon: '', color: '#FF6B2B', desc: 'Auto-connected to Items/Menu section. Displays all categories & items in theme layout.' },
  { type: 'locations', label: 'Locations Page',  icon: '', color: '#22C55E', desc: 'Auto-connected to Locations. Shows address, map, hours & contact info.' },
  { type: 'specials',  label: 'Specials Page',   icon: '', color: '#F59E0B', desc: 'Auto-connected to Specials. Displays all active specials with dates & pricing.' },
  { type: 'team',      label: 'Meet the Team',   icon: '', color: '#EC4899', desc: 'Auto-connected to Team section. Displays team members grouped by department.' },
  { type: 'custom',    label: 'Custom / Blank',  icon: '', color: '#00D4FF', desc: 'Flexible page with theme layout. Write rich text content or leave blank.' }
]

function getTypeInfo (t) {
  return PAGE_TYPES.find((p) => p.type === t) || PAGE_TYPES[3]
}

const pageInpStyle = {
  width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit'
}

function PagesListPanel ({ clientId, data, qc }) {
  const { data: allPages = [], isLoading } = useQuery({
    queryKey: ['pages', clientId],
    queryFn: () => getPages(clientId),
    staleTime: 10_000
  })

  const { data: allBanners = [] } = useQuery({
    queryKey: ['banners', clientId],
    queryFn: () => getBanners(clientId),
    staleTime: 30_000
  })

  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [dndMoving, setDndMoving] = useState(false)

  const del = useMutation({
    mutationFn: (id) => deletePage(clientId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pages', clientId] })
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    }
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => updatePage(clientId, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pages', clientId] })
  })

  // Build pageId → { headingId, headingLabel } map
  const headingByPageId = useMemo(() => {
    const map = {}
    ;(data?.headerSections || []).forEach(h => {
      ;(h.children || []).forEach(c => {
        if (c.pageId) map[c.pageId] = { headingId: h.id, headingLabel: h.label }
      })
    })
    return map
  }, [data?.headerSections])

  // Group pages by heading section, maintain nav order (respecting drag position)
  const sections = useMemo(() => {
    const headings = data?.headerSections || []
    const result = headings.map(h => {
      // Get pages in this heading, sorted by their order in the children array
      const childPageIds = (h.children || []).map(c => c.pageId).filter(Boolean)
      const headingPages = childPageIds.map(pid => allPages.find(p => p.id === pid)).filter(Boolean)
      return {
        id: h.id,
        label: h.label,
        pages: headingPages
      }
    })
    // Unassigned pages: those not in any heading's children
    const assignedIds = new Set(headings.flatMap(h => (h.children || []).map(c => c.pageId)))
    const unassigned = allPages.filter(p => !assignedIds.has(p.id))
    if (unassigned.length > 0 || result.length === 0) {
      result.push({ id: 'unassigned', label: 'Unassigned', pages: unassigned })
    }
    return result
  }, [allPages, data?.headerSections])

  // Drag page from one section to another (or reorder within same section)
  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId: pageId, source, destination } = result
    const fromId = source.droppableId
    const toId = destination.droppableId
    const page = allPages.find(p => p.id === pageId)
    if (!page) return
    
    // Same section reorder
    if (fromId === toId) {
      if (source.index === destination.index) return
      if (toId === 'unassigned') return // Can't reorder unassigned
      
      setDndMoving(true)
      try {
        const heading = data?.headerSections?.find(h => h.id === toId)
        if (!heading) return
        
        // Reorder children based on drag index
        const children = [...(heading.children || [])]
        const movedItem = children.find(c => c.pageId === pageId)
        if (!movedItem) return
        
        // Remove from old position and insert at new
        const filtered = children.filter(c => c.pageId !== pageId)
        filtered.splice(destination.index, 0, movedItem)
        
        const newHeaderSections = (data?.headerSections || []).map(h => 
          h.id === toId ? { ...h, children: filtered } : h
        )
        
        await saveNavbarApi(clientId, { headerSections: serializeHeaderSections(newHeaderSections), footerSections: data?.footerSections || [] })
        qc.invalidateQueries({ queryKey: ['navbar', clientId] })
      } catch (e) {
        console.error('DnD reorder failed:', e)
      }
      setDndMoving(false)
      return
    }
    
    // Moving between sections
    setDndMoving(true)
    try {
      // Remove from source heading
      const newHeaderSections = (data?.headerSections || []).map(h => ({
        ...h,
        children: (h.children || []).filter(c => !(c.pageId === pageId && h.id === fromId))
      }))
      
      // Add to destination heading at specific index
      if (toId !== 'unassigned') {
        const ti = newHeaderSections.findIndex(h => h.id === toId)
        if (ti >= 0) {
          const destChildren = [...(newHeaderSections[ti].children || [])]
          const newItem = {
            id: `temp-${Date.now()}`, pageId,
            label: page.title, url: page.slug ? `/${page.slug}` : '',
            isActive: true, sortOrder: destination.index
          }
          destChildren.splice(destination.index, 0, newItem)
          newHeaderSections[ti] = { ...newHeaderSections[ti], children: destChildren }
        }
      }
      
      await saveNavbarApi(clientId, { headerSections: serializeHeaderSections(newHeaderSections), footerSections: data?.footerSections || [] })
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
    } catch (e) {
      console.error('DnD move failed:', e)
    }
    setDndMoving(false)
  }

  const openCreate = () => setModal({ step: 1 })
  const selectType = (pageType) => setModal({ step: 2, isEdit: false, pageType, title: '', subtitle: '', slug: '', bannerId: null, content: '', metaTitle: '', metaDesc: '', showEnquiryForm: false, showLocationMap: false })
  const openEdit = (page) => setModal({ step: 2, isEdit: true, id: page.id, pageType: page.pageType || 'custom', title: page.title || '', subtitle: page.subtitle || '', slug: page.slug || '', bannerId: page.bannerId || null, content: page.content || '', metaTitle: page.metaTitle || '', metaDesc: page.metaDesc || '', showEnquiryForm: page.showEnquiryForm || false, showLocationMap: page.showLocationMap || false, status: page.status || 'draft' })
  const handleTitleChange = (title) => setModal((m) => ({ ...m, title, slug: m.isEdit ? m.slug : slugify(title) }))

  const handleSave = async () => {
    if (!modal.title.trim()) { setSaveErr('Title is required'); return }
    setSaving(true); setSaveErr('')
    try {
      const payload = { 
        title: modal.title.trim(), 
        subtitle: modal.subtitle?.trim() || '', 
        slug: modal.slug.trim() || slugify(modal.title), 
        pageType: modal.pageType, 
        bannerId: modal.bannerId || null, 
        content: modal.content || '', 
        metaTitle: modal.metaTitle?.trim() || '',
        metaDesc: modal.metaDesc?.trim() || '',
        showEnquiryForm: modal.showEnquiryForm || false,
        showLocationMap: modal.showLocationMap || false,
        status: modal.status || (modal.isEdit ? undefined : 'draft')
      }
      if (modal.isEdit) await updatePage(clientId, modal.id, payload)
      else await createPage(clientId, payload)
      qc.invalidateQueries({ queryKey: ['pages', clientId] })
      qc.invalidateQueries({ queryKey: ['navbar', clientId] })
      setModal(null)
    } catch (e) {
      setSaveErr(e?.response?.data?.error || e?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = (page) => {
    if (!window.confirm(`Delete "${page.title}"? This also removes it from navigation.`)) return
    del.mutate(page.id)
  }

  const pt = modal?.step === 2 ? getTypeInfo(modal.pageType) : null

  return (
    <div>
      <SectionHeader title="Pages" Icon={FileText} onAdd={openCreate} addLabel="Create Page" />
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
        Pages are grouped by their navigation heading. Drag a page to reassign it to a different heading. Toggle to publish.
      </p>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><LoadingSpinner /></div>
      ) : allPages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          No pages yet — click <strong style={{ color: C.acc }}>Create Page</strong> to get started.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          {sections.map(section => (
            <div key={section.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px' }}>
                <span style={{ fontSize: 14 }}>{section.id === 'unassigned' ? '📌' : '📂'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.label}</span>
                <span style={{ fontSize: 11, color: C.t3, marginLeft: 4 }}>({section.pages.length})</span>
                {dndMoving && <span style={{ fontSize: 11, color: C.acc, marginLeft: 6 }}>Moving…</span>}
              </div>
              <Droppable droppableId={section.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: 44, borderRadius: 10, transition: 'background 0.15s',
                      background: snapshot.isDraggingOver ? C.acc + '10' : 'transparent',
                      border: `1px solid ${snapshot.isDraggingOver ? C.acc + '40' : 'transparent'}`,
                      padding: snapshot.isDraggingOver ? 4 : 0
                    }}
                  >
                    {section.pages.length === 0 && (
                      <div style={{ fontSize: 12, color: C.t3, padding: '10px 12px', textAlign: 'center', fontStyle: 'italic' }}>
                        {snapshot.isDraggingOver ? 'Drop here' : 'No pages — drag one here'}
                      </div>
                    )}
                    {section.pages.map((page, index) => {
                      const info = getTypeInfo(page.pageType || 'custom')
                      const isPublished = page.status === 'published'
                      return (
                        <Draggable key={page.id} draggableId={page.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              style={{
                                ...prov.draggableProps.style,
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', marginBottom: 6,
                                background: snap.isDragging ? C.card : C.panel,
                                border: `1px solid ${snap.isDragging ? C.acc : (isPublished ? C.green + '40' : C.border)}`,
                                borderRadius: 10, opacity: snap.isDragging ? 0.95 : 1
                              }}
                            >
                              <div {...prov.dragHandleProps} style={{ color: C.t3, cursor: 'grab', fontSize: 16, flexShrink: 0, userSelect: 'none' }}>⠿</div>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: info.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{info.icon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: C.t0, fontSize: 13 }}>{page.title}</div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: info.color, background: info.color + '15', padding: '1px 7px', borderRadius: 20 }}>{info.label}</span>
                                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.t3 }}>/{page.slug}</span>
                                </div>
                              </div>
                              <div
                                title={isPublished ? 'Click to unpublish' : 'Click to publish'}
                                onClick={() => !toggleStatus.isPending && toggleStatus.mutate({ id: page.id, status: isPublished ? 'draft' : 'published' })}
                                style={{ width: 40, height: 21, borderRadius: 11, cursor: 'pointer', background: isPublished ? C.green : C.border2, position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: toggleStatus.isPending ? 0.5 : 1 }}
                              >
                                <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isPublished ? 22 : 2, transition: 'left 0.2s' }} />
                              </div>
                              <button type="button" onClick={() => openEdit(page)} style={btnCyan}>Edit</button>
                              <button type="button" onClick={() => handleDelete(page)} style={btnDanger} title="Delete"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      )}

      {/* Step 1 — Type selection */}
      {modal?.step === 1 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 700 }}>
            <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Step 1 of 2</div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.t0 }}>Choose a Page Type</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.t2 }}>All pages render with theme layout — header, banner section, body, and footer.</p>
            </div>
            <div style={{ padding: '22px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {PAGE_TYPES.map((p) => (
                <button
                  key={p.type} type="button" onClick={() => selectType(p.type)}
                  style={{ padding: '18px 20px', background: C.card, border: `2px solid ${C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = p.color + '10' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t0, marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.5 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ padding: '14px 28px', borderTop: `1px solid ${C.border}` }}>
              <button type="button" onClick={() => setModal(null)} style={btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Page details */}
      {modal?.step === 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              {!modal.isEdit && <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Step 2 of 2</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: pt.color + '20', border: `1px solid ${pt.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{pt.icon}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.t0 }}>{modal.isEdit ? 'Edit Page' : `New ${pt.label}`}</h3>
                  <div style={{ fontSize: 12, color: pt.color, fontWeight: 700, marginTop: 2 }}>{pt.label}</div>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {saveErr && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: C.redBg, border: `1px solid ${C.red}40`, borderRadius: 8, color: C.red, fontSize: 13 }}>{saveErr}</div>
              )}

              {/* Title + Subtitle + Slug */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Page Title <span style={{ color: C.red }}>*</span></label>
                    <input value={modal.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Our Menu" style={pageInpStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>URL Slug</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.t3, fontSize: 14, pointerEvents: 'none' }}>/</span>
                      <input value={modal.slug} onChange={(e) => setModal((m) => ({ ...m, slug: e.target.value }))} placeholder="our-menu" style={{ ...pageInpStyle, paddingLeft: 22 }} />
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Subtitle</label>
                  <input value={modal.subtitle} onChange={(e) => setModal((m) => ({ ...m, subtitle: e.target.value }))} placeholder="Page subtitle shown below title (optional)" style={pageInpStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Meta Title (SEO)</label>
                    <input value={modal.metaTitle} onChange={(e) => setModal((m) => ({ ...m, metaTitle: e.target.value }))} placeholder="SEO title (optional)" style={pageInpStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Meta Description (SEO)</label>
                    <input value={modal.metaDesc} onChange={(e) => setModal((m) => ({ ...m, metaDesc: e.target.value }))} placeholder="SEO description (optional)" style={pageInpStyle} />
                  </div>
                </div>
              </div>

              {/* Banner selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Page Banner</label>
                <p style={{ fontSize: 12, color: C.t2, margin: '0 0 12px' }}>
                  Select a banner from the library. Banners are managed in <strong style={{ color: C.t1 }}>Navigation → Banners</strong>. Without a banner the page header shows as a solid dark primary colour.
                </p>
                {allBanners.length === 0 ? (
                  <div style={{ padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.t3 }}>
                    No banners yet — add some in Navigation → Banners, then return here to select one.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                    <div
                      onClick={() => setModal((m) => ({ ...m, bannerId: null }))}
                      style={{ background: C.card, border: `2px solid ${!modal.bannerId ? C.acc : C.border}`, borderRadius: 10, cursor: 'pointer', padding: '20px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    >
                      <div style={{ fontSize: 22 }}>🚫</div>
                      <div style={{ fontSize: 11, color: C.t2 }}>No banner</div>
                      {!modal.bannerId && <div style={{ fontSize: 10, fontWeight: 700, color: C.acc }}>✓ Selected</div>}
                    </div>
                    {allBanners.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setModal((m) => ({ ...m, bannerId: b.id }))}
                        style={{ background: C.card, border: `2px solid ${modal.bannerId === b.id ? C.acc : C.border}`, borderRadius: 10, cursor: 'pointer', overflow: 'hidden' }}
                      >
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ height: 72, background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.t3 }}>No image</div>
                        )}
                        <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.t0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{b.title || 'Banner'}</div>
                          {modal.bannerId === b.id && <span style={{ fontSize: 11, color: C.acc, fontWeight: 700, flexShrink: 0 }}>✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Page Options — toggles for enquiry form and location map */}
              {modal.pageType === 'custom' && (
                <div style={{ marginBottom: 24, padding: '16px 20px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <label style={{ ...labelStyle, marginBottom: 12, display: 'block' }}>Page Options</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Enquiry Form Toggle */}
                    <div
                      onClick={() => setModal((m) => ({ ...m, showEnquiryForm: !m.showEnquiryForm }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        padding: '10px 14px', background: modal.showEnquiryForm ? C.green + '20' : C.panel,
                        border: `1px solid ${modal.showEnquiryForm ? C.green : C.border}`,
                        borderRadius: 8, transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: modal.showEnquiryForm ? C.green : C.border,
                        position: 'relative', transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 2, left: modal.showEnquiryForm ? 18 : 2,
                          transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Show Enquiry Form</div>
                        <div style={{ fontSize: 11, color: C.t3 }}>Add contact form at bottom</div>
                      </div>
                    </div>

                    {/* Location Map Toggle */}
                    <div
                      onClick={() => setModal((m) => ({ ...m, showLocationMap: !m.showLocationMap }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        padding: '10px 14px', background: modal.showLocationMap ? C.acc + '20' : C.panel,
                        border: `1px solid ${modal.showLocationMap ? C.acc : C.border}`,
                        borderRadius: 8, transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: modal.showLocationMap ? C.acc : C.border,
                        position: 'relative', transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 2, left: modal.showLocationMap ? 18 : 2,
                          transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Show Location Map</div>
                        <div style={{ fontSize: 11, color: C.t3 }}>Display map with locations</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rich text content — custom pages only */}
              {modal.pageType === 'custom' && (
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Page Content</label>
                  <p style={{ fontSize: 12, color: C.t2, margin: '0 0 10px' }}>Rich text content shown in the body. Leave blank for an empty page.</p>
                  <PageEditor
                    clientId={clientId}
                    content={modal.content}
                    onUpdate={(c) => setModal((m) => ({ ...m, content: c }))}
                    placeholder="Write your page content here…"
                  />
                </div>
              )}

              {/* Info box for connected page types */}
              {modal.pageType !== 'custom' && (
                <div style={{ marginBottom: 24, padding: '14px 18px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 22, marginTop: 2 }}>{pt.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 5 }}>Auto-connected to CMS data</div>
                    <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
                      {modal.pageType === 'menu' && 'Automatically displays all active menu categories and items from the Items section.'}
                      {modal.pageType === 'locations' && 'Automatically displays all active locations with address, map, hours, and contact info.'}
                      {modal.pageType === 'specials' && 'Automatically displays all active specials from the Specials section.'}
                    </div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>
                      The page status (Published / Draft) can be toggled from the pages list after saving.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button type="button" onClick={() => setModal(null)} style={btnGhost}>Cancel</button>
              <button
                type="button" onClick={handleSave} disabled={saving}
                style={{ padding: '10px 28px', background: saving ? C.card : C.acc, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : `0 4px 16px ${C.acc}50` }}
              >
                {saving ? 'Saving…' : modal.isEdit ? 'Save Changes' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
