import { useState, useEffect, useCallback, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import LoadingSpinner from '../Components/LoadingSpinner'
import ImageUpload from '../Components/ImageUpload'
import ConfirmationModal from '../Components/ConfirmationModal'
import { getNavbar, saveNavbar as saveNavbarApi } from '../api/navbar'
import { createPage, updatePage, deletePage } from '../api/pages'
import { createBanner, updateBanner, deleteBanner } from '../api/banners'
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

const SectionHeader = memo(({ title, icon, onAdd, addLabel = 'Add' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
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
  return sections.map((h) => {
    const row = {
      label: h.label,
      url: h.url || '',
      isActive: h.isActive !== false,
      pageId: h.pageId || null,
      children: (h.children || []).map((c) => {
        const child = {
          label: c.label,
          url: c.url || '',
          isActive: c.isActive !== false,
          pageId: c.pageId || null
        }
        // Use c.id if it's not a temp-h- or temp-pg- id
        if (c.id && !String(c.id).startsWith('temp-')) child.id = c.id
        return child
      })
    }
    // Use h.id if it's not a temp-h- id
    if (h.id && !String(h.id).startsWith('temp-')) row.id = h.id
    return row
  })
}

function serializeFooterSections (sections) {
  return sections.map((s) => ({
    title: s.title,
    links: (s.links || []).map((l) => ({
      label: l.label,
      pageId: l.pageId || null,
      externalUrl: l.externalUrl || null
    }))
  }))
}

export default function NavbarSection ({ clientId, subsection = 'header-sections' }) {
  useEffect(() => {
    if (!clientId) console.warn('NavbarSection: clientId is missing!')
    else console.log('NavbarSection: active clientId is', clientId)
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

function SortableHeadingRow ({ h, pages, onEdit, onToggle, onDelete, onAddPage }) {
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
  const canAddPage = !isTempId(h.id)
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
      <button
        type="button"
        disabled={!canAddPage}
        title={canAddPage ? 'Add a page under this header' : 'Save the header first (wait for sync), then add pages'}
        onClick={() => canAddPage && onAddPage(h.id)}
        style={{ ...btnGhost, opacity: canAddPage ? 1 : 0.45, cursor: canAddPage ? 'pointer' : 'not-allowed' }}
      >+ Page</button>
      <button type="button" onClick={() => onDelete(h.id)} style={btnDanger}>Delete</button>
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
      label: ''
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
          ? { ...c, label, url, pageId: pageModal.pageId }
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
          { key: 'pages', label: '2. Pages under headings' }
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
          <SectionHeader title="Navigation headings" icon="☰" onAdd={openAddHeader} addLabel="Add heading" />
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
                      onAddPage={openAddPage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {headerSubTab === 'pages' && (
        <>
          <SectionHeader
            title="Pages in the menu"
            icon="📄"
            onAdd={() => {
              const firstSaved = sections.find((s) => !isTempId(s.id))
              if (!firstSaved) {
                setNavError('Add at least one heading in the previous tab and wait for it to save.')
                return
              }
              openAddPage(firstSaved.id)
            }}
            addLabel="Add page"
          />
          <p style={{ fontSize: 13, color: C.t2, marginBottom: 16, lineHeight: 1.5 }}>
            Every page must sit under a heading. Drag rows to reorder or move them to another heading. Deleting a page removes it from the site.
          </p>
          {sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
              Create headings first in the &ldquo;Navigation headings&rdquo; tab.
            </div>
          ) : (
            <DragDropContext onDragEnd={onPageDragEnd}>
              <div style={{ display: 'grid', gap: 14 }}>
                {sections.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '10px 14px', background: C.card, borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.t0 }}>
                      {h.label}
                      {isTempId(h.id) && (
                        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: C.amber }}>(saving…)</span>
                      )}
                    </div>
                    <Droppable droppableId={h.id} type="PAGE">
                      {(pp) => (
                        <div ref={pp.innerRef} {...pp.droppableProps} style={{ padding: 12, minHeight: 52 }}>
                          {(h.children || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: C.t3, padding: 6 }}>No pages — the heading can be a direct link only.</div>
                          ) : (
                            (h.children || []).map((c, ci) => (
                              <Draggable key={c.id} draggableId={`pg-${c.id}`} index={ci}>
                                {(cp) => (
                                  <div
                                    ref={cp.innerRef}
                                    {...cp.draggableProps}
                                    style={{
                                      ...cp.draggableProps.style,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '8px 10px',
                                      marginBottom: 6,
                                      background: C.card,
                                      border: `1px solid ${C.border2}`,
                                      borderRadius: 8
                                    }}
                                  >
                                    <div {...cp.dragHandleProps} style={{ cursor: 'grab', color: C.t3 }}>⋮</div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t0 }}>{c.label}</div>
                                      <div style={{ fontSize: 11, color: C.t2 }}>{c.url}</div>
                                    </div>
                                    <button type="button" onClick={() => editPage(c, h.id)} style={btnSmCyan}>Edit</button>
                                    <button type="button" onClick={() => deletePageFull(c)} style={btnSmDanger}>Delete</button>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {pp.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </>
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

function HeaderModalFields ({ headerModal, setHeaderModal, pages }) {
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
    </>
  )
}

function PageContentEditor ({ clientId, value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      const res = await fetch(`http://localhost:3001/api/clients/${clientId}/images`, {
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
  const banners = data?.banners || []

  const mCreate = useMutation({
    mutationFn: (body) => createBanner(clientId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navbar', clientId] })
  })
  const mUpdate = useMutation({
    mutationFn: ({ id, body }) => updateBanner(clientId, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navbar', clientId] })
  })
  const mDelete = useMutation({
    mutationFn: (id) => deleteBanner(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navbar', clientId] })
  })

  const openAdd = () => setModal({
    title: '', text: '', imageUrl: '', widthPx: '', heightPx: '', isActive: true
  })
  const openEdit = (b) => setModal({ ...b, widthPx: b.widthPx ?? '', heightPx: b.heightPx ?? '' })

  const save = () => {
    if (!modal?.text?.trim()) return
    const body = {
      title: modal.title || null,
      text: modal.text.trim(),
      imageUrl: modal.imageUrl || null,
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
      <SectionHeader title="Banner library" icon="🖼️" onAdd={openAdd} addLabel="Add banner" />
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
        Upload or link images with optional dimensions. Pages can reference these banners so the same creative is reused across the site.
      </p>

      {banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          No banners yet. Add one for page tops or promos.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {banners.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 14, background: C.panel,
                border: `1px solid ${C.border}`, borderRadius: 10
              }}
            >
              {b.imageUrl && (
                <img src={b.imageUrl} alt="" style={{ width: 120, height: 48, objectFit: 'cover', borderRadius: 6 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.t0 }}>{b.title || b.text}</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                  {b.widthPx && b.heightPx ? `${b.widthPx}×${b.heightPx}px` : 'Size not set'}
                  {b.imageUrl ? ` · ${b.imageUrl.slice(0, 48)}…` : ''}
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
            <InputField label="Internal name" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="Hero — spring" />
            <InputField label="Display text / caption" value={modal.text} onChange={(e) => setModal({ ...modal, text: e.target.value })} required />
            <div style={{ marginBottom: 16 }}>
              <ImageUpload
                clientId={clientId}
                label="Image"
                value={modal.imageUrl}
                onChange={(url) => setModal({ ...modal, imageUrl: url })}
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
                  placeholder="e.g. 400"
                />
              </div>
            </div>
            <div style={{ padding: 16, background: C.card, borderRadius: 8 }}>
              <ToggleSwitch
                checked={modal.isActive !== false}
                onChange={() => setModal({ ...modal, isActive: !modal.isActive })}
                label="Active"
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

function SortableFooterSection ({ section, pages, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 16
  }
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, paddingTop: 4 }}>⋮⋮</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: C.t0 }}>{section.title}</div>
          <div style={{ fontSize: 12, color: C.t2, marginTop: 6 }}>
            {(section.links || []).map((l) => (
              <div key={l.id}>{l.label} {l.pageId ? `→ ${pages.find((p) => p.id === l.pageId)?.title || 'page'}` : l.externalUrl ? `→ ${l.externalUrl}` : ''}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onEdit(section)} style={btnCyan}>Edit</button>
          <button type="button" onClick={() => onDelete(section.id)} style={btnDanger}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function FooterSectionsPanel ({ clientId, data, qc }) {
  const [sections, setSections] = useState(data?.footerSections || [])
  const [modal, setModal] = useState(null)
  const [footerSubTab, setFooterSubTab] = useState('headings')

  useEffect(() => {
    setSections(data?.footerSections || [])
  }, [data?.footerSections])

  const saveFt = useMutation({
    mutationFn: (next) => saveNavbarApi(clientId, { footerSections: serializeFooterSections(next) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navbar', clientId] })
  })

  const persist = useCallback((next) => {
    setSections(next)
    saveFt.mutate(next)
  }, [saveFt])

  const pages = data?.pages || []

  const onDragEndKit = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    persist(arrayMove(sections, oldIndex, newIndex))
  }

  const addSection = () => {
    setModal({ id: `temp-${Date.now()}`, title: '', links: [] })
  }

  const saveModal = () => {
    if (!modal?.title?.trim()) return
    const exists = sections.some((s) => s.id === modal.id)
    const cleaned = {
      ...modal,
      title: modal.title.trim(),
      links: (modal.links || []).map((l) => ({
        id: l.id,
        label: (l.label || '').trim(),
        pageId: l.pageId || null,
        externalUrl: l.externalUrl || null
      }))
    }
    if (exists) persist(sections.map((s) => (s.id === modal.id ? cleaned : s)))
    else persist([...sections, cleaned])
    setModal(null)
  }

  const deleteSection = (id) => {
    if (!window.confirm('Delete this footer column?')) return
    persist(sections.filter((s) => s.id !== id))
  }

  const openLinks = (section) => {
    setModal({ ...section, links: section.links || [] })
  }

  const openAddLinkTo = (section) => {
    setModal({
      ...section,
      links: [...(section.links || []), { id: `l-${Date.now()}`, label: '', pageId: '', externalUrl: '' }]
    })
  }

  const addLink = () => {
    setModal({
      ...modal,
      links: [...(modal.links || []), { id: `l-${Date.now()}`, label: '', pageId: '', externalUrl: '' }]
    })
  }

  const updateLink = (i, patch) => {
    const links = [...(modal.links || [])]
    links[i] = { ...links[i], ...patch }
    setModal({ ...modal, links })
  }

  const removeLink = (i) => {
    const links = [...(modal.links || [])]
    links.splice(i, 1)
    setModal({ ...modal, links })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
        {[
          { key: 'headings', label: '1. Footer headings' },
          { key: 'links', label: '2. Links under headings' }
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFooterSubTab(t.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: footerSubTab === t.key ? 700 : 500,
              background: footerSubTab === t.key ? '#1F2D4A' : 'transparent',
              color: footerSubTab === t.key ? C.t0 : C.t2,
              borderBottom: footerSubTab === t.key ? `2px solid ${C.acc}` : '2px solid transparent'
            }}
          >{t.label}</button>
        ))}
      </div>

      {footerSubTab === 'headings' && (
        <>
          <SectionHeader title="Footer headings" icon="🦶" onAdd={addSection} addLabel="Add heading" />
          <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
            Create footer headings like “Legal”, then add page links under them in the next tab. Drag headings to reorder.
          </p>

          {sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
              No footer headings yet.
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEndKit}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {sections.map((s) => (
                    <SortableFooterSection
                      key={s.id}
                      section={s}
                      pages={pages}
                      onEdit={() => setModal({ ...s, links: s.links || [] })}
                      onDelete={deleteSection}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {footerSubTab === 'links' && (
        <>
          <SectionHeader title="Footer links" icon="🔗" />
          <p style={{ fontSize: 13, color: C.t2, marginBottom: 20, lineHeight: 1.5 }}>
            Add links under headings (for example: Legal → Privacy Policy, Terms, Policies). Each link can point to a page or an external URL.
          </p>

          {sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
              Create footer headings first.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sections.map((s) => (
                <div key={s.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontWeight: 800, color: C.t0 }}>{s.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => openAddLinkTo(s)} style={btnCyan}>+ Link</button>
                      <button type="button" onClick={() => openLinks(s)} style={btnGhost}>Edit</button>
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    {(s.links || []).length === 0 ? (
                      <div style={{ fontSize: 12, color: C.t3, padding: 6 }}>No links yet.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {(s.links || []).map((l) => (
                          <div key={l.id || l.label} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>{l.label}</div>
                            <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                              {l.pageId ? (pages.find((p) => p.id === l.pageId)?.title || 'Page') : (l.externalUrl || '—')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id?.startsWith('temp') ? 'Add footer column' : 'Edit footer column'} onSave={saveModal}>
        {modal && (
          <>
            <InputField label="Column title" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} required />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.t2 }}>Links</span>
              <button type="button" onClick={addLink} style={{ ...btnCyan, padding: '4px 10px', fontSize: 11 }}>+ Link</button>
            </div>
            {(modal.links || []).map((link, i) => (
              <div key={link.id || i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <InputField label="Label" value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Page</label>
                  <select
                    value={link.pageId || ''}
                    onChange={(e) => {
                      const v = e.target.value || null
                      updateLink(i, { pageId: v, externalUrl: v ? null : (link.externalUrl || '') })
                    }}
                    style={selectStyle}
                  >
                    <option value="">—</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <InputField
                  label="Or external URL"
                  value={link.externalUrl || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    updateLink(i, { externalUrl: v || null, pageId: v ? null : (link.pageId || null) })
                  }}
                  placeholder="https://…"
                />
                <button type="button" onClick={() => removeLink(i)} style={{ ...btnSmDanger, marginTop: 8 }}>Remove link</button>
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  )
}
