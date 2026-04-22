import { useState, useEffect, useMemo, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Users, Building2 } from 'lucide-react'
import LoadingSpinner from '../Components/LoadingSpinner'
import ImageUpload from '../Components/ImageUpload'
import { getHomeSections, saveHomeSections, getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/homepage.js'
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

const SectionHeader = memo(({ title, Icon, onAdd, addLabel = 'Add' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {Icon && <Icon size={16} style={{ color: C.t2 }} />}
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

export default function TeamSection({ clientId, subsection = 'team-members' }) {
  const qc = useQueryClient()
  
  const { data: sections, isLoading } = useQuery({
    queryKey: ['homepage', clientId],
    queryFn: () => getHomeSections(clientId)
  })

  const { data: departments } = useQuery({
    queryKey: ['departments', clientId],
    queryFn: () => getDepartments(clientId)
  })

  const teamMembers = useMemo(() => sections?.filter(s => s.type === 'about') || [], [sections])

  const saveTeam = useMutation({
    mutationFn: (data) => saveHomeSections(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries(['homepage', clientId])
      alert('Team saved successfully!')
    }
  })

  const saveDepartment = useMutation({
    mutationFn: async (dept) => {
      if (dept.id?.startsWith('temp')) {
        return createDepartment(clientId, { name: dept.name, isActive: dept.isActive, sortOrder: dept.sortOrder || 0 })
      } else {
        return updateDepartment(clientId, dept.id, { name: dept.name, isActive: dept.isActive, sortOrder: dept.sortOrder })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['departments', clientId])
      alert('Department saved successfully!')
    },
    onError: (err) => {
      console.error('Save department error:', err)
      alert('Failed to save department: ' + (err.message || 'Unknown error'))
    }
  })

  const removeDepartment = useMutation({
    mutationFn: (deptId) => deleteDepartment(clientId, deptId),
    onSuccess: () => {
      qc.invalidateQueries(['departments', clientId])
    }
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)

  const handleAdd = () => {
    setEditingMember({
      id: `temp-${Date.now()}`,
      type: 'about',
      title: '', // Name
      content: '', // Position/Role
      departmentIds: [],
      imageUrl: '',
      isActive: true,
      sortOrder: 0
    })
    setModalOpen(true)
  }

  const handleEdit = (member) => {
    setEditingMember({ 
      ...member, 
      departmentIds: member.departmentIds || []
    })
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

  const handleAddDept = () => {
    setEditingDept({
      id: `temp-${Date.now()}`,
      name: '',
      isActive: true,
      sortOrder: (departments?.length || 0)
    })
    setDeptModalOpen(true)
  }

  const handleEditDept = (dept) => {
    setEditingDept({ ...dept })
    setDeptModalOpen(true)
  }

  const handleDeleteDept = (id) => {
    if (!window.confirm('Delete this department?')) return
    removeDepartment.mutate(id)
  }

  const handleSaveDept = (dept) => {
    if (!dept.name.trim()) return alert('Department name is required')
    saveDepartment.mutate(dept)
    setDeptModalOpen(false)
  }

  const handleToggleDept = (id) => {
    const dept = departments.find(d => d.id === id)
    if (dept) saveDepartment.mutate({ ...dept, isActive: !dept.isActive })
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

  // Render team members
  if (subsection === 'team-members') {
    return (
      <div style={{ maxWidth: 800 }}>
        <SectionHeader title="Team Members" Icon={Users} onAdd={handleAdd} addLabel="Add Member" />
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
                    {member.imageUrl ? (
                      <img src={member.imageUrl} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: C.card }} />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: C.card, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: C.t3,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${C.border}`
                      }}>
                        {member.title ? member.title.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
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
            departments={departments || []}
            clientId={clientId}
            onSave={handleSaveMember}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    )
  }

  // Render departments
  if (subsection === 'departments') {
    return (
      <div style={{ maxWidth: 800 }}>
        <SectionHeader title="Departments" Icon={Building2} onAdd={handleAddDept} addLabel="Add Department" />
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 20 }}>
          Create departments to organize your team members. Members can be assigned to departments in their edit form.
        </p>

        {(!departments || departments.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No departments added yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.map(dept => (
              <SortableItem
                key={dept.id}
                id={dept.id}
                isActive={dept.isActive}
                onToggle={() => handleToggleDept(dept.id)}
                onEdit={() => handleEditDept(dept)}
                onDelete={() => handleDeleteDept(dept.id)}
              >
                <div style={{ fontWeight: 600, color: dept.isActive ? C.t0 : C.t3 }}>{dept.name}</div>
              </SortableItem>
            ))}
          </div>
        )}

        {deptModalOpen && (
          <DepartmentModal
            department={editingDept}
            onSave={handleSaveDept}
            onClose={() => setDeptModalOpen(false)}
          />
        )}
      </div>
    )
  }

  return <div style={{ color: C.t2 }}>Select a subsection from the sidebar.</div>
}

function TeamMemberModal({ member, departments, clientId, onSave, onClose }) {
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Departments</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {departments.filter(d => d.isActive !== false).map(dept => (
                <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.departmentIds?.includes(dept.id) || false}
                    onChange={(e) => {
                      const current = form.departmentIds || []
                      if (e.target.checked) {
                        setForm({ ...form, departmentIds: [...current, dept.id] })
                      } else {
                        setForm({ ...form, departmentIds: current.filter(id => id !== dept.id) })
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: C.t0 }}>{dept.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Image</label>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              clientId={clientId}
            />
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

function DepartmentModal({ department, onSave, onClose }) {
  const [form, setForm] = useState(department)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 420 }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, color: C.t0, fontSize: 18 }}>{department?.id?.startsWith('temp') ? 'Add' : 'Edit'} Department</h3>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Department Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Kitchen Staff" />
          </div>
        </div>
        <div style={{ padding: 24, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save Department</button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t0, fontSize: 14, boxSizing: 'border-box', outline: 'none' }
const btnCancel = { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, color: C.t2, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
const btnSave = { padding: '10px 24px', background: C.green, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
