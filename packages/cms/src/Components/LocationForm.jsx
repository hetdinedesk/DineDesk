import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Home, Phone, MapPinned, Settings, Utensils, Clock, Image, MapPinHouse } from 'lucide-react'
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/locations'
import ImageUpload from './ImageUpload'
import MultipleImageUpload from './MultipleImageUpload'
import LoadingSpinner from './LoadingSpinner'
import ConfirmationModal from './ConfirmationModal'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63', input:'#111827',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', green:'#22C55E', amber:'#F59E0B', red:'#EF4444'
}

const COUNTRIES = ['Australia', 'New Zealand', 'United States', 'United Kingdom']
const STATES = {
  'Australia': ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch']
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label, description, color = C.green }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 16px',
      background: C.panel,
      border: `1px solid ${C.border2}`,
      borderRadius: 10,
      cursor: 'pointer'
    }} onClick={() => onChange(!checked)}>
      <div style={{
        width: 44,
        height: 24,
        background: checked ? color : C.border,
        borderRadius: 12,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        marginTop: 2
      }}>
        <div style={{
          width: 20,
          height: 20,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: C.t1, fontWeight: 600 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{description}</div>
        )}
      </div>
    </div>
  )
}

// Section Header Component
function SectionHeader({ title, Icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
      paddingBottom: 12,
      borderBottom: `1px solid ${C.border}`
    }}>
      {Icon && <Icon size={18} style={{ color: C.t2 }} />}
      <span style={{ 
        fontSize: 14, 
        fontWeight: 700, 
        color: C.t2,
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>{title}</span>
    </div>
  )
}

// Form Field Components
function Label({ children, required }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: C.t3,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 6
    }}>
      {children}
      {required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder, required, error, type = 'text', maxLength, readOnly }) {
  return (
    <>
      <input
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        readOnly={readOnly}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: readOnly ? C.card : C.input,
          border: `1px solid ${error ? C.red : C.border}`,
          borderRadius: 8,
          color: readOnly ? C.t2 : C.t0,
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: readOnly ? 'not-allowed' : 'text'
        }}
      />
      {error && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{error}</div>}
    </>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: C.input,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        color: C.t0,
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        cursor: 'pointer'
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

