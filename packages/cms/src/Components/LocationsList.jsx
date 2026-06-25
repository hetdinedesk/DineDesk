import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Star } from 'lucide-react'
import { getLocations, updateLocation, deleteLocation } from '../api/locations'
import { C } from '../theme'
import LocationForm from './LocationForm'

// Button styles
const btnBase = { padding:'6px 12px', border:'none', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'all 0.15s', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }
const btnCyan = { ...btnBase, background:C.acc+'18', color:C.acc, border:`1px solid ${C.acc}35` }
const btnDanger = { ...btnBase, background:C.red+'14', color:C.red, border:`1px solid ${C.red}35` }
const btnGhost = { ...btnBase, background:'transparent', color:C.t2, border:`1px solid ${C.border}` }

// Small toggle switch component
function SmallToggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? C.green : C.border,
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  )
}

export default function LocationsList({ clientId }) {
  const qc = useQueryClient()
  const { data: rawLocations = [] } = useQuery({ queryKey: ['locations', clientId], queryFn: () => getLocations(clientId), enabled: !!clientId, staleTime: Infinity })

  // Sort locations by name to maintain stable order
  const locations = useMemo(() => {
    return [...rawLocations].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [rawLocations])
  const [editModal, setEditModal] = useState(false)
  const [editLocation, setEditLocation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const del = useMutation({
    mutationFn:id=>deleteLocation(clientId,id),
    onSuccess:()=>qc.invalidateQueries(['locations',clientId])
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => updateLocation(clientId, id, { isActive }),
    onSuccess: () => qc.invalidateQueries(['locations', clientId])
  })

  const handleAdd = () => {
    setEditLocation({})
    setEditModal(true)
  }

  const handleEdit = (row) => {
    setEditLocation(row)
    setEditModal(true)
  }

  const handleDeleteClick = (loc) => {
    setDeleteConfirm(loc)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      del.mutate(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleFormClose = () => {
    setEditModal(false)
    setEditLocation(null)
  }

  const handleFormSave = () => {
    qc.invalidateQueries(['locations',clientId])
    handleFormClose()
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.t0 }}>Locations ({locations.length})</h2>
        <button onClick={handleAdd} style={{ ...btnCyan, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14 }}>+</span> Add Location
        </button>
      </div>

      {/* Location List */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {locations.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:C.t3, background:C.card, border:`1px dashed ${C.border}`, borderRadius:12 }}>
            No locations yet — click <strong style={{ color:C.acc }}>Add Location</strong> to get started.
          </div>
        ) : (
          locations.map(loc => (
            <div
              key={loc.id}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'12px 14px', background:C.card,
                border:`1px solid ${C.border}`, borderRadius:10,
                transition:'all 0.15s'
              }}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:loc.isActive!==false ? C.t0 : C.t3, fontSize:14 }}>
                  {loc.name}
                  {loc.isPrimary && <Star size={14} style={{ color:C.acc, marginLeft:8, verticalAlign:'middle' }} />}
                </div>
                <div style={{ fontSize:12, color:C.t2, marginTop:4 }}>
                  {loc.address || 'No address'} · {loc.phone || 'No phone'}
                  {loc.showInFooter && <span style={{ color:C.green, marginLeft:8 }}>· Footer</span>}
                </div>
              </div>

              {/* Active Toggle */}
              <SmallToggle
                checked={loc.isActive!==false}
                onChange={() => !toggleActive.isPending && toggleActive.mutate({ id: loc.id, isActive: loc.isActive===false })}
              />

              {/* Edit Button */}
              <button onClick={() => handleEdit(loc)} style={btnCyan}>Edit</button>

              {/* Delete Button */}
              <button onClick={() => handleDeleteClick(loc)} style={btnDanger}>Delete</button>
            </div>
          ))
        )}
      </div>
      {editModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, maxWidth:'90vw', maxHeight:'90vh', overflow:'auto' }}>
            <LocationForm
              key={editLocation?.id || 'new-location'}
              location={editLocation}
              isEdit={!!editLocation.id}
              clientId={clientId}
              onSave={handleFormSave}
              onClose={handleFormClose}
            />

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, maxWidth:400, width:'100%', padding:24 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:C.t0 }}>Delete Location</h3>
            <p style={{ margin:'0 0 20px', fontSize:14, color:C.t2 }}>
              Permanently delete "{deleteConfirm.name}"? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ ...btnGhost, padding:'8px 16px' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ ...btnDanger, padding:'8px 16px' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
