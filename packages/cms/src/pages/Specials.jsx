import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSpecials, createSpecial, updateSpecial, deleteSpecial } from '../api/specials'
import { getSpecialsConfig, updateSpecialsConfig } from '../api/specialsConfig'
import ImageUpload from '../Components/ImageUpload'
import { C } from '../theme'

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

const InputField = ({ label, value, onChange, placeholder, type = 'text', required, hint, multiline }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
    }}>{label} {required && <span style={{ color: C.red }}>*</span>}</label>
    {multiline ? (
      <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
          borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box',
          resize: 'vertical', fontFamily: 'inherit'
        }}
      />
    ) : (
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
    )}
    {hint && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>}
  </div>
)

export default function Specials({ clientId }) {
  const qc = useQueryClient()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formConfig, setFormConfig] = useState({
    heading: 'Current Specials',
    subheading: 'Limited time offerings',
    showOnHomepage: false,
    maxItems: 2,
    isActive: true
  })
  
  // Special form state
  const [specialForm, setSpecialForm] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    bannerImage: '',
    startDate: '',
    endDate: '',
    isActive: true,
    showInNav: false
  })
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  // Fetch specials and config
  const { data: specials = [] } = useQuery({
    queryKey: ['specials', clientId],
    queryFn: () => getSpecials(clientId),
    enabled: !!clientId
  })
  
  const { data: configData } = useQuery({
    queryKey: ['specials-config', clientId],
    queryFn: () => getSpecialsConfig(clientId),
    enabled: !!clientId,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })
  
  // Initialize form from query data when it loads
  useEffect(() => {
    if (configData) {
      setFormConfig({
        heading: configData.heading || 'Current Specials',
        subheading: configData.subheading || 'Limited time offerings',
        showOnHomepage: configData.showOnHomepage || false,
        maxItems: configData.maxItems || 2,
        isActive: configData.isActive !== false
      })
    }
  }, [configData])
  
  // Use formConfig for editable inputs
  const config = formConfig
  
  // Mutations
  const mUpdateConfig = useMutation({
    mutationFn: (body) => updateSpecialsConfig(clientId, body),
    onSuccess: (data) => {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      // Update query cache with saved data
      qc.setQueryData(['specials-config', clientId], data)
      // Update local form state to match saved data
      if (data) {
        setFormConfig({
          heading: data.heading || 'Current Specials',
          subheading: data.subheading || 'Limited time offerings',
          showOnHomepage: data.showOnHomepage || false,
          maxItems: data.maxItems || 2,
          isActive: data.isActive !== false
        })
      }
    },
    onError: (error) => {
      console.error('Failed to save specials config:', error)
    }
  })
  
  const mSaveSpecial = useMutation({
    mutationFn: (body) => editingId ? updateSpecial(clientId, editingId, body) : createSpecial(clientId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['specials', clientId] })
      setShowForm(false)
      setEditingId(null)
      setSpecialForm({
        title: '', description: '', price: '', imageUrl: '', bannerImage: '',
        startDate: '', endDate: '', isActive: true, showInNav: false
      })
    }
  })
  
  const mDelete = useMutation({
    mutationFn: (id) => deleteSpecial(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specials', clientId] })
  })
  
  const mToggleActive = useMutation({
    mutationFn: ({ id, isActive }) => updateSpecial(clientId, id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specials', clientId] })
  })
  
  const handleSaveConfig = () => {
    mUpdateConfig.mutate(config)
  }
  
  const handleSaveSpecial = () => {
    mSaveSpecial.mutate({
      ...specialForm,
      price: specialForm.price ? parseFloat(specialForm.price) : null,
      startDate: specialForm.startDate ? new Date(specialForm.startDate) : null,
      endDate: specialForm.endDate ? new Date(specialForm.endDate) : null
    })
  }
  
  const handleEdit = (special) => {
    setEditingId(special.id)
    setSpecialForm({
      title: special.title || '',
      description: special.description || '',
      price: special.price ? String(special.price) : '',
      imageUrl: special.imageUrl || '',
      bannerImage: special.bannerImage || '',
      startDate: special.startDate ? special.startDate.split('T')[0] : '',
      endDate: special.endDate ? special.endDate.split('T')[0] : '',
      isActive: special.isActive !== false,
      showInNav: special.showInNav || false
    })
    setShowForm(true)
  }
  
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this special?')) {
      mDelete.mutate(id)
    }
  }
  
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Specials</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          style={{
            padding: '8px 16px', background: C.acc, border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Add Special
        </button>
      </div>
      
      {/* Homepage Config */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.t0 }}>Homepage Display</h3>
        
        <div style={{ marginTop: 12 }}>
          <ToggleSwitch
            checked={config.showOnHomepage}
            onChange={() => setFormConfig({ ...config, showOnHomepage: !config.showOnHomepage })}
            label="Show on homepage"
          />
        </div>
        
        {config.showOnHomepage && (
          <>
            <InputField
              label="Section Heading"
              value={config.heading}
              onChange={(e) => setFormConfig({ ...config, heading: e.target.value })}
              placeholder="Current Specials"
              style={{ marginTop: 16 }}
            />
            
            <InputField
              label="Section Subheading"
              value={config.subheading}
              onChange={(e) => setFormConfig({ ...config, subheading: e.target.value })}
              placeholder="Limited time offerings"
            />
            
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
              }}>Max Items to Show</label>
              <input
                type="number"
                min="1"
                max="4"
                value={config.maxItems}
                onChange={(e) => setFormConfig({ ...config, maxItems: parseInt(e.target.value) || 2 })}
                style={{
                  width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </>
        )}
        
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSaveConfig}
              disabled={mUpdateConfig.isPending}
              style={{
                padding: '8px 16px', background: C.acc, border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: mUpdateConfig.isPending ? 'not-allowed' : 'pointer',
                opacity: mUpdateConfig.isPending ? 0.6 : 1
              }}
            >
              {mUpdateConfig.isPending ? 'Saving...' : 'Save Config'}
            </button>
            {mUpdateConfig.isSuccess && (
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Saved</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Special Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.t0 }}>
              {editingId ? 'Edit Special' : 'Add Special'}
            </h3>
            
            <InputField
              label="Title"
              value={specialForm.title}
              onChange={(e) => setSpecialForm({ ...specialForm, title: e.target.value })}
              placeholder="Spring Tasting Menu"
              required
            />
            
            <InputField
              label="Description"
              value={specialForm.description}
              onChange={(e) => setSpecialForm({ ...specialForm, description: e.target.value })}
              placeholder="Experience a 5-course journey..."
              multiline
            />
            
            <InputField
              label="Price"
              value={specialForm.price}
              onChange={(e) => setSpecialForm({ ...specialForm, price: e.target.value })}
              placeholder="95.00"
              type="number"
              step="0.01"
            />
            
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
              }}>Image</label>
              <ImageUpload
                clientId={clientId}
                value={specialForm.imageUrl}
                onChange={(url) => setSpecialForm({ ...specialForm, imageUrl: url })}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
              }}>Banner Image (for specials page)</label>
              <ImageUpload
                clientId={clientId}
                value={specialForm.bannerImage}
                onChange={(url) => setSpecialForm({ ...specialForm, bannerImage: url })}
              />
            </div>
            
            <InputField
              label="Start Date"
              value={specialForm.startDate}
              onChange={(e) => setSpecialForm({ ...specialForm, startDate: e.target.value })}
              type="date"
            />
            
            <InputField
              label="End Date"
              value={specialForm.endDate}
              onChange={(e) => setSpecialForm({ ...specialForm, endDate: e.target.value })}
              type="date"
            />
            
            <div style={{ marginTop: 12 }}>
              <ToggleSwitch
                checked={specialForm.showInNav}
                onChange={() => setSpecialForm({ ...specialForm, showInNav: !specialForm.showInNav })}
                label="Show in navigation"
              />
            </div>
            
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSpecial}
                disabled={mSaveSpecial.isPending}
                style={{
                  padding: '8px 16px', background: C.acc, border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: mSaveSpecial.isPending ? 'not-allowed' : 'pointer',
                  opacity: mSaveSpecial.isPending ? 0.6 : 1
                }}
              >
                {mSaveSpecial.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Specials List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {specials.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.t3, background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No specials yet — click <strong style={{ color: C.acc }}>Add Special</strong> to get started.
          </div>
        ) : (
          specials.map(special => (
            <div
              key={special.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 10
              }}
            >
              {special.imageUrl && (
                <img
                  src={special.imageUrl}
                  alt={special.title}
                  style={{ width: 60, height: 60, object: 'cover', borderRadius: 8 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: special.isActive !== false ? C.t0 : C.t3, fontSize: 14 }}>
                  {special.title}
                </div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                  {special.price ? `$${special.price}` : 'No price'}
                  {special.endDate && ` · Until ${new Date(special.endDate).toLocaleDateString()}`}
                </div>
              </div>
              <ToggleSwitch
                checked={special.isActive !== false}
                onChange={() => !mToggleActive.isPending && mToggleActive.mutate({ id: special.id, isActive: special.isActive === false })}
              />
              <button
                onClick={() => handleEdit(special)}
                style={{ padding: '6px 12px', background: C.acc + '20', border: `1px solid ${C.acc}40`, borderRadius: 6, color: C.acc, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(special.id)}
                style={{ padding: '6px 12px', background: C.red + '15', border: `1px solid ${C.red}40`, borderRadius: 6, color: C.red, fontSize: 12, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
