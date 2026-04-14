import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { getHomepageLayout, updateHomepageLayout, getCustomTextBlocks, createCustomTextBlock, updateCustomTextBlock, deleteCustomTextBlock } from '../api/homepageLayout'
import { C } from '../theme'

const NoteToolbar = ({ editor, sourceMode, onToggleSource }) => {
  if (!editor && !sourceMode) return null

  const btn = (active, onClick, label, title='') => (
    <button key={label}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title || label}
      style={{ padding:'4px 8px', borderRadius:5, border:'none',
        background: active ? C.panel : 'transparent',
        color: active ? C.acc : C.t2,
        cursor:'pointer', fontSize:13, fontWeight:600 }}
      onMouseEnter={e => e.currentTarget.style.background=C.panel}
      onMouseLeave={e => e.currentTarget.style.background=active?C.panel:'transparent'}>
      {label}
    </button>
  )

  const sep = <div style={{ width:1, height:18, background:C.border, margin:'0 4px', flexShrink:0 }}/>

  if (sourceMode) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:2,
        padding:'6px 10px', background:C.card,
        borderBottom:`1px solid ${C.border}`, borderRadius:'9px 9px 0 0' }}>
        <span style={{ fontSize:11, color:C.t3, marginRight:8 }}>
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
      padding:'6px 10px', background:C.card,
      borderBottom:`1px solid ${C.border}`, borderRadius:'9px 9px 0 0' }}>
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
      {btn(editor.isActive('link'),  () => editor.chain().focus().toggleLink({ href: prompt('Enter URL:') }).run(),  '🔗 Link')}
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

