import { useState, useMemo, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Users, Building2 } from 'lucide-react'
import LoadingSpinner from '../Components/LoadingSpinner'
import ImageUpload from '../Components/ImageUpload'
import { getHomeSections, createHomeSection, updateHomeSection, deleteHomeSection, getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/homepage.js'
import { C } from '../theme'

const ToggleSwitch = memo(({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? C.green : C.border, position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer' }}>
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
))

const SortableItem = memo(({ id, children, onEdit, onDelete, onToggle, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', color: C.t3, display: 'inline-flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
        {[0,1,2].map(i => <span key={i} style={{ display:'block', width:14, height:1.5, background:C.t3, borderRadius:1 }}/>)}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <ToggleSwitch checked={isActive} onChange={onToggle} />
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

  const teamMembers = useMemo(() =>
    sections?.filter(s => s.type === 'about' || s.type === 'team') || []
  , [sections])

  // ── Member mutations (all individual — never bulk) ──────────────

  const saveMember = useMutation({
    mutationFn: (member) => {
      if (member.id?.startsWith('temp')) {
        return createHomeSection(clientId, member)
      }
      return updateHomeSection(clientId, member.id, member)
    },
    onSuccess: () => qc.invalidateQueries(['homepage', clientId]),
    onError: (err) => alert('Failed to save: ' + (err.response?.data?.error || err.message))
  })

  const deleteMember = useMutation({
    mutationFn: (id) => deleteHomeSection(clientId, id),
    onSuccess: () => qc.invalidateQueries(['homepage', clientId]),
    onError: (err) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
  })

  const reorderMembers = useMutation({
    mutationFn: async (reordered) => {
      for (let i = 0; i < reordered.length; i++) {
        await updateHomeSection(clientId, reordered[i].id, { sortOrder: i })
      }
    },
    onSuccess: () => qc.invalidateQueries(['homepage', clientId])
  })

  // ── Department mutations ────────────────────────────────────────

  const saveDepartment = useMutation({
    mutationFn: (dept) => {
      if (dept.id?.startsWith('temp')) {
        return createDepartment(clientId, { name: dept.name, isActive: dept.isActive, sortOrder: dept.sortOrder || 0 })
      }
      return updateDepartment(clientId, dept.id, { name: dept.name, isActive: dept.isActive, sortOrder: dept.sortOrder })
    },
    onSuccess: () => qc.invalidateQueries(['departments', clientId]),
    onError: (err) => alert('Failed to save department: ' + (err.message || 'Unknown error'))
  })

  const removeDepartment = useMutation({
    mutationFn: (deptId) => deleteDepartment(clientId, deptId),
    onSuccess: () => qc.invalidateQueries(['departments', clientId])
  })

  // ── Modal state ─────────────────────────────────────────────────

  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)

  // ── Handlers ────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingMember({ id: `temp-${Date.now()}`, type: 'about', title: '', content: { role: '', bio: '', specialty: '' }, departmentIds: [], imageUrl: '', isActive: true, sortOrder: teamMembers.length })
    setModalOpen(true)
  }

  const handleEdit = (member) => {
    let content = member.content
    if (typeof content === 'string') {
      try { content = JSON.parse(content) } catch { content = { role: content, bio: '', specialty: '' } }
    }
    setEditingMember({ ...member, content: content || { role: '', bio: '', specialty: '' }, departmentIds: member.departmentIds || [] })
    setModalOpen(true)
  }

  const handleSaveMember = (member) => {
    if (!member.title.trim()) return alert('Name is required')
    saveMember.mutate(member)
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Remove this team member?')) return
    deleteMember.mutate(id)
  }

  const handleToggle = (member) => {
    saveMember.mutate({ ...member, isActive: !member.isActive })
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = teamMembers.findIndex(m => m.id === active.id)
    const newIndex = teamMembers.findIndex(m => m.id === over.id)
    reorderMembers.mutate(arrayMove(teamMembers, oldIndex, newIndex))
  }

  const handleAddDept = () => {
    setEditingDept({ id: `temp-${Date.now()}`, name: '', isActive: true, sortOrder: departments?.length || 0 })
    setDeptModalOpen(true)
  }

  const handleSaveDept = (dept) => {
    if (!dept.name.trim()) return alert('Department name is required')
    saveDepartment.mutate(dept)
    setDeptModalOpen(false)
  }

  const handleDeleteDept = (id) => {
    if (!window.confirm('Delete this department?')) return
    removeDepartment.mutate(id)
  }

  const handleToggleDept = (dept) => {
    saveDepartment.mutate({ ...dept, isActive: !dept.isActive })
  }

  // ── Render ──────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner />

  if (subsection === 'team-members') {
    return (
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: C.t2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Team Members</span>
            {teamMembers.length > 0 && <span style={{ fontSize: 11, color: C.t3, background: C.card, padding: '2px 8px', borderRadius: 99, border: `1px solid ${C.border}` }}>{teamMembers.length}</span>}
          </div>
          <button onClick={handleAdd} style={{ padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Member</button>
        </div>

        {teamMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No team members yet. Click &quot;+ Add Member&quot; to get started.
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={teamMembers.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {teamMembers.map(member => {
                const role = typeof member.content === 'object' ? member.content?.role : member.content
                return (
                  <SortableItem key={member.id} id={member.id} isActive={member.isActive} onToggle={() => handleToggle(member)} onEdit={() => handleEdit(member)} onDelete={() => handleDelete(member.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {member.imageUrl
                        ? <img src={member.imageUrl} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: C.t3 }}>{member.title?.charAt(0)?.toUpperCase() || '?'}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 600, color: member.isActive ? C.t0 : C.t3 }}>{member.title}</div>
                        {role && <div style={{ fontSize: 12, color: C.t2 }}>{role}</div>}
                      </div>
                    </div>
                  </SortableItem>
                )
              })}
            </SortableContext>
          </DndContext>
        )}

        {modalOpen && editingMember && (
          <TeamMemberModal member={editingMember} departments={departments || []} clientId={clientId} onSave={handleSaveMember} onClose={() => setModalOpen(false)} />
        )}
      </div>
    )
  }

  if (subsection === 'departments') {
    return (
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} style={{ color: C.t2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Departments</span>
          </div>
          <button onClick={handleAddDept} style={{ padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Department</button>
        </div>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 20 }}>Departments group your team members on the site. Assign members to departments in the member edit form.</p>

        {(!departments || departments.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No departments yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.map(dept => (
              <div key={dept.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, fontWeight: 600, color: dept.isActive ? C.t0 : C.t3 }}>{dept.name}</div>
                <ToggleSwitch checked={dept.isActive !== false} onChange={() => handleToggleDept(dept)} />
                <button onClick={() => { setEditingDept({ ...dept }); setDeptModalOpen(true) }} style={{ padding: '6px 12px', background: C.cyan, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => handleDeleteDept(dept.id)} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${C.red}40`, borderRadius: 6, color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {deptModalOpen && editingDept && (
          <DepartmentModal department={editingDept} onSave={handleSaveDept} onClose={() => setDeptModalOpen(false)} />
        )}
      </div>
    )
  }

  return <div style={{ color: C.t2 }}>Select a subsection from the sidebar.</div>
}

function TeamMemberModal({ member, departments, clientId, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    let content = member.content
    if (typeof content === 'string') {
      try { content = JSON.parse(content) } catch { content = { role: content, bio: '', specialty: '' } }
    }
    return { ...member, content: content || { role: '', bio: '', specialty: '' } }
  })

  const content = form.content || { role: '', bio: '', specialty: '' }

  const setContent = (field, value) => setForm(f => ({ ...f, content: { ...f.content, [field]: value } }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, color: C.t0, fontSize: 18 }}>{member.id?.startsWith('temp') ? 'Add' : 'Edit'} Team Member</h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name *">
            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="e.g. Alex Rivera" />
          </Field>
          <Field label="Role / Position">
            <input value={content.role || ''} onChange={e => setContent('role', e.target.value)} style={inputStyle} placeholder="e.g. Executive Chef" />
          </Field>
          <Field label="Specialty">
            <input value={content.specialty || ''} onChange={e => setContent('specialty', e.target.value)} style={inputStyle} placeholder="e.g. Italian Cuisine" />
          </Field>
          <Field label="Bio">
            <textarea value={content.bio || ''} onChange={e => setContent('bio', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Brief bio..." />
          </Field>
          {departments.length > 0 && (
            <Field label="Departments">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {departments.map(dept => (
                  <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.t0 }}>
                    <input type="checkbox" checked={form.departmentIds?.includes(dept.id) || false} onChange={e => {
                      const ids = form.departmentIds || []
                      setForm(f => ({ ...f, departmentIds: e.target.checked ? [...ids, dept.id] : ids.filter(id => id !== dept.id) }))
                    }} />
                    {dept.name}
                  </label>
                ))}
              </div>
            </Field>
          )}
          <Field label="Photo">
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} clientId={clientId} />
          </Field>
        </div>
        <div style={{ padding: 24, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save</button>
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
          <Field label="Department Name *">
            <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Kitchen Staff" />
          </Field>
        </div>
        <div style={{ padding: 24, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.t0, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }
const btnCancel = { padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 8, color: C.t2, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }
const btnSave = { padding: '10px 24px', background: C.green, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
