import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { getHomepageLayout, updateHomepageLayout, getCustomTextBlocks, createCustomTextBlock, updateCustomTextBlock, deleteCustomTextBlock } from '../api/homepageLayout'
import { C } from '../theme'

const COMPONENT_META = {
  welcome:  { label: 'Welcome Content', tag: 'INTRO',    desc: 'Intro text + image section' },
  promos:   { label: 'Promo Tiles',     tag: 'PROMOS',   desc: 'Promotional tile grid' },
  specials: { label: 'Specials',        tag: 'SPECIALS', desc: 'Current specials & offers' },
  featured: { label: 'Featured Items',  tag: 'FEATURED', desc: 'Featured menu items' },
  loyalty:  { label: 'Loyalty Banner',  tag: 'LOYALTY',  desc: 'Loyalty program callout' },
  reviews:  { label: 'Reviews',         tag: 'REVIEWS',  desc: 'Customer reviews carousel' },
  custom:   { label: 'Custom Block',    tag: 'CUSTOM',   desc: 'Custom text & content' },
}

const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ cursor:'pointer', display:'flex', alignItems:'center' }}>
    <div style={{
      width:40, height:22, borderRadius:11,
      background: checked ? C.acc : C.border,
      position:'relative', transition:'background 0.15s', flexShrink:0
    }}>
      <div style={{
        width:16, height:16, borderRadius:'50%', background:'#fff',
        position:'absolute', top:3, left: checked ? 21 : 3,
        transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)'
      }}/>
    </div>
  </div>
)