export default function LocationForm({ 
  location = {}, 
  onSave, 
  onClose, 
  clientId,
  isEdit = false 
}) {
  const qc = useQueryClient()
  
  const initialForm = {
    name: '',
    displayName: '',
    address: '',
    suburb: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    phone: '',
    bookingPhone: '',
    deliveryPhone: '',
    formEmail: '',
    lat: '',
    lng: '',
    hours: {},
    exteriorImages: [],
    showInFooter: false,
    alternateStyling: false,
    galleryImages: [],
    isPrimary: false,
    deliveryZone: false,
    menuCategories: [],
    servicesAvailable: []
  }
  
  const [form, setForm] = useState(() => {
    // Handle backward compatibility for single exteriorImage
    const locationData = { ...location }
    if (location.exteriorImage && !location.exteriorImages) {
      locationData.exteriorImages = [location.exteriorImage]
    }
    
    return { ...initialForm, ...locationData }
  })

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])
  const [pendingImages, setPendingImages] = useState({
    exteriorImages: [],
    galleryImages: []
  })

  useEffect(() => {
    if (location.id && location.id !== form.id) {
      // Handle backward compatibility for single exteriorImage
      const locationData = { ...location }
      if (location.exteriorImage && !location.exteriorImages) {
        locationData.exteriorImages = [location.exteriorImage]
      }
      
      setForm({ ...initialForm, ...locationData })
      // Only select days that are NOT closed (i.e., have closed !== true)
      const openDays = Object.entries(location.hours || {})
        .filter(([day, data]) => data && data.closed !== true)
        .map(([day]) => day)
        .sort()
      setSelectedDays(openDays)
    }
  }, [location?.id])

  // Keep selectedDays in sync with form.hours - only include days that are NOT closed
  useEffect(() => {
    const openDays = Object.entries(form.hours || {})
      .filter(([day, data]) => data && data.closed !== true)
      .map(([day]) => day)
      .sort()
    const currentDays = [...selectedDays].sort()
    if (openDays.join(',') !== currentDays.join(',')) {
      setSelectedDays(openDays)
    }
  }, [form.hours])

  const validate = useCallback(() => {
    const e = {}
    if (!form.name?.trim()) e.name = 'Location name is required'
    if (!form.address?.trim()) e.address = 'Street address is required'
    if (!form.suburb?.trim()) e.suburb = 'Suburb is required'
    if (!form.city?.trim()) e.city = 'City is required'
    if (!form.phone?.trim()) e.phone = 'Phone number is required'
    if (form.formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.formEmail)) {
      e.formEmail = 'Please enter a valid email address'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const mutation = useMutation({
    mutationFn: data => {
      if (isEdit) {
        return updateLocation(clientId, location.id, data)
      } else {
        return createLocation(clientId, data)
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries(['locations', clientId])
      clearPendingImages()
      onSave?.(data)
      onClose()
    },
    onError: (err) => {
      console.error('Location save failed:', err)
      alert('Save failed: ' + (err.message || 'Unknown error'))
      setSaving(false)
    }
  })

  const handleSave = useCallback(() => {
    if (!validate()) return
    setSaving(true)
    
    // Include pending images in the save data
    const saveData = {
      ...form,
      ...(pendingImages.exteriorImages.length > 0 && { exteriorImages: pendingImages.exteriorImages }),
      ...(pendingImages.galleryImages.length > 0 && { galleryImages: pendingImages.galleryImages })
    }
    
    mutation.mutate(saveData)
  }, [validate, form, pendingImages, mutation])

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(clientId, location.id),
    onSuccess: () => {
      qc.invalidateQueries(['locations', clientId])
      onClose()
    }
  })

  const handleDelete = () => {
    setShowDeleteConfirm(false)
    deleteMutation.mutate()
  }

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prevErrors => ({ ...prevErrors, [key]: '' }))
    }
    // Remove automatic draft saving - only save when explicitly requested
  }, [errors])

  const setImageField = useCallback((key, value) => {
    setPendingImages(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearPendingImages = useCallback(() => {
    setPendingImages({ exteriorImages: [], galleryImages: [] })
  }, [])

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const isCurrentlySelected = prev.includes(day)
      const newSelectedDays = isCurrentlySelected
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
      
      // When unchecking a day, mark as closed: true (don't remove from hours)
      // When checking a day, mark as closed: false
      setForm(prevForm => {
        const existingHours = prevForm.hours?.[day] || {}
        return {
          ...prevForm,
          hours: {
            ...prevForm.hours,
            [day]: {
              ...existingHours,
              closed: isCurrentlySelected // true if unchecking, false if checking
            }
          }
        }
      })
      
      return newSelectedDays
    })
  }

  const updateHour = (day, type, value) => {
    // Only allow numeric input and limit to 4 characters (HHMM)
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    
    setForm(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [type]: numericValue
        }
      }
    }))
    // Remove automatic draft saving
  }

  const hasPendingImages = pendingImages.exteriorImages.length > 0 || pendingImages.galleryImages.length > 0
  const hasCoordinates = form.lat && form.lng
  
  // Check if form has been modified from original location data
  const hasFormChanges = useCallback(() => {
    if (!isEdit) return false // New locations don't have original data to compare
    
    const originalFields = ['name', 'displayName', 'address', 'suburb', 'city', 'state', 
                           'postcode', 'country', 'phone', 'bookingPhone', 'deliveryPhone', 
                           'formEmail', 'showInFooter', 'alternateStyling', 'isPrimary', 
                           'deliveryZone', 'menuCategories', 'servicesAvailable']
    
    // Check basic fields
    for (const field of originalFields) {
      if (form[field] !== location[field]) return true
    }
    
    // Check hours
    const formHoursKeys = Object.keys(form.hours || {}).sort()
    const locationHoursKeys = Object.keys(location.hours || {}).sort()
    if (formHoursKeys.join(',') !== locationHoursKeys.join(',')) return true
    
    for (const day of formHoursKeys) {
      if (form.hours[day]?.open !== location.hours[day]?.open ||
          form.hours[day]?.close !== location.hours[day]?.close) {
        return true
      }
    }
    
    return false
  }, [form, location, isEdit])

  const hasUnsavedChanges = hasFormChanges() || hasPendingImages

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        clearPendingImages()
        onClose()
      }
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, clearPendingImages, onClose])

  return (
    <div style={{ maxWidth: 800, width: '100%' }}>
      
      {/* Section 1: Basic Info */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <SectionHeader title="Basic Information" Icon={MapPin} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <Label required>Location Name</Label>
            <Input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g., Urban Eats CBD"
              error={errors.name}
            />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input
              value={form.displayName}
              onChange={e => setField('displayName', e.target.value)}
              placeholder="e.g., Downtown Location (optional)"
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <MultipleImageUpload
            clientId={clientId}
            label="Exterior Photos"
            hint="Restaurant exterior - first image will be primary. Add multiple angles and views."
            value={pendingImages.exteriorImages.length > 0 ? pendingImages.exteriorImages : (form.exteriorImages || [])}
            onChange={v => setImageField('exteriorImages', v)}
            aspect={16/9}
            maxImages={8}
          />
          {pendingImages.exteriorImages.length > 0 && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: `${C.acc}15`,
              border: `1px solid ${C.acc}`,
              borderRadius: 6,
              fontSize: 12,
              color: C.acc
            }}>
              ⚠️ {pendingImages.exteriorImages.length} new image{pendingImages.exteriorImages.length === 1 ? '' : 's'} uploaded - click "Update Location" to save
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Address */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <SectionHeader title="Address" Icon={Home} />
        
        <div style={{ marginBottom: 16 }}>
          <Label required>Street Address</Label>
          <Input
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            placeholder="e.g., 123 Bourke Street"
            error={errors.address}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <Label required>Suburb</Label>
            <Input
              value={form.suburb}
              onChange={e => setField('suburb', e.target.value)}
              placeholder="e.g., Melbourne CBD"
              error={errors.suburb}
            />
          </div>
          <div>
            <Label required>City</Label>
            <Input
              value={form.city}
              onChange={e => setField('city', e.target.value)}
              placeholder="e.g., Melbourne"
              error={errors.city}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <div>
            <Label>State</Label>
            <Select
              value={form.state}
              onChange={e => setField('state', e.target.value)}
              options={STATES[form.country] || []}
              placeholder="Select..."
            />
          </div>
          <div>
            <Label>Postcode</Label>
            <Input
              value={form.postcode}
              onChange={e => setField('postcode', e.target.value)}
              placeholder="3000"
              maxLength={10}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <Label>Country</Label>
            <Select
              value={form.country}
              onChange={e => setField('country', e.target.value)}
              options={COUNTRIES}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Contact Information */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <SectionHeader title="Contact Information" Icon={Phone} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label required>Phone</Label>
            <Input
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+61 3 1234 5678"
              error={errors.phone}
            />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={form.formEmail}
              onChange={e => setField('formEmail', e.target.value)}
              placeholder="contact@restaurant.com"
              error={errors.formEmail}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Map Coordinates (Auto-generated) */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <SectionHeader title="Map Coordinates" Icon={MapPinned} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          padding: '12px 16px',
          background: hasCoordinates ? `${C.green}15` : `${C.amber}15`,
          border: `1px solid ${hasCoordinates ? C.green : C.amber}`,
          borderRadius: 8
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: hasCoordinates ? C.green : C.amber
          }} />
          <span style={{ fontSize: 13, color: C.t1 }}>
            {hasCoordinates 
              ? 'Coordinates automatically generated from address'
              : 'Coordinates will be generated when you save'
            }
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Latitude</Label>
            <Input
              value={form.lat}
              readOnly
              placeholder="Auto-generated"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input
              value={form.lng}
              readOnly
              placeholder="Auto-generated"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Operating Hours */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${C.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.t2,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>Operating Hours</span>
          </div>
          <button
            onClick={() => {
              setSelectedDays([])
              setForm(prev => ({ ...prev, hours: {} }))
            }}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              color: C.t2,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {DAYS.map(day => {
            const isOpen = selectedDays.includes(day)
            const dayHours = form.hours?.[day] || {}
            
            return (
              <div key={day} style={{
                textAlign: 'center',
                padding: '12px 8px',
                background: isOpen ? `${C.green}10` : C.panel,
                border: `1px solid ${isOpen ? C.green : C.border}`,
                borderRadius: 10,
                transition: 'all 0.2s'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  color: isOpen ? C.green : C.t2,
                  fontWeight: 700,
                  marginBottom: 10,
                  cursor: 'pointer'
                }} onClick={() => toggleDay(day)}>
                  {day}
                </label>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  marginBottom: isOpen ? 10 : 0
                }}>
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={() => toggleDay(day)}
                    style={{ accentColor: C.green, width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 12, color: C.t1 }}>{isOpen ? 'Open' : 'Closed'}</span>
                </label>
                
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      value={dayHours.open || ''}
                      onChange={e => updateHour(day, 'open', e.target.value)}
                      placeholder="0900"
                      style={{
                        width: '100%',
                        padding: '6px 4px',
                        background: C.input,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.t0,
                        fontSize: 12,
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ color: C.t3, fontSize: 10 }}>to</span>
                    <input
                      value={dayHours.close || ''}
                      onChange={e => updateHour(day, 'close', e.target.value)}
                      placeholder="1700"
                      style={{
                        width: '100%',
                        padding: '6px 4px',
                        background: C.input,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.t0,
                        fontSize: 12,
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div style={{ fontSize: 11, color: C.t3, marginTop: 12, textAlign: 'center' }}>
          Enter times in 24-hour format (e.g., 0900 for 9:00 AM, 1730 for 5:30 PM)
        </div>
      </div>

      {/* Section 6: Display Settings */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <SectionHeader title="Display Settings" Icon={Settings} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ToggleSwitch
            checked={form.isPrimary}
            onChange={v => setField('isPrimary', v)}
            label="Primary Location"
            description="Show this location in header CTAs and as main contact"
            color={C.green}
          />
          
          <ToggleSwitch
            checked={form.showInFooter}
            onChange={v => setField('showInFooter', v)}
            label="Show in Footer"
            description="Display this location in the website footer"
            color={C.amber}
          />

          {/* Services Available Multi-Select */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 8, display: 'block' }}>
              Services Available
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Dine-In', 'Takeout', 'Delivery'].map(service => (
                <button
                  key={service}
                  type="button"
                  onClick={() => {
                    const current = form.servicesAvailable || []
                    const updated = current.includes(service)
                      ? current.filter(s => s !== service)
                      : [...current, service]
                    setField('servicesAvailable', updated)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    background: (form.servicesAvailable || []).includes(service) 
                      ? C.green + '30' : C.border,
                    color: (form.servicesAvailable || []).includes(service) 
                      ? C.green : C.t2,
                    boxShadow: (form.servicesAvailable || []).includes(service)
                      ? `0 0 0 2px ${C.green}` : 'none'
                  }}
                >
                  {service}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.t3, marginTop: 8, marginBottom: 0 }}>
              Select which services are available at this location
            </p>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
        paddingTop: 24,
        borderTop: `1px solid ${C.border}`
      }}>
        {isEdit && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: `1px solid ${C.red}40`,
              borderRadius: 8,
              color: C.red,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
            disabled={saving}
          >
            Delete Location
          </button>
        )}
        <button
          onClick={handleClose}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `1px solid ${C.border2}`,
            borderRadius: 8,
            color: C.t2,
            fontWeight: 500,
            fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit'
          }}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            background: saving ? C.card : (hasUnsavedChanges ? C.green : C.acc),
            border: `1px solid ${saving ? C.border2 : (hasUnsavedChanges ? C.green : C.acc)}`,
            borderRadius: 8,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: saving ? 'none' : `0 4px 16px ${hasUnsavedChanges ? C.green : C.acc}40`,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {saving && <LoadingSpinner size={16} color="#fff" />}
          {saving ? 'Saving...' : (isEdit ? `${hasUnsavedChanges ? '✓ ' : ''}Update Location` : 'Create Location')}
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Location"
          message={`Permanently delete "${form.name}"? This cannot be undone.`}
          variant="danger"
          confirmText="Delete"
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
