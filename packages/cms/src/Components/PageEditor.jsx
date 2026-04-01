import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useState } from 'react'
import ImageUpload from './ImageUpload'
import LoadingSpinner from './LoadingSpinner'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', input:'#111827', editorBg:'#0A0F1A',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF'
}

const editorCSS = `
  .editor-container { position: relative; }
  .ProseMirror { 
    outline: none; 
    min-height: 200px; 
    padding: 16px; 
    line-height: 1.7; 
    font-size: 15px;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #445572;
    pointer-events: none;
    height: 0;
  }
  .ProseMirror h2 { font-size: 20px; font-weight: 700; margin: 20px 0 10px; color: #F1F5FF; }
  .ProseMirror h3 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; color: #B8C5E0; }
  .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 12px 0; }
  .ProseMirror li { margin: 4px 0; }
  .ProseMirror a { color: #00D4FF; text-decoration: underline; }
  .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
`

export default function PageEditor({ 
  content = '', 
  onUpdate, 
  placeholder = 'Start writing page content... Supports shortcodes like {{restaurantName}}',
  clientId,
  readOnly = false 
}) {
  const [sourceMode, setSourceMode] = useState(false)
  const [linkModal, setLinkModal] = useState(null)
  const [imageModal, setImageModal] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({
        HTMLAttributes: { class: 'page-image' }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        'data-placeholder': placeholder
      }
    },
    onUpdate: ({ editor }) => {
      if (!sourceMode && !readOnly) {
        onUpdate?.(editor.getHTML())
      }
    }
  })

  const enterSource = () => {
    setSourceMode(true)
  }

  const exitSource = () => {
    if (editor) {
      editor.commands.setContent(sourceValue, false)
    }
    setSourceMode(false)
  }

  const [sourceValue, setSourceValue] = useState('')
  
  const insertLink = (href) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLinkModal(null)
  }

  const insertImage = (url) => {
    editor.chain().focus().setImage({ src: url }).run()
    setImageModal(false)
  }

  return (
    <div className="editor-container" style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
      <style>{editorCSS}</style>

      {/* Toolbar */}
      <Toolbar 
        editor={editor}
        sourceMode={sourceMode}
        onSourceToggle={sourceMode ? exitSource : enterSource}
        onLinkClick={() => setLinkModal({ editor })}
        onImageClick={() => setImageModal(true)}
        onEnterSource={enterSource}
      />

      {sourceMode ? (
        <textarea 
          value={editor ? editor.getHTML() : ''}
          onChange={e => setSourceValue(e.target.value)}
          style={{
            width: '100%', minHeight: '300px', resize: 'vertical',
            background: C.editorBg, border: 'none', borderRadius: '0 0 12px 12px',
            color: C.cyan, fontFamily: "'Fira Code', monospace", fontSize: 14,
            padding: '20px', outline: 'none', lineHeight: 1.6
          }}
          placeholder={placeholder}
        />
      ) : (
        <div style={{
          minHeight: '300px',
          background: C.editorBg,
          borderRadius: '0 0 12px 12px',
          position: 'relative',
          cursor: readOnly ? 'default' : 'text'
        }}>
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Link Modal */}
      {linkModal && (
        <LinkModal 
          editor={linkModal.editor}
          onConfirm={insertLink}
          onClose={() => setLinkModal(null)}
        />
      )}

      {/* Image Modal */}
      {imageModal && (
        <ImageModal
          clientId={clientId}
          onInsert={insertImage}
          onClose={() => setImageModal(false)}
        />
      )}
    </div>
  )
}

