import { useState, useEffect, useMemo, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import LoadingSpinner from '../Components/LoadingSpinner'
import { getHomeSections, saveHomeSections } from '../api/homepage.js'
import { C } from '../theme'

const ToggleSwitch = memo(({ checked, onChange, size = 'small', label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`
    }}
  >
    <div style={{
      width: size === 'small' ? 36 : 44, height: size === 'small' ? 20 : 24,
      borderRadius: size === 'small' ? 10 : 12, background: checked ? C.green : C.border,
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: size === 'small' ? 14 : 18, height: size === 'small' ? 14 : 18, borderRadius: '50%',
        background: '#fff', position: 'absolute', top: 3,
        left: checked ? (size === 'small' ? 19 : 23) : 3, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
    {label && <span style={{ fontSize: 13, color: C.t1 }}>{label}</span>}
  </div>
))

const SectionHeader = memo(({ title, icon, onAdd, addLabel = 'Add' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
    </div>
    {onAdd && (
      <button onClick={onAdd} style={{
        padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6,
        color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
      }}>+ {addLabel}</button>
    )}
  </div>
))

const SortableItem = memo(({ id, children, onEdit, onDelete, onToggle, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, display: 'inline-flex', flexDirection: 'column', gap: 2, marginRight: 8 }}>
        {[0,1,2].map(i => <span key={i} style={{ display:'block', width:14, height:1.5, background:C.t3, borderRadius:1 }}/>)}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <ToggleSwitch checked={isActive} onChange={onToggle} size="small" />
      <button onClick={onEdit} style={{ padding: '6px 12px', background: C.cyan, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
      <button onClick={onDelete} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${C.red}40`, borderRadius: 6, color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
    </div>
  )
})

export default function TeamSection({ clientId }) {
  const qc = useQueryClient()
  const { data: sections, isLoading } = useQuery({
    queryKey: ['homepage', clientId],
    queryFn: () => getHomeSections(clientId)
  })

  const teamMembers = useMemo(() => sections?.filter(s => s.type === 'about') || [], [sections])

  const saveTeam = useMutation({
    mutationFn: (data) => saveHomeSections(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries(['homepage', clientId])
      alert('Team saved successfully!')
    }
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const handleAdd = () => {
    setEditingMember({
      id: `temp-${Date.now()}`,
      type: 'about',
      title: '', // Name
      content: '', // Position/Role
      imageUrl: '',
      isActive: true
    })
    setModalOpen(true)
  }

  const handleEdit = (member) => {
    setEditingMember({ ...member })
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Remove this team member?')) return
    const updated = sections.filter(s => s.id !== id)
    saveTeam.mutate(updated)
  }

  const handleToggle = (id) => {
    const updated = sections.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    saveTeam.mutate(updated)
  }

  const handleSaveMember = (member) => {
    if (!member.title.trim()) return alert('Name is required')
    
    let updated
    const exists = sections.find(s => s.id === member.id)
    if (exists) {
      updated = sections.map(s => s.id === member.id ? member : s)
    } else {
      updated = [...sections, member]
    }
    saveTeam.mutate(updated)
    setModalOpen(false)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: 800 }}>
      <SectionHeader title="Meet the Team" icon="👥" onAdd={handleAdd} addLabel="Add Member" />
      <p style={{ fontSize: 13, color: C.t2, marginBottom: 20 }}>
        Manage your team members here. This replaces the &ldquo;Our Story&rdquo; section in the theme.
      </p>

      {teamMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          No team members added yet.
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return
          const oldIndex = sections.findIndex(s => s.id === active.id)
          const newIndex = sections.findIndex(s => s.id === over.id)
          saveTeam.mutate(arrayMove(sections, oldIndex, newIndex))
        }}>
          <SortableContext items={teamMembers.map(m => m.id)} strategy={verticalListSortingStrategy}>
            {teamMembers.map(member => (
              <SortableItem
                key={member.id}
                id={member.id}
                isActive={member.isActive}
                onToggle={() => handleToggle(member.id)}
                onEdit={() => handleEdit(member)}
                onDelete={() => handleDelete(member.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={member.imageUrl || 'https://via.placeholder.com/40'} style={{ width: 40, height: 40, borderRadius: '50%', objectCover: 'cover', background: C.card }} />
                  <div>
                    <div style={{ fontWeight: 600, color: member.isActive ? C.t0 : C.t3 }}>{member.title}</div>
                    <div style={{ fontSize: 12, color: C.t2 }}>{member.content}</div>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      )}

      {modalOpen && (
        <TeamMemberModal
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function TeamMemberModal({ member, onSave, onClose }) {
  const [form, setForm] = useState(member)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 480 }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, color: C.t0, fontSize: 18 }}>{member?.id.startsWith('temp') ? 'Add' : 'Edit'} Team Member</h3>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Name *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="e.g. Alex Rivera" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Position / Role</label>
            <input value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={inputStyle} placeholder="e.g. Executive Chef" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Image URL</label>
            <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: C.card, borderRadius: 8 }}>
            <ToggleSwitch checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
            <span style={{ color: C.t1, fontSize: 13 }}>{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div style={{ padding: 24, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save Member</button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t0, fontSize: 14, boxSizing: 'border-box', outline: 'none' }
const btnCancel = { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, color: C.t2, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
const btnSave = { padding: '10px 24px', background: C.green, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