const EditorToolbar = ({ editor, sourceMode, onToggleSource }) => {
  if (!editor && !sourceMode) return null
  const btn = (active, fn, label, title) => (
    <button key={label} onMouseDown={e => { e.preventDefault(); fn() }} title={title||label}
      style={{ padding:'3px 7px', borderRadius:4, border:'none', fontSize:12, fontWeight:600,
        background: active ? C.acc+'22' : 'transparent',
        color: active ? C.acc : C.t2, cursor:'pointer' }}>
      {label}
    </button>
  )
  const sep = <div style={{ width:1, height:16, background:C.border, margin:'0 3px', flexShrink:0 }}/>
  return (
    <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:1,
      padding:'5px 8px', background:C.card, borderBottom:`1px solid ${C.border}`,
      borderRadius:'8px 8px 0 0' }}>
      {sourceMode ? (
        <>
          <span style={{ fontSize:10, color:C.t3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>HTML Source</span>
          <div style={{ marginLeft:'auto' }}>{btn(true, onToggleSource, 'Visual', 'Back to visual editor')}</div>
        </>
      ) : (
        <>
          {btn(editor.isActive('bold'),      () => editor.chain().focus().toggleBold().run(),      'B')}
          {btn(editor.isActive('italic'),    () => editor.chain().focus().toggleItalic().run(),    'I')}
          {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
          {sep}
          {btn(editor.isActive('heading',{level:2}), () => editor.chain().focus().toggleHeading({level:2}).run(), 'H2')}
          {btn(editor.isActive('heading',{level:3}), () => editor.chain().focus().toggleHeading({level:3}).run(), 'H3')}
          {sep}
          {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  '• List')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. List')}
          {sep}
          {btn(editor.isActive({textAlign:'left'}),   () => editor.chain().focus().setTextAlign('left').run(),   '←')}
          {btn(editor.isActive({textAlign:'center'}),  () => editor.chain().focus().setTextAlign('center').run(), '≡')}
          {btn(editor.isActive({textAlign:'right'}),   () => editor.chain().focus().setTextAlign('right').run(),  '→')}
          <div style={{ marginLeft:'auto', display:'flex', gap:1 }}>
            {btn(false, () => editor.chain().focus().undo().run(), '↩', 'Undo')}
            {btn(false, () => editor.chain().focus().redo().run(), '↪', 'Redo')}
            {sep}
            {btn(false, onToggleSource, '</>', 'HTML source')}
          </div>
        </>
      )}
    </div>
  )
}

function CustomBlockForm({ block, clientId, onClose, onSaved }) {
  const [form, setForm] = useState({ title: block?.title || '', content: block?.content || '', isActive: block?.isActive !== false })
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceValue, setSourceValue] = useState('')
  const qc = useQueryClient()
  const isEdit = !!block?.id

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your custom content here...' }),
    ],
    content: form.content || '',
    editorProps: { attributes: { style: 'text-align:left' } },
    onUpdate: ({ editor }) => setForm(f => ({ ...f, content: editor.getHTML() }))
  })

  useEffect(() => {
    if (editor && form.content !== editor.getHTML()) {
      editor.commands.setContent(form.content || '', false)
    }
  }, [editor])

  const mSave = useMutation({
    mutationFn: (data) => isEdit
      ? updateCustomTextBlock(clientId, block.id, data)
      : createCustomTextBlock(clientId, data),
    onSuccess: (saved) => {
      qc.invalidateQueries(['custom-text-blocks', clientId])
      qc.invalidateQueries(['homepage-layout', clientId])
      onSaved(saved)
    }
  })

  const handleSave = () => {
    const data = { ...form, content: sourceMode ? sourceValue : form.content }
    mSave.mutate(data)
  }

  return (
    <div style={{
      border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden',
      background:C.bg, marginTop:8
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px', borderBottom:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.t0 }}>
          {isEdit ? 'Edit Custom Block' : 'New Custom Block'}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
          fontSize:16, color:C.t3, lineHeight:1, padding:'2px 4px' }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.t3,
            textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
            Section Title
          </label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Our Story"
            style={{ width:'100%', padding:'8px 11px', background:C.input, border:`1px solid ${C.border}`,
              borderRadius:7, color:C.t0, fontSize:13, outline:'none', boxSizing:'border-box' }}
          />
        </div>

        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.t3,
            textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
            Content
          </label>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:7, overflow:'hidden' }}>
            <EditorToolbar editor={editor} sourceMode={sourceMode}
              onToggleSource={() => {
                if (sourceMode) {
                  editor?.commands.setContent(sourceValue, false)
                  setSourceMode(false)
                } else {
                  setSourceValue(editor?.getHTML() || '')
                  setSourceMode(true)
                }
              }}
            />
            {sourceMode ? (
              <textarea
                value={sourceValue}
                onChange={e => setSourceValue(e.target.value)}
                spellCheck={false}
                style={{ width:'100%', minHeight:160, padding:'10px 12px',
                  background:C.panel, border:'none', color:C.t0,
                  fontSize:12, lineHeight:1.6, outline:'none', resize:'vertical',
                  fontFamily:'monospace', boxSizing:'border-box' }}
              />
            ) : (
              <div style={{ minHeight:160, padding:'10px 12px', background:C.panel,
                color:C.t0, fontSize:13, lineHeight:1.7, cursor:'text' }}
                onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} />
                <style>{`
                  .ProseMirror { outline:none; min-height:140px; }
                  .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); float:left; color:${C.t3}; pointer-events:none; height:0; }
                  .ProseMirror h2 { font-size:1.3em; font-weight:700; margin:.4em 0; }
                  .ProseMirror h3 { font-size:1.1em; font-weight:700; margin:.4em 0; }
                  .ProseMirror ul,.ProseMirror ol { padding-left:1.4em; }
                  .ProseMirror blockquote { border-left:3px solid ${C.border}; padding-left:.8em; margin:.8em 0; color:${C.t2}; }
                `}</style>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive:v }))} />
            <span style={{ fontSize:12, color:C.t2 }}>Visible on homepage</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose}
              style={{ padding:'7px 16px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:7, color:C.t1, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={mSave.isPending}
              style={{ padding:'7px 20px', background:C.acc, border:'none',
                borderRadius:7, color:'#fff', fontSize:13, fontWeight:600,
                cursor: mSave.isPending ? 'not-allowed' : 'pointer', opacity: mSave.isPending ? 0.6 : 1 }}>
              {mSave.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Block'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ComponentCard = ({ component, index, total, onToggle, onMoveUp, onMoveDown, onEdit, onDelete }) => {
  const meta = COMPONENT_META[component.type] || { label: component.type, tag: 'BLOCK', desc: '' }
  const isCustom = component.type === 'custom'

  return (
    <div style={{
      background: C.card, border:`1px solid ${C.border}`, borderRadius:8,
      padding:'10px 14px', display:'flex', alignItems:'center', gap:12,
      opacity: component.visible ? 1 : 0.5
    }}>
      {/* Order buttons */}
      <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
        <button onClick={onMoveUp} disabled={index === 0}
          style={{ width:24, height:22, background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:4, cursor: index === 0 ? 'not-allowed' : 'pointer',
            fontSize:9, opacity: index === 0 ? 0.25 : 0.7, lineHeight:1, color:C.t1,
            display:'flex', alignItems:'center', justifyContent:'center' }}>▲</button>
        <button onClick={onMoveDown} disabled={index === total - 1}
          style={{ width:24, height:22, background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:4, cursor: index === total-1 ? 'not-allowed' : 'pointer',
            fontSize:9, opacity: index === total-1 ? 0.25 : 0.7, lineHeight:1, color:C.t1,
            display:'flex', alignItems:'center', justifyContent:'center' }}>▼</button>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>{meta.label}</div>
        <div style={{ fontSize:11, color:C.t3, marginTop:1 }}>
          {isCustom && component.title ? component.title : meta.desc}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {isCustom && (
          <>
            <button onClick={onEdit}
              style={{ padding:'4px 12px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:5, cursor:'pointer', fontSize:12, color:C.t1, fontWeight:500 }}>
              Edit
            </button>
            <button onClick={onDelete}
              style={{ padding:'4px 10px', background:'transparent', border:`1px solid ${C.border}`,
                borderRadius:5, cursor:'pointer', fontSize:12, color:C.red }}>
              Remove
            </button>
          </>
        )}
        <Toggle checked={component.visible} onChange={onToggle} />
      </div>
    </div>
  )
}

export default function HomepageBuilder({ clientId }) {
  const [activeBlock, setActiveBlock] = useState(null) // null = closed, {} = new, {id,...} = edit
  const qc = useQueryClient()

  const { data: layout } = useQuery({
    queryKey: ['homepage-layout', clientId],
    queryFn: () => getHomepageLayout(clientId),
    enabled: !!clientId,
    staleTime: 10000
  })

  const { data: customBlocks = [] } = useQuery({
    queryKey: ['custom-text-blocks', clientId],
    queryFn: () => getCustomTextBlocks(clientId),
    enabled: !!clientId,
    staleTime: 10000
  })

  const mUpdateLayout = useMutation({
    mutationFn: (data) => updateHomepageLayout(clientId, data),
    onMutate: async (data) => {
      await qc.cancelQueries(['homepage-layout', clientId])
      const prev = qc.getQueryData(['homepage-layout', clientId])
      qc.setQueryData(['homepage-layout', clientId], old => ({ ...old, ...data }))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['homepage-layout', clientId], ctx.prev),
    onSettled: () => qc.invalidateQueries(['homepage-layout', clientId])
  })

  const mDeleteBlock = useMutation({
    mutationFn: async (blockId) => {
      // First remove from layout
      const newComponents = components.filter(c => c.id !== blockId)
      await mUpdateLayout.mutateAsync({ components: newComponents })
      // Then try to delete from database (may fail if already deleted)
      try {
        await deleteCustomTextBlock(clientId, blockId)
      } catch (err) {
        console.warn('Custom block already deleted from database:', err.message)
      }
      qc.invalidateQueries(['custom-text-blocks', clientId])
      qc.invalidateQueries(['homepage-layout', clientId])
    },
    onError: (error) => {
      console.error('Failed to delete custom block:', error)
      alert('Failed to delete custom block. Please try again.')
    }
  })

  const components = layout?.components || []

  const allComponents = components
    .filter(c => c.type !== 'featured')
    .map(c => {
      if (c.type === 'custom') {
        const block = customBlocks?.find(b => b.id === c.id)
        return block ? { ...c, ...block } : c
      }
      return c
    })

  const updateComponents = useCallback((newComps) => {
    newComps.forEach((c, i) => c.order = i)
    mUpdateLayout.mutate({ components: newComps })
  }, [mUpdateLayout])

  const handleToggle = (index) => {
    const newComponents = allComponents.map((c, i) => i === index ? { ...c, visible: !c.visible } : c)
    mUpdateLayout.mutate({ components: [...components.filter(c => c.type === 'featured'), ...newComponents] })
  }

  const handleMove = (index, dir) => {
    const swap = index + dir
    if (swap < 0 || swap >= allComponents.length) return
    const arr = [...allComponents]
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    arr.forEach((c, i) => c.order = i)
    // Also update the full components list (including featured) with new order
    const featured = components.filter(c => c.type === 'featured')
    mUpdateLayout.mutate({ components: [...featured, ...arr] })
  }

  const handleDelete = (blockId) => {
    if (confirm('Delete this custom block?')) mDeleteBlock.mutate(blockId)
  }

  const visibleCount = allComponents.filter(c => c.visible).length

  return (
    <div style={{ maxWidth:760 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:C.t0 }}>Homepage Layout</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:C.t2 }}>
            Reorder and toggle sections visible on the homepage. {visibleCount} of {allComponents.length} sections active.
          </p>
        </div>
        {mUpdateLayout.isSuccess && (
          <span style={{ fontSize:12, color:C.green, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* Component list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {allComponents.map((component, index) => (
          <ComponentCard
            key={component.id}
            component={component}
            index={index}
            total={allComponents.length}
            onToggle={() => handleToggle(index)}
            onMoveUp={() => handleMove(index, -1)}
            onMoveDown={() => handleMove(index, 1)}
            onEdit={() => setActiveBlock(component)}
            onDelete={() => handleDelete(component.id)}
          />
        ))}
      </div>

      {/* Inline form or Add button */}
      {activeBlock !== null ? (
        <CustomBlockForm
          block={activeBlock?.id ? activeBlock : null}
          clientId={clientId}
          onClose={() => setActiveBlock(null)}
          onSaved={(saved) => {
            // If this was a new block (not an edit), add it to the layout components
            const isEdit = !!(activeBlock?.id)
            if (!isEdit && saved?.id) {
              const newComponent = { id: saved.id, type: 'custom', visible: true, order: components.length }
              const newComponents = [...components, newComponent]
              newComponents.forEach((c, i) => c.order = i)
              mUpdateLayout.mutate({ components: newComponents })
            }
            setActiveBlock(null)
          }}
        />
      ) : (
        <button
          onClick={() => setActiveBlock({})}
          style={{
            width:'100%', padding:'9px 0', background:'transparent',
            border:`1px solid ${C.border}`, borderRadius:8,
            cursor:'pointer', fontSize:12, color:C.t2, fontWeight:500,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.acc; e.currentTarget.style.color=C.acc }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.t2 }}
        >
          + Add Custom Text Block
        </button>
      )}
    </div>
  )
}