const ComponentCard = ({ component, onToggle, onMoveUp, onMoveDown, isFirst, isLast, isCustom, onEdit, onDelete }) => {
  const componentLabels = {
    welcome: 'Welcome Content',
    promos: 'Promo Tiles',
    specials: 'Specials',
    reviews: 'Reviews',
    custom: 'Custom Block'
  }

  return (
    <div
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          style={{
            padding: '6px 10px', background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: isFirst ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: isFirst ? 0.3 : 1
          }}
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          style={{
            padding: '6px 10px', background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: isLast ? 'not-allowed' : 'pointer', fontSize: 12,
            opacity: isLast ? 0.3 : 1
          }}
        >
          ↓
        </button>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.t0 }}>
          {componentLabels[component.type] || component.type}
        </div>
        {isCustom && component.title && (
          <div style={{ fontSize: 12, color: C.t2 }}>{component.title}</div>
        )}
      </div>

      <ToggleSwitch
        checked={component.visible}
        onChange={onToggle}
        label="Show"
      />

      {isCustom && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 12px', background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 4, cursor: 'pointer', fontSize: 12
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '6px 12px', background: '#EF4444', border: 'none',
              borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#fff'
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function HomepageBuilder({ clientId }) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [editingCustomBlock, setEditingCustomBlock] = useState(null)
  const [customForm, setCustomForm] = useState({ title: '', content: '', isActive: true })
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceValue, setSourceValue] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading','paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Add your custom content here...' }),
    ],
    content: customForm.content || '',
    editorProps: { attributes: { style: 'text-align:left' } },
    onUpdate: ({ editor }) => {
      setCustomForm({ ...customForm, content: editor.getHTML() })
    }
  })

  const enterSource = () => {
    setSourceValue(editor?.getHTML() || '')
    setSourceMode(true)
  }

  const exitSource = () => {
    editor?.commands.setContent(sourceValue, false)
    setSourceMode(false)
  }

  // Update editor when editing a block
  useEffect(() => {
    if (editor && showCustomForm && customForm.content !== editor.getHTML()) {
      editor.commands.setContent(customForm.content || '')
    }
  }, [showCustomForm, customForm.content, editor])

  const qc = useQueryClient()

  const { data: layout } = useQuery({
    queryKey: ['homepage-layout', clientId],
    queryFn: () => getHomepageLayout(clientId),
    enabled: !!clientId
  })

  const { data: customBlocks } = useQuery({
    queryKey: ['custom-text-blocks', clientId],
    queryFn: () => getCustomTextBlocks(clientId),
    enabled: !!clientId
  })

  const mUpdateLayout = useMutation({
    mutationFn: (data) => updateHomepageLayout(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries(['homepage-layout', clientId])
    }
  })

  const mCreateBlock = useMutation({
    mutationFn: (data) => createCustomTextBlock(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries(['custom-text-blocks', clientId])
      setShowCustomForm(false)
      setCustomForm({ title: '', content: '', isActive: true })
    }
  })

  const mUpdateBlock = useMutation({
    mutationFn: ({ blockId, data }) => updateCustomTextBlock(clientId, blockId, data),
    onSuccess: () => {
      qc.invalidateQueries(['custom-text-blocks', clientId])
      setEditingCustomBlock(null)
    }
  })

  const mDeleteBlock = useMutation({
    mutationFn: (blockId) => deleteCustomTextBlock(clientId, blockId),
    onSuccess: () => {
      qc.invalidateQueries(['custom-text-blocks', clientId])
      qc.invalidateQueries(['homepage-layout', clientId])
    }
  })

  const components = layout?.components || []

  const handleToggle = (index) => {
    const newComponents = [...components]
    newComponents[index].visible = !newComponents[index].visible
    mUpdateLayout.mutate({ components: newComponents })
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const newComponents = [...components]
    ;[newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]]
    newComponents.forEach((c, i) => c.order = i)
    mUpdateLayout.mutate({ components: newComponents })
  }

  const handleMoveDown = (index) => {
    if (index === components.length - 1) return
    const newComponents = [...components]
    ;[newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]]
    newComponents.forEach((c, i) => c.order = i)
    mUpdateLayout.mutate({ components: newComponents })
  }

  const handleAddCustomBlock = () => {
    mCreateBlock.mutate(customForm)
  }

  const handleEditCustomBlock = (block) => {
    setEditingCustomBlock(block)
    setCustomForm({ title: block.title || '', content: block.content || '', isActive: block.isActive !== false })
    setShowCustomForm(true)
  }

  const handleUpdateCustomBlock = () => {
    mUpdateBlock.mutate({ blockId: editingCustomBlock.id, data: customForm })
  }

  const handleDeleteCustomBlock = (blockId) => {
    if (confirm('Delete this custom text block?')) {
      mDeleteBlock.mutate(blockId)
    }
  }

  const handleSaveCustomForm = () => {
    if (editingCustomBlock) {
      handleUpdateCustomBlock()
    } else {
      handleAddCustomBlock()
    }
  }

  // Merge custom blocks into layout components and filter out featured
  const allComponents = components
    .filter(c => c.type !== 'featured')
    .map(c => {
    if (c.type === 'custom') {
      const block = customBlocks?.find(b => b.id === c.id)
      return { ...c, ...block }
    }
    return c
  })

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Homepage Builder</h2>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: 13, color: C.t2 }}>
        Drag components to reorder the homepage layout. Toggle visibility to show/hide sections.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        {allComponents.map((component, index) => (
          <ComponentCard
            key={component.id}
            component={component}
            onToggle={() => handleToggle(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isFirst={index === 0}
            isLast={index === allComponents.length - 1}
            isCustom={component.type === 'custom'}
            onEdit={() => handleEditCustomBlock(component)}
            onDelete={() => handleDeleteCustomBlock(component.id)}
          />
        ))}

        <button
          onClick={() => {
            setEditingCustomBlock(null)
            setCustomForm({ title: '', content: '', isActive: true })
            setShowCustomForm(true)
          }}
          style={{
            width: '100%', padding: '12px', background: C.card,
            border: `1px dashed ${C.border}`, borderRadius: 8,
            cursor: 'pointer', fontSize: 14, color: C.t2, marginTop: 8
          }}
        >
          + Add Custom Block
        </button>
      </div>

      {showCustomForm && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.t0 }}>
            {editingCustomBlock ? 'Edit Custom Text Block' : 'Add Custom Text Block'}
          </h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
            }}>Title</label>
            <input
              type="text"
              value={customForm.title}
              onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
              placeholder="Section title"
              style={{
                width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
            }}>Content</label>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <NoteToolbar
                editor={editor}
                sourceMode={sourceMode}
                onToggleSource={sourceMode ? exitSource : enterSource}
              />
              {sourceMode ? (
                <textarea
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%', minHeight: 200, padding: '14px 16px',
                    background: C.panel, border: 'none', borderBottom: `1px solid ${C.border}`,
                    borderRadius: '0 0 9px 9px', color: C.t0, fontSize: 13,
                    lineHeight: 1.7, outline: 'none', resize: 'vertical',
                    fontFamily: 'monospace', boxSizing: 'border-box'
                  }}
                />
              ) : (
                <div
                  style={{ minHeight: 200, padding: '14px 16px', background: C.panel,
                    border: 'none', borderBottom: `1px solid ${C.border}`,
                    borderRadius: '0 0 9px 9px', color: C.t0, fontSize: 13,
                    lineHeight: 1.7, outline: 'none', cursor: 'text' }}
                  onClick={() => editor?.commands.focus()}
                >
                  <EditorContent editor={editor} />
                  <style jsx>{`
                    .ProseMirror { outline: none; min-height: 180px; }
                    .ProseMirror p.is-editor-empty:first-child::before {
                      content: attr(data-placeholder);
                      float: left;
                      color: ${C.t3};
                      pointer-events: none;
                      height: 0;
                    }
                    .ProseMirror h1 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
                    .ProseMirror h2 { font-size: 1.3em; font-weight: bold; margin: 0.5em 0; }
                    .ProseMirror h3 { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
                    .ProseMirror ul { padding-left: 1.5em; }
                    .ProseMirror ol { padding-left: 1.5em; }
                    .ProseMirror blockquote { border-left: 3px solid ${C.border}; padding-left: 1em; margin: 1em 0; color: ${C.t2}; }
                    .ProseMirror code { background: ${C.input}; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
                    .ProseMirror pre { background: ${C.input}; padding: 1em; border-radius: 6px; overflow-x: auto; }
                    .ProseMirror pre code { background: none; padding: 0; }
                  `}</style>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onClick={handleSaveCustomForm}
              disabled={mCreateBlock.isPending || mUpdateBlock.isPending}
              style={{
                padding: '10px 24px', background: C.acc, border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: (mCreateBlock.isPending || mUpdateBlock.isPending) ? 'not-allowed' : 'pointer',
                opacity: (mCreateBlock.isPending || mUpdateBlock.isPending) ? 0.6 : 1
              }}
            >
              {mCreateBlock.isPending || mUpdateBlock.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowCustomForm(false)
                setEditingCustomBlock(null)
                setCustomForm({ title: '', content: '', isActive: true })
              }}
              style={{
                padding: '10px 24px', background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.t0, fontSize: 14, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: C.t2 }}>
          {allComponents.filter(c => c.visible).length} of {allComponents.length} components visible
        </span>
        {mUpdateLayout.isSuccess && <span style={{ fontSize: 13, color: '#22C55E', fontWeight: 600 }}>Saved!</span>}
      </div>
    </div>
  )
}