function Toolbar({ editor, sourceMode, onSourceToggle, onLinkClick, onImageClick }) {
  if (!editor && !sourceMode) return null

  const isActive = (command) => editor?.isActive(command) || false

  const buttons = [
    { label: 'B', command: () => editor.chain().focus().toggleBold().run(), active: isActive('bold') },
    { label: 'I', command: () => editor.chain().focus().toggleItalic().run(), active: isActive('italic') },
    { label: 'U', command: () => editor.chain().focus().toggleUnderline().run(), active: isActive('underline') },
    { label: 'S', command: () => editor.chain().focus().toggleStrike().run(), active: isActive('strike') },
    null, // separator
    { label: 'H2', command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: isActive('heading', { level: 2 }) },
    { label: 'H3', command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: isActive('heading', { level: 3 }) },
    null,
    { label: '• List', command: () => editor.chain().focus().toggleBulletList().run(), active: isActive('bulletList') },
    { label: '1. List', command: () => editor.chain().focus().toggleOrderedList().run(), active: isActive('orderedList') },
    null,
    { label: '🔗 Link', command: onLinkClick, active: isActive('link') },
    { label: '🖼️ Image', command: onImageClick },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      padding: '8px 12px', background: C.panel,
      borderBottom: `1px solid ${C.border}`,
      borderRadius: '12px 12px 0 0',
      overflow: 'auto'
    }}>
      {buttons.map((btn, i) => btn ? (
        <button key={i} 
          onMouseDown={e => { e.preventDefault(); btn.command() }}
          style={{
            padding: '6px 10px', 
            borderRadius: 6, 
            border: 'none',
            background: btn.active ? C.hover : 'transparent',
            color: btn.active ? C.acc : C.t2,
            fontSize: 13, fontWeight: btn.active ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap',
            minWidth: btn.label.length > 3 ? 70 : 34
          }}
          title={btn.label}
        >
          {btn.label}
        </button>
      ) : (
        <div key={i} style={{ width: 1, height: 20, background: C.border2 }} />
      ))}
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
        {editor && (
          <>
            <button onClick={() => editor.chain().focus().undo().run()}
              style={btnStyle(false)} title="Undo">
              ↶
            </button>
            <button onClick={() => editor.chain().focus().redo().run()}
              style={btnStyle(false)} title="Redo">
              ↷
            </button>
          </>
        )}
        <button onClick={onSourceToggle}
          style={btnStyle(sourceMode)} title="Source code">
          {"</>"}
        </button>
      </div>
    </div>
  )
}

function btnStyle(active) {
  return {
    padding: '6px 10px', borderRadius: 6, border: 'none',
    background: active ? C.hover : 'transparent',
    color: active ? C.acc : C.t2,
    fontSize: 13, cursor: 'pointer'
  }
}

function LinkModal({ editor, onConfirm, onClose }) {
  const [url, setUrl] = useState('')
  
  useEffect(() => {
    setUrl(editor?.getAttributes('link').href || '')
  }, [editor])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 420
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 16 }}>
          Link Editor
        </div>
        <input 
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            width: '100%', padding: '12px 14px', background: C.input,
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.t0,
            fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') onConfirm(url)
            if (e.key === 'Escape') onClose()
          }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {url && (
            <button onClick={() => onConfirm('')}
              style={{
                padding: '8px 16px', background: 'transparent',
                border: `1px solid ${C.red}40`, borderRadius: 6,
                color: C.red, fontSize: 13, cursor: 'pointer'
              }}>
              Remove
            </button>
          )}
          <button onClick={onClose}
            style={{
              padding: '8px 16px', background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 6,
              color: C.t2, fontSize: 13, cursor: 'pointer'
            }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(url || '')}
            disabled={!url}
            style={{
              padding: '8px 20px', background: url ? C.acc : C.card,
              border: 'none', borderRadius: 6, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: url ? 'pointer' : 'not-allowed'
            }}>
            Insert Link
          </button>
        </div>
      </div>
    </div>
  )
}

function ImageModal({ clientId, onInsert, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <ImageUpload 
        clientId={clientId}
        label="Insert Image"
        hint="Upload or paste URL - PNG/JPG/WEBP"
        onChange={onInsert}
        onClose={onClose}
      />
    </div>
  )
}

