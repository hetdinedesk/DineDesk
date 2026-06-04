import { useState } from 'react'
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
  accept = 'image/*',
  maxImages = 10,
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // index to confirm delete

  const uploadSingle = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API}/clients/${clientId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('dd_token')}` },
      body: formData
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `Upload failed (${res.status})`)
    }
    const data = await res.json()
    if (!data.url) throw new Error('No URL returned')
    return data.url
  }

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) { setError('Please select image files only'); return }

    const slots = maxImages - value.length
    if (slots <= 0) { setError(`Maximum ${maxImages} images reached`); return }

    const toUpload = imageFiles.slice(0, slots)
    if (imageFiles.length > slots) setError(`Only ${slots} slot${slots === 1 ? '' : 's'} left — uploading first ${slots}`)
    else setError('')

    setUploading(true)
    setUploadingCount(toUpload.length)
    const uploaded = []

    for (const file of toUpload) {
      try {
        const url = await uploadSingle(file)
        uploaded.push(url)
      } catch (err) {
        setError(err.message || 'Upload failed')
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1))
      }
    }

    if (uploaded.length) onChange([...value, ...uploaded])
    setUploading(false)
  }

  const handleClick = () => {
    if (uploading) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = true
    input.onchange = e => handleFiles(e.target.files)
    input.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index) => {
    setConfirmDelete(null)
    setHoveredIndex(null)
    onChange(value.filter((_, i) => i !== index))
  }

  const moveImage = (from, to) => {
    const imgs = [...value]
    const [img] = imgs.splice(from, 1)
    imgs.splice(to, 0, img)
    onChange(imgs)
  }

  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {label}
        </div>
      )}
      {hint && <div style={{ fontSize: 12, color: C.t3, marginBottom: 10 }}>{hint}</div>}

      {/* Image Grid */}
      {value.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => { setHoveredIndex(null); setConfirmDelete(null) }}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: '4/3',
                background: C.card,
                border: `2px solid ${index === 0 ? C.acc : C.border}`,
                cursor: 'default',
                transition: 'border-color 0.15s'
              }}
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.opacity = '0.15' }}
              />

              {/* Primary badge */}
              {index === 0 && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  background: C.acc, color: '#fff',
                  padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  pointerEvents: 'none'
                }}>
                  Primary
                </div>
              )}

              {/* Hover overlay */}
              {hoveredIndex === index && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(8,12,20,0.75)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  {/* Reorder buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {index > 0 && (
                      <button
                        onClick={() => moveImage(index, index - 1)}
                        title="Move left"
                        style={{ width: 30, height: 30, borderRadius: 7, background: C.panel, border: `1px solid ${C.border2}`, color: C.t1, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ←
                      </button>
                    )}
                    {index < value.length - 1 && (
                      <button
                        onClick={() => moveImage(index, index + 1)}
                        title="Move right"
                        style={{ width: 30, height: 30, borderRadius: 7, background: C.panel, border: `1px solid ${C.border2}`, color: C.t1, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        →
                      </button>
                    )}
                  </div>

                  {/* Delete / confirm delete */}
                  {confirmDelete === index ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => removeImage(index)}
                        style={{ padding: '5px 12px', borderRadius: 6, background: C.red, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: C.panel, border: `1px solid ${C.border2}`, color: C.t2, cursor: 'pointer', fontSize: 12 }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(index)}
                      style={{ padding: '5px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: `1px solid ${C.red}`, color: C.red, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Remove
                    </button>
                  )}
                </div>
              )}

              {/* Index badge (non-primary) */}
              {index > 0 && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  background: 'rgba(0,0,0,0.55)', color: C.t2,
                  padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  pointerEvents: 'none'
                }}>
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {value.length < maxImages ? (
        <div
          onClick={uploading ? undefined : handleClick}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? C.acc : C.border2}`,
            borderRadius: 10,
            padding: '18px 16px',
            textAlign: 'center',
            background: dragging ? `${C.acc}12` : 'transparent',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.18s',
            userSelect: 'none'
          }}
        >
          {uploading ? (
            <>
              <div style={{ fontSize: 20, marginBottom: 6 }}>⏳</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>
                Uploading {uploadingCount > 0 ? `${uploadingCount} image${uploadingCount > 1 ? 's' : ''}` : '...'}
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>Please wait</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.45 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 3 }}>
                Click to upload or drag & drop
              </div>
              <div style={{ fontSize: 11, color: C.t3 }}>
                {value.length}/{maxImages} photos • JPG, PNG, WEBP
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.t3, textAlign: 'center', padding: '10px 0' }}>
          Maximum {maxImages} images reached
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: `${C.red}15`, border: `1px solid ${C.red}40`, borderRadius: 7, fontSize: 12, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Tip */}
      {value.length > 1 && !uploading && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.t3, textAlign: 'center' }}>
          Hover an image to reorder or remove it · First image is the primary photo
        </div>
      )}
    </div>
  )
}
