import { useState } from 'react'
import { uploadImage } from '../api/images'

export default function ImageUpload({ clientId, onUpload, currentUrl }) {
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState(currentUrl || null)
  const [error,     setError]     = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(clientId, file)
      onUpload(result.url)
    } catch (err) {
      setError('Upload failed — check R2 credentials in .env')
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const inputRef = { current: null }

  return (
    <div style={{ userSelect: 'none' }}>

      {/* Visible upload box — clicking this triggers the hidden input */}
      <div
        onClick={() => { if (!uploading) document.getElementById('r2-upload-input-' + clientId).click() }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FF6B2B' }}
        onDragLeave={e => { e.currentTarget.style.borderColor = '#2A3F63' }}
        onDrop={e => {
          e.preventDefault()
          e.currentTarget.style.borderColor = '#2A3F63'
          const file = e.dataTransfer.files[0]
          if (file) handleFile({ target: { files: [file] } })
        }}
        style={{
          border: '2px dashed #2A3F63',
          borderRadius: 10,
          padding: '24px 20px',
          textAlign: 'center',
          background: '#141C2E',
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 100,
          transition: 'border-color 0.15s',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#FF6B2B' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A3F63' }}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 8, objectFit: 'cover', pointerEvents: 'none' }}
          />
        ) : (
          <span style={{ fontSize: 32, pointerEvents: 'none' }}>📎</span>
        )}

        <span style={{ fontSize: 13, color: uploading ? '#7A8BAD' : '#7A8BAD', pointerEvents: 'none' }}>
          {uploading
            ? '⏳ Uploading...'
            : preview
            ? 'Click or drag to replace'
            : 'Click to upload or drag & drop'}
        </span>

        <span style={{ fontSize: 11, color: '#445572', pointerEvents: 'none' }}>
          PNG, JPG, WEBP — max 10MB
        </span>
      </div>

      {/* Hidden file input — triggered by the div above */}
      <input
        id={'r2-upload-input-' + clientId}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          background: '#1A0505', border: '1px solid #EF444440',
          borderRadius: 8, fontSize: 12, color: '#EF4444'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Show saved URL */}
      {preview && !uploading && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#00D4FF', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {currentUrl ? '✅ Saved: ' + currentUrl : '⚠️ Click Save Changes to save this URL'}
        </div>
      )}
    </div>
  )
}