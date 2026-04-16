import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { API } from '../api/utils'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', red:'#EF4444'
}

export default function ImageUpload({ 
  clientId, 
  label, 
  hint, 
  value, 
  onChange, 
  aspect = 1,
  accept = 'image/*',
  displayDimensions = null // { width, height } in pixels
}) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const uploadFile = async (file) => {
    if (!file?.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    setUploading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch(`${API}/clients/${clientId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('dd_token')}` },
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      onChange(data.url)
      setPreview(URL.createObjectURL(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    uploadFile(file)
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = (e) => uploadFile(e.target.files[0])
    input.click()
  }

  return (
    <div style={{ 
      border: `2px dashed ${dragging ? C.acc : C.border2}`,
      borderRadius: 12, 
      padding: '32px 20px', 
      textAlign: 'center',
      background: dragging ? C.hover : 'transparent',
      cursor: uploading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      position: 'relative'
    }}
      onClick={uploading ? null : handleClick}
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
    >
      {value && preview && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <button onClick={e => {
            e.stopPropagation()
            onChange('')
            setPreview(null)
          }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: C.red, border: 'none',
              color: '#fff', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {value ? (
        <>
          <div style={{ 
            width: '100%', height: 160, background: C.panel,
            borderRadius: 8, overflow: 'hidden', marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={preview || value} alt={label} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
          </div>
          
          {/* Display dimensions preview */}
          {displayDimensions && (
            <div style={{ 
              background: C.panel, 
              border: `1px solid ${C.border2}`,
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 12 
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>
                Preview at Display Size ({displayDimensions.width}x{displayDimensions.height}px)
              </div>
              <div style={{ 
                width: displayDimensions.width, 
                height: displayDimensions.height, 
                background: C.card,
                borderRadius: 4, 
                overflow: 'hidden',
                margin: '0 auto',
                maxWidth: '100%',
                aspectRatio: displayDimensions.width / displayDimensions.height
              }}>
                <img src={preview || value} alt={`${label} preview`}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }} />
              </div>
              <div style={{ fontSize: 10, color: C.t2, marginTop: 8, textAlign: 'center' }}>
                This is how the image will appear in the preview site
              </div>
            </div>
          )}
          
          <div style={{ fontSize: 11, color: C.cyan, fontFamily: 'monospace' }}>
            {value.split('/').pop() || 'Image ready'}
          </div>
          <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
            Click or drag new image to replace
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>
            {uploading ? <LoadingSpinner size={48} color={C.acc} /> : '📎'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.t1, marginBottom: 4 }}>
            {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
          </div>
          <div style={{ fontSize: 12, color: C.t2 }}>
            {hint || `${accept.split('/')[1].toUpperCase()} - max 10MB`}
          </div>
        </>
      )}

      {error && (
        <div style={{ 
          position: 'absolute', bottom: 12, left: 50, transform: 'translateX(-50%)',
          background: C.redBg, color: C.red, padding: '6px 12px',
          borderRadius: 6, fontSize: 12
        }}>
          {error}
        </div>
      )}

      {label && (
        <div style={{ 
          position: 'absolute', top: 12, left: 20, 
          background: C.panel, color: C.t0, padding: '4px 10px',
          borderRadius: 6, fontSize: 12, fontWeight: 600
        }}>
          {label}
        </div>
      )}
    </div>
  )
}

