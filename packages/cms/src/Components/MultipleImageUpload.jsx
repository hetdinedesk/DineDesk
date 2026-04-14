import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { API } from '../api/utils'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', red:'#EF4444', green:'#22C55E'
}

export default function MultipleImageUpload({ 
  clientId, 
  label, 
  hint, 
  value = [], 
  onChange, 
  aspect = 16/9,
  accept = 'image/*',
  maxImages = 10
}) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState({})

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
      const newImages = [...value, data.url]
      onChange(newImages)
      setPreviews(prev => ({ ...prev, [data.url]: URL.createObjectURL(file) }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const remainingSlots = maxImages - value.length
    
    if (imageFiles.length > remainingSlots) {
      setError(`Can only add ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} (max ${maxImages})`)
      return
    }
    
    imageFiles.forEach(file => uploadFile(file))
  }

  const handleClick = () => {
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = true
    input.onchange = (e) => handleFiles(Array.from(e.target.files))
    input.click()
  }

  const removeImage = (index) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...value]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onChange(newImages)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.t3,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6
        }}>
          {label}
        </div>
      )}
      
      {hint && (
        <div style={{ fontSize: 12, color: C.t3, marginBottom: 12 }}>
          {hint}
        </div>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20
        }}>
          {value.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} style={{
              position: 'relative',
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              {/* Image Preview */}
              <div style={{
                width: '100%',
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: C.card
              }}>
                <img 
                  src={previews[imageUrl] || imageUrl} 
                  alt={`Exterior photo ${index + 1}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              </div>

              {/* Image Controls */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 4
              }}>
                {/* Move Left */}
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      color: C.t1,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                
                {/* Move Right */}
                {index < value.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      color: C.t1,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Move right"
                  >
                    →
                  </button>
                )}
                
                {/* Delete */}
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: C.red,
                    border: 'none',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>

              {/* Image Number */}
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: C.acc,
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600
              }}>
                {index + 1}
              </div>

              {/* Image Info */}
              <div style={{
                padding: 12,
                fontSize: 11,
                color: C.cyan,
                fontFamily: 'monospace',
                textAlign: 'center',
                background: C.panel
              }}>
                {imageUrl.split('/').pop() || `Photo ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <div style={{ 
          border: `2px dashed ${dragging ? C.acc : C.border2}`,
          borderRadius: 12, 
          padding: '24px 20px', 
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
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>
            {uploading ? <LoadingSpinner size={32} color={C.acc} /> : '📎'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginBottom: 4 }}>
            {uploading ? 'Uploading...' : `Add Photos (${value.length}/${maxImages})`}
          </div>
          <div style={{ fontSize: 12, color: C.t2 }}>
            Click to upload or drag & drop multiple images
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          marginTop: 12,
          padding: '8px 12px',
          background: `${C.red}15`,
          border: `1px solid ${C.red}`,
          borderRadius: 6,
          fontSize: 12,
          color: C.red
        }}>
          {error}
        </div>
      )}

      {/* Instructions */}
      {value.length > 0 && (
        <div style={{ 
          marginTop: 12,
          fontSize: 11,
          color: C.t3,
          textAlign: 'center'
        }}>
          Drag images to reorder • First image will be primary exterior photo
        </div>
      )}
    </div>
  )
}
