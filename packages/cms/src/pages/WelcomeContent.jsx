import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWelcomeContent, updateWelcomeContent } from '../api/welcomeContent'
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
        rows={4}
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

export default function WelcomeContent({ clientId }) {
  const [formData, setFormData] = useState({
    subtitle: '',
    heading: '',
    text: '',
    imageUrl: '',
    ctaText: '',
    ctaUrl: '',
    isExternal: false,
    isActive: true
  })
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const { data: content } = useQuery({
    queryKey: ['welcome-content', clientId],
    queryFn: () => getWelcomeContent(clientId),
    enabled: !!clientId
  })

  useEffect(() => {
    if (content) {
      setFormData({
        subtitle: content.subtitle || '',
        heading: content.heading || '',
        text: content.text || '',
        imageUrl: content.imageUrl || '',
        ctaText: content.ctaText || '',
        ctaUrl: content.ctaUrl || '',
        isExternal: content.isExternal || false,
        isActive: content.isActive !== false
      })
    }
  }, [content])
  
  const qc = useQueryClient()

  const mUpdate = useMutation({
    mutationFn: (body) => updateWelcomeContent(clientId, body),
    onSuccess: (data) => {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      qc.invalidateQueries({ queryKey: ['welcome-content', clientId] })
      // Update local state with saved data
      if (data) {
        setFormData({
          subtitle: data.subtitle || '',
          heading: data.heading || '',
          text: data.text || '',
          imageUrl: data.imageUrl || '',
          ctaText: data.ctaText || '',
          ctaUrl: data.ctaUrl || '',
          isExternal: data.isExternal || false,
          isActive: data.isActive !== false
        })
      }
    },
    onError: (error) => {
      console.error('Failed to save welcome content:', error)
    }
  })

  const handleSave = () => {
    mUpdate.mutate({
      subtitle: formData.subtitle || null,
      heading: formData.heading || null,
      text: formData.text || null,
      imageUrl: formData.imageUrl || null,
      ctaText: formData.ctaText || null,
      ctaUrl: formData.ctaUrl || null,
      isExternal: formData.isExternal || false,
      isActive: formData.isActive !== false
    })
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Welcome Content</h2>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: 13, color: C.t2 }}>
        Configure the welcome section that appears on the homepage after the banner carousel.
      </p>

      {/* Form */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <InputField
          label="Subtitle"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder="Est. 2010"
          hint="Small tag displayed above the heading"
        />

        <InputField
          label="Heading"
          value={formData.heading}
          onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          placeholder="Welcome to Savoria"
          required
        />

        <InputField
          label="Text Content"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="For over a decade, we've been dedicated to bringing you the finest culinary experiences..."
          multiline
          required
        />

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
          }}>Image</label>
          <ImageUpload
            clientId={clientId}
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>

        <InputField
          label="CTA Button Text"
          value={formData.ctaText}
          onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
          placeholder="Learn Our Story"
          hint="Leave empty to hide the button"
        />

        <InputField
          label="CTA Button URL"
          value={formData.ctaUrl}
          onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
          placeholder="/about or https://..."
          hint="Internal: /page-path | External: https://..."
        />

        <div style={{ marginTop: 12 }}>
          <ToggleSwitch
            checked={formData.isExternal || false}
            onChange={() => setFormData({ ...formData, isExternal: !formData.isExternal })}
            label="External link"
          />
        </div>

        <div style={{ padding: 16, background: C.card, borderRadius: 8, marginTop: 20 }}>
          <ToggleSwitch
            checked={formData.isActive !== false}
            onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
            label="Active"
          />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={mUpdate.isPending}
          style={{
            padding: '10px 24px', background: C.acc, border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: mUpdate.isPending ? 'not-allowed' : 'pointer',
            opacity: mUpdate.isPending ? 0.6 : 1
          }}
        >
          {mUpdate.isPending ? 'Saving...' : 'Save Changes'}
        </button>
        {mUpdate.isSuccess && (
          <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Saved</span>
        )}
      </div>
    </div>
  )
}
