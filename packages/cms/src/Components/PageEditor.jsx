import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useState } from 'react'
import ImageUpload from './ImageUpload'
import { API } from '../api/utils'

// Same editor CSS as used in ConfigSection (Site Notes)
const editorCSS = `
  .ProseMirror { outline: none; text-align: left; }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #445572;
    pointer-events: none;
    height: 0;
  }
  .ProseMirror h2 { font-size: 16px; font-weight: 700; margin: 14px 0 8px; color: #F1F5FF; }
  .ProseMirror h3 { font-size: 14px; font-weight: 700; margin: 12px 0 6px; color: #B8C5E0; }
  .ProseMirror ul, .ProseMirror ol { padding-left: 18px; margin: 8px 0; }
  .ProseMirror li { margin: 3px 0; }
  .ProseMirror a { color: #00D4FF; text-decoration: underline; }
  .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
  .source-textarea { 
    width: 100%; min-height: 300px; padding: 14px 16px; 
    background: #0A0F1A; border: none; border-radius: 0 0 12px 12px; 
    color: #00D4FF; font-family: 'Fira Code', monospace; font-size: 13px; 
    line-height: 1.7; outline: none; resize: vertical; box-sizing: border-box;
  }
  .page-drop-active { border-color: #FF6B2B !important; background: #2A1200 !important; }
`

export default function PageEditor({ 
  content = '', 
  onUpdate, 
  placeholder = 'Start writing page content...',
  clientId,
  readOnly = false 
}) {
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceValue, setSourceValue] = useState('')
  const [linkModal, setLinkModal] = useState(null)
  const [imageModal, setImageModal] = useState(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder })
    ],
    content,
    editable: !readOnly,
    editorProps: { attributes: { style: 'text-align: left' } },
    onUpdate: ({ editor }) => {
      if (!sourceMode && !readOnly) {
        onUpdate?.(editor.getHTML())
      }
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

  const handleSourceChange = (e) => {
    setSourceValue(e.target.value)
  }

  const handleLinkClick = () => {
    setLinkModal({ initial: editor?.getAttributes('link').href || '' })
  }

  const handleImageClick = (dropFile = null) => {
    setImageModal({ dropFile })
  }

  return (
    <div style={{ background: '#141C2E', border: '1px solid #1E2D4A', borderRadius: 12, overflow: 'hidden' }}>
      <style>{editorCSS}</style>

      <PageToolbar
        editor={editor}
        onLinkClick={handleLinkClick}
        onImageClick={handleImageClick}
        sourceMode={sourceMode}
        onToggleSource={sourceMode ? exitSource : enterSource}
      />

      {sourceMode ? (
        <textarea
          className="source-textarea"
          value={sourceValue}
          onChange={handleSourceChange}
          spellCheck={false}
        />
      ) : (
        <div
          style={{
            minHeight: 300, padding: '14px 16px', background: '#111827',
            borderTop: '1px solid #1E2D4A', borderRadius: '0 0 12px 12px',
            color: '#F1F5FF', fontSize: 13, lineHeight: 1.7,
            outline: 'none', cursor: 'text', transition: 'border-color 0.15s'
          }}
          onClick={() => editor?.commands.focus()}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('page-drop-active')
            const file = e.dataTransfer.files[0]
            if (file?.type.startsWith('image/')) handleImageClick(file)
          }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('page-drop-active') }}
          onDragLeave={e => e.currentTarget.classList.remove('page-drop-active')}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {linkModal && (
        <LinkModal
          initial={linkModal.initial}
          onConfirm={(url) => {
            if (!url) editor?.chain().focus().unsetLink().run()
            else editor?.chain().focus().setLink({ href: url }).run()
            setLinkModal(null)
          }}
          onClose={() => setLinkModal(null)}
        />
      )}

      {imageModal && (
        <ImageModal
          clientId={clientId}
          editor={editor}
          dropFile={imageModal.dropFile}
          onInsertUrl={(url) => {
            editor?.chain().focus().setImage({ src: url }).run()
            setImageModal(null)
          }}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  )
}

// Same toolbar pattern as NoteToolbar in ConfigSection
function PageToolbar({ editor, onLinkClick, onImageClick, sourceMode, onToggleSource }) {
  if (!editor && !sourceMode) return null

  const btn = (active, onClick, label, title = '') => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title || label}
      style={{
        padding: '4px 8px', borderRadius: 5, border: 'none',
        background: active ? '#1F2D4A' : 'transparent',
        color: active ? '#FF6B2B' : '#7A8BAD',
        cursor: 'pointer', fontSize: 13, fontWeight: 600
      }}
    >
      {label}
    </button>
  )

  const sep = <div style={{ width: 1, height: 18, background: '#1E2D4A', margin: '0 4px', flexShrink: 0 }} />

  // Source mode — show minimal toolbar
  if (sourceMode) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 10px', background: '#141C2E',
        borderBottom: '1px solid #1E2D4A', borderRadius: '12px 12px 0 0'
      }}>
        <span style={{ fontSize: 11, color: '#445572', marginRight: 8 }}>Source Code</span>
        <div style={{ marginLeft: 'auto' }}>
          {btn(true, onToggleSource, '</>', 'Toggle source code')}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      padding: '6px 10px', background: '#141C2E',
      borderBottom: '1px solid #1E2D4A', borderRadius: '12px 12px 0 0'
    }}>
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U')}
      {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S')}
      {sep}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}
      {sep}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '• List')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1. List')}
      {sep}
      {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '⬅')}
      {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '⬛')}
      {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), '➡')}
      {sep}
      {btn(editor.isActive('link'), onLinkClick, '🔗 Link')}
      {btn(false, () => onImageClick(), '🖼 Image')}
      {sep}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
        {btn(false, () => editor.chain().focus().undo().run(), '↩', 'Undo')}
        {btn(false, () => editor.chain().focus().redo().run(), '↪', 'Redo')}
        {sep}
        {btn(false, onToggleSource, '</>', 'Toggle source code')}
      </div>
    </div>
  )
}

function LinkModal({ initial, onConfirm, onClose }) {
  const [url, setUrl] = useState(initial || '')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#141C2E', border: '1px solid #1E2D4A',
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 420
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5FF', marginBottom: 16 }}>
          Link Editor
        </div>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            width: '100%', padding: '12px 14px', background: '#111827',
            border: '1px solid #1E2D4A', borderRadius: 8, color: '#F1F5FF',
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
                border: '1px solid #FF6B2B40', borderRadius: 6,
                color: '#FF6B2B', fontSize: 13, cursor: 'pointer'
              }}>
              Remove
            </button>
          )}
          <button onClick={onClose}
            style={{
              padding: '8px 16px', background: 'transparent',
              border: '1px solid #1E2D4A', borderRadius: 6,
              color: '#7A8BAD', fontSize: 13, cursor: 'pointer'
            }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(url || '')}
            disabled={!url}
            style={{
              padding: '8px 20px', background: url ? '#FF6B2B' : '#141C2E',
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

function ImageModal({ clientId, editor, dropFile, onInsertUrl, onClose }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    
    const localUrl = URL.createObjectURL(file)
    editor?.chain().focus().setImage({ src: localUrl }).run()
    onClose()

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
      if (data.url) {
        const current = editor?.getHTML() || ''
        const updated = current.replace(localUrl, data.url)
        editor?.commands.setContent(updated, false)
      }
    } catch (err) {
      console.error('Image upload failed:', err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      {dropFile ? (
        <div style={{
          background: '#141C2E', border: '1px solid #1E2D4A',
          borderRadius: 12, padding: 24, width: '100%', maxWidth: 420
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5FF', marginBottom: 16 }}>
            Upload Image
          </div>
          <p style={{ color: '#B8C5E0', marginBottom: 16 }}>{dropFile.name}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid #1E2D4A', borderRadius: 6,
                color: '#7A8BAD', fontSize: 13, cursor: 'pointer'
              }}>
              Cancel
            </button>
            <button onClick={() => handleFileUpload(dropFile)}
              disabled={uploading}
              style={{
                padding: '8px 20px', background: '#FF6B2B',
                border: 'none', borderRadius: 6, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer'
              }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      ) : (
        <ImageUpload
          clientId={clientId}
          label="Insert Image"
          hint="Upload or paste URL - PNG/JPG/WEBP"
          onChange={onInsertUrl}
          onClose={onClose}
        />
      )}
    </div>
  )
}

